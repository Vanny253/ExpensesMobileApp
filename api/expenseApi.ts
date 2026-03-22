import axios from "axios";

// const API_URL = "http://10.0.2.2:5000";
const API_URL = "http://192.168.0.10:5000";
// const API_URL = "http://10.22.218.65:5000";


export interface Expense {
  id: number;
  user_id: number;
  title: string;
  amount: number;
  category: string;
  date: string;
}

export interface Income {
  id: number;
  user_id: number;
  title: string;
  amount: number;
  category: string;
  date: string;
}

/* ======================
   EXPENSE FUNCTIONS
====================== */

// Add expense (user_id is required)
export async function addExpense(data: Omit<Expense, "id">) {
  return axios.post(`${API_URL}/expense`, data);
}

// Get expenses for a specific user
export async function getExpenses(userId: number): Promise<Expense[]> {
  const response = await axios.get<Expense[]>(`${API_URL}/expense/${userId}`);
  return response.data;
}

// Update expense by ID
export async function updateExpense(expenseId: number, data: Partial<Omit<Expense, "id" | "user_id">>) {
  return axios.put(`${API_URL}/expense/${expenseId}`, data);
}

// Delete expense by ID
export async function deleteExpense(expenseId: number) {
  return axios.delete(`${API_URL}/expense/${expenseId}`);
}



/* ======================
   INCOME FUNCTIONS
====================== */

// Add income (user_id is required)
export async function addIncome(data: Omit<Income, "id">) {
  return axios.post(`${API_URL}/income`, data);
}

// Get income for a specific user
export async function getIncome(userId: number): Promise<Income[]> {
  const response = await axios.get<Income[]>(`${API_URL}/income/${userId}`);
  return response.data;
}

// Update income by ID
export async function updateIncome(incomeId: number, data: Partial<Omit<Income, "id" | "user_id">>) {
  return axios.put(`${API_URL}/income/${incomeId}`, data);
}

// Delete income by ID
export async function deleteIncome(incomeId: number) {
  return axios.delete(`${API_URL}/income/${incomeId}`);
}
