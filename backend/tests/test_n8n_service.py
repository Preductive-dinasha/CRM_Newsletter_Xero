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


class TestParseResponse:
    def setup_method(self):
        self.service = N8nService()

    def test_plain_text_reply(self):
        result = self.service._parse_response({"reply": "Hello there!"})
        assert result["reply"] == "Hello there!"

    def test_output_field_fallback(self):
        result = self.service._parse_response({"output": "Response from output"})
        assert result["reply"] == "Response from output"

    def test_content_field_fallback(self):
        result = self.service._parse_response({"content": "Response from content"})
        assert result["reply"] == "Response from content"

    def test_literal_backslash_n_restored(self):
        result = self.service._parse_response({"reply": "Line 1\\nLine 2\\nLine 3"})
        assert result["reply"] == "Line 1\nLine 2\nLine 3"

    def test_real_newlines_preserved(self):
        result = self.service._parse_response({"reply": "Line 1\nLine 2\nLine 3"})
        assert result["reply"] == "Line 1\nLine 2\nLine 3"

    def test_double_encoded_json_string_unwrapped(self):
        import json
        inner = "This is the real reply"
        double_encoded = json.dumps(inner)
        result = self.service._parse_response({"reply": double_encoded})
        assert result["reply"] == inner

    def test_json_object_string_unwrapped(self):
        import json
        inner = {"reply": "Nested reply text"}
        result = self.service._parse_response({"reply": json.dumps(inner)})
        assert result["reply"] == "Nested reply text"

    def test_list_response_uses_first_element(self):
        result = self.service._parse_response([{"reply": "First item reply"}])
        assert result["reply"] == "First item reply"

    def test_empty_reply_returns_default(self):
        result = self.service._parse_response({"reply": ""})
        assert result["reply"] == "No response received."

    def test_media_url_extracted(self):
        result = self.service._parse_response({"reply": "See image", "media_url": "https://example.com/img.png"})
        assert result["media_url"] == "https://example.com/img.png"

    def test_image_url_field_fallback(self):
        result = self.service._parse_response({"reply": "See image", "image_url": "https://example.com/img.png"})
        assert result["media_url"] == "https://example.com/img.png"

    def test_strips_leading_trailing_whitespace(self):
        result = self.service._parse_response({"reply": "  Hello world  "})
        assert result["reply"] == "Hello world"

    def test_non_dict_data_returns_stringified(self):
        result = self.service._parse_response("just a string")
        assert result["reply"] == "just a string"
