from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from backend.extensions import db
 
 
class Role(db.Model):
    __tablename__ = "roles"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
 
    def to_dict(self):
        return {"id": self.id, "name": self.name}
 
 
class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    full_name = db.Column(db.String(200), nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    role_id = db.Column(db.Integer, db.ForeignKey("roles.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
 
    role = db.relationship("Role", backref="users")
    submissions = db.relationship("Submission", backref="student", lazy="dynamic")
    enrollments = db.relationship(
        "Enrollment", backref="user", lazy="dynamic", cascade="all, delete-orphan"
    )
    notifications = db.relationship(
        "Notification", backref="user", lazy="dynamic", cascade="all, delete-orphan"
    )
 
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
 
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
 
    def is_enrolled(self, course_id):
        return (
            Enrollment.query.filter_by(
                user_id=self.id, course_id=course_id
            ).first()
            is not None
        )
 
    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "full_name": self.full_name,
            "role": self.role.name if self.role else None,
            "created_at": (
                self.created_at.isoformat() if self.created_at else None
            ),
        }
 
 
class Course(db.Model):
    __tablename__ = "courses"
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(50), unique=True, nullable=False)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, default="")
    teacher_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
 
    teacher = db.relationship("User", foreign_keys=[teacher_id])
    enrollments = db.relationship(
        "Enrollment", backref="course", lazy="dynamic", cascade="all, delete-orphan"
    )
    assignments = db.relationship(
        "Assignment", backref="course", lazy="dynamic", cascade="all, delete-orphan"
    )
    events = db.relationship(
        "Event", backref="course", lazy="dynamic", cascade="all, delete-orphan"
    )
 
    def to_dict(self, include_students=False):
        data = {
            "id": self.id,
            "code": self.code,
            "name": self.name,
            "description": self.description,
            "teacher": self.teacher.full_name if self.teacher else None,
            "teacher_id": self.teacher_id,
            "created_at": (
                self.created_at.isoformat() if self.created_at else None
            ),
            "student_count": self.enrollments.count(),
        }
        if include_students:
            data["students"] = [e.user.to_dict() for e in self.enrollments]
        return data
 
 
class Enrollment(db.Model):
    __tablename__ = "enrollments"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey("courses.id"), nullable=False)
    enrolled_at = db.Column(db.DateTime, default=datetime.utcnow)
    __table_args__ = (
        db.UniqueConstraint("user_id", "course_id", name="uq_user_course"),
    )
 
 
class Assignment(db.Model):
    __tablename__ = "assignments"
    id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey("courses.id"), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, default="")
    due_date = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
 
    submissions = db.relationship(
        "Submission", backref="assignment", lazy="dynamic", cascade="all, delete-orphan"
    )
 
    def to_dict(self, include_course=False):
        data = {
            "id": self.id,
            "course_id": self.course_id,
            "title": self.title,
            "description": self.description,
            "due_date": self.due_date.isoformat() if self.due_date else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "submission_count": self.submissions.count(),
        }
        if include_course:
            data["course"] = self.course.name if self.course else None
        return data
 
 
class Submission(db.Model):
    __tablename__ = "submissions"
    id = db.Column(db.Integer, primary_key=True)
    assignment_id = db.Column(db.Integer, db.ForeignKey("assignments.id"), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    content = db.Column(db.Text, default="")
    file_url = db.Column(db.String(500), default="")
    submitted_at = db.Column(db.DateTime, default=datetime.utcnow)
    grade = db.Column(db.Float, nullable=True)
    feedback = db.Column(db.Text, default="")
 
    def to_dict(self, include_assignment=False):
        data = {
            "id": self.id,
            "assignment_id": self.assignment_id,
            "student": self.student.full_name if self.student else None,
            "student_id": self.student_id,
            "content": self.content,
            "file_url": self.file_url,
            "submitted_at": (
                self.submitted_at.isoformat() if self.submitted_at else None
            ),
            "grade": self.grade,
            "feedback": self.feedback,
        }
        if include_assignment:
            data["assignment"] = self.assignment.title if self.assignment else None
        return data
 
 
class Event(db.Model):
    __tablename__ = "events"
    id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey("courses.id"), nullable=True)
    title = db.Column(db.String(200), nullable=False)
    start = db.Column(db.DateTime, nullable=False)
    end = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
 
    def to_dict(self):
        return {
            "id": self.id,
            "course_id": self.course_id,
            "course": self.course.name if self.course else None,
            "title": self.title,
            "start": self.start.isoformat() if self.start else None,
            "end": self.end.isoformat() if self.end else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
 
 
class Notification(db.Model):
    __tablename__ = "notifications"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, default="")
    read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
 
    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "message": self.message,
            "read": self.read,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }