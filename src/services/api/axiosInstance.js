import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const api = axios.create({
  baseURL: "https://evm-project.onrender.com", 
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem("token");
      console.log('Token from storage:', token ? 'Present' : 'Missing');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('Added Authorization header to request');
      } else {
        console.log('No token found, request will be sent without auth');
      }
    } catch (error) {
      console.error("Error getting token from storage:", error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    console.log('Response error:', error.response?.status, error.response?.statusText);
    
    // If token expired (401) and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log('401 error detected, attempting token refresh...');
      originalRequest._retry = true;
      
      try {
        const refreshToken = await AsyncStorage.getItem("refreshToken");
        console.log('Refresh token from storage:', refreshToken ? 'Present' : 'Missing');
        
        if (refreshToken) {
          // Try to refresh the token
          const response = await axios.get(`${api.defaults.baseURL}/auth/token`, {
            headers: {
              Authorization: `Bearer ${refreshToken}`
            }
          });
          
          const newAccessToken = response.data.accessToken;
          await AsyncStorage.setItem("token", newAccessToken);
          console.log('Token refreshed successfully');
          
          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } else {
          console.log('No refresh token found, clearing tokens');
          // Clear tokens and redirect to login
          await AsyncStorage.multiRemove(["token", "refreshToken", "user"]);
        }
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        // Clear tokens and redirect to login
        await AsyncStorage.multiRemove(["token", "refreshToken", "user"]);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
