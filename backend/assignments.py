from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from backend.extensions import db
from backend.models import Assignment, Submission, Course
from backend.auth import get_current_user
 
assignments_bp = Blueprint("assignments", __name__)
 
 
def _can_manage_assignment(user, assignment):
    if user.role.name == "admin":
        return True
    course = Course.query.get(assignment.course_id)
    return course and course.teacher_id == user.id
 
 
@assignments_bp.route("/<int:assignment_id>", methods=["GET"])
@jwt_required()
def get_assignment(assignment_id):
    assignment = Assignment.query.get_or_404(assignment_id)
    user = get_current_user()
    if user.role.name == "student" and not user.is_enrolled(assignment.course_id):
        return jsonify({"error": "No matriculado en el curso"}), 403
    return jsonify(assignment.to_dict(include_course=True))
 
 
@assignments_bp.route("/<int:assignment_id>", methods=["PUT", "DELETE"])
@jwt_required()
def update_delete_assignment(assignment_id):
    assignment = Assignment.query.get_or_404(assignment_id)
    user = get_current_user()
    if not _can_manage_assignment(user, assignment):
        return jsonify({"error": "No autorizado"}), 403
 
    if request.method == "DELETE":
        db.session.delete(assignment)
        db.session.commit()
        return jsonify({"deleted": True})
 
    data = request.get_json() or {}
    if "title" in data:
        assignment.title = data["title"].strip()
    if "description" in data:
        assignment.description = data.get("description", "")
    if "due_date" in data:
        try:
            assignment.due_date = datetime.fromisoformat(data["due_date"].replace("Z", "+00:00"))
        except ValueError:
            return jsonify({"error": "Fecha de entrega inválida"}), 400
    db.session.commit()
    return jsonify(assignment.to_dict())
 
 
@assignments_bp.route("/<int:assignment_id>/submissions", methods=["GET", "POST"])
@jwt_required()
def submissions(assignment_id):
    assignment = Assignment.query.get_or_404(assignment_id)
    user = get_current_user()
 
    if request.method == "GET":
        if user.role.name == "student":
            subs = Submission.query.filter_by(
                assignment_id=assignment.id, student_id=user.id
            ).all()
        elif user.role.name == "teacher":
            if not _can_manage_assignment(user, assignment):
                return jsonify({"error": "No autorizado"}), 403
            subs = Submission.query.filter_by(assignment_id=assignment.id).all()
        else:
            subs = Submission.query.filter_by(assignment_id=assignment.id).all()
        return jsonify([s.to_dict(include_assignment=True) for s in subs])
 
    if user.role.name != "student":
        return jsonify({"error": "Solo estudiantes pueden entregar"}), 403
    if not user.is_enrolled(assignment.course_id):
        return jsonify({"error": "No matriculado en el curso"}), 403
 
    data = request.get_json() or {}
    submission = Submission.query.filter_by(
        assignment_id=assignment.id, student_id=user.id
    ).first()
    if not submission:
        submission = Submission(assignment_id=assignment.id, student_id=user.id)
        db.session.add(submission)
    submission.content = data.get("content", "")
    submission.file_url = data.get("file_url", "")
    submission.submitted_at = datetime.utcnow()
    db.session.commit()
    return jsonify(submission.to_dict()), 201
 
 
@assignments_bp.route("/submissions/<int:submission_id>", methods=["GET", "PATCH"])
@jwt_required()
def submission_detail(submission_id):
    submission = Submission.query.get_or_404(submission_id)
    user = get_current_user()
    assignment = Assignment.query.get(submission.assignment_id)
 
    if request.method == "GET":
        if (
            user.role.name == "student"
            and submission.student_id != user.id
        ):
            return jsonify({"error": "No autorizado"}), 403
        if (
            user.role.name == "teacher"
            and not _can_manage_assignment(user, assignment)
        ):
            return jsonify({"error": "No autorizado"}), 403
        return jsonify(submission.to_dict(include_assignment=True))
 
    if user.role.name not in ("teacher", "admin"):
        return jsonify({"error": "Solo profesores o admins pueden calificar"}), 403
    if not _can_manage_assignment(user, assignment):
        return jsonify({"error": "No autorizado"}), 403
 
    data = request.get_json() or {}
    if "grade" in data:
        try:
            submission.grade = float(data["grade"])
        except (ValueError, TypeError):
            return jsonify({"error": "Calificación inválida"}), 400
    if "feedback" in data:
        submission.feedback = data.get("feedback", "")
    db.session.commit()
    return jsonify(submission.to_dict())