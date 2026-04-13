from typing import Optional
from ..extensions import db
from ..models.user import User


class UserRepository:
    def create(self, email: str, password_hash: str, f_name: str, l_name: str, company: Optional[str] = None) -> User:
        user = User(
            email=email,
            password=password_hash,
            f_name=f_name,
            l_name=l_name,
            company=company,
        )
        db.session.add(user)
        db.session.commit()
        return user

    def find_by_email(self, email: str) -> Optional[User]:
        return db.session.execute(
            db.select(User).where(User.email == email)
        ).scalar_one_or_none()

    def find_by_id(self, user_id: int) -> Optional[User]:
        return db.session.get(User, user_id)

    def update(self, user: User, **kwargs) -> User:
        for key, value in kwargs.items():
            if hasattr(user, key) and value is not None:
                setattr(user, key, value)
        db.session.commit()
        return user
