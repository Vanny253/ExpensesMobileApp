import axios from "axios";

import API_URL from "../../api/config";
import {
  addRegularPayment,
  getRegularPayments,
  updateRegularPayment,
  deleteRegularPayment,
} from "../../api/regularPaymentApi";

jest.mock("axios");

describe("regularPaymentApi", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("addRegularPayment", () => {
    it("posts regular payment data and returns response data on success", async () => {
      const payload = {
        user_id: 1,
        title: "Netflix",
        type: "expense",
        category: "entertainment",
        frequency: "Monthly",
        start_date: "2026-04-24",
        amount: 45,
      };
      const mockedData = { message: "Regular payment created", payment_id: 1 };

      axios.post.mockResolvedValue({ data: mockedData });

      const result = await addRegularPayment(payload);

      expect(axios.post).toHaveBeenCalledWith(
        `${API_URL}/regular_payments`,
        payload
      );
      expect(result).toEqual(mockedData);
    });

    it("throws backend message when add regular payment fails with response data", async () => {
      const payload = {
        user_id: 1,
        title: "Netflix",
        type: "expense",
        category: "entertainment",
        frequency: "Monthly",
        start_date: "2026-04-24",
        amount: 45,
      };
      const error = {
        message: "Request failed",
        response: { data: { message: "Missing required fields" } },
      };

      axios.post.mockRejectedValue(error);

      await expect(addRegularPayment(payload)).rejects.toThrow(
        "Missing required fields"
      );
      expect(console.error).toHaveBeenCalledWith("ADD ERROR:", error.response.data);
    });

    it("falls back to a generic error message when backend message is missing", async () => {
      const payload = {
        user_id: 1,
        title: "Netflix",
        type: "expense",
        category: "entertainment",
        frequency: "Monthly",
        start_date: "2026-04-24",
        amount: 45,
      };
      const error = new Error("Network down");

      axios.post.mockRejectedValue(error);

      await expect(addRegularPayment(payload)).rejects.toThrow(
        "Failed to add payment"
      );
      expect(console.error).toHaveBeenCalledWith("ADD ERROR:", "Network down");
    });
  });

  describe("getRegularPayments", () => {
    it("gets regular payments and returns response data on success", async () => {
      const mockedData = [{ id: 1, title: "Netflix", amount: 45 }];

      axios.get.mockResolvedValue({ data: mockedData });

      const result = await getRegularPayments(1);

      expect(axios.get).toHaveBeenCalledWith(`${API_URL}/regular_payments/1`);
      expect(result).toEqual(mockedData);
    });

    it("throws a friendly error for invalid user ids before calling axios", async () => {
      await expect(getRegularPayments(null)).rejects.toThrow(
        "Failed to load payments"
      );
      expect(axios.get).not.toHaveBeenCalled();
    });

    it("throws a friendly error when get regular payments fails", async () => {
      const error = new Error("Server down");

      axios.get.mockRejectedValue(error);

      await expect(getRegularPayments(1)).rejects.toThrow(
        "Failed to load payments"
      );
      expect(console.error).toHaveBeenCalledWith("GET ERROR:", "Server down");
    });
  });

  describe("updateRegularPayment", () => {
    it("updates a regular payment and returns response data on success", async () => {
      const payload = { amount: 55, frequency: "Yearly" };
      const mockedData = { message: "Regular payment updated", payment_id: 1 };

      axios.put.mockResolvedValue({ data: mockedData });

      const result = await updateRegularPayment(1, payload);

      expect(axios.put).toHaveBeenCalledWith(
        `${API_URL}/regular_payments/1`,
        payload
      );
      expect(result).toEqual(mockedData);
    });

    it("maps invalid payment ids to the wrapper's generic update error", async () => {
      await expect(updateRegularPayment("abc", { amount: 55 })).rejects.toThrow(
        "Failed to update payment"
      );
      expect(axios.put).not.toHaveBeenCalled();
    });

    it("throws backend message when update fails", async () => {
      const payload = { amount: 55 };
      const error = {
        message: "Request failed",
        response: { data: { message: "Regular payment not found" } },
      };

      axios.put.mockRejectedValue(error);

      await expect(updateRegularPayment(1, payload)).rejects.toThrow(
        "Regular payment not found"
      );
      expect(console.error).toHaveBeenCalledWith("UPDATE ERROR:", error.response.data);
    });
  });

  describe("deleteRegularPayment", () => {
    it("deletes a regular payment and returns response data on success", async () => {
      const mockedData = { message: "Regular payment deleted" };

      axios.delete.mockResolvedValue({ data: mockedData });

      const result = await deleteRegularPayment(1);

      expect(axios.delete).toHaveBeenCalledWith(`${API_URL}/regular_payments/1`);
      expect(result).toEqual(mockedData);
    });

    it("throws a validation error when payment id is invalid", async () => {
      await expect(deleteRegularPayment(undefined)).rejects.toThrow(
        "Failed to delete payment"
      );
      expect(axios.delete).not.toHaveBeenCalled();
    });

    it("throws a friendly error when delete fails", async () => {
      const error = new Error("Delete failed");

      axios.delete.mockRejectedValue(error);

      await expect(deleteRegularPayment(1)).rejects.toThrow(
        "Failed to delete payment"
      );
      expect(console.error).toHaveBeenCalledWith("DELETE ERROR:", "Delete failed");
    });
  });
});
