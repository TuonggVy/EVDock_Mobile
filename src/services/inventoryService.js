import { API_BASE_URL } from '../config/api';
import storageService from './storage/storageService';
import { STORAGE_KEYS } from '../constants';

// In-memory fallback is removed; data persists in storage under INVENTORY key
let MEMORY_CACHE = null;

// Utility function to simulate API delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Utility function to generate unique ID
const generateUniqueId = (prefix) => {
  return `${prefix}${Date.now()}${Math.random().toString(36).substr(2, 5)}`;
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

// Helpers
const loadFromStorage = async () => {
  const arr = (await storageService.getItem(STORAGE_KEYS.INVENTORY)) || [];
  return Array.isArray(arr) ? arr : [];
};

const saveToStorage = async (items) => {
  MEMORY_CACHE = items;
  await storageService.setItem(STORAGE_KEYS.INVENTORY, items);
  return items;
};

const getInventoryArray = async () => {
  if (Array.isArray(MEMORY_CACHE)) return MEMORY_CACHE;
  const stored = await loadFromStorage();
  MEMORY_CACHE = stored;
  return stored;
};

// Inventory Service
export const inventoryService = {
  // Get all inventory items
  getInventory: async () => {
    try {
      await delay(200);
      const data = (await getInventoryArray()).map(updateItemStatus);
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching inventory:', error);
      return {
        success: false,
        error: 'Không thể tải danh sách tồn kho'
      };
    }
  },

  // Get inventory by warehouse location
  getInventoryByWarehouse: async (warehouseLocation) => {
    try {
      await delay(300);
      
      // TODO: Replace with real API call
      // const response = await fetch(`${API_BASE_URL}/inventory?warehouse=${warehouseLocation}`);
      // const data = await response.json();
      
      const all = await getInventoryArray();
      const filteredInventory = all.filter(item => 
        item.warehouseLocation === warehouseLocation
      );
      
      return {
        success: true,
        data: filteredInventory.map(item => updateItemStatus(item))
      };
    } catch (error) {
      console.error('Error fetching inventory by warehouse:', error);
      return {
        success: false,
        error: 'Không thể tải tồn kho theo kho'
      };
    }
  },

  // Get available inventory for allocation (only in_stock and low_stock items)
  getAvailableInventory: async () => {
    try {
      await delay(300);
      
      // TODO: Replace with real API call
      // const response = await fetch(`${API_BASE_URL}/inventory/available`);
      // const data = await response.json();
      
      const all = await getInventoryArray();
      const availableInventory = all.filter(item => 
        item.quantity > 0
      );
      
      return {
        success: true,
        data: availableInventory.map(item => updateItemStatus(item))
      };
    } catch (error) {
      console.error('Error fetching available inventory:', error);
      return {
        success: false,
        error: 'Không thể tải tồn kho có sẵn'
      };
    }
  },

  // Create new inventory item
  createInventoryItem: async (itemData) => {
    try {
      await delay(500);
      
      // TODO: Replace with real API call
      // const response = await fetch(`${API_BASE_URL}/inventory`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(itemData)
      // });
      // const data = await response.json();
      
      const newItem = {
        id: generateUniqueId('INV'),
        ...itemData,
        quantity: parseInt(itemData.quantity),
        price: parseInt(itemData.price),
        lastUpdated: new Date().toISOString().split('T')[0],
      };
      
      const updatedItem = updateItemStatus(newItem);
      const arr = await getInventoryArray();
      arr.unshift(updatedItem);
      await saveToStorage(arr);
      
      return {
        success: true,
        data: updatedItem
      };
    } catch (error) {
      console.error('Error creating inventory item:', error);
      return {
        success: false,
        error: 'Không thể tạo mục tồn kho'
      };
    }
  },

  // Update inventory item
  updateInventoryItem: async (itemId, updateData) => {
    try {
      await delay(500);
      
      // TODO: Replace with real API call
      // const response = await fetch(`${API_BASE_URL}/inventory/${itemId}`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(updateData)
      // });
      // const data = await response.json();
      
      const arr = await getInventoryArray();
      const itemIndex = arr.findIndex(item => item.id === itemId);
      if (itemIndex === -1) {
        return {
          success: false,
          error: 'Không tìm thấy mục tồn kho'
        };
      }
      
      const updatedItem = {
        ...arr[itemIndex],
        ...updateData,
        quantity: parseInt(updateData.quantity),
        price: parseInt(updateData.price),
        lastUpdated: new Date().toISOString().split('T')[0],
      };
      
      const finalItem = updateItemStatus(updatedItem);
      arr[itemIndex] = finalItem;
      await saveToStorage(arr);
      
      return {
        success: true,
        data: finalItem
      };
    } catch (error) {
      console.error('Error updating inventory item:', error);
      return {
        success: false,
        error: 'Không thể cập nhật mục tồn kho'
      };
    }
  },

  // Delete inventory item
  deleteInventoryItem: async (itemId) => {
    try {
      await delay(300);
      
      // TODO: Replace with real API call
      // const response = await fetch(`${API_BASE_URL}/inventory/${itemId}`, {
      //   method: 'DELETE'
      // });
      // const data = await response.json();
      
      const arr = await getInventoryArray();
      const itemIndex = arr.findIndex(item => item.id === itemId);
      if (itemIndex === -1) {
        return {
          success: false,
          error: 'Không tìm thấy mục tồn kho'
        };
      }
      
      arr.splice(itemIndex, 1);
      await saveToStorage(arr);
      
      return {
        success: true,
        data: { id: itemId }
      };
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      return {
        success: false,
        error: 'Không thể xóa mục tồn kho'
      };
    }
  },

  // CRITICAL: Reduce inventory quantity when allocating vehicles
  reduceInventoryQuantity: async (vehicleModel, color, warehouseLocation, quantityToReduce) => {
    try {
      await delay(300);
      
      // TODO: Replace with real API call
      // const response = await fetch(`${API_BASE_URL}/inventory/reduce`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     vehicleModel,
      //     color,
      //     warehouseLocation,
      //     quantityToReduce
      //   })
      // });
      // const data = await response.json();
      
      // Find the matching inventory item
      const arr = await getInventoryArray();
      const itemIndex = arr.findIndex(item => 
        item.vehicleModel === vehicleModel &&
        item.color === color &&
        item.warehouseLocation === warehouseLocation
      );
      
      if (itemIndex === -1) {
        return {
          success: false,
          error: 'Không tìm thấy xe trong tồn kho'
        };
      }
      
      const currentItem = arr[itemIndex];
      
      // Check if there's enough quantity
      if (currentItem.quantity < quantityToReduce) {
        return {
          success: false,
          error: `Không đủ xe trong kho. Hiện có: ${currentItem.quantity} xe`
        };
      }
      
      // Reduce the quantity
      const updatedItem = {
        ...currentItem,
        quantity: currentItem.quantity - quantityToReduce,
        lastUpdated: new Date().toISOString().split('T')[0],
      };
      
      const finalItem = updateItemStatus(updatedItem);
      arr[itemIndex] = finalItem;
      await saveToStorage(arr);
      
      console.log(`Reduced inventory: ${vehicleModel} ${color} from ${currentItem.quantity} to ${finalItem.quantity}`);
      
      return {
        success: true,
        data: finalItem
      };
    } catch (error) {
      console.error('Error reducing inventory quantity:', error);
      return {
        success: false,
        error: 'Không thể giảm số lượng tồn kho'
      };
    }
  },

  // Restore inventory quantity when allocation is cancelled
  restoreInventoryQuantity: async (vehicleModel, color, warehouseLocation, quantityToRestore) => {
    try {
      await delay(300);
      
      // TODO: Replace with real API call
      // const response = await fetch(`${API_BASE_URL}/inventory/restore`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     vehicleModel,
      //     color,
      //     warehouseLocation,
      //     quantityToRestore
      //   })
      // });
      // const data = await response.json();
      
      // Find the matching inventory item
      const arr = await getInventoryArray();
      const itemIndex = arr.findIndex(item => 
        item.vehicleModel === vehicleModel &&
        item.color === color &&
        item.warehouseLocation === warehouseLocation
      );
      
      if (itemIndex === -1) {
        return {
          success: false,
          error: 'Không tìm thấy xe trong tồn kho'
        };
      }
      
      const currentItem = arr[itemIndex];
      
      // Restore the quantity
      const updatedItem = {
        ...currentItem,
        quantity: currentItem.quantity + quantityToRestore,
        lastUpdated: new Date().toISOString().split('T')[0],
      };
      
      const finalItem = updateItemStatus(updatedItem);
      arr[itemIndex] = finalItem;
      await saveToStorage(arr);
      
      console.log(`Restored inventory: ${vehicleModel} ${color} from ${currentItem.quantity} to ${finalItem.quantity}`);
      
      return {
        success: true,
        data: finalItem
      };
    } catch (error) {
      console.error('Error restoring inventory quantity:', error);
      return {
        success: false,
        error: 'Không thể khôi phục số lượng tồn kho'
      };
    }
  },

  // Get inventory statistics
  getInventoryStats: async () => {
    try {
      await delay(200);
      
      // TODO: Replace with real API call
      // const response = await fetch(`${API_BASE_URL}/inventory/stats`);
      // const data = await response.json();
      
      const arr = await getInventoryArray();
      const totalItems = arr.length;
      const inStockItems = arr.filter(item => updateItemStatus(item).status === 'in_stock').length;
      const lowStockItems = arr.filter(item => updateItemStatus(item).status === 'low_stock').length;
      const outOfStockItems = arr.filter(item => updateItemStatus(item).status === 'out_of_stock').length;
      const totalValue = arr.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
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
        error: 'Không thể tải thống kê tồn kho'
      };
    }
  }
};

export default inventoryService;
