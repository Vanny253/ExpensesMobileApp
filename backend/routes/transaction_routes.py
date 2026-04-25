from flask import Blueprint, request

from services.regular_payment_service import RegularPaymentService
from services.transaction_service import ExpenseService, IncomeService

transaction_bp = Blueprint("transaction_bp", __name__)


@transaction_bp.post("/expense")
def add_expense():
    return ExpenseService.add(request.json)


@transaction_bp.get("/expense/<int:user_id>")
def get_expenses(user_id):
    return ExpenseService.get_all(user_id)


@transaction_bp.put("/expense/<int:expense_id>")
def update_expense(expense_id):
    return ExpenseService.update(expense_id, request.json)


@transaction_bp.delete("/expense/<int:expense_id>")
def delete_expense(expense_id):
    return ExpenseService.delete(expense_id)


@transaction_bp.post("/income")
def add_income():
    return IncomeService.add(request.json)


@transaction_bp.get("/income/<int:user_id>")
def get_income(user_id):
    return IncomeService.get_all(user_id)


@transaction_bp.put("/income/<int:income_id>")
def update_income(income_id):
    return IncomeService.update(income_id, request.json)


@transaction_bp.delete("/income/<int:income_id>")
def delete_income(income_id):
    return IncomeService.delete(income_id)


@transaction_bp.post("/regular_payments")
def add_regular_payment():
    return RegularPaymentService.add(request.json)


@transaction_bp.get("/regular_payments/<int:user_id>")
def get_regular_payments(user_id):
    return RegularPaymentService.get_all(user_id)


@transaction_bp.put("/regular_payments/<int:payment_id>")
def update_regular_payment(payment_id):
    return RegularPaymentService.update(payment_id, request.json)


@transaction_bp.delete("/regular_payments/<int:payment_id>")
def delete_regular_payment(payment_id):
    return RegularPaymentService.delete(payment_id)
