import os
from datetime import datetime

from dotenv import load_dotenv
from openai import OpenAI
from werkzeug.security import check_password_hash, generate_password_hash

from core.app_factory import create_app
from models import (
    Budget,
    Category,
    Expense,
    Feedback,
    Income,
    MonthlyBudget,
    RegularPayment,
    User,
    db,
)
from routes import register_blueprints
from routes.ai_routes import create_ai_blueprint
from routes.ocr_routes import create_ocr_blueprint
from services.ai_service import AIService
from services.ocr_service import OCRService


load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

app = create_app()
register_blueprints(app)
app.register_blueprint(create_ocr_blueprint())
app.register_blueprint(
    create_ai_blueprint(
        client_getter=lambda: client,
        get_user_categories_getter=lambda: get_user_categories,
    )
)

OCRService.configure()


def extract_amount(text):
    return OCRService.extract_amount(text)


def parse_numeric_date(date_str):
    return OCRService.parse_numeric_date(date_str, datetime)


def extract_date(text):
    return OCRService.extract_date(text, datetime_cls=datetime)


def scrape_with_playwright(url):
    return OCRService.scrape_with_playwright(url, datetime_cls=datetime)


def extract_text_from_pdf(path):
    return OCRService.extract_text_from_pdf(path)


def parse_einvoice_date(date_str):
    return OCRService.parse_einvoice_date(date_str, datetime_cls=datetime)


def normalize_date(date_str):
    return OCRService.normalize_date(date_str)


def get_user_categories(user_id):
    return AIService.get_user_categories(user_id)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
