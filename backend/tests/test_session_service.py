import pytest
from unittest.mock import MagicMock, patch
from app.services.session_service import SessionService, SessionError
from app.models.session import Session


def make_mock_session(session_id=1, user_id=42, title="New Chat"):
    s = MagicMock(spec=Session)
    s.session_id = session_id
    s.user_id = user_id
    s.title = title
    return s


class TestCreateSession:
    def test_create_session(self, app):
        with app.app_context():
            mock_repo = MagicMock()
            created = make_mock_session()
            mock_repo.create.return_value = created
            service = SessionService(session_repo=mock_repo)

            result = service.create_session(user_id=42)

            mock_repo.create.assert_called_once_with(user_id=42, title="New Chat")
            assert result.session_id == 1


class TestGetSessions:
    def test_get_user_sessions(self, app):
        with app.app_context():
            mock_repo = MagicMock()
            sessions = [make_mock_session(1, 42), make_mock_session(2, 42, "Another")]
            mock_repo.find_by_user_id.return_value = sessions
            service = SessionService(session_repo=mock_repo)

            result = service.get_sessions(user_id=42)

            mock_repo.find_by_user_id.assert_called_once_with(42)
            assert len(result) == 2


class TestAutoTitle:
    def test_title_auto_generated(self, app):
        with app.app_context():
            mock_repo = MagicMock()
            session = make_mock_session()
            mock_repo.find_by_id.return_value = session
            updated = make_mock_session(title="Generated Title")
            mock_repo.update_title.return_value = updated
            service = SessionService(session_repo=mock_repo)

            result = service.update_title(session_id=1, title="Generated Title", user_id=42)

            mock_repo.update_title.assert_called_once_with(session, "Generated Title")
            assert result.title == "Generated Title"

    def test_update_title_not_found_raises(self, app):
        with app.app_context():
            mock_repo = MagicMock()
            mock_repo.find_by_id.return_value = None
            service = SessionService(session_repo=mock_repo)

            with pytest.raises(SessionError):
                service.update_title(session_id=999, title="X", user_id=42)
