import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Platform,
  SafeAreaView,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS, SIZES } from '../../constants';
import CustomAlert from '../../components/common/CustomAlert';
import promotionService from '../../services/promotionService';
import motorbikeService from '../../services/motorbikeService';
import { Calendar, ArrowLeft } from 'lucide-react-native';

const AddPromotionScreen = ({ navigation, route }) => {
  const promotion = route?.params?.promotion;
  const isEditMode = !!promotion;
  
  const [loading, setLoading] = useState(false);
  const [motorbikes, setMotorbikes] = useState([]);
  const [motorbikeModalVisible, setMotorbikeModalVisible] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [selectedStartDate, setSelectedStartDate] = useState(new Date());
  const [selectedEndDate, setSelectedEndDate] = useState(new Date());
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'info' });

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    valueType: 'PERCENT',
    value: '',
    startAt: '',
    endAt: '',
    status: 'ACTIVE',
    motorbikeId: null,
    motorbikeScope: 'system', // 'system' or 'specific'
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadMotorbikes();
    
    if (isEditMode && promotion) {
      // Pre-fill form with promotion data
      setFormData({
        name: promotion.name || '',
        description: promotion.description || '',
        valueType: promotion.valueType || 'PERCENT',
        value: promotion.value?.toString() || '',
        startAt: promotion.startAt || '',
        endAt: promotion.endAt || '',
        status: promotion.status || 'ACTIVE',
        motorbikeId: promotion.motorbikeId || null,
        motorbikeScope: promotion.motorbikeId ? 'specific' : 'system',
      });
      
      if (promotion.startAt) {
        setSelectedStartDate(new Date(promotion.startAt));
      }
      if (promotion.endAt) {
        setSelectedEndDate(new Date(promotion.endAt));
      }
    } else {
      // Set default dates for new promotion
      const today = new Date();
      setSelectedStartDate(today);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      setSelectedEndDate(tomorrow);
      setFormData(prev => ({
        ...prev,
        startAt: formatDate(today),
        endAt: formatDate(tomorrow),
      }));
    }
  }, [promotion]);

  const loadMotorbikes = async () => {
    try {
      const response = await motorbikeService.getAllMotorbikes({ limit: 100 });
      if (response.success && Array.isArray(response.data)) {
        setMotorbikes(response.data);
      }
    } catch (error) {
      console.error('Error loading motorbikes:', error);
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString();
  };

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleStartDateChange = (event, selectedDate) => {
    // Keep picker open on iOS (close via tapping outside modal), auto-close on Android
    setShowStartDatePicker(Platform.OS === 'ios');

    if (event?.type === 'dismissed') {
      return;
    }

    if (selectedDate) {
      setSelectedStartDate(selectedDate);
      setFormData(prev => ({ ...prev, startAt: formatDate(selectedDate) }));
    }
  };

  const handleEndDateChange = (event, selectedDate) => {
    // Keep picker open on iOS (close via tapping outside modal), auto-close on Android
    setShowEndDatePicker(Platform.OS === 'ios');

    if (event?.type === 'dismissed') {
      return;
    }

    if (selectedDate) {
      setSelectedEndDate(selectedDate);
      setFormData(prev => ({ ...prev, endAt: formatDate(selectedDate) }));
    }
  };

  const handleScopeChange = (scope) => {
    setFormData(prev => ({
      ...prev,
      motorbikeScope: scope,
      motorbikeId: scope === 'system' ? null : prev.motorbikeId,
    }));
  };

  const handleMotorbikeSelect = (motorbike) => {
    setFormData(prev => ({ ...prev, motorbikeId: motorbike.id }));
    setMotorbikeModalVisible(false);
  };

  const handleSubmit = async () => {
    setErrors({});
    
    const submissionData = {
      ...formData,
      value: parseFloat(formData.value),
      motorbikeId: formData.motorbikeScope === 'system' ? null : formData.motorbikeId,
    };

    const validation = promotionService.validatePromotion(submissionData);
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setLoading(true);
    
    try {
      let response;
      if (isEditMode) {
        response = await promotionService.updatePromotion(promotion.id, submissionData);
      } else {
        response = await promotionService.createPromotion(submissionData);
      }

      if (response.success) {
        setAlertConfig({
          title: 'Success',
          message: isEditMode ? 'Promotion updated successfully!' : 'Promotion created successfully!',
          type: 'success'
        });
        setShowAlert(true);
        setTimeout(() => {
          navigation.goBack();
        }, 1500);
      } else {
        const errorMessage = typeof response.error === 'string' 
          ? response.error 
          : (response.error?.message || JSON.stringify(response.error) || 'Failed to save promotion');
        setAlertConfig({
          title: 'Error',
          message: errorMessage,
          type: 'error'
        });
        setShowAlert(true);
      }
    } catch (error) {
      console.error('Error saving promotion:', error);
      setAlertConfig({
        title: 'Error',
        message: 'An unexpected error occurred',
        type: 'error'
      });
      setShowAlert(true);
    } finally {
      setLoading(false);
    }
  };

  const selectedMotorbike = motorbikes.find(m => m.id === formData.motorbikeId);

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
        <Text style={styles.headerTitle}>{isEditMode ? 'Edit Promotion' : 'Add Promotion'}</Text>
        <View style={styles.headerActions} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Basic Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Promotion Name <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                placeholder="Enter promotion name"
                placeholderTextColor={COLORS.TEXT.SECONDARY}
              />
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Description <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, styles.textArea, errors.description && styles.inputError]}
                value={formData.description}
                onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                placeholder="Enter promotion description"
                placeholderTextColor={COLORS.TEXT.SECONDARY}
                multiline
                numberOfLines={4}
              />
              {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Discount Type *</Text>
              <View style={styles.toggleRow}>
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    formData.valueType === 'PERCENT' && styles.toggleButtonActive
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, valueType: 'PERCENT' }))}
                >
                  <Text
                    style={[
                      styles.toggleButtonText,
                      formData.valueType === 'PERCENT' && styles.toggleButtonTextActive
                    ]}
                  >
                    Percentage
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    formData.valueType === 'FIXED' && styles.toggleButtonActive
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, valueType: 'FIXED' }))}
                >
                  <Text
                    style={[
                      styles.toggleButtonText,
                      formData.valueType === 'FIXED' && styles.toggleButtonTextActive
                    ]}
                  >
                    Fixed Amount
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Discount Value * {formData.valueType === 'PERCENT' ? '(0-100)' : '(VND)'}
              </Text>
              <TextInput
                style={[styles.input, errors.value && styles.inputError]}
                value={formData.value}
                onChangeText={(text) => setFormData(prev => ({ ...prev, value: text }))}
                placeholder={formData.valueType === 'PERCENT' ? 'e.g., 10' : 'e.g., 50000'}
                placeholderTextColor={COLORS.TEXT.SECONDARY}
                keyboardType="numeric"
              />
              {errors.value && <Text style={styles.errorText}>{errors.value}</Text>}
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Schedule</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Start Date <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowStartDatePicker(true)}
              >
                <Text style={styles.dateText}>
                  {formData.startAt ? formatDateForDisplay(formData.startAt) : 'Select start date'}
                </Text>
                <Calendar size={18} color={COLORS.TEXT.PRIMARY} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                End Date <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowEndDatePicker(true)}
              >
                <Text style={styles.dateText}>
                  {formData.endAt ? formatDateForDisplay(formData.endAt) : 'Select end date'}
                </Text>
                <Calendar size={18} color={COLORS.TEXT.PRIMARY} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Scope</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Apply To *</Text>
              <View style={styles.toggleRow}>
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    formData.motorbikeScope === 'system' && styles.toggleButtonActive
                  ]}
                  onPress={() => handleScopeChange('system')}
                >
                  <Text
                    style={[
                      styles.toggleButtonText,
                      formData.motorbikeScope === 'system' && styles.toggleButtonTextActive
                    ]}
                  >
                    System-wide
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    formData.motorbikeScope === 'specific' && styles.toggleButtonActive
                  ]}
                  onPress={() => handleScopeChange('specific')}
                >
                  <Text
                    style={[
                      styles.toggleButtonText,
                      formData.motorbikeScope === 'specific' && styles.toggleButtonTextActive
                    ]}
                  >
                    Specific Motorbike
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {formData.motorbikeScope === 'specific' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Select Motorbike <Text style={styles.required}>*</Text>
                </Text>
                <TouchableOpacity
                  style={[styles.input, styles.selectInput, errors.motorbikeId && styles.inputError]}
                  onPress={() => setMotorbikeModalVisible(true)}
                >
                  <Text style={styles.selectText}>
                    {selectedMotorbike ? selectedMotorbike.name : 'Select motorbike'}
                  </Text>
                  <Text style={styles.selectIcon}>▼</Text>
                </TouchableOpacity>
                {errors.motorbikeId && <Text style={styles.errorText}>{errors.motorbikeId}</Text>}
              </View>
            )}
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Status</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Promotion Status *</Text>
              <View style={styles.statusRow}>
                <TouchableOpacity
                  style={[
                    styles.statusButton,
                    formData.status === 'ACTIVE' && styles.statusButtonActive
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, status: 'ACTIVE' }))}
                >
                  <Text style={styles.statusButtonText}>Active</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.statusButton,
                    formData.status === 'INACTIVE' && styles.statusButtonInactive
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, status: 'INACTIVE' }))}
                >
                  <Text style={styles.statusButtonText}>Inactive</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#009DFF" />
            ) : (
              <Text style={styles.submitButtonText}>
                {isEditMode ? 'Update Promotion' : 'Create Promotion'}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={motorbikeModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setMotorbikeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Motorbike</Text>
              <TouchableOpacity onPress={() => setMotorbikeModalVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {motorbikes.map((motorbike) => (
                <TouchableOpacity
                  key={motorbike.id}
                  style={[
                    styles.modalItem,
                    motorbike.id === formData.motorbikeId && styles.modalItemActive
                  ]}
                  onPress={() => handleMotorbikeSelect(motorbike)}
                >
                  <Text style={styles.modalItemText}>{motorbike.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Date Picker Modals */}
      {showStartDatePicker && (
        <Modal
          visible={showStartDatePicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowStartDatePicker(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowStartDatePicker(false)}>
            <View style={styles.datePickerOverlay}>
              <TouchableWithoutFeedback onPress={() => {}}>
                <View style={styles.datePickerContainer}>
                  <DateTimePicker
                    value={selectedStartDate || new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleStartDateChange}
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

      {showEndDatePicker && (
        <Modal
          visible={showEndDatePicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowEndDatePicker(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowEndDatePicker(false)}>
            <View style={styles.datePickerOverlay}>
              <TouchableWithoutFeedback onPress={() => {}}>
                <View style={styles.datePickerContainer}>
                  <DateTimePicker
                    value={selectedEndDate || new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleEndDateChange}
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
    fontSize: SIZES.FONT.XXLARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
    flex: 1,
    textAlign: 'center',
  },
  headerActions: {
    width: 40,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.SURFACE,
    borderTopLeftRadius: SIZES.RADIUS.XXLARGE,
    borderTopRightRadius: SIZES.RADIUS.XXLARGE,
  },
  contentContainer: {
    padding: SIZES.PADDING.LARGE,
    paddingBottom: SIZES.PADDING.XXXLARGE,
  },
  formSection: {
    marginBottom: SIZES.PADDING.XLARGE,
  },
  sectionTitle: {
    fontSize: SIZES.FONT.XLARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  inputGroup: {
    marginBottom: SIZES.PADDING.LARGE,
  },
  label: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SIZES.PADDING.SMALL,
  },
  required: {
    color: COLORS.ERROR,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.MEDIUM,
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
    borderWidth: 1,
    borderColor: COLORS.BORDER.PRIMARY,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: COLORS.ERROR,
  },
  errorText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.ERROR,
    marginTop: SIZES.PADDING.XSMALL,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: SIZES.PADDING.SMALL,
  },
  toggleButton: {
    flex: 1,
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingVertical: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  toggleButtonActive: {
    backgroundColor: '#009DFF',
    borderColor: '#009DFF',
  },
  toggleButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: '600',
    color: COLORS.TEXT.SECONDARY,
  },
  toggleButtonTextActive: {
    color: COLORS.TEXT.WHITE,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F5',
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.MEDIUM,
    borderWidth: 1,
    borderColor: COLORS.BORDER.PRIMARY,
  },
  dateText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
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
  selectInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
    flex: 1,
  },
  selectIcon: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
    marginLeft: SIZES.PADDING.SMALL,
  },
  statusRow: {
    flexDirection: 'row',
    gap: SIZES.PADDING.SMALL,
  },
  statusButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.PADDING.MEDIUM,
    borderRadius: SIZES.RADIUS.MEDIUM,
    backgroundColor: COLORS.BACKGROUND.SECONDARY,
  },
  statusButtonActive: {
    backgroundColor: COLORS.SUCCESS,
  },
  statusButtonInactive: {
    backgroundColor: COLORS.ERROR,
  },
  statusButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: '600',
    color: COLORS.TEXT.WHITE,
  },
  submitButton: {
    backgroundColor: '#009DFF',
    borderRadius: SIZES.RADIUS.LARGE,
    paddingVertical: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
    marginTop: SIZES.PADDING.LARGE,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.SURFACE,
  },
  submitButtonText: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.SURFACE,
    borderTopLeftRadius: SIZES.RADIUS.XLARGE,
    borderTopRightRadius: SIZES.RADIUS.XLARGE,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.PADDING.LARGE,
    paddingVertical: SIZES.PADDING.MEDIUM,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  modalTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
  },
  modalClose: {
    fontSize: SIZES.FONT.LARGE,
    color: COLORS.TEXT.SECONDARY,
  },
  modalList: {
    maxHeight: '80%',
  },
  modalItem: {
    paddingHorizontal: SIZES.PADDING.LARGE,
    paddingVertical: SIZES.PADDING.MEDIUM,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  modalItemActive: {
    backgroundColor: 'rgba(0, 157, 255, 0.1)',
  },
  modalItemText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
  },
});

export default AddPromotionScreen;

