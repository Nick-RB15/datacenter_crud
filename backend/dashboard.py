from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from backend.auth import get_current_user
from backend.extensions import db
from backend.models import Assignment, Course, Event, Notification
 
dashboard_bp = Blueprint("dashboard", __name__)
 
 
def _parse_dt(value):
    if not value:
        return None
    return datetime.fromisoformat(value.replace("Z", "+00:00"))
 
 
def _course_ids_for_user(user):
    if user.role.name == "admin":
        return [c.id for c in Course.query.all()]
    if user.role.name == "teacher":
        return [c.id for c in Course.query.filter_by(teacher_id=user.id).all()]
    return [e.course_id for e in user.enrollments]
 
 
@dashboard_bp.route("/timeline", methods=["GET"])
@jwt_required()
def timeline():
    user = get_current_user()
    days = int(request.args.get("days", "30"))
    now = datetime.utcnow()
    limit = now + timedelta(days=days)
    course_ids = _course_ids_for_user(user)
 
    assignments = (
        Assignment.query.filter(
            Assignment.due_date >= now,
            Assignment.due_date <= limit,
            Assignment.course_id.in_(course_ids),
        )
        .order_by(Assignment.due_date)
        .all()
    )
 
    items = []
    for a in assignments:
        items.append(
            {
                "type": "assignment",
                "id": a.id,
                "title": a.title,
                "course": a.course.name,
                "date": a.due_date.isoformat(),
                "detail": a.description or "Entrega pendiente",
            }
        )
 
    events = (
        Event.query.filter(
            Event.start >= now,
            Event.start <= limit,
            db.or_(
                Event.course_id.in_(course_ids),
                Event.course_id.is_(None),
            ),
        )
        .order_by(Event.start)
        .all()
    )
    for ev in events:
        items.append(
            {
                "type": "event",
                "id": ev.id,
                "title": ev.title,
                "course": ev.course.name if ev.course else "General",
                "date": ev.start.isoformat(),
                "detail": "Evento",
            }
        )
 
    items.sort(key=lambda x: x["date"])
    return jsonify(items[:20])
 
 
@dashboard_bp.route("/notifications", methods=["GET"])
@jwt_required()
def notifications():
    user = get_current_user()
    notifs = (
        Notification.query.filter_by(user_id=user.id)
        .order_by(Notification.created_at.desc())
        .limit(20)
        .all()
    )
    return jsonify([n.to_dict() for n in notifs])
 
 
@dashboard_bp.route("/notifications/<int:notification_id>/read", methods=["PATCH"])
@jwt_required()
def mark_read(notification_id):
    user = get_current_user()
    notif = Notification.query.filter_by(
        id=notification_id, user_id=user.id
    ).first_or_404()
    notif.read = True
    db.session.commit()
    return jsonify(notif.to_dict())
 
 
@dashboard_bp.route("/calendar", methods=["GET"])
@jwt_required()
def calendar():
    user = get_current_user()
    start = request.args.get("start")
    end = request.args.get("end")
    try:
        s = _parse_dt(start) if start else datetime.utcnow()
        e = _parse_dt(end) if end else s + timedelta(days=30)
    except ValueError:
        return jsonify({"error": "Fechas inválidas"}), 400
 
    course_ids = _course_ids_for_user(user)
    items = []
 
    assignments = Assignment.query.filter(
        Assignment.due_date >= s,
        Assignment.due_date <= e,
        Assignment.course_id.in_(course_ids),
    ).all()
    for a in assignments:
        items.append(
            {
                "type": "assignment",
                "id": a.id,
                "title": a.title,
                "start": a.due_date.isoformat(),
                "course": a.course.name,
            }
        )
 
    events = Event.query.filter(
        Event.start >= s,
        Event.start <= e,
        db.or_(Event.course_id.in_(course_ids), Event.course_id.is_(None)),
    ).all()
    for ev in events:
        items.append(
            {
                "type": "event",
                "id": ev.id,
                "title": ev.title,
                "start": ev.start.isoformat(),
                "course": ev.course.name if ev.course else "General",
            }
        )
 
    items.sort(key=lambda x: x["start"])
    return jsonify(items)
