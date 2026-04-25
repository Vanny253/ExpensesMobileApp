from flask import Blueprint, request

from services.category_service import CategoryService

category_bp = Blueprint("category_bp", __name__)


@category_bp.route("/categories/<int:user_id>/<string:type>", methods=["GET"])
def get_categories(user_id, type):
    return CategoryService.get_all(user_id, type)


@category_bp.post("/categories")
def add_category():
    return CategoryService.add(request.json)


@category_bp.route("/categories/<int:category_id>", methods=["PUT"])
def update_category(category_id):
    return CategoryService.update(category_id, request.json)


@category_bp.delete("/categories/<int:category_id>")
def delete_category(category_id):
    return CategoryService.delete(category_id)
