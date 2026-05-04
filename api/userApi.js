// app/api/userApi.js
import axios from "axios";

import API_URL from "./config";

// ---------------- SIGNUP ----------------
export async function signupUser(data) {
  try {
    const response = await axios.post(`${API_URL}/signup`, data);
    return response.data; // returns { message, user_id }
  } catch (error) {
    throw error.response?.data || error;
  }
}

// ---------------- LOGIN ----------------
export async function loginUser(data) {
  try {
    const response = await axios.post(`${API_URL}/login`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
}

// ---------------- GET USER INFO ----------------
export async function getUserInfo(user_id) {
  try {
    const response = await axios.get(`${API_URL}/user/${user_id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
}

// ---------------- UPDATE USER ----------------
export const updateUser = async (user_id, data) => {
  const response = await axios.put(
    `${API_URL}/user/${user_id}`,
    data,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
};

// ---------------- DELETE USER ----------------
export async function deleteUser(user_id) {
  try {
    const response = await axios.delete(`${API_URL}/user/${user_id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
}
