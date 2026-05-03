# integration test
from conftest import _create_income, _create_user


def test_add_income_creates_record_successfully(backend_app_module, client, app_ctx):
    user = _create_user(backend_app_module)

    response = client.post(
        "/income",
        json={
            "user_id": user.user_id,
            "title": "Salary",
            "amount": 2000,
            "category": "salary",
            "date": "2026-04-24",
        },
    )

    body = response.get_json()

    assert response.status_code == 201
    assert body["message"] == "Income added"
    assert backend_app_module.Income.query.one().title == "Salary"


def test_add_income_validates_missing_fields(client, app_ctx):
    response = client.post("/income", json={"title": "Salary"})

    assert response.status_code == 400
    assert response.get_json() == {"message": "Missing required fields"}


def test_add_income_validates_date_format(backend_app_module, client, app_ctx):
    user = _create_user(backend_app_module)

    response = client.post(
        "/income",
        json={
            "user_id": user.user_id,
            "title": "Salary",
            "amount": 2000,
            "category": "salary",
            "date": "24-04-2026",
        },
    )

    assert response.status_code == 400
    assert response.get_json() == {"message": "Invalid date format, use YYYY-MM-DD"}


def test_get_income_returns_user_records(backend_app_module, client, app_ctx):
    user = _create_user(backend_app_module)
    _create_income(backend_app_module, user.user_id, title="Bonus", date_str="2026-04-15")
    _create_income(backend_app_module, user.user_id, title="Salary", date_str="2026-04-20")

    response = client.get(f"/income/{user.user_id}")
    body = response.get_json()

    assert response.status_code == 200
    assert [item["title"] for item in body] == ["Salary", "Bonus"]


def test_get_income_returns_empty_list_when_user_has_no_records(
    backend_app_module, client, app_ctx
):
    user = _create_user(backend_app_module)

    response = client.get(f"/income/{user.user_id}")

    assert response.status_code == 200
    assert response.get_json() == []


def test_update_income_updates_existing_record(backend_app_module, client, app_ctx):
    user = _create_user(backend_app_module)
    income = _create_income(backend_app_module, user.user_id)

    response = client.put(
        f"/income/{income.id}",
        json={"title": "Adjusted Salary", "amount": 2500},
    )

    backend_app_module.db.session.refresh(income)

    assert response.status_code == 200
    assert response.get_json()["income"]["title"] == "Adjusted Salary"
    assert income.amount == 2500


def test_update_income_returns_404_for_missing_record(client, app_ctx):
    response = client.put("/income/999", json={"amount": 2500})

    assert response.status_code == 404
    assert response.get_json() == {"message": "Income not found"}


def test_update_income_rejects_invalid_date_for_existing_record(
    backend_app_module, client, app_ctx
):
    user = _create_user(backend_app_module)
    income = _create_income(backend_app_module, user.user_id)

    response = client.put(f"/income/{income.id}", json={"date": "30-04-2026"})

    assert response.status_code == 400
    assert response.get_json() == {"message": "Invalid date format, use YYYY-MM-DD"}


def test_delete_income_removes_record(backend_app_module, client, app_ctx):
    user = _create_user(backend_app_module)
    income = _create_income(backend_app_module, user.user_id)

    response = client.delete(f"/income/{income.id}")

    assert response.status_code == 200
    assert response.get_json() == {"message": "Income deleted"}
    assert backend_app_module.db.session.get(backend_app_module.Income, income.id) is None


def test_delete_income_returns_404_for_missing_record(client, app_ctx):
    response = client.delete("/income/999")

    assert response.status_code == 404
    assert response.get_json() == {"message": "Income not found"}
