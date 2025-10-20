// Vehicle Image Service - For handling vehicle images by color
// This service will be used to integrate with backend for color-specific images

import { vehicleService } from './vehicleService';
import { IMAGES } from '../constants/images';

// Configuration for backend integration
const API_CONFIG = {
  BASE_URL: process.env.REACT_NATIVE_API_URL || 'https://api.evdock.com',
  ENDPOINTS: {
    VEHICLE_IMAGE_BY_COLOR: '/api/vehicles/{vehicleId}/images/{color}',
    VEHICLE_COLORS: '/api/vehicles/{vehicleId}/colors',
    VEHICLE_IMAGES: '/api/vehicles/{vehicleId}/images',
  },
  TIMEOUT: 10000, // 10 seconds
  RETRY_ATTEMPTS: 3,
  ENABLE_API_CALLS: false, // Set to true when backend is ready
};

// API Response Types (TypeScript-like interfaces for documentation)
/**
 * @typedef {Object} VehicleImageResponse
 * @property {boolean} success - Whether the request was successful
 * @property {Object} data - Image data
 * @property {string} data.image - Image URL or require() object
 * @property {string} data.color - Selected color name
 * @property {string} data.vehicleId - Vehicle ID
 * @property {string} data.imageId - Unique image identifier
 * @property {Object} data.metadata - Additional image metadata
 * @property {string} data.metadata.alt - Alt text for accessibility
 * @property {string} data.metadata.caption - Image caption
 * @property {string} data.metadata.photographer - Photographer credit
 * @property {string} error - Error message if success is false
 */

/**
 * @typedef {Object} VehicleColorResponse
 * @property {boolean} success - Whether the request was successful
 * @property {Array} data - Array of color objects
 * @property {string} data[].name - Color name
 * @property {string} data[].image - Image URL or require() object
 * @property {string} data[].hex - Hex color code
 * @property {boolean} data[].available - Whether color is available
 * @property {string} data[].imageId - Unique image identifier
 * @property {Object} data[].metadata - Additional metadata
 * @property {string} error - Error message if success is false
 */

// Utility functions for API integration
/**
 * Build API URL with parameters
 * @param {string} endpoint - Endpoint template
 * @param {Object} params - Parameters to replace
 * @returns {string} - Complete API URL
 */
const buildApiUrl = (endpoint, params = {}) => {
  let url = `${API_CONFIG.BASE_URL}${endpoint}`;
  Object.keys(params).forEach(key => {
    url = url.replace(`{${key}}`, encodeURIComponent(params[key]));
  });
  return url;
};

/**
 * Make HTTP request with retry logic
 * @param {string} url - API URL
 * @param {Object} options - Fetch options
 * @param {number} retryCount - Current retry count
 * @returns {Promise<Object>} - API response
 */
const makeApiRequest = async (url, options = {}, retryCount = 0) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
    
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        // Add authentication headers here when needed
        // 'Authorization': `Bearer ${getAuthToken()}`,
        ...options.headers,
      },
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return { success: true, data };
    
  } catch (error) {
    console.error(`API request failed (attempt ${retryCount + 1}):`, error);
    
    if (retryCount < API_CONFIG.RETRY_ATTEMPTS - 1) {
      // Exponential backoff
      const delay = Math.pow(2, retryCount) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      return makeApiRequest(url, options, retryCount + 1);
    }
    
    return {
      success: false,
      error: error.message || 'Network request failed'
    };
  }
};

/**
 * Get authentication token (implement based on your auth system)
 * @returns {string|null} - Auth token or null
 */
const getAuthToken = () => {
  // TODO: Implement based on your authentication system
  // Example: return AsyncStorage.getItem('auth_token');
  return null;
};

/**
 * Helper function to get image for a specific color (fallback for offline mode)
 * @param {string} color - The color name
 * @returns {Object} - Image object
 */
const getImageForColor = (color) => {
  const colorImageMap = {
    'Black': IMAGES.PRODUCT_1,
    'White': IMAGES.PRODUCT_2,
    'Red': IMAGES.PRODUCT_3,
    'Blue': IMAGES.PRODUCT_4,
    'Green': IMAGES.PRODUCT_5,
    'Yellow': IMAGES.PRODUCT_6,
    'Pink': IMAGES.PRODUCT_1,
    'Silver': IMAGES.PRODUCT_2,
    'Gray': IMAGES.PRODUCT_3,
    'Orange': IMAGES.PRODUCT_4,
    'Purple': IMAGES.PRODUCT_5,
    'Brown': IMAGES.PRODUCT_6,
    'Gold': IMAGES.PRODUCT_1,
    'Navy': IMAGES.PRODUCT_2,
    'Maroon': IMAGES.PRODUCT_3,
    'Teal': IMAGES.PRODUCT_4,
    'Lime': IMAGES.PRODUCT_5,
    'Cyan': IMAGES.PRODUCT_6,
  };
  
  return colorImageMap[color] || IMAGES.PRODUCT_1;
};

/**
 * Get vehicle image by color
 * @param {string} vehicleId - The vehicle ID
 * @param {string} color - The selected color
 * @returns {Promise<VehicleImageResponse>} - Response with image data
 */
export const getVehicleImageByColor = async (vehicleId, color) => {
  try {
    // Check if API calls are enabled
    if (API_CONFIG.ENABLE_API_CALLS) {
      // Try to get image from backend first
      const apiUrl = buildApiUrl(API_CONFIG.ENDPOINTS.VEHICLE_IMAGE_BY_COLOR, {
        vehicleId,
        color: encodeURIComponent(color)
      });
      
      const response = await makeApiRequest(apiUrl, {
        method: 'GET',
      });
      
      if (response.success) {
        return {
          success: true,
          data: {
            image: response.data.image,
            color: response.data.color || color,
            vehicleId: response.data.vehicleId || vehicleId,
            imageId: response.data.imageId,
            metadata: response.data.metadata || {}
          }
        };
      }
      
      // Fallback to local images if API fails
      console.warn('API failed, using fallback images:', response.error);
    } else {
      console.log('API calls disabled, using local images');
    }
    
    // Use local images (either as fallback or primary)
    const selectedImage = getImageForColor(color);
    
    return {
      success: true,
      data: {
        image: selectedImage,
        color: color,
        vehicleId: vehicleId,
        imageId: `local-${vehicleId}-${color}`,
        metadata: {
          alt: `${color} ${vehicleId} vehicle`,
          caption: `Vehicle in ${color} color`,
          photographer: 'EVDock Team'
        }
      }
    };
    
  } catch (error) {
    console.error('Error fetching vehicle image by color:', error);
    
    // Final fallback to local images
    const selectedImage = getImageForColor(color);
    
    return {
      success: true,
      data: {
        image: selectedImage,
        color: color,
        vehicleId: vehicleId,
        imageId: `fallback-${vehicleId}-${color}`,
        metadata: {
          alt: `${color} ${vehicleId} vehicle`,
          caption: `Vehicle in ${color} color (offline)`,
          photographer: 'EVDock Team'
        }
      }
    };
  }
};

/**
 * Get all available colors for a vehicle with their respective images
 * @param {string} vehicleId - The vehicle ID
 * @returns {Promise<VehicleColorResponse>} - Response with colors and images data
 */
export const getVehicleColorsWithImages = async (vehicleId) => {
  try {
    // Check if API calls are enabled
    if (API_CONFIG.ENABLE_API_CALLS) {
      // Try to get colors from backend first
      const apiUrl = buildApiUrl(API_CONFIG.ENDPOINTS.VEHICLE_COLORS, { vehicleId });
      
      const response = await makeApiRequest(apiUrl, {
        method: 'GET',
      });
      
      if (response.success) {
        return {
          success: true,
          data: response.data.map(colorData => ({
            name: colorData.name,
            image: colorData.image,
            hex: colorData.hex || getColorHex(colorData.name),
            available: colorData.available !== false,
            imageId: colorData.imageId,
            metadata: colorData.metadata || {}
          }))
        };
      }
      
      // Fallback to local vehicle data if API fails
      console.warn('API failed, using fallback vehicle data:', response.error);
    } else {
      console.log('API calls disabled, using local vehicle data');
    }
    
    // Use local vehicle data (either as fallback or primary)
    const vehicle = await vehicleService.getVehicleById(vehicleId);
    if (vehicle.success) {
      const colorsWithImages = vehicle.data.colors.map(color => ({
        name: color,
        image: getImageForColor(color),
        hex: getColorHex(color),
        available: true,
        imageId: `local-${vehicleId}-${color}`,
        metadata: {
          alt: `${color} ${vehicleId} vehicle`,
          caption: `Vehicle in ${color} color`,
          photographer: 'EVDock Team'
        }
      }));
      
      return {
        success: true,
        data: colorsWithImages
      };
    }
    
    return {
      success: false,
      error: 'Vehicle not found'
    };
    
  } catch (error) {
    console.error('Error fetching vehicle colors with images:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Helper function to get hex color from color name
 * @param {string} colorName - The color name
 * @returns {string} - Hex color code
 */
const getColorHex = (colorName) => {
  const colorMap = {
    'Black': '#000000',
    'White': '#FFFFFF',
    'Red': '#FF0000',
    'Blue': '#0000FF',
    'Green': '#00FF00',
    'Yellow': '#FFFF00',
    'Pink': '#FFC0CB',
    'Silver': '#C0C0C0',
    'Gray': '#808080',
    'Orange': '#FFA500',
    'Purple': '#800080',
    'Brown': '#A52A2A',
    'Gold': '#FFD700',
    'Navy': '#000080',
    'Maroon': '#800000',
    'Teal': '#008080',
    'Lime': '#00FF00',
    'Cyan': '#00FFFF',
    'Magenta': '#FF00FF',
    'Indigo': '#4B0082',
    'Violet': '#8A2BE2',
    'Crimson': '#DC143C',
    'Coral': '#FF7F50',
    'Turquoise': '#40E0D0',
    'Salmon': '#FA8072',
    'Khaki': '#F0E68C',
    'Lavender': '#E6E6FA',
    'Beige': '#F5F5DC',
    'Ivory': '#FFFFF0',
    'Tan': '#D2B48C',
    'Olive': '#808000',
    'Navy Blue': '#000080',
    'Royal Blue': '#4169E1',
    'Sky Blue': '#87CEEB',
    'Forest Green': '#228B22',
    'Lime Green': '#32CD32',
    'Dark Green': '#006400',
    'Light Blue': '#ADD8E6',
    'Dark Blue': '#00008B',
    'Light Green': '#90EE90',
    'Dark Red': '#8B0000',
    'Light Red': '#FFB6C1',
    'Dark Gray': '#A9A9A9',
    'Light Gray': '#D3D3D3',
  };
  
  return colorMap[colorName] || '#808080'; // Default to gray if color not found
};

/**
 * Preload vehicle images for all colors
 * This can be used to improve performance by preloading images
 * @param {string} vehicleId - The vehicle ID
 * @returns {Promise<Object>} - Response with preloaded images
 */
export const preloadVehicleImages = async (vehicleId) => {
  try {
    const colorsResponse = await getVehicleColorsWithImages(vehicleId);
    if (colorsResponse.success) {
      // Preload all images
      const preloadPromises = colorsResponse.data.map(colorData => {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve({ color: colorData.name, loaded: true });
          img.onerror = () => resolve({ color: colorData.name, loaded: false });
          img.src = colorData.image;
        });
      });
      
      const results = await Promise.all(preloadPromises);
      return {
        success: true,
        data: results
      };
    }
    
    return colorsResponse;
  } catch (error) {
    console.error('Error preloading vehicle images:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get all vehicle images (for gallery view)
 * @param {string} vehicleId - The vehicle ID
 * @returns {Promise<Object>} - Response with all vehicle images
 */
export const getAllVehicleImages = async (vehicleId) => {
  try {
    const apiUrl = buildApiUrl(API_CONFIG.ENDPOINTS.VEHICLE_IMAGES, { vehicleId });
    
    const response = await makeApiRequest(apiUrl, {
      method: 'GET',
    });
    
    if (response.success) {
      return {
        success: true,
        data: response.data
      };
    }
    
    // Fallback to colors with images
    const colorsResponse = await getVehicleColorsWithImages(vehicleId);
    if (colorsResponse.success) {
      return {
        success: true,
        data: colorsResponse.data.map(color => ({
          image: color.image,
          color: color.name,
          imageId: color.imageId,
          metadata: color.metadata
        }))
      };
    }
    
    return colorsResponse;
    
  } catch (error) {
    console.error('Error fetching all vehicle images:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Upload vehicle image (for admin functionality)
 * @param {string} vehicleId - The vehicle ID
 * @param {string} color - The color name
 * @param {FormData} imageData - Image file data
 * @returns {Promise<Object>} - Upload response
 */
export const uploadVehicleImage = async (vehicleId, color, imageData) => {
  try {
    const apiUrl = buildApiUrl(API_CONFIG.ENDPOINTS.VEHICLE_IMAGE_BY_COLOR, {
      vehicleId,
      color: encodeURIComponent(color)
    });
    
    const response = await makeApiRequest(apiUrl, {
      method: 'POST',
      body: imageData,
      headers: {
        // Remove Content-Type to let browser set it for FormData
        'Accept': 'application/json',
      }
    });
    
    return response;
    
  } catch (error) {
    console.error('Error uploading vehicle image:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Delete vehicle image (for admin functionality)
 * @param {string} vehicleId - The vehicle ID
 * @param {string} imageId - The image ID
 * @returns {Promise<Object>} - Delete response
 */
export const deleteVehicleImage = async (vehicleId, imageId) => {
  try {
    const apiUrl = buildApiUrl('/api/vehicles/{vehicleId}/images/{imageId}', {
      vehicleId,
      imageId
    });
    
    const response = await makeApiRequest(apiUrl, {
      method: 'DELETE',
    });
    
    return response;
    
  } catch (error) {
    console.error('Error deleting vehicle image:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get API configuration (for debugging/testing)
 * @returns {Object} - API configuration
 */
export const getApiConfig = () => {
  return { ...API_CONFIG };
};

/**
 * Set API configuration (for testing or different environments)
 * @param {Object} config - New configuration
 */
export const setApiConfig = (config) => {
  Object.assign(API_CONFIG, config);
};

/**
 * Enable API calls (set to true when backend is ready)
 */
export const enableApiCalls = () => {
  API_CONFIG.ENABLE_API_CALLS = true;
  console.log('API calls enabled');
};

/**
 * Disable API calls (use local data only)
 */
export const disableApiCalls = () => {
  API_CONFIG.ENABLE_API_CALLS = false;
  console.log('API calls disabled, using local data');
};

/**
 * Check if API calls are enabled
 * @returns {boolean} - Whether API calls are enabled
 */
export const isApiEnabled = () => {
  return API_CONFIG.ENABLE_API_CALLS;
};

export default {
  getVehicleImageByColor,
  getVehicleColorsWithImages,
  getAllVehicleImages,
  uploadVehicleImage,
  deleteVehicleImage,
  preloadVehicleImages,
  getApiConfig,
  setApiConfig,
  enableApiCalls,
  disableApiCalls,
  isApiEnabled,
};
