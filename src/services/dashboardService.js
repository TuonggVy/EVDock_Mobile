import api from './api/axiosInstance';

/**
 * Dashboard Service
 * Handles all dashboard-related API calls for Dealer Manager
 */

const DASHBOARD_ENDPOINTS = {
  TOTAL_CUSTOMER: (agencyId) => `/dashboard/total/customer/${agencyId}`,
  CHART_CUSTOMER_CONTRACT: (agencyId) => `/dashboard/chart/customer-contract/${agencyId}`,
  TOTAL_REVENUE: (agencyId) => `/dashboard/total/revenue/${agencyId}`,
  LIST_STAFF_REVENUE: (agencyId) => `/dashboard/list/staff/revenue/${agencyId}`,
};

class DashboardService {
  /**
   * Get total customer count
   * @param {string|number} agencyId - Agency ID
   * @returns {Promise<Object>} Response with totalCustomers
   */
  async getTotalCustomer(agencyId) {
    try {
      const response = await api.get(DASHBOARD_ENDPOINTS.TOTAL_CUSTOMER(agencyId));
      return response.data;
    } catch (error) {
      console.error('Error fetching total customer:', error);
      throw error;
    }
  }

  /**
   * Get customer contract chart data
   * @param {string|number} agencyId - Agency ID
   * @param {number} year - Year (optional, defaults to current year)
   * @returns {Promise<Object>} Response with array of monthly contract data
   */
  async getCustomerContractChart(agencyId, year = null) {
    try {
      const params = {};
      if (year) {
        params.year = year;
      }
      
      const response = await api.get(DASHBOARD_ENDPOINTS.CHART_CUSTOMER_CONTRACT(agencyId), { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching customer contract chart:', error);
      throw error;
    }
  }

  /**
   * Get total revenue
   * @param {string|number} agencyId - Agency ID
   * @returns {Promise<Object>} Response with totalRevenue
   */
  async getTotalRevenue(agencyId) {
    try {
      const response = await api.get(DASHBOARD_ENDPOINTS.TOTAL_REVENUE(agencyId));
      return response.data;
    } catch (error) {
      console.error('Error fetching total revenue:', error);
      throw error;
    }
  }

  /**
   * Get list of staff revenue
   * @param {string|number} agencyId - Agency ID
   * @param {number} page - Page number (default: 1)
   * @param {number} limit - Items per page (default: 10)
   * @returns {Promise<Object>} Response with staff revenue list and pagination info
   */
  async getStaffRevenueList(agencyId, page = 1, limit = 10) {
    try {
      const params = { page, limit };
      const response = await api.get(DASHBOARD_ENDPOINTS.LIST_STAFF_REVENUE(agencyId), { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching staff revenue list:', error);
      throw error;
    }
  }
}

export default new DashboardService();

