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


def get_budget_prompt(text, today, categories):
    return f"""
You are a budget extraction AI.

USER INPUT:
"{text}"

TODAY: {today}

USER CATEGORIES:
{categories}

----------------------------

Extract budget info.

RULES:
- category MUST come from user categories first
- if match exists, return EXACT name
- amount MUST be number
- if no amount → null

Return JSON ONLY:

{{
  "amount": number,
  "category": string
}}
"""

def get_regular_payment_prompt(text, today, categories):
    return f"""
You are an AI that extracts structured data for a regular payment.

CRITICAL RULES:
- ALWAYS respect the user's mentioned category if provided
- NEVER default to "General" if a category exists in the sentence
- If user says "food", "entertainment", "transport", etc → USE IT EXACTLY
- Only use "General" if NO category is mentioned

RULES:

1. The FIRST words BEFORE amount = NOTE
   - Example:
     "Working 10 weekly Bus 1/5/2026"
     → note = "Working"

2. Extract amount (number only)

3. Extract category:
   - must match user category first
   - fallback to default category

4. Extract frequency:
   - daily / weekly / monthly / yearly


5. Extract date if exists:
   - format: YYYY-MM-DD


DATE PARSING RULES (CRITICAL):

1. If format is ambiguous like:
   - 1/5/2026
   - 12/4/2026
   - 3/6/2026

   ALWAYS interpret as:
   👉 DD/MM/YYYY (Malaysian format)

   Example:
   - 1/5/2026 = 1 May 2026 = 2026-05-01
   - 12/4/2026 = 12 April 2026 = 2026-04-12

2. If format is ISO:
   - 2026-05-01 → keep as is

3. If natural language:
   - "today", "tomorrow", "next week"
   → convert based on system date: {today}

4. ALWAYS output:
   YYYY-MM-DD



Available categories:
{categories}

User input:
"{text}"

Return JSON:
{{
  "note": "",
  "amount": 0,
  "frequency": "daily | weekly | monthly | yearly",
  "suggestedCategory": ""
  "date": string | null,
}}

IMPORTANT:
- "in category food" → MUST return "food"
- "category food" → MUST return "food"
- "food" → MUST return "food"
"""



def get_chat_intent_prompt(text):
    return f"""
You are an AI intent classifier.

Classify the user's request into ONE of these intents:

INTENTS:
- add_expense → user is adding spending (e.g. "buy food 10", "spent 20")
- query_total → asking total spending (e.g. "how much did I spend last week", "total spent this month")
- query_category → spending by category
- query_summary → breakdown of spending
- unknown → anything not related to finance


User input:
"{text}"

Return JSON only:

{{
  "intent": "one_of_the_above"
}}
"""
