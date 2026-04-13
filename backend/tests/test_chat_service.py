import pytest
from unittest.mock import MagicMock, patch
from app.services.chat_service import ChatService, ChatError
from app.services.n8n_service import WebhookNotConfiguredError
from app.models.session import Session
from app.models.chat_history import ChatHistory


def make_mock_session(session_id=1, user_id=42):
    s = MagicMock(spec=Session)
    s.session_id = session_id
    s.user_id = user_id
    s.title = "New Chat"
    return s


def make_mock_history(n=3):
    items = []
    for i in range(n):
        h = MagicMock(spec=ChatHistory)
        h.id = i + 1
        h.role = "user" if i % 2 == 0 else "agent"
        h.content = f"msg {i}"
        items.append(h)
    return items


class TestAgentRouting:
    def test_routes_to_crm_agent(self, app):
        with app.app_context():
            mock_chat_repo = MagicMock()
            mock_session_repo = MagicMock()
            mock_n8n = MagicMock()
            mock_summarise = MagicMock()

            mock_session_repo.find_by_id.return_value = make_mock_session()
            mock_chat_repo.count_by_session_id.return_value = 2
            mock_chat_repo.find_by_session_id.return_value = make_mock_history(2)
            mock_n8n.send_to_agent.return_value = {"reply": "CRM reply", "media_url": None}
            mock_summarise.maybe_summarise.return_value = False

            service = ChatService(
                chat_repo=mock_chat_repo,
                session_repo=mock_session_repo,
                n8n_service=mock_n8n,
                summarisation_service=mock_summarise,
            )

            result = service.send_message(
                user_id=42, session_id=1, message="Hello CRM", agent="crm"
            )

            mock_n8n.send_to_agent.assert_called_once()
            call_kwargs = mock_n8n.send_to_agent.call_args.kwargs
            assert call_kwargs["agent"] == "crm"
            assert result["reply"] == "CRM reply"

    def test_routes_to_crm_with_at_prefix(self, app):
        with app.app_context():
            mock_chat_repo = MagicMock()
            mock_session_repo = MagicMock()
            mock_n8n = MagicMock()
            mock_summarise = MagicMock()

            mock_session_repo.find_by_id.return_value = make_mock_session()
            mock_chat_repo.count_by_session_id.return_value = 2
            mock_chat_repo.find_by_session_id.return_value = make_mock_history(2)
            mock_n8n.send_to_agent.return_value = {"reply": "CRM reply", "media_url": None}
            mock_summarise.maybe_summarise.return_value = False

            service = ChatService(
                chat_repo=mock_chat_repo,
                session_repo=mock_session_repo,
                n8n_service=mock_n8n,
                summarisation_service=mock_summarise,
            )

            result = service.send_message(
                user_id=42, session_id=1, message="Hello CRM", agent="@CRM"
            )

            mock_n8n.send_to_agent.assert_called_once()
            call_kwargs = mock_n8n.send_to_agent.call_args.kwargs
            assert call_kwargs["agent"] == "crm"
            assert result["reply"] == "CRM reply"

    def test_raises_error_when_no_agent(self, app):
        with app.app_context():
            mock_chat_repo = MagicMock()
            mock_session_repo = MagicMock()
            mock_n8n = MagicMock()
            mock_summarise = MagicMock()

            mock_session_repo.find_by_id.return_value = make_mock_session()
            mock_chat_repo.count_by_session_id.return_value = 1

            service = ChatService(
                chat_repo=mock_chat_repo,
                session_repo=mock_session_repo,
                n8n_service=mock_n8n,
                summarisation_service=mock_summarise,
            )

            with pytest.raises(ChatError, match="select an agent"):
                service.send_message(
                    user_id=42, session_id=1, message="Some question", agent=None
                )

            mock_n8n.send_to_agent.assert_not_called()

    def test_raises_error_for_unknown_agent(self, app):
        with app.app_context():
            mock_chat_repo = MagicMock()
            mock_session_repo = MagicMock()
            mock_n8n = MagicMock()
            mock_summarise = MagicMock()

            mock_session_repo.find_by_id.return_value = make_mock_session()
            mock_chat_repo.count_by_session_id.return_value = 1

            service = ChatService(
                chat_repo=mock_chat_repo,
                session_repo=mock_session_repo,
                n8n_service=mock_n8n,
                summarisation_service=mock_summarise,
            )

            with pytest.raises(ChatError, match="select an agent"):
                service.send_message(
                    user_id=42, session_id=1, message="Some question", agent="General"
                )

            mock_n8n.send_to_agent.assert_not_called()

    def test_history_appended_correctly(self, app):
        with app.app_context():
            mock_chat_repo = MagicMock()
            mock_session_repo = MagicMock()
            mock_n8n = MagicMock()
            mock_summarise = MagicMock()

            mock_session_repo.find_by_id.return_value = make_mock_session()
            mock_chat_repo.count_by_session_id.return_value = 4
            mock_chat_repo.find_by_session_id.return_value = make_mock_history(4)
            mock_n8n.send_to_agent.return_value = {"reply": "Reply", "media_url": None}
            mock_summarise.maybe_summarise.return_value = False

            service = ChatService(
                chat_repo=mock_chat_repo,
                session_repo=mock_session_repo,
                n8n_service=mock_n8n,
                summarisation_service=mock_summarise,
            )
            service.send_message(user_id=42, session_id=1, message="Hi", agent="crm")

            assert mock_chat_repo.create.call_count == 2
            calls = mock_chat_repo.create.call_args_list
            assert calls[0].kwargs["role"] == "user"
            assert calls[1].kwargs["role"] == "agent"

    def test_history_fetched_before_send(self, app):
        with app.app_context():
            mock_chat_repo = MagicMock()
            mock_session_repo = MagicMock()
            mock_n8n = MagicMock()
            mock_summarise = MagicMock()

            mock_session_repo.find_by_id.return_value = make_mock_session()
            mock_chat_repo.count_by_session_id.return_value = 2
            mock_chat_repo.find_by_session_id.return_value = make_mock_history(2)
            mock_n8n.send_to_agent.return_value = {"reply": "ok", "media_url": None}
            mock_summarise.maybe_summarise.return_value = False

            service = ChatService(
                chat_repo=mock_chat_repo,
                session_repo=mock_session_repo,
                n8n_service=mock_n8n,
                summarisation_service=mock_summarise,
            )
            service.send_message(user_id=42, session_id=1, message="Hi", agent="xero")

            mock_chat_repo.find_by_session_id.assert_called_once_with(1)
            sent_history = mock_n8n.send_to_agent.call_args.kwargs["history"]
            assert isinstance(sent_history, list)
