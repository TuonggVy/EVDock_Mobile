import storageService from './storage/storageService';
import axiosInstance from './api/axiosInstance';

// Local storage keys (kept internal to this module to avoid global churn)
const STORAGE_KEY_ORDERS = '@EVDock:Orders';
const STORAGE_KEY_ALLOCATIONS = '@EVDock:Allocations';
const STORAGE_KEY_WAREHOUSES = '@EVDock:Warehouses';

// Utilities
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const generateUniqueId = (prefix) => `${prefix}${Date.now()}${Math.random().toString(36).slice(2, 7)}`;

// Loaders/Savers
const loadOrders = async () => {
  const arr = (await storageService.getItem(STORAGE_KEY_ORDERS)) || [];
  return Array.isArray(arr) ? arr : [];
};

const saveOrders = async (orders) => {
  await storageService.setItem(STORAGE_KEY_ORDERS, orders);
  return orders;
};

const loadAllocations = async () => {
  const arr = (await storageService.getItem(STORAGE_KEY_ALLOCATIONS)) || [];
  return Array.isArray(arr) ? arr : [];
};

const saveAllocations = async (allocations) => {
  await storageService.setItem(STORAGE_KEY_ALLOCATIONS, allocations);
  return allocations;
};

const loadWarehouses = async () => {
  const arr = (await storageService.getItem(STORAGE_KEY_WAREHOUSES)) || [];
  return Array.isArray(arr) ? arr : [];
};

const saveWarehouses = async (warehouses) => {
  await storageService.setItem(STORAGE_KEY_WAREHOUSES, warehouses);
  return warehouses;
};

// Seeders (first-run defaults)
const ensureSeedData = async () => {
  // Seed orders
  const existingOrders = await loadOrders();
  if (existingOrders.length === 0) {
    const seededOrders = [
      {
        id: 'ORD001',
        dealerId: 'DEALER001',
        dealerName: 'AutoWorld Hanoi',
        vehicleModel: 'Model X',
        quantity: 5,
        color: 'Black',
        status: 'pending', // visible in OrderManagementScreen
        orderDate: '2024-01-15',
        expectedDelivery: '2024-02-15',
        totalValue: 600000000,
        priority: 'high',
        createdAt: '2024-01-15T10:00:00.000Z',
      },
      {
        id: 'ORD002',
        dealerId: 'DEALER001',
        dealerName: 'AutoWorld Hanoi',
        vehicleModel: 'Model Y',
        quantity: 3,
        color: 'White',
        status: 'pending_allocation', // consumed by AllocationManagementScreen
        orderDate: '2024-01-10',
        expectedDelivery: '2024-02-10',
        totalValue: 285000000,
        priority: 'normal',
        createdAt: '2024-01-10T10:00:00.000Z',
      },
      {
        id: 'ORD003',
        dealerId: 'DEALER002',
        dealerName: 'City Motors HCMC',
        vehicleModel: 'Model V',
        quantity: 2,
        color: 'Silver',
        status: 'pending_allocation',
        orderDate: '2024-01-05',
        expectedDelivery: '2024-01-25',
        totalValue: 170000000,
        priority: 'low',
        createdAt: '2024-01-05T10:00:00.000Z',
      },
    ];
    await saveOrders(seededOrders);
  }

  // Seed allocations
  const existingAllocations = await loadAllocations();
  if (existingAllocations.length === 0) {
    await saveAllocations([]);
  }

  // Seed warehouses
  const existingWarehouses = await loadWarehouses();
  if (existingWarehouses.length === 0) {
    const seededWarehouses = [
      { id: 'WH001', name: 'Warehouse A - Hanoi', location: 'Hanoi', capacity: 200 },
      { id: 'WH002', name: 'Warehouse B - Danang', location: 'Danang', capacity: 150 },
      { id: 'WH003', name: 'Warehouse C - HCMC', location: 'HCMC', capacity: 300 },
    ];
    await saveWarehouses(seededWarehouses);
  }
};

// Initialize seed data once the module is first imported
ensureSeedData().catch((e) => console.error('Seed data error (orderService):', e));

// Order Service (Dealer Manager)
export const orderService = {
  // Get orders filtered by dealerId
  getOrdersByDealer: async (dealerId) => {
    try {
      await delay(200);
      const orders = await loadOrders();
      const filtered = orders.filter((o) => (dealerId ? o.dealerId === dealerId : true));
      return { success: true, data: filtered };
    } catch (error) {
      console.error('Error getting orders by dealer:', error);
      return { success: false, error: 'Không thể tải danh sách đơn hàng' };
    }
  },

  // Create a new order
  createOrder: async (orderData) => {
    try {
      await delay(300);
      const orders = await loadOrders();
      const newOrder = {
        id: generateUniqueId('ORD'),
        status: 'pending',
        orderDate: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        priority: 'normal',
        ...orderData,
      };
      orders.unshift(newOrder);
      await saveOrders(orders);
      return { success: true, data: newOrder };
    } catch (error) {
      console.error('Error creating order:', error);
      return { success: false, error: 'Không thể tạo đơn hàng' };
    }
  },

  // Update order status or fields
  updateOrder: async (orderId, updateData) => {
    try {
      await delay(250);
      const orders = await loadOrders();
      const idx = orders.findIndex((o) => o.id === orderId);
      if (idx === -1) return { success: false, error: 'Không tìm thấy đơn hàng' };
      const updated = { ...orders[idx], ...updateData, updatedAt: new Date().toISOString() };
      orders[idx] = updated;
      await saveOrders(orders);
      return { success: true, data: updated };
    } catch (error) {
      console.error('Error updating order:', error);
      return { success: false, error: 'Không thể cập nhật đơn hàng' };
    }
  },

  // Create order restock via API
  createOrderRestock: async (orderData) => {
    try {
      const requestData = {
        quantity: parseInt(orderData.quantity) || 0,
        pricePolicyId: parseInt(orderData.pricePolicyId) || 1,
        discountId: parseInt(orderData.discountId) || 1,
        promotionId: parseInt(orderData.promotionId) || 1,
        warehouseId: parseInt(orderData.warehouseId) || 1,
        motorbikeId: parseInt(orderData.motorbikeId) || 1,
        colorId: parseInt(orderData.colorId) || 1,
        agencyId: parseInt(orderData.agencyId) || 1,
      };

      console.log('Creating order restock with data:', JSON.stringify(requestData, null, 2));

      const response = await axiosInstance.post('/order-restock', requestData);
      
      // Response format: { data: { id, basePrice, quantity, ... } }
      const responseData = response.data.data || response.data;
      const orderId = responseData?.id || responseData?.orderId;
      
      console.log('✅ Order created successfully:', {
        orderId,
        status: responseData?.status,
        quantity: responseData?.quantity,
        subtotal: responseData?.subtotal,
        fullData: responseData
      });
      
      return {
        success: true,
        data: responseData,
        orderId: orderId,
        message: response.data.message || `Tạo đơn hàng thành công${orderId ? ` (ID: ${orderId})` : ''}`
      };
    } catch (error) {
      console.error('Error creating order restock:', error);
      console.error('Error details:', error.response?.data);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Không thể tạo đơn hàng',
        message: 'Không thể tạo đơn hàng'
      };
    }
  },
};

// Allocation Service (EVM Staff)
export const allocationService = {
  // Pending orders are ones not yet allocated
  getPendingOrders: async () => {
    try {
      await delay(200);
      const orders = await loadOrders();
      const pending = orders.filter((o) => o.status === 'pending' || o.status === 'pending_allocation');
      return { success: true, data: pending };
    } catch (error) {
      console.error('Error getting pending orders:', error);
      return { success: false, error: 'Không thể tải đơn hàng chờ phân phối' };
    }
  },

  getAllocations: async () => {
    try {
      await delay(200);
      const allocations = await loadAllocations();
      return { success: true, data: allocations };
    } catch (error) {
      console.error('Error getting allocations:', error);
      return { success: false, error: 'Không thể tải danh sách phân phối' };
    }
  },

  createAllocation: async (allocationData) => {
    try {
      await delay(300);
      const [allocations, orders] = await Promise.all([loadAllocations(), loadOrders()]);

      const newAllocation = {
        id: generateUniqueId('ALLOC'),
        status: 'allocated',
        allocatedDate: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        ...allocationData,
      };

      allocations.unshift(newAllocation);

      // Update related order status to allocated
      const orderIndex = orders.findIndex((o) => o.id === allocationData.orderId);
      if (orderIndex !== -1) {
        orders[orderIndex] = {
          ...orders[orderIndex],
          status: 'allocated',
          updatedAt: new Date().toISOString(),
        };
      }

      await Promise.all([saveAllocations(allocations), saveOrders(orders)]);
      return { success: true, data: newAllocation };
    } catch (error) {
      console.error('Error creating allocation:', error);
      return { success: false, error: 'Không thể tạo phân phối' };
    }
  },

  updateAllocationStatus: async (allocationId, newStatus) => {
    try {
      await delay(250);
      const allocations = await loadAllocations();
      const idx = allocations.findIndex((a) => a.id === allocationId);
      if (idx === -1) return { success: false, error: 'Không tìm thấy phân phối' };
      const updated = { ...allocations[idx], status: newStatus, updatedAt: new Date().toISOString() };
      allocations[idx] = updated;
      await saveAllocations(allocations);
      return { success: true, data: updated };
    } catch (error) {
      console.error('Error updating allocation status:', error);
      return { success: false, error: 'Không thể cập nhật trạng thái phân phối' };
    }
  },
};

// Warehouse Service (Simple catalog)
export const warehouseService = {
  getWarehouses: async () => {
    try {
      await delay(150);
      const warehouses = await loadWarehouses();
      return { success: true, data: warehouses };
    } catch (error) {
      console.error('Error getting warehouses:', error);
      return { success: false, error: 'Không thể tải danh sách kho' };
    }
  },
};

export default { orderService, allocationService, warehouseService };

