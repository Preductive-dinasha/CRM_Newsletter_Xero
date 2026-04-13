import pytest
from unittest.mock import MagicMock, patch
from app.services.auth_service import AuthService, AuthError
from app.models.user import User


def make_mock_user(user_id=1, email="test@example.com", password_hash="hashed"):
    user = MagicMock(spec=User)
    user.user_id = user_id
    user.email = email
    user.password = password_hash
    return user


class TestPasswordValidation:
    def setup_method(self):
        self.service = AuthService.__new__(AuthService)

    def test_password_validation_passes(self):
        valid, msg = AuthService.validate_password("ValidPass@1")
        assert valid is True
        assert msg == ""

    def test_password_validation_fails_short(self):
        valid, msg = AuthService.validate_password("Ab@1")
        assert valid is False
        assert "8 characters" in msg

    def test_password_validation_fails_no_special(self):
        valid, msg = AuthService.validate_password("ValidPass1")
        assert valid is False
        assert "special character" in msg

    def test_password_validation_fails_no_uppercase(self):
        valid, msg = AuthService.validate_password("validpass@1")
        assert valid is False
        assert "uppercase" in msg

    def test_password_validation_fails_no_lowercase(self):
        valid, msg = AuthService.validate_password("VALIDPASS@1")
        assert valid is False
        assert "lowercase" in msg

    def test_password_validation_fails_no_digit(self):
        valid, msg = AuthService.validate_password("ValidPass@!")
        assert valid is False
        assert "digit" in msg


class TestRegister:
    def test_register_creates_user(self, app):
        with app.app_context():
            mock_repo = MagicMock()
            mock_repo.find_by_email.return_value = None
            mock_repo.create.return_value = make_mock_user()

            with patch("app.services.auth_service.bcrypt") as mock_bcrypt:
                mock_bcrypt.generate_password_hash.return_value = b"hashed"
                service = AuthService(user_repo=mock_repo)
                user = service.register("new@example.com", "Valid@Pass1", "Jane", "Doe")

            mock_repo.create.assert_called_once()
            assert user is not None

    def test_register_raises_on_duplicate_email(self, app):
        with app.app_context():
            mock_repo = MagicMock()
            mock_repo.find_by_email.return_value = make_mock_user()
            service = AuthService(user_repo=mock_repo)

            with pytest.raises(AuthError, match="already exists"):
                service.register("existing@example.com", "Valid@Pass1", "Jane", "Doe")


class TestLogin:
    def test_login_wrong_password_raises(self, app):
        with app.app_context():
            mock_repo = MagicMock()
            mock_repo.find_by_email.return_value = make_mock_user(password_hash="hashed")

            with patch("app.services.auth_service.bcrypt") as mock_bcrypt:
                mock_bcrypt.check_password_hash.return_value = False
                service = AuthService(user_repo=mock_repo)

                with pytest.raises(AuthError, match="Invalid email or password"):
                    service.login("test@example.com", "wrong_password")

    def test_login_unknown_email_raises(self, app):
        with app.app_context():
            mock_repo = MagicMock()
            mock_repo.find_by_email.return_value = None
            service = AuthService(user_repo=mock_repo)

            with pytest.raises(AuthError):
                service.login("unknown@example.com", "anyPass@1")
