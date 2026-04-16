import API_URL from "../api/config";

export const sendChatMessage = async (message, userId, currentExpense) => {
  const res = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      userId,
      currentExpense,
    }),
  });

  return await res.json();
};