import logging
from typing import Optional, List
from flask import current_app
from openai import OpenAI
from ..models.chat_history import ChatHistory
from ..repositories.chat_repository import ChatRepository
from ..repositories.session_repository import SessionRepository
from .n8n_service import N8nService, WebhookNotConfiguredError
from .summarisation_service import SummarisationService

logger = logging.getLogger(__name__)

N8N_AGENTS = {"crm", "newsletter", "xero"}


class ChatError(Exception):
    pass


class ChatService:
    def __init__(
        self,
        chat_repo: Optional[ChatRepository] = None,
        session_repo: Optional[SessionRepository] = None,
        n8n_service: Optional[N8nService] = None,
        summarisation_service: Optional[SummarisationService] = None,
    ) -> None:
        self.chat_repo = chat_repo or ChatRepository()
        self.session_repo = session_repo or SessionRepository()
        self.n8n_service = n8n_service or N8nService()
        self.summarisation_service = summarisation_service or SummarisationService(self.chat_repo)

    def _get_openai_client(self) -> OpenAI:
        base_url = current_app.config.get("OPENAI_BASE_URL") or None
        api_key = current_app.config.get("OPENAI_API_KEY") or "no-key"
        return OpenAI(api_key=api_key, base_url=base_url or None)

    def get_history(self, session_id: int) -> List[ChatHistory]:
        return self.chat_repo.find_by_session_id(session_id)

    def get_history_for_user(self, session_id: int, user_id: int) -> List[ChatHistory]:
        session = self.session_repo.find_by_id(session_id)
        if not session or session.user_id != user_id:
            raise ChatError("Session not found or access denied.")
        return self.chat_repo.find_by_session_id(session_id)

    def _history_as_list(self, session_id: int) -> list:
        history = self.chat_repo.find_by_session_id(session_id)
        return [{"role": h.role, "content": h.content} for h in history]

    def _generate_title(self, first_message: str) -> str:
        client = self._get_openai_client()
        model = current_app.config.get("OPENAI_MODEL", "gpt-4o-mini")
        try:
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "Generate a concise chat session title (maximum 6 words, no quotes, no punctuation at end) "
                            "that captures the topic of this user message."
                        ),
                    },
                    {"role": "user", "content": first_message},
                ],
                max_tokens=20,
                temperature=0.5,
            )
            return response.choices[0].message.content.strip()[:255]
        except Exception as e:
            logger.error(f"Title generation error: {e}")
            return first_message[:50]

    def _call_general_openai(self, message: str, history: list) -> dict:
        client = self._get_openai_client()
        model = current_app.config.get("OPENAI_MODEL", "gpt-4o-mini")
        messages = [
            {
                "role": "system",
                "content": "You are Preddi, a helpful AI assistant for Preductive. Answer clearly and concisely.",
            }
        ]
        for h in history:
            role = "assistant" if h["role"] == "agent" else "user"
            messages.append({"role": role, "content": h["content"]})
        messages.append({"role": "user", "content": message})

        try:
            response = client.chat.completions.create(
                model=model,
                messages=messages,
                max_tokens=1024,
                temperature=0.7,
            )
            return {
                "reply": response.choices[0].message.content.strip(),
                "media_url": None,
            }
        except Exception as e:
            logger.error(f"OpenAI general chat error: {e}")
            raise ChatError(f"AI service error: {e}")

    def send_message(
        self,
        user_id: int,
        session_id: int,
        message: str,
        agent: Optional[str] = None,
        file_url: Optional[str] = None,
    ) -> dict:
        session = self.session_repo.find_by_id(session_id)
        if not session or session.user_id != user_id:
            raise ChatError("Session not found.")

        is_first = self.chat_repo.count_by_session_id(session_id) == 0

        history = self._history_as_list(session_id)

        agent_lower = (agent or "").lower().strip()

        webhook_not_configured_msg = None
        if agent_lower and agent_lower in N8N_AGENTS:
            try:
                result = self.n8n_service.send_to_agent(
                    agent=agent_lower,
                    user_id=user_id,
                    session_id=session_id,
                    message=message,
                    history=history,
                    file_url=file_url,
                )
            except WebhookNotConfiguredError as e:
                webhook_not_configured_msg = str(e)
                result = {"reply": str(e), "media_url": None}
        else:
            result = self._call_general_openai(message, history)

        self.chat_repo.create(session_id=session_id, role="user", content=message)
        self.chat_repo.create(
            session_id=session_id,
            role="agent",
            content=result["reply"],
            media_url=result.get("media_url"),
        )

        if is_first:
            title = self._generate_title(message)
            self.session_repo.update_title(session, title)

        self.summarisation_service.maybe_summarise(session_id)

        return {
            "reply": result["reply"],
            "media_url": result.get("media_url"),
            "title": session.title,
            "webhook_not_configured": webhook_not_configured_msg is not None,
        }
