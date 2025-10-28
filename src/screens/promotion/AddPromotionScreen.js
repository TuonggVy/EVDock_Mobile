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
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS, SIZES } from '../../constants';
import CustomAlert from '../../components/common/CustomAlert';
import promotionService from '../../services/promotionService';
import motorbikeService from '../../services/motorbikeService';
import { Calendar } from 'lucide-react-native';

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
    setShowStartDatePicker(false);
    if (selectedDate) {
      setSelectedStartDate(selectedDate);
      setFormData(prev => ({ ...prev, startAt: formatDate(selectedDate) }));
    }
  };

  const handleEndDateChange = (event, selectedDate) => {
    setShowEndDatePicker(false);
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
    <View style={styles.container}>
      <CustomAlert
        visible={showAlert}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setShowAlert(false)}
      />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditMode ? 'Edit Promotion' : 'Add Promotion'}</Text>
        <TouchableOpacity onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.PRIMARY} />
          ) : (
            <Text style={styles.saveButton}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Name */}
        <View style={styles.section}>
          <Text style={styles.label}>Promotion Name *</Text>
          <TextInput
            style={[styles.input, errors.name && styles.inputError]}
            value={formData.name}
            onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
            placeholder="Enter promotion name"
            placeholderTextColor={COLORS.TEXT.SECONDARY}
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.textArea, errors.description && styles.inputError]}
            value={formData.description}
            onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
            placeholder="Enter promotion description"
            placeholderTextColor={COLORS.TEXT.SECONDARY}
            multiline
            numberOfLines={4}
          />
          {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
        </View>

        {/* Value Type */}
        <View style={styles.section}>
          <Text style={styles.label}>Discount Type *</Text>
          <View style={styles.typeButtons}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                formData.valueType === 'PERCENT' && styles.typeButtonActive
              ]}
              onPress={() => setFormData(prev => ({ ...prev, valueType: 'PERCENT' }))}
            >
              <Text style={[
                styles.typeButtonText,
                formData.valueType === 'PERCENT' && styles.typeButtonTextActive
              ]}>
                Percentage
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeButton,
                formData.valueType === 'FIXED' && styles.typeButtonActive
              ]}
              onPress={() => setFormData(prev => ({ ...prev, valueType: 'FIXED' }))}
            >
              <Text style={[
                styles.typeButtonText,
                formData.valueType === 'FIXED' && styles.typeButtonTextActive
              ]}>
                Fixed Amount
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Value */}
        <View style={styles.section}>
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

        {/* Start Date */}
        <View style={styles.section}>
          <Text style={styles.label}>Start Date *</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowStartDatePicker(true)}
          >
            <Text style={styles.dateButtonText}>
              {formData.startAt ? formatDateForDisplay(formData.startAt) : 'Select start date'}
            </Text>
            <Text style={styles.dateIcon}><Calendar size={14} /></Text>
          </TouchableOpacity>
          {showStartDatePicker && (
            <DateTimePicker
              value={selectedStartDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleStartDateChange}
            />
          )}
        </View>

        {/* End Date */}
        <View style={styles.section}>
          <Text style={styles.label}>End Date *</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowEndDatePicker(true)}
          >
            <Text style={styles.dateButtonText}>
              {formData.endAt ? formatDateForDisplay(formData.endAt) : 'Select end date'}
            </Text>
            <Text style={styles.dateIcon}><Calendar size={14} /></Text>
          </TouchableOpacity>
          {showEndDatePicker && (
            <DateTimePicker
              value={selectedEndDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleEndDateChange}
              minimumDate={new Date()}
            />
          )}
        </View>

        {/* Scope */}
        <View style={styles.section}>
          <Text style={styles.label}>Apply To *</Text>
          <View style={styles.scopeButtons}>
            <TouchableOpacity
              style={[
                styles.scopeButton,
                formData.motorbikeScope === 'system' && styles.scopeButtonActive
              ]}
              onPress={() => handleScopeChange('system')}
            >
              <Text style={[
                styles.scopeButtonText,
                formData.motorbikeScope === 'system' && styles.scopeButtonTextActive
              ]}>
                System-wide
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.scopeButton,
                formData.motorbikeScope === 'specific' && styles.scopeButtonActive
              ]}
              onPress={() => handleScopeChange('specific')}
            >
              <Text style={[
                styles.scopeButtonText,
                formData.motorbikeScope === 'specific' && styles.scopeButtonTextActive
              ]}>
                Specific Motorbike
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Motorbike Selection */}
        {formData.motorbikeScope === 'specific' && (
          <View style={styles.section}>
            <Text style={styles.label}>Select Motorbike *</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setMotorbikeModalVisible(true)}
            >
              <Text style={styles.selectButtonText}>
                {selectedMotorbike ? selectedMotorbike.name : 'Select motorbike'}
              </Text>
              <Text style={styles.selectIcon}>▼</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Status */}
        <View style={styles.section}>
          <Text style={styles.label}>Status *</Text>
          <View style={styles.statusButtons}>
            <TouchableOpacity
              style={[
                styles.statusButton,
                formData.status === 'ACTIVE' && [styles.statusButtonActive, { backgroundColor: COLORS.SUCCESS }]
              ]}
              onPress={() => setFormData(prev => ({ ...prev, status: 'ACTIVE' }))}
            >
              <Text style={[
                styles.statusButtonText,
                formData.status === 'ACTIVE' && styles.statusButtonTextActive
              ]}>
                Active
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.statusButton,
                formData.status === 'INACTIVE' && [styles.statusButtonActive, { backgroundColor: COLORS.TEXT.SECONDARY }]
              ]}
              onPress={() => setFormData(prev => ({ ...prev, status: 'INACTIVE' }))}
            >
              <Text style={[
                styles.statusButtonText,
                formData.status === 'INACTIVE' && styles.statusButtonTextActive
              ]}>
                Inactive
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Motorbike Selection Modal */}
      <Modal
        visible={motorbikeModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setMotorbikeModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Motorbike</Text>
              <TouchableOpacity onPress={() => setMotorbikeModalVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView>
              {motorbikes.map((motorbike) => (
                <TouchableOpacity
                  key={motorbike.id}
                  style={styles.modalItem}
                  onPress={() => handleMotorbikeSelect(motorbike)}
                >
                  <Text style={styles.modalItemText}>{motorbike.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
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
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
  },
  backButton: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: SIZES.FONT.HEADER,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
  saveButton: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: SIZES.PADDING.LARGE,
  },
  section: {
    marginBottom: SIZES.PADDING.LARGE,
  },
  label: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.WHITE,
    marginBottom: SIZES.PADDING.SMALL,
    fontWeight: '600',
  },
  input: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
  },
  textArea: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
    minHeight: 100,
    textAlignVertical: 'top',
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
  typeButtons: {
    flexDirection: 'row',
    gap: SIZES.PADDING.MEDIUM,
  },
  typeButton: {
    flex: 1,
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: COLORS.PRIMARY,
  },
  typeButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
  },
  typeButtonTextActive: {
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
  },
  dateButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
  },
  dateIcon: {
    fontSize: SIZES.FONT.LARGE,
  },
  scopeButtons: {
    flexDirection: 'row',
    gap: SIZES.PADDING.MEDIUM,
  },
  scopeButton: {
    flex: 1,
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
  },
  scopeButtonActive: {
    backgroundColor: COLORS.PRIMARY,
  },
  scopeButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
  },
  scopeButtonTextActive: {
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
  },
  selectButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
  },
  selectIcon: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
  },
  statusButtons: {
    flexDirection: 'row',
    gap: SIZES.PADDING.MEDIUM,
  },
  statusButton: {
    flex: 1,
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
  },
  statusButtonActive: {
    opacity: 0.8,
  },
  statusButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
  },
  statusButtonTextActive: {
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
  },
  modalContainer: {
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
  modalClose: {
    fontSize: SIZES.FONT.LARGE,
    color: COLORS.TEXT.SECONDARY,
  },
  modalItem: {
    padding: SIZES.PADDING.LARGE,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  modalItemText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
  },
});

export default AddPromotionScreen;

