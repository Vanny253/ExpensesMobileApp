from flask import Blueprint, request

from services.ocr_service import OCRService


def create_ocr_blueprint():
    ocr_bp = Blueprint("ocr_bp", __name__)

    @ocr_bp.route("/ocr", methods=["POST"])
    def ocr():
        return OCRService.ocr(request.files)

    @ocr_bp.route("/parse-einvoice", methods=["POST"])
    def parse_einvoice():
        return OCRService.parse_einvoice(request.get_json())

    return ocr_bp
