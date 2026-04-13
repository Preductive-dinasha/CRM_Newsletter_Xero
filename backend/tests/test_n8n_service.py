import pytest
from unittest.mock import MagicMock, patch
from app.services.n8n_service import N8nService, N8nError, WebhookNotConfiguredError


class TestPayloadStructure:
    def test_payload_structure_correct(self, app):
        with app.app_context():
            app.config["N8N_CRM_WEBHOOK_URL"] = "https://n8n.example.com/webhook/crm"
            app.config["N8N_BEARER_TOKEN"] = "test-token"

            service = N8nService()
            captured = {}

            def mock_post(url, json=None, headers=None, timeout=None):
                captured["url"] = url
                captured["json"] = json
                captured["headers"] = headers
                mock_resp = MagicMock()
                mock_resp.raise_for_status.return_value = None
                mock_resp.json.return_value = {"reply": "ok", "media_url": None}
                return mock_resp

            with patch("app.services.n8n_service.requests.post", side_effect=mock_post):
                service.send_to_agent(
                    agent="crm",
                    user_id=1,
                    session_id=10,
                    message="Hello",
                    history=[{"role": "user", "content": "Hi"}],
                    file_url=None,
                )

            assert captured["json"]["user_id"] == 1
            assert captured["json"]["session_id"] == 10
            assert captured["json"]["message"] == "Hello"
            assert "history" in captured["json"]
            assert "file_url" in captured["json"]

    def test_file_url_included_when_present(self, app):
        with app.app_context():
            app.config["N8N_XERO_WEBHOOK_URL"] = "https://n8n.example.com/webhook/xero"
            app.config["N8N_BEARER_TOKEN"] = ""

            service = N8nService()
            captured = {}

            def mock_post(url, json=None, headers=None, timeout=None):
                captured["json"] = json
                mock_resp = MagicMock()
                mock_resp.raise_for_status.return_value = None
                mock_resp.json.return_value = {"reply": "ok", "media_url": None}
                return mock_resp

            with patch("app.services.n8n_service.requests.post", side_effect=mock_post):
                service.send_to_agent(
                    agent="xero",
                    user_id=2,
                    session_id=5,
                    message="Upload this",
                    history=[],
                    file_url="https://example.com/file.pdf",
                )

            assert captured["json"]["file_url"] == "https://example.com/file.pdf"

    def test_handles_n8n_timeout(self, app):
        import requests as req_lib
        with app.app_context():
            app.config["N8N_NEWSLETTER_WEBHOOK_URL"] = "https://n8n.example.com/webhook/newsletter"

            service = N8nService()
            with patch("app.services.n8n_service.requests.post", side_effect=req_lib.exceptions.Timeout):
                with pytest.raises(N8nError, match="timed out"):
                    service.send_to_agent(
                        agent="newsletter",
                        user_id=1,
                        session_id=1,
                        message="Hello",
                        history=[],
                    )

    def test_webhook_not_configured_raises(self, app):
        with app.app_context():
            app.config["N8N_CRM_WEBHOOK_URL"] = ""
            service = N8nService()

            with pytest.raises(WebhookNotConfiguredError):
                service.send_to_agent(
                    agent="crm",
                    user_id=1,
                    session_id=1,
                    message="Hello",
                    history=[],
                )
