import logging
from typing import Optional
from flask import current_app
from openai import OpenAI
from ..repositories.chat_repository import ChatRepository

logger = logging.getLogger(__name__)

SUMMARISE_THRESHOLD = 30
SUMMARISE_OLDEST_N = 20


class SummarisationService:
    def __init__(self, chat_repo: Optional[ChatRepository] = None) -> None:
        self.chat_repo = chat_repo or ChatRepository()

    def _get_openai_client(self) -> OpenAI:
        base_url = current_app.config.get("OPENAI_BASE_URL") or None
        api_key = current_app.config.get("OPENAI_API_KEY") or "no-key"
        return OpenAI(api_key=api_key, base_url=base_url or None)

    def maybe_summarise(self, session_id: int) -> bool:
        count = self.chat_repo.count_by_session_id(session_id)
        if count <= SUMMARISE_THRESHOLD:
            return False

        oldest = self.chat_repo.get_oldest_n(session_id, SUMMARISE_OLDEST_N)
        if not oldest:
            return False

        conversation_text = "\n".join(
            f"{msg.role.upper()}: {msg.content}" for msg in oldest
        )

        summary = self._call_llm_summarise(conversation_text)

        ids_to_delete = [msg.id for msg in oldest]
        self.chat_repo.delete_by_ids(ids_to_delete)
        self.chat_repo.create(
            session_id=session_id,
            role="agent",
            content=f"[Summary] {summary}",
        )
        logger.info(f"Summarised {len(oldest)} turns for session {session_id}")
        return True

    def _call_llm_summarise(self, conversation_text: str) -> str:
        client = self._get_openai_client()
        model = current_app.config.get("OPENAI_MODEL", "gpt-4o-mini")
        try:
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are a conversation summariser. "
                            "Compress the following conversation into a concise summary "
                            "that preserves all key facts, decisions, and context. "
                            "Write in third person. Be concise but complete."
                        ),
                    },
                    {
                        "role": "user",
                        "content": f"Summarise this conversation:\n\n{conversation_text}",
                    },
                ],
                max_tokens=500,
                temperature=0.3,
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"Summarisation LLM error: {e}")
            return f"Previous conversation summary unavailable. ({len(conversation_text)} chars compressed)"
