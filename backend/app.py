from decimal import Decimal
from flask import Flask, request, jsonify
from flask_apscheduler import APScheduler
from flask_cors import CORS
from config import SQLALCHEMY_DATABASE_URI, SQLALCHEMY_TRACK_MODIFICATIONS
from models import db, Expense, Income, User, Budget, Category, RegularPayment, MonthlyBudget
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
from sqlalchemy import func
from scheduler import register_tasks
from sqlalchemy.exc import IntegrityError
import os
from werkzeug.utils import secure_filename
from PIL import Image
import pytesseract
import re
import io
from pyzbar.pyzbar import decode
from PIL import Image
import requests
from playwright.sync_api import sync_playwright
import pdfplumber
import cv2
import numpy as np
from openai import OpenAI
from dotenv import load_dotenv
from datetime import datetime
from prompts import get_expense_prompt
from prompts import get_budget_prompt 
from prompts import get_regular_payment_prompt
import json
from models import Category
from word2number import w2n




app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = "static/uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

app.config["SQLALCHEMY_DATABASE_URI"] = SQLALCHEMY_DATABASE_URI
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = SQLALCHEMY_TRACK_MODIFICATIONS

db.init_app(app)

scheduler = APScheduler()
scheduler.init_app(app)

# register tasks after initializing scheduler
from scheduler import register_tasks
register_tasks(scheduler, app) 
scheduler.start()


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


# -------------------- UPDATE USER INFO --------------------
@app.put("/user/<int:user_id>")
def update_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404

    data = request.form
    file = request.files.get("profile_image")

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

        # 📸 Save Image
        if file:
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)
            file.save(filepath)

            user.profile_image = filepath

        db.session.commit()

    except ValueError:
        return jsonify({"message": "Invalid date format"}), 400

    except IntegrityError:
        db.session.rollback()
        return jsonify({"message": "Email already exists"}), 400

    except Exception as e:
        db.session.rollback()
        print("ERROR:", str(e))
        return jsonify({"message": "Server error"}), 500

    return jsonify({
        "user_id": user.user_id,
        "email": user.email,
        "nickname": user.nickname,
        "phone_number": user.phone_number,
        "gender": user.gender,
        "date_of_birth": user.date_of_birth.isoformat() if user.date_of_birth else None,
        "profile_image": f"http://192.168.0.10:5000/{user.profile_image}" if user.profile_image else None,
        "create_at": user.create_at.isoformat()
    }), 200

    
# -------------------- BUDGET ENDPOINTS --------------------
# Add a new budget
@app.post("/budget")
def add_budget():
    data = request.json

    user_id = data.get("user_id")
    category = data.get("category")
    amount = data.get("amount")
    month = data.get("month")
    year = data.get("year")

    if not all([user_id, category, amount, month, year]):
        return jsonify({"message": "Missing required fields"}), 400


    # =========================
    # DEFAULT CATEGORY FIX
    # =========================
    DEFAULT_CATEGORIES = [
        "food",
        "transport",
        "billing",
        "shopping",
        "health",
        "entertainment"
    ]

    def normalize_category(cat):
        if not cat:
            return "general"

        cat = str(cat).lower().strip()

        # already valid category
        if cat in DEFAULT_CATEGORIES:
            return cat

        # convert default-1 style
        if cat.startswith("default-"):
            try:
                index = int(cat.split("-")[1]) - 1
                if 0 <= index < len(DEFAULT_CATEGORIES):
                    return DEFAULT_CATEGORIES[index]
            except:
                pass

        return cat


    clean_category = normalize_category(category)


    budget = Budget(
        user_id=user_id,
        category=clean_category,
        amount=amount,
        month=month,
        year=year,
        create_at=datetime.now()
    )

    db.session.add(budget)
    db.session.commit()

    return jsonify({
        "message": "Budget created",
        "budget_id": budget.id,
        "category": clean_category
    }), 201



@app.get("/budget/<int:user_id>")
def get_budgets(user_id):
    budgets = Budget.query.filter_by(user_id=user_id).all()
    result = []

    from datetime import datetime
    now = datetime.now()
    current_month = now.month
    current_year = now.year

    for b in budgets:
        spent = db.session.query(func.coalesce(func.sum(Expense.amount), 0)).filter(
            Expense.user_id == user_id,
            Expense.category == b.category,
            func.extract('month', Expense.date) == current_month,
            func.extract('year', Expense.date) == current_year
        ).scalar()

        result.append({
            "id": b.id,
            "category": b.category,
            "budget": float(b.amount),
            "spent": float(spent),
            "remaining": float(b.amount - spent)
        })

    return jsonify(result), 200



# Update budget amount by ID
@app.put("/budget/<int:budget_id>")
def update_budget(budget_id):
    data = request.json
    amount = data.get("amount")

    if amount is None:
        return jsonify({"message": "Amount is required"}), 400

    budget = Budget.query.get(budget_id)
    if not budget:
        return jsonify({"message": "Budget not found"}), 404

    budget.amount = amount
    db.session.commit()

    return jsonify({"message": "Budget updated", "budget_id": budget.id}), 200


# Delete a budget
@app.delete("/budget/<int:budget_id>")
def delete_budget(budget_id):
    budget = Budget.query.get(budget_id)
    if not budget:
        return jsonify({"message": "Budget not found"}), 404

    db.session.delete(budget)
    db.session.commit()

    return jsonify({"message": "Budget deleted"}), 200




# -----------------------------
# Budget Monthly endpoints
# -----------------------------

@app.post("/monthly-budget")
def set_monthly_budget():
    try:
        data = request.json

        user_id = data.get("user_id")
        amount = data.get("amount")
        month = data.get("month")
        year = data.get("year")

        print("DEBUG DATA:", data)

        if not all([user_id, amount, month, year]):
            return jsonify({"message": "Missing required fields"}), 400

        existing = MonthlyBudget.query.filter_by(
            user_id=user_id,
            month=month,
            year=year
        ).first()

        if existing:
            existing.amount = amount
            db.session.commit()

            return jsonify({"message": "Updated"}), 200

        new_budget = MonthlyBudget(
            user_id=user_id,
            amount=amount,
            month=month,
            year=year
        )

        db.session.add(new_budget)
        db.session.commit()

        return jsonify({"message": "Created"}), 201

    except Exception as e:
        print("ERROR:", str(e))
        return jsonify({"message": str(e)}), 500



@app.get("/monthly-budget/<int:user_id>")
def get_monthly_budget(user_id):
    from datetime import datetime

    month = request.args.get("month", type=int)
    year = request.args.get("year", type=int)

    if not month or not year:
        now = datetime.now()
        month = now.month
        year = now.year

    budget = MonthlyBudget.query.filter_by(
        user_id=user_id,
        month=month,
        year=year
    ).first()

    if not budget:
        return jsonify({
            "amount": 0
        }), 200

    return jsonify({
        "id": budget.id,
        "amount": float(budget.amount),
        "month": budget.month,
        "year": budget.year
    }), 200


@app.put("/monthly-budget/<int:id>")
def update_monthly_budget(id):
    data = request.json
    amount = data.get("amount")

    budget = MonthlyBudget.query.get(id)

    if not budget:
        return jsonify({"message": "Not found"}), 404

    budget.amount = amount
    db.session.commit()

    return jsonify({"message": "Updated"}), 200


# -----------------------------
# Category endpoints
# -----------------------------

# Get all categories for a user and type (expense/income)
@app.route("/categories/<int:user_id>/<string:type>", methods=["GET"])
def get_categories(user_id, type):

    categories = Category.query.filter_by(
        user_id=user_id,
        type=type
    ).all()

    result = []

    for c in categories:
        result.append({
            "id": c.id,
            "user_id": c.user_id,
            "type": c.type,
            "name": c.name,
            "icon": c.icon
        })

    return jsonify(result), 200

# Add a new category
@app.post("/categories")
def add_category():
    data = request.json
    user_id = data.get("user_id")
    type_ = data.get("type")
    name = data.get("name")
    icon = data.get("icon")

    

    if not user_id or not type_ or not name or not icon:
        return jsonify({"message": "user_id, type, name, and icon are required"}), 400

    category = Category(user_id=user_id, type=type_, name=name, icon=icon)
    db.session.add(category)
    db.session.commit()

    return jsonify({
        "id": category.id,
        "user_id": category.user_id,
        "type": category.type,
        "name": category.name,
        "icon": category.icon
    }), 201


# Update category by ID
@app.route("/categories/<int:category_id>", methods=["PUT"])
def update_category(category_id):

    category = Category.query.get(category_id)

    if not category:
        return jsonify({"message": "Category not found"}), 404

    data = request.json

    name = data.get("name")
    icon = data.get("icon")
    type_ = data.get("type")

    # Optional updates (only change if provided)
    if name:
        category.name = name

    if icon:
        category.icon = icon

    if type_:
        category.type = type_

    db.session.commit()

    return jsonify({
        "id": category.id,
        "user_id": category.user_id,
        "type": category.type,
        "name": category.name,
        "icon": category.icon
    }), 200

# Delete a category by ID
@app.delete("/categories/<int:category_id>")
def delete_category(category_id):
    category = Category.query.get(category_id)
    if not category:
        return jsonify({"message": "Category not found"}), 404

    db.session.delete(category)
    db.session.commit()
    return jsonify({"message": "Category deleted"}), 200


# -------------------- REGULAR PAYMENT ENDPOINTS --------------------

# Add a new regular payment
@app.post("/regular_payments")
def add_regular_payment():
    data = request.json
    print("Incoming data:", data)  # <-- Debug incoming data

    user_id = data.get("user_id")
    title = data.get("title")
    type_ = data.get("type")
    category = data.get("category")
    frequency = data.get("frequency")
    start_date_str = data.get("start_date")
    amount = data.get("amount")

    # Check required fields
    if not all([user_id, title, type_, category, frequency, start_date_str, amount]):
        return jsonify({"message": "Missing required fields"}), 400

    try:
        start_date = datetime.strptime(start_date_str, "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"message": "Invalid date format"}), 400

    payment = RegularPayment(
        user_id=user_id,
        title=title,
        type=type_,
        category=category,
        frequency=frequency,
        start_date=start_date,
        amount=Decimal(amount)
    )

    db.session.add(payment)
    db.session.commit()

    return jsonify({"message": "Regular payment created", "payment_id": payment.id}), 201


# Get all regular payments for a user
@app.get("/regular_payments/<int:user_id>")
def get_regular_payments(user_id):
    payments = RegularPayment.query.filter_by(user_id=user_id).all()
    result = []

    for p in payments:
        result.append({
            "id": p.id,
            "user_id": p.user_id,
            "title": p.title,
            "type": p.type,
            "category": p.category,
            "frequency": p.frequency,
            "start_date": p.start_date.strftime("%Y-%m-%d"),
            "amount": float(p.amount)
        })

    return jsonify(result), 200


# Update a regular payment by ID
@app.put("/regular_payments/<int:payment_id>")
def update_regular_payment(payment_id):
    payment = RegularPayment.query.get(payment_id)
    if not payment:
        return jsonify({"message": "Regular payment not found"}), 404

    data = request.json

    # Update only provided fields
    for field in ["title", "type", "category", "frequency", "start_date", "amount"]:
        if field in data:
            if field == "start_date":
                try:
                    payment.start_date = datetime.strptime(data[field], "%Y-%m-%d").date()
                except ValueError:
                    return jsonify({"message": "Invalid date format"}), 400
            elif field == "amount":
                payment.amount = Decimal(data[field])
            else:
                setattr(payment, field, data[field])
    db.session.commit()
    return jsonify({"message": "Regular payment updated", "payment_id": payment.id}), 200


# Delete a regular payment by ID
@app.delete("/regular_payments/<int:payment_id>")
def delete_regular_payment(payment_id):
    payment = RegularPayment.query.get(payment_id)
    if not payment:
        return jsonify({"message": "Regular payment not found"}), 404

    db.session.delete(payment)
    db.session.commit()
    return jsonify({"message": "Regular payment deleted"}), 200



# -------------------- REPORT ENDPOINTS --------------------

@app.get("/report/monthly/<int:user_id>")
def get_monthly_report(user_id):
    month = int(request.args.get("month"))
    year = int(request.args.get("year"))

    # Total expenses
    total_expenses = (
        db.session.query(func.coalesce(func.sum(Expense.amount), 0))
        .filter(
            Expense.user_id == user_id,
            func.extract("month", Expense.date) == month,
            func.extract("year", Expense.date) == year
        )
        .scalar()
    )

    # Total income
    total_income = (
        db.session.query(func.coalesce(func.sum(Income.amount), 0))
        .filter(
            Income.user_id == user_id,
            func.extract("month", Income.date) == month,
            func.extract("year", Income.date) == year
        )
        .scalar()
    )

    balance = float(total_income - total_expenses)

    return jsonify({
        "expenses": float(total_expenses),
        "income": float(total_income),
        "balance": balance
    }), 200




@app.get("/budget/monthly/<int:user_id>")
def get_monthly_budgets(user_id):
    month = int(request.args.get("month"))
    year = int(request.args.get("year"))

    try:
        # Get all budgets for this user for this month/year
        budgets = Budget.query.filter_by(user_id=user_id).all()

        result = []

        for b in budgets:
            # Calculate spent from Expense table
            spent = db.session.query(
                db.func.coalesce(db.func.sum(Expense.amount), 0)
            ).filter(
                Expense.user_id == user_id,
                Expense.category == b.category,
                db.extract('month', Expense.date) == month,
                db.extract('year', Expense.date) == year
            ).scalar()

            remaining = float(b.amount) - float(spent)

            result.append({
                "id": b.id,
                "category": b.category,
                "budget": float(b.amount),
                "spent": float(spent),
                "remaining": float(remaining),
                "month": b.month,
                "year": b.year
            })

        return jsonify(result), 200

    except Exception as e:
        print("ERROR:", str(e))
        return jsonify({"message": "Server error", "error": str(e)}), 500








# -------------------- TESSERACT PATH --------------------
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"


# =========================================================
# 🧠 OCR API (NO IMAGE SAVING)
# =========================================================
@app.route("/ocr", methods=["POST"])
def ocr():
    try:
        if "image" not in request.files:
            return jsonify({"error": "No image uploaded"}), 400

        file = request.files["image"]

        # ✅ Read image
        image_bytes = file.read()
        image = Image.open(io.BytesIO(image_bytes))

        # ================================
        # 🔥 IMPROVE OCR QUALITY
        # ================================
        image = np.array(image)
        image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        # increase contrast
        image = cv2.threshold(image, 150, 255, cv2.THRESH_BINARY)[1]

        # ================================
        # 🔍 OCR
        # ================================
        text = pytesseract.image_to_string(image)

        # ================================
        # 🧹 CLEAN TEXT
        # ================================
        text = text.upper()
        text = text.replace(",", ".")  # normalize decimal

        # fix common OCR mistakes
        text = text.replace("O", "0")
        text = text.replace("I", "1")
        text = text.replace("S", "5")
        text = text.replace("B", "8")

        print("OCR TEXT:\n", text)

        # ================================
        # 📊 EXTRACT
        # ================================
        amount = extract_amount(text)
        date = extract_date(text)

        print("EXTRACTED AMOUNT:", amount)
        print("EXTRACTED DATE:", date)

        final_date = date.strftime("%Y-%m-%d") if date else None

        return jsonify({
            "amount": amount,
            "date": final_date
        }), 200

    except Exception as e:
        print("OCR ERROR:", e)
        return jsonify({"error": "OCR failed"}), 500



def extract_amount(text):
    lines = text.upper().split("\n")

    total_keywords = [
        "TOTAL", "GRAND TOTAL", "AMOUNT DUE",
        "NET TOTAL", "TOTAL AMOUNT",
        "TOTAL PAYMENT", "BALANCE DUE"
    ]

    def find_amounts(line):
        return re.findall(r"(?:RM|MYR)?\s*(\d+\.\d{2})", line)

    # =====================================================
    # 1️⃣ PRIORITY: TOTAL LINE (MOST ACCURATE)
    # =====================================================
    for line in lines:
        clean = re.sub(r"\s+", " ", line)

        for kw in total_keywords:
            if kw in clean:
                amounts = find_amounts(clean)
                if amounts:
                    return float(amounts[-1])

    # =====================================================
    # 2️⃣ SECOND: bottom section (common receipt layout)
    # =====================================================
    bottom = lines[-12:]

    bottom_values = []
    for line in bottom:
        vals = find_amounts(line)
        bottom_values += vals

    if bottom_values:
        # take LARGEST but NOT crazy values
        values = [float(v) for v in bottom_values if 1 < float(v) < 10000]
        if values:
            return max(values)

    # =====================================================
    # 3️⃣ FINAL: fallback safe max
    # =====================================================
    all_vals = re.findall(r"\d+\.\d{2}", text)

    values = [float(v) for v in all_vals if 1 < float(v) < 10000]

    if values:
        return max(values)

    return None


MONTHS = {
    "JAN": "01", "FEB": "02", "MAR": "03", "APR": "04",
    "MAY": "05", "JUN": "06", "JUL": "07", "AUG": "08",
    "SEP": "09", "OCT": "10", "NOV": "11", "DEC": "12"
}


def parse_numeric_date(date_str):
    match = re.search(r"(\d{2,4})[/-](\d{1,2})[/-](\d{1,2})", date_str)
    if not match:
        return None

    a, b, c = match.groups()

    try:
        # CASE 1: YYYY-MM-DD or YYYY/MM/DD
        if len(a) == 4:
            y, m, d = int(a), int(b), int(c)

        # CASE 2: DD-MM-YYYY or DD/MM/YYYY
        elif len(c) == 4:
            d, m, y = int(a), int(b), int(c)

        # CASE 3: fallback guess (VERY IMPORTANT FIX)
        else:
            d, m, y = int(a), int(b), int("20" + c)

        # 🔥 VALIDATE DATE (prevents 2013 wrong parsing)
        return datetime(y, m, d)

    except:
        return None


def extract_date(text):
    lines = text.split("\n")

    # 1️⃣ PRIORITY: DATE line
    for line in lines:
        if re.search(r"\bDATE\b", line, re.IGNORECASE):

            clean = re.sub(r"DATE\s*[:\-]?\s*", "", line, flags=re.IGNORECASE)

            parsed = parse_numeric_date(clean)
            if parsed:
                return parsed

            match = re.search(r"(\d{1,2})\s+([A-Z]{3,})\s+(\d{4})", clean)
            if match:
                d, mon, y = match.groups()
                mon = mon[:3]
                if mon in MONTHS:
                    return datetime(int(y), int(MONTHS[mon]), int(d))

    # 2️⃣ FULL TEXT
    parsed = parse_numeric_date(text)
    if parsed:
        return parsed

    # 3️⃣ TEXT FORMAT
    match = re.search(r"(\d{1,2})\s+([A-Z]{3})\s+(\d{4})", text)
    if match:
        d, mon, y = match.groups()
        if mon in MONTHS:
            return datetime(int(y), int(MONTHS[mon]), int(d))

    return None





# =========================================================
# 🌐 PLAYWRIGHT SCRAPER
# =========================================================



def scrape_with_playwright(url):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print("🌐 OPEN:", url)

        result = {
            "amount": None,
            "date": None,
            "title": "E-Invoice Receipt"
        }

        try:
            # =========================================================
            # 📄 AEON PDF HANDLING
            # =========================================================
            if "aeon" in url.lower():
                print("📄 AEON DETECTED → downloading PDF")

                response = requests.get(url, timeout=30)

                if "pdf" in response.headers.get("content-type", "").lower():
                    file_path = "temp_receipt.pdf"
                    with open(file_path, "wb") as f:
                        f.write(response.content)

                    text = extract_text_from_pdf(file_path)
                else:
                    text = ""

            # =========================================================
            # 🌐 NORMAL WEB PAGE
            # =========================================================
            else:
                page.goto(url, wait_until="domcontentloaded", timeout=60000)

                try:
                    page.wait_for_selector("text=Total", timeout=15000)
                except:
                    page.wait_for_load_state("networkidle")

                text = page.inner_text("body")

            print("📄 TEXT SAMPLE:\n", text[:1200])

            # =========================================================
            # 💰 AMOUNT EXTRACTION (FIXED)
            # =========================================================
            amount = None

            priority_patterns = [
                r"(?:Grand\s+Total|Total\s+Payable|Amount\s+Including\s+Tax)[^\d]*(\d{1,3}(?:,\d{3})*\.\d{2})",
                r"(?:Total)[^\d]*(\d{1,3}(?:,\d{3})*\.\d{2})"
            ]

            for pattern in priority_patterns:
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    amount = float(match.group(1).replace(",", ""))
                    break

            # fallback → take biggest number (usually total)
            if amount is None:
                matches = re.findall(r"(?:RM|MYR)?\s*(\d{1,3}(?:,\d{3})*\.\d{2})", text)
                if matches:
                    amount = max([float(m.replace(",", "")) for m in matches])

            result["amount"] = amount

            # =========================================================
            # 📅 DATE EXTRACTION (FIXED FOR YOUR CASE)
            # =========================================================
            date = None

            # MR DIY / MyInvois format: 2026-03-10
            match = re.search(r"(\d{4}-\d{2}-\d{2})", text)

            if match:
                raw_date = match.group(1)
                try:
                    dt = datetime.strptime(raw_date, "%Y-%m-%d")
                    date = dt.strftime("%d/%m/%Y")  # 10/03/2026
                except:
                    date = None

            # fallback (optional)
            if date is None:
                match2 = re.search(r"(\d{2}/\d{2}/\d{4})", text)
                if match2:
                    date = match2.group(1)

            result["date"] = date

            # =========================================================
            # 🏪 TITLE EXTRACTION (optional improvement)
            # =========================================================
            title_match = re.search(
                r"(MR\.?\s*D\.?I\.?Y\.?|AEON|7-ELEVEN|LOTUS|TESCO)",
                text,
                re.IGNORECASE
            )

            if title_match:
                result["title"] = title_match.group(1)

            browser.close()

            print("✅ FINAL RESULT:", result)
            return result

        except Exception as e:
            browser.close()
            print("❌ ERROR:", str(e))

            return {
                "amount": None,
                "date": None,
                "title": "E-Invoice Receipt",
                "error": str(e)
            }

# =========================================================
# 📄 PDF PARSER (AEON FIX)
# =========================================================
def extract_text_from_pdf(path):
    text = ""

    try:
        with pdfplumber.open(path) as pdf:
            for page in pdf.pages:
                text += page.extract_text() + "\n"
    except Exception as e:
        print("❌ PDF PARSE ERROR:", e)

    return text


# =========================================================
# 📅 DATE PARSER
# =========================================================
def parse_einvoice_date(date_str):
    if not date_str:
        return None

    date_str = date_str.strip()

    formats = [
        "%d/%m/%Y", "%d-%m-%Y",
        "%d/%m/%y", "%d-%m-%y",
        "%d %b %Y", "%d %B %Y",
        "%m/%d/%Y"
    ]

    for fmt in formats:
        try:
            dt = datetime.strptime(date_str, fmt)
            if 2020 <= dt.year <= 2030:
                return dt.strftime("%Y-%m-%d")
        except:
            continue

    return None


def normalize_date(date_str):
    if not date_str:
        return None

    try:
        # already correct format
        if len(date_str) == 10 and date_str[4] == "-":
            y, m, d = date_str.split("-")

            # detect broken year like 2018 vs 2026 issue
            if int(y) < 2020:
                # assume OCR/website swapped year/day
                return f"20{d}-{m}-{y[-2:]}"  # fallback fix

            return date_str

    except:
        return None







# =========================================================
# 📡 API ENDPOINT (REPLACE OLD ONE)
# =========================================================
@app.route("/parse-einvoice", methods=["POST"])
def parse_einvoice():
    try:
        data = request.get_json()
        url = data.get("url")

        print("🌐 URL:", url)   # ✅ HERE

        if not url:
            return jsonify({
                "amount": None,
                "date": None,
                "title": "E-Invoice",
                "error": "Missing URL"
            }), 400

        result = scrape_with_playwright(url)

        print("📥 PARSED RESULT:", result)

        return jsonify(result), 200

    except Exception as e:
        print("❌ PARSE ERROR:", str(e))

        return jsonify({
            "amount": None,
            "date": None,
            "title": "E-Invoice",
            "error": str(e)
        }), 500




# load_dotenv()
# client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


# # =========================
# # 🔥 GET USER CATEGORIES
# # =========================
# def get_user_categories(user_id):
#     categories = Category.query.filter_by(
#         user_id=user_id,
#         type="expense"   # only expense categories
#     ).all()

#     return [c.name for c in categories]


# # =========================
# # 🎤 TRANSCRIBE API
# # =========================
# @app.route("/transcribe", methods=["POST"])
# def transcribe():
#     try:
#         print("🔥 REQUEST RECEIVED")

#         # =========================
#         # ✅ CHECK FILE
#         # =========================
#         if "file" not in request.files:
#             return jsonify({"error": "No file uploaded"}), 400

#         file = request.files["file"]

#         # =========================
#         # ✅ GET USER ID
#         # =========================
#         user_id = request.form.get("userId")

#         if not user_id:
#             return jsonify({"error": "Missing userId"}), 400

#         user_id = int(user_id)

#         print("👤 USER ID:", user_id)

#         # =========================
#         # ✅ SAVE AUDIO
#         # =========================
#         filepath = "temp.m4a"
#         file.save(filepath)

#         # =========================
#         # 🎤 WHISPER
#         # =========================
#         with open(filepath, "rb") as audio:
#             transcript = client.audio.transcriptions.create(
#                 model="gpt-4o-mini-transcribe",
#                 file=audio
#             )

#         text = transcript.text
#         print("🗣 TRANSCRIBED TEXT:", text)

#         # =========================
#         # 📂 GET USER CATEGORIES
#         # =========================
#         categories = get_user_categories(user_id)

#         # fallback (important)
#         if not categories:
#             categories = ["food", "transport", "billing"]

#         print("📂 USER CATEGORIES:", categories)

#         # =========================
#         # 🧠 GPT PROMPT
#         # =========================
#         today = datetime.today().strftime("%Y-%m-%d")

#         prompt = get_expense_prompt(text, today, categories)

#         print("🧠 PROMPT SENT TO AI")

#         # =========================
#         # 🤖 GPT CALL
#         # =========================
#         chat = client.chat.completions.create(
#             model="gpt-4o-mini",
#             messages=[{"role": "user", "content": prompt}],
#             response_format={"type": "json_object"}
#         )

#         result = chat.choices[0].message.content
#         print("🤖 RAW GPT RESULT:", result)

#         # =========================
#         # ✅ PARSE JSON
#         # =========================
#         try:
#             parsed = json.loads(result)
#         except:
#             parsed = {
#                 "amount": None,
#                 "note": "General expense",
#                 "suggestedCategory": "",
#                 "date": today
#             }

#         print("✅ FINAL PARSED:", parsed)

#         # =========================
#         # ✅ RESPONSE
#         # =========================
#         return jsonify({
#             "text": text,
#             "result": parsed
#         })

#     except Exception as e:
#         print("🔥 BACKEND ERROR:", str(e))
#         return jsonify({
#             "error": str(e)
#         }), 500



# @app.route("/chat", methods=["POST"])
# def chat():
#     try:
#         data = request.json

#         user_input = data.get("message")
#         user_id = data.get("userId")
#         current_expense = data.get("currentExpense")  # from frontend

#         if not user_input:
#             return jsonify({"error": "Missing message"}), 400

#         # =========================
#         # 🧠 DETECT INTENT
#         # =========================
#         intent_prompt = detect_intent_prompt(user_input)

#         intent_res = client.chat.completions.create(
#             model="gpt-4o-mini",
#             messages=[{"role": "user", "content": intent_prompt}],
#             response_format={"type": "json_object"}
#         )

#         intent_json = json.loads(intent_res.choices[0].message.content)
#         intent = intent_json.get("intent")

#         print("🧠 INTENT:", intent)

#         # =========================
#         # 📂 GET CATEGORIES
#         # =========================
#         categories = get_user_categories(user_id)
#         if not categories:
#             categories = ["food", "transport", "billing"]

#         today = datetime.today().strftime("%Y-%m-%d")

#         # =========================
#         # 🧾 HANDLE INTENTS
#         # =========================

#         # 1️⃣ EXTRACT NEW EXPENSE
#         if intent == "extract":
#             prompt = get_expense_prompt(user_input, today, categories)

#             res = client.chat.completions.create(
#                 model="gpt-4o-mini",
#                 messages=[{"role": "user", "content": prompt}],
#                 response_format={"type": "json_object"}
#             )

#             parsed = json.loads(res.choices[0].message.content)

#             return jsonify({
#                 "intent": "extract",
#                 "expense": parsed
#             })

#         # 2️⃣ UPDATE EXISTING EXPENSE
#         elif intent == "update":
#             if not current_expense:
#                 return jsonify({"error": "No current expense to update"}), 400

#             prompt = update_expense_prompt(user_input, current_expense)

#             res = client.chat.completions.create(
#                 model="gpt-4o-mini",
#                 messages=[{"role": "user", "content": prompt}],
#                 response_format={"type": "json_object"}
#             )

#             updated = json.loads(res.choices[0].message.content)

#             return jsonify({
#                 "intent": "update",
#                 "expense": updated
#             })

#         # 3️⃣ CONFIRM & SAVE
#         elif intent == "confirm":
#             if not current_expense:
#                 return jsonify({"error": "Nothing to save"}), 400

#             # 👉 SAVE TO DATABASE HERE
#             new_expense = Expense(
#                 user_id=user_id,
#                 amount=current_expense["amount"],
#                 note=current_expense["note"],
#                 category=current_expense["suggestedCategory"],
#                 date=current_expense["date"]
#             )

#             db.session.add(new_expense)
#             db.session.commit()

#             return jsonify({
#                 "intent": "confirm",
#                 "message": "Expense saved successfully"
#             })

#         elif intent == "chat":
#             return jsonify({
#                 "intent": "chat",
#                 "message": "👋 What can I help you?",
#                 "actions": [
#                     "Add Expense",
#                     "Add Budget",
#                     "Add Regular Payment"
#                 ]
#             })

#         else:
#             return jsonify({"error": "Unknown intent"}), 400

#     except Exception as e:
#         print("🔥 CHAT ERROR:", str(e))
#         return jsonify({"error": str(e)}), 500


# @app.route("/ai-extract-expense", methods=["POST"])
# def ai_extract_expense():
#     try:
#         data = request.json
#         text = data.get("text")

#         result = call_openai(prompt)

#         return jsonify(result)

#     except Exception as e:
#         print("ERROR:", e)
#         return jsonify({
#             "error": str(e)
#         }), 500



load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


# =========================
# MISSING FUNCTION (ADDED)
# =========================
def get_user_categories(user_id):
    categories = Category.query.filter_by(
        user_id=user_id,
        type="expense"
    ).all()

    return [c.name for c in categories]


# =========================
# MAIN API (VOICE + TEXT)
# =========================
@app.route("/transcribe", methods=["POST"])
def transcribe():
    try:
        print("🔥 REQUEST RECEIVED")

        user_id = request.form.get("userId")
        if not user_id:
            return jsonify({"error": "Missing userId"}), 400

        user_id = int(user_id)

        text = None

        # ======================
        # AUDIO
        # ======================
        if "file" in request.files:
            file = request.files["file"]
            filepath = "temp.m4a"
            file.save(filepath)

            with open(filepath, "rb") as audio:
                transcript = client.audio.transcriptions.create(
                    model="gpt-4o-mini-transcribe",
                    file=audio
                )

            text = transcript.text
            print("🗣 TRANSCRIBED:", text)

        # ======================
        # TEXT INPUT
        # ======================
        else:
            data = request.get_json(silent=True) or {}
            text = request.form.get("text") or data.get("text")

        # 🔥 ✅ ADD THIS LINE HERE (IMPORTANT FIX)
        flow_override = request.form.get("flow")

        if not text:
            return jsonify({"error": "No input text"}), 400

        print("🧠 FINAL TEXT:", text)

        final_text = text


        # =========================
        # FLOW OVERRIDE (MUST BE FIRST)
        # =========================
        flow_override = request.form.get("flow")
        print("📌 FLOW OVERRIDE:", flow_override)

        intent = None  # default

        if flow_override == "regularPayment":
            intent = "add_regular_payment"
        elif flow_override == "budget":
            intent = "add_budget"
        elif flow_override == "expense":
            intent = "add_expense"

        # =========================
        # INTENT DETECTION (ONLY IF NO FLOW)
        # =========================
        if intent is None:

            intent_prompt = f"""
        Classify the user's intent.

        User input:
        "{text}"

        Return JSON:
        {{
        "intent": "add_expense | add_budget | add_regular_payment | query_total | query_category | query_summary | unknown"
        }}
        """

            intent_res = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": intent_prompt}],
                response_format={"type": "json_object"}
            )

            intent_data = json.loads(intent_res.choices[0].message.content)
            intent = intent_data.get("intent")

        print("🧠 FINAL INTENT:", intent)


        # =========================
        # 🔥 SMART RULE FIX (IMPORTANT)
        # prevents AI mistakes like "add_budget"
        # =========================
        text_lower = text.lower()

        if intent == "add_budget" and (
            "youtube" in text_lower or "netflix" in text_lower or "spotify" in text_lower
        ):
            intent = "add_regular_payment"

        # =========================
        # CATEGORY LIST
        # =========================
        categories = get_user_categories(user_id)
        if not categories:
            categories = ["food", "transport", "shopping", "billing"]

        today = datetime.today().strftime("%Y-%m-%d")


        def normalize_category(cat):
            if not cat:
                return "other"
            return cat.lower().strip()

        # =========================
        # ADD EXPENSE
        # =========================
        if intent == "add_expense":
            prompt = get_expense_prompt(text, today, categories)

            chat = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )

            result = json.loads(chat.choices[0].message.content)

            return jsonify({
                "type": "expense",
                "text": final_text,
                "intent": intent,
                "result": result
            })

        # =========================
        # ADD BUDGET
        # =========================
        elif intent == "add_budget":

            prompt = get_budget_prompt(text, today, categories)

            chat = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )

            result = json.loads(chat.choices[0].message.content)

            return jsonify({
                "type": "budget",
                "text": final_text,
                "intent": intent,
                "result": result
            })

        # =========================
        # ADD REGULAR PAYMENT
        # =========================
        elif intent == "add_regular_payment":
            try:
                prompt = get_regular_payment_prompt(text, today, categories)

                chat = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[{"role": "user", "content": prompt}],
                    response_format={"type": "json_object"}
                )

                raw = chat.choices[0].message.content
                print("🧠 RAW AI RESPONSE:", raw)

                result = json.loads(raw)

                category = result.get("suggestedCategory") or result.get("category") or "general"
                category = category.lower().strip()

                result["category"] = category
                result["suggestedCategory"] = category

                # =========================
                # SAFETY FALLBACK FOR AMOUNT
                # =========================
                if not result.get("amount") or result["amount"] == 0:
                    digit_match = re.search(r"(\d+(\.\d{1,2})?)", text)
                    if digit_match:
                        result["amount"] = float(digit_match.group())
                    else:
                        try:
                            result["amount"] = float(w2n.word_to_num(text))
                        except:
                            result["amount"] = 0

                return jsonify({
                    "type": "regular_payment",
                    "text": final_text,
                    "intent": intent,
                    "result": result
                })

            except Exception as e:
                print("🔥 REGULAR PAYMENT ERROR:", str(e))

                return jsonify({
                    "error": str(e),
                    "intent": intent,
                    "result": None
                }), 500


        # =========================
        # PREP CLEAN TEXT FIRST (MUST BE FIRST)
        # =========================
        text_lower = text.lower()
        clean_text = text_lower

        # =========================
        # CATEGORY DETECTION
        # =========================

        user_categories = get_user_categories(user_id) or []

        matched_category = None

        for cat in user_categories:
            pattern = r'\b' + re.escape(cat.lower()) + r'\b'
            if re.search(pattern, clean_text):
                matched_category = cat
                break


        # =========================
        # 🔥 HARD OVERRIDE RULE (IMPORTANT)
        # =========================

        # If ANY category is mentioned → ALWAYS query_category
        if matched_category:
            intent = "query_category"

        # =========================
        # QUERY TOTAL
        # =========================
        if intent == "query_total":

            today_dt = datetime.today()
            text_lower = text.lower()

            if "this week" in text_lower:

                # Monday of current week
                start = (today_dt - timedelta(days=today_dt.weekday())).replace(
                    hour=0, minute=0, second=0, microsecond=0
                )

                end = today_dt.replace(
                    hour=23, minute=59, second=59, microsecond=999999
                )

            elif "last week" in text_lower:

                # Monday of THIS week
                this_monday = (today_dt - timedelta(days=today_dt.weekday())).replace(
                    hour=0, minute=0, second=0, microsecond=0
                )

                # last week = 7 days before this Monday
                start = this_monday - timedelta(days=7)
                end = this_monday - timedelta(seconds=1)

            elif "today" in text_lower:
                start = today_dt.replace(hour=0, minute=0, second=0, microsecond=0)
                end = today_dt.replace(hour=23, minute=59, second=59, microsecond=999999)

            elif "yesterday" in text_lower:
                yesterday = today_dt - timedelta(days=1)
                start = yesterday.replace(hour=0, minute=0, second=0, microsecond=0)
                end = yesterday.replace(hour=23, minute=59, second=59, microsecond=999999)

            elif "this month" in text_lower:
                start = today_dt.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
                end = today_dt.replace(hour=23, minute=59, second=59, microsecond=999999)

            elif "last month" in text_lower:
                first_day_this_month = today_dt.replace(day=1)
                last_month_last_day = first_day_this_month - timedelta(days=1)

                start = last_month_last_day.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
                end = last_month_last_day.replace(hour=23, minute=59, second=59, microsecond=999999)

            elif "last 7 days" in text_lower:
                start = (today_dt - timedelta(days=6)).replace(hour=0, minute=0, second=0, microsecond=0)
                end = today_dt.replace(hour=23, minute=59, second=59, microsecond=999999)

            else:
                start = (today_dt - timedelta(days=today_dt.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
                end = today_dt.replace(hour=23, minute=59, second=59, microsecond=999999)

            total = db.session.query(func.sum(Expense.amount)).filter(
                Expense.user_id == user_id,
                Expense.date >= start,
                Expense.date <= end
            ).scalar() or 0

            return jsonify({
            "type": "answer",
            "text": text,
            "intent": intent,
            "date_range": {
                "start": start.strftime("%Y-%m-%d"),
                "end": end.strftime("%Y-%m-%d")
            },
            "answer": f"You spent RM{total:.2f} from {start.strftime('%d %b %Y')} to {end.strftime('%d %b %Y')}"
        })


        # =========================
        # QUERY SUMMARY / CATEGORY
        # =========================
        elif intent in ["query_summary", "query_category"]:

            today_dt = datetime.today()
            text_lower = text.lower()

            # =========================
            # DATE RANGE LOGIC
            # =========================
            if "today" in text_lower:
                start = today_dt.replace(hour=0, minute=0, second=0, microsecond=0)
                end = today_dt.replace(hour=23, minute=59, second=59, microsecond=999999)

            elif "yesterday" in text_lower:
                yesterday = today_dt - timedelta(days=1)
                start = yesterday.replace(hour=0, minute=0, second=0, microsecond=0)
                end = yesterday.replace(hour=23, minute=59, second=59, microsecond=999999)

            elif "last week" in text_lower:
                start = (today_dt - timedelta(days=today_dt.weekday() + 7)).replace(
                    hour=0, minute=0, second=0, microsecond=0
                )
                end = start + timedelta(days=6, hours=23, minutes=59, seconds=59)

            elif "this week" in text_lower:
                start = (today_dt - timedelta(days=today_dt.weekday())).replace(
                    hour=0, minute=0, second=0, microsecond=0
                )
                end = today_dt.replace(hour=23, minute=59, second=59, microsecond=999999)

            elif "last month" in text_lower:
                first_day_this_month = today_dt.replace(day=1)
                last_month_last_day = first_day_this_month - timedelta(days=1)

                start = last_month_last_day.replace(
                    day=1, hour=0, minute=0, second=0, microsecond=0
                )
                end = last_month_last_day.replace(
                    hour=23, minute=59, second=59, microsecond=999999
                )

            elif "this month" in text_lower:
                start = today_dt.replace(
                    day=1, hour=0, minute=0, second=0, microsecond=0
                )
                end = today_dt.replace(
                    hour=23, minute=59, second=59, microsecond=999999
                )

            else:
                # fallback = this month
                start = today_dt.replace(
                    day=1, hour=0, minute=0, second=0, microsecond=0
                )
                end = today_dt.replace(
                    hour=23, minute=59, second=59, microsecond=999999
                )

            # =========================
            # GET USER CATEGORIES
            # =========================
            user_categories = get_user_categories(user_id)

            if not user_categories:
                user_categories = [
                    "food",
                    "transport",
                    "billing",
                    "shopping",
                    "health",
                    "entertainment"
                ]

            # =========================
            # CLEAN USER TEXT
            # =========================

            clean_text = text_lower
            clean_text = re.sub(r'\b(category|on|the|for|spending|expense|expenses)\b', '', clean_text)
            clean_text = re.sub(r'\s+', ' ', clean_text).strip()

            # =========================
            # CASE 1: USER ASK SPECIFIC CATEGORY
            # =========================
            if matched_category:
                total = db.session.query(func.sum(Expense.amount)).filter(
                    Expense.user_id == user_id,
                    Expense.category.ilike(matched_category),
                    Expense.date >= start,
                    Expense.date <= end
                ).scalar() or 0

                return jsonify({
                    "type": "answer",
                    "text": text,
                    "intent": intent,
                    "answer": f"I couldn't find category '{clean_text}'. Try food, transport, shopping, etc.",
                    "date_range": {
                        "start": start.strftime("%Y-%m-%d"),
                        "end": end.strftime("%Y-%m-%d")
                    }
                })

            # =========================
            # CASE 2: USER ASK "MOST"
            # =========================
            if any(word in text_lower for word in ["most", "highest", "top", "biggest"]):
                result = db.session.query(
                    Expense.category,
                    func.sum(Expense.amount).label("total")
                ).filter(
                    Expense.user_id == user_id,
                    Expense.date >= start,
                    Expense.date <= end
                ).group_by(Expense.category)\
                .order_by(func.sum(Expense.amount).desc())\
                .first()

            # =========================
            # NO DATA
            # =========================
            if not result:
                return jsonify({
                    "type": "answer",
                    "text": text,
                    "intent": intent,
                    "answer": "No expenses found",
                    "date_range": {
                        "start": start.strftime("%Y-%m-%d"),
                        "end": end.strftime("%Y-%m-%d")
                    }
                })

            category, total = result

            # =========================
            # RESPONSE
            # =========================
            return jsonify({
                "type": "answer",
                "text": text,
                "intent": intent,
                "date_range": {
                    "start": start.strftime("%Y-%m-%d"),
                    "end": end.strftime("%Y-%m-%d")
                },
                "answer": f"You spent the most on {category} (RM{total:.2f}) from {start.strftime('%d %b %Y')} to {end.strftime('%d %b %Y')}"
            })

        else:
            return jsonify({
                "type": "answer",
                "text": final_text,
                "intent": intent,
                "answer": "Sorry, I didn’t understand that. Try asking something like:\n- How much did I spend last week?\n- Show my top category this month"
            })

    except Exception as e:
        print("🔥 ERROR:", str(e))
        return jsonify({"error": str(e)}), 500



@app.post("/ai-extract-budget")
def ai_extract_budget():
    try:
        data = request.json or {}
        text = data.get("text", "")
        user_id = data.get("userId")

        if not user_id:
            return jsonify({"error": "Missing userId"}), 400

        text = text.lower().strip()

        # =========================
        # DEFAULT CATEGORIES (FIXED SYNTAX ERROR)
        # =========================
        DEFAULT_CATEGORIES = [
            "food",
            "transport",
            "billing",
            "shopping",
            "health",
            "entertainment"
        ]

        # =========================
        # USER CATEGORIES
        # =========================
        categories = get_user_categories(user_id) or []
        categories = [c.lower().strip() for c in categories]

        # merge + remove duplicates
        all_categories = list(set(DEFAULT_CATEGORIES + categories))

        # =========================
        # PROMPT
        # =========================
        from prompts import get_budget_prompt
        prompt = get_budget_prompt(text, datetime.today().strftime("%Y-%m-%d"), all_categories)

        chat = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )

        result = json.loads(chat.choices[0].message.content)

        amount = result.get("amount", 0)
        category = result.get("category", "general")

        # =========================
        # CLEAN CATEGORY (IMPORTANT FIX)
        # =========================
        if not category or str(category).lower() == "null":
            category = "general"

        category = category.lower().strip()

        return jsonify({
            "amount": amount,
            "category": category
        }), 200

    except Exception as e:
        return jsonify({
            "error": str(e),
            "amount": 0,
            "category": "general"
        }), 500



@app.post("/ai-extract-regular-payment")
def ai_extract_regular_payment():
    data = request.json
    text = data.get("text", "")

    print("\n==============================")
    print("📩 REQUEST RECEIVED (REGULAR PAYMENT)")
    print("🧠 RAW TEXT:", text)

    text = text.lower()
    print("🧠 FINAL TEXT:", text)

    amount = 0
    title = "Untitled"
    category = "General"
    type_ = "expense"
    frequency = "Monthly"

    # -------------------------
    # AMOUNT
    # -------------------------
    digit_match = re.search(r"(\d+(\.\d{1,2})?)", text)
    if digit_match:
        amount = float(digit_match.group())
    else:
        try:
            amount = float(w2n.word_to_num(text))
        except:
            amount = 0

    # -------------------------
    # TITLE
    # -------------------------
    cleaned = re.sub(r"\d+(\.\d{1,2})?", "", text)
    cleaned = cleaned.replace("monthly", "").replace("weekly", "").replace("daily", "").replace("yearly", "")
    title = cleaned.strip().title()[:30] if cleaned.strip() else "Untitled"

    # -------------------------
    # CATEGORY
    # -------------------------
    known_categories = [
        "food", "transport", "shopping",
        "entertainment", "health", "billing"
    ]

    for c in known_categories:
        if c in text:
            category = c.lower().strip()
            break

    # -------------------------
    # TYPE
    # -------------------------
    if "income" in text or "salary" in text:
        type_ = "income"

    # -------------------------
    # FREQUENCY
    # -------------------------
    if "daily" in text:
        frequency = "Daily"
    elif "weekly" in text:
        frequency = "Weekly"
    elif "yearly" in text or "annually" in text:
        frequency = "Yearly"

    result = {
        "title": title,
        "amount": amount,
        "category": category,
        "type": type_,
        "frequency": frequency
    }

    print("✅ PARSED (REGULAR PAYMENT):", result)
    print("==============================\n")

    return jsonify(result), 200





# -------------------- RUN SERVER --------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)

