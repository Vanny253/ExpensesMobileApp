from datetime import datetime

from flask import jsonify

from models import Expense, Income, db


class ExpenseService:
    @staticmethod
    def add(data):
        required_fields = ["user_id", "title", "amount", "category", "date"]
        if not all(field in data for field in required_fields):
            return jsonify({"message": "Missing required fields"}), 400

        try:
            date_obj = datetime.strptime(data["date"], "%Y-%m-%d").date()
        except ValueError:
            return jsonify({"message": "Invalid date format, use YYYY-MM-DD"}), 400

        expense = Expense(
            user_id=data["user_id"],
            title=data["title"],
            amount=data["amount"],
            category=data["category"],
            date=date_obj,
        )
        db.session.add(expense)
        db.session.commit()

        return jsonify(
            {
                "message": "Expense added",
                "expense": {
                    "id": expense.id,
                    "user_id": expense.user_id,
                    "title": expense.title,
                    "amount": expense.amount,
                    "category": expense.category,
                    "date": expense.date.isoformat(),
                },
            }
        ), 201

    @staticmethod
    def get_all(user_id):
        expenses = (
            Expense.query.filter_by(user_id=user_id)
            .order_by(Expense.date.desc())
            .all()
        )
        result = [
            {
                "id": e.id,
                "user_id": e.user_id,
                "title": e.title,
                "amount": e.amount,
                "category": e.category,
                "date": e.date.isoformat(),
            }
            for e in expenses
        ]
        return jsonify(result), 200

    @staticmethod
    def update(expense_id, data):
        expense = db.session.get(Expense, expense_id)
        if not expense:
            return jsonify({"message": "Expense not found"}), 404

        expense.title = data.get("title", expense.title)
        expense.amount = data.get("amount", expense.amount)
        expense.category = data.get("category", expense.category)
        if "date" in data:
            try:
                expense.date = datetime.strptime(data["date"], "%Y-%m-%d").date()
            except ValueError:
                return jsonify({"message": "Invalid date format"}), 400

        db.session.commit()
        return jsonify(
            {
                "message": "Expense updated",
                "expense": {
                    "id": expense.id,
                    "user_id": expense.user_id,
                    "title": expense.title,
                    "amount": expense.amount,
                    "category": expense.category,
                    "date": expense.date.isoformat(),
                },
            }
        ), 200

    @staticmethod
    def delete(expense_id):
        expense = db.session.get(Expense, expense_id)
        if not expense:
            return jsonify({"message": "Expense not found"}), 404

        db.session.delete(expense)
        db.session.commit()
        return jsonify({"message": "Expense deleted"}), 200


class IncomeService:
    @staticmethod
    def add(data):
        required_fields = ["user_id", "title", "amount", "category", "date"]
        if not all(field in data for field in required_fields):
            return jsonify({"message": "Missing required fields"}), 400

        try:
            date_obj = datetime.strptime(data["date"], "%Y-%m-%d").date()
        except ValueError:
            return jsonify({"message": "Invalid date format, use YYYY-MM-DD"}), 400

        income = Income(
            user_id=data["user_id"],
            title=data["title"],
            amount=data["amount"],
            category=data["category"],
            date=date_obj,
        )
        db.session.add(income)
        db.session.commit()

        return jsonify(
            {
                "message": "Income added",
                "income": {
                    "id": income.id,
                    "user_id": income.user_id,
                    "title": income.title,
                    "amount": income.amount,
                    "category": income.category,
                    "date": income.date.isoformat(),
                },
            }
        ), 201

    @staticmethod
    def get_all(user_id):
        incomes = (
            Income.query.filter_by(user_id=user_id)
            .order_by(Income.date.desc())
            .all()
        )
        result = [
            {
                "id": i.id,
                "user_id": i.user_id,
                "title": i.title,
                "amount": i.amount,
                "category": i.category,
                "date": i.date.isoformat(),
            }
            for i in incomes
        ]
        return jsonify(result), 200

    @staticmethod
    def update(income_id, data):
        income = db.session.get(Income, income_id)
        if not income:
            return jsonify({"message": "Income not found"}), 404

        income.title = data.get("title", income.title)
        income.amount = data.get("amount", income.amount)
        income.category = data.get("category", income.category)

        if "date" in data:
            try:
                income.date = datetime.strptime(data["date"], "%Y-%m-%d").date()
            except ValueError:
                return jsonify({"message": "Invalid date format, use YYYY-MM-DD"}), 400

        db.session.commit()
        return jsonify(
            {
                "message": "Income updated",
                "income": {
                    "id": income.id,
                    "user_id": income.user_id,
                    "title": income.title,
                    "amount": income.amount,
                    "category": income.category,
                    "date": income.date.isoformat(),
                },
            }
        ), 200

    @staticmethod
    def delete(income_id):
        income = db.session.get(Income, income_id)
        if not income:
            return jsonify({"message": "Income not found"}), 404

        db.session.delete(income)
        db.session.commit()
        return jsonify({"message": "Income deleted"}), 200
