from datetime import datetime, timezone
from ..extensions import db


class ChatHistory(db.Model):
    __tablename__ = "chat_history"

    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey("sessions.session_id", ondelete="CASCADE"), nullable=False)
    role = db.Column(db.String(10), nullable=False)
    content = db.Column(db.Text, nullable=False)
    media_url = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        db.CheckConstraint("role IN ('user', 'agent')", name="role_check"),
    )

    session = db.relationship("Session", back_populates="messages")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "session_id": self.session_id,
            "role": self.role,
            "content": self.content,
            "media_url": self.media_url,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self) -> str:
        return f"<ChatHistory {self.id} role={self.role}>"
