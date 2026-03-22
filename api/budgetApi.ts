// app/api/budgetApi.ts
import axios from "axios";

// const API_URL = "http://10.0.2.2:5000"; // For Android emulator
const API_URL = "http://192.168.0.10:5000";

// ---------------- TYPES ----------------
export interface Budget {
  id: number;
  category: string;
  budget: number;
  spent: number;
  remaining: number;
}

export interface AddBudgetData {
  user_id: number;
  category: string;
  amount: number;
  month: number;
  year: number;
}

/* ======================
   BUDGET FUNCTIONS
====================== */

// Add a budget
export async function addBudget(data: AddBudgetData) {
  return axios.post(`${API_URL}/budget`, data);
}

// Get all budgets for a user
export async function getBudgets(userId: number): Promise<Budget[]> {
  const response = await axios.get<Budget[]>(`${API_URL}/budget/${userId}`);
  return response.data;
}

// Update budget amount by ID
export async function updateBudget(budgetId: number, amount: number) {
  return axios.put(`${API_URL}/budget/${budgetId}`, { amount });
}

// Delete budget by ID
export async function deleteBudget(budgetId: number) {
  return axios.delete(`${API_URL}/budget/${budgetId}`);
}