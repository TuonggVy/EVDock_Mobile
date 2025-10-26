// authApi.js
import api from "./axiosInstance";

/**
 * Login user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} Login response with accessToken, refreshToken, role, userId
 */
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

/**
 * Get new access token when current token is invalid
 * @param {string} refreshToken - Refresh token
 * @returns {Promise<Object>} New access token
 */
export const refreshToken = async (refreshToken) => {
  try {
    const response = await api.get("/auth/token", {
      headers: {
        Authorization: `Bearer ${refreshToken}`
      }
    });
    return response.data;
  } catch (error) {
    console.error("Token refresh error:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * Logout user account
 * @param {string} accessToken - Current access token (optional, handled by interceptor)
 * @returns {Promise<Object>} Logout response
 */
export const logout = async () => {
  try {
    const response = await api.post("/auth/logout");
    return response.data;
  } catch (error) {
    console.error("Logout error:", error.response?.data || error.message);
    throw error;
  }
};
