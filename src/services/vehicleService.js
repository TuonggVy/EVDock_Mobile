// Vehicle Service - Mock data service for vehicles
// This service can be easily replaced with real API calls when backend is ready

import { COLORS, IMAGES, STORAGE_KEYS } from '../constants';
import storageService from './storage/storageService';

// Array of product images
const PRODUCT_IMAGES = [
  IMAGES.PRODUCT_1,
  IMAGES.PRODUCT_2,
  IMAGES.PRODUCT_3,
  IMAGES.PRODUCT_4,
  IMAGES.PRODUCT_5,
  IMAGES.PRODUCT_6,
];

// Function to get product image by index (for consistent display)
const getProductImage = (index) => {
  return PRODUCT_IMAGES[index % PRODUCT_IMAGES.length];
};

// Manufacturer Vehicles: persisted in storage for CRUD (Vehicles screen)
let MANUFACTURER_VEHICLES_CACHE = null;

const loadVehiclesFromStorage = async () => {
  const arr = (await storageService.getItem(STORAGE_KEYS.MANUFACTURER_VEHICLES)) || [];
  return Array.isArray(arr) ? arr : [];
};

const saveVehiclesToStorage = async (arr) => {
  MANUFACTURER_VEHICLES_CACHE = arr;
  await storageService.setItem(STORAGE_KEYS.MANUFACTURER_VEHICLES, arr);
  return arr;
};

const getVehiclesArray = async () => {
  if (Array.isArray(MANUFACTURER_VEHICLES_CACHE)) return MANUFACTURER_VEHICLES_CACHE;
  const stored = await loadVehiclesFromStorage();
  MANUFACTURER_VEHICLES_CACHE = stored;
  return stored;
};


// --- Color-level stock helpers (works with provided array) ---
const ensureColorStocksForIndex = (arr, vehicleIndex) => {
  const vehicle = arr[vehicleIndex];
  if (!vehicle) return;
  if (!vehicle.colorStocks) {
    const colors = Array.isArray(vehicle.colors) ? vehicle.colors : [];
    const total = typeof vehicle.stockCount === 'number' ? vehicle.stockCount : 0;
    const colorStocks = {};
    if (colors.length === 0) {
      colorStocks['__default__'] = total;
    } else if (total <= 0) {
      colors.forEach((c) => { colorStocks[c] = 0; });
    } else {
      const base = Math.floor(total / colors.length);
      let remainder = total % colors.length;
      colors.forEach((c) => {
        const extra = remainder > 0 ? 1 : 0;
        colorStocks[c] = base + extra;
        if (remainder > 0) remainder -= 1;
      });
    }
    vehicle.colorStocks = colorStocks;
  }
  const sum = Object.values(vehicle.colorStocks).reduce((acc, n) => acc + (Number(n) || 0), 0);
  vehicle.stockCount = sum;
  vehicle.inStock = sum > 0;
  vehicle.updatedAt = new Date().toISOString().split('T')[0];
};

const ensureAllColorStocks = (arr) => {
  for (let i = 0; i < arr.length; i++) {
    ensureColorStocksForIndex(arr, i);
  }
};

// Vehicle versions
const VEHICLE_VERSIONS = [
  { id: 'all', name: 'All Versions', icon: '🚗' },
  { id: 'v1.0', name: 'v1.0', icon: '⚡' },
  { id: 'v1.2', name: 'v1.2', icon: '⚡' },
  { id: 'v1.5', name: 'v1.5', icon: '⚡' },
  { id: 'v2.0', name: 'v2.0', icon: '⚡' },
  { id: 'v2.5', name: 'v2.5', icon: '⚡' },
  { id: 'v3.0', name: 'v3.0', icon: '⚡' },
];

// Service functions - these will be replaced with API calls
export const vehicleService = {
  // Get all vehicles
  async getAllVehicles() {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    const list = await getVehiclesArray();
    ensureAllColorStocks(list);
    return { success: true, data: list, total: list.length };
  },

  // Get vehicles by version
  async getVehiclesByVersion(versionId) {
    await new Promise(resolve => setTimeout(resolve, 200));
    const list = await getVehiclesArray();
    ensureAllColorStocks(list);
    const out = versionId === 'all' ? list : list.filter(v => v.version === versionId);
    return { success: true, data: out, total: out.length };
  },

  // Search vehicles
  async searchVehicles(query) {
    await new Promise(resolve => setTimeout(resolve, 250));
    const list = await getVehiclesArray();
    ensureAllColorStocks(list);
    const filteredVehicles = list.filter(vehicle => 
      vehicle.name.toLowerCase().includes(query.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(query.toLowerCase()) ||
      vehicle.description.toLowerCase().includes(query.toLowerCase())
    );

    return {
      success: true,
      data: filteredVehicles,
      total: filteredVehicles.length,
      query,
    };
  },

  // Get vehicle by ID
  async getVehicleById(id) {
    await new Promise(resolve => setTimeout(resolve, 200));
    const list = await getVehiclesArray();
    ensureAllColorStocks(list);
    const vehicle = list.find(v => v.id === id);
    if (!vehicle) {
      return {
        success: false,
        error: 'Vehicle not found',
      };
    }

    return {
      success: true,
      data: vehicle,
    };
  },

  // Get vehicle versions
  async getVersions() {
    await new Promise(resolve => setTimeout(resolve, 100));
    return { success: true, data: VEHICLE_VERSIONS };
  },

  // Filter vehicles with multiple criteria
  async filterVehicles(filters) {
    await new Promise(resolve => setTimeout(resolve, 300));
    const list = await getVehiclesArray();
    ensureAllColorStocks(list);
    let filteredVehicles = [...list];

    // Apply version filter
    if (filters.version && filters.version !== 'all') {
      filteredVehicles = filteredVehicles.filter(v => v.version === filters.version);
    }

    // Apply search filter
    if (filters.search) {
      const query = filters.search.toLowerCase();
      filteredVehicles = filteredVehicles.filter(v => 
        v.name.toLowerCase().includes(query) ||
        v.model.toLowerCase().includes(query) ||
        v.description.toLowerCase().includes(query)
      );
    }

    // Apply price range filter
    if (filters.minPrice !== undefined) {
      filteredVehicles = filteredVehicles.filter(v => v.price >= filters.minPrice);
    }
    if (filters.maxPrice !== undefined) {
      filteredVehicles = filteredVehicles.filter(v => v.price <= filters.maxPrice);
    }

    // Apply stock filter
    if (filters.inStock !== undefined) {
      filteredVehicles = filteredVehicles.filter(v => v.inStock === filters.inStock);
    }

    // Apply sorting
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case 'price_asc':
          filteredVehicles.sort((a, b) => a.price - b.price);
          break;
        case 'price_desc':
          filteredVehicles.sort((a, b) => b.price - a.price);
          break;
        case 'name_asc':
          filteredVehicles.sort((a, b) => a.name.localeCompare(b.name));
          break;
        case 'name_desc':
          filteredVehicles.sort((a, b) => b.name.localeCompare(a.name));
          break;
        case 'newest':
          filteredVehicles.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          break;
        case 'oldest':
          filteredVehicles.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
          break;
      }
    }

    return {
      success: true,
      data: filteredVehicles,
      total: filteredVehicles.length,
      filters,
    };
  },

  // Update vehicle stock (for admin/staff)
  async updateVehicleStock(vehicleId, newStockCount) {
    await new Promise(resolve => setTimeout(resolve, 500));
    const list = await getVehiclesArray();
    const vehicleIndex = list.findIndex(v => v.id === vehicleId);
    if (vehicleIndex === -1) {
      return {
        success: false,
        error: 'Vehicle not found',
      };
    }

    ensureColorStocksForIndex(list, vehicleIndex);
    const vehicle = list[vehicleIndex];
    const currentTotal = Object.values(vehicle.colorStocks).reduce((a, n) => a + (Number(n) || 0), 0) || 1;
    const targetTotal = Math.max(0, Number(newStockCount) || 0);
    const colors = Object.keys(vehicle.colorStocks);
    let allocated = 0;
    colors.forEach((c, idx) => {
      const proportion = vehicle.colorStocks[c] / currentTotal;
      let next = Math.floor(proportion * targetTotal);
      if (idx === colors.length - 1) {
        next = targetTotal - allocated;
      }
      vehicle.colorStocks[c] = Math.max(0, next);
      allocated += next;
    });
    const sum = Object.values(vehicle.colorStocks).reduce((acc, n) => acc + (Number(n) || 0), 0);
    vehicle.stockCount = sum;
    vehicle.inStock = sum > 0;
    vehicle.updatedAt = new Date().toISOString().split('T')[0];

    await saveVehiclesToStorage(list);
    return { success: true, data: vehicle };
  },

  async getVehicleColorStock(vehicleId, colorName) {
    await new Promise(resolve => setTimeout(resolve, 80));
    const list = await getVehiclesArray();
    const idx = list.findIndex(v => v.id === vehicleId);
    if (idx === -1) return { success: false, error: 'Vehicle not found' };
    ensureColorStocksForIndex(list, idx);
    const v = list[idx];
    const key = colorName || '__default__';
    const count = Number(v.colorStocks?.[key]) || 0;
    return { success: true, data: { vehicleId, color: key, stock: count } };
  },

  async decrementVehicleColorStock(vehicleId, colorName, amount = 1) {
    await new Promise(resolve => setTimeout(resolve, 120));
    const list = await getVehiclesArray();
    const idx = list.findIndex(v => v.id === vehicleId);
    if (idx === -1) return { success: false, error: 'Vehicle not found' };
    ensureColorStocksForIndex(list, idx);
    const v = list[idx];
    const key = colorName || '__default__';
    const prev = Number(v.colorStocks?.[key]) || 0;
    const next = Math.max(0, prev - (Number(amount) || 0));
    v.colorStocks[key] = next;
    const sum = Object.values(v.colorStocks).reduce((acc, n) => acc + (Number(n) || 0), 0);
    v.stockCount = sum;
    v.inStock = sum > 0;
    v.updatedAt = new Date().toISOString().split('T')[0];
    await saveVehiclesToStorage(list);
    return { success: true, data: v };
  },

  async incrementVehicleColorStock(vehicleId, colorName, amount = 1) {
    await new Promise(resolve => setTimeout(resolve, 120));
    const list = await getVehiclesArray();
    const idx = list.findIndex(v => v.id === vehicleId);
    if (idx === -1) return { success: false, error: 'Vehicle not found' };
    ensureColorStocksForIndex(list, idx);
    const v = list[idx];
    const key = colorName || '__default__';
    const prev = Number(v.colorStocks?.[key]) || 0;
    const next = Math.max(0, prev + (Number(amount) || 0));
    v.colorStocks[key] = next;
    const sum = Object.values(v.colorStocks).reduce((acc, n) => acc + (Number(n) || 0), 0);
    v.stockCount = sum;
    v.inStock = sum > 0;
    v.updatedAt = new Date().toISOString().split('T')[0];
    await saveVehiclesToStorage(list);
    return { success: true, data: v };
  },

  // CRUD for manufacturer vehicles (Vehicles screen)
  async createVehicle(vehicleData) {
    const list = await getVehiclesArray();
    const id = `${Date.now()}`;
    const next = {
      id,
      ...vehicleData,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };
    list.unshift(next);
    await saveVehiclesToStorage(list);
    return { success: true, data: next };
  },

  async updateVehicle(vehicleId, updateData) {
    const list = await getVehiclesArray();
    const idx = list.findIndex(v => v.id === vehicleId);
    if (idx === -1) return { success: false, error: 'Vehicle not found' };
    list[idx] = { ...list[idx], ...updateData, updatedAt: new Date().toISOString().split('T')[0] };
    await saveVehiclesToStorage(list);
    return { success: true, data: list[idx] };
  },

  async deleteVehicle(vehicleId) {
    const list = await getVehiclesArray();
    const idx = list.findIndex(v => v.id === vehicleId);
    if (idx === -1) return { success: false, error: 'Vehicle not found' };
    const removed = list.splice(idx, 1)[0];
    await saveVehiclesToStorage(list);
    return { success: true, data: removed };
  },
};

// Helper functions
export const formatPrice = (price, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(price);
};

export const getStockStatus = (vehicle) => {
  if (!vehicle.inStock || vehicle.stockCount === 0) {
    return { status: 'out_of_stock', text: 'Out of stock', color: COLORS.ERROR };
  }
  if (vehicle.stockCount <= 3) {
    return { status: 'low_stock', text: `${vehicle.stockCount} left`, color: COLORS.WARNING };
  }
  return { status: 'in_stock', text: `${vehicle.stockCount} in stock`, color: COLORS.SUCCESS };
};

export default vehicleService;
