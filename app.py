import os
import uuid
import base64
import json
import logging
import re
from urllib.parse import urlparse, quote
import requests
import markdown
import bleach
from flask import Flask, render_template, request, jsonify, session, Response
from werkzeug.utils import secure_filename

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev-secret-key")

UPLOAD_FOLDER = "uploads"
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "bmp", "webp", "pdf", "doc", "docx", "txt", "csv", "xlsx", "xls"}
MAX_CONTENT_LENGTH = 16 * 1024 * 1024

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["MAX_CONTENT_LENGTH"] = MAX_CONTENT_LENGTH

def get_n8n_config():
    return {
        "url": os.environ.get("N8N_WEBHOOK_URL", ""),
        "token": os.environ.get("N8N_BEARER_TOKEN", ""),
    }


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def get_session_id():
    if "session_id" not in session:
        session["session_id"] = str(uuid.uuid4())
    return session["session_id"]


def file_to_base64(file_path):
    with open(file_path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")


def extract_text_from_dict(d):
    for key in ["output", "text", "message", "response", "answer", "content", "result"]:
        if key in d:
            val = d[key]
            if isinstance(val, str):
                return val
            elif isinstance(val, dict):
                nested = extract_text_from_dict(val)
                if nested:
                    return nested
    if "json" in d and isinstance(d["json"], dict):
        nested = extract_text_from_dict(d["json"])
        if nested:
            return nested
    if "data" in d and isinstance(d["data"], dict):
        nested = extract_text_from_dict(d["data"])
        if nested:
            return nested
    return None


def get_n8n_base_url():
    webhook_url = os.environ.get("N8N_WEBHOOK_URL", "")
    if webhook_url:
        parsed = urlparse(webhook_url)
        return f"{parsed.scheme}://{parsed.netloc}"
    return ""


def resolve_media_url(val, mime=None, image_id=None):
    if image_id:
        return f"/api/n8n-image?imageId={quote(image_id)}"
    if not val or not isinstance(val, str):
        return ""
    if val.startswith("data:"):
        return val
    if val.startswith("http"):
        return val
    if len(val) > 200:
        return make_data_uri(val, mime)
    return val


def make_data_uri(data_str, mime=None):
    if data_str.startswith("data:"):
        return data_str
    if mime:
        return f"data:{mime};base64,{data_str}"
    return f"data:image/png;base64,{data_str}"


def extract_media_from_dict(d):
    media = []
    if "imageId" in d and isinstance(d["imageId"], str) and d["imageId"]:
        media.append({
            "type": "image",
            "url": f"/api/n8n-image?imageId={quote(d['imageId'])}",
            "name": d.get("name", d["imageId"]),
        })
        return media
    for key in ["image", "images", "media", "files", "attachments"]:
        if key not in d:
            continue
        val = d[key]
        if isinstance(val, str):
            url = resolve_media_url(val)
            if url:
                media.append({"type": "image", "url": url})
        elif isinstance(val, list):
            for item in val:
                if isinstance(item, str):
                    url = resolve_media_url(item)
                    if url:
                        media.append({"type": "image", "url": url})
                elif isinstance(item, dict):
                    image_id = item.get("imageId")
                    raw = item.get("data", item.get("url", item.get("src", "")))
                    mime = item.get("mime", item.get("mimeType", item.get("content_type")))
                    url = resolve_media_url(raw, mime, image_id=image_id)
                    if url:
                        media.append({
                            "type": item.get("type", "image"),
                            "url": url,
                            "name": item.get("name", ""),
                        })
    return media


ALLOWED_TAGS = [
    "p", "br", "strong", "em", "b", "i", "u", "s", "del",
    "h1", "h2", "h3", "h4", "h5", "h6",
    "ul", "ol", "li", "blockquote",
    "pre", "code", "a", "img",
    "table", "thead", "tbody", "tr", "th", "td",
    "hr", "div", "span", "sub", "sup",
]
ALLOWED_ATTRS = {
    "a": ["href", "title", "target"],
    "img": ["src", "alt", "title", "width", "height"],
    "code": ["class"],
    "td": ["align"],
    "th": ["align"],
}


def render_markdown_safe(text):
    raw_html = markdown.markdown(str(text), extensions=["fenced_code", "tables", "nl2br"])
    return bleach.clean(raw_html, tags=ALLOWED_TAGS, attributes=ALLOWED_ATTRS)


def parse_n8n_response(response_data):
    if isinstance(response_data, str):
        try:
            response_data = json.loads(response_data)
        except json.JSONDecodeError:
            return {"text": render_markdown_safe(response_data), "raw_text": response_data, "media": []}

    text = ""
    media = []

    if isinstance(response_data, list):
        if len(response_data) > 0:
            first = response_data[0]
            if isinstance(first, dict):
                return parse_n8n_response(first)
            elif isinstance(first, str):
                try:
                    parsed = json.loads(first)
                    return parse_n8n_response(parsed)
                except (json.JSONDecodeError, TypeError):
                    text = str(first)
            else:
                text = str(first)
        text = text or "No response received"
        return {"text": render_markdown_safe(text), "raw_text": text, "media": []}

    if isinstance(response_data, dict):
        text = extract_text_from_dict(response_data)
        media = extract_media_from_dict(response_data)

        if not text:
            if len(response_data) == 1:
                val = list(response_data.values())[0]
                if isinstance(val, str):
                    text = val
                elif isinstance(val, dict):
                    text = extract_text_from_dict(val) or json.dumps(val, indent=2)
                else:
                    text = str(val)
            else:
                text = json.dumps(response_data, indent=2)

    if isinstance(text, dict):
        text = json.dumps(text, indent=2)

    if isinstance(text, str):
        try:
            inner = json.loads(text)
            if isinstance(inner, dict):
                extracted = extract_text_from_dict(inner)
                if extracted:
                    text = extracted
                inner_media = extract_media_from_dict(inner)
                if inner_media:
                    media = inner_media
        except (json.JSONDecodeError, TypeError):
            pass

    text = str(text) if text else "No response received"

    return {"text": render_markdown_safe(text), "raw_text": text, "media": media}


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/session", methods=["GET"])
def get_session():
    session_id = get_session_id()
    return jsonify({"session_id": session_id})


@app.route("/api/session/reset", methods=["POST"])
def reset_session():
    session["session_id"] = str(uuid.uuid4())
    return jsonify({"session_id": session["session_id"]})


@app.route("/api/chat", methods=["POST"])
def chat():
    n8n = get_n8n_config()
    if not n8n["url"]:
        return jsonify({"error": "n8n webhook URL not configured. Set N8N_WEBHOOK_URL in environment config."}), 500

    session_id = get_session_id()

    message = request.form.get("message", "")
    files = request.files.getlist("files")

    attachments = []
    for file in files:
        if file and file.filename and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            unique_name = f"{uuid.uuid4().hex}_{filename}"
            filepath = os.path.join(app.config["UPLOAD_FOLDER"], unique_name)
            file.save(filepath)

            file_ext = filename.rsplit(".", 1)[1].lower()
            is_image = file_ext in {"png", "jpg", "jpeg", "gif", "bmp", "webp"}

            attachment = {
                "filename": filename,
                "type": "image" if is_image else "document",
                "mime_type": file.content_type or "application/octet-stream",
            }

            attachment["data"] = file_to_base64(filepath)

            attachments.append(attachment)

            try:
                os.remove(filepath)
            except OSError:
                pass

    payload = {
        "sessionId": session_id,
        "message": message,
        "chatInput": message,
    }

    if attachments:
        payload["attachments"] = attachments

    headers = {
        "Content-Type": "application/json",
    }

    if n8n["token"]:
        headers["X-API-Key"] = n8n["token"]

    try:
        response = requests.post(
            n8n["url"],
            json=payload,
            headers=headers,
            timeout=120,
        )
        response.raise_for_status()

        logger.debug(f"n8n raw response status: {response.status_code}")
        logger.debug(f"n8n raw response text: {response.text[:500]}")

        try:
            response_data = response.json()
        except json.JSONDecodeError:
            response_data = response.text

        logger.debug(f"n8n parsed response_data type: {type(response_data).__name__}")
        logger.debug(f"n8n parsed response_data: {str(response_data)[:500]}")

        parsed = parse_n8n_response(response_data)
        logger.debug(f"Final parsed result: {str(parsed)[:500]}")

        return jsonify({
            "success": True,
            "response": parsed,
            "session_id": session_id,
        })

    except requests.exceptions.Timeout:
        return jsonify({"error": "Request to n8n timed out. The agent may be processing a complex task."}), 504
    except requests.exceptions.ConnectionError:
        return jsonify({"error": "Could not connect to n8n. Please check the webhook URL."}), 502
    except requests.exceptions.HTTPError as e:
        return jsonify({"error": f"n8n returned an error: {e.response.status_code}"}), e.response.status_code
    except Exception as e:
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500


@app.route("/api/n8n-image", methods=["GET"])
def proxy_n8n_image():
    image_id = request.args.get("imageId", "")
    if not image_id or len(image_id) > 200:
        return jsonify({"error": "Invalid image ID"}), 400

    n8n = get_n8n_config()
    base_url = get_n8n_base_url()
    if not base_url or not n8n["url"]:
        return jsonify({"error": "n8n not configured"}), 500

    headers = {"Content-Type": "application/json"}
    if n8n["token"]:
        headers["X-API-Key"] = n8n["token"]

    try:
        resp = requests.post(
            f"{base_url}/webhook/getimage",
            json={"imageId": image_id},
            headers=headers,
            timeout=30,
            stream=True,
        )
        resp.raise_for_status()

        content_type = resp.headers.get("Content-Type", "application/octet-stream")
        if not content_type.startswith("image/"):
            logger.warning(f"n8n image proxy got non-image content-type: {content_type}")
            return jsonify({"error": "Not an image"}), 400

        max_size = 20 * 1024 * 1024
        if len(resp.content) > max_size:
            return jsonify({"error": "Image too large"}), 413

        return Response(
            resp.content,
            content_type=content_type,
            headers={"Cache-Control": "private, max-age=3600"},
        )
    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to fetch n8n image: {e}")
        return jsonify({"error": "Failed to fetch image"}), 502


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "n8n_configured": bool(get_n8n_config()["url"]),
        "session_id": get_session_id(),
    })


if __name__ == "__main__":
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    debug = os.environ.get("FLASK_DEBUG", "true").lower() == "true"
    app.run(host="0.0.0.0", port=5000, debug=debug)
