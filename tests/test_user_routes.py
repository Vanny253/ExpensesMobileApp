# integration test
from conftest import _create_user
import io


def test_signup_creates_user_and_hashes_password(backend_app_module, client, app_ctx):
    response = client.post(
        "/signup",
        json={
            "email": "new@example.com",
            "password": "Password123",
            "nickname": "NewUser",
            "date_of_birth": "2000-01-01",
        },
    )

    body = response.get_json()
    saved = backend_app_module.User.query.filter_by(email="new@example.com").one()

    assert response.status_code == 201
    assert body["message"] == "Signup successful"
    assert saved.password != "Password123"
    assert backend_app_module.check_password_hash(saved.password, "Password123")


def test_signup_rejects_missing_required_fields(client, app_ctx):
    response = client.post("/signup", json={"email": "", "password": "", "nickname": ""})

    assert response.status_code == 400
    assert response.get_json() == {
        "message": "Email, password, and nickname are required"
    }


def test_signup_rejects_duplicate_email(backend_app_module, client, app_ctx):
    _create_user(backend_app_module, email="dup@example.com")

    response = client.post(
        "/signup",
        json={
            "email": "dup@example.com",
            "password": "Password123",
            "nickname": "Duplicate",
        },
    )

    assert response.status_code == 400
    assert response.get_json() == {"message": "Email already registered"}


def test_signup_rejects_invalid_date_of_birth(client, app_ctx):
    response = client.post(
        "/signup",
        json={
            "email": "bad-date@example.com",
            "password": "Password123",
            "nickname": "BadDate",
            "date_of_birth": "01-01-2000",
        },
    )

    assert response.status_code == 400
    assert response.get_json() == {"message": "Invalid date format, use YYYY-MM-DD"}


def test_login_returns_user_for_valid_credentials(backend_app_module, client, app_ctx):
    _create_user(backend_app_module, email="login@example.com", password="Secret123")

    response = client.post(
        "/login",
        json={"email": "login@example.com", "password": "Secret123"},
    )

    body = response.get_json()

    assert response.status_code == 200
    assert body["message"] == "Login successful"
    assert body["user"]["email"] == "login@example.com"


def test_login_rejects_invalid_credentials(backend_app_module, client, app_ctx):
    _create_user(backend_app_module, email="login@example.com", password="Secret123")

    response = client.post(
        "/login",
        json={"email": "login@example.com", "password": "wrong"},
    )

    assert response.status_code == 401
    assert response.get_json() == {"message": "Invalid email or password"}


def test_login_requires_email_and_password(client, app_ctx):
    response = client.post("/login", json={"email": "", "password": ""})

    assert response.status_code == 400
    assert response.get_json() == {"message": "Email and password are required"}


def test_get_user_returns_existing_user(backend_app_module, client, app_ctx):
    user = _create_user(backend_app_module, email="profile@example.com")

    response = client.get(f"/user/{user.user_id}")
    body = response.get_json()

    assert response.status_code == 200
    assert body["email"] == "profile@example.com"
    assert body["user_id"] == user.user_id


def test_get_user_returns_404_for_missing_user(client, app_ctx):
    response = client.get("/user/999")

    assert response.status_code == 404
    assert response.get_json() == {"message": "User not found"}


def test_update_user_updates_fields_without_file(backend_app_module, client, app_ctx):
    user = _create_user(backend_app_module, email="profile@example.com")

    response = client.put(
        f"/user/{user.user_id}",
        data={
            "nickname": "Updated",
            "phone_number": "0123456789",
            "gender": "female",
            "date_of_birth": "2001-02-03",
        },
        content_type="multipart/form-data",
    )

    backend_app_module.db.session.refresh(user)
    body = response.get_json()

    assert response.status_code == 200
    assert body["nickname"] == "Updated"
    assert user.phone_number == "0123456789"
    assert user.date_of_birth.isoformat() == "2001-02-03"


def test_update_user_saves_uploaded_profile_image(
    backend_app_module, client, app_ctx, monkeypatch
):
    user = _create_user(backend_app_module, email="upload@example.com")
    saved = {}

    def fake_save(self, dst, buffer_size=16384):
        saved["path"] = dst

    monkeypatch.setattr("werkzeug.datastructures.FileStorage.save", fake_save)

    response = client.put(
        f"/user/{user.user_id}",
        data={"profile_image": (io.BytesIO(b"fake image"), "avatar.png")},
        content_type="multipart/form-data",
    )

    backend_app_module.db.session.refresh(user)
    body = response.get_json()

    assert response.status_code == 200
    assert saved["path"].replace("\\", "/").endswith("static/uploads/avatar.png")
    assert user.profile_image.replace("\\", "/") == "static/uploads/avatar.png"
    assert body["profile_image"].replace("\\", "/").endswith("/static/uploads/avatar.png")


def test_update_user_returns_404_for_missing_user(client, app_ctx):
    response = client.put(
        "/user/999",
        data={"nickname": "Missing"},
        content_type="multipart/form-data",
    )

    assert response.status_code == 404
    assert response.get_json() == {"message": "User not found"}


def test_update_user_rejects_invalid_date(backend_app_module, client, app_ctx):
    user = _create_user(backend_app_module, email="profile@example.com")

    response = client.put(
        f"/user/{user.user_id}",
        data={"date_of_birth": "03-02-2001"},
        content_type="multipart/form-data",
    )

    assert response.status_code == 400
    assert response.get_json() == {"message": "Invalid date format"}


def test_update_user_rejects_duplicate_email(backend_app_module, client, app_ctx):
    first = _create_user(backend_app_module, email="first@example.com", nickname="First")
    _create_user(backend_app_module, email="second@example.com", nickname="Second")

    response = client.put(
        f"/user/{first.user_id}",
        data={"email": "second@example.com"},
        content_type="multipart/form-data",
    )

    assert response.status_code == 400
    assert response.get_json() == {"message": "Email already exists"}


def test_update_user_returns_500_when_file_save_fails(
    backend_app_module, client, app_ctx, monkeypatch
):
    user = _create_user(backend_app_module, email="error@example.com")

    def fail_save(self, dst, buffer_size=16384):
        raise RuntimeError("disk full")

    monkeypatch.setattr("werkzeug.datastructures.FileStorage.save", fail_save)

    response = client.put(
        f"/user/{user.user_id}",
        data={"profile_image": (io.BytesIO(b"fake image"), "avatar.png")},
        content_type="multipart/form-data",
    )

    assert response.status_code == 500
    assert response.get_json() == {"message": "Server error"}
