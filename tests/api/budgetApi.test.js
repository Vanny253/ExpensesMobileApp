import axios from "axios";

import API_URL from "../../api/config";
import {
  addBudget,
  getBudgets,
  updateBudget,
  deleteBudget,
  setMonthlyBudget,
  getMonthlyBudget,
  updateMonthlyBudget,
} from "../../api/budgetApi";

jest.mock("axios");

describe("budgetApi", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("addBudget", () => {
    it("posts budget data and returns the axios response on success", async () => {
      const payload = {
        user_id: 1,
        category: "food",
        amount: 500,
        month: 4,
        year: 2026,
      };
      const mockedResponse = { data: { message: "Budget created" } };

      axios.post.mockResolvedValue(mockedResponse);

      const result = await addBudget(payload);

      expect(axios.post).toHaveBeenCalledWith(`${API_URL}/budget`, payload);
      expect(result).toBe(mockedResponse);
    });

    it("rejects when add budget fails", async () => {
      const payload = {
        user_id: 1,
        category: "food",
        amount: 500,
        month: 4,
        year: 2026,
      };
      const error = new Error("Add budget failed");

      axios.post.mockRejectedValue(error);

      await expect(addBudget(payload)).rejects.toThrow("Add budget failed");
      expect(axios.post).toHaveBeenCalledWith(`${API_URL}/budget`, payload);
    });
  });

  describe("getBudgets", () => {
    it("gets budgets for a user with month/year params and returns response data", async () => {
      const mockedBudgets = [{ id: 1, category: "food", budget: 500 }];

      axios.get.mockResolvedValue({ data: mockedBudgets });

      const result = await getBudgets(1, 4, 2026);

      expect(axios.get).toHaveBeenCalledWith(`${API_URL}/budget/1`, {
        params: { month: 4, year: 2026 },
      });
      expect(result).toEqual(mockedBudgets);
    });

    it("passes undefined month/year through to the request", async () => {
      axios.get.mockResolvedValue({ data: [] });

      const result = await getBudgets(1);

      expect(axios.get).toHaveBeenCalledWith(`${API_URL}/budget/1`, {
        params: { month: undefined, year: undefined },
      });
      expect(result).toEqual([]);
    });

    it("logs and rethrows the original error when get budgets fails", async () => {
      const error = {
        message: "Request failed",
        response: { data: { message: "Server error" } },
      };

      axios.get.mockRejectedValue(error);

      await expect(getBudgets(1, 4, 2026)).rejects.toBe(error);
      expect(console.error).toHaveBeenCalledWith(
        "Get budgets error:",
        error.response.data
      );
    });
  });

  describe("updateBudget", () => {
    it("updates a budget amount and returns the axios response on success", async () => {
      const mockedResponse = { data: { message: "Budget updated" } };

      axios.put.mockResolvedValue(mockedResponse);

      const result = await updateBudget(5, 650);

      expect(axios.put).toHaveBeenCalledWith(`${API_URL}/budget/5`, {
        amount: 650,
      });
      expect(result).toBe(mockedResponse);
    });

    it("allows zero values to be sent for updates", async () => {
      const mockedResponse = { data: { ok: true } };

      axios.put.mockResolvedValue(mockedResponse);

      const result = await updateBudget(5, 0);

      expect(axios.put).toHaveBeenCalledWith(`${API_URL}/budget/5`, {
        amount: 0,
      });
      expect(result).toBe(mockedResponse);
    });

    it("rejects when update budget fails", async () => {
      const error = new Error("Update budget failed");

      axios.put.mockRejectedValue(error);

      await expect(updateBudget(5, 650)).rejects.toThrow("Update budget failed");
      expect(axios.put).toHaveBeenCalledWith(`${API_URL}/budget/5`, {
        amount: 650,
      });
    });
  });

  describe("deleteBudget", () => {
    it("deletes a budget and returns the axios response on success", async () => {
      const mockedResponse = { data: { message: "Budget deleted" } };

      axios.delete.mockResolvedValue(mockedResponse);

      const result = await deleteBudget(5);

      expect(axios.delete).toHaveBeenCalledWith(`${API_URL}/budget/5`);
      expect(result).toBe(mockedResponse);
    });

    it("rejects when delete budget fails", async () => {
      const error = new Error("Delete budget failed");

      axios.delete.mockRejectedValue(error);

      await expect(deleteBudget(5)).rejects.toThrow("Delete budget failed");
      expect(axios.delete).toHaveBeenCalledWith(`${API_URL}/budget/5`);
    });
  });

  describe("setMonthlyBudget", () => {
    it("posts monthly budget data and returns the axios response on success", async () => {
      const payload = { user_id: 1, amount: 1500, month: 4, year: 2026 };
      const mockedResponse = { data: { message: "Created" } };

      axios.post.mockResolvedValue(mockedResponse);

      const result = await setMonthlyBudget(payload);

      expect(axios.post).toHaveBeenCalledWith(`${API_URL}/monthly-budget`, payload);
      expect(result).toBe(mockedResponse);
    });

    it("rejects when set monthly budget fails", async () => {
      const payload = { user_id: 1, amount: 1500, month: 4, year: 2026 };
      const error = new Error("Set monthly budget failed");

      axios.post.mockRejectedValue(error);

      await expect(setMonthlyBudget(payload)).rejects.toThrow(
        "Set monthly budget failed"
      );
      expect(axios.post).toHaveBeenCalledWith(`${API_URL}/monthly-budget`, payload);
    });
  });

  describe("getMonthlyBudget", () => {
    it("gets monthly budget and returns the raw axios response on success", async () => {
      const mockedResponse = { data: { id: 2, amount: 1500, month: 4, year: 2026 } };

      axios.get.mockResolvedValue(mockedResponse);

      const result = await getMonthlyBudget(1, 4, 2026);

      expect(axios.get).toHaveBeenCalledWith(`${API_URL}/monthly-budget/1`, {
        params: { month: 4, year: 2026 },
      });
      expect(result).toBe(mockedResponse);
    });

    it("passes undefined month/year for default backend handling", async () => {
      const mockedResponse = { data: { amount: 0 } };

      axios.get.mockResolvedValue(mockedResponse);

      const result = await getMonthlyBudget(1);

      expect(axios.get).toHaveBeenCalledWith(`${API_URL}/monthly-budget/1`, {
        params: { month: undefined, year: undefined },
      });
      expect(result).toBe(mockedResponse);
    });

    it("rejects when get monthly budget fails", async () => {
      const error = new Error("Get monthly budget failed");

      axios.get.mockRejectedValue(error);

      await expect(getMonthlyBudget(1, 4, 2026)).rejects.toThrow(
        "Get monthly budget failed"
      );
    });
  });

  describe("updateMonthlyBudget", () => {
    it("updates monthly budget and returns the axios response on success", async () => {
      const mockedResponse = { data: { message: "Updated" } };

      axios.put.mockResolvedValue(mockedResponse);

      const result = await updateMonthlyBudget(2, 1800);

      expect(axios.put).toHaveBeenCalledWith(`${API_URL}/monthly-budget/2`, {
        amount: 1800,
      });
      expect(result).toBe(mockedResponse);
    });

    it("allows zero monthly budget updates", async () => {
      const mockedResponse = { data: { ok: true } };

      axios.put.mockResolvedValue(mockedResponse);

      const result = await updateMonthlyBudget(2, 0);

      expect(axios.put).toHaveBeenCalledWith(`${API_URL}/monthly-budget/2`, {
        amount: 0,
      });
      expect(result).toBe(mockedResponse);
    });

    it("rejects when update monthly budget fails", async () => {
      const error = new Error("Update monthly budget failed");

      axios.put.mockRejectedValue(error);

      await expect(updateMonthlyBudget(2, 1800)).rejects.toThrow(
        "Update monthly budget failed"
      );
    });
  });
});
