// app/api/budgetApi.js
import axios from "axios";

// const API_URL = "http://10.0.2.2:5000"; // For Android emulator
// const API_URL = "http://192.168.0.10:5000";
import API_URL from "./config";
/* ======================
   BUDGET FUNCTIONS
====================== */

// Add a budget
export async function addBudget(data) {
  return axios.post(`${API_URL}/budget`, data);
}

// Get budgets for a specific month & year
export async function getBudgets(userId, month, year) {
  try {
    const response = await axios.get(`${API_URL}/budget/${userId}`, {
      params: { month, year },
    });

    return response.data;
  } catch (error) {
    console.error(
      "Get budgets error:",
      error.response?.data || error.message
    );
    throw error;
  }
}

// Update budget amount by ID
export async function updateBudget(budgetId, amount) {
  return axios.put(`${API_URL}/budget/${budgetId}`, { amount });
}

// Delete budget by ID
export async function deleteBudget(budgetId) {
  return axios.delete(`${API_URL}/budget/${budgetId}`);
}