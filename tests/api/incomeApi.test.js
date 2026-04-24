import axios from "axios";

import API_URL from "../../api/config";
import {
  addIncome,
  getIncome,
  updateIncome,
  deleteIncome,
} from "../../api/expenseApi";

jest.mock("axios");

describe("incomeApi (via expenseApi income exports)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("addIncome", () => {
    it("posts income data and returns the axios response on success", async () => {
      const payload = {
        user_id: 3,
        title: "Salary",
        amount: 3500,
        category: "salary",
        date: "2026-04-24",
      };
      const mockedResponse = { data: { message: "Income added" } };

      axios.post.mockResolvedValue(mockedResponse);

      const result = await addIncome(payload);

      expect(axios.post).toHaveBeenCalledWith(`${API_URL}/income`, payload);
      expect(result).toBe(mockedResponse);
    });

    it("supports decimal income amounts", async () => {
      const payload = {
        user_id: 3,
        title: "Freelance",
        amount: 120.75,
        category: "bonus",
        date: "2026-04-24",
      };
      const mockedResponse = { data: { ok: true } };

      axios.post.mockResolvedValue(mockedResponse);

      const result = await addIncome(payload);

      expect(axios.post).toHaveBeenCalledWith(`${API_URL}/income`, payload);
      expect(result).toBe(mockedResponse);
    });

    it("rejects when add income fails", async () => {
      const payload = {
        user_id: 3,
        title: "Salary",
        amount: 3500,
        category: "salary",
        date: "2026-04-24",
      };
      const error = new Error("Add income failed");

      axios.post.mockRejectedValue(error);

      await expect(addIncome(payload)).rejects.toThrow("Add income failed");
      expect(axios.post).toHaveBeenCalledWith(`${API_URL}/income`, payload);
    });
  });

  describe("getIncome", () => {
    it("gets income for a user and returns response data on success", async () => {
      const userId = 3;
      const mockedIncome = [
        { id: 1, title: "Salary", amount: 3500, category: "salary" },
      ];

      axios.get.mockResolvedValue({ data: mockedIncome });

      const result = await getIncome(userId);

      expect(axios.get).toHaveBeenCalledWith(`${API_URL}/income/${userId}`);
      expect(result).toEqual(mockedIncome);
    });

    it("returns an empty list when no income exists", async () => {
      const userId = 3;

      axios.get.mockResolvedValue({ data: [] });

      const result = await getIncome(userId);

      expect(axios.get).toHaveBeenCalledWith(`${API_URL}/income/${userId}`);
      expect(result).toEqual([]);
    });

    it("rejects when get income fails", async () => {
      const userId = 3;
      const error = new Error("Get income failed");

      axios.get.mockRejectedValue(error);

      await expect(getIncome(userId)).rejects.toThrow("Get income failed");
      expect(axios.get).toHaveBeenCalledWith(`${API_URL}/income/${userId}`);
    });
  });

  describe("updateIncome", () => {
    it("updates income and returns the axios response on success", async () => {
      const incomeId = 9;
      const payload = {
        title: "Adjusted salary",
        amount: 3600,
        category: "salary",
      };
      const mockedResponse = { data: { message: "Income updated" } };

      axios.put.mockResolvedValue(mockedResponse);

      const result = await updateIncome(incomeId, payload);

      expect(axios.put).toHaveBeenCalledWith(
        `${API_URL}/income/${incomeId}`,
        payload
      );
      expect(result).toBe(mockedResponse);
    });

    it("supports partial income updates", async () => {
      const incomeId = 9;
      const payload = { amount: 4000 };
      const mockedResponse = { data: { ok: true } };

      axios.put.mockResolvedValue(mockedResponse);

      const result = await updateIncome(incomeId, payload);

      expect(axios.put).toHaveBeenCalledWith(
        `${API_URL}/income/${incomeId}`,
        payload
      );
      expect(result).toBe(mockedResponse);
    });

    it("rejects when update income fails", async () => {
      const incomeId = 9;
      const payload = { amount: 4000 };
      const error = new Error("Update income failed");

      axios.put.mockRejectedValue(error);

      await expect(updateIncome(incomeId, payload)).rejects.toThrow(
        "Update income failed"
      );
      expect(axios.put).toHaveBeenCalledWith(
        `${API_URL}/income/${incomeId}`,
        payload
      );
    });
  });

  describe("deleteIncome", () => {
    it("deletes income and returns the axios response on success", async () => {
      const incomeId = 9;
      const mockedResponse = { data: { message: "Income deleted" } };

      axios.delete.mockResolvedValue(mockedResponse);

      const result = await deleteIncome(incomeId);

      expect(axios.delete).toHaveBeenCalledWith(`${API_URL}/income/${incomeId}`);
      expect(result).toBe(mockedResponse);
    });

    it("passes string ids through unchanged", async () => {
      const incomeId = "9";
      const mockedResponse = { data: { ok: true } };

      axios.delete.mockResolvedValue(mockedResponse);

      const result = await deleteIncome(incomeId);

      expect(axios.delete).toHaveBeenCalledWith(`${API_URL}/income/${incomeId}`);
      expect(result).toBe(mockedResponse);
    });

    it("rejects when delete income fails", async () => {
      const incomeId = 9;
      const error = new Error("Delete income failed");

      axios.delete.mockRejectedValue(error);

      await expect(deleteIncome(incomeId)).rejects.toThrow("Delete income failed");
      expect(axios.delete).toHaveBeenCalledWith(`${API_URL}/income/${incomeId}`);
    });
  });
});
