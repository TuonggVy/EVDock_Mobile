import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Modal, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS, SIZES } from '../../constants';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import installmentPlanService from '../../services/installmentPlanService';
import { ArrowLeft, Calendar } from 'lucide-react-native';

const CreateInstallmentPlanScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { alertConfig, hideAlert, showSuccess, showError } = useCustomAlert();

  const [form, setForm] = useState({
    name: '',
    tensor: '',
    interestRate: '',
    interestRateTotalMonth: '',
    totalPaidMonth: '',
    interestPaidType: 'FLAT',
    prePaidPercent: '',
    processFee: '',
    startAt: null,
    endAt: null,
    status: 'ACTIVE',
  });

  const [saving, setSaving] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [errors, setErrors] = useState({});

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!form.tensor.trim()) {
      newErrors.tensor = 'Tensor is required';
    }
    if (!form.interestRate || parseFloat(form.interestRate) <= 0) {
      newErrors.interestRate = 'Interest rate must be greater than 0';
    }
    if (!form.interestRateTotalMonth || parseInt(form.interestRateTotalMonth) <= 0) {
      newErrors.interestRateTotalMonth = 'Interest total months must be greater than 0';
    }
    if (!form.totalPaidMonth || parseInt(form.totalPaidMonth) <= 0) {
      newErrors.totalPaidMonth = 'Total paid months must be greater than 0';
    }
    if (!form.prePaidPercent || parseFloat(form.prePaidPercent) < 0) {
      newErrors.prePaidPercent = 'Prepaid percent is required';
    }
    if (!form.processFee || parseFloat(form.processFee) < 0) {
      newErrors.processFee = 'Process fee is required';
    }
    if (!form.startAt) {
      newErrors.startAt = 'Start date is required';
    }
    if (!form.endAt) {
      newErrors.endAt = 'End date is required';
    }
    if (form.startAt && form.endAt && new Date(form.startAt) >= new Date(form.endAt)) {
      newErrors.endAt = 'End date must be after start date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatDateDisplay = (date) => {
    if (!date) return '';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).replace(',', '');
    } catch {
      return '';
    }
  };

  const handleDateChange = (event, selectedDate, field) => {
    if (Platform.OS === 'android') {
      if (field === 'startAt') {
        setShowStartDatePicker(false);
      } else {
        setShowEndDatePicker(false);
      }
    }
    if (event.type === 'set' && selectedDate) {
      updateField(field, selectedDate);
    } else if (event.type === 'dismissed') {
      // User cancelled
      if (field === 'startAt') {
        setShowStartDatePicker(false);
      } else {
        setShowEndDatePicker(false);
      }
    }
  };

  const openNativeDatePicker = async (fieldKey) => {
    if (Platform.OS === 'android') {
      try {
        const { DateTimePickerAndroid } = require('@react-native-community/datetimepicker');
        const current = form[fieldKey] ? new Date(form[fieldKey]) : new Date();
        DateTimePickerAndroid.open({
          value: current,
          mode: 'date',
          onChange: (event, selectedDate) => {
            if (event.type === 'set' && selectedDate) {
              // After selecting date, open time picker
              DateTimePickerAndroid.open({
                value: selectedDate,
                mode: 'time',
                onChange: (_e2, selectedTime) => {
                  const finalDate = selectedTime || selectedDate;
                  updateField(fieldKey, finalDate);
                },
              });
            } else if (event.type === 'dismissed') {
              if (fieldKey === 'startAt') {
                setShowStartDatePicker(false);
              } else {
                setShowEndDatePicker(false);
              }
            }
          },
        });
      } catch (e) {
        console.error('Date picker error:', e);
        showError('Error', 'Date picker is unavailable. Please enter date manually.');
      }
    } else {
      // iOS - show picker
      if (fieldKey === 'startAt') {
        setShowStartDatePicker(true);
      } else {
        setShowEndDatePicker(true);
      }
    }
  };

  const onSave = async () => {
    if (!validateForm()) {
      showError('Validation Error', 'Please fill in all required fields correctly');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: form.name.trim(),
        tensor: form.tensor.trim(),
        interestRate: parseFloat(form.interestRate),
        interestRateTotalMonth: parseInt(form.interestRateTotalMonth),
        totalPaidMonth: parseInt(form.totalPaidMonth),
        interestPaidType: form.interestPaidType,
        prePaidPercent: parseFloat(form.prePaidPercent),
        processFee: parseFloat(form.processFee),
        startAt: new Date(form.startAt).toISOString(),
        endAt: new Date(form.endAt).toISOString(),
        status: form.status,
        agencyId: parseInt(user?.agencyId) || 1,
      };

      const response = await installmentPlanService.createInstallmentPlan(payload);

      if (response?.data || response?.statusCode === 201) {
        showSuccess('Success', 'Installment plan created successfully!');
        setTimeout(() => {
          navigation.goBack();
        }, 1500);
      } else {
        showError('Error', 'Failed to create installment plan');
      }
    } catch (e) {
      console.error('Create failed', e);
      const errorMessage = e?.response?.data?.message || e?.message || 'Could not create installment plan';
      showError('Error', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <ArrowLeft color={COLORS.TEXT.WHITE} size={24} />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={styles.headerTitleText}>Create Installment Plan</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
        {/* Name */}
        <View style={styles.field}>
          <Text style={styles.label}>
            Name <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, errors.name && styles.inputError]}
            value={form.name}
            onChangeText={(t) => updateField('name', t)}
            placeholder="Enter installment plan name"
            placeholderTextColor={COLORS.TEXT.SECONDARY}
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
        </View>

        {/* Tensor */}
        <View style={styles.field}>
          <Text style={styles.label}>
            Tensor <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, errors.tensor && styles.inputError]}
            value={form.tensor}
            onChangeText={(t) => updateField('tensor', t)}
            placeholder="Enter tensor (e.g., Techcombank)"
            placeholderTextColor={COLORS.TEXT.SECONDARY}
          />
          {errors.tensor && <Text style={styles.errorText}>{errors.tensor}</Text>}
        </View>

        {/* Interest Rate */}
        <View style={styles.field}>
          <Text style={styles.label}>
            Interest Rate (%) <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, errors.interestRate && styles.inputError]}
            value={form.interestRate}
            onChangeText={(t) => updateField('interestRate', t.replace(/[^0-9.]/g, ''))}
            placeholder="Enter interest rate"
            placeholderTextColor={COLORS.TEXT.SECONDARY}
            keyboardType="numeric"
          />
          {errors.interestRate && <Text style={styles.errorText}>{errors.interestRate}</Text>}
        </View>

        {/* Interest Rate Total Months */}
        <View style={styles.field}>
          <Text style={styles.label}>
            Interest Rate Total Months <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, errors.interestRateTotalMonth && styles.inputError]}
            value={form.interestRateTotalMonth}
            onChangeText={(t) => updateField('interestRateTotalMonth', t.replace(/[^0-9]/g, ''))}
            placeholder="Enter total months for interest rate"
            placeholderTextColor={COLORS.TEXT.SECONDARY}
            keyboardType="numeric"
          />
          {errors.interestRateTotalMonth && <Text style={styles.errorText}>{errors.interestRateTotalMonth}</Text>}
        </View>

        {/* Total Paid Months */}
        <View style={styles.field}>
          <Text style={styles.label}>
            Total Paid Months <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, errors.totalPaidMonth && styles.inputError]}
            value={form.totalPaidMonth}
            onChangeText={(t) => updateField('totalPaidMonth', t.replace(/[^0-9]/g, ''))}
            placeholder="Enter total months for payment"
            placeholderTextColor={COLORS.TEXT.SECONDARY}
            keyboardType="numeric"
          />
          {errors.totalPaidMonth && <Text style={styles.errorText}>{errors.totalPaidMonth}</Text>}
        </View>

        {/* Interest Paid Type */}
        <View style={styles.field}>
          <Text style={styles.label}>
            Interest Paid Type <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity style={styles.selector} onPress={() => setShowTypeDropdown(true)}>
            <Text style={styles.selectorText}>{form.interestPaidType || 'Select type'}</Text>
          </TouchableOpacity>
        </View>

        {/* Prepaid Percent */}
        <View style={styles.field}>
          <Text style={styles.label}>
            Prepaid Percent (%) <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, errors.prePaidPercent && styles.inputError]}
            value={form.prePaidPercent}
            onChangeText={(t) => updateField('prePaidPercent', t.replace(/[^0-9.]/g, ''))}
            placeholder="Enter prepaid percent"
            placeholderTextColor={COLORS.TEXT.SECONDARY}
            keyboardType="numeric"
          />
          {errors.prePaidPercent && <Text style={styles.errorText}>{errors.prePaidPercent}</Text>}
        </View>

        {/* Process Fee */}
        <View style={styles.field}>
          <Text style={styles.label}>
            Process Fee (VND) <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, errors.processFee && styles.inputError]}
            value={form.processFee}
            onChangeText={(t) => updateField('processFee', t.replace(/[^0-9]/g, ''))}
            placeholder="Enter process fee"
            placeholderTextColor={COLORS.TEXT.SECONDARY}
            keyboardType="numeric"
          />
          {errors.processFee && <Text style={styles.errorText}>{errors.processFee}</Text>}
        </View>

        {/* Start Date */}
        <View style={styles.field}>
          <Text style={styles.label}>
            Start Date <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity
            style={[styles.inputWrapper, errors.startAt && styles.inputError]}
            onPress={() => openNativeDatePicker('startAt')}
          >
            <Text style={[styles.dateInputText, !form.startAt && styles.placeholderText]}>
              {form.startAt ? formatDateDisplay(form.startAt) : 'Select start date'}
            </Text>
            <Calendar size={18} color={COLORS.TEXT.SECONDARY} />
          </TouchableOpacity>
          {errors.startAt && <Text style={styles.errorText}>{errors.startAt}</Text>}
          {Platform.OS === 'ios' && showStartDatePicker && (
            <DateTimePicker
              value={form.startAt || new Date()}
              mode="datetime"
              display="spinner"
              onChange={(event, date) => handleDateChange(event, date, 'startAt')}
            />
          )}
        </View>

        {/* End Date */}
        <View style={styles.field}>
          <Text style={styles.label}>
            End Date <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity
            style={[styles.inputWrapper, errors.endAt && styles.inputError]}
            onPress={() => openNativeDatePicker('endAt')}
          >
            <Text style={[styles.dateInputText, !form.endAt && styles.placeholderText]}>
              {form.endAt ? formatDateDisplay(form.endAt) : 'Select end date'}
            </Text>
            <Calendar size={18} color={COLORS.TEXT.SECONDARY} />
          </TouchableOpacity>
          {errors.endAt && <Text style={styles.errorText}>{errors.endAt}</Text>}
          {Platform.OS === 'ios' && showEndDatePicker && (
            <DateTimePicker
              value={form.endAt || new Date()}
              mode="datetime"
              display="spinner"
              onChange={(event, date) => handleDateChange(event, date, 'endAt')}
            />
          )}
        </View>

        {/* Status */}
        <View style={styles.field}>
          <Text style={styles.label}>
            Status <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity style={styles.selector} onPress={() => setShowStatusDropdown(true)}>
            <Text style={styles.selectorText}>{form.status || 'Select status'}</Text>
          </TouchableOpacity>
        </View>

        {/* Save Button */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionWrapper} disabled={saving} onPress={onSave}>
            <LinearGradient colors={['#009DFF', '#009DFF']} style={styles.saveButton}>
              <Text style={styles.saveText}>{saving ? 'Creating...' : 'Create Plan'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>



      {/* Type Dropdown Modal */}
      <Modal transparent visible={showTypeDropdown} animationType="fade" onRequestClose={() => setShowTypeDropdown(false)}>
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowTypeDropdown(false)}
        >
          <View style={styles.modalSheet}>
            {['FLAT', 'DECLINING'].map((opt) => (
              <TouchableOpacity
                key={opt}
                style={styles.optionItem}
                onPress={() => {
                  updateField('interestPaidType', opt);
                  setShowTypeDropdown(false);
                }}
              >
                <Text style={styles.optionText}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Status Dropdown Modal */}
      <Modal transparent visible={showStatusDropdown} animationType="fade" onRequestClose={() => setShowStatusDropdown(false)}>
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowStatusDropdown(false)}
        >
          <View style={styles.modalSheet}>
            {['ACTIVE', 'INACTIVE'].map((opt) => (
              <TouchableOpacity
                key={opt}
                style={styles.optionItem}
                onPress={() => {
                  updateField('status', opt);
                  setShowStatusDropdown(false);
                }}
              >
                <Text style={styles.optionText}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={hideAlert}
      />
    </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: SIZES.RADIUS.ROUND,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitleText: {
    color: COLORS.TEXT.WHITE,
    fontSize: SIZES.FONT.XXLARGE,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  content: {
    backgroundColor: COLORS.SURFACE,
    borderTopLeftRadius: SIZES.RADIUS.XXLARGE,
    borderTopRightRadius: SIZES.RADIUS.XXLARGE,
  },
  form: {
    padding: SIZES.PADDING.LARGE,
  },
  field: {
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  label: {
    color: COLORS.TEXT.PRIMARY,
    marginBottom: 6,
    fontWeight: '600',
    fontSize: SIZES.FONT.MEDIUM,
  },
  required: {
    color: COLORS.ERROR,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.TEXT.PRIMARY,
    backgroundColor: '#FAFAFA',
    fontSize: SIZES.FONT.MEDIUM,
  },
  inputError: {
    borderColor: COLORS.ERROR,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FAFAFA',
  },
  dateInputText: {
    flex: 1,
    color: COLORS.TEXT.PRIMARY,
    fontSize: SIZES.FONT.MEDIUM,
  },
  placeholderText: {
    color: COLORS.TEXT.SECONDARY,
  },
  selector: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FAFAFA',
  },
  selectorText: {
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '600',
    fontSize: SIZES.FONT.MEDIUM,
  },
  errorText: {
    color: COLORS.ERROR,
    fontSize: SIZES.FONT.SMALL,
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SIZES.PADDING.LARGE,
  },
  actionWrapper: {
    flex: 1,
  },
  saveButton: {
    paddingVertical: 14,
    borderRadius: SIZES.RADIUS.LARGE,
    alignItems: 'center',
  },
  saveText: {
    color: COLORS.TEXT.WHITE,
    fontWeight: '700',
    fontSize: SIZES.FONT.MEDIUM,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  modalSheet: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.LARGE,
    overflow: 'hidden',
  },
  optionItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  optionText: {
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '600',
    fontSize: SIZES.FONT.MEDIUM,
  },
});

export default CreateInstallmentPlanScreen;
