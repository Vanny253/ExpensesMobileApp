import axios from "axios";
import API_URL from "./config";

// Add a new regular payment
export async function addRegularPayment(data) {
  try {
    const response = await axios.post(`${API_URL}/regular_payments`, data);
    return response.data;
  } catch (error) {
    console.error("ADD ERROR:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Failed to add payment");
  }
}

// Get all regular payments for a user
export async function getRegularPayments(userId) {
  try {
    if (!userId) throw new Error("Invalid user ID");

    const response = await axios.get(
      `${API_URL}/regular_payments/${userId}`
    );
    return response.data;
  } catch (error) {
    console.error("GET ERROR:", error.response?.data || error.message);
    throw new Error("Failed to load payments");
  }
}

// Update a regular payment by ID
export async function updateRegularPayment(paymentId, data) {
  try {
    if (!paymentId || isNaN(paymentId)) {
      throw new Error("Invalid payment ID");
    }

    const response = await axios.put(
      `${API_URL}/regular_payments/${paymentId}`,
      data
    );

    return response.data;
  } catch (error) {
    console.error("UPDATE ERROR:", error.response?.data || error.message);
    throw new Error(
      error.response?.data?.message || "Failed to update payment"
    );
  }
}

// Delete a regular payment by ID
export async function deleteRegularPayment(paymentId) {
  try {
    if (!paymentId || isNaN(paymentId)) {
      throw new Error("Invalid payment ID");
    }

    const response = await axios.delete(
      `${API_URL}/regular_payments/${paymentId}`
    );

    return response.data;
  } catch (error) {
    console.error("DELETE ERROR:", error.response?.data || error.message);
    throw new Error("Failed to delete payment");
  }
}