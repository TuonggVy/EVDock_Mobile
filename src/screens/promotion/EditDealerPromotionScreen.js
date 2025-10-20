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
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES } from '../../constants';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';

const EditDealerPromotionScreen = ({ navigation, route }) => {
  const { promotion } = route.params;
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
    targetCustomers: 'All Customers',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const promotionTypes = [
    { id: 'percentage', name: 'Percentage', icon: '%' },
    { id: 'fixed', name: 'Fixed Amount', icon: '$' },
  ];

  const targetCustomerOptions = [
    'All Customers',
    'VIP Customers',
    'New Customers',
    'Returning Customers',
    'High Value Customers',
  ];

  // Initialize form with promotion data
  useEffect(() => {
    setFormData({
      code: promotion.code || '',
      name: promotion.name || '',
      description: promotion.description || '',
      type: promotion.type || 'percentage',
      value: promotion.value?.toString() || '',
      minOrderValue: promotion.minOrderValue?.toString() || '',
      maxDiscount: promotion.maxDiscount?.toString() || '',
      startDate: promotion.startDate || '',
      endDate: promotion.endDate || '',
      usageLimit: promotion.usageLimit?.toString() || '',
      targetCustomers: promotion.targetCustomers || 'All Customers',
    });
  }, [promotion]);

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
    } else if (formData.startDate && formData.endDate && new Date(formData.endDate) <= new Date(formData.startDate)) {
      newErrors.endDate = 'End date must be after start date';
    }

    if (!formData.usageLimit.trim()) {
      newErrors.usageLimit = 'Usage limit is required';
    } else if (isNaN(Number(formData.usageLimit)) || Number(formData.usageLimit) <= 0) {
      newErrors.usageLimit = 'Please enter a valid usage limit';
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
      // TODO: Replace with actual API call
      // const response = await dealerPromotionService.updatePromotion(promotion.id, {
      //   ...formData,
      //   value: Number(formData.value),
      //   minOrderValue: Number(formData.minOrderValue),
      //   maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : null,
      //   usageLimit: Number(formData.usageLimit),
      // });

      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      showInfo('Success', 'Promotion updated successfully!');
      
      // Navigate back after a short delay
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
      
    } catch (error) {
      console.error('Error updating promotion:', error);
      showInfo('Error', 'Failed to update promotion. Please try again.');
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
          // TODO: Implement date picker
          showInfo('Date Picker', 'Date picker will be implemented');
        }}
      >
        <Text style={[styles.dateInputText, !value && styles.placeholderText]}>
          {value || 'Select date'}
        </Text>
        <Text style={styles.dateIcon}>📅</Text>
      </TouchableOpacity>
      {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
    </View>
  );

  const renderSelectInput = (label, field, value, options) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label} *</Text>
      <TouchableOpacity
        style={[
          styles.selectInput,
          errors[field] && styles.textInputError
        ]}
        onPress={() => {
          // TODO: Implement picker
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
            <Text style={styles.headerTitleText}>Edit Promotion</Text>
            <Text style={styles.headerSubtitle}>Update promotional campaign</Text>
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
                {loading ? 'Updating...' : 'Update Promotion'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

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
});

export default EditDealerPromotionScreen;
