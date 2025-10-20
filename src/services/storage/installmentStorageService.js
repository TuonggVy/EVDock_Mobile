import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Installment Storage Service
 * Manages installment payment data persistence
 */
class InstallmentStorageService {
  constructor() {
    this.STORAGE_KEY = '@EVDock:Installments';
  }

  /**
   * Generate unique installment ID
   */
  generateInstallmentId() {
    return `INST${Date.now()}${Math.random().toString(36).substr(2, 9)}`.toUpperCase();
  }

  /**
   * Calculate payment schedule
   * @param {Object} installmentData - Installment details
   * @returns {Array} Payment schedule
   */
  calculatePaymentSchedule(installmentData) {
    const { totalAmount, installmentMonths, interestRate = 6.0, startDate } = installmentData;
    
    const monthlyRate = interestRate / 12 / 100;
    const monthlyPayment = (totalAmount / installmentMonths) * (1 + monthlyRate * installmentMonths / 2);
    const totalPayable = monthlyPayment * installmentMonths;
    const interestAmount = totalPayable - totalAmount;
    
    const schedule = [];
    const start = new Date(startDate || Date.now());
    
    for (let month = 1; month <= installmentMonths; month++) {
      const dueDate = new Date(start);
      dueDate.setMonth(start.getMonth() + month);
      
      const principalPayment = totalAmount / installmentMonths;
      const interestPayment = interestAmount / installmentMonths;
      
      schedule.push({
        month,
        dueDate: dueDate.toISOString(),
        amount: monthlyPayment,
        principal: principalPayment,
        interest: interestPayment,
        status: 'pending', // pending, paid, overdue
        paidDate: null,
        paidAmount: 0,
        remainingBalance: totalAmount - (principalPayment * month),
      });
    }
    
    return schedule;
  }

  /**
   * Create new installment plan
   * @param {Object} installmentData - Installment data
   * @returns {Promise<Object>} Created installment
   */
  async createInstallment(installmentData) {
    try {
      const installments = await this.getInstallments();
      
      const schedule = this.calculatePaymentSchedule(installmentData);
      
      const newInstallment = {
        id: this.generateInstallmentId(),
        quotationId: installmentData.quotationId,
        customerId: installmentData.customerId,
        customerName: installmentData.customerName,
        customerPhone: installmentData.customerPhone,
        vehicleModel: installmentData.vehicleModel,
        
        // Payment details
        totalAmount: installmentData.totalAmount,
        installmentMonths: installmentData.installmentMonths,
        monthlyPayment: schedule[0].amount,
        totalPayable: schedule[0].amount * installmentData.installmentMonths,
        interestRate: installmentData.interestRate || 6.0,
        interestAmount: (schedule[0].amount * installmentData.installmentMonths) - installmentData.totalAmount,
        
        // Status
        status: 'active', // active, completed, defaulted, cancelled
        paidMonths: 0,
        remainingMonths: installmentData.installmentMonths,
        remainingAmount: installmentData.totalAmount,
        
        // Dates
        startDate: installmentData.startDate || new Date().toISOString(),
        endDate: schedule[schedule.length - 1].dueDate,
        nextPaymentDate: schedule[0].dueDate,
        lastPaymentDate: null,
        
        // Payment schedule
        paymentSchedule: schedule,
        
        // Metadata
        createdAt: new Date().toISOString(),
        createdBy: installmentData.createdBy || 'Dealer Staff',
        dealerId: installmentData.dealerId || 'dealer001',
        lastModified: new Date().toISOString(),
      };
      
      installments.push(newInstallment);
      await this.saveInstallments(installments);
      
      console.log('✅ Installment created:', newInstallment.id);
      return newInstallment;
    } catch (error) {
      console.error('Error creating installment:', error);
      throw error;
    }
  }

  /**
   * Record installment payment
   * @param {String} installmentId - Installment ID
   * @param {Number} monthNumber - Month number to pay
   * @param {Object} paymentData - Payment details
   * @returns {Promise<Object>} Updated installment
   */
  async recordPayment(installmentId, monthNumber, paymentData = {}) {
    try {
      const installments = await this.getInstallments();
      const installmentIndex = installments.findIndex(i => i.id === installmentId);
      
      if (installmentIndex === -1) {
        throw new Error('Installment not found');
      }
      
      const installment = installments[installmentIndex];
      const scheduleIndex = installment.paymentSchedule.findIndex(s => s.month === monthNumber);
      
      if (scheduleIndex === -1) {
        throw new Error('Payment month not found');
      }
      
      // Update payment schedule
      installment.paymentSchedule[scheduleIndex] = {
        ...installment.paymentSchedule[scheduleIndex],
        status: 'paid',
        paidDate: paymentData.paidDate || new Date().toISOString(),
        paidAmount: paymentData.paidAmount || installment.paymentSchedule[scheduleIndex].amount,
      };
      
      // Update installment summary
      installment.paidMonths += 1;
      installment.remainingMonths = installment.installmentMonths - installment.paidMonths;
      installment.remainingAmount = installment.totalAmount - (installment.paymentSchedule[scheduleIndex].principal * installment.paidMonths);
      installment.lastPaymentDate = paymentData.paidDate || new Date().toISOString();
      installment.lastModified = new Date().toISOString();
      
      // Find next payment date
      const nextPendingPayment = installment.paymentSchedule.find(s => s.status === 'pending');
      installment.nextPaymentDate = nextPendingPayment ? nextPendingPayment.dueDate : null;
      
      // Check if completed
      if (installment.paidMonths === installment.installmentMonths) {
        installment.status = 'completed';
        installment.remainingAmount = 0;
        installment.remainingMonths = 0;
      }
      
      installments[installmentIndex] = installment;
      await this.saveInstallments(installments);
      
      console.log('✅ Payment recorded for installment:', installmentId, 'Month:', monthNumber);
      return installment;
    } catch (error) {
      console.error('Error recording payment:', error);
      throw error;
    }
  }

  /**
   * Get all installments
   * @returns {Promise<Array>} All installments
   */
  async getInstallments() {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEY);
      const parsed = data ? JSON.parse(data) : [];
      // Auto-clean legacy hardcoded demo entries if present
      const cleaned = Array.isArray(parsed) ? parsed.filter((i) => {
        const isLegacyMock = (
          (i?.quotationId === 'Q001' && i?.customerName === 'Nguyễn Văn A') ||
          (i?.quotationId === 'Q004' && i?.customerName === 'Phạm Thị D')
        );
        return !isLegacyMock;
      }) : [];
      if (cleaned.length !== parsed.length) {
        await this.saveInstallments(cleaned);
      }
      return cleaned;
    } catch (error) {
      console.error('Error getting installments:', error);
      return [];
    }
  }

  /**
   * Save installments
   * @param {Array} installments - Installments array
   */
  async saveInstallments(installments) {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(installments));
    } catch (error) {
      console.error('Error saving installments:', error);
      throw error;
    }
  }

  /**
   * Get installment by ID
   * @param {String} installmentId - Installment ID
   * @returns {Promise<Object>} Installment
   */
  async getInstallmentById(installmentId) {
    try {
      const installments = await this.getInstallments();
      return installments.find(i => i.id === installmentId);
    } catch (error) {
      console.error('Error getting installment by ID:', error);
      return null;
    }
  }

  /**
   * Get installments by quotation ID
   * @param {String} quotationId - Quotation ID
   * @returns {Promise<Object>} Installment
   */
  async getInstallmentByQuotationId(quotationId) {
    try {
      const installments = await this.getInstallments();
      return installments.find(i => i.quotationId === quotationId);
    } catch (error) {
      console.error('Error getting installment by quotation ID:', error);
      return null;
    }
  }

  /**
   * Get active installments
   * @returns {Promise<Array>} Active installments
   */
  async getActiveInstallments() {
    try {
      const installments = await this.getInstallments();
      return installments.filter(i => i.status === 'active');
    } catch (error) {
      console.error('Error getting active installments:', error);
      return [];
    }
  }

  /**
   * Get upcoming payments (due within X days)
   * @param {Number} daysAhead - Number of days to look ahead
   * @returns {Promise<Array>} Upcoming payments
   */
  async getUpcomingPayments(daysAhead = 7) {
    try {
      const installments = await this.getActiveInstallments();
      const upcomingPayments = [];
      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(now.getDate() + daysAhead);
      
      installments.forEach(installment => {
        const nextPayment = installment.paymentSchedule.find(s => s.status === 'pending');
        if (nextPayment) {
          const dueDate = new Date(nextPayment.dueDate);
          if (dueDate >= now && dueDate <= futureDate) {
            upcomingPayments.push({
              installmentId: installment.id,
              customerId: installment.customerId,
              customerName: installment.customerName,
              customerPhone: installment.customerPhone,
              vehicleModel: installment.vehicleModel,
              month: nextPayment.month,
              dueDate: nextPayment.dueDate,
              amount: nextPayment.amount,
              daysUntilDue: Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24)),
            });
          }
        }
      });
      
      return upcomingPayments.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    } catch (error) {
      console.error('Error getting upcoming payments:', error);
      return [];
    }
  }

  /**
   * Get overdue payments
   * @returns {Promise<Array>} Overdue payments
   */
  async getOverduePayments() {
    try {
      const installments = await this.getActiveInstallments();
      const overduePayments = [];
      const now = new Date();
      
      installments.forEach(installment => {
        installment.paymentSchedule.forEach(payment => {
          if (payment.status === 'pending') {
            const dueDate = new Date(payment.dueDate);
            if (dueDate < now) {
              // Mark as overdue
              payment.status = 'overdue';
              overduePayments.push({
                installmentId: installment.id,
                customerId: installment.customerId,
                customerName: installment.customerName,
                customerPhone: installment.customerPhone,
                vehicleModel: installment.vehicleModel,
                month: payment.month,
                dueDate: payment.dueDate,
                amount: payment.amount,
                daysOverdue: Math.ceil((now - dueDate) / (1000 * 60 * 60 * 24)),
              });
            }
          }
        });
      });
      
      // Save updated status
      await this.saveInstallments(installments);
      
      return overduePayments.sort((a, b) => b.daysOverdue - a.daysOverdue);
    } catch (error) {
      console.error('Error getting overdue payments:', error);
      return [];
    }
  }

  /**
   * Get installment statistics
   * @returns {Promise<Object>} Statistics
   */
  async getStatistics() {
    try {
      const installments = await this.getInstallments();
      const activeInstallments = installments.filter(i => i.status === 'active');
      const completedInstallments = installments.filter(i => i.status === 'completed');
      const overduePayments = await this.getOverduePayments();
      const upcomingPayments = await this.getUpcomingPayments(7);
      
      const totalInstallmentValue = activeInstallments.reduce((sum, i) => sum + i.totalAmount, 0);
      const totalCollected = activeInstallments.reduce((sum, i) => sum + (i.totalAmount - i.remainingAmount), 0);
      const totalRemaining = activeInstallments.reduce((sum, i) => sum + i.remainingAmount, 0);
      
      return {
        totalInstallments: installments.length,
        activeInstallments: activeInstallments.length,
        completedInstallments: completedInstallments.length,
        overduePayments: overduePayments.length,
        upcomingPayments: upcomingPayments.length,
        totalInstallmentValue,
        totalCollected,
        totalRemaining,
        collectionRate: totalInstallmentValue > 0 ? (totalCollected / totalInstallmentValue) * 100 : 0,
      };
    } catch (error) {
      console.error('Error getting statistics:', error);
      return {
        totalInstallments: 0,
        activeInstallments: 0,
        completedInstallments: 0,
        overduePayments: 0,
        upcomingPayments: 0,
        totalInstallmentValue: 0,
        totalCollected: 0,
        totalRemaining: 0,
        collectionRate: 0,
      };
    }
  }

  /**
   * Clear all installments (for testing)
   */
  async clearAllInstallments() {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
      console.log('✅ All installments cleared');
    } catch (error) {
      console.error('Error clearing installments:', error);
      throw error;
    }
  }

  /**
   * Initialize with mock data (for testing)
   */
  async initializeWithMockData() {
    try {
      const existingInstallments = await this.getInstallments();
      if (existingInstallments.length > 0) {
        console.log('Installments already initialized');
        return existingInstallments;
      }
      // Do not seed any hardcoded cards; return empty list for a clean slate
      await this.saveInstallments([]);
      console.log('✅ Installments initialized: empty');
      return [];
    } catch (error) {
      console.error('Error initializing mock data:', error);
      throw error;
    }
  }
}

// Export singleton instance
export default new InstallmentStorageService();
