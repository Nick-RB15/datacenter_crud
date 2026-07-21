from datetime import datetime, timedelta
from backend.app import create_app
from backend.extensions import db
from backend.models import Role, User, Course, Enrollment, Assignment, Notification
from backend.auth import get_role
 
 
def seed():
    app = create_app()
    with app.app_context():
        for name in ["admin", "teacher", "student"]:
            get_role(name)
 
        admin = User.query.filter_by(email="admin@eva.com").first()
        if not admin:
            admin = User(
                email="admin@eva.com",
                full_name="Administrador EVA",
                role_id=Role.query.filter_by(name="admin").first().id,
            )
            admin.set_password("admin123")
            db.session.add(admin)
 
        teacher = User.query.filter_by(email="teacher@eva.com").first()
        if not teacher:
            teacher = User(
                email="teacher@eva.com",
                full_name="Profesor Demo",
                role_id=Role.query.filter_by(name="teacher").first().id,
            )
            teacher.set_password("teacher123")
            db.session.add(teacher)
 
        student = User.query.filter_by(email="student@eva.com").first()
        if not student:
            student = User(
                email="student@eva.com",
                full_name="Estudiante Demo",
                role_id=Role.query.filter_by(name="student").first().id,
            )
            student.set_password("student123")
            db.session.add(student)
 
        db.session.commit()
 
        if not Course.query.first():
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
            db.session.commit()
 
            for c in [c1, c2, c3]:
                db.session.add(Enrollment(user_id=student.id, course_id=c.id))
            db.session.commit()
 
            now = datetime.utcnow()
            assignments = [
                Assignment(
                    course_id=c1.id,
                    title="Proyecto Final",
                    description="Assignment is due - 2026-1 PROGRAMACIÓN VISUAL, PRESENCIAL 5/1 - SOFTWARE",
                    due_date=now + timedelta(days=5),
                ),
                Assignment(
                    course_id=c2.id,
                    title="Trabajo Práctico",
                    description="Assignment is due - 2026-1 ADMINISTRACIÓN DE DATA CENTER PRESENCIAL 5/1 - SOFTWARE",
                    due_date=now + timedelta(days=12),
                ),
                Assignment(
                    course_id=c3.id,
                    title="Proyecto_Final_2025-2",
                    description="Assignment is due - 2026-1 DISEÑO INTERFAZ HOMBRE MAQUINA PRESENCIAL 5/1 - SOFTWARE",
                    due_date=now + timedelta(days=15),
                ),
            ]
            db.session.add_all(assignments)
            db.session.commit()
 
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
 
        print("Seed completado")
 
 
if __name__ == "__main__":
    seed()