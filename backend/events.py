from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from backend.extensions import db
from backend.models import Event, Course
from backend.auth import get_current_user
 
events_bp = Blueprint("events", __name__)
 
 
def _course_ids_for_user(user):
    if user.role.name == "admin":
        return [c.id for c in Course.query.all()]
    if user.role.name == "teacher":
        return [c.id for c in Course.query.filter_by(teacher_id=user.id).all()]
    return [e.course_id for e in user.enrollments]
 
 
def _parse_dt(value):
    if not value:
        return None
    return datetime.fromisoformat(value.replace("Z", "+00:00"))
 
 
@events_bp.route("", methods=["GET"])
@jwt_required()
def list_events():
    user = get_current_user()
    start = request.args.get("start")
    end = request.args.get("end")
    course_ids = _course_ids_for_user(user)
    query = Event.query.filter(
        db.or_(Event.course_id.in_(course_ids), Event.course_id.is_(None))
    )
    if start and end:
        try:
            s = _parse_dt(start)
            e = _parse_dt(end)
            query = query.filter(Event.start >= s, Event.start <= e)
        except ValueError:
            pass
    events = query.order_by(Event.start).all()
    return jsonify([ev.to_dict() for ev in events])
 
 
@events_bp.route("", methods=["POST"])
@jwt_required()
def create_event():
    user = get_current_user()
    data = request.get_json() or {}
    course_id = data.get("course_id")
    if course_id:
        course = Course.query.get_or_404(course_id)
        if user.role.name != "admin" and course.teacher_id != user.id:
            return jsonify({"error": "No autorizado"}), 403
 
    title = (data.get("title") or "").strip()
    start = data.get("start")
    if not title or not start:
        return jsonify({"error": "Título y fecha de inicio obligatorios"}), 400
    try:
        start_dt = datetime.fromisoformat(start.replace("Z", "+00:00"))
    except ValueError:
        return jsonify({"error": "Fecha de inicio inválida"}), 400
 
    end_dt = None
    if data.get("end"):
        try:
            end_dt = datetime.fromisoformat(data["end"].replace("Z", "+00:00"))
        except ValueError:
            return jsonify({"error": "Fecha de finalización inválida"}), 400
 
    event = Event(
        course_id=course_id, title=title, start=start_dt, end=end_dt
    )
    db.session.add(event)
    db.session.commit()
    return jsonify(event.to_dict()), 201