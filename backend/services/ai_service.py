import json
import re
from datetime import datetime, timedelta

from dotenv import load_dotenv
from flask import jsonify
from openai import OpenAI
from sqlalchemy import func
from word2number import w2n

from models import Category, Expense, db
from prompts import get_budget_prompt, get_expense_prompt, get_regular_payment_prompt


class AIService:
    @staticmethod
    def create_client(api_key):
        return OpenAI(api_key=api_key)

    @staticmethod
    def get_user_categories(user_id):
        categories = Category.query.filter_by(user_id=user_id, type="expense").all()
        return [category.name for category in categories]

    @staticmethod
    def transcribe(request, client, get_user_categories_fn):
        try:
            print("REQUEST RECEIVED")

            user_id = request.form.get("userId")
            if not user_id:
                return jsonify({"error": "Missing userId"}), 400

            user_id = int(user_id)
            text = None

            if "file" in request.files:
                file = request.files["file"]
                filepath = "temp.m4a"
                file.save(filepath)

                with open(filepath, "rb") as audio:
                    transcript = client.audio.transcriptions.create(
                        model="gpt-4o-mini-transcribe",
                        file=audio,
                    )
                text = transcript.text
                print("TRANSCRIBED:", text)
            else:
                data = request.get_json(silent=True) or {}
                text = request.form.get("text") or data.get("text")

            if not text:
                return jsonify({"error": "No input text"}), 400

            print("FINAL TEXT:", text)
            final_text = text
            flow_override = request.form.get("flow")
            print("FLOW OVERRIDE:", flow_override)

            intent = None
            if flow_override == "regularPayment":
                intent = "add_regular_payment"
            elif flow_override == "budget":
                intent = "add_budget"
            elif flow_override == "expense":
                intent = "add_expense"

            if intent is None:
                intent_prompt = f"""
        Classify the user's intent.

        User input:
        "{text}"

        Return JSON:
        {{
        "intent": "add_expense | add_budget | add_regular_payment 
        | query_total | query_category | query_summary | unknown"
        }}
        """

                intent_res = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[{"role": "user", "content": intent_prompt}],
                    response_format={"type": "json_object"},
                )
                intent_data = json.loads(intent_res.choices[0].message.content)
                intent = intent_data.get("intent")

            print("FINAL INTENT:", intent)
            text_lower = text.lower()
            if intent == "add_budget" and any(
                word in text_lower for word in ["youtube", "netflix", "spotify"]
            ):
                intent = "add_regular_payment"

            categories = get_user_categories_fn(user_id)
            if not categories:
                categories = ["food", "transport", "shopping", "billing"]

            today = datetime.today().strftime("%Y-%m-%d")

            if intent == "add_expense":
                prompt = get_expense_prompt(text, today, categories)
                chat = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[{"role": "user", "content": prompt}],
                    response_format={"type": "json_object"},
                )
                result = json.loads(chat.choices[0].message.content)
                return jsonify(
                    {
                        "type": "expense",
                        "text": final_text,
                        "intent": intent,
                        "result": result,
                    }
                )

            if intent == "add_budget":
                prompt = get_budget_prompt(text, today, categories)
                chat = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[{"role": "user", "content": prompt}],
                    response_format={"type": "json_object"},
                )
                result = json.loads(chat.choices[0].message.content)
                return jsonify(
                    {
                        "type": "budget",
                        "text": final_text,
                        "intent": intent,
                        "result": result,
                    }
                )

            if intent == "add_regular_payment":
                return AIService._handle_regular_payment_intent(
                    text=text,
                    final_text=final_text,
                    intent=intent,
                    categories=categories,
                    today=today,
                    client=client,
                )

            return AIService._handle_query_intent(
                text=text,
                final_text=final_text,
                intent=intent,
                user_id=user_id,
                get_user_categories_fn=get_user_categories_fn,
            )
        except Exception as exc:
            print("ERROR:", str(exc))
            return jsonify({"error": str(exc)}), 500

    @staticmethod
    def extract_budget(data, client, get_user_categories_fn):
        try:
            text = data.get("text", "")
            user_id = data.get("userId")
            if not user_id:
                return jsonify({"error": "Missing userId"}), 400

            text = text.lower().strip()
            default_categories = [
                "food",
                "transport",
                "billing",
                "shopping",
                "health",
                "entertainment",
            ]
            categories = get_user_categories_fn(user_id) or []
            categories = [category.lower().strip() for category in categories]
            all_categories = list(set(default_categories + categories))

            prompt = get_budget_prompt(
                text,
                datetime.today().strftime("%Y-%m-%d"),
                all_categories,
            )
            chat = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
            )
            result = json.loads(chat.choices[0].message.content)
            amount = result.get("amount", 0)
            category = result.get("category", "general")

            if not category or str(category).lower() == "null":
                category = "general"

            return jsonify({"amount": amount, "category": category.lower().strip()}), 200
        except Exception as exc:
            return jsonify({"error": str(exc), "amount": 0, "category": "general"}), 500

    @staticmethod
    def extract_regular_payment(data):
        text = data.get("text", "")

        print("\n==============================")
        print("REQUEST RECEIVED (REGULAR PAYMENT)")
        print("RAW TEXT:", text)

        text = text.lower()
        print("FINAL TEXT:", text)

        amount = 0
        title = "Untitled"
        category = "General"
        type_ = "expense"
        frequency = "Monthly"

        digit_match = re.search(r"(\d+(\.\d{1,2})?)", text)
        if digit_match:
            amount = float(digit_match.group())
        else:
            try:
                amount = float(w2n.word_to_num(text))
            except Exception:
                amount = 0

        cleaned = re.sub(r"\d+(\.\d{1,2})?", "", text)
        cleaned = (
            cleaned.replace("monthly", "")
            .replace("weekly", "")
            .replace("daily", "")
            .replace("yearly", "")
        )
        title = cleaned.strip().title()[:30] if cleaned.strip() else "Untitled"

        known_categories = [
            "food",
            "transport",
            "shopping",
            "entertainment",
            "health",
            "billing",
        ]
        for known_category in known_categories:
            if known_category in text:
                category = known_category.lower().strip()
                break

        if "income" in text or "salary" in text:
            type_ = "income"

        if "daily" in text:
            frequency = "Daily"
        elif "weekly" in text:
            frequency = "Weekly"
        elif "yearly" in text or "annually" in text:
            frequency = "Yearly"

        result = {
            "title": title,
            "amount": amount,
            "category": category,
            "type": type_,
            "frequency": frequency,
        }

        print("PARSED (REGULAR PAYMENT):", result)
        print("==============================\n")
        return jsonify(result), 200

    @staticmethod
    def _handle_regular_payment_intent(text, final_text, intent, categories, today, client):
        try:
            prompt = get_regular_payment_prompt(text, today, categories)
            chat = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
            )

            raw = chat.choices[0].message.content
            print("RAW AI RESPONSE:", raw)

            result = json.loads(raw)
            category = result.get("suggestedCategory") or result.get("category") or "general"
            category = category.lower().strip()
            result["category"] = category
            result["suggestedCategory"] = category

            if not result.get("amount") or result["amount"] == 0:
                digit_match = re.search(r"(\d+(\.\d{1,2})?)", text)
                if digit_match:
                    result["amount"] = float(digit_match.group())
                else:
                    try:
                        result["amount"] = float(w2n.word_to_num(text))
                    except Exception:
                        result["amount"] = 0

            return jsonify(
                {
                    "type": "regular_payment",
                    "text": final_text,
                    "intent": intent,
                    "result": result,
                }
            )
        except Exception as exc:
            print("REGULAR PAYMENT ERROR:", str(exc))
            return jsonify({"error": str(exc), "intent": intent, "result": None}), 500

    @staticmethod
    def _handle_query_intent(text, final_text, intent, user_id, get_user_categories_fn):
        text_lower = text.lower()
        clean_text = text_lower
        user_categories = get_user_categories_fn(user_id) or []

        matched_category = None
        for category in user_categories:
            pattern = r"\b" + re.escape(category.lower()) + r"\b"
            if re.search(pattern, clean_text):
                matched_category = category
                break

        if matched_category:
            intent = "query_category"

        if intent == "query_total":
            return AIService._query_total(text, intent, user_id)

        if intent in ["query_summary", "query_category"]:
            return AIService._query_summary_or_category(
                text=text,
                intent=intent,
                user_id=user_id,
                matched_category=matched_category,
                get_user_categories_fn=get_user_categories_fn,
            )

        return jsonify(
            {
                "type": "answer",
                "text": final_text,
                "intent": intent,
                "answer": "Sorry, I didn’t understand that. Try asking something like:\n- How much did I spend last week?\n- Show my top category this month",
            }
        )

    @staticmethod
    def _query_total(text, intent, user_id):
        today_dt = datetime.today()
        text_lower = text.lower()

        if "this week" in text_lower:
            start = (today_dt - timedelta(days=today_dt.weekday())).replace(
                hour=0, minute=0, second=0, microsecond=0
            )
            end = today_dt.replace(hour=23, minute=59, second=59, microsecond=999999)
        elif "last week" in text_lower:
            this_monday = (today_dt - timedelta(days=today_dt.weekday())).replace(
                hour=0, minute=0, second=0, microsecond=0
            )
            start = this_monday - timedelta(days=7)
            end = this_monday - timedelta(seconds=1)
        elif "today" in text_lower:
            start = today_dt.replace(hour=0, minute=0, second=0, microsecond=0)
            end = today_dt.replace(hour=23, minute=59, second=59, microsecond=999999)
        elif "yesterday" in text_lower:
            yesterday = today_dt - timedelta(days=1)
            start = yesterday.replace(hour=0, minute=0, second=0, microsecond=0)
            end = yesterday.replace(hour=23, minute=59, second=59, microsecond=999999)
        elif "this month" in text_lower:
            start = today_dt.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            end = today_dt.replace(hour=23, minute=59, second=59, microsecond=999999)
        elif "last month" in text_lower:
            first_day_this_month = today_dt.replace(day=1)
            last_month_last_day = first_day_this_month - timedelta(days=1)
            start = last_month_last_day.replace(
                day=1, hour=0, minute=0, second=0, microsecond=0
            )
            end = last_month_last_day.replace(
                hour=23, minute=59, second=59, microsecond=999999
            )
        elif "last 7 days" in text_lower:
            start = (today_dt - timedelta(days=6)).replace(
                hour=0, minute=0, second=0, microsecond=0
            )
            end = today_dt.replace(hour=23, minute=59, second=59, microsecond=999999)
        else:
            start = (today_dt - timedelta(days=today_dt.weekday())).replace(
                hour=0, minute=0, second=0, microsecond=0
            )
            end = today_dt.replace(hour=23, minute=59, second=59, microsecond=999999)

        total = (
            db.session.query(func.sum(Expense.amount))
            .filter(Expense.user_id == user_id, Expense.date >= start, Expense.date <= end)
            .scalar()
            or 0
        )

        return jsonify(
            {
                "type": "answer",
                "text": text,
                "intent": intent,
                "date_range": {
                    "start": start.strftime("%Y-%m-%d"),
                    "end": end.strftime("%Y-%m-%d"),
                },
                "answer": f"You spent RM{total:.2f} from {start.strftime('%d %b %Y')} to {end.strftime('%d %b %Y')}",
            }
        )

    @staticmethod
    def _query_summary_or_category(
        text, intent, user_id, matched_category, get_user_categories_fn
    ):
        today_dt = datetime.today()
        text_lower = text.lower()

        if "today" in text_lower:
            start = today_dt.replace(hour=0, minute=0, second=0, microsecond=0)
            end = today_dt.replace(hour=23, minute=59, second=59, microsecond=999999)
        elif "yesterday" in text_lower:
            yesterday = today_dt - timedelta(days=1)
            start = yesterday.replace(hour=0, minute=0, second=0, microsecond=0)
            end = yesterday.replace(hour=23, minute=59, second=59, microsecond=999999)
        elif "last week" in text_lower:
            start = (today_dt - timedelta(days=today_dt.weekday() + 7)).replace(
                hour=0, minute=0, second=0, microsecond=0
            )
            end = start + timedelta(days=6, hours=23, minutes=59, seconds=59)
        elif "this week" in text_lower:
            start = (today_dt - timedelta(days=today_dt.weekday())).replace(
                hour=0, minute=0, second=0, microsecond=0
            )
            end = today_dt.replace(hour=23, minute=59, second=59, microsecond=999999)
        elif "last month" in text_lower:
            first_day_this_month = today_dt.replace(day=1)
            last_month_last_day = first_day_this_month - timedelta(days=1)
            start = last_month_last_day.replace(
                day=1, hour=0, minute=0, second=0, microsecond=0
            )
            end = last_month_last_day.replace(
                hour=23, minute=59, second=59, microsecond=999999
            )
        elif "this month" in text_lower:
            start = today_dt.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            end = today_dt.replace(hour=23, minute=59, second=59, microsecond=999999)
        else:
            start = today_dt.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            end = today_dt.replace(hour=23, minute=59, second=59, microsecond=999999)

        user_categories = get_user_categories_fn(user_id)
        if not user_categories:
            user_categories = [
                "food",
                "transport",
                "billing",
                "shopping",
                "health",
                "entertainment",
            ]

        clean_text = re.sub(
            r"\b(category|on|the|for|spending|expense|expenses)\b", "", text_lower
        )
        clean_text = re.sub(r"\s+", " ", clean_text).strip()

        if matched_category:
            total = (
                db.session.query(func.sum(Expense.amount))
                .filter(
                    Expense.user_id == user_id,
                    Expense.category.ilike(matched_category),
                    Expense.date >= start,
                    Expense.date <= end,
                )
                .scalar()
                or 0
            )
            return jsonify(
                {
                    "type": "answer",
                    "text": text,
                    "intent": intent,
                    "answer": f"I couldn't find category '{clean_text}'. Try food, transport, shopping, etc.",
                    "date_range": {
                        "start": start.strftime("%Y-%m-%d"),
                        "end": end.strftime("%Y-%m-%d"),
                    },
                }
            )

        result = None
        if any(word in text_lower for word in ["most", "highest", "top", "biggest"]):
            result = (
                db.session.query(Expense.category, func.sum(Expense.amount).label("total"))
                .filter(
                    Expense.user_id == user_id,
                    Expense.date >= start,
                    Expense.date <= end,
                )
                .group_by(Expense.category)
                .order_by(func.sum(Expense.amount).desc())
                .first()
            )

        if not result:
            return jsonify(
                {
                    "type": "answer",
                    "text": text,
                    "intent": intent,
                    "answer": "No expenses found",
                    "date_range": {
                        "start": start.strftime("%Y-%m-%d"),
                        "end": end.strftime("%Y-%m-%d"),
                    },
                }
            )

        category, total = result
        return jsonify(
            {
                "type": "answer",
                "text": text,
                "intent": intent,
                "date_range": {
                    "start": start.strftime("%Y-%m-%d"),
                    "end": end.strftime("%Y-%m-%d"),
                },
                "answer": f"You spent the most on {category} (RM{total:.2f}) from {start.strftime('%d %b %Y')} to {end.strftime('%d %b %Y')}",
            }
        )


load_dotenv()
