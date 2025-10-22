// src/contexts/AuthContext.js
import React, { createContext, useContext, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { login as loginApi } from "../../src/services/api/authApi";
import { USER_ROLES } from "../constants/roles";  

const AuthContext = createContext();
const mapApiRoleToUserRole = (apiRole) => {
  switch (apiRole) {
    case "Admin":
      return USER_ROLES.EVM_ADMIN;
    case "Staff":
      return USER_ROLES.EVM_STAFF;
    case "DealerManager":
      return USER_ROLES.DEALER_MANAGER;
    case "DealerStaff":
      return USER_ROLES.DEALER_STAFF;
    default:
      return USER_ROLES.DEALER_STAFF; // fallback
  }
};


export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const clearError = () => setError(null);

  const login = async (email, password) => {
  setIsLoading(true);
  setError(null);
  try {
    const res = await loginApi(email, password);
    console.log("Login response:", res);

    const token = res.data?.accessToken;
    const apiRole = res.data?.role?.[0];
    const mappedRole = mapApiRoleToUserRole(apiRole);
    const userId = res.data?.userId;

    // Lưu token
    if (token) {
      setToken(token);
      await AsyncStorage.setItem("token", token);
    }

    // Lưu user info
    const userData = { id: userId, role: mappedRole };
    setUser(userData);
    await AsyncStorage.setItem("user", JSON.stringify(userData));

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
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        error,
        login,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
