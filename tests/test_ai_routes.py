import builtins
import io
import types

from conftest import _fake_chat_response


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


def test_transcribe_classifies_query_total_and_returns_answer(
    backend_app_module, client, monkeypatch
):
    def fake_create(**kwargs):
        return _fake_chat_response({"intent": "query_total"})

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
        lambda user_id: ["food"],
    )

    response = client.post(
        "/transcribe",
        data={"userId": "1", "text": "how much did i spend this week"},
        content_type="multipart/form-data",
    )

    body = response.get_json()

    assert response.status_code == 200
    assert body["type"] == "answer"
    assert body["intent"] == "query_total"
    assert "You spent RM" in body["answer"]


def test_transcribe_returns_fallback_answer_for_unknown_intent(
    backend_app_module, client, monkeypatch
):
    def fake_create(**kwargs):
        return _fake_chat_response({"intent": "unknown"})

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
        lambda user_id: [],
    )

    response = client.post(
        "/transcribe",
        data={"userId": "1", "text": "???"},
        content_type="multipart/form-data",
    )

    body = response.get_json()

    assert response.status_code == 200
    assert body["type"] == "answer"
    assert body["intent"] == "unknown"
    assert "didn" in body["answer"].lower()


def test_ai_extract_budget_returns_amount_and_category(
    backend_app_module, client, monkeypatch
):
    def fake_create(**kwargs):
        return _fake_chat_response({"amount": 500, "category": "Food"})

    backend_app_module.client = types.SimpleNamespace(
        chat=types.SimpleNamespace(
            completions=types.SimpleNamespace(create=fake_create)
        )
    )
    monkeypatch.setattr(
        backend_app_module,
        "get_user_categories",
        lambda user_id: ["custom"],
    )

    response = client.post(
        "/ai-extract-budget",
        json={"userId": 1, "text": "set food budget 500"},
    )

    assert response.status_code == 200
    assert response.get_json() == {"amount": 500, "category": "food"}


def test_ai_extract_budget_requires_user_id(client):
    response = client.post("/ai-extract-budget", json={"text": "set budget 500"})

    assert response.status_code == 400
    assert response.get_json() == {"error": "Missing userId"}


def test_ai_extract_budget_returns_500_when_chat_fails(
    backend_app_module, client, monkeypatch
):
    def fail_create(**kwargs):
        raise RuntimeError("chat unavailable")

    backend_app_module.client = types.SimpleNamespace(
        chat=types.SimpleNamespace(
            completions=types.SimpleNamespace(create=fail_create)
        )
    )
    monkeypatch.setattr(
        backend_app_module,
        "get_user_categories",
        lambda user_id: [],
    )

    response = client.post(
        "/ai-extract-budget",
        json={"userId": 1, "text": "set budget 500"},
    )

    body = response.get_json()

    assert response.status_code == 500
    assert body["amount"] == 0
    assert body["category"] == "general"
    assert "chat unavailable" in body["error"]


def test_ai_extract_regular_payment_parses_expense_defaults(client):
    response = client.post(
        "/ai-extract-regular-payment",
        json={"text": "netflix 45 monthly"},
    )

    assert response.status_code == 200
    assert response.get_json() == {
        "title": "Netflix",
        "amount": 45.0,
        "category": "General",
        "type": "expense",
        "frequency": "Monthly",
    }


def test_ai_extract_regular_payment_detects_income_and_yearly_frequency(client):
    response = client.post(
        "/ai-extract-regular-payment",
        json={"text": "salary 2500 yearly"},
    )

    assert response.status_code == 200
    assert response.get_json() == {
        "title": "Salary",
        "amount": 2500.0,
        "category": "General",
        "type": "income",
        "frequency": "Yearly",
    }
