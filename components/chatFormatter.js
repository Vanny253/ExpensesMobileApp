export const formatExpense = (e) => {
  return (
    `🤖 Expense Extracted\n\n` +
    `🏷 Title: ${e.note || "General expense"}\n` +
    `💰 Amount: RM ${e.amount || "0.00"}\n` +
    `📅 Date: ${e.date || "Not detected"}\n` +
    `🏷 Category: ${e.suggestedCategory || "Not detected"}\n\n` +
    `👉 Ready to add to expense form`
  );
};