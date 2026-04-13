import logging
from typing import Optional
from ..repositories.chat_repository import ChatRepository

logger = logging.getLogger(__name__)

SUMMARISE_THRESHOLD = 30
SUMMARISE_OLDEST_N = 20


class SummarisationService:
    def __init__(self, chat_repo: Optional[ChatRepository] = None) -> None:
        self.chat_repo = chat_repo or ChatRepository()

    def maybe_summarise(self, session_id: int) -> bool:
        count = self.chat_repo.count_by_session_id(session_id)
        if count <= SUMMARISE_THRESHOLD:
            return False

        oldest = self.chat_repo.get_oldest_n(session_id, SUMMARISE_OLDEST_N)
        if not oldest:
            return False

        summary_lines = []
        for msg in oldest:
            prefix = "User" if msg.role == "user" else "Agent"
            snippet = msg.content[:120].replace("\n", " ")
            summary_lines.append(f"{prefix}: {snippet}")
        summary = " | ".join(summary_lines)

        ids_to_delete = [msg.id for msg in oldest]
        self.chat_repo.delete_by_ids(ids_to_delete)
        self.chat_repo.create(
            session_id=session_id,
            role="agent",
            content=f"[Conversation summary] {summary}",
        )
        logger.info(f"Summarised {len(oldest)} turns for session {session_id}")
        return True
