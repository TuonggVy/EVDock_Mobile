import { useState, useEffect, useCallback } from 'react';
import customerManagementService from '../services/customerManagementService';

/**
 * Custom hook for customer management data and operations
 */
export const useCustomerManagement = () => {
  // State for data
  const [customers, setCustomers] = useState([]);
  const [testDriveRequests, setTestDriveRequests] = useState([]);
  const [viewingRequests, setViewingRequests] = useState([]);
  
  // Loading states
  const [loading, setLoading] = useState({
    customers: false,
    testDriveRequests: false,
    viewingRequests: false,
  });
  
  // Error states
  const [errors, setErrors] = useState({
    customers: null,
    testDriveRequests: null,
    viewingRequests: null,
  });

  /**
   * Load customers data
   */
  const loadCustomers = useCallback(async () => {
    setLoading(prev => ({ ...prev, customers: true }));
    setErrors(prev => ({ ...prev, customers: null }));
    
    try {
      const data = await customerManagementService.getCustomers();
      setCustomers(data);
    } catch (error) {
      setErrors(prev => ({ ...prev, customers: error.message }));
      console.error('Error loading customers:', error);
    } finally {
      setLoading(prev => ({ ...prev, customers: false }));
    }
  }, []);

  /**
   * Load test drive requests
   */
  const loadTestDriveRequests = useCallback(async () => {
    setLoading(prev => ({ ...prev, testDriveRequests: true }));
    setErrors(prev => ({ ...prev, testDriveRequests: null }));
    
    try {
      const data = await customerManagementService.getTestDriveRequests();
      setTestDriveRequests(data);
    } catch (error) {
      setErrors(prev => ({ ...prev, testDriveRequests: error.message }));
      console.error('Error loading test drive requests:', error);
    } finally {
      setLoading(prev => ({ ...prev, testDriveRequests: false }));
    }
  }, []);

  /**
   * Load viewing requests
   */
  const loadViewingRequests = useCallback(async () => {
    setLoading(prev => ({ ...prev, viewingRequests: true }));
    setErrors(prev => ({ ...prev, viewingRequests: null }));
    
    try {
      const data = await customerManagementService.getViewingRequests();
      setViewingRequests(data);
    } catch (error) {
      setErrors(prev => ({ ...prev, viewingRequests: error.message }));
      console.error('Error loading viewing requests:', error);
    } finally {
      setLoading(prev => ({ ...prev, viewingRequests: false }));
    }
  }, []);

  /**
   * Load all data
   */
  const loadAllData = useCallback(async () => {
    await Promise.all([
      loadCustomers(),
      loadTestDriveRequests(),
      loadViewingRequests(),
    ]);
  }, [loadCustomers, loadTestDriveRequests, loadViewingRequests]);

  /**
   * Add new customer
   */
  const addCustomer = useCallback(async (customerData) => {
    try {
      const newCustomer = await customerManagementService.addCustomer(customerData);
      setCustomers(prev => [...prev, newCustomer]);
      return newCustomer;
    } catch (error) {
      console.error('Error adding customer:', error);
      throw error;
    }
  }, []);

  /**
   * Schedule test drive
   */
  const scheduleTestDrive = useCallback(async (scheduleData) => {
    try {
      const updatedRequest = await customerManagementService.scheduleTestDrive(scheduleData);
      setTestDriveRequests(prev => 
        prev.map(req => req.id === scheduleData.requestId ? updatedRequest : req)
      );
      return updatedRequest;
    } catch (error) {
      console.error('Error scheduling test drive:', error);
      throw error;
    }
  }, []);

  /**
   * Complete test drive
   */
  const completeTestDrive = useCallback(async (requestId) => {
    try {
      const updatedRequest = await customerManagementService.completeTestDrive(requestId);
      setTestDriveRequests(prev => 
        prev.map(req => req.id === requestId ? updatedRequest : req)
      );
      return updatedRequest;
    } catch (error) {
      console.error('Error completing test drive:', error);
      throw error;
    }
  }, []);

  /**
   * Schedule viewing
   */
  const scheduleViewing = useCallback(async (scheduleData) => {
    try {
      const updatedRequest = await customerManagementService.scheduleViewing(scheduleData);
      setViewingRequests(prev => 
        prev.map(req => req.id === scheduleData.requestId ? updatedRequest : req)
      );
      return updatedRequest;
    } catch (error) {
      console.error('Error scheduling viewing:', error);
      throw error;
    }
  }, []);

  /**
   * Complete viewing
   */
  const completeViewing = useCallback(async (requestId) => {
    try {
      const updatedRequest = await customerManagementService.completeViewing(requestId);
      setViewingRequests(prev => 
        prev.map(req => req.id === requestId ? updatedRequest : req)
      );
      return updatedRequest;
    } catch (error) {
      console.error('Error completing viewing:', error);
      throw error;
    }
  }, []);

  /**
   * Cancel viewing
   */
  const cancelViewing = useCallback(async (requestId, reason) => {
    try {
      const updatedRequest = await customerManagementService.cancelViewing(requestId, reason);
      setViewingRequests(prev => 
        prev.map(req => req.id === requestId ? updatedRequest : req)
      );
      return updatedRequest;
    } catch (error) {
      console.error('Error cancelling viewing:', error);
      throw error;
    }
  }, []);

  /**
   * Refresh data
   */
  const refresh = useCallback(() => {
    loadAllData();
  }, [loadAllData]);

  /**
   * Filter data based on search query
   */
  const getFilteredData = useCallback((data, searchQuery) => {
    if (!searchQuery.trim()) return data;
    
    const query = searchQuery.toLowerCase();
    return data.filter(item => {
      if (item.name) {
        return item.name.toLowerCase().includes(query) ||
               item.phone?.toLowerCase().includes(query) ||
               item.customerName?.toLowerCase().includes(query) ||
               item.customerPhone?.toLowerCase().includes(query) ||
               item.model?.toLowerCase().includes(query);
      }
      return false;
    });
  }, []);

  // Load data on mount
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  return {
    // Data
    customers,
    testDriveRequests,
    viewingRequests,
    
    // Loading states
    loading,
    
    // Error states
    errors,
    
    // Actions
    addCustomer,
    scheduleTestDrive,
    completeTestDrive,
    scheduleViewing,
    completeViewing,
    cancelViewing,
    refresh,
    
    // Utilities
    getFilteredData,
  };
};

export default useCustomerManagement;
