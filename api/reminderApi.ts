// app/api/reminderApi.ts
import axios from "axios";

const API_URL = "http://192.168.0.10:5000";
// const API_URL = "http://10.138.179.65:5000"; // For physical device


// ---------------- TYPES ----------------
export interface Reminder {
  reminder_id: number;
  user_id: number;
  name: string;
  frequency: "once" | "daily" | "weekly" | "monthly";
  start_date: string; // 'YYYY-MM-DD'
  time: string;       // 'HH:mm:ss'
  note?: string;
}

export interface AddReminderData {
  user_id: number;
  name: string;
  frequency: "once" | "daily" | "weekly" | "monthly";
  start_date: string;
  time: string;
  note?: string;
}

export interface UpdateReminderData {
  name?: string;
  frequency?: "once" | "daily" | "weekly" | "monthly";
  start_date?: string;
  time?: string;
  note?: string;
}

// ---------------- FUNCTIONS ----------------

// Add a reminder
export async function addReminder(data: AddReminderData) {
  return axios.post(`${API_URL}/add_reminder`, data);
}

// Get all reminders for a user
export async function getReminders(userId: number): Promise<Reminder[]> {
  const response = await axios.get<Reminder[]>(`${API_URL}/reminders/${userId}`);
  return response.data;
}

// Update a reminder by ID
export async function updateReminder(reminderId: number, data: UpdateReminderData) {
  return axios.put(`${API_URL}/reminders/${reminderId}`, data);
}

// Delete a reminder by ID
export async function deleteReminder(reminderId: number) {
  return axios.delete(`${API_URL}/reminders/${reminderId}`);
}