from flask import Blueprint, request

from services.report_service import ReportService

report_bp = Blueprint("report_bp", __name__)


@report_bp.get("/report/monthly/<int:user_id>")
def get_monthly_report(user_id):
    return ReportService.get_monthly_report(user_id, request.args)


@report_bp.get("/budget/monthly/<int:user_id>")
def get_monthly_budgets(user_id):
    return ReportService.get_monthly_budgets(user_id, request.args)
