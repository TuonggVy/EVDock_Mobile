// Quotation Storage Service
// This service handles local storage for quotations and provides easy migration to backend

import AsyncStorage from '@react-native-async-storage/async-storage';

const QUOTATIONS_STORAGE_KEY = 'quotations_data';
const QUOTATION_COUNTER_KEY = 'quotation_counter';

class QuotationStorageService {
  // Get all quotations from local storage
  async getQuotations() {
    try {
      const stored = await AsyncStorage.getItem(QUOTATIONS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading quotations from storage:', error);
      return [];
    }
  }

  // Save quotations to local storage
  async saveQuotations(quotations) {
    try {
      await AsyncStorage.setItem(QUOTATIONS_STORAGE_KEY, JSON.stringify(quotations));
    } catch (error) {
      console.error('Error saving quotations to storage:', error);
      throw error;
    }
  }

  // Add a new quotation
  async addQuotation(quotation) {
    try {
      const existingQuotations = await this.getQuotations();
      const newQuotation = {
        ...quotation,
        id: await this.generateQuotationId(),
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
      };
      
      // Add to beginning of array (newest first)
      const updatedQuotations = [newQuotation, ...existingQuotations];
      await this.saveQuotations(updatedQuotations);
      
      return newQuotation;
    } catch (error) {
      console.error('Error adding quotation:', error);
      throw error;
    }
  }

  // Update an existing quotation
  async updateQuotation(quotationId, updateData) {
    try {
      const quotations = await this.getQuotations();
      const index = quotations.findIndex(q => q.id === quotationId);
      
      if (index === -1) {
        throw new Error('Quotation not found');
      }
      
      quotations[index] = {
        ...quotations[index],
        ...updateData,
        lastModified: new Date().toISOString(),
      };
      
      await this.saveQuotations(quotations);
      return quotations[index];
    } catch (error) {
      console.error('Error updating quotation:', error);
      throw error;
    }
  }

  // Delete a quotation
  async deleteQuotation(quotationId) {
    try {
      const quotations = await this.getQuotations();
      const filteredQuotations = quotations.filter(q => q.id !== quotationId);
      await this.saveQuotations(filteredQuotations);
    } catch (error) {
      console.error('Error deleting quotation:', error);
      throw error;
    }
  }

  // Generate unique quotation ID
  async generateQuotationId() {
    try {
      const counter = await AsyncStorage.getItem(QUOTATION_COUNTER_KEY);
      const newCounter = counter ? parseInt(counter) + 1 : 1;
      await AsyncStorage.setItem(QUOTATION_COUNTER_KEY, newCounter.toString());
      return `Q${newCounter.toString().padStart(4, '0')}`;
    } catch (error) {
      console.error('Error generating quotation ID:', error);
      return `Q${Date.now()}`;
    }
  }

  // Clear all quotations (for testing)
  async clearAllQuotations() {
    try {
      await AsyncStorage.removeItem(QUOTATIONS_STORAGE_KEY);
      await AsyncStorage.removeItem(QUOTATION_COUNTER_KEY);
    } catch (error) {
      console.error('Error clearing quotations:', error);
      throw error;
    }
  }

  // Get quotations by status
  async getQuotationsByStatus(status) {
    try {
      const quotations = await this.getQuotations();
      return quotations.filter(q => q.status === status);
    } catch (error) {
      console.error('Error getting quotations by status:', error);
      return [];
    }
  }

  // Get quotations by dealer
  async getQuotationsByDealer(dealerId) {
    try {
      const quotations = await this.getQuotations();
      return quotations.filter(q => q.dealerId === dealerId);
    } catch (error) {
      console.error('Error getting quotations by dealer:', error);
      return [];
    }
  }

  // Search quotations
  async searchQuotations(query) {
    try {
      const quotations = await this.getQuotations();
      const lowercaseQuery = query.toLowerCase();
      
      return quotations.filter(q => 
        q.customerName?.toLowerCase().includes(lowercaseQuery) ||
        q.customerPhone?.includes(query) ||
        q.customerEmail?.toLowerCase().includes(lowercaseQuery) ||
        q.vehicleModel?.toLowerCase().includes(lowercaseQuery) ||
        q.id?.toLowerCase().includes(lowercaseQuery)
      );
    } catch (error) {
      console.error('Error searching quotations:', error);
      return [];
    }
  }
}

// Export singleton instance
export const quotationStorageService = new QuotationStorageService();
export default quotationStorageService;
