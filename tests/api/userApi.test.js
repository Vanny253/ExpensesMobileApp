import axios from "axios";

import API_URL from "../../api/config";
import {
  signupUser,
  loginUser,
  getUserInfo,
  updateUser,
} from "../../api/userApi";

jest.mock("axios");

describe("userApi", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("signupUser", () => {
    it("posts signup data and returns response data on success", async () => {
      const payload = {
        email: "user@example.com",
        password: "Password123",
        nickname: "user1",
      };
      const mockedData = { message: "Signup successful", user_id: 1 };

      axios.post.mockResolvedValue({ data: mockedData });

      const result = await signupUser(payload);

      expect(axios.post).toHaveBeenCalledWith(`${API_URL}/signup`, payload);
      expect(result).toEqual(mockedData);
    });

    it("throws response data when signup fails with backend validation error", async () => {
      const payload = {
        email: "user@example.com",
        password: "Password123",
        nickname: "user1",
      };
      const errorPayload = { message: "Email already registered" };
      const error = { response: { data: errorPayload } };

      axios.post.mockRejectedValue(error);

      await expect(signupUser(payload)).rejects.toEqual(errorPayload);
      expect(axios.post).toHaveBeenCalledWith(`${API_URL}/signup`, payload);
    });

    it("throws response data when signup fails because required fields are missing", async () => {
      const payload = {
        email: "",
        password: "",
        nickname: "",
      };
      const errorPayload = {
        message: "Email, password, and nickname are required",
      };
      const error = { response: { data: errorPayload } };

      axios.post.mockRejectedValue(error);

      await expect(signupUser(payload)).rejects.toEqual(errorPayload);
      expect(axios.post).toHaveBeenCalledWith(`${API_URL}/signup`, payload);
    });

    it("throws the original error object when response data is missing", async () => {
      const payload = {
        email: "user@example.com",
        password: "Password123",
        nickname: "user1",
      };
      const error = new Error("Network error");

      axios.post.mockRejectedValue(error);

      await expect(signupUser(payload)).rejects.toBe(error);
    });
  });

  describe("loginUser", () => {
    it("posts login data and returns response data on success", async () => {
      const payload = {
        email: "user@example.com",
        password: "Password123",
      };
      const mockedData = { message: "Login successful", user: { user_id: 1 } };

      axios.post.mockResolvedValue({ data: mockedData });

      const result = await loginUser(payload);

      expect(axios.post).toHaveBeenCalledWith(`${API_URL}/login`, payload);
      expect(result).toEqual(mockedData);
    });

    it("throws response data when login fails", async () => {
      const payload = {
        email: "user@example.com",
        password: "wrong",
      };
      const errorPayload = { message: "Invalid email or password" };
      const error = { response: { data: errorPayload } };

      axios.post.mockRejectedValue(error);

      await expect(loginUser(payload)).rejects.toEqual(errorPayload);
      expect(axios.post).toHaveBeenCalledWith(`${API_URL}/login`, payload);
    });

    it("throws response data when login fails with invalid credentials", async () => {
      const payload = {
        email: "user@example.com",
        password: "InvalidPassword123",
      };
      const errorPayload = { message: "Invalid email or password" };
      const error = { response: { data: errorPayload } };

      axios.post.mockRejectedValue(error);

      await expect(loginUser(payload)).rejects.toEqual(errorPayload);
      expect(axios.post).toHaveBeenCalledWith(`${API_URL}/login`, payload);
    });

    it("throws response data when login fails because fields are missing", async () => {
      const payload = {
        email: "",
        password: "",
      };
      const errorPayload = { message: "Email and password are required" };
      const error = { response: { data: errorPayload } };

      axios.post.mockRejectedValue(error);

      await expect(loginUser(payload)).rejects.toEqual(errorPayload);
      expect(axios.post).toHaveBeenCalledWith(`${API_URL}/login`, payload);
    });

    it("throws the original error object when login response data is missing", async () => {
      const payload = {
        email: "user@example.com",
        password: "wrong",
      };
      const error = new Error("Timeout");

      axios.post.mockRejectedValue(error);

      await expect(loginUser(payload)).rejects.toBe(error);
    });
  });

  describe("getUserInfo", () => {
    it("gets user info and returns response data on success", async () => {
      const mockedData = {
        user_id: 1,
        email: "user@example.com",
        nickname: "user1",
      };

      axios.get.mockResolvedValue({ data: mockedData });

      const result = await getUserInfo(1);

      expect(axios.get).toHaveBeenCalledWith(`${API_URL}/user/1`);
      expect(result).toEqual(mockedData);
    });

    it("throws response data when get user info fails", async () => {
      const errorPayload = { message: "User not found" };
      const error = { response: { data: errorPayload } };

      axios.get.mockRejectedValue(error);

      await expect(getUserInfo(999)).rejects.toEqual(errorPayload);
      expect(axios.get).toHaveBeenCalledWith(`${API_URL}/user/999`);
    });

    it("throws the original error object when backend payload is missing", async () => {
      const error = new Error("Connection lost");

      axios.get.mockRejectedValue(error);

      await expect(getUserInfo(1)).rejects.toBe(error);
    });
  });

  describe("updateUser", () => {
    it("puts multipart form data and returns response data on success", async () => {
      const payload = { nickname: "updatedUser", phone_number: "0123456789" };
      const mockedData = { user_id: 1, nickname: "updatedUser" };

      axios.put.mockResolvedValue({ data: mockedData });

      const result = await updateUser(1, payload);

      expect(axios.put).toHaveBeenCalledWith(`${API_URL}/user/1`, payload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      expect(result).toEqual(mockedData);
    });

    it("supports FormData payload objects unchanged", async () => {
      const formData = {
        append: jest.fn(),
        _parts: [["nickname", "updatedUser"]],
      };
      const mockedData = { user_id: 1, nickname: "updatedUser" };

      axios.put.mockResolvedValue({ data: mockedData });

      const result = await updateUser(1, formData);

      expect(axios.put).toHaveBeenCalledWith(`${API_URL}/user/1`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      expect(result).toEqual(mockedData);
    });

    it("rejects when update user fails", async () => {
      const payload = { nickname: "updatedUser" };
      const error = new Error("Update user failed");

      axios.put.mockRejectedValue(error);

      await expect(updateUser(1, payload)).rejects.toThrow("Update user failed");
      expect(axios.put).toHaveBeenCalledWith(`${API_URL}/user/1`, payload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    });
  });
});
