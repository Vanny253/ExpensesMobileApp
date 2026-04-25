from flask import Blueprint, request

from services.feedback_service import FeedbackService

feedback_bp = Blueprint("feedback_bp", __name__)


@feedback_bp.route("/api/feedback", methods=["POST"])
def create_feedback():
    return FeedbackService.create(request.get_json())
