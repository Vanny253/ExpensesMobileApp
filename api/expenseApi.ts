import axios from "axios";

const API_URL = "http://10.0.2.2:5000";

export interface Expense {
  id: number;
  title: string;
  amount: number;
  category: string;
  date: string;
}

export async function addExpense(data: Omit<Expense, "id">) {
  return axios.post(`${API_URL}/expense`, data);
}

export async function getExpenses(): Promise<Expense[]> {
  const response = await axios.get<Expense[]>(`${API_URL}/expenses`);
  return response.data;
}
