import importlib.util
import io
import json
import sys
import types
from datetime import datetime as real_datetime
from pathlib import Path
from unittest.mock import mock_open

import pytest


def load_ai_module():
    path = Path(__file__).resolve().parents[1] / "backend" / "services" / "ai_service.py"
    spec = importlib.util.spec_from_file_location("ai_service_under_test", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def fake_chat_response(payload):
    return types.SimpleNamespace(
        choices=[types.SimpleNamespace(message=types.SimpleNamespace(content=json.dumps(payload)))]
    )


class FixedDateTime(real_datetime):
    @classmethod
    def today(cls):
        return cls(2026, 4, 25, 10, 30, 0)


class FakeRequest:
    def __init__(self, form=None, files=None, json_data=None):
        self.form = form or {}
        self.files = files or {}
        self._json_data = json_data

    def get_json(self, silent=True):
        return self._json_data


def test_create_client_uses_openai_constructor(backend_app_module, monkeypatch):
    module = load_ai_module()

    created = []

    class FakeOpenAI:
        def __init__(self, api_key):
            created.append(api_key)

    monkeypatch.setattr(module, "OpenAI", FakeOpenAI)

    module.AIService.create_client("secret-key")

    assert created == ["secret-key"]


def test_get_user_categories_returns_expense_category_names(backend_app_module, app_ctx):
    module = load_ai_module()

    user = backend_app_module.User(
        email="categories@example.com",
        password="hashed",
        nickname="Categories",
    )
    backend_app_module.db.session.add(user)
    backend_app_module.db.session.commit()

    backend_app_module.db.session.add_all(
        [
            backend_app_module.Category(
                user_id=user.user_id, type="expense", name="Coffee", icon="cup"
            ),
            backend_app_module.Category(
                user_id=user.user_id, type="income", name="Salary", icon="cash"
            ),
        ]
    )
    backend_app_module.db.session.commit()

    assert module.AIService.get_user_categories(user.user_id) == ["Coffee"]


def test_transcribe_requires_user_id(backend_app_module):
    module = load_ai_module()
    client = types.SimpleNamespace()

    with backend_app_module.app.app_context():
        response, status = module.AIService.transcribe(
            FakeRequest(form={"text": "coffee"}), client, lambda user_id: []
        )

    assert status == 400
    assert json.loads(response.get_data(as_text=True)) == {"error": "Missing userId"}


def test_transcribe_returns_400_when_no_text_is_provided(backend_app_module):
    module = load_ai_module()
    client = types.SimpleNamespace(files={})

    with backend_app_module.app.app_context():
        response, status = module.AIService.transcribe(
            FakeRequest(form={"userId": "5"}), client, lambda user_id: []
        )

    assert status == 400
    assert json.loads(response.get_data(as_text=True)) == {"error": "No input text"}


def test_transcribe_uses_audio_transcription_and_expense_flow(
    backend_app_module, monkeypatch
):
    module = load_ai_module()
    monkeypatch.setattr(module, "datetime", FixedDateTime)
    monkeypatch.setattr(module, "get_expense_prompt", lambda text, today, categories: "prompt")
    monkeypatch.setattr("builtins.open", mock_open(read_data=b"audio-bytes"))

    class FakeUpload:
        def save(self, path):
            return None

    client = types.SimpleNamespace(
        audio=types.SimpleNamespace(
            transcriptions=types.SimpleNamespace(
                create=lambda model, file: types.SimpleNamespace(text="spent 12 on lunch")
            )
        ),
        chat=types.SimpleNamespace(
            completions=types.SimpleNamespace(
                create=lambda **kwargs: fake_chat_response(
                    {
                        "amount": 12,
                        "note": "Lunch",
                        "suggestedCategory": "food",
                        "date": "2026-04-25",
                    }
                )
            )
        ),
    )

    request = FakeRequest(
        form={"userId": "7", "flow": "expense"},
        files={"file": FakeUpload()},
    )

    with backend_app_module.app.app_context():
        response = module.AIService.transcribe(request, client, lambda user_id: ["food"])

    payload = json.loads(response.get_data(as_text=True))
    assert payload["type"] == "expense"
    assert payload["intent"] == "add_expense"
    assert payload["result"]["amount"] == 12


def test_transcribe_reclassifies_subscription_budget_as_regular_payment(
    backend_app_module, monkeypatch
):
    module = load_ai_module()

    responses = iter([fake_chat_response({"intent": "add_budget"})])
    client = types.SimpleNamespace(
        chat=types.SimpleNamespace(
            completions=types.SimpleNamespace(create=lambda **kwargs: next(responses))
        )
    )

    called = {}

    def fake_handler(**kwargs):
        called.update(kwargs)
        return module.jsonify({"type": "regular_payment", "intent": kwargs["intent"]})

    monkeypatch.setattr(module.AIService, "_handle_regular_payment_intent", fake_handler)

    request = FakeRequest(form={"userId": "3", "text": "add netflix budget 30"})

    with backend_app_module.app.app_context():
        response = module.AIService.transcribe(request, client, lambda user_id: ["billing"])

    payload = json.loads(response.get_data(as_text=True))
    assert payload == {"type": "regular_payment", "intent": "add_regular_payment"}
    assert called["intent"] == "add_regular_payment"


def test_transcribe_routes_query_intents_to_query_handler(backend_app_module, monkeypatch):
    module = load_ai_module()
    responses = iter([fake_chat_response({"intent": "query_total"})])
    client = types.SimpleNamespace(
        chat=types.SimpleNamespace(
            completions=types.SimpleNamespace(create=lambda **kwargs: next(responses))
        )
    )

    monkeypatch.setattr(
        module.AIService,
        "_handle_query_intent",
        lambda **kwargs: module.jsonify({"intent": kwargs["intent"], "type": "answer"}),
    )

    with backend_app_module.app.app_context():
        response = module.AIService.transcribe(
            FakeRequest(form={"userId": "9", "text": "how much did I spend?"}),
            client,
            lambda user_id: ["food"],
        )

    assert json.loads(response.get_data(as_text=True)) == {
        "intent": "query_total",
        "type": "answer",
    }


def test_transcribe_returns_500_when_client_raises(backend_app_module):
    module = load_ai_module()

    class ExplodingClient:
        chat = types.SimpleNamespace(
            completions=types.SimpleNamespace(
                create=lambda **kwargs: (_ for _ in ()).throw(RuntimeError("boom"))
            )
        )

    with backend_app_module.app.app_context():
        response, status = module.AIService.transcribe(
            FakeRequest(form={"userId": "2", "text": "spent 5"}),
            ExplodingClient(),
            lambda user_id: [],
        )

    assert status == 500
    assert json.loads(response.get_data(as_text=True)) == {"error": "boom"}


def test_extract_budget_success_and_failure(backend_app_module, monkeypatch):
    module = load_ai_module()
    monkeypatch.setattr(module, "datetime", FixedDateTime)
    monkeypatch.setattr(module, "get_budget_prompt", lambda text, today, categories: "prompt")

    client = types.SimpleNamespace(
        chat=types.SimpleNamespace(
            completions=types.SimpleNamespace(
                create=lambda **kwargs: fake_chat_response({"amount": 250, "category": "Food"})
            )
        )
    )

    with backend_app_module.app.app_context():
        response, status = module.AIService.extract_budget(
            {"text": "budget 250 for food", "userId": 1},
            client,
            lambda user_id: ["Food", "Travel"],
        )
    assert status == 200
    assert json.loads(response.get_data(as_text=True)) == {
        "amount": 250,
        "category": "food",
    }

    failing_client = types.SimpleNamespace(
        chat=types.SimpleNamespace(
            completions=types.SimpleNamespace(
                create=lambda **kwargs: (_ for _ in ()).throw(RuntimeError("chat failed"))
            )
        )
    )
    with backend_app_module.app.app_context():
        response, status = module.AIService.extract_budget(
            {"text": "budget 100", "userId": 1},
            failing_client,
            lambda user_id: [],
        )
    assert status == 500
    assert json.loads(response.get_data(as_text=True)) == {
        "error": "chat failed",
        "amount": 0,
        "category": "general",
    }


def test_extract_regular_payment_parses_words_frequency_and_type(backend_app_module):
    module = load_ai_module()
    monkeypatch = pytest.MonkeyPatch()
    monkeypatch.setattr(module.w2n, "word_to_num", lambda text: 45)

    with backend_app_module.app.app_context():
        response, status = module.AIService.extract_regular_payment(
            {"text": "weekly salary food forty five"}
        )
    monkeypatch.undo()

    payload = json.loads(response.get_data(as_text=True))
    assert status == 200
    assert payload["amount"] == 45
    assert payload["category"] == "food"
    assert payload["type"] == "income"
    assert payload["frequency"] == "Weekly"


def test_handle_regular_payment_intent_normalizes_category_and_falls_back_to_digits(
    backend_app_module, monkeypatch
):
    module = load_ai_module()
    monkeypatch.setattr(module, "get_regular_payment_prompt", lambda text, today, categories: "prompt")

    client = types.SimpleNamespace(
        chat=types.SimpleNamespace(
            completions=types.SimpleNamespace(
                create=lambda **kwargs: fake_chat_response(
                    {"amount": 0, "suggestedCategory": "Billing", "frequency": "monthly"}
                )
            )
        )
    )

    with backend_app_module.app.app_context():
        response = module.AIService._handle_regular_payment_intent(
            text="pay 88 monthly for wifi",
            final_text="pay 88 monthly for wifi",
            intent="add_regular_payment",
            categories=["billing"],
            today="2026-04-25",
            client=client,
        )

    payload = json.loads(response.get_data(as_text=True))
    assert payload["result"]["amount"] == 88.0
    assert payload["result"]["category"] == "billing"
    assert payload["result"]["suggestedCategory"] == "billing"


def test_handle_regular_payment_intent_returns_500_on_error(backend_app_module, monkeypatch):
    module = load_ai_module()
    monkeypatch.setattr(module, "get_regular_payment_prompt", lambda text, today, categories: "prompt")

    client = types.SimpleNamespace(
        chat=types.SimpleNamespace(
            completions=types.SimpleNamespace(
                create=lambda **kwargs: (_ for _ in ()).throw(RuntimeError("regular failed"))
            )
        )
    )

    with backend_app_module.app.app_context():
        response, status = module.AIService._handle_regular_payment_intent(
            text="pay monthly",
            final_text="pay monthly",
            intent="add_regular_payment",
            categories=[],
            today="2026-04-25",
            client=client,
        )

    assert status == 500
    assert json.loads(response.get_data(as_text=True)) == {
        "error": "regular failed",
        "intent": "add_regular_payment",
        "result": None,
    }


def test_handle_query_intent_forces_category_match(backend_app_module, monkeypatch):
    module = load_ai_module()

    called = {}

    def fake_summary(**kwargs):
        called.update(kwargs)
        return module.jsonify({"intent": kwargs["intent"], "matched": kwargs["matched_category"]})

    monkeypatch.setattr(module.AIService, "_query_summary_or_category", fake_summary)

    with backend_app_module.app.app_context():
        response = module.AIService._handle_query_intent(
            text="how much on coffee this month",
            final_text="how much on coffee this month",
            intent="query_total",
            user_id=1,
            get_user_categories_fn=lambda user_id: ["Coffee", "Food"],
        )

    assert json.loads(response.get_data(as_text=True)) == {
        "intent": "query_category",
        "matched": "Coffee",
    }
    assert called["intent"] == "query_category"


def test_handle_query_intent_returns_default_unknown_answer(backend_app_module):
    module = load_ai_module()

    with backend_app_module.app.app_context():
        response = module.AIService._handle_query_intent(
            text="tell me a joke",
            final_text="tell me a joke",
            intent="unknown",
            user_id=1,
            get_user_categories_fn=lambda user_id: [],
        )

    payload = json.loads(response.get_data(as_text=True))
    assert payload["type"] == "answer"
    assert payload["intent"] == "unknown"
    assert "didn" in payload["answer"].lower()


def test_query_total_uses_date_range_and_formats_answer(backend_app_module, monkeypatch):
    module = load_ai_module()
    monkeypatch.setattr(module, "datetime", FixedDateTime)

    class FakeQuery:
        def filter(self, *args):
            return self

        def scalar(self):
            return 123.45

    monkeypatch.setattr(module.db.session, "query", lambda *args: FakeQuery())

    with backend_app_module.app.app_context():
        response = module.AIService._query_total("show total for last 7 days", "query_total", 10)

    payload = json.loads(response.get_data(as_text=True))
    assert payload["date_range"] == {"start": "2026-04-19", "end": "2026-04-25"}
    assert "RM123.45" in payload["answer"]


def test_query_summary_or_category_returns_category_fallback_message(
    backend_app_module, monkeypatch
):
    module = load_ai_module()
    monkeypatch.setattr(module, "datetime", FixedDateTime)

    class FakeQuery:
        def filter(self, *args):
            return self

        def scalar(self):
            return 55

    monkeypatch.setattr(module.db.session, "query", lambda *args: FakeQuery())

    with backend_app_module.app.app_context():
        response = module.AIService._query_summary_or_category(
            text="spending on coffee this month",
            intent="query_category",
            user_id=2,
            matched_category="Coffee",
            get_user_categories_fn=lambda user_id: ["Coffee"],
        )

    payload = json.loads(response.get_data(as_text=True))
    assert payload["intent"] == "query_category"
    assert "couldn't find category" in payload["answer"].lower()


def test_query_summary_or_category_returns_top_category_and_no_expenses(
    backend_app_module, monkeypatch
):
    module = load_ai_module()
    monkeypatch.setattr(module, "datetime", FixedDateTime)

    class TopCategoryQuery:
        def filter(self, *args):
            return self

        def group_by(self, *args):
            return self

        def order_by(self, *args):
            return self

        def first(self):
            return ("Food", 88.5)

    monkeypatch.setattr(module.db.session, "query", lambda *args: TopCategoryQuery())

    with backend_app_module.app.app_context():
        response = module.AIService._query_summary_or_category(
            text="top category this month",
            intent="query_summary",
            user_id=4,
            matched_category=None,
            get_user_categories_fn=lambda user_id: ["Food"],
        )
    payload = json.loads(response.get_data(as_text=True))
    assert "Food" in payload["answer"]
    assert "RM88.50" in payload["answer"]

    class EmptyQuery(TopCategoryQuery):
        def first(self):
            return None

    monkeypatch.setattr(module.db.session, "query", lambda *args: EmptyQuery())

    with backend_app_module.app.app_context():
        response = module.AIService._query_summary_or_category(
            text="top category this month",
            intent="query_summary",
            user_id=4,
            matched_category=None,
            get_user_categories_fn=lambda user_id: [],
        )
    assert json.loads(response.get_data(as_text=True))["answer"] == "No expenses found"
