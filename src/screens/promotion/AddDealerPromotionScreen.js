import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES } from '../../constants';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import promotionStorageService from '../../services/storage/promotionStorageService';

const AddDealerPromotionScreen = ({ navigation }) => {
  const { alertConfig, hideAlert, showConfirm, showInfo } = useCustomAlert();
  
  // Form state
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    type: 'percentage',
    value: '',
    minOrderValue: '',
    maxDiscount: '',
    startDate: '',
    endDate: '',
    usageLimit: '',
    targetCustomers: 'all',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  
  // Date picker states
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  
  // Customer selection states
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);

  const promotionTypes = [
    { id: 'percentage', name: 'Percentage', icon: '%' },
    { id: 'fixed', name: 'Fixed Amount', icon: '$' },
  ];

  const targetCustomerOptions = [
    { 
      id: 'all', 
      name: 'All Customers', 
      description: 'Apply to all customers',
      icon: '👥',
      color: '#4CAF50'
    },
    { 
      id: 'vip', 
      name: 'VIP Customers', 
      description: 'Premium customers with special privileges',
      icon: '👑',
      color: '#FF9800'
    },
    { 
      id: 'new', 
      name: 'New Customers', 
      description: 'First-time customers',
      icon: '🆕',
      color: '#2196F3'
    },
    { 
      id: 'returning', 
      name: 'Returning Customers', 
      description: 'Customers who have purchased before',
      icon: '🔄',
      color: '#9C27B0'
    },
    { 
      id: 'high_value', 
      name: 'High Value Customers', 
      description: 'Customers with high purchase amounts',
      icon: '💰',
      color: '#F44336'
    },
    { 
      id: 'inactive', 
      name: 'Inactive Customers', 
      description: 'Customers who haven\'t purchased recently',
      icon: '😴',
      color: '#607D8B'
    },
    { 
      id: 'specific', 
      name: 'Specific Customers', 
      description: 'Select specific customers manually',
      icon: '🎯',
      color: '#795548'
    },
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  // Date formatting function for form data (YYYY-MM-DD)
  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Date formatting function for display (DD/MM/YYYY)
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Date picker handlers
  const handleStartDateChange = (event, selectedDate) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);
      const formattedDate = formatDate(selectedDate);
      handleInputChange('startDate', formattedDate);
      
      // If end date is before start date, update end date
      if (endDate && selectedDate > endDate) {
        setEndDate(selectedDate);
        handleInputChange('endDate', formattedDate);
      }
    }
  };

  const handleEndDateChange = (event, selectedDate) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      // Ensure end date is not before start date
      if (selectedDate < startDate) {
        showInfo('Invalid Date', 'End date must be after start date');
        return;
      }
      setEndDate(selectedDate);
      const formattedDate = formatDate(selectedDate);
      handleInputChange('endDate', formattedDate);
    }
  };

  const showStartDatePickerModal = () => {
    setShowStartDatePicker(true);
  };

  const showEndDatePickerModal = () => {
    setShowEndDatePicker(true);
  };

  // Customer selection handlers
  const showCustomerPickerModal = () => {
    setShowCustomerPicker(true);
  };

  const handleCustomerSelection = (customerOption) => {
    handleInputChange('targetCustomers', customerOption.id);
    setShowCustomerPicker(false);
  };

  const getSelectedCustomerOption = () => {
    return targetCustomerOptions.find(option => option.id === formData.targetCustomers) || targetCustomerOptions[0];
  };

  // Initialize default dates
  useEffect(() => {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    setStartDate(today);
    setEndDate(nextWeek);
    
    // Set default form values
    setFormData(prev => ({
      ...prev,
      startDate: formatDate(today),
      endDate: formatDate(nextWeek),
    }));
  }, []);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.code.trim()) {
      newErrors.code = 'Promotion code is required';
    } else if (formData.code.length < 3) {
      newErrors.code = 'Code must be at least 3 characters';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Promotion name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.value.trim()) {
      newErrors.value = 'Discount value is required';
    } else if (isNaN(Number(formData.value)) || Number(formData.value) <= 0) {
      newErrors.value = 'Please enter a valid discount value';
    }

    if (!formData.minOrderValue.trim()) {
      newErrors.minOrderValue = 'Minimum order value is required';
    } else if (isNaN(Number(formData.minOrderValue)) || Number(formData.minOrderValue) < 0) {
      newErrors.minOrderValue = 'Please enter a valid minimum order value';
    }

    if (formData.maxDiscount && (isNaN(Number(formData.maxDiscount)) || Number(formData.maxDiscount) < 0)) {
      newErrors.maxDiscount = 'Please enter a valid maximum discount';
    }

    if (!formData.startDate.trim()) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.endDate.trim()) {
      newErrors.endDate = 'End date is required';
    } else if (formData.startDate && formData.endDate) {
      const startDateObj = new Date(formData.startDate);
      const endDateObj = new Date(formData.endDate);
      if (endDateObj <= startDateObj) {
        newErrors.endDate = 'End date must be after start date';
      }
    }

    if (!formData.usageLimit.trim()) {
      newErrors.usageLimit = 'Usage limit is required';
    } else if (isNaN(Number(formData.usageLimit)) || Number(formData.usageLimit) <= 0) {
      newErrors.usageLimit = 'Please enter a valid usage limit';
    }

    if (!formData.targetCustomers.trim()) {
      newErrors.targetCustomers = 'Target customers selection is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      showInfo('Validation Error', 'Please fill in all required fields correctly');
      return;
    }

    setLoading(true);
    
    try {
      // Prepare promotion data
      const selectedCustomer = getSelectedCustomerOption();
      const promotionData = {
        code: formData.code,
        name: formData.name,
        description: formData.description,
        type: formData.type,
        value: Number(formData.value),
        minOrderValue: Number(formData.minOrderValue),
        maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : null,
        startDate: formData.startDate,
        endDate: formData.endDate,
        usageLimit: Number(formData.usageLimit),
        targetCustomers: selectedCustomer.name,
        targetAudience: 'customers', // B2C specific
        promotionType: 'custom_promotion', // B2C specific
        customerSegments: [selectedCustomer.name],
        vehicleModels: ['All Models'], // Default to all models
        status: 'active', // Default status
        usedCount: 0, // Initialize usage count
        createdBy: 'Dealer Manager', // Set creator
      };

      // TODO: Replace with actual API call when backend is ready
      // const response = await dealerPromotionService.createPromotion(promotionData);
      
      // For development, save to local storage
      const newPromotion = await promotionStorageService.addPromotion(promotionData);
      
      // Log promotion data including customer selection
      console.log('🎯 Promotion created and saved:', {
        id: newPromotion.id,
        customerType: selectedCustomer.name,
        customerDescription: selectedCustomer.description,
        customerId: formData.targetCustomers,
        promotionData: newPromotion
      });
      
      showInfo('Success', `Promotion "${newPromotion.name}" created successfully for ${selectedCustomer.name}!`);
      
      // Navigate back after a short delay
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
      
    } catch (error) {
      console.error('Error creating promotion:', error);
      showInfo('Error', 'Failed to create promotion. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (label, field, value, placeholder, keyboardType = 'default', multiline = false) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label} *</Text>
      <TextInput
        style={[
          styles.textInput,
          multiline && styles.textInputMultiline,
          errors[field] && styles.textInputError
        ]}
        value={value}
        onChangeText={(text) => handleInputChange(field, text)}
        placeholder={placeholder}
        placeholderTextColor={COLORS.TEXT.SECONDARY}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
      {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
    </View>
  );

  const renderDateInput = (label, field, value) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label} *</Text>
      <TouchableOpacity
        style={[
          styles.dateInput,
          errors[field] && styles.textInputError
        ]}
        onPress={() => {
          if (field === 'startDate') {
            showStartDatePickerModal();
          } else if (field === 'endDate') {
            showEndDatePickerModal();
          }
        }}
      >
        <Text style={[styles.dateInputText, !value && styles.placeholderText]}>
          {value ? formatDateForDisplay(value) : 'Select date'}
        </Text>
        <Text style={styles.dateIcon}>📅</Text>
      </TouchableOpacity>
      {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
    </View>
  );

  const renderSelectInput = (label, field, value, options) => {
    if (field === 'targetCustomers') {
      const selectedOption = getSelectedCustomerOption();
      return (
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>{label} *</Text>
          <TouchableOpacity
            style={[
              styles.selectInput,
              errors[field] && styles.textInputError
            ]}
            onPress={showCustomerPickerModal}
          >
            <View style={styles.selectInputContent}>
              <Text style={styles.selectInputIcon}>{selectedOption.icon}</Text>
              <View style={styles.selectInputTextContainer}>
                <Text style={styles.selectInputText}>{selectedOption.name}</Text>
                <Text style={styles.selectInputDescription}>{selectedOption.description}</Text>
              </View>
            </View>
            <Text style={styles.selectIcon}>▼</Text>
          </TouchableOpacity>
          {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
        </View>
      );
    }
    
    // Default select input for other fields
    return (
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{label} *</Text>
        <TouchableOpacity
          style={[
            styles.selectInput,
            errors[field] && styles.textInputError
          ]}
          onPress={() => {
            showInfo('Picker', 'Picker will be implemented');
          }}
        >
          <Text style={[styles.selectInputText, !value && styles.placeholderText]}>
            {value || 'Select option'}
          </Text>
          <Text style={styles.selectIcon}>▼</Text>
        </TouchableOpacity>
        {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={styles.headerTitleText}>Create Promotion</Text>
            <Text style={styles.headerSubtitle}>Set up a new promotional campaign</Text>
          </View>
          <View style={styles.placeholder} />
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          {renderInput('Promotion Code', 'code', formData.code, 'e.g., DEALER001')}
          {renderInput('Promotion Name', 'name', formData.name, 'e.g., Weekend Special')}
          {renderInput('Description', 'description', formData.description, 'Describe the promotion...', 'default', true)}
        </View>

        {/* Discount Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Discount Settings</Text>
          
          {/* Promotion Type */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Discount Type *</Text>
            <View style={styles.typeContainer}>
              {promotionTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.typeOption,
                    formData.type === type.id && styles.selectedTypeOption
                  ]}
                  onPress={() => handleInputChange('type', type.id)}
                >
                  <Text style={styles.typeIcon}>{type.icon}</Text>
                  <Text style={[
                    styles.typeText,
                    formData.type === type.id && styles.selectedTypeText
                  ]}>
                    {type.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {renderInput(
            formData.type === 'percentage' ? 'Discount Percentage (%)' : 'Discount Amount ($)',
            'value',
            formData.value,
            formData.type === 'percentage' ? 'e.g., 15' : 'e.g., 5000',
            'numeric'
          )}
          {renderInput('Minimum Order Value ($)', 'minOrderValue', formData.minOrderValue, 'e.g., 30000', 'numeric')}
          {renderInput('Maximum Discount ($)', 'maxDiscount', formData.maxDiscount, 'e.g., 5000 (optional)', 'numeric')}
        </View>

        {/* Validity Period */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Validity Period</Text>
          
          {renderDateInput('Start Date', 'startDate', formData.startDate)}
          {renderDateInput('End Date', 'endDate', formData.endDate)}
          {renderInput('Usage Limit', 'usageLimit', formData.usageLimit, 'e.g., 100', 'numeric')}
        </View>

        {/* Target Customers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Target Customers</Text>
          
          {renderSelectInput('Target Customer Group', 'targetCustomers', formData.targetCustomers, targetCustomerOptions)}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <LinearGradient
              colors={loading ? [COLORS.TEXT.SECONDARY, COLORS.TEXT.SECONDARY] : (COLORS.GRADIENT.GREEN || ['#4CAF50', '#66BB6A'])}
              style={styles.submitGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.submitButtonText}>
                {loading ? 'Creating...' : 'Create Promotion'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Date Pickers */}
      {showStartDatePicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleStartDateChange}
          minimumDate={new Date()}
          style={styles.datePicker}
        />
      )}
      
      {showEndDatePicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleEndDateChange}
          minimumDate={startDate}
          style={styles.datePicker}
        />
      )}

      {/* Customer Picker Modal */}
      {showCustomerPicker && (
        <View style={styles.modalOverlay}>
          <View style={styles.customerPickerModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Target Customers</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowCustomerPicker(false)}
              >
                <Text style={styles.closeIcon}>×</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.customerOptionsContainer}>
              {targetCustomerOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.customerOption,
                    formData.targetCustomers === option.id && styles.selectedCustomerOption
                  ]}
                  onPress={() => handleCustomerSelection(option)}
                >
                  <View style={styles.customerOptionContent}>
                    <Text style={styles.customerOptionIcon}>{option.icon}</Text>
                    <View style={styles.customerOptionTextContainer}>
                      <Text style={[
                        styles.customerOptionName,
                        formData.targetCustomers === option.id && styles.selectedCustomerOptionText
                      ]}>
                        {option.name}
                      </Text>
                      <Text style={[
                        styles.customerOptionDescription,
                        formData.targetCustomers === option.id && styles.selectedCustomerOptionDescription
                      ]}>
                        {option.description}
                      </Text>
                    </View>
                  </View>
                  {formData.targetCustomers === option.id && (
                    <Text style={styles.checkIcon}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
  },
  
  // Header styles
  header: {
    paddingTop: SIZES.PADDING.XXXLARGE,
    paddingHorizontal: SIZES.PADDING.LARGE,
    paddingBottom: SIZES.PADDING.LARGE,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: SIZES.RADIUS.ROUND,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: SIZES.FONT.LARGE,
    color: COLORS.TEXT.WHITE,
    fontWeight: 'bold',
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
  placeholder: {
    width: 40,
  },

  // Content
  content: {
    flex: 1,
    backgroundColor: COLORS.SURFACE,
    borderTopLeftRadius: SIZES.RADIUS.XXLARGE,
    borderTopRightRadius: SIZES.RADIUS.XXLARGE,
  },
  scrollContent: {
    paddingHorizontal: SIZES.PADDING.LARGE,
    paddingTop: SIZES.PADDING.LARGE,
    paddingBottom: SIZES.PADDING.XXXLARGE,
  },

  // Sections
  section: {
    marginBottom: SIZES.PADDING.XLARGE,
  },
  sectionTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SIZES.PADDING.LARGE,
  },

  // Form inputs
  inputGroup: {
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  inputLabel: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SIZES.PADDING.SMALL,
  },
  textInput: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.MEDIUM,
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textInputMultiline: {
    height: 80,
    textAlignVertical: 'top',
  },
  textInputError: {
    borderColor: COLORS.ERROR,
  },
  errorText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.ERROR,
    marginTop: SIZES.PADDING.XSMALL,
  },

  // Date input
  dateInput: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.MEDIUM,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateInputText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
  },
  placeholderText: {
    color: COLORS.TEXT.SECONDARY,
  },
  dateIcon: {
    fontSize: SIZES.FONT.MEDIUM,
  },

  // Select input
  selectInput: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.MEDIUM,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectInputText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
  },
  selectIcon: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
  },

  // Type selection
  typeContainer: {
    flexDirection: 'row',
    gap: SIZES.PADDING.SMALL,
  },
  typeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
  },
  selectedTypeOption: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  typeIcon: {
    fontSize: SIZES.FONT.MEDIUM,
    marginRight: SIZES.PADDING.XSMALL,
  },
  typeText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '500',
  },
  selectedTypeText: {
    color: COLORS.TEXT.WHITE,
  },

  // Action buttons
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SIZES.PADDING.XLARGE,
    gap: SIZES.PADDING.MEDIUM,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.LARGE,
    paddingVertical: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cancelButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
  },
  submitButton: {
    flex: 2,
    borderRadius: SIZES.RADIUS.LARGE,
    overflow: 'hidden',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitGradient: {
    paddingVertical: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },

  // Date picker styles
  datePicker: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    marginHorizontal: SIZES.PADDING.MEDIUM,
    marginVertical: SIZES.PADDING.SMALL,
  },

  // Customer picker styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  customerPickerModal: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.LARGE,
    width: '90%',
    maxHeight: '70%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.PADDING.LARGE,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: SIZES.RADIUS.ROUND,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    fontSize: SIZES.FONT.LARGE,
    color: COLORS.TEXT.SECONDARY,
  },
  customerOptionsContainer: {
    maxHeight: 400,
  },
  customerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SIZES.PADDING.LARGE,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  selectedCustomerOption: {
    backgroundColor: '#F0F8FF',
  },
  customerOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  customerOptionIcon: {
    fontSize: SIZES.FONT.XLARGE,
    marginRight: SIZES.PADDING.MEDIUM,
  },
  customerOptionTextContainer: {
    flex: 1,
  },
  customerOptionName: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SIZES.PADDING.XSMALL,
  },
  customerOptionDescription: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    lineHeight: 18,
  },
  selectedCustomerOptionText: {
    color: COLORS.PRIMARY,
  },
  selectedCustomerOptionDescription: {
    color: COLORS.PRIMARY,
    opacity: 0.8,
  },
  checkIcon: {
    fontSize: SIZES.FONT.LARGE,
    color: COLORS.PRIMARY,
    fontWeight: 'bold',
  },

  // Enhanced select input styles
  selectInputContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectInputIcon: {
    fontSize: SIZES.FONT.LARGE,
    marginRight: SIZES.PADDING.SMALL,
  },
  selectInputTextContainer: {
    flex: 1,
  },
  selectInputDescription: {
    fontSize: SIZES.FONT.XSMALL,
    color: COLORS.TEXT.SECONDARY,
    marginTop: 2,
  },
});

export default AddDealerPromotionScreen;
