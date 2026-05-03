# integration test
from conftest import _create_budget, _create_expense, _create_income, _create_user


def test_get_monthly_report_returns_expense_income_and_balance(
    backend_app_module, client, app_ctx
):
    user = _create_user(backend_app_module)
    _create_expense(backend_app_module, user.user_id, amount=120, date_str="2026-04-10")
    _create_income(backend_app_module, user.user_id, amount=500, date_str="2026-04-12")

    response = client.get(f"/report/monthly/{user.user_id}?month=4&year=2026")

    assert response.status_code == 200
    assert response.get_json() == {"expenses": 120.0, "income": 500.0, "balance": 380.0}


def test_get_monthly_report_returns_zero_values_when_no_data(
    backend_app_module, client, app_ctx
):
    user = _create_user(backend_app_module)

    response = client.get(f"/report/monthly/{user.user_id}?month=4&year=2026")

    assert response.status_code == 200
    assert response.get_json() == {"expenses": 0.0, "income": 0.0, "balance": 0.0}


def test_get_monthly_budgets_returns_budget_breakdown_for_month(
    backend_app_module, client, app_ctx
):
    user = _create_user(backend_app_module)
    budget = _create_budget(backend_app_module, user.user_id, category="food", amount=500)
    _create_expense(backend_app_module, user.user_id, category="food", amount=200)

    response = client.get(f"/budget/monthly/{user.user_id}?month=4&year=2026")
    body = response.get_json()

    assert response.status_code == 200
    assert body[0]["id"] == budget.id
    assert body[0]["spent"] == 200.0
    assert body[0]["remaining"] == 300.0


def test_get_monthly_budgets_returns_empty_list_when_no_budgets(
    backend_app_module, client, app_ctx
):
    user = _create_user(backend_app_module)

    response = client.get(f"/budget/monthly/{user.user_id}?month=4&year=2026")

    assert response.status_code == 200
    assert response.get_json() == []


def test_get_monthly_report_ignores_other_months(backend_app_module, client, app_ctx):
    user = _create_user(backend_app_module)
    _create_expense(backend_app_module, user.user_id, amount=50, date_str="2026-03-30")
    _create_income(backend_app_module, user.user_id, amount=700, date_str="2026-04-12")

    response = client.get(f"/report/monthly/{user.user_id}?month=4&year=2026")

    assert response.status_code == 200
    assert response.get_json() == {"expenses": 0.0, "income": 700.0, "balance": 700.0}
