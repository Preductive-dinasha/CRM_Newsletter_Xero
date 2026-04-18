import json
import logging
import re
from typing import Optional
import requests
from flask import current_app

logger = logging.getLogger(__name__)

AGENT_WEBHOOK_MAP = {
    "crm": "N8N_CRM_WEBHOOK_URL",
    "newsletter": "N8N_NEWSLETTER_WEBHOOK_URL",
    "xero": "N8N_XERO_WEBHOOK_URL",
}


class N8nError(Exception):
    pass


class WebhookNotConfiguredError(N8nError):
    pass


class N8nService:
    def __init__(self) -> None:
        pass

    def _get_webhook_url(self, agent: str) -> str:
        key = AGENT_WEBHOOK_MAP.get(agent.lower().strip(), "")
        if not key:
            raise N8nError(f"Unknown agent: {agent}")
        url = current_app.config.get(key, "")
        if not url:
            raise WebhookNotConfiguredError(
                f"Webhook not configured for @{agent}. "
                f"Please set the {key} environment variable."
            )
        return url

    def send_to_agent(
        self,
        agent: str,
        user_id: int,
        session_id: int,
        message: str,
        history: list,
        file_url: Optional[str] = None,
    ) -> dict:
        url = self._get_webhook_url(agent)
        payload = {
            "user_id": user_id,
            "session_id": session_id,
            "message": message,
            "history": history,
            "file_url": file_url,
        }
        bearer_token = current_app.config.get("N8N_BEARER_TOKEN", "")
        headers = {"Content-Type": "application/json"}
        if bearer_token:
            headers["X-API-Key"] = bearer_token

        try:
            logger.debug(f"Sending to n8n agent={agent}, url={url}")
            response = requests.post(url, json=payload, headers=headers, timeout=120)
            response.raise_for_status()
            data = response.json()
            logger.debug(f"n8n response: {str(data)[:500]}")
            return self._parse_response(data)
        except requests.exceptions.Timeout:
            raise N8nError("The agent timed out. Please try again.")
        except requests.exceptions.ConnectionError:
            raise N8nError("Could not connect to the agent. Please check your webhook URL.")
        except requests.exceptions.HTTPError as e:
            raise N8nError(f"Agent returned an error: {e.response.status_code}")
        except (json.JSONDecodeError, KeyError, TypeError) as e:
            raise N8nError(f"Invalid response from agent: {e}")

    def _normalise_spacing(self, text: str) -> str:
        if not isinstance(text, str):
            return text
        # Skip if text already has newlines — it's already structured
        if "\n" in text:
            return text
        # "contact:- Item" → "contact:\n- Item" (first list item glued to intro)
        text = re.sub(r":- ", ":\n- ", text)
        # "  - Item" (2+ spaces + dash + space) → "\n- Item" (markdown bullet)
        text = re.sub(r"  +- ", "\n- ", text)
        # "  N) " (2+ spaces + digit(s) + paren + space) → "\nN. " (numbered list)
        text = re.sub(r"  +(\d+)\) ", r"\n\1. ", text)
        # Trailing numbered item without trailing space "  N)" at end of string
        text = re.sub(r"  +(\d+)\)$", r"\n\1.", text)
        # Catch-all: any remaining 2+ spaces become a newline (handles unlabelled
        # paragraph transitions like "50028  What do you want...")
        text = re.sub(r"  +", "\n", text)
        return text

    def _parse_response(self, data: dict | list) -> dict:
        if isinstance(data, list) and len(data) > 0:
            data = data[0]

        if not isinstance(data, dict):
            return {"reply": str(data).strip(), "media_url": None}

        reply = (
            data.get("reply")
            or data.get("output")
            or data.get("text")
            or data.get("message")
            or data.get("response")
            or data.get("content")
            or ""
        )

        if isinstance(reply, dict):
            reply = reply.get("reply") or reply.get("output") or reply.get("text") or str(reply)

        if isinstance(reply, str):
            stripped = reply.strip()
            if stripped.startswith('"') and stripped.endswith('"'):
                try:
                    reply = json.loads(stripped)
                except (json.JSONDecodeError, TypeError):
                    pass
            elif stripped.startswith("{") or stripped.startswith("["):
                try:
                    inner = json.loads(stripped)
                    if isinstance(inner, dict):
                        reply = (
                            inner.get("reply")
                            or inner.get("output")
                            or inner.get("text")
                            or reply
                        )
                    elif isinstance(inner, list) and len(inner) > 0 and isinstance(inner[0], dict):
                        first = inner[0]
                        reply = (
                            first.get("reply")
                            or first.get("output")
                            or first.get("text")
                            or reply
                        )
                except (json.JSONDecodeError, TypeError):
                    pass

        if isinstance(reply, str):
            reply = reply.replace("\\n", "\n")
            reply = self._normalise_spacing(reply)
            reply = re.sub(r'(?<!\n)(\d+\. )', r'\n\1', reply)
            reply = re.sub(r'(?<!\n)(– )', r'\n\1', reply)

        reply = str(reply).strip() if reply else ""

        media_url = data.get("media_url") or data.get("image_url")

        return {
            "reply": reply or "No response received.",
            "media_url": media_url,
        }
