// constants/defaultIcon.js

export const DEFAULT_EXPENSE_CATEGORIES = [
  { id: "food", name: "Food", icon: "fast-food" },
  { id: "transport", name: "Transport", icon: "car" },
  { id: "billing", name: "Billing", icon: "receipt" },
  { id: "shopping", name: "Shopping", icon: "cart" },
  { id: "health", name: "Health", icon: "medkit" },
  { id: "entertainment", name: "Entertainment", icon: "game-controller" },
];

export const DEFAULT_INCOME_CATEGORIES = [
  { id: "salary", name: "Salary", icon: "cash" },
  { id: "gift", name: "Gift", icon: "gift" },
  { id: "investment", name: "Investment", icon: "trending-up" },
  { id: "bonus", name: "Bonus", icon: "wallet" },
  { id: "freelance", name: "Freelance", icon: "laptop" },
];

/* Helper function (optional but VERY useful) */
export const getCategoryIcon = (name) => {
  const all = [...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES];
  const found = all.find((c) => c.name === name);
  return found ? found.icon : "apps"; // fallback icon
};