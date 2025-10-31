import api from './api/axiosInstance';

/**
 * Customer Management API Service
 * Handles all API calls related to customer management
 */
const ENDPOINTS = {
  BASE: '/customer',
  LIST_BY_AGENCY: (agencyId) => `/customer/list/${agencyId}`,
  DETAIL: (customerId) => `/customer/detail/${customerId}`,
  UPDATE: (customerId) => `/customer/${customerId}`,
  DELETE: (customerId) => `/customer/${customerId}`,
};

class CustomerManagementService {
  /**
   * Get all customers for an agency
   * @param {number} agencyId - Agency ID
   * @param {Object} params - Query parameters (page, limit)
   * @returns {Promise<Object>} Response with data and paginationInfo
   */
  async getCustomers(agencyId, params = {}) {
    try {
      const response = await api.get(ENDPOINTS.LIST_BY_AGENCY(agencyId), { params });
      // Return the data array from response, sorted by id descending (newest first)
      const customers = response.data?.data || [];
      // Sort by id descending to show newest customers first
      return customers.sort((a, b) => (b.id || 0) - (a.id || 0));
    } catch (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }
  }

  /**
   * Get customer detail by ID
   * @param {number} customerId - Customer ID
   * @returns {Promise<Object>} Customer detail
   */
  async getCustomerDetail(customerId) {
    try {
      const response = await api.get(ENDPOINTS.DETAIL(customerId));
      return response.data?.data || null;
    } catch (error) {
      console.error('Error fetching customer detail:', error);
      throw error;
    }
  }

  /**
   * Create a new customer
   * @param {Object} customerData - Customer information
   * @returns {Promise<Object>} Created customer
   */
  async createCustomer(customerData) {
    try {
      const response = await api.post(ENDPOINTS.BASE, customerData);
      return response.data?.data || null;
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  }

  /**
   * Update customer
   * @param {number} customerId - Customer ID
   * @param {Object} customerData - Updated customer information
   * @returns {Promise<Object>} Updated customer
   */
  async updateCustomer(customerId, customerData) {
    try {
      const response = await api.patch(ENDPOINTS.UPDATE(customerId), customerData);
      return response.data?.data || null;
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  }

  /**
   * Delete customer
   * @param {number} customerId - Customer ID
   * @returns {Promise<Object>} Delete response
   */
  async deleteCustomer(customerId) {
    try {
      const response = await api.delete(ENDPOINTS.DELETE(customerId));
      return response.data || {};
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
  }

  /**
   * Get test drive requests
   * @returns {Promise<Array>} List of test drive requests
   */
  async getTestDriveRequests() {
    // For now, return empty list unless backend is connected
    return [];
    
    // Uncomment below when backend is ready:
    /*
    try {
      const response = await fetch(`${this.baseURL}/test-drive-requests`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching test drive requests:', error);
      return this.getMockTestDriveRequests();
    }
    */
  }

  /**
   * Get viewing requests
   * @returns {Promise<Array>} List of viewing requests
   */
  async getViewingRequests() {
    // For now, return empty list unless backend is connected
    return [];
    
    // Uncomment below when backend is ready:
    /*
    try {
      const response = await fetch(`${this.baseURL}/viewing-requests`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching viewing requests:', error);
      return this.getMockViewingRequests();
    }
    */
  }

  /**
   * Schedule test drive
   * @param {Object} scheduleData - Schedule information
   * @returns {Promise<Object>} Updated request
   */
  async scheduleTestDrive(scheduleData) {
    // For development, simulate successful update
    // TODO: Replace with actual API call when backend is ready
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: scheduleData.requestId,
          status: 'scheduled',
          scheduledDate: scheduleData.scheduledDate,
          scheduledTime: scheduleData.scheduledTime,
          notes: scheduleData.notes,
        });
      }, 500);
    });
    
    // Uncomment below when backend is ready:
    /*
    try {
      const response = await fetch(`${this.baseURL}/test-drive-requests/${scheduleData.requestId}/schedule`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scheduledDate: scheduleData.scheduledDate,
          scheduledTime: scheduleData.scheduledTime,
          notes: scheduleData.notes,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error scheduling test drive:', error);
      throw error;
    }
    */
  }

  /**
   * Complete test drive
   * @param {number} requestId - Request ID
   * @returns {Promise<Object>} Updated request
   */
  async completeTestDrive(requestId) {
    // For development, simulate successful update
    // TODO: Replace with actual API call when backend is ready
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: requestId,
          status: 'completed',
        });
      }, 500);
    });
    
    // Uncomment below when backend is ready:
    /*
    try {
      const response = await fetch(`${this.baseURL}/test-drive-requests/${requestId}/complete`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error completing test drive:', error);
      throw error;
    }
    */
  }

  /**
   * Schedule viewing
   * @param {Object} scheduleData - Schedule information
   * @returns {Promise<Object>} Updated request
   */
  async scheduleViewing(scheduleData) {
    // For development, simulate successful update
    // TODO: Replace with actual API call when backend is ready
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: scheduleData.requestId,
          status: 'scheduled',
          scheduledDate: scheduleData.scheduledDate,
          scheduledTime: scheduleData.scheduledTime,
          location: scheduleData.location,
          notes: scheduleData.notes,
        });
      }, 500);
    });
    
    // Uncomment below when backend is ready:
    /*
    try {
      const response = await fetch(`${this.baseURL}/viewing-requests/${scheduleData.requestId}/schedule`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scheduledDate: scheduleData.scheduledDate,
          scheduledTime: scheduleData.scheduledTime,
          location: scheduleData.location,
          notes: scheduleData.notes,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error scheduling viewing:', error);
      throw error;
    }
    */
  }

  /**
   * Complete viewing
   * @param {number} requestId - Request ID
   * @returns {Promise<Object>} Updated request
   */
  async completeViewing(requestId) {
    // For development, simulate successful update
    // TODO: Replace with actual API call when backend is ready
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: requestId,
          status: 'completed',
        });
      }, 500);
    });
    
    // Uncomment below when backend is ready:
    /*
    try {
      const response = await fetch(`${this.baseURL}/viewing-requests/${requestId}/complete`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error completing viewing:', error);
      throw error;
    }
    */
  }

  /**
   * Cancel viewing
   * @param {number} requestId - Request ID
   * @param {string} reason - Cancellation reason
   * @returns {Promise<Object>} Updated request
   */
  async cancelViewing(requestId, reason) {
    // For development, simulate successful update
    // TODO: Replace with actual API call when backend is ready
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: requestId,
          status: 'cancelled',
          cancelledAt: new Date().toISOString().split('T')[0],
          cancelledReason: reason,
        });
      }, 500);
    });
    
    // Uncomment below when backend is ready:
    /*
    try {
      const response = await fetch(`${this.baseURL}/viewing-requests/${requestId}/cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: reason,
          cancelledAt: new Date().toISOString(),
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error cancelling viewing:', error);
      throw error;
    }
    */
  }

  /**
   * Add new customer (alias for createCustomer for backward compatibility)
   * @param {Object} customerData - Customer information
   * @returns {Promise<Object>} Created customer
   */
  async addCustomer(customerData) {
    return this.createCustomer(customerData);
  }

  /**
   * Convert quotation to customer data and add to customers list
   * @param {Object} quotation - Quotation object
   * @returns {Promise<Object>} Created customer
   */
  async addCustomerFromQuotation(quotation) {
    try {
      // Convert quotation data to customer format
      const customerData = {
        name: quotation.customer?.name || quotation.customerName || 'Khách hàng',
        phone: quotation.customer?.phone || quotation.customerPhone || 'N/A',
        email: quotation.customer?.email || quotation.customerEmail || 'N/A',
        purchaseDate: quotation.paymentCompletedAt || quotation.createdAt || new Date().toISOString(),
        orderValue: quotation.pricing?.totalPrice || quotation.totalAmount || 0,
        vehicleModel: quotation.vehicle?.name || quotation.vehicleModel || 'N/A',
        vehicleColor: quotation.vehicle?.selectedColor || 'Đen',
        quotationId: quotation.id, // Link to original quotation
        dealerId: quotation.dealerId || 'dealer001',
        staffId: quotation.createdBy || 'staff001',
      };

      // Add customer to the system
      const newCustomer = await this.addCustomer(customerData);
      
      // Store in local storage for persistence
      await this.storeCustomerLocally(newCustomer);
      
      return newCustomer;
    } catch (error) {
      console.error('Error adding customer from quotation:', error);
      throw error;
    }
  }

  /**
   * Store customer locally for persistence
   * @param {Object} customer - Customer data
   */
  async storeCustomerLocally(customer) {
    try {
      // Get existing customers from storage
      const existingCustomers = await this.getCustomersFromStorage();
      
      // Add new customer to the list
      const updatedCustomers = [customer, ...existingCustomers];
      
      // Save back to storage
      await this.saveCustomersToStorage(updatedCustomers);
    } catch (error) {
      console.error('Error storing customer locally:', error);
    }
  }

  /**
   * Get customers from local storage
   * @returns {Promise<Array>} List of customers from storage
   */
  async getCustomersFromStorage() {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const stored = await AsyncStorage.getItem('customers_data');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading customers from storage:', error);
      return [];
    }
  }

  /**
   * Save customers to local storage
   * @param {Array} customers - List of customers
   */
  async saveCustomersToStorage(customers) {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem('customers_data', JSON.stringify(customers));
    } catch (error) {
      console.error('Error saving customers to storage:', error);
    }
  }

  // Mock data methods for development
  getMockCustomers() {
    return [
      {
        id: 1,
        name: 'Nguyễn Văn An',
        phone: '0901234567',
        email: 'an.nguyen@email.com',
        purchaseDate: '2024-01-15',
        orderValue: 1250000000,
        vehicleModel: 'Model Y',
        vehicleColor: 'Đen',
      },
      {
        id: 2,
        name: 'Trần Thị Bình',
        phone: '0987654321',
        email: 'binh.tran@email.com',
        purchaseDate: '2024-01-10',
        orderValue: 980000000,
        vehicleModel: 'Model V',
        vehicleColor: 'Trắng',
      },
      {
        id: 3,
        name: 'Lê Văn Cường',
        phone: '0912345678',
        email: 'cuong.le@email.com',
        purchaseDate: '2024-01-20',
        orderValue: 1560000000,
        vehicleModel: 'Model X',
        vehicleColor: 'Xanh',
      },
      {
        id: 4,
        name: 'Phạm Thị Dung',
        phone: '0904567890',
        email: 'dung.pham@email.com',
        purchaseDate: '2024-01-08',
        orderValue: 1120000000,
        vehicleModel: 'Model Y',
        vehicleColor: 'Đỏ',
      },
      {
        id: 5,
        name: 'Hoàng Văn Minh',
        phone: '0905678901',
        email: 'minh.hoang@email.com',
        purchaseDate: '2024-01-12',
        orderValue: 1340000000,
        vehicleModel: 'Model V',
        vehicleColor: 'Bạc',
      },
    ];
  }

  getMockTestDriveRequests() {
    return [
      {
        id: 1,
        customerId: 1,
        customerName: 'Nguyễn Văn An',
        customerPhone: '0901234567',
        model: 'Model Y',
        requestedDate: '2024-01-25',
        status: 'pending',
        notes: 'Khách hàng muốn lái thử vào cuối tuần',
        createdAt: '2024-01-20',
      },
      {
        id: 2,
        customerId: 2,
        customerName: 'Trần Thị Bình',
        customerPhone: '0987654321',
        model: 'Model V',
        requestedDate: '2024-01-26',
        status: 'scheduled',
        scheduledDate: '2024-01-26',
        scheduledTime: '14:00',
        notes: 'Khách hàng quan tâm đến Model V',
        createdAt: '2024-01-19',
      },
      {
        id: 3,
        customerId: 3,
        customerName: 'Lê Văn Cường',
        customerPhone: '0912345678',
        model: 'Model X',
        requestedDate: '2024-01-24',
        status: 'completed',
        scheduledDate: '2024-01-24',
        scheduledTime: '10:00',
        notes: 'Đã hoàn thành lái thử',
        createdAt: '2024-01-18',
      },
    ];
  }

  getMockViewingRequests() {
    return [
      {
        id: 1,
        customerId: 1,
        customerName: 'Nguyễn Văn An',
        customerPhone: '0901234567',
        customerEmail: 'an.nguyen@email.com',
        model: 'Model Y',
        requestedDate: '2024-01-28',
        preferredTime: '09:00-11:00',
        status: 'pending',
        location: 'Showroom EVDock',
        notes: 'Khách hàng muốn xem xe vào sáng sớm, quan tâm đến màu đen',
        createdAt: '2024-01-22',
      },
      {
        id: 2,
        customerId: 4,
        customerName: 'Phạm Thị Dung',
        customerPhone: '0904567890',
        customerEmail: 'dung.pham@email.com',
        model: 'Model X',
        requestedDate: '2024-01-29',
        preferredTime: '14:00-16:00',
        status: 'scheduled',
        scheduledDate: '2024-01-29',
        scheduledTime: '15:00',
        location: 'Showroom EVDock',
        notes: 'Khách hàng VIP, cần chuẩn bị xe màu trắng',
        createdAt: '2024-01-21',
      },
      {
        id: 3,
        customerId: 5,
        customerName: 'Hoàng Văn Minh',
        customerPhone: '0905678901',
        customerEmail: 'minh.hoang@email.com',
        model: 'Model V',
        requestedDate: '2024-01-30',
        preferredTime: '10:00-12:00',
        status: 'completed',
        scheduledDate: '2024-01-30',
        scheduledTime: '11:00',
        location: 'Showroom EVDock',
        notes: 'Đã xem xe, khách hàng rất hài lòng',
        createdAt: '2024-01-20',
        feedback: 'Khách hàng đánh giá cao chất lượng xe',
      },
      {
        id: 4,
        customerId: 6,
        customerName: 'Vũ Thị Lan',
        customerPhone: '0906789012',
        customerEmail: 'lan.vu@email.com',
        model: 'Model Y',
        requestedDate: '2024-01-31',
        preferredTime: '16:00-18:00',
        status: 'cancelled',
        notes: 'Khách hàng hủy do thay đổi kế hoạch',
        createdAt: '2024-01-23',
        cancelledAt: '2024-01-24',
        cancelledReason: 'Thay đổi kế hoạch cá nhân',
      },
    ];
  }
}

export default new CustomerManagementService();
