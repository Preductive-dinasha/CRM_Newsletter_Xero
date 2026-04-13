import os
import logging
from flask import Flask
from .config import Config, TestingConfig
from .extensions import db, jwt, migrate, bcrypt

logger = logging.getLogger(__name__)


def create_app(config_class=None) -> Flask:
    app = Flask(__name__, static_folder=None)

    if config_class is None:
        config_class = Config
    app.config.from_object(config_class)

    os.makedirs(app.config.get("UPLOAD_FOLDER", "uploads"), exist_ok=True)

    db.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)
    bcrypt.init_app(app)

    try:
        from flask_cors import CORS
        CORS(app, supports_credentials=True, origins=[
            "http://localhost:5173", "http://127.0.0.1:5173",
            "http://localhost:3000", "http://127.0.0.1:3000",
        ])
    except ImportError:
        pass

    from .routes import auth_bp, chat_bp, session_bp, user_bp
    app.register_blueprint(auth_bp)
    app.register_blueprint(chat_bp)
    app.register_blueprint(session_bp)
    app.register_blueprint(user_bp)

    frontend_dist = os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist")
    frontend_dist = os.path.abspath(frontend_dist)

    if os.path.isdir(frontend_dist):
        from flask import send_from_directory

        @app.route("/", defaults={"path": ""})
        @app.route("/<path:path>")
        def serve_spa(path):
            if path and path.startswith("api"):
                from flask import abort
                abort(404)
            full = os.path.join(frontend_dist, path)
            if path and os.path.isfile(full):
                return send_from_directory(frontend_dist, path)
            return send_from_directory(frontend_dist, "index.html")

    @app.route("/api/health")
    def health():
        from flask import jsonify
        return jsonify({"status": "ok", "service": "Preddi API"}), 200

    @app.route("/api/skills")
    def skills():
        from flask import jsonify
        raw = os.environ.get("PREDDI_SKILLS", "CRM,Newsletter,Xero")
        skill_list = [s.strip() for s in raw.split(",") if s.strip()]
        return jsonify({"skills": skill_list}), 200

    if not app.config.get("TESTING", False):
        with app.app_context():
            _run_migrations(app)
            _seed_initial_user(app)

    return app


def _run_migrations(app: Flask) -> None:
    migrations_dir = os.path.join(os.path.dirname(__file__), "..", "migrations")
    migrations_dir = os.path.abspath(migrations_dir)
    env_py = os.path.join(migrations_dir, "env.py")

    if os.path.exists(env_py):
        try:
            from flask_migrate import upgrade as flask_upgrade
            flask_upgrade(directory=migrations_dir)
            logger.info("Database migrations applied.")
            return
        except Exception as e:
            logger.warning(f"Flask-Migrate upgrade failed, falling back to create_all: {e}")

    try:
        db.create_all()
        logger.info("Database tables created via create_all.")
    except Exception as inner:
        logger.error(f"db.create_all() also failed: {inner}")


def _seed_initial_user(app: Flask) -> None:
    from .repositories.user_repository import UserRepository
    from .services.auth_service import AuthService

    repo = UserRepository()
    auth_svc = AuthService(repo)

    seed_email = "dinasha@preductive.co"
    existing = repo.find_by_email(seed_email)
    if not existing:
        try:
            auth_svc.register(
                email=seed_email,
                password="Admin@1234",
                f_name="Dinasha",
                l_name="Admin",
                company="Preductive",
            )
            logger.info(f"Seed user created: {seed_email}")
        except Exception as e:
            logger.error(f"Failed to seed initial user: {e}")
    else:
        logger.info(f"Seed user already exists: {seed_email}")
