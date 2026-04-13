import re
from typing import Optional
from flask import current_app
from ..extensions import bcrypt
from ..models.user import User
from ..repositories.user_repository import UserRepository


class AuthError(Exception):
    pass


class AuthService:
    def __init__(self, user_repo: Optional[UserRepository] = None) -> None:
        self.user_repo = user_repo or UserRepository()

    @staticmethod
    def validate_password(password: str) -> tuple[bool, str]:
        if len(password) < 8:
            return False, "Password must be at least 8 characters."
        if not re.search(r"[A-Z]", password):
            return False, "Password must contain at least one uppercase letter."
        if not re.search(r"[a-z]", password):
            return False, "Password must contain at least one lowercase letter."
        if not re.search(r"\d", password):
            return False, "Password must contain at least one digit."
        if not re.search(r"[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>\/?`~]", password):
            return False, "Password must contain at least one special character."
        return True, ""

    def register(self, email: str, password: str, f_name: str, l_name: str, company: Optional[str] = None) -> User:
        valid, msg = self.validate_password(password)
        if not valid:
            raise AuthError(msg)

        if self.user_repo.find_by_email(email.lower().strip()):
            raise AuthError("An account with this email already exists.")

        password_hash = bcrypt.generate_password_hash(password).decode("utf-8")
        return self.user_repo.create(
            email=email.lower().strip(),
            password_hash=password_hash,
            f_name=f_name.strip(),
            l_name=l_name.strip(),
            company=company.strip() if company else None,
        )

    def login(self, email: str, password: str) -> User:
        user = self.user_repo.find_by_email(email.lower().strip())
        if not user or not bcrypt.check_password_hash(user.password, password):
            raise AuthError("Invalid email or password.")
        return user

    def get_current_user(self, user_id: int) -> Optional[User]:
        return self.user_repo.find_by_id(user_id)
