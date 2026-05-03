from datetime import datetime
from decimal import Decimal

from flask import jsonify

from models import RegularPayment, db


class RegularPaymentService:
    @staticmethod
    def add(data):
        print("Incoming data:", data)

        user_id = data.get("user_id")
        title = data.get("title")
        type_ = data.get("type")
        category = data.get("category")
        frequency = data.get("frequency")
        start_date_str = data.get("start_date")
        amount = data.get("amount")

        if not all([user_id, title, type_, category, frequency, start_date_str, amount]):
            return jsonify({"message": "Missing required fields"}), 400

        try:
            start_date = datetime.strptime(start_date_str, "%Y-%m-%d").date()
        except ValueError:
            return jsonify({"message": "Invalid date format"}), 400

        payment = RegularPayment(
            user_id=user_id,
            title=title,
            type=type_,
            category=category,
            frequency=frequency,
            start_date=start_date,
            amount=Decimal(amount),
        )
        db.session.add(payment)
        db.session.commit()

        return jsonify({"message": "Regular payment created", "payment_id": payment.id}), 201

    @staticmethod
    def get_all(user_id):
        payments = RegularPayment.query.filter_by(user_id=user_id).all()
        result = [
            {
                "id": payment.id,
                "user_id": payment.user_id,
                "title": payment.title,
                "type": payment.type,
                "category": payment.category,
                "frequency": payment.frequency,
                "start_date": payment.start_date.strftime("%Y-%m-%d"),
                "amount": float(payment.amount),
            }
            for payment in payments
        ]
        return jsonify(result), 200

    @staticmethod
    def update(payment_id, data):
        payment = db.session.get(RegularPayment, payment_id)
        if not payment:
            return jsonify({"message": "Regular payment not found"}), 404

        for field in ["title", "type", "category", "frequency", "start_date", "amount"]:
            if field in data:
                if field == "start_date":
                    try:
                        payment.start_date = datetime.strptime(
                            data[field], "%Y-%m-%d"
                        ).date()
                    except ValueError:
                        return jsonify({"message": "Invalid date format"}), 400
                elif field == "amount":
                    payment.amount = Decimal(data[field])
                else:
                    setattr(payment, field, data[field])

        db.session.commit()
        return jsonify({"message": "Regular payment updated", "payment_id": payment.id}), 200

    @staticmethod
    def delete(payment_id):
        payment = db.session.get(RegularPayment, payment_id)
        if not payment:
            return jsonify({"message": "Regular payment not found"}), 404

        db.session.delete(payment)
        db.session.commit()
        return jsonify({"message": "Regular payment deleted"}), 200
