import os
from flask import Blueprint, request, jsonify, send_from_directory, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..services.chat_service import ChatService, ChatError
from ..services.file_service import FileService, FileError

chat_bp = Blueprint("chat", __name__, url_prefix="/api")
_chat_service = ChatService()
_file_service = FileService()


@chat_bp.route("/chat/<int:session_id>", methods=["POST"])
@jwt_required()
def send_message(session_id: int):
    user_id = int(get_jwt_identity())
    file_url = None

    if request.content_type and "multipart" in request.content_type:
        message = (request.form.get("message") or "").strip()
        agent = request.form.get("skill") or request.form.get("agent") or None
        if "file" in request.files:
            try:
                file_url = _file_service.save_file(request.files["file"])
            except FileError as e:
                return jsonify({"error": str(e)}), 400
    else:
        data = request.get_json(silent=True) or {}
        message = (data.get("message") or "").strip()
        agent = data.get("skill") or data.get("agent") or None
        file_url = data.get("file_url") or None

    if not message and not file_url:
        return jsonify({"error": "message or file is required."}), 400

    try:
        result = _chat_service.send_message(
            user_id=user_id,
            session_id=session_id,
            message=message,
            agent=agent,
            file_url=file_url,
        )
    except ChatError as e:
        return jsonify({"error": str(e)}), 400

    if file_url:
        result["file_url"] = file_url
    return jsonify(result), 200


@chat_bp.route("/chat/<int:session_id>/history", methods=["GET"])
@jwt_required()
def get_history(session_id: int):
    user_id = int(get_jwt_identity())
    try:
        history = _chat_service.get_history_for_user(session_id, user_id)
    except ChatError as e:
        return jsonify({"error": str(e)}), 403
    return jsonify({"history": [h.to_dict() for h in history]}), 200


@chat_bp.route("/upload", methods=["POST"])
@jwt_required()
def upload_file():
    if "file" not in request.files:
        return jsonify({"error": "No file in request."}), 400

    file = request.files["file"]
    try:
        file_url = _file_service.save_file(file)
    except FileError as e:
        return jsonify({"error": str(e)}), 400

    return jsonify({"file_url": file_url}), 201


@chat_bp.route("/uploads/<path:filename>", methods=["GET"])
def serve_upload(filename: str):
    upload_folder = current_app.config.get("UPLOAD_FOLDER", "uploads")
    return send_from_directory(os.path.abspath(upload_folder), filename)
