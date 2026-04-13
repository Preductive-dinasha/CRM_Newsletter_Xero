from typing import Optional, List
from ..models.session import Session
from ..repositories.session_repository import SessionRepository


class SessionError(Exception):
    pass


class SessionService:
    def __init__(self, session_repo: Optional[SessionRepository] = None) -> None:
        self.session_repo = session_repo or SessionRepository()

    def create_session(self, user_id: int, title: str = "New Chat") -> Session:
        return self.session_repo.create(user_id=user_id, title=title)

    def get_sessions(self, user_id: int) -> List[Session]:
        return self.session_repo.find_by_user_id(user_id)

    def get_session(self, session_id: int, user_id: int) -> Session:
        session = self.session_repo.find_by_id(session_id)
        if not session or session.user_id != user_id:
            raise SessionError("Session not found.")
        return session

    def update_title(self, session_id: int, title: str, user_id: int) -> Session:
        session = self.get_session(session_id, user_id)
        return self.session_repo.update_title(session, title[:255])

    def delete_session(self, session_id: int, user_id: int) -> None:
        session = self.get_session(session_id, user_id)
        self.session_repo.delete(session)
