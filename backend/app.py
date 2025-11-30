from flask import Flask, request, jsonify
from flask_cors import CORS
from config import *
from models import db, Expense

app = Flask(__name__)
CORS(app)

app.config["SQLALCHEMY_DATABASE_URI"] = SQLALCHEMY_DATABASE_URI
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = SQLALCHEMY_TRACK_MODIFICATIONS
db.init_app(app)

# Create tables
with app.app_context():
    db.create_all()

# Add expense
@app.post("/expense")
def add_expense():
    data = request.json
    expense = Expense(
        title=data["title"],
        amount=data["amount"],
        category=data["category"],
        date=data["date"]
    )
    db.session.add(expense)
    db.session.commit()
    return jsonify({"message": "Expense added"}), 201

# Get all expenses
@app.get("/expenses")
def get_expenses():
    expenses = Expense.query.all()
    result = [
        {"id": e.id, "title": e.title, "amount": e.amount, "category": e.category, "date": e.date}
        for e in expenses
    ]
    return jsonify(result)

if __name__ == "__main__":
    app.run(debug=True)
