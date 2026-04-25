from flask import Blueprint, request

from services.budget_service import BudgetService, MonthlyBudgetService

budget_bp = Blueprint("budget_bp", __name__)


@budget_bp.post("/budget")
def add_budget():
    return BudgetService.add(request.json)


@budget_bp.get("/budget/<int:user_id>")
def get_budgets(user_id):
    return BudgetService.get_all(user_id)


@budget_bp.put("/budget/<int:budget_id>")
def update_budget(budget_id):
    return BudgetService.update(budget_id, request.json)


@budget_bp.delete("/budget/<int:budget_id>")
def delete_budget(budget_id):
    return BudgetService.delete(budget_id)


@budget_bp.post("/monthly-budget")
def set_monthly_budget():
    return MonthlyBudgetService.set(request.json)


@budget_bp.get("/monthly-budget/<int:user_id>")
def get_monthly_budget(user_id):
    return MonthlyBudgetService.get(user_id, request.args)


@budget_bp.put("/monthly-budget/<int:budget_id>")
def update_monthly_budget(budget_id):
    return MonthlyBudgetService.update(budget_id, request.json)
