def get_expense_prompt(text, today, categories):
    return f"""
You are an expense extraction AI assistant.

Extract structured expense data from the sentence below.

Sentence:
"{text}"

Today's date: {today}

IMPORTANT:
- Return ONLY valid JSON
- No explanation, no markdown

JSON format:
{{
  "amount": number,
  "note": string,
  "suggestedCategory": string,
  "date": "YYYY-MM-DD"
}}

🔥 CRITICAL RULES:

1. AMOUNT:
- Extract numbers from words or digits
- Examples:
  "RM5" → 5
  "5 ringgit" → 5
  "five" → 5
- NEVER return 0 if a number exists
- If no amount → return null




2. CATEGORY (VERY IMPORTANT LOGIC):

You must choose category using THIS PRIORITY ORDER:

STEP 1 (HIGHEST PRIORITY):
Check if the user's database categories contain an EXACT or CLOSE MATCH.

- If user says "Dinner" and DB has "dinner" → use "dinner"
- If user says "coffee" and DB has "coffee" → use "coffee"

👉 If matched here → STOP immediately and return it.

---

STEP 2:
If no match in user custom categories,
check DEFAULT SYSTEM CATEGORIES:

- food
- transport
- billing
- shopping
- health
- entertainment
- salary
- investment
- bonus

Example:
- "dinner", "meal", "eat" → food
- "grab", "bus", "taxi" → transport

---

STEP 3 (LAST RESORT):
Only if NOTHING matches above,
use strict mapping rules:

STRICT MAPPING:
- bill, bills, utilities, electric, water, wifi → billing
- food, meal, lunch, dinner, eat → food
- grab, taxi, bus, train, petrol → transport
- movie, game, netflix → entertainment
- clinic, medicine, doctor → health
- shopping, clothes, buy → shopping
- salary, pay, income → salary

---

RULES:
- ALWAYS prefer user database categories first
- NEVER convert user category into default category
  (example: "dinner" must stay "dinner" if exists in DB)
- Return EXACT string only
- No explanation



3. NOTE:
- Short description of the expense
- If unclear → "General expense"

4. DATE:
- If not mentioned → use today's date

"""