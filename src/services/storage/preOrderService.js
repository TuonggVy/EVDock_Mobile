import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * PreOrder Service - queues pre-order fulfillment tasks for EVM Staff
 * Backend-friendly: mirrors typical REST resources (/preorder-tasks)
 */
class PreOrderService {
  constructor() {
    this.STORAGE_KEY = '@EVDock:PreOrderTasks';
  }

  generateId() {
    return `POT${Date.now()}${Math.random().toString(36).substr(2, 6)}`.toUpperCase();
  }

  async getTasks() {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error reading pre-order tasks:', e);
      return [];
    }
  }

  async saveTasks(tasks) {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(tasks));
    } catch (e) {
      console.error('Error saving pre-order tasks:', e);
      throw e;
    }
  }

  /**
   * Create a new pre-order fulfillment task
   */
  async createTask(payload) {
    const tasks = await this.getTasks();
    const task = {
      id: this.generateId(),
      depositId: payload.depositId,
      dealerId: payload.dealerId || 'dealer001',
      vehicleId: payload.vehicleId || null,
      vehicleModel: payload.vehicleModel,
      vehicleColor: payload.vehicleColor,
      quantity: Number(payload.quantity || 1),
      status: 'requested', // requested -> accepted -> in_transit -> delivered -> cancelled
      requestedBy: payload.requestedBy || 'Dealer Manager',
      requestedAt: new Date().toISOString(),
      acceptedBy: null,
      acceptedAt: null,
      deliveredBy: null,
      deliveredAt: null,
      notes: payload.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    tasks.push(task);
    await this.saveTasks(tasks);
    return task;
  }

  async getTaskById(taskId) {
    const tasks = await this.getTasks();
    return tasks.find(t => t.id === taskId) || null;
  }

  async getTaskByDepositId(depositId) {
    const tasks = await this.getTasks();
    return tasks.find(t => t.depositId === depositId) || null;
  }

  async getTasksByStatus(status) {
    const tasks = await this.getTasks();
    return tasks.filter(t => t.status === status);
  }

  async updateTaskStatus(taskId, nextStatus, metadata = {}) {
    const tasks = await this.getTasks();
    const idx = tasks.findIndex(t => t.id === taskId);
    if (idx === -1) throw new Error('Pre-order task not found');
    const task = tasks[idx];
    const now = new Date().toISOString();
    const updated = { ...task, status: nextStatus, updatedAt: now };
    if (nextStatus === 'accepted') {
      updated.acceptedAt = now;
      updated.acceptedBy = metadata.userName || 'EVM Staff';
    }
    if (nextStatus === 'in_transit') {
      updated.inTransitAt = now;
      updated.inTransitBy = metadata.userName || 'EVM Staff';
    }
    if (nextStatus === 'delivered') {
      updated.deliveredAt = now;
      updated.deliveredBy = metadata.userName || 'EVM Staff';
    }
    if (metadata.notes) updated.notes = metadata.notes;
    tasks[idx] = updated;
    await this.saveTasks(tasks);
    return updated;
  }

  async clearAll() {
    await AsyncStorage.removeItem(this.STORAGE_KEY);
  }
}

export default new PreOrderService();



