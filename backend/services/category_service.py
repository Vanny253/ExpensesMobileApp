from flask import jsonify

from models import Category, db


class CategoryService:
    @staticmethod
    def get_all(user_id, type_):
        categories = Category.query.filter_by(user_id=user_id, type=type_).all()
        result = [
            {
                "id": category.id,
                "user_id": category.user_id,
                "type": category.type,
                "name": category.name,
                "icon": category.icon,
            }
            for category in categories
        ]
        return jsonify(result), 200

    @staticmethod
    def add(data):
        user_id = data.get("user_id")
        type_ = data.get("type")
        name = data.get("name")
        icon = data.get("icon")

        if not user_id or not type_ or not name or not icon:
            return jsonify({"message": "user_id, type, name, and icon are required"}), 400

        category = Category(user_id=user_id, type=type_, name=name, icon=icon)
        db.session.add(category)
        db.session.commit()

        return jsonify(
            {
                "id": category.id,
                "user_id": category.user_id,
                "type": category.type,
                "name": category.name,
                "icon": category.icon,
            }
        ), 201

    @staticmethod
    def update(category_id, data):
        category = db.session.get(Category, category_id)
        if not category:
            return jsonify({"message": "Category not found"}), 404

        name = data.get("name")
        icon = data.get("icon")
        type_ = data.get("type")

        if name:
            category.name = name
        if icon:
            category.icon = icon
        if type_:
            category.type = type_

        db.session.commit()
        return jsonify(
            {
                "id": category.id,
                "user_id": category.user_id,
                "type": category.type,
                "name": category.name,
                "icon": category.icon,
            }
        ), 200

    @staticmethod
    def delete(category_id):
        category = db.session.get(Category, category_id)
        if not category:
            return jsonify({"message": "Category not found"}), 404

        db.session.delete(category)
        db.session.commit()
        return jsonify({"message": "Category deleted"}), 200
