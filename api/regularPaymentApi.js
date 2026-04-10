import axios from "axios";

import API_URL from "./config";

// -------------------- REGULAR PAYMENT FUNCTIONS --------------------

// Add a new regular payment
export async function addRegularPayment(data) {
  const response = await axios.post(`${API_URL}/regular_payments`, data);
  return response.data;
}

// Get all regular payments for a user
export async function getRegularPayments(userId) {
  const response = await axios.get(
    `${API_URL}/regular_payments/${userId}`
  );
  return response.data;
}

// Update a regular payment by ID
export async function updateRegularPayment(paymentId, data) {
  const response = await axios.put(
    `${API_URL}/regular_payments/${paymentId}`,
    data
  );
  return response.data;
}

// Delete a regular payment by ID
export async function deleteRegularPayment(paymentId) {
  const response = await axios.delete(
    `${API_URL}/regular_payments/${paymentId}`
  );
  return response.data;
}