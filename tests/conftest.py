import builtins
import importlib.util
import io
import json
import sys
import types
from pathlib import Path

import pytest


def _install_stub_modules():
    config_module = types.ModuleType("config")
    config_module.SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    config_module.SQLALCHEMY_TRACK_MODIFICATIONS = False
    sys.modules["config"] = config_module

    scheduler_module = types.ModuleType("scheduler")

    def register_tasks(_scheduler, _app):
        return None

    scheduler_module.register_tasks = register_tasks
    sys.modules["scheduler"] = scheduler_module

    flask_apscheduler = types.ModuleType("flask_apscheduler")

    class APScheduler:
        def init_app(self, _app):
            return None

        def start(self):
            return None

        def add_job(self, *args, **kwargs):
            return None

    flask_apscheduler.APScheduler = APScheduler
    sys.modules["flask_apscheduler"] = flask_apscheduler

    openai_module = types.ModuleType("openai")

    class OpenAI:
        def __init__(self, *args, **kwargs):
            noop = lambda *a, **k: None
            self.audio = types.SimpleNamespace(
                transcriptions=types.SimpleNamespace(create=noop)
            )
            self.chat = types.SimpleNamespace(
                completions=types.SimpleNamespace(create=noop)
            )

    openai_module.OpenAI = OpenAI
    sys.modules["openai"] = openai_module

    dotenv_module = types.ModuleType("dotenv")
    dotenv_module.load_dotenv = lambda: None
    sys.modules["dotenv"] = dotenv_module

    pyzbar_pkg = types.ModuleType("pyzbar")
    pyzbar_submodule = types.ModuleType("pyzbar.pyzbar")
    pyzbar_submodule.decode = lambda *args, **kwargs: []
    pyzbar_pkg.pyzbar = pyzbar_submodule
    sys.modules["pyzbar"] = pyzbar_pkg
    sys.modules["pyzbar.pyzbar"] = pyzbar_submodule

    playwright_pkg = types.ModuleType("playwright")
    playwright_sync = types.ModuleType("playwright.sync_api")

    def sync_playwright():
        raise RuntimeError("playwright not available in tests")

    playwright_sync.sync_playwright = sync_playwright
    playwright_pkg.sync_api = playwright_sync
    sys.modules["playwright"] = playwright_pkg
    sys.modules["playwright.sync_api"] = playwright_sync

    word2number_pkg = types.ModuleType("word2number")
    word2number_pkg.w2n = types.SimpleNamespace(word_to_num=lambda text: 0)
    sys.modules["word2number"] = word2number_pkg


@pytest.fixture(scope="session")
def backend_app_module():
    _install_stub_modules()

    backend_dir = Path(__file__).resolve().parents[1] / "backend"
    if str(backend_dir) not in sys.path:
        sys.path.insert(0, str(backend_dir))

    models_path = backend_dir / "models.py"
    models_spec = importlib.util.spec_from_file_location("models", models_path)
    models_module = importlib.util.module_from_spec(models_spec)
    sys.modules["models"] = models_module
    models_spec.loader.exec_module(models_module)

    app_path = backend_dir / "app.py"
    spec = importlib.util.spec_from_file_location("backend_app_under_test", app_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


@pytest.fixture()
def client(backend_app_module):
    backend_app_module.app.config["TESTING"] = True
    return backend_app_module.app.test_client()


@pytest.fixture()
def app_ctx(backend_app_module):
    with backend_app_module.app.app_context():
        backend_app_module.db.drop_all()
        backend_app_module.db.create_all()
        yield
        backend_app_module.db.session.remove()
        backend_app_module.db.drop_all()


def _fake_chat_response(payload):
    return types.SimpleNamespace(
        choices=[
            types.SimpleNamespace(
                message=types.SimpleNamespace(content=json.dumps(payload))
            )
        ]
    )


def _create_user(
    backend_app_module,
    email="user@example.com",
    password="Password123",
    nickname="User",
):
    user = backend_app_module.User(
        email=email,
        password=backend_app_module.generate_password_hash(password),
        nickname=nickname,
    )
    backend_app_module.db.session.add(user)
    backend_app_module.db.session.commit()
    return user


def _create_expense(
    backend_app_module,
    user_id,
    title="Lunch",
    amount=12.5,
    category="food",
    date_str="2026-04-24",
):
    expense = backend_app_module.Expense(
        user_id=user_id,
        title=title,
        amount=amount,
        category=category,
        date=backend_app_module.datetime.strptime(date_str, "%Y-%m-%d").date(),
    )
    backend_app_module.db.session.add(expense)
    backend_app_module.db.session.commit()
    return expense


def _create_income(
    backend_app_module,
    user_id,
    title="Salary",
    amount=2000,
    category="salary",
    date_str="2026-04-24",
):
    income = backend_app_module.Income(
        user_id=user_id,
        title=title,
        amount=amount,
        category=category,
        date=backend_app_module.datetime.strptime(date_str, "%Y-%m-%d").date(),
    )
    backend_app_module.db.session.add(income)
    backend_app_module.db.session.commit()
    return income


def _create_budget(
    backend_app_module,
    user_id,
    category="food",
    amount=500,
    month=4,
    year=2026,
):
    budget = backend_app_module.Budget(
        user_id=user_id,
        category=category,
        amount=amount,
        month=month,
        year=year,
    )
    backend_app_module.db.session.add(budget)
    backend_app_module.db.session.commit()
    return budget


def _create_category(
    backend_app_module,
    user_id,
    type_="expense",
    name="Coffee",
    icon="cafe",
):
    category = backend_app_module.Category(
        user_id=user_id,
        type=type_,
        name=name,
        icon=icon,
    )
    backend_app_module.db.session.add(category)
    backend_app_module.db.session.commit()
    return category


def _create_monthly_budget(
    backend_app_module,
    user_id,
    amount=1500,
    month=4,
    year=2026,
):
    budget = backend_app_module.MonthlyBudget(
        user_id=user_id,
        amount=amount,
        month=month,
        year=year,
    )
    backend_app_module.db.session.add(budget)
    backend_app_module.db.session.commit()
    return budget


def _create_regular_payment(
    backend_app_module,
    user_id,
    title="Netflix",
    type_="expense",
    category="entertainment",
    frequency="Monthly",
    start_date_str="2026-04-24",
    amount=45,
):
    payment = backend_app_module.RegularPayment(
        user_id=user_id,
        title=title,
        type=type_,
        category=category,
        frequency=frequency,
        start_date=backend_app_module.datetime.strptime(
            start_date_str, "%Y-%m-%d"
        ).date(),
        amount=amount,
    )
    backend_app_module.db.session.add(payment)
    backend_app_module.db.session.commit()
    return payment
