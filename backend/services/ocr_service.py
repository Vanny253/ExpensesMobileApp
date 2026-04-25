import io
import re

import cv2
import numpy as np
import pdfplumber
import pytesseract
import requests
from PIL import Image
from flask import jsonify
from playwright.sync_api import sync_playwright


MONTHS = {
    "JAN": "01",
    "FEB": "02",
    "MAR": "03",
    "APR": "04",
    "MAY": "05",
    "JUN": "06",
    "JUL": "07",
    "AUG": "08",
    "SEP": "09",
    "OCT": "10",
    "NOV": "11",
    "DEC": "12",
}


class OCRService:
    @staticmethod
    def configure():
        pytesseract.pytesseract.tesseract_cmd = (
            r"C:\Program Files\Tesseract-OCR\tesseract.exe"
        )

    @staticmethod
    def ocr(files):
        try:
            if "image" not in files:
                return jsonify({"error": "No image uploaded"}), 400

            file = files["image"]
            image_bytes = file.read()
            image = Image.open(io.BytesIO(image_bytes))

            image = np.array(image)
            image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            image = cv2.threshold(image, 150, 255, cv2.THRESH_BINARY)[1]

            text = pytesseract.image_to_string(image)
            text = OCRService._normalize_ocr_text(text)

            print("OCR TEXT:\n", text)

            amount = OCRService.extract_amount(text)
            date = OCRService.extract_date(text)

            print("EXTRACTED AMOUNT:", amount)
            print("EXTRACTED DATE:", date)

            final_date = date.strftime("%Y-%m-%d") if date else None
            return jsonify({"amount": amount, "date": final_date}), 200
        except Exception as exc:
            print("OCR ERROR:", exc)
            return jsonify({"error": "OCR failed"}), 500

    @staticmethod
    def extract_amount(text):
        lines = text.upper().split("\n")
        total_keywords = [
            "GRAND TOTAL",
            "AMOUNT DUE",
            "NET TOTAL",
            "TOTAL AMOUNT",
            "TOTAL PAYMENT",
            "BALANCE DUE",
            "TOTAL",
        ]

        def find_amounts(line):
            return re.findall(r"(?:RM|MYR)?\s*(\d+\.\d{2})", line)

        for line in lines:
            clean = re.sub(r"\s+", " ", line)
            for keyword in total_keywords:
                pattern = r"\b" + re.escape(keyword) + r"\b"
                if re.search(pattern, clean):
                    amounts = find_amounts(clean)
                    if amounts:
                        return float(amounts[-1])

        bottom_values = []
        for line in lines[-12:]:
            bottom_values += find_amounts(line)

        if bottom_values:
            values = [float(value) for value in bottom_values if 1 < float(value) < 10000]
            if values:
                return max(values)

        all_values = re.findall(r"\d+\.\d{2}", text)
        values = [float(value) for value in all_values if 1 < float(value) < 10000]
        if values:
            return max(values)

        return None

    @staticmethod
    def parse_numeric_date(date_str, datetime_cls):
        match = re.search(r"(\d{2,4})[/-](\d{1,2})[/-](\d{1,2})", date_str)
        if not match:
            return None

        a, b, c = match.groups()
        try:
            if len(a) == 4:
                year, month, day = int(a), int(b), int(c)
            elif len(c) == 4:
                day, month, year = int(a), int(b), int(c)
            else:
                day, month, year = int(a), int(b), int("20" + c)

            return datetime_cls(year, month, day)
        except Exception:
            return None

    @staticmethod
    def extract_date(text, datetime_cls=None):
        if datetime_cls is None:
            from datetime import datetime as datetime_cls

        lines = text.split("\n")
        for line in lines:
            if re.search(r"\bDATE\b", line, re.IGNORECASE):
                clean = re.sub(r"DATE\s*[:\-]?\s*", "", line, flags=re.IGNORECASE)
                parsed = OCRService.parse_numeric_date(clean, datetime_cls)
                if parsed:
                    return parsed

                match = re.search(r"(\d{1,2})\s+([A-Z]{3,})\s+(\d{4})", clean)
                if match:
                    day, month_name, year = match.groups()
                    month_name = month_name[:3]
                    if month_name in MONTHS:
                        return datetime_cls(int(year), int(MONTHS[month_name]), int(day))

        parsed = OCRService.parse_numeric_date(text, datetime_cls)
        if parsed:
            return parsed

        match = re.search(r"(\d{1,2})\s+([A-Z]{3})\s+(\d{4})", text)
        if match:
            day, month_name, year = match.groups()
            if month_name in MONTHS:
                return datetime_cls(int(year), int(MONTHS[month_name]), int(day))

        return None

    @staticmethod
    def scrape_with_playwright(url, datetime_cls=None):
        if datetime_cls is None:
            from datetime import datetime as datetime_cls

        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)
            page = browser.new_page()

            print("OPEN:", url)
            result = {"amount": None, "date": None, "title": "E-Invoice Receipt"}

            try:
                if "aeon" in url.lower():
                    print("AEON DETECTED -> downloading PDF")
                    response = requests.get(url, timeout=30)
                    if "pdf" in response.headers.get("content-type", "").lower():
                        file_path = "temp_receipt.pdf"
                        with open(file_path, "wb") as handle:
                            handle.write(response.content)
                        text = OCRService.extract_text_from_pdf(file_path)
                    else:
                        text = ""
                else:
                    page.goto(url, wait_until="domcontentloaded", timeout=60000)
                    try:
                        page.wait_for_selector("text=Total", timeout=15000)
                    except Exception:
                        page.wait_for_load_state("networkidle")
                    text = page.inner_text("body")

                print("TEXT SAMPLE:\n", text[:1200])

                amount = None
                priority_patterns = [
                    r"(?:Grand\s+Total|Total\s+Payable|Amount\s+Including\s+Tax)[^\d]*(\d{1,3}(?:,\d{3})*\.\d{2})",
                    r"(?:Total)[^\d]*(\d{1,3}(?:,\d{3})*\.\d{2})",
                ]
                for pattern in priority_patterns:
                    match = re.search(pattern, text, re.IGNORECASE)
                    if match:
                        amount = float(match.group(1).replace(",", ""))
                        break

                if amount is None:
                    matches = re.findall(
                        r"(?:RM|MYR)?\s*(\d{1,3}(?:,\d{3})*\.\d{2})", text
                    )
                    if matches:
                        amount = max(float(match.replace(",", "")) for match in matches)

                result["amount"] = amount

                date = None
                match = re.search(r"(\d{4}-\d{2}-\d{2})", text)
                if match:
                    raw_date = match.group(1)
                    try:
                        parsed = datetime_cls.strptime(raw_date, "%Y-%m-%d")
                        date = parsed.strftime("%d/%m/%Y")
                    except Exception:
                        date = None

                if date is None:
                    fallback = re.search(r"(\d{2}/\d{2}/\d{4})", text)
                    if fallback:
                        date = fallback.group(1)

                result["date"] = date

                title_match = re.search(
                    r"(MR\.?\s*D\.?I\.?Y\.?|AEON|7-ELEVEN|LOTUS|TESCO)",
                    text,
                    re.IGNORECASE,
                )
                if title_match:
                    result["title"] = title_match.group(1)

                browser.close()
                print("FINAL RESULT:", result)
                return result
            except Exception as exc:
                browser.close()
                print("ERROR:", str(exc))
                return {
                    "amount": None,
                    "date": None,
                    "title": "E-Invoice Receipt",
                    "error": str(exc),
                }

    @staticmethod
    def extract_text_from_pdf(path):
        text = ""
        try:
            with pdfplumber.open(path) as pdf:
                for page in pdf.pages:
                    text += (page.extract_text() or "") + "\n"
        except Exception as exc:
            print("PDF PARSE ERROR:", exc)
        return text

    @staticmethod
    def parse_einvoice_date(date_str, datetime_cls=None):
        if datetime_cls is None:
            from datetime import datetime as datetime_cls

        if not date_str:
            return None

        date_str = date_str.strip()
        formats = [
            "%d/%m/%Y",
            "%d-%m-%Y",
            "%d/%m/%y",
            "%d-%m-%y",
            "%d %b %Y",
            "%d %B %Y",
            "%m/%d/%Y",
        ]
        for fmt in formats:
            try:
                parsed = datetime_cls.strptime(date_str, fmt)
                if 2020 <= parsed.year <= 2030:
                    return parsed.strftime("%Y-%m-%d")
            except Exception:
                continue
        return None

    @staticmethod
    def normalize_date(date_str):
        if not date_str:
            return None

        try:
            if len(date_str) == 10 and date_str[4] == "-":
                year, month, day = date_str.split("-")
                if int(year) < 2020:
                    return f"20{day}-{month}-{year[-2:]}"
                return date_str
        except Exception:
            return None

        return None

    @staticmethod
    def parse_einvoice(data):
        try:
            url = data.get("url")
            print("URL:", url)

            if not url:
                return (
                    jsonify(
                        {
                            "amount": None,
                            "date": None,
                            "title": "E-Invoice",
                            "error": "Missing URL",
                        }
                    ),
                    400,
                )

            result = OCRService.scrape_with_playwright(url)
            print("PARSED RESULT:", result)
            return jsonify(result), 200
        except Exception as exc:
            print("PARSE ERROR:", str(exc))
            return (
                jsonify(
                    {
                        "amount": None,
                        "date": None,
                        "title": "E-Invoice",
                        "error": str(exc),
                    }
                ),
                500,
            )

    @staticmethod
    def _normalize_ocr_text(text):
        text = text.upper()
        text = text.replace(",", ".")
        text = text.replace("O", "0")
        text = text.replace("I", "1")
        text = text.replace("S", "5")
        text = text.replace("B", "8")
        return text
