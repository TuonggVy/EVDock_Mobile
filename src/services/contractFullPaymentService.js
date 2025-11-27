import axiosInstance from './api/axiosInstance';

const API_BASE_URL = '';

class ContractFullPaymentService {
  async createPeriodPayment(payload) {
    // payload: { period, amount, customerContractId }
    const response = await axiosInstance.post(
      `${API_BASE_URL}/contract-full-payment`,
      payload
    );
    return response.data;
  }

  async getListByContractId(contractId, params = {}) {
    const response = await axiosInstance.get(
      `${API_BASE_URL}/contract-full-payment/list/${contractId}`,
      { params }
    );
    return response.data;
  }

  async getDetail(periodId) {
    const response = await axiosInstance.get(
      `${API_BASE_URL}/contract-full-payment/detail/${periodId}`
    );
    return response.data;
  }

  async updatePeriod(periodId, payload) {
    // payload: { period, amount }
    const response = await axiosInstance.patch(
      `${API_BASE_URL}/contract-full-payment/${periodId}`,
      payload
    );
    return response.data;
  }

  async deletePeriod(periodId) {
    const response = await axiosInstance.delete(
      `${API_BASE_URL}/contract-full-payment/${periodId}`
    );
    return response.data;
  }
}

export default new ContractFullPaymentService();


