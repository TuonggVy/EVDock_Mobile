import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  TextInput,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS, SIZES } from '../../constants';
import CustomAlert from '../../components/common/CustomAlert';
import batchManagementService from '../../services/batchManagementService';
import agencyService from '../../services/agencyService';
import orderRestockService from '../../services/orderRestockService';
import { ArrowLeft, Calendar, ChevronDown, X } from 'lucide-react-native';

const CreateBatchScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    amount: '',
    dueDate: new Date(),
    agencyId: '',
    agencyOrderId: '',
  });

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [errors, setErrors] = useState({});
  const [agencies, setAgencies] = useState([]);
  const [agencyOrders, setAgencyOrders] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showAgencyModal, setShowAgencyModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'info' });

  useEffect(() => {
    loadAgencies();
  }, []);

  useEffect(() => {
    if (formData.agencyId) {
      loadAgencyOrders(formData.agencyId);
    } else {
      setAgencyOrders([]);
      setFormData(prev => ({ ...prev, agencyOrderId: '' }));
    }
  }, [formData.agencyId]);

  const loadAgencies = async () => {
    try {
      const response = await agencyService.getAgencies({ limit: 100 });
      if (response.success) {
        setAgencies(response.data || []);
      }
    } catch (error) {
      console.error('Error loading agencies:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAgencyOrders = async (agencyId) => {
    try {
      setLoadingOrders(true);
      const response = await orderRestockService.getOrderRestockList({
        page: 1,
        limit: 100,
        agencyId: parseInt(agencyId),
      });
      
      if (response.success) {
        // Filter out DRAFT and CANCELED orders, sort by date
        const orders = (response.data || [])
          .filter(order => order.status !== 'DRAFT' && order.status !== 'CANCELED')
          .sort((a, b) => {
            const dateA = new Date(a.orderAt || a.createdAt || 0);
            const dateB = new Date(b.orderAt || b.createdAt || 0);
            return dateB - dateA;
          });
        setAgencyOrders(orders);
      } else {
        setAgencyOrders([]);
      }
    } catch (error) {
      console.error('Error loading agency orders:', error);
      setAgencyOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setFormData(prev => ({ ...prev, dueDate: selectedDate }));
      if (errors.dueDate) {
        setErrors(prev => ({ ...prev, dueDate: null }));
      }
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Select Date';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatDateForAPI = (date) => {
    return new Date(date).toISOString();
  };

  const getAgencyName = (agencyId) => {
    if (!agencyId) return 'Select Agency';
    const agency = agencies.find(a => a.id === parseInt(agencyId) || a.id?.toString() === agencyId?.toString());
    return agency?.name || `Agency ${agencyId}`;
  };

  const getOrderDisplay = (orderId) => {
    if (!orderId) return 'Select Order';
    const order = agencyOrders.find(o => o.id === parseInt(orderId) || o.id?.toString() === orderId?.toString());
    if (order) {
      const orderDate = order.orderAt ? formatDate(order.orderAt) : 'N/A';
      const total = order.subtotal || order.subTotal || order.finalPrice || 0;
      return `Order #${order.id} - ${formatPrice(total)} - ${orderDate}`;
    }
    return `Order #${orderId}`;
  };

  const formatPrice = (amount) => {
    if (!amount) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.invoiceNumber || formData.invoiceNumber.trim() === '') {
      newErrors.invoiceNumber = 'Invoice number is required';
    } else if (isNaN(parseInt(formData.invoiceNumber, 10))) {
      newErrors.invoiceNumber = 'Invoice number must be a number';
    }

    if (!formData.amount || formData.amount.trim() === '') {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be a positive number';
    }

    if (!formData.dueDate) {
      newErrors.dueDate = 'Due date is required';
    }

    if (!formData.agencyId) {
      newErrors.agencyId = 'Agency is required';
    }

    if (!formData.agencyOrderId) {
      newErrors.agencyOrderId = 'Agency order is required';
    }

    setErrors(newErrors);
    return newErrors;
  };

  const handleSubmit = async () => {
    setErrors({});

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      const firstError = Object.values(validationErrors)[0];
      if (firstError) {
        setAlertConfig({
          title: 'Validation Error',
          message: firstError,
          type: 'error',
        });
        setShowAlert(true);
      }
      return;
    }

    setCreating(true);
    try {
      const batchData = {
        invoiceNumber: parseInt(formData.invoiceNumber),
        amount: parseFloat(formData.amount),
        dueDate: formatDateForAPI(formData.dueDate),
        agencyId: parseInt(formData.agencyId),
        agencyOrderId: parseInt(formData.agencyOrderId),
      };

      const response = await batchManagementService.createBatch(batchData);

      if (response.success) {
        setAlertConfig({
          title: 'Success',
          message: 'Batch created successfully!',
          type: 'success'
        });
        setShowAlert(true);
        setTimeout(() => {
          navigation.goBack();
        }, 1500);
      } else {
        const errorMessage = typeof response.error === 'string' 
          ? response.error 
          : (response.error?.message || JSON.stringify(response.error) || 'Failed to create batch');
        setAlertConfig({
          title: 'Error',
          message: errorMessage,
          type: 'error'
        });
        setShowAlert(true);
      }
    } catch (error) {
      console.error('Error creating batch:', error);
      setAlertConfig({
        title: 'Error',
        message: 'An unexpected error occurred',
        type: 'error'
      });
      setShowAlert(true);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#009DFF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <CustomAlert
        visible={showAlert}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setShowAlert(false)}
      />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={COLORS.TEXT.WHITE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Batch</Text>
        <View style={styles.headerActions} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.contentWrapper}>
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Batch Information</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Invoice Number *</Text>
                <TextInput
                  style={[styles.textInput, errors.invoiceNumber && styles.inputError]}
                  value={formData.invoiceNumber}
                  onChangeText={(value) => handleInputChange('invoiceNumber', value)}
                  placeholder="Enter invoice number"
                  placeholderTextColor={COLORS.TEXT.SECONDARY}
                  keyboardType="numeric"
                />
                {errors.invoiceNumber && <Text style={styles.errorText}>{errors.invoiceNumber}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Amount *</Text>
                <TextInput
                  style={[styles.textInput, errors.amount && styles.inputError]}
                  value={formData.amount}
                  onChangeText={(value) => handleInputChange('amount', value)}
                  placeholder="Enter amount"
                  placeholderTextColor={COLORS.TEXT.SECONDARY}
                  keyboardType="numeric"
                />
                {errors.amount && <Text style={styles.errorText}>{errors.amount}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Due Date *</Text>
                <TouchableOpacity
                  style={[styles.dropdownButton, errors.dueDate && styles.inputError]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text
                    style={[
                      styles.dropdownButtonText,
                      !formData.dueDate && styles.dropdownButtonTextPlaceholder,
                    ]}
                  >
                    {formatDate(formData.dueDate)}
                  </Text>
                  <Calendar size={20} color={COLORS.TEXT.SECONDARY} />
                </TouchableOpacity>
                {errors.dueDate && <Text style={styles.errorText}>{errors.dueDate}</Text>}
                {showDatePicker && (
                  <DateTimePicker
                    value={formData.dueDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleDateChange}
                    minimumDate={new Date()}
                  />
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Agency *</Text>
                <TouchableOpacity
                  style={[styles.dropdownButton, errors.agencyId && styles.inputError]}
                  onPress={() => setShowAgencyModal(true)}
                >
                  <Text
                    style={[
                      styles.dropdownButtonText,
                      !formData.agencyId && styles.dropdownButtonTextPlaceholder,
                    ]}
                  >
                    {getAgencyName(formData.agencyId)}
                  </Text>
                  <ChevronDown size={20} color={COLORS.TEXT.SECONDARY} />
                </TouchableOpacity>
                {errors.agencyId && <Text style={styles.errorText}>{errors.agencyId}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Agency Order *</Text>
                <TouchableOpacity
                  style={[styles.dropdownButton, errors.agencyOrderId && styles.inputError]}
                  onPress={() => {
                    if (!formData.agencyId) {
                      setAlertConfig({
                        title: 'Error',
                        message: 'Please select an agency first',
                        type: 'error',
                      });
                      setShowAlert(true);
                      return;
                    }
                    setShowOrderModal(true);
                  }}
                  disabled={!formData.agencyId || loadingOrders}
                >
                  {loadingOrders ? (
                    <ActivityIndicator size="small" color="#009DFF" />
                  ) : (
                    <>
                      <Text
                        style={[
                          styles.dropdownButtonText,
                          !formData.agencyOrderId && styles.dropdownButtonTextPlaceholder,
                        ]}
                      >
                        {getOrderDisplay(formData.agencyOrderId)}
                      </Text>
                      <ChevronDown size={20} color={COLORS.TEXT.SECONDARY} />
                    </>
                  )}
                </TouchableOpacity>
                {errors.agencyOrderId && <Text style={styles.errorText}>{errors.agencyOrderId}</Text>}
              </View>

              <TouchableOpacity
                style={[styles.submitButton, creating && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={creating}
                activeOpacity={0.85}
              >
                {creating ? (
                  <ActivityIndicator size="small" color={COLORS.TEXT.WHITE} />
                ) : (
                  <Text style={styles.submitButtonText}>Create Batch</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      {/* Agency Modal */}
      <Modal
        visible={showAgencyModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAgencyModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Agency</Text>
              <TouchableOpacity onPress={() => setShowAgencyModal(false)}>
                <X size={24} color={COLORS.TEXT.SECONDARY} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {agencies.map((agency) => (
                <TouchableOpacity
                  key={agency.id}
                  style={styles.modalItem}
                  onPress={() => {
                    handleInputChange('agencyId', agency.id.toString());
                    setShowAgencyModal(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{agency.name || `Agency ${agency.id}`}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Order Modal */}
      <Modal
        visible={showOrderModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowOrderModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Order</Text>
              <TouchableOpacity onPress={() => setShowOrderModal(false)}>
                <X size={24} color={COLORS.TEXT.SECONDARY} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {agencyOrders.length === 0 ? (
                <View style={styles.modalItem}>
                  <Text style={styles.modalItemText}>No orders available</Text>
                </View>
              ) : (
                agencyOrders.map((order) => (
                  <TouchableOpacity
                    key={order.id}
                    style={styles.modalItem}
                    onPress={() => {
                      handleInputChange('agencyOrderId', order.id.toString());
                      setShowOrderModal(false);
                    }}
                  >
                    <Text style={styles.modalItemText}>
                      Order #{order.id} - {formatPrice(order.subtotal || order.subTotal || order.finalPrice || 0)} - {formatDate(order.orderAt)} - {order.status || 'N/A'}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.PADDING.LARGE,
    paddingTop: Platform.OS === 'ios' ? SIZES.PADDING.XLARGE : SIZES.PADDING.XXXLARGE + 5,
    paddingBottom: SIZES.PADDING.MEDIUM,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: SIZES.FONT.XXLARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
  headerActions: {
    width: 40,
    alignItems: 'flex-end',
  },
  keyboardView: {
    flex: 1,
  },
  contentWrapper: {
    flex: 1,
    backgroundColor: COLORS.SURFACE,
    borderTopLeftRadius: SIZES.RADIUS.XXLARGE,
    borderTopRightRadius: SIZES.RADIUS.XXLARGE,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: SIZES.PADDING.XXXLARGE,
  },
  formSection: {
    padding: SIZES.PADDING.LARGE,
  },
  sectionTitle: {
    fontSize: SIZES.FONT.XLARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SIZES.PADDING.LARGE,
  },
  inputGroup: {
    marginBottom: SIZES.PADDING.LARGE,
  },
  inputLabel: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SIZES.PADDING.SMALL,
  },
  textInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.MEDIUM,
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
    borderWidth: 1,
    borderColor: COLORS.BORDER.PRIMARY,
  },
  inputError: {
    borderColor: COLORS.ERROR,
  },
  errorText: {
    color: COLORS.ERROR,
    fontSize: SIZES.FONT.SMALL,
    marginTop: SIZES.PADDING.XSMALL,
  },
  dropdownButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.MEDIUM,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.BORDER.PRIMARY,
  },
  dropdownButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
  },
  dropdownButtonTextPlaceholder: {
    color: COLORS.TEXT.SECONDARY,
  },
  submitButton: {
    backgroundColor: '#009DFF',
    borderRadius: SIZES.RADIUS.LARGE,
    paddingVertical: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
    marginTop: SIZES.PADDING.XXLARGE,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.SURFACE,
    borderTopLeftRadius: SIZES.RADIUS.LARGE,
    borderTopRightRadius: SIZES.RADIUS.LARGE,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.PADDING.LARGE,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  modalTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
  },
  modalItem: {
    padding: SIZES.PADDING.MEDIUM,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  modalItemText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
  },
});

export default CreateBatchScreen;
