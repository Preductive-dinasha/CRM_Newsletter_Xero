import os
from datetime import timedelta


_INSECURE_DEFAULTS = {"dev-secret-key-change-me", "jwt-secret-key-change-me"}


def _require_secret(name: str, value: str, env: str) -> str:
    if env == "production" and (not value or value in _INSECURE_DEFAULTS):
        raise RuntimeError(
            f"FATAL: {name} is missing or set to an insecure default in production. "
            f"Set a strong value via the {name.upper()} environment variable before deploying."
        )
    return value


class Config:
    _env: str = os.environ.get("FLASK_ENV", "development")

    SECRET_KEY: str = _require_secret(
        "SECRET_KEY",
        os.environ.get("SESSION_SECRET", "dev-secret-key-change-me"),
        os.environ.get("FLASK_ENV", "development"),
    )

    SQLALCHEMY_DATABASE_URI: str = os.environ.get("DATABASE_URL", "sqlite:///preddi.db")
    SQLALCHEMY_TRACK_MODIFICATIONS: bool = False

    JWT_SECRET_KEY: str = _require_secret(
        "JWT_SECRET_KEY",
        os.environ.get("JWT_SECRET_KEY", "jwt-secret-key-change-me"),
        os.environ.get("FLASK_ENV", "development"),
    )
    JWT_TOKEN_LOCATION: list = ["cookies"]
    JWT_COOKIE_HTTPONLY: bool = True
    JWT_COOKIE_SECURE: bool = os.environ.get("FLASK_ENV", "development") == "production"
    JWT_COOKIE_SAMESITE: str = "Lax"
    JWT_ACCESS_TOKEN_EXPIRES: timedelta = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES: timedelta = timedelta(days=30)
    JWT_COOKIE_CSRF_PROTECT: bool = True

    N8N_CRM_WEBHOOK_URL: str = os.environ.get("N8N_CRM_WEBHOOK_URL", "")
    N8N_NEWSLETTER_WEBHOOK_URL: str = os.environ.get("N8N_NEWSLETTER_WEBHOOK_URL", "")
    N8N_XERO_WEBHOOK_URL: str = os.environ.get("N8N_XERO_WEBHOOK_URL", "")
    N8N_BEARER_TOKEN: str = os.environ.get("N8N_BEARER_TOKEN", "")

    UPLOAD_FOLDER: str = os.environ.get("UPLOAD_FOLDER", os.path.join(os.path.dirname(__file__), "..", "uploads"))
    MAX_CONTENT_LENGTH: int = int(os.environ.get("MAX_CONTENT_LENGTH", 16 * 1024 * 1024))

    ALLOWED_EXTENSIONS: set = {"png", "jpg", "jpeg", "gif", "webp", "pdf", "docx", "txt"}


class TestingConfig(Config):
    TESTING: bool = True
    SQLALCHEMY_DATABASE_URI: str = "sqlite:///:memory:"
    JWT_COOKIE_SECURE: bool = False
    JWT_COOKIE_CSRF_PROTECT: bool = False
    WTF_CSRF_ENABLED: bool = False
