import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
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
import { ArrowLeft, Calendar } from 'lucide-react-native';

const CreateDepositScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const { alertConfig, hideAlert, showSuccess, showError, showInfo, showConfirm } = useCustomAlert();
  
  // Get quotationId from route params if available
  const initialQuotationId = route?.params?.quotationId || '';
  
  const [formData, setFormData] = useState({
    quotationId: initialQuotationId,
    depositPercent: '10',
    depositAmount: '',
    holdDay: new Date(),
  });

  const [loading, setLoading] = useState(false);
  const [loadingQuotation, setLoadingQuotation] = useState(false);
  const [errors, setErrors] = useState({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [quotationData, setQuotationData] = useState(null);

  const loadQuotationById = useCallback(async (quotationId) => {
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
  }, [formData.depositPercent]);

  // Load quotation immediately if quotationId is passed from route params
  useEffect(() => {
    if (initialQuotationId && initialQuotationId.trim() !== '') {
      const quotationId = parseInt(initialQuotationId.trim());
      if (!isNaN(quotationId) && quotationId > 0) {
        loadQuotationById(quotationId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Load quotation by ID when quotationId changes (with debounce)
  useEffect(() => {
    // Skip if this is the initial load from route params
    if (initialQuotationId && formData.quotationId === initialQuotationId) {
      return;
    }

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
  }, [formData.quotationId, loadQuotationById, initialQuotationId]);

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    showConfirm(
      'Confirm Create Deposit',
      `Are you sure you want to create a deposit?\n\nQuotation: #${quotationData?.quoteCode || formData.quotationId}\nPercentage: ${formData.depositPercent}%\nAmount: ${formatCurrency(parseFloat(formData.depositAmount))}`,
      async () => {
        try {
          setLoading(true);

          const depositData = {
            quotationId: parseInt(formData.quotationId),
            depositPercent: parseFloat(formData.depositPercent),
            depositAmount: parseFloat(formData.depositAmount),
            holdDays: formData.holdDay.toISOString(),
          };

          const result = await depositService.createDeposit(depositData);

          if (result.success) {
            showSuccess('Success', 'Deposit created successfully!');
            // Pass deposit data back to previous screen
            const depositId = result.data?.id;
            setTimeout(() => {
              // Navigate back to QuotationDetail and pass deposit info
              const quotation = route.params?.quotation || { id: parseInt(formData.quotationId) };
              navigation.navigate('QuotationDetail', {
                quotation: quotation,
                onQuotationUpdate: route.params?.onQuotationUpdate,
                refreshDeposit: true,
                depositId: depositId,
              });
            }, 1500);
          } else {
            showError('Error', result.error || 'Cannot create deposit');
          }
        } catch (error) {
          console.error('Error creating deposit:', error);
          showError('Error', 'Cannot create deposit. Please try again.');
        } finally {
          setLoading(false);
        }
      }
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
            <Text style={styles.headerTitleText}>Create Deposit</Text>
            <Text style={styles.headerSubtitle}>New Deposit Information</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Quotation ID Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quotation ID *</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, errors.quotationId && styles.inputError]}
                placeholder="Enter Quotation ID"
                placeholderTextColor={COLORS.TEXT.SECONDARY}
                value={formData.quotationId}
                onChangeText={(value) => handleInputChange('quotationId', value)}
                keyboardType="numeric"
              />
              {loadingQuotation && (
                <ActivityIndicator 
                  size="small" 
                  color="#009DFF" 
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
            {errors.depositPercent && typeof errors.depositPercent === 'string' && (
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
            {errors.depositAmount && typeof errors.depositAmount === 'string' && (
              <Text style={styles.errorText}>{errors.depositAmount}</Text>
            )}
          </View>

          {/* Hold Day */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Valid Until *</Text>
            <TouchableOpacity
              style={[styles.dateInput, errors.holdDay && styles.inputError]}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateInputText}>{formatDate(formData.holdDay)}</Text>
              <Calendar size={20} color={COLORS.TEXT.SECONDARY} />
            </TouchableOpacity>
            {errors.holdDay && typeof errors.holdDay === 'string' && (
              <Text style={styles.errorText}>{errors.holdDay}</Text>
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <LinearGradient
              colors={loading ? [COLORS.TEXT.SECONDARY, COLORS.TEXT.SECONDARY] : ['#009DFF', '#009DFF']}
              style={styles.submitButtonGradient}
            >
              {loading ? (
                <ActivityIndicator color="#009DFF" />
              ) : (
                <Text style={styles.submitButtonText}>Create Deposit</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>

        {/* Date Picker Modal (consistent with EditCustomerContractScreen) */}
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
                    value={formData.holdDay}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    textColor="#000"
                    onChange={handleDateChange}
                    minimumDate={new Date()}
                  />
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

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
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.MEDIUM,
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F5',
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.MEDIUM,
  },
  dateInputText: {
    flex: 1,
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
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
  datePickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  datePickerContainer: { backgroundColor: COLORS.SURFACE, borderRadius: SIZES.RADIUS.LARGE, padding: SIZES.PADDING.LARGE, width: '90%' },
});

export default CreateDepositScreen;

