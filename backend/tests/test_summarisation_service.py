import pytest
from unittest.mock import MagicMock
from app.services.summarisation_service import SummarisationService, SUMMARISE_THRESHOLD, SUMMARISE_OLDEST_N
from app.models.chat_history import ChatHistory


def make_mock_messages(n: int, session_id: int = 1):
    msgs = []
    for i in range(n):
        m = MagicMock(spec=ChatHistory)
        m.id = i + 1
        m.session_id = session_id
        m.role = "user" if i % 2 == 0 else "agent"
        m.content = f"Message {i + 1}"
        msgs.append(m)
    return msgs


class TestSummarisationTriggered:
    def test_summarise_triggered_above_threshold(self, app):
        with app.app_context():
            mock_repo = MagicMock()
            mock_repo.count_by_session_id.return_value = SUMMARISE_THRESHOLD + 5
            oldest = make_mock_messages(SUMMARISE_OLDEST_N)
            mock_repo.get_oldest_n.return_value = oldest
            mock_repo.delete_by_ids.return_value = None
            mock_repo.create.return_value = MagicMock()

            service = SummarisationService(chat_repo=mock_repo)
            result = service.maybe_summarise(session_id=1)

            assert result is True
            mock_repo.delete_by_ids.assert_called_once()
            mock_repo.create.assert_called_once()
            call_args = mock_repo.create.call_args
            assert "[Conversation summary]" in call_args.kwargs.get("content", "")

    def test_summarise_not_triggered_below_threshold(self, app):
        with app.app_context():
            mock_repo = MagicMock()
            mock_repo.count_by_session_id.return_value = SUMMARISE_THRESHOLD - 5

            service = SummarisationService(chat_repo=mock_repo)
            result = service.maybe_summarise(session_id=1)

            assert result is False
            mock_repo.get_oldest_n.assert_not_called()
            mock_repo.delete_by_ids.assert_not_called()

    def test_summary_replaces_old_turns(self, app):
        with app.app_context():
            mock_repo = MagicMock()
            mock_repo.count_by_session_id.return_value = SUMMARISE_THRESHOLD + 1
            oldest = make_mock_messages(SUMMARISE_OLDEST_N)
            mock_repo.get_oldest_n.return_value = oldest
            mock_repo.delete_by_ids.return_value = None
            summary_msg = MagicMock()
            summary_msg.content = "[Conversation summary] Condensed history"
            mock_repo.create.return_value = summary_msg

            service = SummarisationService(chat_repo=mock_repo)
            service.maybe_summarise(session_id=1)

            deleted_ids = mock_repo.delete_by_ids.call_args[0][0]
            assert len(deleted_ids) == SUMMARISE_OLDEST_N
            assert all(i + 1 in deleted_ids for i in range(SUMMARISE_OLDEST_N))
