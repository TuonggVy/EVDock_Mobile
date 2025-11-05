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
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    setErrors({});
    
    if (!validateForm()) {
      const firstError = Object.values(errors)[0];
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
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
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

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={COLORS.PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Batch</Text>
        <TouchableOpacity
          style={[styles.saveButton, updating && styles.saveButtonDisabled]}
          onPress={handleSubmit}
          disabled={updating}
        >
          {updating ? (
            <ActivityIndicator size="small" color={COLORS.PRIMARY} />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
            <Text style={[
              styles.dropdownButtonText,
              !formData.dueDate && styles.dropdownButtonTextPlaceholder
            ]}>
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
      </ScrollView>

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
    padding: SIZES.PADDING.LARGE,
    paddingTop: SIZES.PADDING.XXXLARGE,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
  saveButton: {
    paddingHorizontal: SIZES.PADDING.LARGE,
    paddingVertical: SIZES.PADDING.SMALL,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: SIZES.RADIUS.SMALL,
  },
  saveButtonDisabled: { opacity: 0.5 },
  saveButtonText: { color: COLORS.TEXT.WHITE, fontWeight: '600' },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
  },
  content: { padding: SIZES.PADDING.LARGE },
  inputGroup: { marginBottom: SIZES.PADDING.LARGE },
  inputLabel: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: '600',
    color: COLORS.TEXT.WHITE,
    marginBottom: SIZES.PADDING.SMALL,
  },
  textInput: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.LARGE,
    padding: SIZES.PADDING.MEDIUM,
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
  },
  inputError: { borderWidth: 1, borderColor: COLORS.ERROR },
  errorText: { color: COLORS.ERROR, fontSize: SIZES.FONT.SMALL, marginTop: 4 },
  readOnlyInput: {
    backgroundColor: "#BABABA",
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
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.LARGE,
    padding: SIZES.PADDING.MEDIUM,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownButtonText: { fontSize: SIZES.FONT.MEDIUM, color: COLORS.TEXT.PRIMARY },
  dropdownButtonTextPlaceholder: { color: COLORS.TEXT.SECONDARY },
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
  modalTitle: { fontSize: SIZES.FONT.LARGE, fontWeight: 'bold', color: COLORS.TEXT.PRIMARY },
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
});

export default EditBatchScreen;
