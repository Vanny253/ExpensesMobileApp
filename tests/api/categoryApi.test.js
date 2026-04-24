import axios from "axios";

import API_URL from "../../api/config";
import {
  addCategory,
  getCategories,
  deleteCategory,
} from "../../api/categoryApi";

jest.mock("axios");

describe("categoryApi", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("addCategory", () => {
    it("posts category data and returns the axios response on success", async () => {
      const payload = {
        user_id: 1,
        type: "expense",
        name: "Coffee",
        icon: "cafe",
      };
      const mockedResponse = { data: { id: 12, ...payload } };

      axios.post.mockResolvedValue(mockedResponse);

      const result = await addCategory(payload);

      expect(axios.post).toHaveBeenCalledWith(`${API_URL}/categories`, payload);
      expect(result).toBe(mockedResponse);
    });

    it("supports income category payloads", async () => {
      const payload = {
        user_id: 1,
        type: "income",
        name: "Dividend",
        icon: "cash",
      };
      const mockedResponse = { data: { ok: true } };

      axios.post.mockResolvedValue(mockedResponse);

      const result = await addCategory(payload);

      expect(axios.post).toHaveBeenCalledWith(`${API_URL}/categories`, payload);
      expect(result).toBe(mockedResponse);
    });

    it("rejects when add category fails", async () => {
      const payload = {
        user_id: 1,
        type: "expense",
        name: "Coffee",
        icon: "cafe",
      };
      const error = new Error("Add category failed");

      axios.post.mockRejectedValue(error);

      await expect(addCategory(payload)).rejects.toThrow("Add category failed");
      expect(axios.post).toHaveBeenCalledWith(`${API_URL}/categories`, payload);
    });
  });

  describe("getCategories", () => {
    it("gets categories by user and type and returns response data on success", async () => {
      const mockedData = [
        { id: 1, name: "Coffee", type: "expense", icon: "cafe" },
      ];

      axios.get.mockResolvedValue({ data: mockedData });

      const result = await getCategories(1, "expense");

      expect(axios.get).toHaveBeenCalledWith(`${API_URL}/categories/1/expense`);
      expect(result).toEqual(mockedData);
    });

    it("returns an empty array when no categories are found", async () => {
      axios.get.mockResolvedValue({ data: [] });

      const result = await getCategories(1, "income");

      expect(axios.get).toHaveBeenCalledWith(`${API_URL}/categories/1/income`);
      expect(result).toEqual([]);
    });

    it("passes unusual type strings through unchanged", async () => {
      axios.get.mockResolvedValue({ data: [] });

      await getCategories(1, "custom-type");

      expect(axios.get).toHaveBeenCalledWith(
        `${API_URL}/categories/1/custom-type`
      );
    });

    it("rejects when get categories fails", async () => {
      const error = new Error("Get categories failed");

      axios.get.mockRejectedValue(error);

      await expect(getCategories(1, "expense")).rejects.toThrow(
        "Get categories failed"
      );
      expect(axios.get).toHaveBeenCalledWith(`${API_URL}/categories/1/expense`);
    });
  });

  describe("deleteCategory", () => {
    it("deletes a category and returns the axios response on success", async () => {
      const mockedResponse = { data: { message: "Category deleted" } };

      axios.delete.mockResolvedValue(mockedResponse);

      const result = await deleteCategory(5);

      expect(axios.delete).toHaveBeenCalledWith(`${API_URL}/categories/5`);
      expect(result).toBe(mockedResponse);
    });

    it("passes string ids through unchanged", async () => {
      const mockedResponse = { data: { ok: true } };

      axios.delete.mockResolvedValue(mockedResponse);

      const result = await deleteCategory("5");

      expect(axios.delete).toHaveBeenCalledWith(`${API_URL}/categories/5`);
      expect(result).toBe(mockedResponse);
    });

    it("rejects when delete category fails", async () => {
      const error = new Error("Delete category failed");

      axios.delete.mockRejectedValue(error);

      await expect(deleteCategory(5)).rejects.toThrow("Delete category failed");
      expect(axios.delete).toHaveBeenCalledWith(`${API_URL}/categories/5`);
    });
  });
});
