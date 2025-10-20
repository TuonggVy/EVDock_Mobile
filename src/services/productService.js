import { apiConfig } from '../config/api';

/**
 * Product Service
 * Handles all product-related API calls
 * Easy to integrate with backend later
 */

const API_BASE_URL = apiConfig.baseURL;
const PRODUCTS_ENDPOINT = '/api/products';

class ProductService {
  /**
   * Get all products with optional filters
   * @param {Object} filters - Filter options (category, search, status, etc.)
   * @returns {Promise<Array>} Array of products
   */
  async getProducts(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      // Add filters to query params
      Object.keys(filters).forEach(key => {
        if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
          queryParams.append(key, filters[key]);
        }
      });

      const url = `${API_BASE_URL}${PRODUCTS_ENDPOINT}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }

  /**
   * Get a single product by ID
   * @param {string} productId - Product ID
   * @returns {Promise<Object>} Product object
   */
  async getProductById(productId) {
    try {
      const response = await fetch(`${API_BASE_URL}${PRODUCTS_ENDPOINT}/${productId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching product:', error);
      throw error;
    }
  }

  /**
   * Create a new product
   * @param {Object} productData - Product data
   * @returns {Promise<Object>} Created product
   */
  async createProduct(productData) {
    try {
      const response = await fetch(`${API_BASE_URL}${PRODUCTS_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`,
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }

  /**
   * Update an existing product
   * @param {string} productId - Product ID
   * @param {Object} productData - Updated product data
   * @returns {Promise<Object>} Updated product
   */
  async updateProduct(productId, productData) {
    try {
      const response = await fetch(`${API_BASE_URL}${PRODUCTS_ENDPOINT}/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`,
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  }

  /**
   * Delete a product
   * @param {string} productId - Product ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteProduct(productId) {
    try {
      const response = await fetch(`${API_BASE_URL}${PRODUCTS_ENDPOINT}/${productId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  }

  /**
   * Upload product image
   * @param {string} productId - Product ID
   * @param {FormData} imageData - Image file data
   * @returns {Promise<Object>} Upload result
   */
  async uploadProductImage(productId, imageData) {
    try {
      const response = await fetch(`${API_BASE_URL}${PRODUCTS_ENDPOINT}/${productId}/image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`,
        },
        body: imageData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error uploading product image:', error);
      throw error;
    }
  }

  /**
   * Get product categories
   * @returns {Promise<Array>} Array of categories
   */
  async getCategories() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/categories`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  /**
   * Get product statistics
   * @returns {Promise<Object>} Product statistics
   */
  async getProductStats() {
    try {
      const response = await fetch(`${API_BASE_URL}${PRODUCTS_ENDPOINT}/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching product stats:', error);
      throw error;
    }
  }

  /**
   * Search products
   * @param {string} query - Search query
   * @param {Object} filters - Additional filters
   * @returns {Promise<Array>} Search results
   */
  async searchProducts(query, filters = {}) {
    try {
      const searchFilters = {
        ...filters,
        search: query,
      };

      return await this.getProducts(searchFilters);
    } catch (error) {
      console.error('Error searching products:', error);
      throw error;
    }
  }

  /**
   * Get authentication token from storage
   * @returns {string} Auth token
   */
  getAuthToken() {
    // TODO: Implement token retrieval from secure storage
    // This should be replaced with actual token management
    return 'mock-token';
  }

  /**
   * Validate product data before sending to API
   * @param {Object} productData - Product data to validate
   * @returns {Object} Validation result
   */
  validateProductData(productData) {
    const errors = {};

    if (!productData.name || productData.name.trim() === '') {
      errors.name = 'Product name is required';
    }

    if (!productData.category || productData.category.trim() === '') {
      errors.category = 'Category is required';
    }

    if (!productData.price || isNaN(Number(productData.price)) || Number(productData.price) <= 0) {
      errors.price = 'Valid price is required';
    }

    if (!productData.description || productData.description.trim() === '') {
      errors.description = 'Description is required';
    }

    if (!productData.stock || isNaN(Number(productData.stock)) || Number(productData.stock) < 0) {
      errors.stock = 'Valid stock quantity is required';
    }

    // Validate specifications
    const requiredSpecs = ['range', 'acceleration', 'topSpeed', 'seating'];
    requiredSpecs.forEach(spec => {
      if (!productData.specifications?.[spec] || productData.specifications[spec].trim() === '') {
        errors[spec] = `${spec.charAt(0).toUpperCase() + spec.slice(1)} is required`;
      }
    });

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }
}

// Create and export a singleton instance
const productService = new ProductService();
export default productService;
