from typing import Optional, List
from ..extensions import db
from ..models.session import Session


class SessionRepository:
    def create(self, user_id: int, title: str = "New Chat") -> Session:
        session = Session(user_id=user_id, title=title)
        db.session.add(session)
        db.session.commit()
        return session

    def find_by_id(self, session_id: int) -> Optional[Session]:
        return db.session.get(Session, session_id)

    def find_by_user_id(self, user_id: int) -> List[Session]:
        return db.session.execute(
            db.select(Session)
            .where(Session.user_id == user_id)
            .order_by(Session.created_at.desc())
        ).scalars().all()

    def update_title(self, session: Session, title: str) -> Session:
        session.title = title
        db.session.commit()
        return session

    def delete(self, session: Session) -> None:
        db.session.delete(session)
        db.session.commit()
