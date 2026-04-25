def test_create_feedback_submits_feedback(backend_app_module, client, app_ctx):
    user = backend_app_module.User(
        email="feedback@example.com",
        password="hashed",
        nickname="FeedbackUser",
    )
    backend_app_module.db.session.add(user)
    backend_app_module.db.session.commit()

    response = client.post(
        "/api/feedback",
        json={"user_id": user.user_id, "rating": 5, "feedback": "Great app"},
    )

    saved = backend_app_module.Feedback.query.one()

    assert response.status_code == 200
    assert response.get_json() == {"message": "Feedback submitted successfully"}
    assert saved.rating == 5
    assert saved.comment == "Great app"


def test_create_feedback_requires_user_id(client, app_ctx):
    response = client.post("/api/feedback", json={"rating": 5, "feedback": "Great app"})

    assert response.status_code == 400
    assert response.get_json() == {"message": "user_id required"}


def test_create_feedback_requires_rating(client, app_ctx):
    response = client.post("/api/feedback", json={"user_id": 1, "feedback": "Great app"})

    assert response.status_code == 400
    assert response.get_json() == {"message": "rating required"}


def test_create_feedback_returns_404_for_missing_user(client, app_ctx):
    response = client.post(
        "/api/feedback",
        json={"user_id": 999, "rating": 5, "feedback": "Great app"},
    )

    assert response.status_code == 404
    assert response.get_json() == {"message": "User not found"}


def test_create_feedback_returns_500_when_commit_fails(
    backend_app_module, client, app_ctx, monkeypatch
):
    user = backend_app_module.User(
        email="feedback-error@example.com",
        password="hashed",
        nickname="FeedbackError",
    )
    backend_app_module.db.session.add(user)
    backend_app_module.db.session.commit()

    original_rollback = backend_app_module.db.session.rollback
    rolled_back = {"called": False}

    def fail_commit():
        raise RuntimeError("db write failed")

    def track_rollback():
        rolled_back["called"] = True
        return original_rollback()

    monkeypatch.setattr(backend_app_module.db.session, "commit", fail_commit)
    monkeypatch.setattr(backend_app_module.db.session, "rollback", track_rollback)

    response = client.post(
        "/api/feedback",
        json={"user_id": user.user_id, "rating": 4, "feedback": "Good"},
    )

    assert response.status_code == 500
    assert response.get_json() == {"error": "db write failed"}
    assert rolled_back["called"] is True
