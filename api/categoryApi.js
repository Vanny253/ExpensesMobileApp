// app/api/categoryApi.js
import axios from "axios";
import API_URL from "./config";
/* ======================
   CATEGORY FUNCTIONS
====================== */

// Add category
export async function addCategory(data) {
  return axios.post(`${API_URL}/categories`, data);
}

// Get categories by user + type
export async function getCategories(userId, type) {
  const response = await axios.get(
    `${API_URL}/categories/${userId}/${type}`
  );
  return response.data;
}

// Delete category
export async function deleteCategory(categoryId) {
  return axios.delete(`${API_URL}/categories/${categoryId}`);
}