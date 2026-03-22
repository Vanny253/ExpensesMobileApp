import axios from "axios";

// const API_URL = "http://10.0.2.2:5000";
const API_URL = "http://192.168.0.10:5000";
// const API_URL = "http://10.22.218.65:5000";

/* ======================
   CATEGORY INTERFACE
====================== */

export interface Category {
  id: number;
  user_id: number;
  type: "expense" | "income";
  name: string;
  icon: string;
  created_at?: string;
  updated_at?: string;
}

/* ======================
   CATEGORY FUNCTIONS
====================== */

// Add category
export async function addCategory(data: Omit<Category, "id" | "created_at" | "updated_at">) {
  return axios.post(`${API_URL}/categories`, data);
}

// Get categories by user + type
export async function getCategories(
  userId: number,
  type: "expense" | "income"
): Promise<Category[]> {
  const response = await axios.get<Category[]>(
    `${API_URL}/categories/${userId}/${type}`
  );
  return response.data;
}

// Delete category
export async function deleteCategory(categoryId: number) {
  return axios.delete(`${API_URL}/categories/${categoryId}`);
}