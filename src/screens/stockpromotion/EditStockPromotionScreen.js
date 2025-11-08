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
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ArrowLeft, Calendar } from 'lucide-react-native';
import { COLORS, SIZES } from '../../constants';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import CustomAlert from '../../components/common/CustomAlert';
import stockPromotionService from '../../services/stockPromotionService';

const EditStockPromotionScreen = ({ navigation, route }) => {
  const { stockPromotionId } = route.params || {};
  const { alertConfig, hideAlert, showSuccess, showError } = useCustomAlert();

  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    valueType: 'PERCENT',
    value: '',
    startAt: '',
    endAt: '',
    status: 'ACTIVE',
  });

  useEffect(() => {
    if (!stockPromotionId) {
      showError('Error', 'Promotion information not found');
      navigation.goBack();
      return;
    }
    loadPromotionDetail();
  }, [stockPromotionId]);

  const loadPromotionDetail = async () => {
    try {
      setInitialLoading(true);
      const response = await stockPromotionService.getStockPromotionDetail(stockPromotionId);

      if (response.success && response.data) {
        const promotion = response.data;
        const start = promotion.startAt ? new Date(promotion.startAt) : new Date();
        const end = promotion.endAt ? new Date(promotion.endAt) : new Date();

        setStartDate(start);
        setEndDate(end);
        setFormData({
          name: promotion.name || '',
          description: promotion.description || '',
          valueType: promotion.valueType || 'PERCENT',
          value: promotion.value !== undefined && promotion.value !== null ? promotion.value.toString() : '',
          startAt: promotion.startAt || '',
          endAt: promotion.endAt || '',
          status: promotion.status || 'ACTIVE',
        });
      } else {
        showError('Error', response.error || 'Failed to load promotion detail');
        navigation.goBack();
      }
    } catch (error) {
      console.error('❌ [EditStockPromotion] Error loading detail:', error);
      showError('Error', 'Failed to load promotion detail');
      navigation.goBack();
    } finally {
      setInitialLoading(false);
    }
  };

  const formatDateForAPI = (date) => {
    if (!date) return '';
    return new Date(date).toISOString();
  };

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  const handleStartDateChange = (event, selectedDate) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      let dateWithTime = selectedDate;
      if (Platform.OS === 'android') {
        const now = new Date();
        dateWithTime = new Date(selectedDate);
        dateWithTime.setHours(now.getHours());
        dateWithTime.setMinutes(now.getMinutes());
        dateWithTime.setSeconds(0);
        dateWithTime.setMilliseconds(0);
      }

      setStartDate(dateWithTime);
      const formattedDate = formatDateForAPI(dateWithTime);
      setFormData((prev) => ({ ...prev, startAt: formattedDate }));

      if (dateWithTime > endDate) {
        setEndDate(dateWithTime);
        setFormData((prev) => ({ ...prev, endAt: formattedDate }));
      }
    }
  };

  const handleEndDateChange = (event, selectedDate) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      let dateWithTime = selectedDate;
      if (Platform.OS === 'android') {
        const now = new Date();
        dateWithTime = new Date(selectedDate);
        dateWithTime.setHours(now.getHours());
        dateWithTime.setMinutes(now.getMinutes());
        dateWithTime.setSeconds(0);
        dateWithTime.setMilliseconds(0);
      }

      if (dateWithTime < startDate) {
        showError('Error', 'End date must be after start date');
        return;
      }
      setEndDate(dateWithTime);
      const formattedDate = formatDateForAPI(dateWithTime);
      setFormData((prev) => ({ ...prev, endAt: formattedDate }));
    }
  };

  const handleUpdatePromotion = async () => {
    if (!formData.name || !formData.description || !formData.value || !formData.startAt || !formData.endAt) {
      showError('Error', 'Please fill in all required fields');
      return;
    }

    if (!stockPromotionId) {
      showError('Error', 'Promotion information not found');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        valueType: formData.valueType,
        value: parseFloat(formData.value),
        startAt: formData.startAt,
        endAt: formData.endAt,
        status: formData.status,
      };

      const response = await stockPromotionService.updateStockPromotion(stockPromotionId, payload);

      if (response.success) {
        showSuccess('Success', 'Stock promotion updated successfully!');
        setTimeout(() => {
          navigation.goBack();
        }, 1200);
      } else {
        showError('Error', response.error || 'Failed to update stock promotion');
      }
    } catch (error) {
      console.error('❌ [EditStockPromotion] Error updating promotion:', error);
      showError('Error', 'Failed to update stock promotion');
    } finally {
      setSaving(false);
    }
  };

  const renderContent = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Promotion Information</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Promotion Name *</Text>
          <TextInput
            style={styles.textInput}
            value={formData.name}
            onChangeText={(text) => setFormData((prev) => ({ ...prev, name: text }))}
            placeholder="Enter promotion name"
            placeholderTextColor={COLORS.TEXT.SECONDARY}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Description *</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={formData.description}
            onChangeText={(text) => setFormData((prev) => ({ ...prev, description: text }))}
            placeholder="Enter description"
            placeholderTextColor={COLORS.TEXT.SECONDARY}
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Discount Type *</Text>
          <View style={styles.selectorRow}>
            <TouchableOpacity
              style={[
                styles.selectorOption,
                formData.valueType === 'PERCENT' && styles.selectedOption,
              ]}
              onPress={() => setFormData((prev) => ({ ...prev, valueType: 'PERCENT' }))}
            >
              <Text
                style={[
                  styles.selectorOptionText,
                  formData.valueType === 'PERCENT' && styles.selectedOptionText,
                ]}
              >
                PERCENT (%)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.selectorOption,
                formData.valueType === 'FIXED' && styles.selectedOption,
              ]}
              onPress={() => setFormData((prev) => ({ ...prev, valueType: 'FIXED' }))}
            >
              <Text
                style={[
                  styles.selectorOptionText,
                  formData.valueType === 'FIXED' && styles.selectedOptionText,
                ]}
              >
                FIXED (VND)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Value *</Text>
          <TextInput
            style={styles.textInput}
            value={formData.value}
            onChangeText={(text) => setFormData((prev) => ({ ...prev, value: text }))}
            placeholder={
              formData.valueType === 'PERCENT'
                ? 'Enter percentage (e.g., 10)'
                : 'Enter amount (e.g., 50000)'
            }
            placeholderTextColor={COLORS.TEXT.SECONDARY}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Start Date *</Text>
          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => setShowStartDatePicker(true)}
          >
            <Text
              style={[
                styles.dateInputText,
                !formData.startAt && styles.dateInputTextPlaceholder,
              ]}
            >
              {formData.startAt
                ? formatDateForDisplay(formData.startAt)
                : 'Select start date'}
            </Text>
            <Calendar size={20} color={COLORS.TEXT.SECONDARY} />
          </TouchableOpacity>
        </View>

        {showStartDatePicker && (
          <DateTimePicker
            value={startDate}
            mode={Platform.OS === 'ios' ? 'datetime' : 'date'}
            is24Hour
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleStartDateChange}
          />
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>End Date *</Text>
          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => setShowEndDatePicker(true)}
          >
            <Text
              style={[
                styles.dateInputText,
                !formData.endAt && styles.dateInputTextPlaceholder,
              ]}
            >
              {formData.endAt
                ? formatDateForDisplay(formData.endAt)
                : 'Select end date'}
            </Text>
            <Calendar size={20} color={COLORS.TEXT.SECONDARY} />
          </TouchableOpacity>
        </View>

        {showEndDatePicker && (
          <DateTimePicker
            value={endDate}
            mode={Platform.OS === 'ios' ? 'datetime' : 'date'}
            is24Hour
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleEndDateChange}
            minimumDate={startDate}
          />
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Status *</Text>
          <View style={styles.selectorRow}>
            <TouchableOpacity
              style={[
                styles.selectorOption,
                formData.status === 'ACTIVE' && styles.selectedOption,
              ]}
              onPress={() => setFormData((prev) => ({ ...prev, status: 'ACTIVE' }))}
            >
              <Text
                style={[
                  styles.selectorOptionText,
                  formData.status === 'ACTIVE' && styles.selectedOptionText,
                ]}
              >
                ACTIVE
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.selectorOption,
                formData.status === 'INACTIVE' && styles.selectedOption,
              ]}
              onPress={() => setFormData((prev) => ({ ...prev, status: 'INACTIVE' }))}
            >
              <Text
                style={[
                  styles.selectorOptionText,
                  formData.status === 'INACTIVE' && styles.selectedOptionText,
                ]}
              >
                INACTIVE
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, saving && styles.submitButtonDisabled]}
          onPress={handleUpdatePromotion}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#009DFF" />
          ) : (
            <Text style={styles.submitButtonText}>Update Promotion</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft color={COLORS.TEXT.WHITE} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Stock Promotion</Text>
        <View style={styles.headerActions} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {initialLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#009DFF" />
            <Text style={styles.loadingText}>Loading promotion...</Text>
          </View>
        ) : (
          renderContent()
        )}
      </KeyboardAvoidingView>

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
    borderRadius: SIZES.RADIUS.ROUND,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: SIZES.FONT.LARGE,
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
  formSection: {
    padding: SIZES.PADDING.LARGE,
  },
  sectionTitle: {
    fontSize: SIZES.FONT.XLARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SIZES.PADDING.LARGE,
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
    borderColor: COLORS.BORDER?.PRIMARY || 'rgba(0,0,0,0.05)',
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  selectorRow: {
    flexDirection: 'row',
    gap: SIZES.PADDING.SMALL,
  },
  selectorOption: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.BORDER?.PRIMARY || 'rgba(0,0,0,0.05)',
  },
  selectedOption: {
    backgroundColor: '#009DFF',
    borderColor: '#009DFF',
  },
  selectorOptionText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '600',
  },
  selectedOptionText: {
    color: COLORS.TEXT.WHITE,
  },
  dateInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.MEDIUM,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.BORDER?.PRIMARY || 'rgba(0,0,0,0.05)',
  },
  dateInputText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
    flex: 1,
  },
  dateInputTextPlaceholder: {
    color: COLORS.TEXT.SECONDARY,
  },
  submitButton: {
    backgroundColor: '#009DFF',
    borderRadius: SIZES.RADIUS.LARGE,
    paddingVertical: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
    marginTop: SIZES.PADDING.XLARGE,
  },
  submitButtonDisabled: {
    opacity: 0.6,
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
    backgroundColor: COLORS.SURFACE,
    borderTopLeftRadius: SIZES.RADIUS.XXLARGE,
    borderTopRightRadius: SIZES.RADIUS.XXLARGE,
    padding: SIZES.PADDING.LARGE,
  },
  loadingText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
    marginTop: SIZES.PADDING.SMALL,
  },
});

export default EditStockPromotionScreen;

