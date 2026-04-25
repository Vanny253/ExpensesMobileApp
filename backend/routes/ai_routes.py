from flask import Blueprint, request

from services.ai_service import AIService


def create_ai_blueprint(client_getter, get_user_categories_getter):
    ai_bp = Blueprint("ai_bp", __name__)

    @ai_bp.route("/transcribe", methods=["POST"])
    def transcribe():
        return AIService.transcribe(
            request=request,
            client=client_getter(),
            get_user_categories_fn=get_user_categories_getter(),
        )

    @ai_bp.post("/ai-extract-budget")
    def ai_extract_budget():
        return AIService.extract_budget(
            data=request.json or {},
            client=client_getter(),
            get_user_categories_fn=get_user_categories_getter(),
        )

    @ai_bp.post("/ai-extract-regular-payment")
    def ai_extract_regular_payment():
        return AIService.extract_regular_payment(request.json or {})

    return ai_bp
