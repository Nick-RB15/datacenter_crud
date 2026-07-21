def test_health(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json["status"] == "ok"


def test_app_seed_demo_data_on_first_start(client):
    from backend.models import User, Role

    assert Role.query.filter_by(name="admin").first() is not None
    assert User.query.filter_by(email="admin@eva.com").first() is not None
    assert User.query.filter_by(email="teacher@eva.com").first() is not None
    assert User.query.filter_by(email="student@eva.com").first() is not None


def _register(client, email, full_name, password, role=None, token=None):
    payload = {"email": email, "full_name": full_name, "password": password}
    if role:
        payload["role"] = role
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    return client.post("/api/auth/register", json=payload, headers=headers)
 
 
def _login(client, email, password):
    return client.post(
        "/api/auth/login", json={"email": email, "password": password}
    ).json["access_token"]
 
 
def test_first_user_becomes_admin(client):
    r = _register(client, "first@eva.com", "First User", "first123")
    assert r.status_code == 201
    assert r.json["user"]["role"] == "admin"
 
 
def test_public_register_defaults_to_student_after_admin_exists(client):
    _register(client, "admin@eva.com", "Admin", "admin123")
    r = _register(
        client,
        "hacker@eva.com",
        "Hacker",
        "hacker12",
        role="admin",
    )
    assert r.status_code == 201
    assert r.json["user"]["role"] == "student"
 
 
def test_register_and_login(client):
    admin_token = _register(
        client, "admin@eva.com", "Admin", "admin123"
    ).json["access_token"]
 
    r = _register(
        client,
        "student@eva.com",
        "Student",
        "student123",
        role="student",
        token=admin_token,
    )
    assert r.status_code == 201
    assert r.json["user"]["role"] == "student"
 
    token = _login(client, "student@eva.com", "student123")
    r = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert r.json["email"] == "student@eva.com"
 
 
def test_admin_can_create_teacher_and_course(client):
    admin_token = _register(
        client, "admin@eva.com", "Admin", "admin123"
    ).json["access_token"]
 
    r = _register(
        client,
        "teacher@eva.com",
        "Teacher",
        "teacher123",
        role="teacher",
        token=admin_token,
    )
    assert r.status_code == 201
    assert r.json["user"]["role"] == "teacher"
 
    teacher_token = _login(client, "teacher@eva.com", "teacher123")
 
    r = client.post(
        "/api/courses",
        json={"code": "TEST-101", "name": "Test Course"},
        headers={"Authorization": f"Bearer {teacher_token}"},
    )
    assert r.status_code == 201
    assert r.json["name"] == "Test Course"
 
 
def test_role_protection(client):
    admin_token = _register(
        client, "admin@eva.com", "Admin", "admin123"
    ).json["access_token"]
    student_token = _register(
        client,
        "student2@eva.com",
        "Student",
        "student123",
        role="student",
        token=admin_token,
    ).json["access_token"]
 
    r = client.get(
        "/api/auth/users", headers={"Authorization": f"Bearer {student_token}"}
    )
    assert r.status_code == 403
 
    r = client.post(
        "/api/courses",
        json={"code": "TEST-102", "name": "Test"},
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert r.status_code == 403