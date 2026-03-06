import axios from "axios";

const API_URL = "http://10.0.2.2:5000";

export interface Expense {
  id: number;
  title: string;
  amount: number;
  category: string;
  date: string;
}


export interface Income {
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


// Example if backend route is actually /incomes
export const addIncome = async (data: Omit<Income, "id">) => {
  return axios.post(`${API_URL}/income`, data); // <-- note plural
};

export async function getIncome(): Promise<Income[]> {
  const response = await axios.get<Income[]>(`${API_URL}/income`);
  return response.data;
}