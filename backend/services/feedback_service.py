from flask import jsonify

from models import Feedback, User, db


class FeedbackService:
    @staticmethod
    def create(data):
        print("DEBUG DATA:", data)

        try:
            user_id = data.get("user_id")
            rating = data.get("rating")
            comment = data.get("feedback")

            if not user_id:
                return jsonify({"message": "user_id required"}), 400
            if not rating:
                return jsonify({"message": "rating required"}), 400

            user = User.query.get(user_id)
            if not user:
                return jsonify({"message": "User not found"}), 404

            new_feedback = Feedback(user_id=user_id, rating=rating, comment=comment)
            db.session.add(new_feedback)
            db.session.commit()
            return jsonify({"message": "Feedback submitted successfully"}), 200
        except Exception as exc:
            db.session.rollback()
            print("ERROR:", str(exc))
            return jsonify({"error": str(exc)}), 500
