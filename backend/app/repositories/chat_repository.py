from typing import Optional, List
from ..extensions import db
from ..models.chat_history import ChatHistory


class ChatRepository:
    def create(self, session_id: int, role: str, content: str, media_url: Optional[str] = None) -> ChatHistory:
        entry = ChatHistory(
            session_id=session_id,
            role=role,
            content=content,
            media_url=media_url,
        )
        db.session.add(entry)
        db.session.commit()
        return entry

    def find_by_session_id(self, session_id: int) -> List[ChatHistory]:
        return db.session.execute(
            db.select(ChatHistory)
            .where(ChatHistory.session_id == session_id)
            .order_by(ChatHistory.created_at.asc())
        ).scalars().all()

    def count_by_session_id(self, session_id: int) -> int:
        return db.session.execute(
            db.select(db.func.count(ChatHistory.id))
            .where(ChatHistory.session_id == session_id)
        ).scalar_one()

    def delete_by_ids(self, ids: List[int]) -> None:
        db.session.execute(
            db.delete(ChatHistory).where(ChatHistory.id.in_(ids))
        )
        db.session.commit()

    def get_oldest_n(self, session_id: int, n: int) -> List[ChatHistory]:
        return db.session.execute(
            db.select(ChatHistory)
            .where(ChatHistory.session_id == session_id)
            .order_by(ChatHistory.created_at.asc())
            .limit(n)
        ).scalars().all()
