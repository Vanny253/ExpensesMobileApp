from flask import Blueprint, request

from services.user_service import UserService

user_bp = Blueprint("user_bp", __name__)


@user_bp.post("/signup")
def signup():
    return UserService.signup(request.json)


@user_bp.post("/login")
def login():
    return UserService.login(request.json)


@user_bp.get("/user/<int:user_id>")
def get_user(user_id):
    return UserService.get_user(user_id)


@user_bp.put("/user/<int:user_id>")
def update_user(user_id):
    return UserService.update_user(user_id, request.form, request.files)


@user_bp.delete("/user/<int:user_id>")
def delete_user(user_id):
    return UserService.delete_user(user_id)