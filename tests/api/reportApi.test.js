import axios from "axios";

import API_URL from "../../api/config";
import {
  getMonthlyReport,
  getMonthlyBudgets,
} from "../../api/reportApi";

jest.mock("axios");

describe("reportApi", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("getMonthlyReport", () => {
    it("gets monthly report with explicit month/year and returns response data", async () => {
      const mockedData = { expenses: 500, income: 1000, balance: 500 };

      axios.get.mockResolvedValue({ data: mockedData });

      const result = await getMonthlyReport(1, 4, 2026);

      expect(axios.get).toHaveBeenCalledWith(`${API_URL}/report/monthly/1`, {
        params: { month: 4, year: 2026 },
      });
      expect(result).toEqual(mockedData);
    });

    it("uses the current month/year when values are omitted", async () => {
      const mockedData = { expenses: 200, income: 500, balance: 300 };

      jest.useFakeTimers().setSystemTime(new Date("2026-04-24T12:00:00Z"));
      axios.get.mockResolvedValue({ data: mockedData });

      const result = await getMonthlyReport(1);

      expect(axios.get).toHaveBeenCalledWith(`${API_URL}/report/monthly/1`, {
        params: { month: 4, year: 2026 },
      });
      expect(result).toEqual(mockedData);

      jest.useRealTimers();
    });

    it("logs and rethrows the original error when get monthly report fails", async () => {
      const error = new Error("Report failed");

      axios.get.mockRejectedValue(error);

      await expect(getMonthlyReport(1, 4, 2026)).rejects.toThrow("Report failed");
      expect(console.error).toHaveBeenCalledWith("getMonthlyReport Error:", error);
    });
  });

  describe("getMonthlyBudgets", () => {
    it("gets monthly budgets and returns response data on success", async () => {
      const mockedData = [{ id: 1, category: "food", budget: 500 }];

      axios.get.mockResolvedValue({ data: mockedData });

      const result = await getMonthlyBudgets(1, 4, 2026);

      expect(axios.get).toHaveBeenCalledWith(`${API_URL}/budget/monthly/1`, {
        params: { month: 4, year: 2026 },
      });
      expect(result).toEqual(mockedData);
    });

    it("passes undefined values through unchanged when month/year are omitted", async () => {
      axios.get.mockResolvedValue({ data: [] });

      const result = await getMonthlyBudgets(1);

      expect(axios.get).toHaveBeenCalledWith(`${API_URL}/budget/monthly/1`, {
        params: { month: undefined, year: undefined },
      });
      expect(result).toEqual([]);
    });

    it("logs and rethrows the original error when get monthly budgets fails", async () => {
      const error = new Error("Budget report failed");

      axios.get.mockRejectedValue(error);

      await expect(getMonthlyBudgets(1, 4, 2026)).rejects.toThrow(
        "Budget report failed"
      );
      expect(console.error).toHaveBeenCalledWith("getMonthlyBudgets Error:", error);
    });
  });
});
