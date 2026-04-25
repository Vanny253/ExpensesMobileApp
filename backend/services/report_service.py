from flask import jsonify

from models import Budget, Expense, Income, db


class ReportService:
    @staticmethod
    def get_monthly_report(user_id, args):
        month = int(args.get("month"))
        year = int(args.get("year"))

        total_expenses = (
            db.session.query(db.func.coalesce(db.func.sum(Expense.amount), 0))
            .filter(
                Expense.user_id == user_id,
                db.extract("month", Expense.date) == month,
                db.extract("year", Expense.date) == year,
            )
            .scalar()
        )

        total_income = (
            db.session.query(db.func.coalesce(db.func.sum(Income.amount), 0))
            .filter(
                Income.user_id == user_id,
                db.extract("month", Income.date) == month,
                db.extract("year", Income.date) == year,
            )
            .scalar()
        )

        balance = float(total_income - total_expenses)

        return (
            jsonify(
                {
                    "expenses": float(total_expenses),
                    "income": float(total_income),
                    "balance": balance,
                }
            ),
            200,
        )

    @staticmethod
    def get_monthly_budgets(user_id, args):
        month = int(args.get("month"))
        year = int(args.get("year"))

        try:
            budgets = Budget.query.filter_by(user_id=user_id).all()
            result = []

            for budget in budgets:
                spent = (
                    db.session.query(db.func.coalesce(db.func.sum(Expense.amount), 0))
                    .filter(
                        Expense.user_id == user_id,
                        Expense.category == budget.category,
                        db.extract("month", Expense.date) == month,
                        db.extract("year", Expense.date) == year,
                    )
                    .scalar()
                )

                remaining = float(budget.amount) - float(spent)
                result.append(
                    {
                        "id": budget.id,
                        "category": budget.category,
                        "budget": float(budget.amount),
                        "spent": float(spent),
                        "remaining": float(remaining),
                        "month": budget.month,
                        "year": budget.year,
                    }
                )

            return jsonify(result), 200
        except Exception as exc:
            print("ERROR:", str(exc))
            return jsonify({"message": "Server error", "error": str(exc)}), 500
