// app/api/reminderApi.js
import axios from "axios";

import API_URL from "./config";

// ---------------- FUNCTIONS ----------------

// Add a reminder
export async function addReminder(data) {
  return axios.post(`${API_URL}/add_reminder`, data);
}

// Get all reminders for a user
export async function getReminders(userId) {
  const response = await axios.get(
    `${API_URL}/reminders/${userId}`
  );
  return response.data;
}

// Update a reminder by ID
export async function updateReminder(reminderId, data) {
  return axios.put(
    `${API_URL}/reminders/${reminderId}`,
    data
  );
}

// Delete a reminder by ID
export async function deleteReminder(reminderId) {
  return axios.delete(
    `${API_URL}/reminders/${reminderId}`
  );
}