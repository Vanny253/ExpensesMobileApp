from conftest import _create_budget, _create_expense, _create_monthly_budget, _create_user


def test_add_budget_creates_record_and_normalizes_default_category(
    backend_app_module, client, app_ctx
):
    user = _create_user(backend_app_module)

    response = client.post(
        "/budget",
        json={
            "user_id": user.user_id,
            "category": "default-1",
            "amount": 500,
            "month": 4,
            "year": 2026,
        },
    )

    body = response.get_json()

    assert response.status_code == 201
    assert body["category"] == "food"
    assert backend_app_module.Budget.query.one().category == "food"


def test_add_budget_validates_missing_fields(client, app_ctx):
    response = client.post("/budget", json={"user_id": 1, "category": "food"})

    assert response.status_code == 400
    assert response.get_json() == {"message": "Missing required fields"}


def test_get_budgets_returns_budget_with_spent_and_remaining(
    backend_app_module, client, app_ctx
):
    user = _create_user(backend_app_module)
    _create_budget(backend_app_module, user.user_id, category="food", amount=500)
    _create_expense(backend_app_module, user.user_id, category="food", amount=120)

    response = client.get(f"/budget/{user.user_id}")
    body = response.get_json()

    assert response.status_code == 200
    assert body[0]["budget"] == 500.0
    assert body[0]["spent"] == 120.0
    assert body[0]["remaining"] == 380.0


def test_get_budgets_returns_empty_list_when_user_has_no_budgets(
    backend_app_module, client, app_ctx
):
    user = _create_user(backend_app_module)

    response = client.get(f"/budget/{user.user_id}")

    assert response.status_code == 200
    assert response.get_json() == []


def test_update_budget_updates_amount(backend_app_module, client, app_ctx):
    user = _create_user(backend_app_module)
    budget = _create_budget(backend_app_module, user.user_id)

    response = client.put(f"/budget/{budget.id}", json={"amount": 900})

    backend_app_module.db.session.refresh(budget)

    assert response.status_code == 200
    assert budget.amount == 900


def test_update_budget_requires_amount(backend_app_module, client, app_ctx):
    user = _create_user(backend_app_module)
    budget = _create_budget(backend_app_module, user.user_id)

    response = client.put(f"/budget/{budget.id}", json={})

    assert response.status_code == 400
    assert response.get_json() == {"message": "Amount is required"}


def test_update_budget_returns_404_for_missing_record(client, app_ctx):
    response = client.put("/budget/999", json={"amount": 900})

    assert response.status_code == 404
    assert response.get_json() == {"message": "Budget not found"}


def test_delete_budget_removes_record(backend_app_module, client, app_ctx):
    user = _create_user(backend_app_module)
    budget = _create_budget(backend_app_module, user.user_id)

    response = client.delete(f"/budget/{budget.id}")

    assert response.status_code == 200
    assert response.get_json() == {"message": "Budget deleted"}
    assert backend_app_module.Budget.query.get(budget.id) is None


def test_delete_budget_returns_404_for_missing_record(client, app_ctx):
    response = client.delete("/budget/999")

    assert response.status_code == 404
    assert response.get_json() == {"message": "Budget not found"}


def test_set_monthly_budget_creates_and_updates_existing_budget(
    backend_app_module, client, app_ctx
):
    user = _create_user(backend_app_module)

    create_response = client.post(
        "/monthly-budget",
        json={"user_id": user.user_id, "amount": 1500, "month": 4, "year": 2026},
    )
    update_response = client.post(
        "/monthly-budget",
        json={"user_id": user.user_id, "amount": 1800, "month": 4, "year": 2026},
    )

    budget = backend_app_module.MonthlyBudget.query.one()

    assert create_response.status_code == 201
    assert create_response.get_json() == {"message": "Created"}
    assert update_response.status_code == 200
    assert update_response.get_json() == {"message": "Updated"}
    assert budget.amount == 1800


def test_set_monthly_budget_validates_missing_fields(client, app_ctx):
    response = client.post("/monthly-budget", json={"user_id": 1, "amount": 1000})

    assert response.status_code == 400
    assert response.get_json() == {"message": "Missing required fields"}


def test_get_monthly_budget_returns_existing_budget(backend_app_module, client, app_ctx):
    user = _create_user(backend_app_module)
    budget = _create_monthly_budget(backend_app_module, user.user_id, amount=1500)

    response = client.get(f"/monthly-budget/{user.user_id}?month=4&year=2026")
    body = response.get_json()

    assert response.status_code == 200
    assert body["id"] == budget.id
    assert body["amount"] == 1500.0


def test_get_monthly_budget_returns_zero_when_missing(backend_app_module, client, app_ctx):
    user = _create_user(backend_app_module)

    response = client.get(f"/monthly-budget/{user.user_id}?month=4&year=2026")

    assert response.status_code == 200
    assert response.get_json() == {"amount": 0}


def test_get_monthly_budget_uses_current_month_and_year_when_query_missing(
    backend_app_module, client, app_ctx
):
    user = _create_user(backend_app_module)
    budget = _create_monthly_budget(backend_app_module, user.user_id, amount=1700)

    response = client.get(f"/monthly-budget/{user.user_id}")
    body = response.get_json()

    assert response.status_code == 200
    assert body["id"] == budget.id
    assert body["amount"] == 1700.0


def test_update_monthly_budget_updates_amount(backend_app_module, client, app_ctx):
    user = _create_user(backend_app_module)
    budget = _create_monthly_budget(backend_app_module, user.user_id, amount=1500)

    response = client.put(f"/monthly-budget/{budget.id}", json={"amount": 2000})

    backend_app_module.db.session.refresh(budget)

    assert response.status_code == 200
    assert response.get_json() == {"message": "Updated"}
    assert budget.amount == 2000


def test_update_monthly_budget_returns_404_for_missing_record(client, app_ctx):
    response = client.put("/monthly-budget/999", json={"amount": 2000})

    assert response.status_code == 404
    assert response.get_json() == {"message": "Not found"}
