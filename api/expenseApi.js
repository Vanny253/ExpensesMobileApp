// app/api/expenseApi.js
import axios from "axios";

import API_URL from "./config";

/* ======================
   EXPENSE FUNCTIONS
====================== */

// Add expense
export async function addExpense(data) {
  return axios.post(`${API_URL}/expense`, data);
}

// Get expenses for a specific user
export async function getExpenses(userId) {
  const response = await axios.get(`${API_URL}/expense/${userId}`);
  return response.data;
}

// Update expense by ID
export async function updateExpense(expenseId, data) {
  return axios.put(`${API_URL}/expense/${expenseId}`, data);
}

// Delete expense by ID
export async function deleteExpense(expenseId) {
  return axios.delete(`${API_URL}/expense/${expenseId}`);
}

/* ======================
   INCOME FUNCTIONS
====================== */

// Add income
export async function addIncome(data) {
  return axios.post(`${API_URL}/income`, data);
}

// Get income for a specific user
export async function getIncome(userId) {
  const response = await axios.get(`${API_URL}/income/${userId}`);
  return response.data;
}

// Update income by ID
export async function updateIncome(incomeId, data) {
  return axios.put(`${API_URL}/income/${incomeId}`, data);
}

// Delete income by ID
export async function deleteIncome(incomeId) {
  return axios.delete(`${API_URL}/income/${incomeId}`);
}