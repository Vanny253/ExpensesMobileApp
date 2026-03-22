// app/api/userApi.ts
import axios from "axios";

// For Android emulator use: 10.0.2.2
const API_URL = "http://192.168.0.10:5000";
// const API_URL = "http://10.22.218.65:5000";


// ---------------- TYPES ----------------
export interface User {
  user_id: number;
  email: string;
  password?: string;
  nickname: string;
  phone_number?: string;
  gender?: string;
  date_of_birth?: string;
  profile_image?: string;
  create_at: string;
}

export interface LoginResponse {
  message: string;
  user: User;
}

// ---------------- SIGNUP ----------------
export async function signupUser(data: {
  email: string;
  password: string;
  nickname: string;
  phone_number?: string;
  gender?: string;
  date_of_birth?: string;
}) {
  try {
    const response = await axios.post(`${API_URL}/signup`, data);
    return response.data; // returns { message, user_id }
  } catch (error: any) {
    throw error.response?.data || error;
  }
}

// ---------------- LOGIN ----------------
export async function loginUser(data: { email: string; password: string }): Promise<LoginResponse> {
  try {
    const response = await axios.post<LoginResponse>(`${API_URL}/login`, data);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
}

// ---------------- GET USER INFO ----------------
export async function getUserInfo(user_id: number): Promise<User> {
  try {
    const response = await axios.get<User>(`${API_URL}/user/${user_id}`);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
}