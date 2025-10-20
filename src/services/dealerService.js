import storageService from './storage/storageService';
import { STORAGE_KEYS } from '../constants';

let IN_MEMORY = null;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const loadDealers = async () => {
  if (Array.isArray(IN_MEMORY)) return IN_MEMORY;
  const stored = (await storageService.getItem(STORAGE_KEYS.DEALER_CATALOG)) || [];
  IN_MEMORY = Array.isArray(stored) ? stored : [];
  return IN_MEMORY;
};

const saveDealers = async (dealers) => {
  IN_MEMORY = Array.isArray(dealers) ? dealers : [];
  await storageService.setItem(STORAGE_KEYS.DEALER_CATALOG, IN_MEMORY);
  return IN_MEMORY;
};

const generateId = () => `DLR${Date.now()}${Math.random().toString(36).substr(2, 5)}`;

const dealerService = {
  async getDealers() {
    try {
      await delay(200);
      const data = await loadDealers();
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching dealers:', error);
      return { success: false, error: 'Không thể tải danh sách đại lý' };
    }
  },

  async createDealer(dealerData) {
    try {
      await delay(200);
      const arr = await loadDealers();
      const next = {
        id: generateId(),
        totalSales: 0,
        totalVehicles: 0,
        rating: 0,
        lastOrderDate: null,
        ...dealerData,
      };
      arr.unshift(next);
      await saveDealers(arr);
      return { success: true, data: next };
    } catch (error) {
      console.error('Error creating dealer:', error);
      return { success: false, error: 'Không thể tạo đại lý' };
    }
  },

  async updateDealer(dealerId, updateData) {
    try {
      await delay(200);
      const arr = await loadDealers();
      const idx = arr.findIndex((d) => d.id === dealerId);
      if (idx === -1) return { success: false, error: 'Không tìm thấy đại lý' };
      arr[idx] = { ...arr[idx], ...updateData };
      await saveDealers(arr);
      return { success: true, data: arr[idx] };
    } catch (error) {
      console.error('Error updating dealer:', error);
      return { success: false, error: 'Không thể cập nhật đại lý' };
    }
  },

  async updateDealerStatus(dealerId, status) {
    return this.updateDealer(dealerId, { status });
  },

  async deleteDealer(dealerId) {
    try {
      await delay(150);
      const arr = await loadDealers();
      const idx = arr.findIndex((d) => d.id === dealerId);
      if (idx === -1) return { success: false, error: 'Không tìm thấy đại lý' };
      arr.splice(idx, 1);
      await saveDealers(arr);
      return { success: true, data: { id: dealerId } };
    } catch (error) {
      console.error('Error deleting dealer:', error);
      return { success: false, error: 'Không thể xóa đại lý' };
    }
  },
};

export default dealerService;
