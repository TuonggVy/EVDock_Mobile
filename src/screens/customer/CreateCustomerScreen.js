import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES } from '../../constants';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import customerManagementService from '../../services/customerManagementService';
import { useAuth } from '../../contexts/AuthContext';
import { Calendar } from 'lucide-react-native';

const CreateCustomerScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { alertConfig, hideAlert, showSuccess, showError } = useCustomAlert();
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    credentialId: '',
    dob: '',
  });

  const [errors, setErrors] = useState({});

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateString;
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios'); // On Android, date picker closes automatically
    
    if (event.type === 'dismissed') {
      // User cancelled on iOS
      return;
    }
    
    if (selectedDate) {
      setSelectedDate(selectedDate);
      const formattedDate = formatDate(selectedDate);
      handleInputChange('dob', formattedDate);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Invalid email format';
      }
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else {
      const phoneRegex = /^[0-9]{10,11}$/;
      if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
        newErrors.phone = 'Invalid phone number (10-11 digits)';
      }
    }

    // Date validation is handled by date picker, but we can still validate if needed
    if (formData.dob.trim()) {
      const date = new Date(formData.dob);
      if (isNaN(date.getTime())) {
        newErrors.dob = 'Invalid date of birth';
      } else {
        // Check if date is in the future (birthday can't be in the future)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (date > today) {
          newErrors.dob = 'Date of birth cannot be in the future';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      showError('Error', 'Please check your input');
      return;
    }

    setLoading(true);
    try {
      const customerData = {
        ...formData,
        dob: formData.dob ? new Date(formData.dob).toISOString() : undefined,
        agencyId: user?.agencyId, // Include agencyId from user context
      };

      const newCustomer = await customerManagementService.createCustomer(customerData);

      if (newCustomer) {
        showSuccess('Success', 'Customer created successfully!');
        setTimeout(() => {
          navigation.goBack();
        }, 1500);
      } else {
        showError('Error', 'Failed to create customer');
      }
    } catch (error) {
      console.error('Error creating customer:', error);
      showError('Error', error.message || 'Failed to create customer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
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
            <Text style={styles.title}>Create New Customer</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Form Section */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Customer Information</Text>

            {/* Name */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>
                Name <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.formInput, errors.name && styles.formInputError]}
                placeholder="Enter customer name"
                value={formData.name}
                onChangeText={(text) => handleInputChange('name', text)}
                autoCapitalize="words"
              />
              {errors.name && (
                <Text style={styles.errorText}>{errors.name}</Text>
              )}
            </View>

            {/* Email */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>
                Email <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.formInput, errors.email && styles.formInputError]}
                placeholder="Enter email"
                value={formData.email}
                onChangeText={(text) => handleInputChange('email', text)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {errors.email && (
                <Text style={styles.errorText}>{errors.email}</Text>
              )}
            </View>

            {/* Phone */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>
                Phone <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.formInput, errors.phone && styles.formInputError]}
                placeholder="Enter phone number (10-11 digits)"
                value={formData.phone}
                onChangeText={(text) => handleInputChange('phone', text)}
                keyboardType="phone-pad"
              />
              {errors.phone && (
                <Text style={styles.errorText}>{errors.phone}</Text>
              )}
            </View>

            {/* Address */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Address</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter address"
                value={formData.address}
                onChangeText={(text) => handleInputChange('address', text)}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Credential ID */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>ID Card</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter ID card number"
                value={formData.credentialId}
                onChangeText={(text) => handleInputChange('credentialId', text)}
                keyboardType="default"
              />
            </View>

            {/* Date of Birth */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Date of Birth</Text>
              <TouchableOpacity
                style={[styles.dateInput, errors.dob && styles.formInputError]}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={[
                  styles.dateInputText,
                  !formData.dob && styles.dateInputPlaceholder
                ]}>
                  {formData.dob ? formatDateForDisplay(formData.dob) : 'Select date of birth'}
                </Text>
                <Calendar size={20} color={COLORS.TEXT.SECONDARY} />
              </TouchableOpacity>
              {errors.dob && (
                <Text style={styles.errorText}>{errors.dob}</Text>
              )}
            </View>
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.bottomActions}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={loading}
          >
            <LinearGradient
              colors={COLORS.GRADIENT.BLUE}
              style={styles.submitGradient}
            >
              <Text style={styles.submitButtonText}>
                {loading ? 'Creating...' : 'Create Customer'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          maximumDate={new Date()} // Cannot select future dates
          locale="vi-VN"
        />
      )}

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={hideAlert}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
  },
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
  headerSpacer: {
    width: 40,
    height: 40,
  },
  title: {
    fontSize: SIZES.FONT.HEADER,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SIZES.PADDING.LARGE,
    paddingBottom: SIZES.PADDING.XXXLARGE,
  },
  formSection: {
    marginTop: SIZES.PADDING.MEDIUM,
  },
  sectionTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
    marginBottom: SIZES.PADDING.LARGE,
  },
  formGroup: {
    marginBottom: SIZES.PADDING.LARGE,
  },
  formLabel: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: '600',
    color: COLORS.TEXT.WHITE,
    marginBottom: SIZES.PADDING.SMALL,
  },
  required: {
    color: COLORS.ERROR,
  },
  formInput: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.MEDIUM,
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  formInputError: {
    borderColor: COLORS.ERROR,
    borderWidth: 2,
  },
  errorText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.ERROR,
    marginTop: SIZES.PADDING.XSMALL,
  },
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
    flex: 1,
  },
  dateInputPlaceholder: {
    color: COLORS.TEXT.SECONDARY,
  },
  bottomActions: {
    flexDirection: 'row',
    padding: SIZES.PADDING.LARGE,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    gap: SIZES.PADDING.MEDIUM,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: SIZES.PADDING.MEDIUM,
    borderRadius: SIZES.RADIUS.MEDIUM,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  cancelButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    borderRadius: SIZES.RADIUS.MEDIUM,
    overflow: 'hidden',
  },
  submitGradient: {
    paddingVertical: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.WHITE,
    fontWeight: 'bold',
  },
});

export default CreateCustomerScreen;

