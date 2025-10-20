// API Configuration Example
// Copy this file to apiConfig.js and update with your actual values

export const API_CONFIG_EXAMPLE = {
  // Base URL for your API
  BASE_URL: process.env.REACT_NATIVE_API_URL || 'https://api.evdock.com',
  
  // API Endpoints
  ENDPOINTS: {
    VEHICLE_IMAGE_BY_COLOR: '/api/vehicles/{vehicleId}/images/{color}',
    VEHICLE_COLORS: '/api/vehicles/{vehicleId}/colors',
    VEHICLE_IMAGES: '/api/vehicles/{vehicleId}/images',
  },
  
  // Request Configuration
  TIMEOUT: 10000, // 10 seconds
  RETRY_ATTEMPTS: 3,
  
  // Authentication
  AUTH: {
    HEADER_NAME: 'Authorization',
    TOKEN_PREFIX: 'Bearer ',
    // Implement getToken function based on your auth system
    getToken: () => {
      // Example implementations:
      
      // 1. AsyncStorage (React Native)
      // import AsyncStorage from '@react-native-async-storage/async-storage';
      // return AsyncStorage.getItem('auth_token');
      
      // 2. SecureStore (Expo)
      // import * as SecureStore from 'expo-secure-store';
      // return SecureStore.getItemAsync('auth_token');
      
      // 3. Redux store
      // import store from '../store';
      // return store.getState().auth.token;
      
      // 4. Context API
      // import { useContext } from 'react';
      // import { AuthContext } from '../contexts/AuthContext';
      // const { token } = useContext(AuthContext);
      // return token;
      
      return null; // Implement based on your auth system
    }
  },
  
  // Headers
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'EVDock-Mobile/1.0.0',
  },
  
  // Environment-specific configurations
  ENVIRONMENTS: {
    development: {
      BASE_URL: 'http://localhost:3001',
      TIMEOUT: 5000,
      RETRY_ATTEMPTS: 1,
    },
    staging: {
      BASE_URL: 'https://staging-api.evdock.com',
      TIMEOUT: 10000,
      RETRY_ATTEMPTS: 2,
    },
    production: {
      BASE_URL: 'https://api.evdock.com',
      TIMEOUT: 15000,
      RETRY_ATTEMPTS: 3,
    }
  },
  
  // Feature Flags
  FEATURES: {
    ENABLE_IMAGE_CACHING: true,
    ENABLE_OFFLINE_MODE: true,
    ENABLE_IMAGE_PRELOADING: true,
    ENABLE_ANALYTICS: false, // Set to true in production
  },
  
  // Image Configuration
  IMAGES: {
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_FORMATS: ['jpg', 'jpeg', 'png', 'webp'],
    COMPRESSION_QUALITY: 0.8,
    THUMBNAIL_SIZE: 300,
  }
};

// Usage example:
// import { setApiConfig } from './vehicleImageService';
// import { API_CONFIG_EXAMPLE } from './config/apiConfig.example';
// 
// setApiConfig(API_CONFIG_EXAMPLE);
