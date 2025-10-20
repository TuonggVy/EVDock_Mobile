import CustomerManagementService from '../services/customerManagementService';

/**
 * Test utility to simulate adding customer from quotation
 * This can be used for testing the payment completion flow
 */

const customerService = new CustomerManagementService();

/**
 * Test quotation data that simulates a completed payment
 */
export const testQuotationData = {
  id: 'Q_TEST_001',
  customerName: 'Nguyễn Văn Test',
  customerPhone: '0901234567',
  customerEmail: 'test@email.com',
  vehicleModel: 'Tesla Model Y',
  vehicle: {
    name: 'Tesla Model Y',
    selectedColor: 'Đen',
  },
  pricing: {
    totalPrice: 1250000000,
  },
  totalAmount: 1250000000,
  status: 'paid',
  paymentStatus: 'completed',
  paymentCompletedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  dealerId: 'dealer001',
  createdBy: 'staff001',
};

/**
 * Test the customer addition flow
 */
export const testCustomerAddition = async () => {
  try {
    console.log('🧪 Testing customer addition from quotation...');
    
    // Add customer from test quotation
    const newCustomer = await customerService.addCustomerFromQuotation(testQuotationData);
    
    console.log('✅ Customer added successfully:', newCustomer);
    
    // Verify customer was added to storage
    const allCustomers = await customerService.getCustomers();
    console.log('📋 Total customers in storage:', allCustomers.length);
    
    // Check if our test customer exists
    const testCustomer = allCustomers.find(c => c.quotationId === testQuotationData.id);
    if (testCustomer) {
      console.log('✅ Test customer found in storage:', testCustomer);
    } else {
      console.log('❌ Test customer not found in storage');
    }
    
    return {
      success: true,
      newCustomer,
      totalCustomers: allCustomers.length,
    };
  } catch (error) {
    console.error('❌ Error testing customer addition:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Clear test data from storage
 */
export const clearTestData = async () => {
  try {
    const allCustomers = await customerService.getCustomers();
    const filteredCustomers = allCustomers.filter(c => c.quotationId !== testQuotationData.id);
    
    if (filteredCustomers.length !== allCustomers.length) {
      await customerService.saveCustomersToStorage(filteredCustomers);
      console.log('🧹 Test data cleared from storage');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error clearing test data:', error);
    return false;
  }
};

export default {
  testQuotationData,
  testCustomerAddition,
  clearTestData,
};
