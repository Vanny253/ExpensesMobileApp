import importlib.util
import io
import json
import sys
import types
import builtins
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


@pytest.fixture(scope="module")
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


def _create_user(backend_app_module, email="user@example.com", password="Password123", nickname="User"):
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


def test_extract_amount_prefers_total_line(backend_app_module):
    text = "\n".join(
        [
            "SUBTOTAL RM 10.00",
            "TAX RM 0.60",
            "TOTAL RM 10.60",
            "CASH RM 20.00",
        ]
    )

    assert backend_app_module.extract_amount(text) == 10.60


def test_extract_amount_falls_back_to_bottom_section_max(backend_app_module):
    text = "\n".join(
        [
            "ITEM A 2.50",
            "ITEM B 9.90",
            "SERVICE 3.00",
            "PAID 12.30",
        ]
    )

    assert backend_app_module.extract_amount(text) == 12.30


def test_extract_amount_returns_none_when_no_valid_amount(backend_app_module):
    assert backend_app_module.extract_amount("NO PRICES FOUND") is None


def test_extract_date_reads_date_line_first(backend_app_module):
    result = backend_app_module.extract_date("DATE: 2026-04-18\nTOTAL RM 12.00")

    assert result.strftime("%Y-%m-%d") == "2026-04-18"


def test_extract_date_supports_textual_month_format(backend_app_module):
    result = backend_app_module.extract_date("Receipt created on 18 APR 2026")

    assert result.strftime("%Y-%m-%d") == "2026-04-18"


def test_extract_date_returns_none_when_missing(backend_app_module):
    assert backend_app_module.extract_date("TOTAL RM 20.00") is None


def test_normalize_date_keeps_valid_iso_dates(backend_app_module):
    assert backend_app_module.normalize_date("2026-03-10") == "2026-03-10"


def test_normalize_date_applies_current_broken_year_fix(backend_app_module):
    assert backend_app_module.normalize_date("2018-03-26") == "2026-03-18"


def test_normalize_date_returns_none_for_invalid_input(backend_app_module):
    assert backend_app_module.normalize_date("18/03/2026") is None


def test_transcribe_requires_user_id(client):
    response = client.post("/transcribe", json={"text": "spent 12 on food"})

    assert response.status_code == 400
    assert response.get_json() == {"error": "Missing userId"}


def test_transcribe_requires_input_text(client):
    response = client.post(
        "/transcribe",
        data={"userId": "1"},
        content_type="multipart/form-data",
    )

    assert response.status_code == 400
    assert response.get_json() == {"error": "No input text"}


def test_transcribe_expense_flow_override_returns_extracted_payload(
    backend_app_module, client, monkeypatch
):
    chat_calls = []

    def fake_create(**kwargs):
        chat_calls.append(kwargs)
        return _fake_chat_response(
            {
                "amount": 15.5,
                "note": "Lunch",
                "suggestedCategory": "food",
                "date": "2026-04-24",
            }
        )

    backend_app_module.client = types.SimpleNamespace(
        audio=types.SimpleNamespace(
            transcriptions=types.SimpleNamespace(create=lambda **kwargs: None)
        ),
        chat=types.SimpleNamespace(
            completions=types.SimpleNamespace(create=fake_create)
        ),
    )
    monkeypatch.setattr(
        backend_app_module,
        "get_user_categories",
        lambda user_id: ["food", "transport"],
    )

    response = client.post(
        "/transcribe",
        data={
            "userId": "1",
            "text": "spent 15.50 on lunch",
            "flow": "expense",
        },
        content_type="multipart/form-data",
    )

    body = response.get_json()

    assert response.status_code == 200
    assert body["type"] == "expense"
    assert body["intent"] == "add_expense"
    assert body["result"]["amount"] == 15.5
    assert body["result"]["suggestedCategory"] == "food"
    assert len(chat_calls) == 1


def test_transcribe_regular_payment_flow_falls_back_to_digit_amount(
    backend_app_module, client, monkeypatch
):
    def fake_create(**kwargs):
        return _fake_chat_response(
            {
                "note": "Netflix",
                "amount": 0,
                "frequency": "monthly",
                "suggestedCategory": "Entertainment",
            }
        )

    backend_app_module.client = types.SimpleNamespace(
        audio=types.SimpleNamespace(
            transcriptions=types.SimpleNamespace(create=lambda **kwargs: None)
        ),
        chat=types.SimpleNamespace(
            completions=types.SimpleNamespace(create=fake_create)
        ),
    )
    monkeypatch.setattr(
        backend_app_module,
        "get_user_categories",
        lambda user_id: ["entertainment"],
    )

    response = client.post(
        "/transcribe",
        data={
            "userId": "1",
            "text": "netflix 45 monthly",
            "flow": "regularPayment",
        },
        content_type="multipart/form-data",
    )

    body = response.get_json()

    assert response.status_code == 200
    assert body["type"] == "regular_payment"
    assert body["intent"] == "add_regular_payment"
    assert body["result"]["amount"] == 45.0
    assert body["result"]["category"] == "entertainment"
    assert body["result"]["suggestedCategory"] == "entertainment"


def test_transcribe_uses_audio_transcription_when_file_uploaded(
    backend_app_module, client, monkeypatch
):
    audio_calls = []
    chat_calls = []

    def fake_audio_create(**kwargs):
        audio_calls.append(kwargs)
        return types.SimpleNamespace(text="coffee 9")

    def fake_chat_create(**kwargs):
        chat_calls.append(kwargs)
        return _fake_chat_response(
            {
                "amount": 9,
                "note": "Coffee",
                "suggestedCategory": "food",
                "date": "2026-04-24",
            }
        )

    backend_app_module.client = types.SimpleNamespace(
        audio=types.SimpleNamespace(
            transcriptions=types.SimpleNamespace(create=fake_audio_create)
        ),
        chat=types.SimpleNamespace(
            completions=types.SimpleNamespace(create=fake_chat_create)
        ),
    )
    monkeypatch.setattr(
        backend_app_module,
        "get_user_categories",
        lambda user_id: ["food"],
    )
    monkeypatch.setattr(
        "werkzeug.datastructures.FileStorage.save",
        lambda self, dst, buffer_size=16384: None,
    )

    class _FakeAudioFile(io.BytesIO):
        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, tb):
            self.close()
            return False

    original_open = builtins.open

    def fake_open(file, mode="r", *args, **kwargs):
        if file == "temp.m4a" and mode == "rb":
            return _FakeAudioFile(b"fake audio")
        return original_open(file, mode, *args, **kwargs)

    monkeypatch.setattr(builtins, "open", fake_open)

    response = client.post(
        "/transcribe",
        data={
            "userId": "1",
            "flow": "expense",
            "file": (io.BytesIO(b"fake audio"), "voice.m4a"),
        },
        content_type="multipart/form-data",
    )

    body = response.get_json()

    assert response.status_code == 200
    assert body["text"] == "coffee 9"
    assert body["result"]["amount"] == 9
    assert len(audio_calls) == 1
    assert len(chat_calls) == 1


def test_add_expense_creates_record_successfully(backend_app_module, client, app_ctx):
    user = _create_user(backend_app_module)

    response = client.post(
        "/expense",
        json={
            "user_id": user.user_id,
            "title": "Lunch",
            "amount": 12.5,
            "category": "food",
            "date": "2026-04-24",
        },
    )

    body = response.get_json()
    saved = backend_app_module.Expense.query.one()

    assert response.status_code == 201
    assert body["message"] == "Expense added"
    assert body["expense"]["title"] == "Lunch"
    assert saved.category == "food"


def test_add_expense_validates_missing_fields(client, app_ctx):
    response = client.post("/expense", json={"title": "Lunch"})

    assert response.status_code == 400
    assert response.get_json() == {"message": "Missing required fields"}


def test_add_expense_validates_date_format(backend_app_module, client, app_ctx):
    user = _create_user(backend_app_module)

    response = client.post(
        "/expense",
        json={
            "user_id": user.user_id,
            "title": "Lunch",
            "amount": 12.5,
            "category": "food",
            "date": "24-04-2026",
        },
    )

    assert response.status_code == 400
    assert response.get_json() == {"message": "Invalid date format, use YYYY-MM-DD"}


def test_get_expenses_returns_user_expenses_in_descending_date_order(
    backend_app_module, client, app_ctx
):
    user = _create_user(backend_app_module)
    _create_expense(backend_app_module, user.user_id, title="Old", date_str="2026-04-01")
    _create_expense(backend_app_module, user.user_id, title="New", date_str="2026-04-20")

    response = client.get(f"/expense/{user.user_id}")
    body = response.get_json()

    assert response.status_code == 200
    assert [item["title"] for item in body] == ["New", "Old"]


def test_update_expense_updates_existing_record(backend_app_module, client, app_ctx):
    user = _create_user(backend_app_module)
    expense = _create_expense(backend_app_module, user.user_id)

    response = client.put(
        f"/expense/{expense.id}",
        json={"title": "Dinner", "amount": 25.0, "date": "2026-04-30"},
    )

    backend_app_module.db.session.refresh(expense)
    body = response.get_json()

    assert response.status_code == 200
    assert body["expense"]["title"] == "Dinner"
    assert expense.amount == 25.0
    assert expense.date.isoformat() == "2026-04-30"


def test_update_expense_returns_404_for_missing_record(client, app_ctx):
    response = client.put("/expense/999", json={"title": "Dinner"})

    assert response.status_code == 404
    assert response.get_json() == {"message": "Expense not found"}


def test_delete_expense_removes_record(backend_app_module, client, app_ctx):
    user = _create_user(backend_app_module)
    expense = _create_expense(backend_app_module, user.user_id)

    response = client.delete(f"/expense/{expense.id}")

    assert response.status_code == 200
    assert response.get_json() == {"message": "Expense deleted"}
    assert backend_app_module.Expense.query.get(expense.id) is None


def test_add_income_creates_record_successfully(backend_app_module, client, app_ctx):
    user = _create_user(backend_app_module)

    response = client.post(
        "/income",
        json={
            "user_id": user.user_id,
            "title": "Salary",
            "amount": 2000,
            "category": "salary",
            "date": "2026-04-24",
        },
    )

    body = response.get_json()

    assert response.status_code == 201
    assert body["message"] == "Income added"
    assert backend_app_module.Income.query.one().title == "Salary"


def test_add_income_validates_missing_fields(client, app_ctx):
    response = client.post("/income", json={"title": "Salary"})

    assert response.status_code == 400
    assert response.get_json() == {"message": "Missing required fields"}


def test_get_income_returns_user_records(backend_app_module, client, app_ctx):
    user = _create_user(backend_app_module)
    _create_income(backend_app_module, user.user_id, title="Bonus", date_str="2026-04-15")
    _create_income(backend_app_module, user.user_id, title="Salary", date_str="2026-04-20")

    response = client.get(f"/income/{user.user_id}")
    body = response.get_json()

    assert response.status_code == 200
    assert [item["title"] for item in body] == ["Salary", "Bonus"]


def test_update_income_updates_existing_record(backend_app_module, client, app_ctx):
    user = _create_user(backend_app_module)
    income = _create_income(backend_app_module, user.user_id)

    response = client.put(
        f"/income/{income.id}",
        json={"title": "Adjusted Salary", "amount": 2500},
    )

    backend_app_module.db.session.refresh(income)

    assert response.status_code == 200
    assert response.get_json()["income"]["title"] == "Adjusted Salary"
    assert income.amount == 2500


def test_delete_income_removes_record(backend_app_module, client, app_ctx):
    user = _create_user(backend_app_module)
    income = _create_income(backend_app_module, user.user_id)

    response = client.delete(f"/income/{income.id}")

    assert response.status_code == 200
    assert response.get_json() == {"message": "Income deleted"}
    assert backend_app_module.Income.query.get(income.id) is None


def test_signup_creates_user_and_hashes_password(backend_app_module, client, app_ctx):
    response = client.post(
        "/signup",
        json={
            "email": "new@example.com",
            "password": "Password123",
            "nickname": "NewUser",
            "date_of_birth": "2000-01-01",
        },
    )

    body = response.get_json()
    saved = backend_app_module.User.query.filter_by(email="new@example.com").one()

    assert response.status_code == 201
    assert body["message"] == "Signup successful"
    assert saved.password != "Password123"
    assert backend_app_module.check_password_hash(saved.password, "Password123")


def test_signup_rejects_missing_required_fields(client, app_ctx):
    response = client.post("/signup", json={"email": "", "password": "", "nickname": ""})

    assert response.status_code == 400
    assert response.get_json() == {
        "message": "Email, password, and nickname are required"
    }


def test_login_returns_user_for_valid_credentials(backend_app_module, client, app_ctx):
    _create_user(backend_app_module, email="login@example.com", password="Secret123")

    response = client.post(
        "/login",
        json={"email": "login@example.com", "password": "Secret123"},
    )

    body = response.get_json()

    assert response.status_code == 200
    assert body["message"] == "Login successful"
    assert body["user"]["email"] == "login@example.com"


def test_login_rejects_invalid_credentials(backend_app_module, client, app_ctx):
    _create_user(backend_app_module, email="login@example.com", password="Secret123")

    response = client.post(
        "/login",
        json={"email": "login@example.com", "password": "wrong"},
    )

    assert response.status_code == 401
    assert response.get_json() == {"message": "Invalid email or password"}


def test_get_user_returns_existing_user(backend_app_module, client, app_ctx):
    user = _create_user(backend_app_module, email="profile@example.com")

    response = client.get(f"/user/{user.user_id}")
    body = response.get_json()

    assert response.status_code == 200
    assert body["email"] == "profile@example.com"
    assert body["user_id"] == user.user_id


def test_update_user_updates_fields_without_file(backend_app_module, client, app_ctx):
    user = _create_user(backend_app_module, email="profile@example.com")

    response = client.put(
        f"/user/{user.user_id}",
        data={
            "nickname": "Updated",
            "phone_number": "0123456789",
            "gender": "female",
            "date_of_birth": "2001-02-03",
        },
        content_type="multipart/form-data",
    )

    backend_app_module.db.session.refresh(user)
    body = response.get_json()

    assert response.status_code == 200
    assert body["nickname"] == "Updated"
    assert user.phone_number == "0123456789"
    assert user.date_of_birth.isoformat() == "2001-02-03"


def test_add_budget_creates_record_and_normalizes_default_category(
    backend_app_module, client, app_ctx
):
    user = _create_user(backend_app_module)

    response = client.post(
        "/budget",
        json={
            "user_id": user.user_id,
            "category": "default-1",
            "amount": 500,
            "month": 4,
            "year": 2026,
        },
    )

    body = response.get_json()

    assert response.status_code == 201
    assert body["category"] == "food"
    assert backend_app_module.Budget.query.one().category == "food"


def test_add_budget_validates_missing_fields(client, app_ctx):
    response = client.post("/budget", json={"user_id": 1, "category": "food"})

    assert response.status_code == 400
    assert response.get_json() == {"message": "Missing required fields"}


def test_get_budgets_returns_budget_with_spent_and_remaining(
    backend_app_module, client, app_ctx
):
    user = _create_user(backend_app_module)
    _create_budget(backend_app_module, user.user_id, category="food", amount=500)
    _create_expense(backend_app_module, user.user_id, category="food", amount=120)

    response = client.get(f"/budget/{user.user_id}")
    body = response.get_json()

    assert response.status_code == 200
    assert body[0]["budget"] == 500.0
    assert body[0]["spent"] == 120.0
    assert body[0]["remaining"] == 380.0


def test_update_budget_updates_amount(backend_app_module, client, app_ctx):
    user = _create_user(backend_app_module)
    budget = _create_budget(backend_app_module, user.user_id)

    response = client.put(f"/budget/{budget.id}", json={"amount": 900})

    backend_app_module.db.session.refresh(budget)

    assert response.status_code == 200
    assert budget.amount == 900


def test_delete_budget_removes_record(backend_app_module, client, app_ctx):
    user = _create_user(backend_app_module)
    budget = _create_budget(backend_app_module, user.user_id)

    response = client.delete(f"/budget/{budget.id}")

    assert response.status_code == 200
    assert response.get_json() == {"message": "Budget deleted"}
    assert backend_app_module.Budget.query.get(budget.id) is None


def test_set_monthly_budget_creates_and_updates_existing_budget(
    backend_app_module, client, app_ctx
):
    user = _create_user(backend_app_module)

    create_response = client.post(
        "/monthly-budget",
        json={"user_id": user.user_id, "amount": 1500, "month": 4, "year": 2026},
    )
    update_response = client.post(
        "/monthly-budget",
        json={"user_id": user.user_id, "amount": 1800, "month": 4, "year": 2026},
    )

    budget = backend_app_module.MonthlyBudget.query.one()

    assert create_response.status_code == 201
    assert create_response.get_json() == {"message": "Created"}
    assert update_response.status_code == 200
    assert update_response.get_json() == {"message": "Updated"}
    assert budget.amount == 1800


def test_get_monthly_budget_returns_existing_budget(backend_app_module, client, app_ctx):
    user = _create_user(backend_app_module)
    budget = _create_monthly_budget(backend_app_module, user.user_id, amount=1500)

    response = client.get(f"/monthly-budget/{user.user_id}?month=4&year=2026")
    body = response.get_json()

    assert response.status_code == 200
    assert body["id"] == budget.id
    assert body["amount"] == 1500.0


def test_update_monthly_budget_updates_amount(backend_app_module, client, app_ctx):
    user = _create_user(backend_app_module)
    budget = _create_monthly_budget(backend_app_module, user.user_id, amount=1500)

    response = client.put(f"/monthly-budget/{budget.id}", json={"amount": 2000})

    backend_app_module.db.session.refresh(budget)

    assert response.status_code == 200
    assert response.get_json() == {"message": "Updated"}
    assert budget.amount == 2000


def test_add_category_creates_record(backend_app_module, client, app_ctx):
    user = _create_user(backend_app_module)

    response = client.post(
        "/categories",
        json={
            "user_id": user.user_id,
            "type": "expense",
            "name": "Coffee",
            "icon": "cafe",
        },
    )

    body = response.get_json()

    assert response.status_code == 201
    assert body["name"] == "Coffee"
    assert backend_app_module.Category.query.one().icon == "cafe"


def test_get_categories_returns_categories_for_user_and_type(
    backend_app_module, client, app_ctx
):
    user = _create_user(backend_app_module)
    _create_category(backend_app_module, user.user_id, type_="expense", name="Coffee")
    _create_category(backend_app_module, user.user_id, type_="income", name="Salary")

    response = client.get(f"/categories/{user.user_id}/expense")
    body = response.get_json()

    assert response.status_code == 200
    assert len(body) == 1
    assert body[0]["name"] == "Coffee"


def test_update_category_updates_existing_record(backend_app_module, client, app_ctx):
    user = _create_user(backend_app_module)
    category = _create_category(backend_app_module, user.user_id, name="Coffee", icon="cafe")

    response = client.put(
        f"/categories/{category.id}",
        json={"name": "Tea", "icon": "leaf"},
    )

    backend_app_module.db.session.refresh(category)

    assert response.status_code == 200
    assert category.name == "Tea"
    assert category.icon == "leaf"


def test_delete_category_removes_record(backend_app_module, client, app_ctx):
    user = _create_user(backend_app_module)
    category = _create_category(backend_app_module, user.user_id)

    response = client.delete(f"/categories/{category.id}")

    assert response.status_code == 200
    assert response.get_json() == {"message": "Category deleted"}
    assert backend_app_module.Category.query.get(category.id) is None


def test_get_monthly_report_returns_expense_income_and_balance(
    backend_app_module, client, app_ctx
):
    user = _create_user(backend_app_module)
    _create_expense(backend_app_module, user.user_id, amount=120, date_str="2026-04-10")
    _create_income(backend_app_module, user.user_id, amount=500, date_str="2026-04-12")

    response = client.get(f"/report/monthly/{user.user_id}?month=4&year=2026")

    assert response.status_code == 200
    assert response.get_json() == {"expenses": 120.0, "income": 500.0, "balance": 380.0}


def test_get_monthly_budgets_returns_budget_breakdown_for_month(
    backend_app_module, client, app_ctx
):
    user = _create_user(backend_app_module)
    budget = _create_budget(backend_app_module, user.user_id, category="food", amount=500)
    _create_expense(backend_app_module, user.user_id, category="food", amount=200)

    response = client.get(f"/budget/monthly/{user.user_id}?month=4&year=2026")
    body = response.get_json()

    assert response.status_code == 200
    assert body[0]["id"] == budget.id
    assert body[0]["spent"] == 200.0
    assert body[0]["remaining"] == 300.0
