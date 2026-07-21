from functools import wraps
from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt_identity,
    verify_jwt_in_request,
)
from backend.extensions import db
from backend.models import User, Role
 
auth_bp = Blueprint("auth", __name__)
 
 
def get_current_user():
    identity = get_jwt_identity()
    if identity:
        try:
            return db.session.get(User, int(identity))
        except (ValueError, TypeError):
            return None
    return None
 
 
def role_required(*roles):
    def decorator(fn):
        @wraps(fn)
        @jwt_required()
        def wrapper(*args, **kwargs):
            user = get_current_user()
            if not user or user.role.name not in roles:
                return jsonify({"error": "No tienes permiso para esta acción"}), 403
            return fn(*args, **kwargs)
 
        return wrapper
 
    return decorator
 
 
def get_role(name):
    role = Role.query.filter_by(name=name).first()
    if not role:
        role = Role(name=name)
        db.session.add(role)
        db.session.commit()
    return role
 
 
@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    full_name = (data.get("full_name") or "").strip()
    password = data.get("password") or ""
 
    requested = (data.get("role") or "student").lower()
    if requested not in ("student", "teacher", "admin"):
        requested = "student"
 
    # The first registered user becomes admin; after that only admins can assign roles.
    if User.query.first() is None:
        role_name = "admin"
    else:
        role_name = "student"
        try:
            verify_jwt_in_request(optional=True)
            current_user = get_current_user()
            if current_user and current_user.role.name == "admin":
                role_name = requested
        except Exception:
            pass
 
    if not email or not full_name or len(password) < 6:
        return (
            jsonify(
                {
                    "error": "Email, nombre y contraseña "
                    "(mínimo 6 caracteres) son obligatorios"
                }
            ),
            400,
        )
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "El email ya está registrado"}), 400
 
    role = get_role(role_name)
    user = User(email=email, full_name=full_name, role_id=role.id)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
 
    token = create_access_token(identity=str(user.id))
    return jsonify({"access_token": token, "user": user.to_dict()}), 201
 
 
@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "Credenciales inválidas"}), 401
 
    token = create_access_token(identity=str(user.id))
    return jsonify({"access_token": token, "user": user.to_dict()})
 
 
@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    user = get_current_user()
    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404
    return jsonify(user.to_dict())
 
 
@auth_bp.route("/users", methods=["GET"])
@role_required("admin")
def list_users():
    users = User.query.order_by(User.created_at.desc()).all()
    return jsonify([u.to_dict() for u in users])
 
 
@auth_bp.route("/users/<int:user_id>/role", methods=["PATCH"])
@role_required("admin")
def change_role(user_id):
    data = request.get_json() or {}
    role_name = data.get("role")
    if role_name not in ("student", "teacher", "admin"):
        return jsonify({"error": "Rol inválido"}), 400
    user = User.query.get_or_404(user_id)
    role = get_role(role_name)
    user.role_id = role.id
    db.session.commit()
    return jsonify(user.to_dict())