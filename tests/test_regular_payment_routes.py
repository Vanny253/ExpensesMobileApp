from conftest import _create_regular_payment, _create_user


def test_add_regular_payment_creates_record(backend_app_module, client, app_ctx):
    user = _create_user(backend_app_module)

    response = client.post(
        "/regular_payments",
        json={
            "user_id": user.user_id,
            "title": "Netflix",
            "type": "expense",
            "category": "entertainment",
            "frequency": "Monthly",
            "start_date": "2026-04-24",
            "amount": 45,
        },
    )

    payment = backend_app_module.RegularPayment.query.one()

    assert response.status_code == 201
    assert response.get_json() == {
        "message": "Regular payment created",
        "payment_id": payment.id,
    }
    assert float(payment.amount) == 45.0


def test_add_regular_payment_validates_missing_fields(client, app_ctx):
    response = client.post(
        "/regular_payments",
        json={"user_id": 1, "title": "Netflix", "type": "expense"},
    )

    assert response.status_code == 400
    assert response.get_json() == {"message": "Missing required fields"}


def test_add_regular_payment_rejects_invalid_date(backend_app_module, client, app_ctx):
    user = _create_user(backend_app_module)

    response = client.post(
        "/regular_payments",
        json={
            "user_id": user.user_id,
            "title": "Netflix",
            "type": "expense",
            "category": "entertainment",
            "frequency": "Monthly",
            "start_date": "24-04-2026",
            "amount": 45,
        },
    )

    assert response.status_code == 400
    assert response.get_json() == {"message": "Invalid date format"}


def test_get_regular_payments_returns_existing_payments(
    backend_app_module, client, app_ctx
):
    user = _create_user(backend_app_module)
    payment = _create_regular_payment(backend_app_module, user.user_id)

    response = client.get(f"/regular_payments/{user.user_id}")
    body = response.get_json()

    assert response.status_code == 200
    assert body == [
        {
            "id": payment.id,
            "user_id": user.user_id,
            "title": "Netflix",
            "type": "expense",
            "category": "entertainment",
            "frequency": "Monthly",
            "start_date": "2026-04-24",
            "amount": 45.0,
        }
    ]


def test_get_regular_payments_returns_empty_list_when_missing(
    backend_app_module, client, app_ctx
):
    user = _create_user(backend_app_module)

    response = client.get(f"/regular_payments/{user.user_id}")

    assert response.status_code == 200
    assert response.get_json() == []


def test_update_regular_payment_updates_existing_record(
    backend_app_module, client, app_ctx
):
    user = _create_user(backend_app_module)
    payment = _create_regular_payment(backend_app_module, user.user_id)

    response = client.put(
        f"/regular_payments/{payment.id}",
        json={
            "title": "Spotify",
            "frequency": "Yearly",
            "amount": 99.5,
            "start_date": "2026-05-01",
        },
    )

    backend_app_module.db.session.refresh(payment)

    assert response.status_code == 200
    assert response.get_json() == {
        "message": "Regular payment updated",
        "payment_id": payment.id,
    }
    assert payment.title == "Spotify"
    assert payment.frequency == "Yearly"
    assert payment.start_date.isoformat() == "2026-05-01"
    assert float(payment.amount) == 99.5


def test_update_regular_payment_rejects_invalid_date(
    backend_app_module, client, app_ctx
):
    user = _create_user(backend_app_module)
    payment = _create_regular_payment(backend_app_module, user.user_id)

    response = client.put(
        f"/regular_payments/{payment.id}",
        json={"start_date": "01-05-2026"},
    )

    assert response.status_code == 400
    assert response.get_json() == {"message": "Invalid date format"}


def test_update_regular_payment_returns_404_for_missing_record(client, app_ctx):
    response = client.put("/regular_payments/999", json={"amount": 60})

    assert response.status_code == 404
    assert response.get_json() == {"message": "Regular payment not found"}


def test_delete_regular_payment_removes_record(backend_app_module, client, app_ctx):
    user = _create_user(backend_app_module)
    payment = _create_regular_payment(backend_app_module, user.user_id)

    response = client.delete(f"/regular_payments/{payment.id}")

    assert response.status_code == 200
    assert response.get_json() == {"message": "Regular payment deleted"}
    assert backend_app_module.RegularPayment.query.get(payment.id) is None


def test_delete_regular_payment_returns_404_for_missing_record(client, app_ctx):
    response = client.delete("/regular_payments/999")

    assert response.status_code == 404
    assert response.get_json() == {"message": "Regular payment not found"}
