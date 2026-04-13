import pytest
from app import create_app
from app.config import TestingConfig
from app.extensions import db as _db


@pytest.fixture(scope="session")
def app():
    _app = create_app(TestingConfig)
    _app.config["TESTING"] = True
    with _app.app_context():
        _db.create_all()
        yield _app
        _db.drop_all()


@pytest.fixture(scope="function")
def client(app):
    return app.test_client()


@pytest.fixture(scope="function")
def db(app):
    with app.app_context():
        yield _db
        _db.session.rollback()
        for table in reversed(_db.metadata.sorted_tables):
            _db.session.execute(table.delete())
        _db.session.commit()
