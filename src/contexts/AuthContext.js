// src/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { login as loginApi, logout as logoutApi, refreshToken as refreshTokenApi } from "../../src/services/api/authApi";
import { USER_ROLES } from "../constants/roles";  

const AuthContext = createContext();
const mapApiRoleToUserRole = (apiRole) => {
  switch (apiRole) {
    case "Admin":
      return USER_ROLES.EVM_ADMIN;
    case "Evm Staff":
    case "Staff":
      return USER_ROLES.EVM_STAFF;
    case "Dealer Manager":
    case "DealerManager":
      return USER_ROLES.DEALER_MANAGER;
    case "Dealer Staff":
    case "DealerStaff":
      return USER_ROLES.DEALER_STAFF;
    default:
      return USER_ROLES.DEALER_STAFF; // fallback
  }
};


export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const clearError = () => setError(null);

  // Check for existing auth data on app start
  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const [storedToken, storedRefreshToken, storedUser, storedAgencyId] = await AsyncStorage.multiGet([
        "token",
        "refreshToken", 
        "user",
        "agencyId"
      ]);
      
      // Set token if available
      if (storedToken[1]) {
        setToken(storedToken[1]);
      }
      
      // Set refresh token if available
      if (storedRefreshToken[1]) {
        setRefreshToken(storedRefreshToken[1]);
      }
      
      // Set user if available
      if (storedUser[1]) {
        const userData = JSON.parse(storedUser[1]);
        // Restore agencyId from AsyncStorage if not in userData
        if (!userData.agencyId && storedAgencyId[1]) {
          userData.agencyId = storedAgencyId[1];
        }
        setUser(userData);
      }
      
      console.log('Auth state restored:', {
        hasToken: !!storedToken[1],
        hasRefreshToken: !!storedRefreshToken[1],
        hasUser: !!storedUser[1],
        hasAgencyId: !!storedAgencyId[1]
      });
    } catch (error) {
      console.error("Error checking auth state:", error);
    }
  };

  const login = async (email, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await loginApi(email, password);
      console.log("=== LOGIN RESPONSE ===");
      console.log("Full response:", JSON.stringify(res, null, 2));
      console.log("res?.agencyId:", res?.agencyId);
      console.log("res?.data?.agencyId:", res?.data?.agencyId);
      console.log("res keys:", Object.keys(res || {}));

      // Try to extract from both possible structures: res.data or res directly
      const accessToken = res?.data?.accessToken || res?.accessToken;
      const refreshTokenValue = res?.data?.refreshToken || res?.refreshToken;
      const apiRole = (res?.data?.role || res?.role)?.[0];
      const mappedRole = mapApiRoleToUserRole(apiRole);
      const userId = res?.data?.userId || res?.userId;
      const agencyId = res?.data?.agencyId || res?.agencyId;

      console.log("Login response:", res);
      console.log("Extracted values:", {
        accessToken: !!accessToken,
        refreshToken: !!refreshTokenValue,
        userId,
        agencyId,
        role: apiRole
      });

      // Lưu tokens
      if (accessToken) {
        setToken(accessToken);
        await AsyncStorage.setItem("token", accessToken);
      }
      
      if (refreshTokenValue) {
        setRefreshToken(refreshTokenValue);
        await AsyncStorage.setItem("refreshToken", refreshTokenValue);
      }

      // Lưu agencyId nếu có (cho Dealer Manager)
      if (agencyId) {
        await AsyncStorage.setItem("agencyId", agencyId.toString());
        console.log("Saved agencyId to AsyncStorage:", agencyId);
      } else {
        console.warn("No agencyId in login response");
      }

      // Lưu user info
      const userData = { id: userId, role: mappedRole, agencyId: agencyId };
      console.log("User data to save:", userData);
      setUser(userData);
      await AsyncStorage.setItem("user", JSON.stringify(userData));
      console.log("User data saved to AsyncStorage");

      return { success: true, data: userData };
    } catch (err) {
      console.error("Login failed:", err.response?.data || err.message);
      const message =
        err.response?.data?.message || "Đăng nhập thất bại, vui lòng thử lại!";
      setError(message);
      return { success: false, message };
    } finally {
      setIsLoading(false);
    }
  };


  const logout = async () => {
    try {
      // Call logout API (token is added automatically by axios interceptor)
      await logoutApi();
    } catch (error) {
      console.error("Logout API error:", error);
      // Continue with local logout even if API call fails
    } finally {
      // Clear local storage and state
      await AsyncStorage.multiRemove(["token", "refreshToken", "user", "agencyId"]);
      setUser(null);
      setToken(null);
      setRefreshToken(null);
    }
  };

  // Manual token refresh function
  const refreshAccessToken = async () => {
    try {
      if (!refreshToken) {
        throw new Error("No refresh token available");
      }
      
      const response = await refreshTokenApi(refreshToken);
      const newAccessToken = response.data?.accessToken;
      
      if (newAccessToken) {
        setToken(newAccessToken);
        await AsyncStorage.setItem("token", newAccessToken);
        return newAccessToken;
      }
      
      throw new Error("No access token in refresh response");
    } catch (error) {
      console.error("Token refresh failed:", error);
      // If refresh fails, logout user
      await logout();
      throw error;
    }
  };

  // Calculate isAuthenticated based on user and token
  const isAuthenticated = !!(user && token);
  
  // Debug log
  console.log('AuthContext - isAuthenticated:', isAuthenticated, 'user:', user, 'token:', !!token);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        refreshToken,
        isLoading,
        error,
        isAuthenticated,
        login,
        logout,
        refreshAccessToken,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
