import io


def test_ocr_route_requires_uploaded_image(client):
    response = client.post("/ocr", data={}, content_type="multipart/form-data")

    assert response.status_code == 400
    assert response.get_json() == {"error": "No image uploaded"}


def test_ocr_route_returns_amount_and_date(backend_app_module, client, monkeypatch):
    monkeypatch.setattr(
        backend_app_module.OCRService,
        "ocr",
        staticmethod(lambda files: ({"amount": 10.6, "date": "2026-04-18"}, 200)),
    )

    response = client.post(
        "/ocr",
        data={"image": (io.BytesIO(b"fake image"), "receipt.png")},
        content_type="multipart/form-data",
    )

    assert response.status_code == 200
    assert response.get_json() == {"amount": 10.6, "date": "2026-04-18"}


def test_parse_einvoice_requires_url(client):
    response = client.post("/parse-einvoice", json={})

    assert response.status_code == 400
    assert response.get_json() == {
        "amount": None,
        "date": None,
        "title": "E-Invoice",
        "error": "Missing URL",
    }


def test_parse_einvoice_returns_scraped_result(backend_app_module, client, monkeypatch):
    monkeypatch.setattr(
        backend_app_module.OCRService,
        "scrape_with_playwright",
        staticmethod(
            lambda url: {"amount": 88.8, "date": "24/04/2026", "title": "AEON"}
        ),
    )

    response = client.post("/parse-einvoice", json={"url": "https://example.com/invoice"})

    assert response.status_code == 200
    assert response.get_json() == {
        "amount": 88.8,
        "date": "24/04/2026",
        "title": "AEON",
    }


def test_parse_einvoice_returns_500_when_scraper_raises(
    backend_app_module, client, monkeypatch
):
    def fail_scrape(url):
        raise RuntimeError("browser failed")

    monkeypatch.setattr(
        backend_app_module.OCRService,
        "scrape_with_playwright",
        staticmethod(fail_scrape),
    )

    response = client.post("/parse-einvoice", json={"url": "https://example.com/invoice"})

    assert response.status_code == 500
    assert response.get_json() == {
        "amount": None,
        "date": None,
        "title": "E-Invoice",
        "error": "browser failed",
    }


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
