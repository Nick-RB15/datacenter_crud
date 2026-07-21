from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from backend.extensions import db
from backend.models import Course, Enrollment, Assignment, User
from backend.auth import get_current_user, role_required
 
courses_bp = Blueprint("courses", __name__)
 
 
@courses_bp.route("", methods=["GET"])
@jwt_required()
def list_courses():
    user = get_current_user()
    q = (request.args.get("q") or "").strip().lower()
    query = Course.query
    if q:
        query = query.filter(
            db.or_(Course.name.ilike(f"%{q}%"), Course.code.ilike(f"%{q}%"))
        )
    if user.role.name == "teacher":
        query = query.filter_by(teacher_id=user.id)
    courses = query.order_by(Course.created_at.desc()).all()
    return jsonify([c.to_dict() for c in courses])
 
 
@courses_bp.route("", methods=["POST"])
@role_required("teacher", "admin")
def create_course():
    data = request.get_json(silent=True) or {}
    code = (data.get("code") or "").strip()
    name = (data.get("name") or "").strip()
    if not code or not name:
        return jsonify({"error": "Código y nombre son obligatorios"}), 400
    if Course.query.filter_by(code=code).first():
        return jsonify({"error": "El código de curso ya existe"}), 400
 
    course = Course(
        code=code,
        name=name,
        description=data.get("description", ""),
        teacher_id=get_current_user().id,
    )
    db.session.add(course)
    db.session.commit()
    return jsonify(course.to_dict()), 201
 
 
@courses_bp.route("/<int:course_id>", methods=["GET"])
@jwt_required()
def get_course(course_id):
    course = Course.query.get_or_404(course_id)
    include = request.args.get("students", "false").lower() == "true"
    return jsonify(course.to_dict(include_students=include))
 
 
@courses_bp.route("/<int:course_id>", methods=["PUT", "DELETE"])
@jwt_required()
def update_or_delete_course(course_id):
    course = Course.query.get_or_404(course_id)
    user = get_current_user()
    if user.role.name != "admin" and course.teacher_id != user.id:
        return jsonify({"error": "No autorizado"}), 403
 
    if request.method == "DELETE":
        db.session.delete(course)
        db.session.commit()
        return jsonify({"deleted": True})
 
    data = request.get_json() or {}
    if "name" in data:
        course.name = data["name"].strip()
    if "description" in data:
        course.description = data.get("description", "")
    db.session.commit()
    return jsonify(course.to_dict())
 
 
@courses_bp.route("/<int:course_id>/enroll", methods=["POST"])
@jwt_required()
def enroll(course_id):
    user = get_current_user()
    course = Course.query.get_or_404(course_id)
    if Enrollment.query.filter_by(user_id=user.id, course_id=course.id).first():
        return jsonify({"error": "Ya estás matriculado en este curso"}), 400
    enrollment = Enrollment(user_id=user.id, course_id=course.id)
    db.session.add(enrollment)
    db.session.commit()
    return jsonify({"enrolled": True})
 
 
@courses_bp.route("/<int:course_id>/assignments", methods=["GET", "POST"])
@jwt_required()
def course_assignments(course_id):
    course = Course.query.get_or_404(course_id)
    if request.method == "GET":
        assignments = (
            Assignment.query.filter_by(course_id=course_id)
            .order_by(Assignment.due_date)
            .all()
        )
        return jsonify([a.to_dict() for a in assignments])
 
    user = get_current_user()
    if user.role.name != "admin" and course.teacher_id != user.id:
        return jsonify({"error": "No autorizado"}), 403
 
    data = request.get_json() or {}
    title = (data.get("title") or "").strip()
    due = data.get("due_date")
    if not title or not due:
        return jsonify({"error": "Título y fecha de entrega obligatorios"}), 400
    try:
        due_dt = datetime.fromisoformat(due.replace("Z", "+00:00"))
    except ValueError:
        return jsonify({"error": "Formato de fecha inválido"}), 400
 
    assignment = Assignment(
        course_id=course.id,
        title=title,
        description=data.get("description", ""),
        due_date=due_dt,
    )
    db.session.add(assignment)
    db.session.commit()
    return jsonify(assignment.to_dict()), 201