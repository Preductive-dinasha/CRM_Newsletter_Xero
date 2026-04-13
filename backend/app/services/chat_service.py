import logging
from typing import Optional, List
from ..models.chat_history import ChatHistory
from ..repositories.chat_repository import ChatRepository
from ..repositories.session_repository import SessionRepository
from .n8n_service import N8nService
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
        words = first_message.strip().split()[:6]
        return " ".join(words)[:255] or "New Chat"

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

        agent_lower = (agent or "").lower().strip().lstrip("@")

        if not agent_lower or agent_lower not in N8N_AGENTS:
            raise ChatError(
                "Please select an agent to continue — choose @CRM, @Newsletter, or @Xero."
            )

        history = self._history_as_list(session_id)

        from .n8n_service import N8nError as _N8nError
        try:
            result = self.n8n_service.send_to_agent(
                agent=agent_lower,
                user_id=user_id,
                session_id=session_id,
                message=message,
                history=history,
                file_url=file_url,
            )
        except _N8nError as e:
            raise ChatError(str(e))

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
        }
