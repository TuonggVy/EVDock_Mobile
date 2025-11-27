import api from './api/axiosInstance';

// Endpoints for Dealer Manager & Dealer Staff - Installment Plan
const ENDPOINTS = {
  BASE: '/installment-plan',
  LIST_BY_AGENCY: (agencyId) => `/installment-plan/list/${agencyId}`,
  DETAIL: (installmentId) => `/installment-plan/detail/${installmentId}`,
  UPDATE: (installmentId) => `/installment-plan/${installmentId}`,
  DELETE: (installmentId) => `/installment-plan/${installmentId}`,
};

class InstallmentPlanService {
  async createInstallmentPlan(payload) {
    const response = await api.post(ENDPOINTS.BASE, payload);
    return response.data;
  }

  async getInstallmentPlansByAgency(agencyId, params = {}) {
    const response = await api.get(ENDPOINTS.LIST_BY_AGENCY(agencyId), { params });
    return response.data;
  }

  async getInstallmentPlanDetail(installmentId) {
    const response = await api.get(ENDPOINTS.DETAIL(installmentId));
    return response.data;
  }

  async updateInstallmentPlan(installmentId, payload) {
    const response = await api.patch(ENDPOINTS.UPDATE(installmentId), payload);
    return response.data;
  }

  async deleteInstallmentPlan(installmentId) {
    const response = await api.delete(ENDPOINTS.DELETE(installmentId));
    return response.data;
  }
}

const installmentPlanService = new InstallmentPlanService();
export default installmentPlanService;


