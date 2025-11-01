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
import driveTrialService from '../../services/driveTrialService';
import { ArrowLeft, Calendar, Clock } from 'lucide-react-native';

const CreateDriveTrialScreen = ({ navigation }) => {
  const { alertConfig, hideAlert, showSuccess, showError } = useCustomAlert();
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  
  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    phone: '',
    driveDate: '',
    driveTime: '',
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

  const formatTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
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

  const formatTimeForDisplay = (timeString) => {
    if (!timeString) return '';
    try {
      const parts = timeString.split(':');
      if (parts.length >= 2) {
        return `${parts[0]}:${parts[1]}`;
      }
      return timeString;
    } catch {
      return timeString;
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
      handleInputChange('driveDate', formattedDate);
    }
  };

  const handleTimeChange = (event, selectedTime) => {
    setShowTimePicker(Platform.OS === 'ios'); // On Android, time picker closes automatically
    
    if (event.type === 'dismissed') {
      // User cancelled on iOS
      return;
    }
    
    if (selectedTime) {
      setSelectedTime(selectedTime);
      const formattedTime = formatTime(selectedTime);
      handleInputChange('driveTime', formattedTime);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullname.trim()) {
      newErrors.fullname = 'Full name is required';
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

    if (!formData.driveDate.trim()) {
      newErrors.driveDate = 'Drive date is required';
    }

    if (!formData.driveTime.trim()) {
      newErrors.driveTime = 'Drive time is required';
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
      const bookingData = {
        fullname: formData.fullname,
        email: formData.email,
        phone: formData.phone,
        driveDate: formData.driveDate,
        driveTime: formData.driveTime,
      };

      const response = await driveTrialService.createBooking(bookingData);

      if (response.success) {
        showSuccess('Success', 'Drive trial booking created successfully!');
        setTimeout(() => {
          navigation.goBack();
        }, 1500);
      } else {
        showError('Error', response.error || 'Failed to create booking');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      showError('Error', error.message || 'Failed to create booking. Please try again.');
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
            <ArrowLeft color="#FFFFFF" size={18} />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={styles.title}>Create Drive Trial</Text>
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
            <Text style={styles.sectionTitle}>Booking Information</Text>

            {/* Full Name */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>
                Full Name <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.formInput, errors.fullname && styles.formInputError]}
                placeholder="Enter full name"
                placeholderTextColor={COLORS.TEXT.SECONDARY}
                value={formData.fullname}
                onChangeText={(value) => handleInputChange('fullname', value)}
                autoCapitalize="words"
              />
              {errors.fullname && (
                <Text style={styles.errorText}>{errors.fullname}</Text>
              )}
            </View>

            {/* Email */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>
                Email <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.formInput, errors.email && styles.formInputError]}
                placeholder="Enter email address"
                placeholderTextColor={COLORS.TEXT.SECONDARY}
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {errors.email && (
                <Text style={styles.errorText}>{errors.email}</Text>
              )}
            </View>

            {/* Phone */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>
                Phone Number <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.formInput, errors.phone && styles.formInputError]}
                placeholder="Enter phone number"
                placeholderTextColor={COLORS.TEXT.SECONDARY}
                value={formData.phone}
                onChangeText={(value) => handleInputChange('phone', value)}
                keyboardType="phone-pad"
              />
              {errors.phone && (
                <Text style={styles.errorText}>{errors.phone}</Text>
              )}
            </View>

            {/* Drive Date */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>
                Drive Date <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={[styles.dateInput, errors.driveDate && styles.formInputError]}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={[
                  styles.dateInputText,
                  !formData.driveDate && styles.dateInputTextPlaceholder
                ]}>
                  {formData.driveDate ? formatDateForDisplay(formData.driveDate) : 'Select drive date'}
                </Text>
                <Text style={styles.dateIcon}><Calendar size={14} /></Text>
              </TouchableOpacity>
              {errors.driveDate && (
                <Text style={styles.errorText}>{errors.driveDate}</Text>
              )}
            </View>

            {/* Drive Time */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>
                Drive Time <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={[styles.dateInput, errors.driveTime && styles.formInputError]}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={[
                  styles.dateInputText,
                  !formData.driveTime && styles.dateInputTextPlaceholder
                ]}>
                  {formData.driveTime ? formatTimeForDisplay(formData.driveTime) : 'Select drive time'}
                </Text>
                <Text style={styles.dateIcon}><Clock size={14} /></Text>
              </TouchableOpacity>
              {errors.driveTime && (
                <Text style={styles.errorText}>{errors.driveTime}</Text>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}

      {/* Time Picker */}
      {showTimePicker && (
        <DateTimePicker
          value={selectedTime}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
        />
      )}

      {/* Submit Button */}
      <View style={styles.submitContainer}>
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={loading}
        >
          <LinearGradient
            colors={COLORS.GRADIENT.BLUE}
            style={styles.submitGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Creating...' : 'Create Booking'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <CustomAlert config={alertConfig} onDismiss={hideAlert} />
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
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  title: {
    fontSize: SIZES.FONT.LARGE,
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
    paddingTop: SIZES.PADDING.MEDIUM,
    paddingBottom: SIZES.PADDING.XXXLARGE,
  },
  formSection: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.LARGE,
    padding: SIZES.PADDING.LARGE,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SIZES.PADDING.LARGE,
  },
  formGroup: {
    marginBottom: SIZES.PADDING.LARGE,
  },
  formLabel: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SIZES.PADDING.SMALL,
  },
  required: {
    color: COLORS.ERROR,
  },
  formInput: {
    backgroundColor: COLORS.BACKGROUND.CARD,
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
    borderWidth: 1,
    borderColor: COLORS.BORDER.PRIMARY,
  },
  formInputError: {
    borderColor: COLORS.ERROR,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.BACKGROUND.CARD,
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
    borderWidth: 1,
    borderColor: COLORS.BORDER.PRIMARY,
  },
  dateInputText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
    flex: 1,
  },
  dateInputTextPlaceholder: {
    color: COLORS.TEXT.SECONDARY,
  },
  dateIcon: {
    marginLeft: SIZES.PADDING.SMALL,
  },
  errorText: {
    color: COLORS.ERROR,
    fontSize: SIZES.FONT.SMALL,
    marginTop: SIZES.PADDING.XSMALL,
  },
  submitContainer: {
    paddingHorizontal: SIZES.PADDING.LARGE,
    paddingVertical: SIZES.PADDING.MEDIUM,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER.PRIMARY,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
  },
  submitButton: {
    borderRadius: SIZES.RADIUS.LARGE,
    overflow: 'hidden',
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

export default CreateDriveTrialScreen;

