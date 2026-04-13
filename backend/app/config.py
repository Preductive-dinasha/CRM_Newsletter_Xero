import os
from datetime import timedelta


class Config:
    SECRET_KEY: str = os.environ.get("SESSION_SECRET", "dev-secret-key-change-me")

    SQLALCHEMY_DATABASE_URI: str = os.environ.get("DATABASE_URL", "sqlite:///preddi.db")
    SQLALCHEMY_TRACK_MODIFICATIONS: bool = False

    JWT_SECRET_KEY: str = os.environ.get("JWT_SECRET_KEY", "jwt-secret-key-change-me")
    JWT_TOKEN_LOCATION: list = ["cookies"]
    JWT_COOKIE_HTTPONLY: bool = True
    JWT_COOKIE_SECURE: bool = os.environ.get("FLASK_ENV", "development") == "production"
    JWT_COOKIE_SAMESITE: str = "Lax"
    JWT_ACCESS_TOKEN_EXPIRES: timedelta = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES: timedelta = timedelta(days=30)
    JWT_COOKIE_CSRF_PROTECT: bool = False

    OPENAI_API_KEY: str = os.environ.get("AI_INTEGRATIONS_OPENAI_API_KEY") or os.environ.get("OPENAI_API_KEY", "")
    OPENAI_BASE_URL: str = os.environ.get("AI_INTEGRATIONS_OPENAI_BASE_URL") or ""
    OPENAI_MODEL: str = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")

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
    WTF_CSRF_ENABLED: bool = False
    OPENAI_API_KEY: str = "test-key"
    OPENAI_BASE_URL: str = ""
