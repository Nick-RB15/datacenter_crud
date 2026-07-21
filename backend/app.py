import os
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask, jsonify, send_from_directory, request, Response
from backend.config import Config
from backend.extensions import db, migrate, jwt, cors
from backend.auth import auth_bp
from backend.courses import courses_bp
from backend.assignments import assignments_bp
from backend.events import events_bp
from backend.dashboard import dashboard_bp
from backend.models import Role, User, Course, Enrollment, Assignment, Notification
from backend.auth import get_role
from datetime import datetime, timedelta
 
 
def _seed_demo_data():
    for name in ["admin", "teacher", "student"]:
        get_role(name)

    if not User.query.filter_by(email="admin@eva.com").first():
        admin = User(
            email="admin@eva.com",
            full_name="Administrador EVA",
            role_id=Role.query.filter_by(name="admin").first().id,
        )
        admin.set_password("admin123")
        db.session.add(admin)

    if not User.query.filter_by(email="teacher@eva.com").first():
        teacher = User(
            email="teacher@eva.com",
            full_name="Profesor Demo",
            role_id=Role.query.filter_by(name="teacher").first().id,
        )
        teacher.set_password("teacher123")
        db.session.add(teacher)

    if not User.query.filter_by(email="student@eva.com").first():
        student = User(
            email="student@eva.com",
            full_name="Estudiante Demo",
            role_id=Role.query.filter_by(name="student").first().id,
        )
        student.set_password("student123")
        db.session.add(student)

    db.session.commit()

    if not Course.query.first():
        teacher = User.query.filter_by(email="teacher@eva.com").first()
        student = User.query.filter_by(email="student@eva.com").first()
        c1 = Course(
            code="PV-2026-1",
            name="Programación Visual",
            description="Curso de programación visual",
            teacher_id=teacher.id,
        )
        c2 = Course(
            code="ADC-2026-1",
            name="Administración de Data Center",
            description="Curso de data center",
            teacher_id=teacher.id,
        )
        c3 = Course(
            code="DIHM-2026-1",
            name="Diseño Interfaz Hombre Máquina",
            description="Diseño de interfaces",
            teacher_id=teacher.id,
        )
        db.session.add_all([c1, c2, c3])
        db.session.flush()

        for c in [c1, c2, c3]:
            db.session.add(Enrollment(user_id=student.id, course_id=c.id))

        now = datetime.utcnow()
        assignments = [
            Assignment(
                course_id=c1.id,
                title="Proyecto Final",
                description="Assignment is due - 2026-1 PROGRAMACIÓN VISUAL",
                due_date=now + timedelta(days=5),
            ),
            Assignment(
                course_id=c2.id,
                title="Trabajo Práctico",
                description="Assignment is due - 2026-1 ADMINISTRACIÓN DE DATA CENTER",
                due_date=now + timedelta(days=12),
            ),
            Assignment(
                course_id=c3.id,
                title="Proyecto_Final_2025-2",
                description="Assignment is due - 2026-1 DISEÑO INTERFAZ HOMBRE MAQUINA",
                due_date=now + timedelta(days=15),
            ),
        ]
        db.session.add_all(assignments)
        db.session.flush()

        for a in assignments:
            db.session.add(
                Notification(
                    user_id=student.id,
                    title="Nueva tarea",
                    message=f'Se publicó "{a.title}" en {a.course.name}',
                    read=False,
                )
            )

    db.session.commit()
 
 
def create_app(config_class=Config):
    load_dotenv(Path(__file__).resolve().parent.parent / ".env")

    static_folder = os.path.join(
        os.path.dirname(__file__), "..", "frontend", "dist"
    )
    app = Flask(__name__, static_folder=static_folder, static_url_path="")
    app.config.from_object(config_class)
 
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": "*"}})
 
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(courses_bp, url_prefix="/api/courses")
    app.register_blueprint(assignments_bp, url_prefix="/api/assignments")
    app.register_blueprint(events_bp, url_prefix="/api/events")
    app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard")
 
    with app.app_context():
        db.create_all()
        _seed_demo_data()

    @app.route("/api/health", methods=["GET"])
    def health():
        return jsonify({"status": "ok"})

    @app.route("/<path:filename>")
    def serve_static(filename):
        if filename.startswith("api/"):
            return jsonify({"error": "Recurso no encontrado"}), 404
        if "/" in filename:
            return send_from_directory(app.static_folder, filename)
        return send_from_directory(app.static_folder, filename)
 
    @app.errorhandler(404)
    def not_found(e):
        if request.path.startswith("/api/"):
            return jsonify({"error": "Recurso no encontrado"}), 404
        return send_from_directory(app.static_folder, "index.html")
 
    return app
 
 
if __name__ == "__main__":
    app = create_app()
    with app.app_context():
        db.create_all()
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=True)