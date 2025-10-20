import AsyncStorage from '@react-native-async-storage/async-storage';
import preOrderService from './preOrderService';

/**
 * Deposit Storage Service
 * Manages deposit data persistence for both available and pre-order deposits
 */
class DepositStorageService {
  constructor() {
    this.STORAGE_KEY = '@EVDock:Deposits';
  }

  /**
   * Generate unique deposit ID
   */
  generateDepositId() {
    return `DEP${Date.now()}${Math.random().toString(36).substr(2, 9)}`.toUpperCase();
  }

  /**
   * Get all deposits
   * @returns {Promise<Array>} All deposits
   */
  async getDeposits() {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting deposits:', error);
      return [];
    }
  }

  /**
   * Save deposits
   * @param {Array} deposits - Deposits array
   */
  async saveDeposits(deposits) {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(deposits));
    } catch (error) {
      console.error('Error saving deposits:', error);
      throw error;
    }
  }

  /**
   * Create new deposit
   * @param {Object} depositData - Deposit data
   * @returns {Promise<Object>} Created deposit
   */
  async createDeposit(depositData) {
    try {
      const deposits = await this.getDeposits();
      
      const newDeposit = {
        id: this.generateDepositId(),
        type: depositData.type, // 'available' or 'pre_order'
        
        // Customer info
        customerId: depositData.customerId || `C${Date.now()}`,
        customerName: depositData.customerName,
        customerPhone: depositData.customerPhone,
        customerEmail: depositData.customerEmail || '',
        
        // Vehicle info
        vehicleId: depositData.vehicleId || null,
        vehicleModel: depositData.vehicleModel,
        vehicleColor: depositData.vehicleColor,
        vehiclePrice: depositData.vehiclePrice,
        
        // Deposit details
        depositAmount: depositData.depositAmount,
        depositPercentage: depositData.depositPercentage,
        remainingAmount: depositData.remainingAmount,
        
        // Status
        status: depositData.status || 'pending', // pending, confirmed, completed, cancelled
        
        // Dates
        depositDate: depositData.depositDate || new Date().toISOString(),
        expectedDeliveryDate: depositData.expectedDeliveryDate || null,
        finalPaymentDueDate: depositData.finalPaymentDueDate || null,
        
        // Final payment (will be set later)
        finalPaymentType: null, // Will be 'full' or 'installment'
        installmentMonths: null,
        installmentId: null,
        finalPaymentDate: null,
        
        // Pre-order specific
        manufacturerOrderId: depositData.manufacturerOrderId || null,
        manufacturerStatus: depositData.manufacturerStatus || null,
        estimatedArrival: depositData.estimatedArrival || null,
        
        // Metadata
        notes: depositData.notes || '',
        createdAt: new Date().toISOString(),
        createdBy: depositData.createdBy || 'Dealer Staff',
        dealerId: depositData.dealerId || 'dealer001',
        lastModified: new Date().toISOString(),
      };
      
      deposits.push(newDeposit);
      await this.saveDeposits(deposits);
      
      console.log('✅ Deposit created:', newDeposit.id);
      return newDeposit;
    } catch (error) {
      console.error('Error creating deposit:', error);
      throw error;
    }
  }

  /**
   * Get deposit by ID
   * @param {String} depositId - Deposit ID
   * @returns {Promise<Object>} Deposit
   */
  async getDepositById(depositId) {
    try {
      const deposits = await this.getDeposits();
      return deposits.find(d => d.id === depositId);
    } catch (error) {
      console.error('Error getting deposit by ID:', error);
      return null;
    }
  }

  /**
   * Update deposit
   * @param {String} depositId - Deposit ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated deposit
   */
  async updateDeposit(depositId, updateData) {
    try {
      const deposits = await this.getDeposits();
      const depositIndex = deposits.findIndex(d => d.id === depositId);
      
      if (depositIndex === -1) {
        throw new Error('Deposit not found');
      }
      
      deposits[depositIndex] = {
        ...deposits[depositIndex],
        ...updateData,
        lastModified: new Date().toISOString(),
      };
      
      await this.saveDeposits(deposits);
      
      console.log('✅ Deposit updated:', depositId);
      return deposits[depositIndex];
    } catch (error) {
      console.error('Error updating deposit:', error);
      throw error;
    }
  }

  /**
   * Manager places manufacturer order for a pre-order deposit
   * @param {String} depositId
   * @param {{ manufacturerOrderId?: string, estimatedArrival?: string, orderedBy?: string }} payload
   */
  async managerPlaceManufacturerOrder(depositId, payload = {}) {
    try {
      const update = {
        manufacturerOrderId: payload.manufacturerOrderId || `MFG-PO-${Date.now()}`,
        manufacturerStatus: 'ordered',
        estimatedArrival: payload.estimatedArrival || null,
        manufacturerOrderedAt: new Date().toISOString(),
        manufacturerOrderedBy: payload.orderedBy || 'Dealer Manager',
      };
      const updated = await this.updateDeposit(depositId, update);
      // Enqueue task for EVM Staff
      await preOrderService.createTask({
        depositId,
        dealerId: updated.dealerId,
        vehicleId: updated.vehicleId,
        vehicleModel: updated.vehicleModel,
        vehicleColor: updated.vehicleColor,
        quantity: 1,
        requestedBy: update.manufacturerOrderedBy,
        notes: `Pre-order from deposit ${depositId}`,
      });
      return updated;
    } catch (error) {
      console.error('Error placing manufacturer order:', error);
      throw error;
    }
  }

  /**
   * Manager marks vehicle as arrived from manufacturer
   * @param {String} depositId
   * @param {{ arrivalDate?: string, vehicleId?: string, markedBy?: string }} payload
   */
  async managerMarkVehicleArrived(depositId, payload = {}) {
    try {
      const update = {
        manufacturerStatus: 'arrived',
        manufacturerArrivedAt: payload.arrivalDate || new Date().toISOString(),
        manufacturerArrivedBy: payload.markedBy || 'Dealer Manager',
      };
      if (payload.vehicleId) {
        update.vehicleId = payload.vehicleId;
      }
      return await this.updateDeposit(depositId, update);
    } catch (error) {
      console.error('Error marking vehicle arrived:', error);
      throw error;
    }
  }

  /**
   * Manager notifies Dealer Staff that vehicle is ready for the pre-order
   * @param {String} depositId
   * @param {{ notifiedBy?: string }} payload
   */
  async managerNotifyStaffVehicleReady(depositId, payload = {}) {
    try {
      const update = {
        staffNotifiedAt: new Date().toISOString(),
        staffNotifiedBy: payload.notifiedBy || 'Dealer Manager',
        notificationStatus: 'notified',
      };
      return await this.updateDeposit(depositId, update);
    } catch (error) {
      console.error('Error notifying staff:', error);
      throw error;
    }
  }

  /**
   * Dealer Staff acknowledges the manager notification
   * @param {String} depositId
   * @param {{ acknowledgedBy?: string }} payload
   */
  async staffAcknowledgeNotification(depositId, payload = {}) {
    try {
      const update = {
        notificationStatus: 'acknowledged',
        staffAcknowledgedAt: new Date().toISOString(),
        staffAcknowledgedBy: payload.acknowledgedBy || 'Dealer Staff',
      };
      return await this.updateDeposit(depositId, update);
    } catch (error) {
      console.error('Error acknowledging notification:', error);
      throw error;
    }
  }

  /**
   * Delete deposit
   * @param {String} depositId - Deposit ID
   */
  async deleteDeposit(depositId) {
    try {
      const deposits = await this.getDeposits();
      const filteredDeposits = deposits.filter(d => d.id !== depositId);
      
      await this.saveDeposits(filteredDeposits);
      
      console.log('✅ Deposit deleted:', depositId);
    } catch (error) {
      console.error('Error deleting deposit:', error);
      throw error;
    }
  }

  /**
   * Get deposits by type
   * @param {String} type - 'available' or 'pre_order'
   * @returns {Promise<Array>} Filtered deposits
   */
  async getDepositsByType(type) {
    try {
      const deposits = await this.getDeposits();
      return deposits.filter(d => d.type === type);
    } catch (error) {
      console.error('Error getting deposits by type:', error);
      return [];
    }
  }

  /**
   * Get deposits by status
   * @param {String} status - Status value
   * @returns {Promise<Array>} Filtered deposits
   */
  async getDepositsByStatus(status) {
    try {
      const deposits = await this.getDeposits();
      return deposits.filter(d => d.status === status);
    } catch (error) {
      console.error('Error getting deposits by status:', error);
      return [];
    }
  }

  /**
   * Clear all deposits (for testing)
   */
  async clearAllDeposits() {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
      console.log('✅ All deposits cleared');
    } catch (error) {
      console.error('Error clearing deposits:', error);
      throw error;
    }
  }

  // initializeWithMockData removed to avoid hardcoded data
}

// Export singleton instance
export default new DepositStorageService();
