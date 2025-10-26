import axiosInstance from './api/axiosInstance';
import { Platform } from 'react-native';

const API_BASE_URL = '';

class MotorbikeService {
  // Motorbike CRUD operations
  async createMotorbike(motorbikeData) {
    try {
      const response = await axiosInstance.post(`${API_BASE_URL}/motorbike`, motorbikeData);
      return {
        success: true,
        data: response.data,
        message: 'Motorbike created successfully'
      };
    } catch (error) {
      console.error('Error creating motorbike:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to create motorbike',
        message: 'Failed to create motorbike'
      };
    }
  }

  async getAllMotorbikes(filters = {}) {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      
      // Only add parameters if they have valid values
      if (filters.limit && filters.limit > 0) {
        params.append('limit', filters.limit);
      }
      if (filters.page && filters.page > 0) {
        params.append('page', filters.page);
      }
      if (filters.model && filters.model.trim() && filters.model !== 'all') {
        params.append('model', filters.model.trim());
      }
      if (filters.makeFrom && filters.makeFrom.trim() && filters.makeFrom !== 'all') {
        params.append('makeFrom', filters.makeFrom.trim());
      }
      
      // Build URL with query parameters
      const url = `${API_BASE_URL}/motorbike${params.toString() ? `?${params.toString()}` : ''}`;
      console.log('API URL:', url);
      
      const response = await axiosInstance.get(url);
      return {
        success: true,
        data: response.data.data || response.data, // Handle both response formats
        pagination: response.data.paginationInfo || response.data.pagination,
        message: 'Motorbikes retrieved successfully'
      };
    } catch (error) {
      console.error('Error fetching motorbikes:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch motorbikes',
        message: 'Failed to fetch motorbikes'
      };
    }
  }

  async getMotorbikeById(id) {
    try {
      const response = await axiosInstance.get(`${API_BASE_URL}/motorbike/${id}`);
      return {
        success: true,
        data: response.data,
        message: 'Motorbike details retrieved successfully'
      };
    } catch (error) {
      console.error('Error fetching motorbike details:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch motorbike details',
        message: 'Failed to fetch motorbike details'
      };
    }
  }

  async updateMotorbike(id, motorbikeData) {
    try {
      const response = await axiosInstance.patch(`${API_BASE_URL}/motorbike/${id}`, motorbikeData);
      return {
        success: true,
        data: response.data,
        message: 'Motorbike updated successfully'
      };
    } catch (error) {
      console.error('Error updating motorbike:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update motorbike',
        message: 'Failed to update motorbike'
      };
    }
  }

  async deleteMotorbike(id) {
    try {
      const response = await axiosInstance.delete(`${API_BASE_URL}/motorbike/${id}`);
      return {
        success: true,
        data: response.data,
        message: 'Motorbike deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting motorbike:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to delete motorbike',
        message: 'Failed to delete motorbike'
      };
    }
  }

  async getMotorbikeFilters() {
    try {
      const response = await axiosInstance.get(`${API_BASE_URL}/motorbike/filters`);
      console.log('Raw API response:', response.data);
      
      // Handle the response structure: response.data.data contains the actual data
      const responseData = response.data.data || response.data;
      
      return {
        success: true,
        data: responseData,
        message: 'Filters retrieved successfully'
      };
    } catch (error) {
      console.error('Error fetching filters:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch filters',
        message: 'Failed to fetch filters'
      };
    }
  }

  // Appearance operations
  async createAppearance(vehicleId, appearanceData) {
    try {
      const response = await axiosInstance.post(`${API_BASE_URL}/appearance/${vehicleId}`, appearanceData);
      return {
        success: true,
        data: response.data.data || response.data,
        message: 'Appearance created successfully'
      };
    } catch (error) {
      console.error('Error creating appearance:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to create appearance',
        message: 'Failed to create appearance'
      };
    }
  }

  async getAppearance(vehicleId) {
    try {
      const response = await axiosInstance.get(`${API_BASE_URL}/appearance/${vehicleId}`);
      return {
        success: true,
        data: response.data.data || response.data,
        message: 'Appearance retrieved successfully'
      };
    } catch (error) {
      console.error('Error fetching appearance:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch appearance',
        message: 'Failed to fetch appearance'
      };
    }
  }

  async updateAppearance(vehicleId, appearanceData) {
    try {
      const response = await axiosInstance.patch(`${API_BASE_URL}/appearance/${vehicleId}`, appearanceData);
      return {
        success: true,
        data: response.data,
        message: 'Appearance updated successfully'
      };
    } catch (error) {
      console.error('Error updating appearance:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update appearance',
        message: 'Failed to update appearance'
      };
    }
  }

  async deleteAppearance(vehicleId) {
    try {
      const response = await axiosInstance.delete(`${API_BASE_URL}/appearance/${vehicleId}`);
      return {
        success: true,
        data: response.data,
        message: 'Appearance deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting appearance:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to delete appearance',
        message: 'Failed to delete appearance'
      };
    }
  }

  // Configuration operations
  async createConfiguration(vehicleId, configData) {
    try {
      const response = await axiosInstance.post(`${API_BASE_URL}/configuration/${vehicleId}`, configData);
      return {
        success: true,
        data: response.data.data || response.data,
        message: 'Configuration created successfully'
      };
    } catch (error) {
      console.error('Error creating configuration:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to create configuration',
        message: 'Failed to create configuration'
      };
    }
  }

  async getConfiguration(vehicleId) {
    try {
      const response = await axiosInstance.get(`${API_BASE_URL}/configuration/${vehicleId}`);
      return {
        success: true,
        data: response.data.data || response.data,
        message: 'Configuration retrieved successfully'
      };
    } catch (error) {
      console.error('Error fetching configuration:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch configuration',
        message: 'Failed to fetch configuration'
      };
    }
  }

  async updateConfiguration(vehicleId, configData) {
    try {
      const response = await axiosInstance.patch(`${API_BASE_URL}/configuration/${vehicleId}`, configData);
      return {
        success: true,
        data: response.data,
        message: 'Configuration updated successfully'
      };
    } catch (error) {
      console.error('Error updating configuration:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update configuration',
        message: 'Failed to update configuration'
      };
    }
  }

  async deleteConfiguration(vehicleId) {
    try {
      const response = await axiosInstance.delete(`${API_BASE_URL}/configuration/${vehicleId}`);
      return {
        success: true,
        data: response.data,
        message: 'Configuration deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting configuration:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to delete configuration',
        message: 'Failed to delete configuration'
      };
    }
  }

  // Battery operations
  async createBattery(vehicleId, batteryData) {
    try {
      const response = await axiosInstance.post(`${API_BASE_URL}/battery/${vehicleId}`, batteryData);
      return {
        success: true,
        data: response.data.data || response.data,
        message: 'Battery created successfully'
      };
    } catch (error) {
      console.error('Error creating battery:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to create battery',
        message: 'Failed to create battery'
      };
    }
  }

  async getBattery(vehicleId) {
    try {
      const response = await axiosInstance.get(`${API_BASE_URL}/battery/${vehicleId}`);
      return {
        success: true,
        data: response.data.data || response.data,
        message: 'Battery details retrieved successfully'
      };
    } catch (error) {
      console.error('Error fetching battery:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch battery',
        message: 'Failed to fetch battery'
      };
    }
  }

  async updateBattery(vehicleId, batteryData) {
    try {
      const response = await axiosInstance.patch(`${API_BASE_URL}/battery/${vehicleId}`, batteryData);
      return {
        success: true,
        data: response.data,
        message: 'Battery updated successfully'
      };
    } catch (error) {
      console.error('Error updating battery:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update battery',
        message: 'Failed to update battery'
      };
    }
  }

  async deleteBattery(vehicleId) {
    try {
      const response = await axiosInstance.delete(`${API_BASE_URL}/battery/${vehicleId}`);
      return {
        success: true,
        data: response.data,
        message: 'Battery deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting battery:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to delete battery',
        message: 'Failed to delete battery'
      };
    }
  }

  // Safe Feature operations
  async createSafeFeature(vehicleId, safeFeatureData) {
    try {
      const response = await axiosInstance.post(`${API_BASE_URL}/safe-feature/${vehicleId}`, safeFeatureData);
      return {
        success: true,
        data: response.data.data || response.data,
        message: 'Safe feature created successfully'
      };
    } catch (error) {
      console.error('Error creating safe feature:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to create safe feature',
        message: 'Failed to create safe feature'
      };
    }
  }

  async getSafeFeature(vehicleId) {
    try {
      const response = await axiosInstance.get(`${API_BASE_URL}/safe-feature/${vehicleId}`);
      return {
        success: true,
        data: response.data.data || response.data,
        message: 'Safe feature details retrieved successfully'
      };
    } catch (error) {
      console.error('Error fetching safe feature:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch safe feature',
        message: 'Failed to fetch safe feature'
      };
    }
  }

  async updateSafeFeature(vehicleId, safeFeatureData) {
    try {
      const response = await axiosInstance.patch(`${API_BASE_URL}/safe-feature/${vehicleId}`, safeFeatureData);
      return {
        success: true,
        data: response.data,
        message: 'Safe feature updated successfully'
      };
    } catch (error) {
      console.error('Error updating safe feature:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update safe feature',
        message: 'Failed to update safe feature'
      };
    }
  }

  async deleteSafeFeature(vehicleId) {
    try {
      const response = await axiosInstance.delete(`${API_BASE_URL}/safe-feature/${vehicleId}`);
      return {
        success: true,
        data: response.data,
        message: 'Safe feature deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting safe feature:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to delete safe feature',
        message: 'Failed to delete safe feature'
      };
    }
  }

  // Color operations
  async getAllColors() {
    try {
      const response = await axiosInstance.get(`${API_BASE_URL}/color`);
      return {
        success: true,
        data: response.data.data || response.data,
        message: 'Colors retrieved successfully'
      };
    } catch (error) {
      console.error('Error fetching colors:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch colors',
        message: 'Failed to fetch colors'
      };
    }
  }

  // Image operations
  async uploadMotorbikeImages(motorbikeId, images) {
    try {
      const formData = new FormData();
      images.forEach((image, index) => {
        formData.append('images', {
          uri: image.uri,
          type: image.type || 'image/jpeg',
          name: image.name || `image_${index}.jpg`,
        });
      });

      const response = await axiosInstance.post(
        `${API_BASE_URL}/images/motorbike/${motorbikeId}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return {
        success: true,
        data: response.data.data || response.data,
        message: 'Images uploaded successfully'
      };
    } catch (error) {
      console.error('Error uploading motorbike images:', error.response?.data || error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to upload images',
        message: 'Failed to upload images'
      };
    }
  }

  async uploadColorImage(motorbikeId, colorId, image) {
    try {
      const formData = new FormData();
      formData.append('color_image', {
        uri: image.uri,
        type: image.type || 'image/jpeg',
        name: image.name || 'color_image.jpg',
      });

      const response = await axiosInstance.post(
        `${API_BASE_URL}/images/motorbike-color/${motorbikeId}/${colorId}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return {
        success: true,
        data: response.data.data || response.data,
        message: 'Color image uploaded successfully'
      };
    } catch (error) {
      console.error('Error uploading color image:', error.response?.data || error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to upload color image',
        message: 'Failed to upload color image'
      };
    }
  }
}

export default new MotorbikeService();
