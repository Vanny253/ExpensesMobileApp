from conftest import _create_expense, _create_user


def test_add_expense_creates_record_successfully(backend_app_module, client, app_ctx):
    user = _create_user(backend_app_module)

    response = client.post(
        "/expense",
        json={
            "user_id": user.user_id,
            "title": "Lunch",
            "amount": 12.5,
            "category": "food",
            "date": "2026-04-24",
        },
    )

    body = response.get_json()
    saved = backend_app_module.Expense.query.one()

    assert response.status_code == 201
    assert body["message"] == "Expense added"
    assert body["expense"]["title"] == "Lunch"
    assert saved.category == "food"


def test_add_expense_validates_missing_fields(client, app_ctx):
    response = client.post("/expense", json={"title": "Lunch"})

    assert response.status_code == 400
    assert response.get_json() == {"message": "Missing required fields"}


def test_add_expense_validates_date_format(backend_app_module, client, app_ctx):
    user = _create_user(backend_app_module)

    response = client.post(
        "/expense",
        json={
            "user_id": user.user_id,
            "title": "Lunch",
            "amount": 12.5,
            "category": "food",
            "date": "24-04-2026",
        },
    )

    assert response.status_code == 400
    assert response.get_json() == {"message": "Invalid date format, use YYYY-MM-DD"}


def test_get_expenses_returns_user_expenses_in_descending_date_order(
    backend_app_module, client, app_ctx
):
    user = _create_user(backend_app_module)
    _create_expense(backend_app_module, user.user_id, title="Old", date_str="2026-04-01")
    _create_expense(backend_app_module, user.user_id, title="New", date_str="2026-04-20")

    response = client.get(f"/expense/{user.user_id}")
    body = response.get_json()

    assert response.status_code == 200
    assert [item["title"] for item in body] == ["New", "Old"]


def test_get_expenses_returns_empty_list_when_user_has_no_records(
    backend_app_module, client, app_ctx
):
    user = _create_user(backend_app_module)

    response = client.get(f"/expense/{user.user_id}")

    assert response.status_code == 200
    assert response.get_json() == []


def test_update_expense_updates_existing_record(backend_app_module, client, app_ctx):
    user = _create_user(backend_app_module)
    expense = _create_expense(backend_app_module, user.user_id)

    response = client.put(
        f"/expense/{expense.id}",
        json={"title": "Dinner", "amount": 25.0, "date": "2026-04-30"},
    )

    backend_app_module.db.session.refresh(expense)
    body = response.get_json()

    assert response.status_code == 200
    assert body["expense"]["title"] == "Dinner"
    assert expense.amount == 25.0
    assert expense.date.isoformat() == "2026-04-30"


def test_update_expense_returns_404_for_missing_record(client, app_ctx):
    response = client.put("/expense/999", json={"title": "Dinner"})

    assert response.status_code == 404
    assert response.get_json() == {"message": "Expense not found"}


def test_update_expense_rejects_invalid_date_for_existing_record(
    backend_app_module, client, app_ctx
):
    user = _create_user(backend_app_module)
    expense = _create_expense(backend_app_module, user.user_id)

    response = client.put(f"/expense/{expense.id}", json={"date": "30-04-2026"})

    assert response.status_code == 400
    assert response.get_json() == {"message": "Invalid date format"}


def test_delete_expense_removes_record(backend_app_module, client, app_ctx):
    user = _create_user(backend_app_module)
    expense = _create_expense(backend_app_module, user.user_id)

    response = client.delete(f"/expense/{expense.id}")

    assert response.status_code == 200
    assert response.get_json() == {"message": "Expense deleted"}
    assert backend_app_module.Expense.query.get(expense.id) is None


def test_delete_expense_returns_404_for_missing_record(client, app_ctx):
    response = client.delete("/expense/999")

    assert response.status_code == 404
    assert response.get_json() == {"message": "Expense not found"}
