import { API_BASE_URL } from '../config/api';

/**
 * Debt Management Service
 * Handles all debt-related API calls for both customer and manufacturer debts
 */
class DebtManagementService {
  constructor() {
    this.baseURL = `${API_BASE_URL}/debt-management`;
  }

  // ==================== CUSTOMER DEBT METHODS ====================

  /**
   * Get all customer debts
   * @param {Object} filters - Filter parameters
   * @returns {Promise<Object>} Customer debts with pagination
   */
  async getCustomerDebts(filters = {}) {
    try {
      // For development, use mock data
      return this.getMockCustomerDebts(filters);

      /*
      // Uncomment when backend is ready:
      const query = new URLSearchParams(filters).toString();
      const response = await fetch(`${this.baseURL}/customer-debts?${query}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
      */
    } catch (error) {
      console.error('Error fetching customer debts:', error);
      // Return mock data as fallback
      return this.getMockCustomerDebts(filters);
    }
  }

  /**
   * Get customer debt by ID
   * @param {string} debtId - Debt ID
   * @returns {Promise<Object>} Customer debt details
   */
  async getCustomerDebtById(debtId) {
    try {
      // Mock implementation
      const mockDebts = await this.getMockCustomerDebts();
      const debt = mockDebts.data.find(d => d.id === debtId);
      
      if (!debt) {
        throw new Error('Customer debt not found');
      }

      return debt;

      /*
      // Uncomment when backend is ready:
      const response = await fetch(`${this.baseURL}/customer-debts/${debtId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
      */
    } catch (error) {
      console.error('Error fetching customer debt:', error);
      throw error;
    }
  }

  /**
   * Create new customer debt
   * @param {Object} debtData - Customer debt data
   * @returns {Promise<Object>} Created customer debt
   */
  async createCustomerDebt(debtData) {
    try {
      // Mock implementation
      const newDebt = {
        id: `CD${Date.now()}`,
        ...debtData,
        createdAt: new Date().toISOString(),
        createdBy: 'Dealer Manager',
        status: 'active',
      };

      return newDebt;

      /*
      // Uncomment when backend is ready:
      const response = await fetch(`${this.baseURL}/customer-debts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify(debtData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
      */
    } catch (error) {
      console.error('Error creating customer debt:', error);
      throw error;
    }
  }

  /**
   * Update customer debt
   * @param {string} debtId - Debt ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated customer debt
   */
  async updateCustomerDebt(debtId, updateData) {
    try {
      // Mock implementation
      const mockDebts = await this.getMockCustomerDebts();
      const debtIndex = mockDebts.data.findIndex(d => d.id === debtId);
      
      if (debtIndex === -1) {
        throw new Error('Customer debt not found');
      }

      const updatedDebt = {
        ...mockDebts.data[debtIndex],
        ...updateData,
        lastModified: new Date().toISOString(),
      };

      return updatedDebt;

      /*
      // Uncomment when backend is ready:
      const response = await fetch(`${this.baseURL}/customer-debts/${debtId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
      */
    } catch (error) {
      console.error('Error updating customer debt:', error);
      throw error;
    }
  }

  /**
   * Record customer debt payment
   * @param {string} debtId - Debt ID
   * @param {Object} paymentData - Payment data
   * @returns {Promise<Object>} Updated debt with payment record
   */
  async recordCustomerDebtPayment(debtId, paymentData) {
    try {
      // Mock implementation
      const mockDebts = await this.getMockCustomerDebts();
      const debt = mockDebts.data.find(d => d.id === debtId);
      
      if (!debt) {
        throw new Error('Customer debt not found');
      }

      const payment = {
        id: `PAY${Date.now()}`,
        amount: paymentData.amount,
        paymentDate: new Date().toISOString(),
        paymentMethod: paymentData.paymentMethod || 'bank_transfer',
        notes: paymentData.notes || '',
        ...paymentData,
      };

      const updatedDebt = {
        ...debt,
        paidAmount: (debt.paidAmount || 0) + paymentData.amount,
        remainingAmount: debt.debtAmount - ((debt.paidAmount || 0) + paymentData.amount),
        lastPaymentDate: payment.paymentDate,
        payments: [...(debt.payments || []), payment],
        status: debt.remainingAmount <= paymentData.amount ? 'completed' : 'active',
      };

      return updatedDebt;

      /*
      // Uncomment when backend is ready:
      const response = await fetch(`${this.baseURL}/customer-debts/${debtId}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
      */
    } catch (error) {
      console.error('Error recording customer debt payment:', error);
      throw error;
    }
  }

  // ==================== MANUFACTURER DEBT METHODS ====================

  /**
   * Get all manufacturer debts
   * @param {Object} filters - Filter parameters
   * @returns {Promise<Object>} Manufacturer debts with pagination
   */
  async getManufacturerDebts(filters = {}) {
    try {
      // For development, use mock data
      return this.getMockManufacturerDebts(filters);

      /*
      // Uncomment when backend is ready:
      const query = new URLSearchParams(filters).toString();
      const response = await fetch(`${this.baseURL}/manufacturer-debts?${query}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
      */
    } catch (error) {
      console.error('Error fetching manufacturer debts:', error);
      // Return mock data as fallback
      return this.getMockManufacturerDebts(filters);
    }
  }

  /**
   * Get manufacturer debt by ID
   * @param {string} debtId - Debt ID
   * @returns {Promise<Object>} Manufacturer debt details
   */
  async getManufacturerDebtById(debtId) {
    try {
      // Mock implementation
      const mockDebts = await this.getMockManufacturerDebts();
      const debt = mockDebts.data.find(d => d.id === debtId);
      
      if (!debt) {
        throw new Error('Manufacturer debt not found');
      }

      return debt;

      /*
      // Uncomment when backend is ready:
      const response = await fetch(`${this.baseURL}/manufacturer-debts/${debtId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
      */
    } catch (error) {
      console.error('Error fetching manufacturer debt:', error);
      throw error;
    }
  }

  /**
   * Create new manufacturer debt
   * @param {Object} debtData - Manufacturer debt data
   * @returns {Promise<Object>} Created manufacturer debt
   */
  async createManufacturerDebt(debtData) {
    try {
      // Mock implementation
      const newDebt = {
        id: `MD${Date.now()}`,
        ...debtData,
        createdAt: new Date().toISOString(),
        createdBy: 'Dealer Manager',
        status: 'pending',
      };

      return newDebt;

      /*
      // Uncomment when backend is ready:
      const response = await fetch(`${this.baseURL}/manufacturer-debts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify(debtData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
      */
    } catch (error) {
      console.error('Error creating manufacturer debt:', error);
      throw error;
    }
  }

  /**
   * Update manufacturer debt
   * @param {string} debtId - Debt ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated manufacturer debt
   */
  async updateManufacturerDebt(debtId, updateData) {
    try {
      // Mock implementation
      const mockDebts = await this.getMockManufacturerDebts();
      const debtIndex = mockDebts.data.findIndex(d => d.id === debtId);
      
      if (debtIndex === -1) {
        throw new Error('Manufacturer debt not found');
      }

      const updatedDebt = {
        ...mockDebts.data[debtIndex],
        ...updateData,
        lastModified: new Date().toISOString(),
      };

      return updatedDebt;

      /*
      // Uncomment when backend is ready:
      const response = await fetch(`${this.baseURL}/manufacturer-debts/${debtId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
      */
    } catch (error) {
      console.error('Error updating manufacturer debt:', error);
      throw error;
    }
  }

  /**
   * Record manufacturer debt payment
   * @param {string} debtId - Debt ID
   * @param {Object} paymentData - Payment data
   * @returns {Promise<Object>} Updated debt with payment record
   */
  async recordManufacturerDebtPayment(debtId, paymentData) {
    try {
      // Mock implementation
      const mockDebts = await this.getMockManufacturerDebts();
      const debt = mockDebts.data.find(d => d.id === debtId);
      
      if (!debt) {
        throw new Error('Manufacturer debt not found');
      }

      const payment = {
        id: `PAY${Date.now()}`,
        amount: paymentData.amount,
        paymentDate: new Date().toISOString(),
        paymentMethod: paymentData.paymentMethod || 'bank_transfer',
        notes: paymentData.notes || '',
        ...paymentData,
      };

      const updatedDebt = {
        ...debt,
        paidAmount: (debt.paidAmount || 0) + paymentData.amount,
        remainingDebtAmount: debt.remainingDebtAmount - paymentData.amount,
        lastPaymentDate: payment.paymentDate,
        payments: [...(debt.payments || []), payment],
        status: debt.remainingDebtAmount <= paymentData.amount ? 'completed' : 'active',
      };

      return updatedDebt;

      /*
      // Uncomment when backend is ready:
      const response = await fetch(`${this.baseURL}/manufacturer-debts/${debtId}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
      */
    } catch (error) {
      console.error('Error recording manufacturer debt payment:', error);
      throw error;
    }
  }

  // ==================== MOCK DATA METHODS ====================

  /**
   * Get mock customer debts
   * @param {Object} filters - Filter parameters
   * @returns {Promise<Object>} Mock customer debts
   */
  async getMockCustomerDebts(filters = {}) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const mockData = [
      {
        id: 'CD001',
        customerName: 'Nguyễn Văn A',
        customerPhone: '0901234567',
        customerEmail: 'nguyenvana@email.com',
        debtType: 'installment',
        vehicleModel: 'Tesla Model Y',
        vehiclePrice: 1250000000,
        debtAmount: 1250000000,
        monthlyPayment: 125000000,
        totalMonths: 12,
        remainingMonths: 8,
        interestRate: 5.5,
        depositAmount: 0,
        depositType: null,
        status: 'active',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        lastPaymentDate: '2024-11-01',
        nextPaymentDate: '2024-12-01',
        createdAt: '2024-01-01',
        createdBy: 'Dealer Manager'
      },
      {
        id: 'CD002',
        customerName: 'Trần Thị B',
        customerPhone: '0907654321',
        customerEmail: 'tranthib@email.com',
        debtType: 'deposit_available',
        vehicleModel: 'Tesla Model X',
        vehiclePrice: 1800000000,
        debtAmount: 900000000,
        monthlyPayment: 0,
        totalMonths: 0,
        remainingMonths: 0,
        interestRate: 0,
        depositAmount: 900000000,
        depositType: 'available',
        status: 'active',
        startDate: '2024-11-01',
        endDate: null,
        lastPaymentDate: '2024-11-01',
        nextPaymentDate: null,
        createdAt: '2024-11-01',
        createdBy: 'Dealer Manager'
      },
      {
        id: 'CD003',
        customerName: 'Lê Văn C',
        customerPhone: '0909876543',
        customerEmail: 'levanc@email.com',
        debtType: 'pre_order',
        vehicleModel: 'Tesla Model V',
        vehiclePrice: 1500000000,
        debtAmount: 1500000000,
        monthlyPayment: 0,
        totalMonths: 0,
        remainingMonths: 0,
        interestRate: 0,
        depositAmount: 300000000,
        depositType: 'pre_order',
        status: 'pending',
        startDate: '2024-12-01',
        endDate: null,
        lastPaymentDate: '2024-11-15',
        nextPaymentDate: null,
        createdAt: '2024-11-15',
        createdBy: 'Dealer Manager'
      },
      {
        id: 'CD004',
        customerName: 'Phạm Thị D',
        customerPhone: '0904567890',
        customerEmail: 'phamthid@email.com',
        debtType: 'installment',
        vehicleModel: 'Tesla Model Y',
        vehiclePrice: 1300000000,
        debtAmount: 1300000000,
        monthlyPayment: 108333333,
        totalMonths: 12,
        remainingMonths: 3,
        interestRate: 6.0,
        depositAmount: 0,
        depositType: null,
        status: 'active',
        startDate: '2024-03-01',
        endDate: '2025-02-28',
        lastPaymentDate: '2024-11-01',
        nextPaymentDate: '2024-12-01',
        createdAt: '2024-03-01',
        createdBy: 'Dealer Manager'
      }
    ];

    // Apply filters
    let filteredData = mockData;

    if (filters.debtType && filters.debtType !== 'all') {
      filteredData = filteredData.filter(debt => debt.debtType === filters.debtType);
    }

    if (filters.status && filters.status !== 'all') {
      filteredData = filteredData.filter(debt => debt.status === filters.status);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredData = filteredData.filter(debt =>
        debt.customerName.toLowerCase().includes(searchLower) ||
        debt.customerPhone.includes(searchLower) ||
        debt.vehicleModel.toLowerCase().includes(searchLower) ||
        debt.id.toLowerCase().includes(searchLower)
      );
    }

    // Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = filteredData.slice(startIndex, endIndex);

    return {
      data: paginatedData,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(filteredData.length / limit),
        totalItems: filteredData.length,
        itemsPerPage: limit,
      },
      statistics: {
        total: mockData.length,
        active: mockData.filter(d => d.status === 'active').length,
        pending: mockData.filter(d => d.status === 'pending').length,
        overdue: mockData.filter(d => d.status === 'overdue').length,
        completed: mockData.filter(d => d.status === 'completed').length,
        installment: mockData.filter(d => d.debtType === 'installment').length,
        deposit_available: mockData.filter(d => d.debtType === 'deposit_available').length,
        pre_order: mockData.filter(d => d.debtType === 'pre_order').length,
      }
    };
  }

  /**
   * Get mock manufacturer debts
   * @param {Object} filters - Filter parameters
   * @returns {Promise<Object>} Mock manufacturer debts
   */
  async getMockManufacturerDebts(filters = {}) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const mockData = [
      {
        id: 'MD001',
        manufacturerName: 'Tesla Inc.',
        manufacturerCode: 'TSLA',
        debtType: 'lump_sum',
        totalDebtAmount: 50000000000,
        remainingDebtAmount: 35000000000,
        paidAmount: 15000000000,
        paymentType: 'full_payment',
        creditLimit: null,
        availableCredit: null,
        vehiclesOrdered: 25,
        vehiclesDelivered: 15,
        vehiclesPending: 10,
        orderDate: '2024-01-15',
        dueDate: '2024-12-31',
        lastPaymentDate: '2024-11-01',
        nextPaymentDate: '2024-12-01',
        interestRate: 0,
        status: 'active',
        blocked: false,
        blockedReason: null,
        createdAt: '2024-01-15',
        createdBy: 'Dealer Manager'
      },
      {
        id: 'MD002',
        manufacturerName: 'Tesla Inc.',
        manufacturerCode: 'TSLA',
        debtType: 'rolling_credit',
        totalDebtAmount: 0,
        remainingDebtAmount: 20000000000,
        paidAmount: 0,
        paymentType: 'rolling_credit',
        creditLimit: 50000000000,
        availableCredit: 30000000000,
        vehiclesOrdered: 40,
        vehiclesDelivered: 30,
        vehiclesPending: 10,
        orderDate: '2024-06-01',
        dueDate: null,
        lastPaymentDate: '2024-11-15',
        nextPaymentDate: null,
        interestRate: 0,
        status: 'active',
        blocked: false,
        blockedReason: null,
        createdAt: '2024-06-01',
        createdBy: 'Dealer Manager'
      },
      {
        id: 'MD003',
        manufacturerName: 'Tesla Inc.',
        manufacturerCode: 'TSLA',
        debtType: 'lump_sum',
        totalDebtAmount: 30000000000,
        remainingDebtAmount: 30000000000,
        paidAmount: 0,
        paymentType: 'full_payment',
        creditLimit: null,
        availableCredit: null,
        vehiclesOrdered: 15,
        vehiclesDelivered: 0,
        vehiclesPending: 15,
        orderDate: '2024-11-01',
        dueDate: '2025-02-28',
        lastPaymentDate: null,
        nextPaymentDate: '2025-02-28',
        interestRate: 0,
        status: 'pending',
        blocked: false,
        blockedReason: null,
        createdAt: '2024-11-01',
        createdBy: 'Dealer Manager'
      },
      {
        id: 'MD004',
        manufacturerName: 'Tesla Inc.',
        manufacturerCode: 'TSLA',
        debtType: 'rolling_credit',
        totalDebtAmount: 0,
        remainingDebtAmount: 80000000000,
        paidAmount: 0,
        paymentType: 'rolling_credit',
        creditLimit: 50000000000,
        availableCredit: 0,
        vehiclesOrdered: 60,
        vehiclesDelivered: 40,
        vehiclesPending: 20,
        orderDate: '2024-08-01',
        dueDate: null,
        lastPaymentDate: '2024-10-15',
        nextPaymentDate: null,
        interestRate: 0,
        status: 'blocked',
        blocked: true,
        blockedReason: 'Credit limit exceeded',
        createdAt: '2024-08-01',
        createdBy: 'Dealer Manager'
      }
    ];

    // Apply filters
    let filteredData = mockData;

    if (filters.debtType && filters.debtType !== 'all') {
      filteredData = filteredData.filter(debt => debt.debtType === filters.debtType);
    }

    if (filters.status && filters.status !== 'all') {
      filteredData = filteredData.filter(debt => debt.status === filters.status);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredData = filteredData.filter(debt =>
        debt.manufacturerName.toLowerCase().includes(searchLower) ||
        debt.manufacturerCode.toLowerCase().includes(searchLower) ||
        debt.id.toLowerCase().includes(searchLower)
      );
    }

    // Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = filteredData.slice(startIndex, endIndex);

    return {
      data: paginatedData,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(filteredData.length / limit),
        totalItems: filteredData.length,
        itemsPerPage: limit,
      },
      statistics: {
        total: mockData.length,
        active: mockData.filter(d => d.status === 'active').length,
        pending: mockData.filter(d => d.status === 'pending').length,
        overdue: mockData.filter(d => d.status === 'overdue').length,
        blocked: mockData.filter(d => d.status === 'blocked').length,
        completed: mockData.filter(d => d.status === 'completed').length,
        lump_sum: mockData.filter(d => d.debtType === 'lump_sum').length,
        rolling_credit: mockData.filter(d => d.debtType === 'rolling_credit').length,
      }
    };
  }

  /**
   * Get authentication token
   * @returns {Promise<string>} Auth token
   */
  async getAuthToken() {
    // TODO: Implement actual token retrieval
    return 'mock-auth-token';
  }

  /**
   * Search debts
   * @param {string} query - Search query
   * @param {string} type - debt type (customer or manufacturer)
   * @returns {Promise<Object>} Search results
   */
  async searchDebts(query, type = 'customer') {
    try {
      if (type === 'customer') {
        return this.getCustomerDebts({ search: query });
      } else {
        return this.getManufacturerDebts({ search: query });
      }
    } catch (error) {
      console.error('Error searching debts:', error);
      throw error;
    }
  }

  /**
   * Get debt statistics
   * @param {string} type - debt type (customer or manufacturer)
   * @returns {Promise<Object>} Debt statistics
   */
  async getDebtStatistics(type = 'customer') {
    try {
      if (type === 'customer') {
        const response = await this.getCustomerDebts();
        return response.statistics;
      } else {
        const response = await this.getManufacturerDebts();
        return response.statistics;
      }
    } catch (error) {
      console.error('Error fetching debt statistics:', error);
      throw error;
    }
  }
}

// Export singleton instance
export default new DebtManagementService();
