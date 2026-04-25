import os
from datetime import datetime

from flask import current_app, jsonify
from sqlalchemy.exc import IntegrityError
from werkzeug.security import check_password_hash, generate_password_hash
from werkzeug.utils import secure_filename

from models import User, db


class UserService:
    @staticmethod
    def signup(data):
        email = data.get("email")
        password = data.get("password")
        nickname = data.get("nickname")

        if not email or not password or not nickname:
            return jsonify({"message": "Email, password, and nickname are required"}), 400

        if User.query.filter_by(email=email).first():
            return jsonify({"message": "Email already registered"}), 400

        hashed_password = generate_password_hash(password)
        phone_number = data.get("phone_number") or None
        gender = data.get("gender") or None
        profile_image = data.get("profile_image") or "default.png"

        dob_str = data.get("date_of_birth")
        date_of_birth = None
        if dob_str:
            try:
                date_of_birth = datetime.strptime(dob_str, "%Y-%m-%d").date()
            except ValueError:
                return jsonify({"message": "Invalid date format, use YYYY-MM-DD"}), 400

        user = User(
            email=email,
            password=hashed_password,
            nickname=nickname,
            phone_number=phone_number,
            gender=gender,
            date_of_birth=date_of_birth,
            profile_image=profile_image,
        )
        db.session.add(user)
        db.session.commit()

        return jsonify(
            {
                "message": "Signup successful",
                "user": UserService._serialize_user(user, include_full_image_path=False),
            }
        ), 201

    @staticmethod
    def login(data):
        email = data.get("email")
        password = data.get("password")

        if not email or not password:
            return jsonify({"message": "Email and password are required"}), 400

        user = User.query.filter_by(email=email).first()
        if user and check_password_hash(user.password, password):
            return jsonify(
                {"message": "Login successful", "user": UserService._serialize_user(user)}
            ), 200

        return jsonify({"message": "Invalid email or password"}), 401

    @staticmethod
    def get_user(user_id):
        user = User.query.get(user_id)
        if user:
            return jsonify(
                {
                    "user_id": user.user_id,
                    "email": user.email,
                    "nickname": user.nickname,
                    "phone_number": user.phone_number,
                    "gender": user.gender,
                    "date_of_birth": user.date_of_birth,
                    "profile_image": user.profile_image,
                    "create_at": user.create_at.isoformat(),
                }
            ), 200
        return jsonify({"message": "User not found"}), 404

    @staticmethod
    def update_user(user_id, data, files):
        user = User.query.get(user_id)
        if not user:
            return jsonify({"message": "User not found"}), 404

        file = files.get("profile_image")

        try:
            if "nickname" in data:
                user.nickname = data["nickname"]
            if "email" in data:
                user.email = data["email"]
            if "phone_number" in data:
                user.phone_number = data["phone_number"]
            if "gender" in data:
                user.gender = data["gender"]
            if "date_of_birth" in data and data["date_of_birth"]:
                user.date_of_birth = datetime.strptime(
                    data["date_of_birth"], "%Y-%m-%d"
                ).date()

            if file:
                filename = secure_filename(file.filename)
                filepath = os.path.join(current_app.config["UPLOAD_FOLDER"], filename)
                file.save(filepath)
                user.profile_image = filepath

            db.session.commit()
        except ValueError:
            return jsonify({"message": "Invalid date format"}), 400
        except IntegrityError:
            db.session.rollback()
            return jsonify({"message": "Email already exists"}), 400
        except Exception as exc:
            db.session.rollback()
            print("ERROR:", str(exc))
            return jsonify({"message": "Server error"}), 500

        return jsonify(UserService._serialize_user(user, include_full_image_path=True)), 200

    @staticmethod
    def _serialize_user(user, include_full_image_path=False):
        profile_image = user.profile_image
        if include_full_image_path and profile_image:
            profile_image = f"http://192.168.0.10:5000/{profile_image}"

        return {
            "user_id": user.user_id,
            "email": user.email,
            "nickname": user.nickname,
            "phone_number": user.phone_number,
            "gender": user.gender,
            "date_of_birth": user.date_of_birth.isoformat() if user.date_of_birth else None,
            "profile_image": profile_image,
            "create_at": user.create_at.isoformat(),
        }
