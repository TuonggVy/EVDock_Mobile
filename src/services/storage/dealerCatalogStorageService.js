import storageService from './storageService';
import { STORAGE_KEYS, IMAGES } from '../../constants';

// Simple id generator based on model name to keep stable ids across deliveries
const toId = (modelName) =>
  String(modelName || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || `mdl-${Date.now()}`;

const nowDate = () => new Date().toISOString().split('T')[0];

const pickDefaultImage = (seed = 0) => {
  const arr = [
    IMAGES.PRODUCT_1,
    IMAGES.PRODUCT_2,
    IMAGES.PRODUCT_3,
    IMAGES.PRODUCT_4,
    IMAGES.PRODUCT_5,
    IMAGES.PRODUCT_6,
  ];
  const idx = Math.abs(seed) % arr.length;
  return arr[idx];
};

const computeTotals = (entry) => {
  const total = Object.values(entry.colorStocks || {}).reduce((sum, n) => sum + (Number(n) || 0), 0);
  entry.stockCount = total;
  entry.inStock = total > 0;
  entry.updatedAt = nowDate();
  return entry;
};

export const dealerCatalogStorageService = {
  // Get full catalog for current dealer (no multi-tenant segregation yet)
  async getCatalog() {
    const data = (await storageService.getItem(STORAGE_KEYS.DEALER_CATALOG)) || [];
    return Array.isArray(data) ? data : [];
  },

  async setCatalog(entries) {
    await storageService.setItem(STORAGE_KEYS.DEALER_CATALOG, Array.isArray(entries) ? entries : []);
    return true;
  },

  async clearCatalog() {
    await storageService.removeItem(STORAGE_KEYS.DEALER_CATALOG);
    return true;
  },

  // Retail price map: { [modelId]: { price, currency } }
  async getRetailPrices() {
    const m = (await storageService.getItem(STORAGE_KEYS.DEALER_RETAIL_PRICES)) || {};
    return typeof m === 'object' && m !== null ? m : {};
  },

  async setRetailPrice(modelIdOrName, price, currency = 'VND') {
    const modelId = toId(modelIdOrName);
    const map = await this.getRetailPrices();
    map[modelId] = { price: Number(price) || 0, currency };
    await storageService.setItem(STORAGE_KEYS.DEALER_RETAIL_PRICES, map);

    // Reflect into catalog entries too
    const catalog = await this.getCatalog();
    const idx = catalog.findIndex((v) => v.id === modelId);
    if (idx !== -1) {
      catalog[idx].price = map[modelId].price;
      catalog[idx].currency = map[modelId].currency;
      catalog[idx].updatedAt = nowDate();
      await this.setCatalog(catalog);
    }

    return { success: true, data: { modelId, ...map[modelId] } };
  },

  // Add delivered vehicles into catalog and increase color stock
  async addDeliveredVehicles({ vehicleModel, color, quantity = 1, version, image, baseCurrency = 'VND' }) {
    const catalog = await this.getCatalog();
    const modelId = toId(vehicleModel);
    const idx = catalog.findIndex((v) => v.id === modelId);
    if (idx === -1) {
      const entry = computeTotals({
        id: modelId,
        name: vehicleModel,
        model: vehicleModel,
        version: version || 'N/A',
        image: image || pickDefaultImage(modelId.length),
        price: 0, // will be set by retail price later
        currency: baseCurrency,
        inStock: true,
        stockCount: Number(quantity) || 0,
        colorStocks: { [color || '__default__']: Number(quantity) || 0 },
        createdAt: nowDate(),
        updatedAt: nowDate(),
      });
      catalog.push(entry);
    } else {
      const entry = catalog[idx];
      const key = color || '__default__';
      entry.colorStocks = entry.colorStocks || {};
      entry.colorStocks[key] = (Number(entry.colorStocks[key]) || 0) + (Number(quantity) || 0);
      if (version) entry.version = version;
      computeTotals(entry);
      catalog[idx] = entry;
    }

    await this.setCatalog(catalog);
    return { success: true, data: catalog };
  },

  async getVersions() {
    const catalog = await this.getCatalog();
    const set = new Set();
    catalog.forEach((v) => {
      if (v.version && v.version !== 'N/A') set.add(String(v.version));
    });
    const arr = Array.from(set).map((ver) => ({ id: ver, name: ver, icon: '⚡' }));
    return [{ id: 'all', name: 'All Versions', icon: '🚗' }, ...arr];
  },

  async filterVehicles({ version = 'all', search = '' } = {}) {
    const catalog = await this.getCatalog();
    const q = String(search || '').toLowerCase();
    const filtered = catalog.filter((v) => {
      const matchesSearch = v.name?.toLowerCase().includes(q) || v.model?.toLowerCase().includes(q);
      const matchesVersion = version === 'all' || v.version === version;
      return matchesSearch && matchesVersion;
    });
    return { success: true, data: filtered };
  },

  // Decrement stock by color for a given model id or name
  async decrementColorStock({ vehicleModelOrId, color, quantity = 1 }) {
    const catalog = await this.getCatalog();
    const modelId = toId(vehicleModelOrId);
    const idx = catalog.findIndex((v) => v.id === modelId);
    if (idx === -1) {
      return { success: false, error: 'Model not found in dealer catalog' };
    }
    const entry = catalog[idx];
    const key = color || '__default__';
    entry.colorStocks = entry.colorStocks || {};
    const prev = Number(entry.colorStocks[key]) || 0;
    const next = Math.max(0, prev - (Number(quantity) || 0));
    entry.colorStocks[key] = next;
    computeTotals(entry);
    catalog[idx] = entry;
    await this.setCatalog(catalog);
    return { success: true, data: entry };
  },
};

export default dealerCatalogStorageService;


