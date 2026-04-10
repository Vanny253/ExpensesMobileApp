// app/api/reportApi.js
import axios from "axios";

import API_URL from "./config";


// Get monthly report
export async function getMonthlyReport(userId, month, year) {
  const now = new Date();
  const m = month || now.getMonth() + 1;
  const y = year || now.getFullYear();

  try {
    const response = await axios.get(
      `${API_URL}/report/monthly/${userId}`,
      {
        params: { month: m, year: y },
      }
    );
    return response.data;
  } catch (err) {
    console.error("getMonthlyReport Error:", err);
    throw err;
  }
}

// Get monthly budgets
export async function getMonthlyBudgets(userId, month, year) {
  try {
    const response = await axios.get(
      `${API_URL}/budget/monthly/${userId}`,
      {
        params: { month, year },
      }
    );
    return response.data;
  } catch (err) {
    console.error("getMonthlyBudgets Error:", err);
    throw err;
  }
}