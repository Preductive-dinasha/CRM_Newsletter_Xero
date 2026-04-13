from datetime import datetime, timezone
from ..extensions import db


class User(db.Model):
    __tablename__ = "users"

    user_id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    f_name = db.Column(db.String(100), nullable=False)
    l_name = db.Column(db.String(100), nullable=False)
    company = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    sessions = db.relationship("Session", back_populates="user", cascade="all, delete-orphan")

    def to_dict(self) -> dict:
        return {
            "user_id": self.user_id,
            "email": self.email,
            "f_name": self.f_name,
            "l_name": self.l_name,
            "company": self.company,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self) -> str:
        return f"<User {self.email}>"
