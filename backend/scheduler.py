from datetime import date, timedelta
from models import db, RegularPayment, Expense, Income


def generate_transactions(app):
    with app.app_context():   # ✅ use app, NOT current_app
        print("Scheduler running...")

        payments = RegularPayment.query.all()
        today = date.today()

        for payment in payments:
            if payment.last_generated_date:
                current_date = payment.last_generated_date + timedelta(days=1)
            else:
                current_date = payment.start_date

            while current_date <= today:

                if payment.type == "expense":
                    exists = Expense.query.filter_by(
                        user_id=payment.user_id,
                        title=payment.title,
                        date=current_date
                    ).first()

                    if not exists:
                        new_tx = Expense(
                            user_id=payment.user_id,
                            title=payment.title,
                            category=payment.category,
                            amount=payment.amount,
                            date=current_date
                        )
                        db.session.add(new_tx)

                elif payment.type == "income":
                    exists = Income.query.filter_by(
                        user_id=payment.user_id,
                        title=payment.title,
                        date=current_date
                    ).first()

                    if not exists:
                        new_tx = Income(
                            user_id=payment.user_id,
                            title=payment.title,
                            category=payment.category,
                            amount=payment.amount,
                            date=current_date
                        )
                        db.session.add(new_tx)

                # frequency
                if payment.frequency == "Daily":
                    current_date += timedelta(days=1)
                elif payment.frequency == "Weekly":
                    current_date += timedelta(weeks=1)
                elif payment.frequency == "Monthly":
                    current_date += timedelta(days=30)
                elif payment.frequency == "Yearly":
                    current_date += timedelta(days=365)

            payment.last_generated_date = today

        db.session.commit()


def register_tasks(scheduler, app):
    scheduler.add_job(
        id="generate_transactions",
        func=generate_transactions,
        args=[app],
        trigger="interval",
        seconds=10
    )