import axios from "axios";

// -------------------- CONFIG --------------------
const API_URL = "http://192.168.0.10:5000";
// const API_URL = "http://10.138.179.65:5000"; // For physical device

// -------------------- TYPES --------------------
export interface RegularPayment {
  id: number;
  user_id: number;
  title: string;
  type: "expense" | "income";
  category: string;
  frequency: string;
  start_date: string; // YYYY-MM-DD
  amount: number;
}

export interface AddRegularPaymentData {
  user_id: number;
  title: string;
  type: "expense" | "income";
  category: string;
  frequency: string;
  start_date: string; // YYYY-MM-DD
  amount: number;
}

// -------------------- REGULAR PAYMENT FUNCTIONS --------------------

// Add a new regular payment
export async function addRegularPayment(data: AddRegularPaymentData) {
  const response = await axios.post(`${API_URL}/regular_payments`, data);
  return response.data;
}

// Get all regular payments for a user
export async function getRegularPayments(userId: number): Promise<RegularPayment[]> {
  const response = await axios.get<RegularPayment[]>(`${API_URL}/regular_payments/${userId}`);
  return response.data;
}

// Update a regular payment by ID
export async function updateRegularPayment(
  paymentId: number,
  data: Partial<AddRegularPaymentData>
) {
  const response = await axios.put(`${API_URL}/regular_payments/${paymentId}`, data);
  return response.data;
}

// Delete a regular payment by ID
export async function deleteRegularPayment(paymentId: number) {
  const response = await axios.delete(`${API_URL}/regular_payments/${paymentId}`);
  return response.data;
}