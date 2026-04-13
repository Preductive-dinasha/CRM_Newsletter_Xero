from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity,
    set_access_cookies,
    set_refresh_cookies,
    unset_jwt_cookies,
)
from ..services.auth_service import AuthService, AuthError

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")
_auth_service = AuthService()


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    email = data.get("email", "").strip()
    password = data.get("password", "")
    f_name = data.get("f_name", "").strip()
    l_name = data.get("l_name", "").strip()
    company = data.get("company", "")

    if not email or not password or not f_name or not l_name:
        return jsonify({"error": "email, password, f_name, and l_name are required."}), 400

    try:
        user = _auth_service.register(email, password, f_name, l_name, company or None)
    except AuthError as e:
        return jsonify({"error": str(e)}), 400

    return jsonify({"message": "Account created successfully.", "user": user.to_dict()}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    email = data.get("email", "")
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "email and password are required."}), 400

    try:
        user = _auth_service.login(email, password)
    except AuthError as e:
        return jsonify({"error": str(e)}), 401

    access_token = create_access_token(identity=str(user.user_id))
    refresh_token = create_refresh_token(identity=str(user.user_id))

    response = jsonify({"message": "Login successful.", "user": user.to_dict()})
    set_access_cookies(response, access_token)
    set_refresh_cookies(response, refresh_token)
    return response, 200


@auth_bp.route("/logout", methods=["POST"])
def logout():
    response = jsonify({"message": "Logged out."})
    unset_jwt_cookies(response)
    return response, 200


@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    user_id = get_jwt_identity()
    access_token = create_access_token(identity=user_id)
    response = jsonify({"message": "Token refreshed."})
    set_access_cookies(response, access_token)
    return response, 200


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    user_id = int(get_jwt_identity())
    user = _auth_service.get_current_user(user_id)
    if not user:
        return jsonify({"error": "User not found."}), 404
    return jsonify({"user": user.to_dict()}), 200
