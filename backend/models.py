from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = "user"
    user_id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    nickname = db.Column(db.String(255), nullable=False)
    phone_number = db.Column(db.String(20))
    gender = db.Column(db.String(10))
    date_of_birth = db.Column(db.Date)
    profile_image = db.Column(db.String(255), default="default.png")
    create_at = db.Column(db.DateTime, default=datetime.utcnow)

    # relationship to expenses and incomes
    expenses = db.relationship("Expense", backref="user", lazy=True)
    incomes = db.relationship("Income", backref="user", lazy=True)


class Expense(db.Model):
    __tablename__ = "expense"
    id = db.Column("expense_id", db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.user_id"), nullable=False)
    title = db.Column(db.String(255))
    amount = db.Column(db.Float)
    category = db.Column(db.String(100))
    date = db.Column(db.Date)


class Income(db.Model):
    __tablename__ = "income"
    id = db.Column("income_id", db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.user_id"), nullable=False)
    title = db.Column(db.String(255))
    amount = db.Column(db.Float)
    category = db.Column(db.String(100))
    date = db.Column(db.Date)