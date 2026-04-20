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

    # relationship to other tables
    expenses = db.relationship("Expense", backref="user", lazy=True)
    incomes = db.relationship("Income", backref="user", lazy=True)
    categories = db.relationship("Category", backref="user", lazy=True)



class Expense(db.Model):
    __tablename__ = "expense"
    id = db.Column("expense_id", db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.user_id"), nullable=False)
    title = db.Column(db.String(255))
    amount = db.Column(db.Float)
    category = db.Column(db.String(100))
    date = db.Column(db.Date)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Income(db.Model):
    __tablename__ = "income"
    id = db.Column("income_id", db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.user_id"), nullable=False)
    title = db.Column(db.String(255))
    amount = db.Column(db.Float)
    category = db.Column(db.String(100))
    date = db.Column(db.Date)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Budget(db.Model):
    __tablename__ = "budgets"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.user_id"), nullable=False)
    category = db.Column(db.String(50), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    month = db.Column(db.Integer, nullable=False)
    year = db.Column(db.Integer, nullable=False)
    create_at = db.Column(db.DateTime, default=datetime.utcnow)


class Category(db.Model):
    __tablename__ = "categories"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.user_id"), nullable=False)
    type = db.Column(
        db.Enum("expense", "income", name="category_type"),
        nullable=False
    )
    name = db.Column(db.String(100), nullable=False)
    icon = db.Column(db.String(50), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )


class RegularPayment(db.Model):
    __tablename__ = "regular_payments"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.user_id"), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    type = db.Column(db.Enum('expense', 'income'), nullable=False)
    category = db.Column(db.String(100), nullable=False)
    frequency = db.Column(db.Enum('Daily','Weekly','Monthly','Yearly', name="payment_frequency"), nullable=False)    
    start_date = db.Column(db.Date, nullable=False)      
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    last_generated_date = db.Column(db.Date, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<RegularPayment {self.title} | {self.type} | {self.amount}>"


class MonthlyBudget(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, nullable=False)
    amount = db.Column(db.Float, nullable=False)
    month = db.Column(db.Integer, nullable=False)
    year = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.now)