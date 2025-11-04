import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS, SIZES } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import { quotationService } from '../../services/quotationService';
import depositService from '../../services/depositService';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import CustomAlert from '../../components/common/CustomAlert';
import { ArrowLeft, Calendar, ChevronDown } from 'lucide-react-native';

const EditDepositScreen = ({ navigation, route }) => {
  const { deposit: initialDeposit, onDepositUpdate } = route.params;
  const { user } = useAuth();
  const { alertConfig, hideAlert, showSuccess, showError, showInfo, showConfirm } = useCustomAlert();
  
  const [formData, setFormData] = useState({
    quotationId: '',
    depositPercent: '10',
    depositAmount: '',
    holdDay: new Date(),
    status: 'PENDING',
  });

  const [loading, setLoading] = useState(false);
  const [loadingDeposit, setLoadingDeposit] = useState(true);
  const [loadingQuotation, setLoadingQuotation] = useState(false);
  const [errors, setErrors] = useState({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [quotationData, setQuotationData] = useState(null);

  useEffect(() => {
    loadDepositData();
  }, []);

  const loadDepositData = async () => {
    try {
      setLoadingDeposit(true);
      
      // If deposit has apiDepositId, fetch from API
      const depositId = initialDeposit?.apiDepositId || initialDeposit?.id;
      if (depositId) {
        const result = await depositService.getDepositById(depositId);
        if (result.success && result.data) {
          const apiDeposit = result.data;
          
          setFormData({
            quotationId: apiDeposit.quotationId?.toString() || '',
            depositPercent: apiDeposit.depositPercent?.toString() || '10',
            depositAmount: apiDeposit.depositAmount?.toString() || '',
            holdDay: apiDeposit.holdDays ? new Date(apiDeposit.holdDays) : (apiDeposit.holdDay ? new Date(apiDeposit.holdDay) : new Date()),
            status: apiDeposit.status || 'PENDING',
          });

          // If quotationId exists, load quotation details
          if (apiDeposit.quotationId) {
            await loadQuotationById(apiDeposit.quotationId);
          }
        }
      } else {
        // Fallback to initial deposit data
        if (initialDeposit) {
          setFormData({
            quotationId: initialDeposit.quotationId?.toString() || '',
            depositPercent: initialDeposit.depositPercentage?.toString() || '10',
            depositAmount: initialDeposit.depositAmount?.toString() || '',
            holdDay: initialDeposit.holdDay ? new Date(initialDeposit.holdDay) : new Date(),
            status: initialDeposit.status || 'PENDING',
          });
        }
      }
    } catch (error) {
      console.error('Error loading deposit:', error);
      showError('Error', 'Cannot load deposit information');
    } finally {
      setLoadingDeposit(false);
    }
  };

  const loadQuotationById = async (quotationId) => {
    try {
      setLoadingQuotation(true);
      setErrors(prev => ({ ...prev, quotationId: null }));

      const response = await quotationService.getQuotationById(quotationId);
      
      if (response.success && response.data) {
        const quotation = response.data;
        
        // Extract customer info from quotation (support multiple data structures)
        const customerName = quotation.customerName || quotation.customer?.name || quotation.customer?.fullName || 'N/A';
        const customerPhone = quotation.customerPhone || quotation.customer?.phone || quotation.customer?.phoneNumber || 'N/A';
        
        // Extract total amount (support multiple data structures)
        const totalAmount = quotation.totalAmount || 
                           quotation.pricing?.totalPrice || 
                           quotation.pricing?.finalPrice ||
                           quotation.finalPrice ||
                           quotation.items?.[0]?.price ||
                           0;
        
        const quotationInfo = {
          id: quotation.id?.toString() || '',
          quoteCode: quotation.quoteCode || `QG-${quotation.id}`,
          customerName: customerName,
          customerPhone: customerPhone,
          totalAmount: totalAmount,
          status: quotation.status || 'PENDING',
        };
        
        setQuotationData(quotationInfo);
        
        // Auto calculate deposit amount if depositPercent is set
        if (formData.depositPercent && quotationInfo.totalAmount) {
          const totalAmount = quotationInfo.totalAmount || 0;
          const depositPercent = parseFloat(formData.depositPercent) || 0;
          const calculatedAmount = (totalAmount * depositPercent) / 100;
          setFormData(prev => ({ ...prev, depositAmount: Math.round(calculatedAmount).toString() }));
        }
      } else {
        setQuotationData(null);
        // Ensure error is a string, not an object
        const errorMessage = typeof response.error === 'string' 
          ? response.error 
          : response.error?.message || response.error?.error || 'Quotation not found with this ID';
        setErrors(prev => ({ ...prev, quotationId: errorMessage }));
      }
    } catch (error) {
      console.error('Error loading quotation:', error);
      setQuotationData(null);
      // Ensure error is a string, not an object
      const errorMessage = error?.message || error?.error || 'Cannot load quotation information';
      setErrors(prev => ({ ...prev, quotationId: errorMessage }));
    } finally {
      setLoadingQuotation(false);
    }
  };

  // Load quotation by ID when quotationId changes (with debounce)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.quotationId && formData.quotationId.trim() !== '') {
        const quotationId = parseInt(formData.quotationId.trim());
        if (!isNaN(quotationId) && quotationId > 0) {
          loadQuotationById(quotationId);
        } else if (formData.quotationId.trim().length > 0) {
          setQuotationData(null);
          setErrors(prev => ({ ...prev, quotationId: 'Invalid quotation ID' }));
        }
      } else {
        setQuotationData(null);
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.quotationId;
          return newErrors;
        });
      }
    }, 800); // Debounce 800ms

    return () => clearTimeout(timeoutId);
  }, [formData.quotationId]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }

    // Auto calculate depositAmount when depositPercent changes (if quotation data exists)
    if (field === 'depositPercent' && quotationData && quotationData.totalAmount) {
      const totalAmount = quotationData.totalAmount || 0;
      const depositPercent = parseFloat(value) || 0;
      const calculatedAmount = (totalAmount * depositPercent) / 100;
      setFormData(prev => ({ ...prev, depositAmount: Math.round(calculatedAmount).toString() }));
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setFormData(prev => ({ ...prev, holdDay: selectedDate }));
      if (errors.holdDay) {
        setErrors(prev => ({ ...prev, holdDay: null }));
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.quotationId || !quotationData) {
      newErrors.quotationId = 'Please enter a valid quotation ID';
    }

    if (!formData.depositPercent || parseFloat(formData.depositPercent) <= 0) {
      newErrors.depositPercent = 'Please enter a valid deposit percentage (0-100)';
    }

    if (!formData.depositAmount || parseFloat(formData.depositAmount) <= 0) {
      newErrors.depositAmount = 'Please enter deposit amount';
    }

    if (!formData.holdDay) {
      newErrors.holdDay = 'Please select hold date';
    }

    if (!formData.status) {
      newErrors.status = 'Please select status';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    showConfirm(
      'Confirm Update Deposit',
      `Are you sure you want to update the deposit?\n\nQuotation: #${quotationData?.quoteCode || formData.quotationId}\nPercentage: ${formData.depositPercent}%\nAmount: ${formatCurrency(parseFloat(formData.depositAmount))}`,
      async () => {
        try {
          setLoading(true);

          const depositId = initialDeposit?.apiDepositId || initialDeposit?.id;
          if (!depositId) {
            showError('Error', 'Deposit ID not found');
            return;
          }

          const updateData = {
            depositPercent: parseFloat(formData.depositPercent),
            depositAmount: parseFloat(formData.depositAmount),
            holdDays: formData.holdDay.toISOString(),
            status: formData.status,
          };

          const result = await depositService.updateDepositStatus(depositId, updateData);

          if (result.success) {
            showSuccess('Success', 'Deposit updated successfully!');
            // Call update callback if provided
            if (onDepositUpdate) {
              onDepositUpdate();
            }
            setTimeout(() => {
              navigation.goBack();
            }, 1500);
          } else {
            showError('Error', result.error || 'Cannot update deposit');
          }
        } catch (error) {
          console.error('Error updating deposit:', error);
          showError('Error', 'Cannot update deposit. Please try again.');
        } finally {
          setLoading(false);
        }
      },
      null // onCancel - just close the alert
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDate = (date) => {
    if (!date) return 'Select Date';
    return new Date(date).toLocaleDateString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getStatusText = (status) => {
    switch (status?.toUpperCase()) {
      case 'PENDING': return 'Pending';
      case 'HOLDING': return 'Holding';
      case 'APPLIED': return 'Applied';
      case 'EXPIRED': return 'Expired';
      default: return 'Pending';
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'PENDING': return COLORS.WARNING;
      case 'HOLDING': return COLORS.SUCCESS;
      case 'APPLIED': return COLORS.PRIMARY;
      case 'EXPIRED': return COLORS.ERROR;
      default: return COLORS.TEXT.SECONDARY;
    }
  };

  if (loadingDeposit) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={24} color={COLORS.TEXT.WHITE} />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={styles.headerTitleText}>Edit Deposit</Text>
            <Text style={styles.headerSubtitle}>Update Deposit Information</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Quotation ID Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quotation ID *</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.inputTextInput, errors.quotationId && styles.inputError]}
                placeholder="Enter Quotation ID"
                placeholderTextColor={COLORS.TEXT.SECONDARY}
                value={formData.quotationId}
                onChangeText={(value) => handleInputChange('quotationId', value)}
                keyboardType="numeric"
              />
              {loadingQuotation && (
                <ActivityIndicator 
                  size="small" 
                  color={COLORS.PRIMARY} 
                  style={styles.loadingIndicator}
                />
              )}
            </View>
            {errors.quotationId && typeof errors.quotationId === 'string' && (
              <Text style={styles.errorText}>{errors.quotationId}</Text>
            )}
            {quotationData && !loadingQuotation && (
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  <Text style={styles.infoLabel}>Quote Code: </Text>
                  {quotationData.quoteCode}
                </Text>
                <Text style={styles.infoText}>
                  <Text style={styles.infoLabel}>Customer: </Text>
                  {quotationData.customerName}
                </Text>
                <Text style={styles.infoText}>
                  <Text style={styles.infoLabel}>Phone: </Text>
                  {quotationData.customerPhone}
                </Text>
                <Text style={styles.infoText}>
                  <Text style={styles.infoLabel}>Total Price: </Text>
                  {formatCurrency(quotationData.totalAmount)}
                </Text>
              </View>
            )}
          </View>

          {/* Deposit Percent */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Deposit Percentage (%) *</Text>
            <TextInput
              style={[styles.inputTextInput, errors.depositPercent && styles.inputError]}
              placeholder="Enter deposit percentage (0-100)"
              placeholderTextColor={COLORS.TEXT.SECONDARY}
              value={formData.depositPercent}
              onChangeText={(value) => handleInputChange('depositPercent', value)}
              keyboardType="numeric"
            />
            {errors.depositPercent && (
              <Text style={styles.errorText}>{errors.depositPercent}</Text>
            )}
          </View>

          {/* Deposit Amount */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Deposit Amount (VND) *</Text>
            <TextInput
              style={[styles.inputTextInput, errors.depositAmount && styles.inputError]}
              placeholder="Enter deposit amount"
              placeholderTextColor={COLORS.TEXT.SECONDARY}
              value={formData.depositAmount}
              onChangeText={(value) => handleInputChange('depositAmount', value)}
              keyboardType="numeric"
            />
            {errors.depositAmount && (
              <Text style={styles.errorText}>{errors.depositAmount}</Text>
            )}
          </View>

          {/* Hold Day */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hold Date *</Text>
            <TouchableOpacity
              style={[styles.input, errors.holdDay && styles.inputError]}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.inputText}>{formatDate(formData.holdDay)}</Text>
              <Calendar size={20} color={COLORS.TEXT.SECONDARY} />
            </TouchableOpacity>
            {errors.holdDay && (
              <Text style={styles.errorText}>{errors.holdDay}</Text>
            )}
          </View>

          {/* Status */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Status *</Text>
            <TouchableOpacity
              style={[styles.input, errors.status && styles.inputError]}
              onPress={() => setShowStatusModal(true)}
            >
              <Text style={styles.inputText}>{getStatusText(formData.status)}</Text>
              <ChevronDown size={20} color={COLORS.TEXT.SECONDARY} />
            </TouchableOpacity>
            {errors.status && (
              <Text style={styles.errorText}>{errors.status}</Text>
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <LinearGradient
              colors={loading ? [COLORS.TEXT.SECONDARY, COLORS.TEXT.SECONDARY] : COLORS.GRADIENT.BLUE}
              style={styles.submitButtonGradient}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.TEXT.WHITE} />
              ) : (
                <Text style={styles.submitButtonText}>Update Deposit</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>

        {/* Status Selection Modal */}
        <Modal
          visible={showStatusModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowStatusModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Status</Text>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setShowStatusModal(false)}
                >
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.statusOptions}>
                {['PENDING', 'HOLDING', 'APPLIED', 'EXPIRED'].map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusOption,
                      formData.status === status && styles.statusOptionSelected,
                    ]}
                    onPress={() => {
                      setFormData(prev => ({ ...prev, status }));
                      setShowStatusModal(false);
                      if (errors.status) {
                        setErrors(prev => ({ ...prev, status: null }));
                      }
                    }}
                  >
                    <Text
                      style={[
                        styles.statusOptionText,
                        formData.status === status && styles.statusOptionTextSelected,
                      ]}
                    >
                      {getStatusText(status)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </Modal>

        {/* Date Picker */}
        {showDatePicker && (
          <DateTimePicker
            value={formData.holdDay}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
          />
        )}

        <CustomAlert
          visible={alertConfig.visible}
          title={alertConfig.title}
          message={alertConfig.message}
          type={alertConfig.type}
          showCancel={alertConfig.showCancel}
          confirmText={alertConfig.confirmText}
          cancelText={alertConfig.cancelText}
          onConfirm={alertConfig.onConfirm}
          onCancel={alertConfig.onCancel}
          onClose={hideAlert}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.PADDING.LARGE,
    paddingTop: SIZES.PADDING.MEDIUM,
    paddingBottom: SIZES.PADDING.SMALL,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitleText: {
    fontSize: SIZES.FONT.HEADER,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
  headerSubtitle: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    marginTop: 2,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.SURFACE,
    borderTopLeftRadius: SIZES.RADIUS.XXLARGE,
    borderTopRightRadius: SIZES.RADIUS.XXLARGE,
    padding: SIZES.PADDING.LARGE,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SIZES.PADDING.MEDIUM,
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
  },
  section: {
    marginBottom: SIZES.PADDING.LARGE,
  },
  sectionTitle: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SIZES.PADDING.SMALL,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F5',
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.MEDIUM,
    minHeight: 48,
  },
  inputTextInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.MEDIUM,
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
  },
  inputText: {
    flex: 1,
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
  },
  placeholder: {
    flex: 1,
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
  },
  inputError: {
    borderWidth: 1,
    borderColor: COLORS.ERROR,
  },
  errorText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.ERROR,
    marginTop: SIZES.PADDING.XSMALL,
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    borderRadius: SIZES.RADIUS.SMALL,
    padding: SIZES.PADDING.SMALL,
    marginTop: SIZES.PADDING.SMALL,
  },
  loadingIndicator: {
    position: 'absolute',
    right: SIZES.PADDING.MEDIUM,
  },
  infoText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.PRIMARY,
    marginBottom: 2,
  },
  infoLabel: {
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
  },
  submitButton: {
    borderRadius: SIZES.RADIUS.MEDIUM,
    overflow: 'hidden',
    marginTop: SIZES.PADDING.LARGE,
    marginBottom: SIZES.PADDING.XXXLARGE,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonGradient: {
    paddingVertical: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.LARGE,
    width: '80%',
    maxWidth: 400,
    paddingBottom: SIZES.PADDING.LARGE,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.PADDING.LARGE,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  modalTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.BACKGROUND.SECONDARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: SIZES.FONT.LARGE,
    color: COLORS.TEXT.WHITE,
    fontWeight: 'bold',
  },
  statusOptions: {
    padding: SIZES.PADDING.MEDIUM,
  },
  statusOption: {
    padding: SIZES.PADDING.MEDIUM,
    borderRadius: SIZES.RADIUS.MEDIUM,
    marginBottom: SIZES.PADDING.SMALL,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  statusOptionSelected: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  statusOptionText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '500',
  },
  statusOptionTextSelected: {
    color: COLORS.TEXT.WHITE,
    fontWeight: 'bold',
  },
});

export default EditDepositScreen;

