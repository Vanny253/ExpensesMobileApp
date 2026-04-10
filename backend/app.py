from decimal import Decimal
from flask import Flask, request, jsonify
from flask_apscheduler import APScheduler
from flask_cors import CORS
from config import SQLALCHEMY_DATABASE_URI, SQLALCHEMY_TRACK_MODIFICATIONS
from models import db, Expense, Income, User, Budget, Category, RegularPayment
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from sqlalchemy import func
from scheduler import register_tasks
from sqlalchemy.exc import IntegrityError
import os
from werkzeug.utils import secure_filename


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

    budget = Budget(
        user_id=user_id,
        category=category,
        amount=amount,
        month=month,
        year=year,
        create_at=datetime.now()
    )

    db.session.add(budget)
    db.session.commit()

    return jsonify({"message": "Budget created", "budget_id": budget.id}), 201



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









# -------------------- RUN SERVER --------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)

# if __name__ == "__main__":
#     app.run(debug=True)

