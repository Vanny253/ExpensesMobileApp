import axios from "axios";

import API_URL from "../../api/config";
import {
  addExpense,
  getExpenses,
  updateExpense,
  deleteExpense,
} from "../../api/expenseApi";

jest.mock("axios");

describe("expenseApi", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("addExpense", () => {
    it("posts expense data and returns the axios response on success", async () => {
      const payload = {
        user_id: 1,
        title: "Lunch",
        amount: 12.5,
        category: "food",
        date: "2026-04-24",
      };
      const mockedResponse = {
        data: {
          message: "Expense added",
          expense: { id: 10, ...payload },
        },
      };

      axios.post.mockResolvedValue(mockedResponse);

      const result = await addExpense(payload);

      expect(axios.post).toHaveBeenCalledWith(`${API_URL}/expense`, payload);
      expect(result).toBe(mockedResponse);
    });

    it("allows zero amount values to pass through to the API unchanged", async () => {
      const payload = {
        user_id: 1,
        title: "Free sample",
        amount: 0,
        category: "shopping",
        date: "2026-04-24",
      };
      const mockedResponse = { data: { ok: true } };

      axios.post.mockResolvedValue(mockedResponse);

      const result = await addExpense(payload);

      expect(axios.post).toHaveBeenCalledWith(`${API_URL}/expense`, payload);
      expect(result).toBe(mockedResponse);
    });

    it("rejects when the request fails", async () => {
      const payload = {
        user_id: 1,
        title: "Lunch",
        amount: 12.5,
        category: "food",
        date: "2026-04-24",
      };
      const error = new Error("Network Error");

      axios.post.mockRejectedValue(error);

      await expect(addExpense(payload)).rejects.toThrow("Network Error");
      expect(axios.post).toHaveBeenCalledWith(`${API_URL}/expense`, payload);
    });
  });

  describe("getExpenses", () => {
    it("gets expenses for a user and returns response data on success", async () => {
      const userId = 7;
      const mockedExpenses = [
        { id: 1, title: "Lunch", amount: 12.5, category: "food" },
        { id: 2, title: "Bus", amount: 3.2, category: "transport" },
      ];

      axios.get.mockResolvedValue({ data: mockedExpenses });

      const result = await getExpenses(userId);

      expect(axios.get).toHaveBeenCalledWith(`${API_URL}/expense/${userId}`);
      expect(result).toEqual(mockedExpenses);
    });

    it("returns an empty list when the backend returns no expenses", async () => {
      const userId = 7;

      axios.get.mockResolvedValue({ data: [] });

      const result = await getExpenses(userId);

      expect(axios.get).toHaveBeenCalledWith(`${API_URL}/expense/${userId}`);
      expect(result).toEqual([]);
    });

    it("rejects when fetching expenses fails", async () => {
      const userId = 7;
      const error = new Error("Request failed");

      axios.get.mockRejectedValue(error);

      await expect(getExpenses(userId)).rejects.toThrow("Request failed");
      expect(axios.get).toHaveBeenCalledWith(`${API_URL}/expense/${userId}`);
    });
  });

  describe("updateExpense", () => {
    it("updates an expense and returns the axios response on success", async () => {
      const expenseId = 15;
      const payload = {
        title: "Updated lunch",
        amount: 18.9,
        category: "food",
        date: "2026-04-25",
      };
      const mockedResponse = {
        data: { message: "Expense updated", expense_id: expenseId },
      };

      axios.put.mockResolvedValue(mockedResponse);

      const result = await updateExpense(expenseId, payload);

      expect(axios.put).toHaveBeenCalledWith(
        `${API_URL}/expense/${expenseId}`,
        payload
      );
      expect(result).toBe(mockedResponse);
    });

    it("allows partial update payloads", async () => {
      const expenseId = 15;
      const payload = { amount: 20.0 };
      const mockedResponse = { data: { ok: true } };

      axios.put.mockResolvedValue(mockedResponse);

      const result = await updateExpense(expenseId, payload);

      expect(axios.put).toHaveBeenCalledWith(
        `${API_URL}/expense/${expenseId}`,
        payload
      );
      expect(result).toBe(mockedResponse);
    });

    it("rejects when updating an expense fails", async () => {
      const expenseId = 15;
      const payload = {
        title: "Updated lunch",
        amount: 18.9,
      };
      const error = new Error("Update failed");

      axios.put.mockRejectedValue(error);

      await expect(updateExpense(expenseId, payload)).rejects.toThrow(
        "Update failed"
      );
      expect(axios.put).toHaveBeenCalledWith(
        `${API_URL}/expense/${expenseId}`,
        payload
      );
    });
  });

  describe("deleteExpense", () => {
    it("deletes an expense and returns the axios response on success", async () => {
      const expenseId = 22;
      const mockedResponse = {
        data: { message: "Expense deleted" },
      };

      axios.delete.mockResolvedValue(mockedResponse);

      const result = await deleteExpense(expenseId);

      expect(axios.delete).toHaveBeenCalledWith(`${API_URL}/expense/${expenseId}`);
      expect(result).toBe(mockedResponse);
    });

    it("passes string ids through unchanged for delete requests", async () => {
      const expenseId = "22";
      const mockedResponse = { data: { ok: true } };

      axios.delete.mockResolvedValue(mockedResponse);

      const result = await deleteExpense(expenseId);

      expect(axios.delete).toHaveBeenCalledWith(`${API_URL}/expense/${expenseId}`);
      expect(result).toBe(mockedResponse);
    });

    it("rejects when deleting an expense fails", async () => {
      const expenseId = 22;
      const error = new Error("Delete failed");

      axios.delete.mockRejectedValue(error);

      await expect(deleteExpense(expenseId)).rejects.toThrow("Delete failed");
      expect(axios.delete).toHaveBeenCalledWith(`${API_URL}/expense/${expenseId}`);
    });
  });
});
