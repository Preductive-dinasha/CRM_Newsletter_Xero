from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import bcrypt
from ..repositories.user_repository import UserRepository
from ..services.auth_service import AuthService

user_bp = Blueprint("users", __name__, url_prefix="/api/users")
_user_repo = UserRepository()
_auth_service = AuthService()


@user_bp.route("/me", methods=["GET"])
@jwt_required()
def get_me():
    user_id = int(get_jwt_identity())
    user = _user_repo.find_by_id(user_id)
    if not user:
        return jsonify({"error": "User not found."}), 404
    return jsonify({"user": user.to_dict()}), 200


@user_bp.route("/me", methods=["PATCH"])
@jwt_required()
def update_me():
    user_id = int(get_jwt_identity())
    user = _user_repo.find_by_id(user_id)
    if not user:
        return jsonify({"error": "User not found."}), 404

    data = request.get_json(silent=True) or {}
    allowed_fields = {}

    if "f_name" in data and data["f_name"].strip():
        allowed_fields["f_name"] = data["f_name"].strip()
    if "l_name" in data and data["l_name"].strip():
        allowed_fields["l_name"] = data["l_name"].strip()
    if "company" in data:
        allowed_fields["company"] = data["company"].strip() if data["company"] else None
    if "password" in data and data["password"]:
        valid, msg = _auth_service.validate_password(data["password"])
        if not valid:
            return jsonify({"error": msg}), 400
        allowed_fields["password"] = bcrypt.generate_password_hash(data["password"]).decode("utf-8")

    _user_repo.update(user, **allowed_fields)
    return jsonify({"user": user.to_dict()}), 200
