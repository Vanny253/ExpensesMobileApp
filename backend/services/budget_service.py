from datetime import datetime

from flask import jsonify
from sqlalchemy import func

from models import Budget, Expense, MonthlyBudget, db


class BudgetService:
    DEFAULT_CATEGORIES = [
        "food",
        "transport",
        "billing",
        "shopping",
        "health",
        "entertainment",
    ]

    @classmethod
    def add(cls, data):
        user_id = data.get("user_id")
        category = data.get("category")
        amount = data.get("amount")
        month = data.get("month")
        year = data.get("year")

        if not all([user_id, category, amount, month, year]):
            return jsonify({"message": "Missing required fields"}), 400

        clean_category = cls.normalize_category(category)
        budget = Budget(
            user_id=user_id,
            category=clean_category,
            amount=amount,
            month=month,
            year=year,
            create_at=datetime.now(),
        )
        db.session.add(budget)
        db.session.commit()

        return jsonify(
            {
                "message": "Budget created",
                "budget_id": budget.id,
                "category": clean_category,
            }
        ), 201

    @staticmethod
    def get_all(user_id):
        budgets = Budget.query.filter_by(user_id=user_id).all()
        result = []
        now = datetime.now()
        current_month = now.month
        current_year = now.year

        for budget in budgets:
            spent = (
                db.session.query(func.coalesce(func.sum(Expense.amount), 0))
                .filter(
                    Expense.user_id == user_id,
                    Expense.category == budget.category,
                    func.extract("month", Expense.date) == current_month,
                    func.extract("year", Expense.date) == current_year,
                )
                .scalar()
            )

            result.append(
                {
                    "id": budget.id,
                    "category": budget.category,
                    "budget": float(budget.amount),
                    "spent": float(spent),
                    "remaining": float(budget.amount - spent),
                }
            )

        return jsonify(result), 200

    @staticmethod
    def update(budget_id, data):
        amount = data.get("amount")
        if amount is None:
            return jsonify({"message": "Amount is required"}), 400

        budget = Budget.query.get(budget_id)
        if not budget:
            return jsonify({"message": "Budget not found"}), 404

        budget.amount = amount
        db.session.commit()
        return jsonify({"message": "Budget updated", "budget_id": budget.id}), 200

    @staticmethod
    def delete(budget_id):
        budget = Budget.query.get(budget_id)
        if not budget:
            return jsonify({"message": "Budget not found"}), 404

        db.session.delete(budget)
        db.session.commit()
        return jsonify({"message": "Budget deleted"}), 200

    @classmethod
    def normalize_category(cls, category):
        if not category:
            return "general"

        category = str(category).lower().strip()
        if category in cls.DEFAULT_CATEGORIES:
            return category

        if category.startswith("default-"):
            try:
                index = int(category.split("-")[1]) - 1
                if 0 <= index < len(cls.DEFAULT_CATEGORIES):
                    return cls.DEFAULT_CATEGORIES[index]
            except Exception:
                pass

        return category


class MonthlyBudgetService:
    @staticmethod
    def set(data):
        try:
            user_id = data.get("user_id")
            amount = data.get("amount")
            month = data.get("month")
            year = data.get("year")

            print("DEBUG DATA:", data)

            if not all([user_id, amount, month, year]):
                return jsonify({"message": "Missing required fields"}), 400

            existing = MonthlyBudget.query.filter_by(
                user_id=user_id,
                month=month,
                year=year,
            ).first()

            if existing:
                existing.amount = amount
                db.session.commit()
                return jsonify({"message": "Updated"}), 200

            new_budget = MonthlyBudget(
                user_id=user_id,
                amount=amount,
                month=month,
                year=year,
            )
            db.session.add(new_budget)
            db.session.commit()
            return jsonify({"message": "Created"}), 201
        except Exception as exc:
            print("ERROR:", str(exc))
            return jsonify({"message": str(exc)}), 500

    @staticmethod
    def get(user_id, args):
        month = args.get("month", type=int)
        year = args.get("year", type=int)

        if not month or not year:
            now = datetime.now()
            month = now.month
            year = now.year

        budget = MonthlyBudget.query.filter_by(
            user_id=user_id,
            month=month,
            year=year,
        ).first()

        if not budget:
            return jsonify({"amount": 0}), 200

        return (
            jsonify(
                {
                    "id": budget.id,
                    "amount": float(budget.amount),
                    "month": budget.month,
                    "year": budget.year,
                }
            ),
            200,
        )

    @staticmethod
    def update(budget_id, data):
        amount = data.get("amount")
        budget = MonthlyBudget.query.get(budget_id)
        if not budget:
            return jsonify({"message": "Not found"}), 404

        budget.amount = amount
        db.session.commit()
        return jsonify({"message": "Updated"}), 200
