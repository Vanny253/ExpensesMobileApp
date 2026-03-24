# scheduler.py
from datetime import date, timedelta
from dateutil.relativedelta import relativedelta
import calendar
from models import db, RegularPayment, Expense, Income

def generate_transactions(app):
    """
    Generate transactions from RegularPayment.
    Handles Daily, Weekly, Monthly, Yearly.
    Monthly respects strict day-of-month and skips invalid months.
    """
    with app.app_context():
        print("Scheduler running...")

        today = date.today()
        payments = RegularPayment.query.all()

        for payment in payments:
            # Start from last generated date or start_date
            if payment.last_generated_date:
                current_date = payment.last_generated_date + timedelta(days=1)
            else:
                current_date = payment.start_date

            while current_date <= today:

                # --- Monthly special case: strict day-of-month ---
                if payment.frequency == "Monthly":
                    year = current_date.year
                    month = current_date.month
                    day = payment.start_date.day  # always use original day
                    last_day = calendar.monthrange(year, month)[1]

                    if day > last_day:
                        # Skip this month
                        current_date += relativedelta(months=1)
                        continue
                    else:
                        current_date = date(year, month, day)

                # --- Check if transaction already exists ---
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

                # --- Increment date based on frequency ---
                if payment.frequency == "Daily":
                    current_date += timedelta(days=1)
                elif payment.frequency == "Weekly":
                    current_date += timedelta(weeks=1)
                elif payment.frequency == "Monthly":
                    current_date += relativedelta(months=1)
                elif payment.frequency == "Yearly":
                    current_date += relativedelta(years=1)

            # Update last generated date
            payment.last_generated_date = today

        # Commit all new transactions
        db.session.commit()
        print("Transactions generated successfully.")


def register_tasks(scheduler, app):
    """
    Register the generate_transactions job with the scheduler.
    Example usage:
        from apscheduler.schedulers.background import BackgroundScheduler
        from scheduler import register_tasks
        scheduler = BackgroundScheduler()
        register_tasks(scheduler, app)
        scheduler.start()
    """
    scheduler.add_job(
        id="generate_transactions",
        func=generate_transactions,
        args=[app],
        trigger="interval",
        seconds=10  # for testing; in production, change to 86400 (1 day)
    )
    print("Scheduler task registered.")