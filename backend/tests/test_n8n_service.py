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

    def test_json_object_string_not_unwrapped(self):
        import json
        inner = {"reply": "Nested reply text"}
        raw = json.dumps(inner)
        result = self.service._parse_response({"reply": raw})
        assert raw in result["reply"]

    def test_empty_reply_returns_empty_string(self):
        result = self.service._parse_response({"reply": ""})
        assert result["reply"] == ""

    def test_reply_only_key_returned(self):
        result = self.service._parse_response({"reply": "See image", "media_url": "https://example.com/img.png"})
        assert "reply" in result
        assert "media_url" not in result

    def test_strips_leading_trailing_whitespace(self):
        result = self.service._parse_response({"reply": "  Hello world  "})
        assert result["reply"] == "Hello world"

    def test_numbered_list_gets_newlines(self):
        result = self.service._parse_response({"reply": "Pick one: 1. Alpha 2. Beta 3. Gamma"})
        assert "\n1." in result["reply"] or "\n2." in result["reply"]

    def test_reply_with_gets_own_paragraph(self):
        result = self.service._parse_response({"reply": "Here are options. Reply with the number."})
        assert "\n\nReply with" in result["reply"]


class TestNormaliseSpacing:
    def setup_method(self):
        self.service = N8nService()

    def test_no_change_when_newlines_present(self):
        text = "Line one\n- Item A\n- Item B"
        assert self.service._normalise_spacing(text) == text

    def test_double_space_bullet_converted(self):
        text = "Here is the list:- First item  - Second item  - Third item"
        result = self.service._normalise_spacing(text)
        assert "\n- First item" in result
        assert "\n- Second item" in result
        assert "\n- Third item" in result

    def test_colon_dash_first_item_converted(self):
        text = "Contact details:- Name: Andrew  - Email: a@b.com"
        result = self.service._normalise_spacing(text)
        assert ":\n- Name: Andrew" in result

    def test_numbered_options_converted(self):
        text = "What next?  1) Show details  2) Update field  3) Create deal"
        result = self.service._normalise_spacing(text)
        assert "\n1. Show details" in result
        assert "\n2. Update field" in result
        assert "\n3. Create deal" in result

    def test_real_n8n_crm_response(self):
        text = (
            "I've found the contact:- Name: Andrew Nicol"
            "  - Email: andrew@nicol.co.nz"
            "  - Job title: Developer"
            "  What do you want to do?  1) Show more details  2) Update a field"
        )
        result = self.service._normalise_spacing(text)
        assert "\n- Name:" in result or ":\n- Name:" in result
        assert "\n- Email:" in result
        assert "\n1. Show more details" in result
        assert "\n2. Update a field" in result

    def test_transition_paragraph_converted(self):
        text = "Contact ID: 50028854423  What do you want to do?  1) Show details"
        result = self.service._normalise_spacing(text)
        assert "\nWhat do you want to do?" in result
        assert "\n1. Show details" in result

    def test_plain_text_unchanged(self):
        text = "Hello, how can I help you today?"
        assert self.service._normalise_spacing(text) == text

    def test_already_newlined_text_skipped(self):
        text = "Name:  Andrew  Nicol\n- Email: a@b.com"
        result = self.service._normalise_spacing(text)
        assert result == text

    def test_single_space_text_unchanged(self):
        text = "Andrew Nicol works at Acme Corp in Hamilton New Zealand"
        assert self.service._normalise_spacing(text) == text
