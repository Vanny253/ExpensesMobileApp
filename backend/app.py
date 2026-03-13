from flask import Flask, request, jsonify
from flask_cors import CORS
from config import SQLALCHEMY_DATABASE_URI, SQLALCHEMY_TRACK_MODIFICATIONS
from models import db, Expense, Income, User
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

app = Flask(__name__)
CORS(app)

app.config["SQLALCHEMY_DATABASE_URI"] = SQLALCHEMY_DATABASE_URI
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = SQLALCHEMY_TRACK_MODIFICATIONS
db.init_app(app)

# Create tables if they don't exist
with app.app_context():
    db.create_all()


# -------------------- EXPENSE ENDPOINTS --------------------
@app.post("/expense")
def add_expense():
    data = request.json

    # Validation
    required_fields = ["user_id", "title", "amount", "category", "date"]
    if not all(field in data for field in required_fields):
        return jsonify({"message": "Missing required fields"}), 400

    try:
        date_obj = datetime.strptime(data["date"], "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"message": "Invalid date format, use YYYY-MM-DD"}), 400

    expense = Expense(
        user_id=data["user_id"],
        title=data["title"],
        amount=data["amount"],
        category=data["category"],
        date=date_obj
    )
    db.session.add(expense)
    db.session.commit()

    return jsonify({
        "message": "Expense added",
        "expense": {
            "id": expense.id,
            "user_id": expense.user_id,
            "title": expense.title,
            "amount": expense.amount,
            "category": expense.category,
            "date": expense.date.isoformat()
        }
    }), 201


@app.get("/expense/<int:user_id>")
def get_expenses(user_id):
    expenses = Expense.query.filter_by(user_id=user_id).order_by(Expense.date.desc()).all()
    result = [
        {
            "id": e.id,
            "user_id": e.user_id,
            "title": e.title,
            "amount": e.amount,
            "category": e.category,
            "date": e.date.isoformat()
        }
        for e in expenses
    ]
    return jsonify(result), 200

@app.put("/expense/<int:expense_id>")
def update_expense(expense_id):
    data = request.json
    expense = Expense.query.get(expense_id)
    if not expense:
        return jsonify({"message": "Expense not found"}), 404

    # Update fields
    expense.title = data.get("title", expense.title)
    expense.amount = data.get("amount", expense.amount)
    expense.category = data.get("category", expense.category)
    if "date" in data:
        try:
            expense.date = datetime.strptime(data["date"], "%Y-%m-%d").date()
        except ValueError:
            return jsonify({"message": "Invalid date format"}), 400

    db.session.commit()
    return jsonify({"message": "Expense updated", "expense": {
        "id": expense.id,
        "user_id": expense.user_id,
        "title": expense.title,
        "amount": expense.amount,
        "category": expense.category,
        "date": expense.date.isoformat()
    }}), 200


@app.delete("/expense/<int:expense_id>")
def delete_expense(expense_id):
    expense = Expense.query.get(expense_id)
    if not expense:
        return jsonify({"message": "Expense not found"}), 404

    db.session.delete(expense)
    db.session.commit()
    return jsonify({"message": "Expense deleted"}), 200



# -------------------- INCOME ENDPOINTS --------------------
@app.post("/income")
def add_income():
    data = request.json

    required_fields = ["user_id", "title", "amount", "category", "date"]
    if not all(field in data for field in required_fields):
        return jsonify({"message": "Missing required fields"}), 400

    try:
        date_obj = datetime.strptime(data["date"], "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"message": "Invalid date format, use YYYY-MM-DD"}), 400

    income = Income(
        user_id=data["user_id"],
        title=data["title"],
        amount=data["amount"],
        category=data["category"],
        date=date_obj
    )
    db.session.add(income)
    db.session.commit()

    return jsonify({
        "message": "Income added",
        "income": {
            "id": income.id,
            "user_id": income.user_id,
            "title": income.title,
            "amount": income.amount,
            "category": income.category,
            "date": income.date.isoformat()
        }
    }), 201


@app.get("/income/<int:user_id>")
def get_income(user_id):
    incomes = Income.query.filter_by(user_id=user_id).order_by(Income.date.desc()).all()
    result = [
        {
            "id": i.id,
            "user_id": i.user_id,
            "title": i.title,
            "amount": i.amount,
            "category": i.category,
            "date": i.date.isoformat()
        }
        for i in incomes
    ]
    return jsonify(result), 200

@app.put("/income/<int:income_id>")
def update_income(income_id):
    data = request.json
    income = Income.query.get(income_id)
    if not income:
        return jsonify({"message": "Income not found"}), 404

    # Update fields if provided
    income.title = data.get("title", income.title)
    income.amount = data.get("amount", income.amount)
    income.category = data.get("category", income.category)
    
    if "date" in data:
        try:
            income.date = datetime.strptime(data["date"], "%Y-%m-%d").date()
        except ValueError:
            return jsonify({"message": "Invalid date format, use YYYY-MM-DD"}), 400

    db.session.commit()

    return jsonify({
        "message": "Income updated",
        "income": {
            "id": income.id,
            "user_id": income.user_id,
            "title": income.title,
            "amount": income.amount,
            "category": income.category,
            "date": income.date.isoformat()
        }
    }), 200


@app.delete("/income/<int:income_id>")
def delete_income(income_id):
    income = Income.query.get(income_id)
    if not income:
        return jsonify({"message": "Income not found"}), 404

    db.session.delete(income)
    db.session.commit()

    return jsonify({"message": "Income deleted"}), 200

# -------------------- SIGNUP --------------------
@app.post("/signup")
def signup():
    data = request.json
    email = data.get("email")
    password = data.get("password")
    nickname = data.get("nickname")

    # Required fields check
    if not email or not password or not nickname:
        return jsonify({"message": "Email, password, and nickname are required"}), 400

    # Check if email already exists
    if User.query.filter_by(email=email).first():
        return jsonify({"message": "Email already registered"}), 400

    # Hash the password
    hashed_password = generate_password_hash(password)

    # Optional fields
    phone_number = data.get("phone_number") or None
    gender = data.get("gender") or None
    profile_image = data.get("profile_image") or "default.png"

    # Handle date_of_birth safely
    dob_str = data.get("date_of_birth")
    date_of_birth = None
    if dob_str:
        try:
            date_of_birth = datetime.strptime(dob_str, "%Y-%m-%d").date()
        except ValueError:
            return jsonify({"message": "Invalid date format, use YYYY-MM-DD"}), 400

    # Create user
    user = User(
        email=email,
        password=hashed_password,
        nickname=nickname,
        phone_number=phone_number,
        gender=gender,
        date_of_birth=date_of_birth,
        profile_image=profile_image
    )

    db.session.add(user)
    db.session.commit()

    return jsonify({
        "message": "Signup successful",
        "user": {
            "user_id": user.user_id,
            "email": user.email,
            "nickname": user.nickname,
            "phone_number": user.phone_number,
            "gender": user.gender,
            "date_of_birth": user.date_of_birth.isoformat() if user.date_of_birth else None,
            "profile_image": user.profile_image,
            "create_at": user.create_at.isoformat()
        }
    }), 201


# -------------------- LOGIN --------------------
@app.post("/login")
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"message": "Email and password are required"}), 400

    user = User.query.filter_by(email=email).first()
    if user and check_password_hash(user.password, password):
        return jsonify({
            "message": "Login successful",
            "user": {
                "user_id": user.user_id,
                "email": user.email,
                "nickname": user.nickname,
                "phone_number": user.phone_number,
                "gender": user.gender,
                "date_of_birth": user.date_of_birth.isoformat() if user.date_of_birth else None,
                "profile_image": user.profile_image,
                "create_at": user.create_at.isoformat()
            }
        }), 200

    return jsonify({"message": "Invalid email or password"}), 401



# -------------------- GET USER INFO --------------------
@app.get("/user/<int:user_id>")
def get_user(user_id):
    user = User.query.get(user_id)
    if user:
        return jsonify({
            "user_id": user.user_id,
            "email": user.email,
            "nickname": user.nickname,
            "phone_number": user.phone_number,
            "gender": user.gender,
            "date_of_birth": user.date_of_birth,
            "profile_image": user.profile_image,
            "create_at": user.create_at.isoformat()
        }), 200
    return jsonify({"message": "User not found"}), 404






# -------------------- RUN SERVER --------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)

# if __name__ == "__main__":
#     app.run(debug=True)

