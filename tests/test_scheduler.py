import importlib.util
from datetime import date as real_date
from pathlib import Path


def load_scheduler_module():
    path = Path(__file__).resolve().parents[1] / "backend" / "scheduler.py"
    spec = importlib.util.spec_from_file_location("scheduler_under_test", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class FixedDate(real_date):
    @classmethod
    def today(cls):
        return cls(2026, 3, 31)


def test_register_tasks_adds_expected_job(backend_app_module):
    scheduler = load_scheduler_module()

    calls = []

    class FakeScheduler:
        def add_job(self, **kwargs):
            calls.append(kwargs)

    fake_scheduler = FakeScheduler()
    fake_app = object()

    scheduler.register_tasks(fake_scheduler, fake_app)

    assert calls == [
        {
            "id": "generate_transactions",
            "func": scheduler.generate_transactions,
            "args": [fake_app],
            "trigger": "interval",
            "seconds": 10,
        }
    ]


def test_generate_transactions_creates_daily_expenses_and_updates_last_date(
    backend_app_module, app_ctx, monkeypatch
):
    scheduler = load_scheduler_module()
    monkeypatch.setattr(scheduler, "date", FixedDate)

    user = backend_app_module.User(
        email="scheduler-daily@example.com",
        password="hashed",
        nickname="Daily",
    )
    backend_app_module.db.session.add(user)
    backend_app_module.db.session.commit()

    payment = backend_app_module.RegularPayment(
        user_id=user.user_id,
        title="Coffee",
        type="expense",
        category="food",
        frequency="Daily",
        start_date=real_date(2026, 3, 29),
        amount=5.50,
        last_generated_date=real_date(2026, 3, 29),
    )
    backend_app_module.db.session.add(payment)
    backend_app_module.db.session.commit()

    scheduler.generate_transactions(backend_app_module.app)

    expenses = (
        backend_app_module.Expense.query.filter_by(title="Coffee")
        .order_by(backend_app_module.Expense.date)
        .all()
    )

    assert [expense.date.isoformat() for expense in expenses] == [
        "2026-03-30",
        "2026-03-31",
    ]
    assert payment.last_generated_date == FixedDate.today()


def test_generate_transactions_skips_invalid_month_days(
    backend_app_module, app_ctx, monkeypatch
):
    scheduler = load_scheduler_module()
    monkeypatch.setattr(scheduler, "date", FixedDate)

    user = backend_app_module.User(
        email="scheduler-monthly@example.com",
        password="hashed",
        nickname="Monthly",
    )
    backend_app_module.db.session.add(user)
    backend_app_module.db.session.commit()

    payment = backend_app_module.RegularPayment(
        user_id=user.user_id,
        title="Rent",
        type="expense",
        category="billing",
        frequency="Monthly",
        start_date=real_date(2026, 1, 31),
        amount=800,
    )
    backend_app_module.db.session.add(payment)
    backend_app_module.db.session.commit()

    scheduler.generate_transactions(backend_app_module.app)

    expenses = (
        backend_app_module.Expense.query.filter_by(title="Rent")
        .order_by(backend_app_module.Expense.date)
        .all()
    )

    assert [expense.date.isoformat() for expense in expenses] == [
        "2026-01-31",
        "2026-03-31",
    ]
    assert payment.last_generated_date == FixedDate.today()


def test_generate_transactions_skips_existing_income_records(
    backend_app_module, app_ctx, monkeypatch
):
    scheduler = load_scheduler_module()
    monkeypatch.setattr(scheduler, "date", FixedDate)

    user = backend_app_module.User(
        email="scheduler-income@example.com",
        password="hashed",
        nickname="Income",
    )
    backend_app_module.db.session.add(user)
    backend_app_module.db.session.commit()

    payment = backend_app_module.RegularPayment(
        user_id=user.user_id,
        title="Salary",
        type="income",
        category="salary",
        frequency="Monthly",
        start_date=real_date(2026, 3, 31),
        amount=3000,
    )
    existing = backend_app_module.Income(
        user_id=user.user_id,
        title="Salary",
        category="salary",
        amount=3000,
        date=real_date(2026, 3, 31),
    )
    backend_app_module.db.session.add_all([payment, existing])
    backend_app_module.db.session.commit()

    scheduler.generate_transactions(backend_app_module.app)

    incomes = backend_app_module.Income.query.filter_by(title="Salary").all()
    assert len(incomes) == 1
    assert payment.last_generated_date == FixedDate.today()
