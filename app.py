import os
import uuid
import base64
import json
import requests
import markdown
import bleach
from flask import Flask, render_template, request, jsonify, session
from werkzeug.utils import secure_filename

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


def parse_n8n_response(response_data):
    if isinstance(response_data, str):
        try:
            response_data = json.loads(response_data)
        except json.JSONDecodeError:
            return {"text": response_data, "media": []}

    text = ""
    media = []

    if isinstance(response_data, dict):
        text = response_data.get("output", response_data.get("text", response_data.get("message", response_data.get("response", ""))))

        if not text and len(response_data) == 1:
            text = str(list(response_data.values())[0])

        for key in ["image", "images", "media", "files", "attachments"]:
            if key in response_data:
                val = response_data[key]
                if isinstance(val, str):
                    media.append({"type": "image", "url": val})
                elif isinstance(val, list):
                    for item in val:
                        if isinstance(item, str):
                            media.append({"type": "image", "url": item})
                        elif isinstance(item, dict):
                            media.append({
                                "type": item.get("type", "image"),
                                "url": item.get("url", item.get("src", "")),
                                "name": item.get("name", ""),
                            })

    elif isinstance(response_data, list):
        if len(response_data) > 0:
            first = response_data[0]
            if isinstance(first, dict):
                return parse_n8n_response(first)
            else:
                text = str(first)

    if isinstance(text, dict):
        text = json.dumps(text, indent=2)

    raw_html = markdown.markdown(str(text), extensions=["fenced_code", "tables", "nl2br"])

    allowed_tags = [
        "p", "br", "strong", "em", "b", "i", "u", "s", "del",
        "h1", "h2", "h3", "h4", "h5", "h6",
        "ul", "ol", "li", "blockquote",
        "pre", "code", "a", "img",
        "table", "thead", "tbody", "tr", "th", "td",
        "hr", "div", "span", "sub", "sup",
    ]
    allowed_attrs = {
        "a": ["href", "title", "target"],
        "img": ["src", "alt", "title", "width", "height"],
        "code": ["class"],
        "td": ["align"],
        "th": ["align"],
    }

    html_text = bleach.clean(raw_html, tags=allowed_tags, attributes=allowed_attrs)

    return {"text": html_text, "raw_text": str(text), "media": media}


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

        try:
            response_data = response.json()
        except json.JSONDecodeError:
            response_data = response.text

        parsed = parse_n8n_response(response_data)

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
