import importlib.util
import io
import json
import sys
import types
from datetime import datetime
from pathlib import Path
from unittest.mock import mock_open

import pytest
from flask import Flask


def load_ocr_module(monkeypatch):
    cv2_module = types.ModuleType("cv2")
    cv2_module.COLOR_BGR2GRAY = "gray"
    cv2_module.THRESH_BINARY = "binary"
    cv2_module.cvtColor = lambda image, code: image
    cv2_module.threshold = lambda image, threshold, max_value, kind: (None, image)
    monkeypatch.setitem(sys.modules, "cv2", cv2_module)

    np_module = types.ModuleType("numpy")
    np_module.array = lambda image: image
    monkeypatch.setitem(sys.modules, "numpy", np_module)

    pytesseract_module = types.ModuleType("pytesseract")
    pytesseract_module.pytesseract = types.SimpleNamespace(tesseract_cmd=None)
    pytesseract_module.image_to_string = lambda image: ""
    monkeypatch.setitem(sys.modules, "pytesseract", pytesseract_module)

    pdfplumber_module = types.ModuleType("pdfplumber")

    class EmptyPdf:
        pages = []

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, tb):
            return False

    pdfplumber_module.open = lambda path: EmptyPdf()
    monkeypatch.setitem(sys.modules, "pdfplumber", pdfplumber_module)

    requests_module = types.ModuleType("requests")
    requests_module.get = lambda *args, **kwargs: None
    monkeypatch.setitem(sys.modules, "requests", requests_module)

    pil_module = types.ModuleType("PIL")
    image_module = types.ModuleType("PIL.Image")
    image_module.open = lambda buffer: "image"
    pil_module.Image = image_module
    monkeypatch.setitem(sys.modules, "PIL", pil_module)
    monkeypatch.setitem(sys.modules, "PIL.Image", image_module)

    playwright_pkg = types.ModuleType("playwright")
    playwright_sync = types.ModuleType("playwright.sync_api")

    def sync_playwright():
        raise RuntimeError("playwright stub not configured")

    playwright_sync.sync_playwright = sync_playwright
    monkeypatch.setitem(sys.modules, "playwright", playwright_pkg)
    monkeypatch.setitem(sys.modules, "playwright.sync_api", playwright_sync)

    path = Path(__file__).resolve().parents[1] / "backend" / "services" / "ocr_service.py"
    spec = importlib.util.spec_from_file_location("ocr_service_under_test", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


@pytest.fixture()
def flask_app():
    return Flask(__name__)


def test_configure_sets_tesseract_command(monkeypatch):
    module = load_ocr_module(monkeypatch)

    module.OCRService.configure()

    assert (
        module.pytesseract.pytesseract.tesseract_cmd
        == r"C:\Program Files\Tesseract-OCR\tesseract.exe"
    )


def test_ocr_returns_amount_and_date(monkeypatch, flask_app):
    module = load_ocr_module(monkeypatch)

    monkeypatch.setattr(module.Image, "open", lambda buffer: "opened-image")
    monkeypatch.setattr(module.np, "array", lambda image: "array-image")
    monkeypatch.setattr(module.cv2, "cvtColor", lambda image, code: "gray-image")
    monkeypatch.setattr(
        module.cv2, "threshold", lambda image, threshold, max_value, kind: (None, "bw")
    )
    monkeypatch.setattr(
        module.pytesseract,
        "image_to_string",
        lambda image: "total 12.50\nDATE: 2026-04-24",
    )

    files = {"image": io.BytesIO(b"fake-image-bytes")}

    with flask_app.app_context():
        response, status = module.OCRService.ocr(files)

    payload = json.loads(response.get_data(as_text=True))
    assert status == 200
    assert payload == {"amount": 12.5, "date": "2026-04-24"}


def test_ocr_returns_400_when_image_is_missing(monkeypatch, flask_app):
    module = load_ocr_module(monkeypatch)

    with flask_app.app_context():
        response, status = module.OCRService.ocr({})

    assert status == 400
    assert json.loads(response.get_data(as_text=True)) == {"error": "No image uploaded"}


def test_ocr_returns_500_on_processing_error(monkeypatch, flask_app):
    module = load_ocr_module(monkeypatch)
    monkeypatch.setattr(module.Image, "open", lambda buffer: (_ for _ in ()).throw(ValueError()))

    with flask_app.app_context():
        response, status = module.OCRService.ocr({"image": io.BytesIO(b"bad")})

    assert status == 500
    assert json.loads(response.get_data(as_text=True)) == {"error": "OCR failed"}


def test_extract_amount_uses_keyword_then_fallbacks(monkeypatch):
    module = load_ocr_module(monkeypatch)

    assert module.OCRService.extract_amount("subtotal 5.00\ngrand total rm 12.50") == 12.5
    assert module.OCRService.extract_amount("line\n" * 11 + "amount 8.50\nfee 4.00") == 8.5
    assert module.OCRService.extract_amount("values 0.50 and 10001.00") is None


def test_parse_numeric_date_and_extract_date(monkeypatch):
    module = load_ocr_module(monkeypatch)

    parsed = module.OCRService.parse_numeric_date("2026-04-24", datetime)
    assert parsed == datetime(2026, 4, 24)
    assert module.OCRService.parse_numeric_date("24/04/26", datetime) == datetime(
        2026, 4, 24
    )
    assert module.OCRService.parse_numeric_date("bad-date", datetime) is None

    assert module.OCRService.extract_date("DATE: 24 APR 2026", datetime) == datetime(
        2026, 4, 24
    )
    assert module.OCRService.extract_date("receipt on 2026-04-24", datetime) == datetime(
        2026, 4, 24
    )
    assert module.OCRService.extract_date("no date here", datetime) is None


def test_scrape_with_playwright_parses_regular_page(monkeypatch):
    module = load_ocr_module(monkeypatch)

    class FakePage:
        def goto(self, url, wait_until, timeout):
            self.url = url

        def wait_for_selector(self, selector, timeout):
            return None

        def wait_for_load_state(self, state):
            return None

        def inner_text(self, selector):
            return "MR. D.I.Y.\nGrand Total RM 45.60\nDate 2026-04-24"

    class FakeBrowser:
        def __init__(self):
            self.closed = False

        def new_page(self):
            return FakePage()

        def close(self):
            self.closed = True

    browser = FakeBrowser()

    class FakePlaywrightContext:
        def __enter__(self):
            chromium = types.SimpleNamespace(launch=lambda headless: browser)
            return types.SimpleNamespace(chromium=chromium)

        def __exit__(self, exc_type, exc, tb):
            return False

    monkeypatch.setattr(module, "sync_playwright", lambda: FakePlaywrightContext())

    result = module.OCRService.scrape_with_playwright("https://example.com/receipt")

    assert result == {
        "amount": 45.6,
        "date": "24/04/2026",
        "title": "MR. D.I.Y.",
    }
    assert browser.closed is True


def test_scrape_with_playwright_handles_aeon_pdf(monkeypatch):
    module = load_ocr_module(monkeypatch)

    class FakePage:
        def goto(self, *args, **kwargs):
            raise AssertionError("page navigation should not run for aeon pdf path")

    class FakeBrowser:
        def new_page(self):
            return FakePage()

        def close(self):
            return None

    class FakePlaywrightContext:
        def __enter__(self):
            chromium = types.SimpleNamespace(launch=lambda headless: FakeBrowser())
            return types.SimpleNamespace(chromium=chromium)

        def __exit__(self, exc_type, exc, tb):
            return False

    response = types.SimpleNamespace(
        headers={"content-type": "application/pdf"},
        content=b"%PDF",
    )
    monkeypatch.setattr(module, "sync_playwright", lambda: FakePlaywrightContext())
    monkeypatch.setattr(module.requests, "get", lambda url, timeout: response)
    monkeypatch.setattr(module.OCRService, "extract_text_from_pdf", lambda path: "AEON\nRM 99.90")
    monkeypatch.setattr("builtins.open", mock_open())

    result = module.OCRService.scrape_with_playwright("https://aeon.example.com/invoice")

    assert result["amount"] == 99.9
    assert result["title"] == "AEON"


def test_scrape_with_playwright_returns_error_payload_on_exception(monkeypatch):
    module = load_ocr_module(monkeypatch)

    class FakePage:
        def goto(self, url, wait_until, timeout):
            raise RuntimeError("navigation failed")

    class FakeBrowser:
        def new_page(self):
            return FakePage()

        def close(self):
            return None

    class FakePlaywrightContext:
        def __enter__(self):
            chromium = types.SimpleNamespace(launch=lambda headless: FakeBrowser())
            return types.SimpleNamespace(chromium=chromium)

        def __exit__(self, exc_type, exc, tb):
            return False

    monkeypatch.setattr(module, "sync_playwright", lambda: FakePlaywrightContext())

    result = module.OCRService.scrape_with_playwright("https://example.com/fail")

    assert result["error"] == "navigation failed"
    assert result["amount"] is None
    assert result["date"] is None


def test_extract_text_from_pdf_reads_all_pages(monkeypatch):
    module = load_ocr_module(monkeypatch)

    class FakePdf:
        def __init__(self):
            self.pages = [
                types.SimpleNamespace(extract_text=lambda: "page one"),
                types.SimpleNamespace(extract_text=lambda: None),
                types.SimpleNamespace(extract_text=lambda: "page three"),
            ]

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, tb):
            return False

    monkeypatch.setattr(module.pdfplumber, "open", lambda path: FakePdf())

    assert module.OCRService.extract_text_from_pdf("receipt.pdf") == "page one\n\npage three\n"


def test_extract_text_from_pdf_swallows_parser_errors(monkeypatch):
    module = load_ocr_module(monkeypatch)
    monkeypatch.setattr(
        module.pdfplumber,
        "open",
        lambda path: (_ for _ in ()).throw(RuntimeError("parse failed")),
    )

    assert module.OCRService.extract_text_from_pdf("receipt.pdf") == ""


def test_parse_einvoice_date_and_normalize_date(monkeypatch):
    module = load_ocr_module(monkeypatch)

    assert module.OCRService.parse_einvoice_date("24/04/2026") == "2026-04-24"
    assert module.OCRService.parse_einvoice_date("04/24/2026") == "2026-04-24"
    assert module.OCRService.parse_einvoice_date("24/04/2019") is None

    assert module.OCRService.normalize_date("2019-04-24") == "2024-04-19"
    assert module.OCRService.normalize_date("2026-04-24") == "2026-04-24"
    assert module.OCRService.normalize_date("bad-date") is None


def test_parse_einvoice_handles_missing_url_success_and_exception(monkeypatch, flask_app):
    module = load_ocr_module(monkeypatch)

    with flask_app.app_context():
        response, status = module.OCRService.parse_einvoice({})
        assert status == 400
        assert json.loads(response.get_data(as_text=True))["error"] == "Missing URL"

    monkeypatch.setattr(
        module.OCRService,
        "scrape_with_playwright",
        lambda url: {"amount": 7.5, "date": "24/04/2026", "title": "Lotus"},
    )
    with flask_app.app_context():
        response, status = module.OCRService.parse_einvoice({"url": "https://example.com"})
        assert status == 200
        assert json.loads(response.get_data(as_text=True)) == {
            "amount": 7.5,
            "date": "24/04/2026",
            "title": "Lotus",
        }

    monkeypatch.setattr(
        module.OCRService,
        "scrape_with_playwright",
        lambda url: (_ for _ in ()).throw(RuntimeError("scrape failed")),
    )
    with flask_app.app_context():
        response, status = module.OCRService.parse_einvoice({"url": "https://example.com"})
        assert status == 500
        assert json.loads(response.get_data(as_text=True))["error"] == "scrape failed"


def test_normalize_ocr_text_replaces_common_misreads(monkeypatch):
    module = load_ocr_module(monkeypatch)

    assert module.OCRService._normalize_ocr_text("O,ISB") == "0.158"
