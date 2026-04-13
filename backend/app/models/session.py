from datetime import datetime, timezone
from ..extensions import db


class Session(db.Model):
    __tablename__ = "sessions"

    session_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    title = db.Column(db.String(255), default="New Chat")
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user = db.relationship("User", back_populates="sessions")
    messages = db.relationship("ChatHistory", back_populates="session", cascade="all, delete-orphan")

    def to_dict(self) -> dict:
        return {
            "session_id": self.session_id,
            "user_id": self.user_id,
            "title": self.title,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self) -> str:
        return f"<Session {self.session_id} user={self.user_id}>"
