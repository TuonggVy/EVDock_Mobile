import api from './api/axiosInstance';

// Utility function to get auth token
const getAuthToken = async () => {
  try {
    const { getItem } = await import('./storage/storageService');
    const token = await getItem('auth_token');
    return token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

// Utility function to update item status based on quantity
const updateItemStatus = (item) => {
  let status = 'in_stock';
  if (item.quantity === 0) {
    status = 'out_of_stock';
  } else if (item.quantity <= 10) {
    status = 'low_stock';
  }
  return { ...item, status };
};

// Inventory Service
export const inventoryService = {
  // Get all inventory items
  getInventory: async () => {
    try {
      // Request a large limit to get all items at once
      const response = await api.get('/inventory/list?limit=1000&page=1');
      const data = response.data.data || [];
      
      // Add status to each item
      const inventoryWithStatus = data.map(item => updateItemStatus(item));
      
      return {
        success: true,
        data: inventoryWithStatus,
        paginationInfo: response.data.paginationInfo
      };
    } catch (error) {
      console.error('Error fetching inventory:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Không thể tải danh sách tồn kho',
        data: []
      };
    }
  },

  // Get inventory detail
  getInventoryDetail: async (motorbikeId, warehouseId) => {
    try {
      const response = await api.get(`/inventory/detail/${motorbikeId}/${warehouseId}`);
      const data = response.data.data;
      
      return {
        success: true,
        data: data
      };
    } catch (error) {
      console.error('Error fetching inventory detail:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Không thể tải chi tiết tồn kho'
      };
    }
  },

  // Get available inventory for allocation (only items with quantity > 0)
  getAvailableInventory: async () => {
    try {
      const response = await api.get('/inventory/list');
      const data = response.data.data || [];
      const availableInventory = data.filter(item => item.quantity > 0);
      
      return {
        success: true,
        data: availableInventory.map(item => updateItemStatus(item))
      };
    } catch (error) {
      console.error('Error fetching available inventory:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Không thể tải tồn kho có sẵn',
        data: []
      };
    }
  },

  // Create new inventory item
  // Create new inventory item
createInventoryItem: async (motorbikeId, warehouseId, quantity) => {
  try {
    const parsedQuantity = parseInt(quantity);
    if (isNaN(parsedQuantity) || parsedQuantity < 0) {
      return { success: false, error: 'Số lượng không hợp lệ. Vui lòng nhập số dương.' };
    }

    const stockDate = new Date().toISOString(); // 👈 thêm dòng này

    const response = await api.post(
      `/inventory/${motorbikeId}/${warehouseId}`,
      {
        quantity: parsedQuantity,
        stockDate, // 👈 và gửi lên
      }
    );

    const createdItem = response.data.data;
    const itemWithStatus = updateItemStatus(createdItem);

    return { success: true, data: itemWithStatus, message: response.data.message };
  } catch (error) {
    console.error('Error creating inventory item:', error);
    console.error('Error response:', error.response?.data);

    let errorMessage = 'Không thể tạo mục tồn kho';

    // Parse dạng message mảng { field, error[] }
    const errData = error.response?.data;
    if (Array.isArray(errData?.message)) {
      const first = errData.message[0];
      if (first?.field && first?.error?.[0]) {
        errorMessage = `${first.field}: ${first.error[0]}`;
      }
    } else if (errData?.message) {
      errorMessage = errData.message;
    } else if (typeof errData === 'string') {
      errorMessage = errData;
    }

    return { success: false, error: errorMessage };
  }
},


  // Update inventory item
  updateInventoryItem: async (motorbikeId, warehouseId, updateData) => {
    try {
      const response = await api.patch(`/inventory/${motorbikeId}/${warehouseId}`, updateData);
      
      const updatedItem = response.data.data;
      const itemWithStatus = updateItemStatus(updatedItem);
      
      return {
        success: true,
        data: itemWithStatus,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error updating inventory item:', error);
      
      // Handle different error response formats
      let errorMessage = 'Không thể cập nhật mục tồn kho';
      
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // Handle validation errors
        if (errorData.errors && Array.isArray(errorData.errors)) {
          errorMessage = errorData.errors.map(e => e.message || e.msg || e).join(', ');
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  },

  // Delete inventory item
  deleteInventoryItem: async (motorbikeId, warehouseId) => {
    try {
      const response = await api.delete(`/inventory/${motorbikeId}/${warehouseId}`);
      
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      
      // Handle different error response formats
      let errorMessage = 'Không thể xóa mục tồn kho';
      
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // Handle validation errors
        if (errorData.errors && Array.isArray(errorData.errors)) {
          errorMessage = errorData.errors.map(e => e.message || e.msg || e).join(', ');
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  },

  // Get inventory statistics
  getInventoryStats: async () => {
    try {
      const response = await api.get('/inventory/list');
      const data = response.data.data || [];
      
      const totalItems = data.length;
      const inStockItems = data.filter(item => updateItemStatus(item).status === 'in_stock').length;
      const lowStockItems = data.filter(item => updateItemStatus(item).status === 'low_stock').length;
      const outOfStockItems = data.filter(item => updateItemStatus(item).status === 'out_of_stock').length;
      const totalValue = data.reduce((sum, item) => sum + ((item.price || 0) * item.quantity), 0);
      
      return {
        success: true,
        data: {
          totalItems,
          inStockItems,
          lowStockItems,
          outOfStockItems,
          totalValue
        }
      };
    } catch (error) {
      console.error('Error fetching inventory stats:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Không thể tải thống kê tồn kho'
      };
    }
  }
};

export default inventoryService;
