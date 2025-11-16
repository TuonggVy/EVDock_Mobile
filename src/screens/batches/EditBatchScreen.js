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
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS, SIZES } from '../../constants';
import CustomAlert from '../../components/common/CustomAlert';
import batchManagementService from '../../services/batchManagementService';
import { ArrowLeft, Calendar, PencilOff, ChevronDown, X } from 'lucide-react-native';

const EditBatchScreen = ({ navigation, route }) => {
  const { batchId, batch } = route.params || {};
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    amount: '',
    status: '',
    dueDate: new Date(),
  });

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [errors, setErrors] = useState({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'info' });

  useEffect(() => {
    loadBatchDetail();
  }, []);

  const loadBatchDetail = async () => {
    try {
      setLoading(true);
      const response = await batchManagementService.getBatchDetail(batchId);
      
      if (response.success && response.data) {
        const batchData = response.data;
        setFormData({
          invoiceNumber: batchData.invoiceNumber?.toString() || '',
          amount: batchData.amount?.toString() || '',
          status: batchData.status || 'OPEN',
          dueDate: batchData.dueDate ? new Date(batchData.dueDate) : new Date(),
        });
      } else {
        setAlertConfig({
          title: 'Error',
          message: response.error || 'Cannot load batch detail',
          type: 'error'
        });
        setShowAlert(true);
        setTimeout(() => navigation.goBack(), 2000);
      }
    } catch (error) {
      console.error('Error loading batch detail:', error);
      setAlertConfig({
        title: 'Error',
        message: 'Cannot load batch detail',
        type: 'error'
      });
      setShowAlert(true);
      setTimeout(() => navigation.goBack(), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleDateChange = (event, selectedDate) => {
    // Keep picker open on iOS (close via tapping outside modal), auto-close on Android
    setShowDatePicker(Platform.OS === 'ios');

    if (event?.type === 'dismissed') {
      return;
    }

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

  const formatPrice = (amount) => {
    if (!amount) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'OPEN':
        return COLORS.WARNING;
      case 'PARTIAL':
        return COLORS.PRIMARY;
      case 'CLOSED':
        return COLORS.SUCCESS;
      case 'OVERDUE':
        return COLORS.ERROR;
      default:
        return COLORS.TEXT.SECONDARY;
    }
  };

  const statusOptions = ['OPEN', 'PARTIAL', 'CLOSED', 'OVERDUE'];

  const validateForm = () => {
    const newErrors = {};

    if (!formData.invoiceNumber || formData.invoiceNumber.trim() === '') {
      newErrors.invoiceNumber = 'Invoice number is required';
    } else if (isNaN(parseInt(formData.invoiceNumber))) {
      newErrors.invoiceNumber = 'Invoice number must be a number';
    }

    if (!formData.amount || formData.amount.trim() === '') {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be a positive number';
    }

    if (!formData.status || formData.status.trim() === '') {
      newErrors.status = 'Status is required';
    }

    if (!formData.dueDate) {
      newErrors.dueDate = 'Due date is required';
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
          type: 'error'
        });
        setShowAlert(true);
      }
      return;
    }

    setUpdating(true);
    try {
      const batchData = {
        invoiceNumber: parseInt(formData.invoiceNumber),
        amount: parseFloat(formData.amount),
        status: formData.status || 'OPEN',
        dueDate: formatDateForAPI(formData.dueDate),
      };

      const response = await batchManagementService.updateBatch(batchId, batchData);

      if (response.success) {
        setAlertConfig({
          title: 'Success',
          message: 'Batch updated successfully!',
          type: 'success'
        });
        setShowAlert(true);
        setTimeout(() => {
          navigation.goBack();
        }, 1500);
      } else {
        const errorMessage = typeof response.error === 'string' 
          ? response.error 
          : (response.error?.message || JSON.stringify(response.error) || 'Failed to update batch');
        setAlertConfig({
          title: 'Error',
          message: errorMessage,
          type: 'error'
        });
        setShowAlert(true);
      }
    } catch (error) {
      console.error('Error updating batch:', error);
      setAlertConfig({
        title: 'Error',
        message: 'An unexpected error occurred',
        type: 'error'
      });
      setShowAlert(true);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#009DFF" />
      </View>
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
          <ArrowLeft size={22} color={COLORS.TEXT.WHITE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Batch</Text>
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
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Invoice Number</Text>
                <View style={[styles.textInput, styles.readOnlyInput, styles.readOnlyContainer]}>
                  <Text style={styles.readOnlyText}>{formData.invoiceNumber || 'N/A'}</Text>
                  <PencilOff size={16} color={COLORS.TEXT.SECONDARY} />
                </View>
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
                <Text style={styles.inputLabel}>Status *</Text>
                <TouchableOpacity
                  style={[styles.dropdownButton, errors.status && styles.inputError]}
                  onPress={() => setShowStatusModal(true)}
                >
                  <View style={styles.statusDisplay}>
                    {formData.status && (
                      <View style={[styles.statusBadgePreview, { backgroundColor: getStatusColor(formData.status) + '20' }]}>
                        <Text style={[styles.statusTextPreview, { color: getStatusColor(formData.status) }]}>
                          {formData.status}
                        </Text>
                      </View>
                    )}
                    {!formData.status && (
                      <Text style={styles.dropdownButtonTextPlaceholder}>Select Status</Text>
                    )}
                  </View>
                  <ChevronDown size={20} color={COLORS.TEXT.SECONDARY} />
                </TouchableOpacity>
                {errors.status && <Text style={styles.errorText}>{errors.status}</Text>}
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
              </View>

              <TouchableOpacity
                style={[styles.submitButton, updating && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={updating}
                activeOpacity={0.85}
              >
                {updating ? (
                  <ActivityIndicator size="small" color={COLORS.TEXT.WHITE} />
                ) : (
                  <Text style={styles.submitButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      {/* Status Modal */}
      <Modal
        visible={showStatusModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowStatusModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Status</Text>
              <TouchableOpacity onPress={() => setShowStatusModal(false)}>
                <X size={24} color={COLORS.TEXT.SECONDARY} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {statusOptions.map((status) => {
                const statusColor = getStatusColor(status);
                return (
                  <TouchableOpacity
                    key={status}
                    style={styles.modalItem}
                    onPress={() => {
                      handleInputChange('status', status);
                      setShowStatusModal(false);
                    }}
                  >
                    <View style={[styles.statusBadgeModal, { backgroundColor: statusColor + '20' }]}>
                      <Text style={[styles.statusTextModal, { color: statusColor }]}>
                        {status}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Due Date Picker Modal */}
      {showDatePicker && (
        <Modal
          visible={showDatePicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowDatePicker(false)}>
            <View style={styles.datePickerOverlay}>
              <TouchableWithoutFeedback onPress={() => {}}>
                <View style={styles.datePickerContainer}>
                  <DateTimePicker
                    value={formData.dueDate || new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleDateChange}
                    minimumDate={new Date()}
                    locale="vi-VN"
                    textColor="#000"
                  />
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}
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
  readOnlyInput: {
    backgroundColor: '#E0E0E0',
    borderColor: 'transparent',
  },
  readOnlyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: SIZES.PADDING.MEDIUM,
  },
  readOnlyText: {
    color: COLORS.TEXT.SECONDARY,
    flex: 1,
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
  statusDisplay: {
    flex: 1,
  },
  statusBadgePreview: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: SIZES.RADIUS.SMALL,
    alignSelf: 'flex-start',
  },
  statusTextPreview: {
    fontSize: SIZES.FONT.SMALL,
    fontWeight: '600',
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
  statusBadgeModal: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: SIZES.RADIUS.SMALL,
    alignSelf: 'flex-start',
  },
  statusTextModal: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: '600',
  },
  datePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerContainer: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.LARGE,
    padding: SIZES.PADDING.LARGE,
    width: '90%',
  },
});

export default EditBatchScreen;
