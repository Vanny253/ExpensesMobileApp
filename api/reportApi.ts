import axios from "axios";

const API_URL = "http://192.168.0.10:5000";
// const API_URL = "http://10.138.179.65:5000"; // For physical device


export interface MonthlyReport {
  expenses: number;
  income: number;
  balance: number;
  budget: number;
  remaining: number;
}

// export async function getMonthlyReport(
//   userId: number
// ): Promise<MonthlyReport> {
//   const res = await axios.get<MonthlyReport>(
//     `${API_URL}/report/${userId}`
//   );
//   return res.data;
// }

export async function getMonthlyReport(
  userId: number,
  month: number,
  year: number
): Promise<MonthlyReport> {
  const res = await axios.get<MonthlyReport>(
    `${API_URL}/report/${userId}?month=${month}&year=${year}`
  );
  return res.data;
}