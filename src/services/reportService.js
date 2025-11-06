import api from './api/axiosInstance';

/**
 * Report Service
 * Handles all report-related API calls
 */

const REPORT_ENDPOINTS = {
  TOTAL_CONTRACT_REVENUE: '/report/total-contract/revenue',
  QUARTER_REVENUE: '/report/total-contract/revenue/quarter',
  TOTAL_AGENCIES: '/report/total/agencies',
  TOTAL_WAREHOUSES: '/report/total/warehouses',
  TOTAL_MOTORBIKES: '/report/total/motorbikes',
  TOTAL_AP_BATCHES: '/report/total/ap-batches',
  TOP_10_MOTORBIKES: '/report/top-10/motorbikes',
};

class ReportService {
  /**
   * Get total contract revenue
   * @param {string} agencyId - Optional agency ID
   * @returns {Promise<Object>} Response with totalContractRevenue
   */
  async getTotalContractRevenue(agencyId = null) {
    try {
      const params = {};
      if (agencyId) {
        params.agencyId = agencyId;
      }
      
      const response = await api.get(REPORT_ENDPOINTS.TOTAL_CONTRACT_REVENUE, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching total contract revenue:', error);
      throw error;
    }
  }

  /**
   * Get quarter revenue data
   * @param {number} quarter - Quarter number (1-4)
   * @param {number} year - Year
   * @param {string} agencyId - Optional agency ID
   * @returns {Promise<Object>} Response with quarterContractChartData
   */
  async getQuarterRevenue(quarter, year, agencyId = null) {
    try {
      const params = { quarter, year };
      if (agencyId) {
        params.agencyId = agencyId;
      }
      
      const response = await api.get(REPORT_ENDPOINTS.QUARTER_REVENUE, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching quarter revenue:', error);
      throw error;
    }
  }

  /**
   * Get total agencies count
   * @returns {Promise<Object>} Response with totalAgencies
   */
  async getTotalAgencies() {
    try {
      const response = await api.get(REPORT_ENDPOINTS.TOTAL_AGENCIES);
      return response.data;
    } catch (error) {
      console.error('Error fetching total agencies:', error);
      throw error;
    }
  }

  /**
   * Get total warehouses count
   * @returns {Promise<Object>} Response with totalWarehouses
   */
  async getTotalWarehouses() {
    try {
      const response = await api.get(REPORT_ENDPOINTS.TOTAL_WAREHOUSES);
      return response.data;
    } catch (error) {
      console.error('Error fetching total warehouses:', error);
      throw error;
    }
  }

  /**
   * Get total motorbikes count
   * @returns {Promise<Object>} Response with totalMotorbikes
   */
  async getTotalMotorbikes() {
    try {
      const response = await api.get(REPORT_ENDPOINTS.TOTAL_MOTORBIKES);
      return response.data;
    } catch (error) {
      console.error('Error fetching total motorbikes:', error);
      throw error;
    }
  }

  /**
   * Get total AP batches count
   * @param {string} agencyId - Optional agency ID
   * @returns {Promise<Object>} Response with totalApBatches
   */
  async getTotalApBatches(agencyId = null) {
    try {
      const params = {};
      if (agencyId) {
        params.agencyId = agencyId;
      }
      
      const response = await api.get(REPORT_ENDPOINTS.TOTAL_AP_BATCHES, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching total AP batches:', error);
      throw error;
    }
  }

  /**
   * Get top 10 motorbikes
   * @returns {Promise<Object>} Response with array of top motorbikes
   */
  async getTop10Motorbikes() {
    try {
      const response = await api.get(REPORT_ENDPOINTS.TOP_10_MOTORBIKES);
      return response.data;
    } catch (error) {
      console.error('Error fetching top 10 motorbikes:', error);
      throw error;
    }
  }
}

export default new ReportService();

