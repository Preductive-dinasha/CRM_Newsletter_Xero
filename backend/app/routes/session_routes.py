from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..services.session_service import SessionService, SessionError

session_bp = Blueprint("sessions", __name__, url_prefix="/api/sessions")
_session_service = SessionService()


@session_bp.route("", methods=["GET"])
@jwt_required()
def list_sessions():
    user_id = int(get_jwt_identity())
    sessions = _session_service.get_sessions(user_id)
    return jsonify({"sessions": [s.to_dict() for s in sessions]}), 200


@session_bp.route("", methods=["POST"])
@jwt_required()
def create_session():
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}
    title = data.get("title", "New Chat")
    session = _session_service.create_session(user_id, title=title)
    return jsonify(session.to_dict()), 201


@session_bp.route("/<int:session_id>", methods=["PATCH"])
@jwt_required()
def update_title(session_id: int):
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}
    title = data.get("title", "").strip()

    if not title:
        return jsonify({"error": "title is required."}), 400

    try:
        session = _session_service.update_title(session_id, title, user_id)
    except SessionError as e:
        return jsonify({"error": str(e)}), 404

    return jsonify(session.to_dict()), 200


@session_bp.route("/<int:session_id>", methods=["DELETE"])
@jwt_required()
def delete_session(session_id: int):
    user_id = int(get_jwt_identity())
    try:
        _session_service.delete_session(session_id, user_id)
    except SessionError as e:
        return jsonify({"error": str(e)}), 404
    return jsonify({"message": "Session deleted."}), 200
