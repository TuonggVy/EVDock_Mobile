// authApi.js
import api from "./axiosInstance";

export const login = async (email, password) => {
  try {
    const response = await api.post("/auth/signin", {
      email,
      password,
    });
    return response.data; 
  } catch (error) {
    console.error("Login error:", error.response?.data || error.message);
    throw error;
  }
};
