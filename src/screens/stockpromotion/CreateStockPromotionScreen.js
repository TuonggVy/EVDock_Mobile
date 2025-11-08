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
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS, SIZES } from '../../constants';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import stockPromotionService from '../../services/stockPromotionService';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowLeft, Calendar } from 'lucide-react-native';

const CreateStockPromotionScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { alertConfig, hideAlert, showSuccess, showError } = useCustomAlert();
  const [creating, setCreating] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

  const [newPromotion, setNewPromotion] = useState({
    name: '',
    description: '',
    valueType: 'PERCENT',
    value: '',
    startAt: '',
    endAt: '',
    status: 'ACTIVE',
    agencyId: user?.agencyId || null,
  });

  useEffect(() => {
    if (user?.agencyId) {
      setNewPromotion(prev => ({ ...prev, agencyId: user.agencyId }));
    }
  }, [user]);

  // Date formatting functions
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

  // Date picker handlers - simplified
  const handleStartDateChange = (event, selectedDate) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      // On Android (date mode), preserve the time from current date or set to current time
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
      setNewPromotion(prev => ({ ...prev, startAt: formattedDate }));
      
      // If end date is before start date, update end date
      if (dateWithTime > endDate) {
        setEndDate(dateWithTime);
        setNewPromotion(prev => ({ ...prev, endAt: formattedDate }));
      }
    }
  };

  const handleEndDateChange = (event, selectedDate) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      // On Android (date mode), preserve the time from current date or set to end of day
      let dateWithTime = selectedDate;
      if (Platform.OS === 'android') {
        const now = new Date();
        dateWithTime = new Date(selectedDate);
        dateWithTime.setHours(now.getHours());
        dateWithTime.setMinutes(now.getMinutes());
        dateWithTime.setSeconds(0);
        dateWithTime.setMilliseconds(0);
      }
      
      // Ensure end date is not before start date
      if (dateWithTime < startDate) {
        showError('Error', 'End date must be after start date');
        return;
      }
      setEndDate(dateWithTime);
      const formattedDate = formatDateForAPI(dateWithTime);
      setNewPromotion(prev => ({ ...prev, endAt: formattedDate }));
    }
  };

  const handleCreatePromotion = async () => {
    // Validation
    if (!newPromotion.name || !newPromotion.description || !newPromotion.value || !newPromotion.startAt || !newPromotion.endAt) {
      showError('Error', 'Please fill in all required fields');
      return;
    }

    if (!newPromotion.agencyId) {
      showError('Error', 'Agency information not found');
      return;
    }

    setCreating(true);
    try {
      const dataToSubmit = {
        name: newPromotion.name,
        description: newPromotion.description,
        valueType: newPromotion.valueType,
        value: parseFloat(newPromotion.value),
        startAt: newPromotion.startAt,
        endAt: newPromotion.endAt,
        status: newPromotion.status,
        agencyId: parseInt(newPromotion.agencyId),
      };

      const response = await stockPromotionService.createStockPromotion(dataToSubmit);

      if (response.success) {
        showSuccess('Success', 'Stock promotion created successfully!');
        setTimeout(() => {
          navigation.goBack();
        }, 1500);
      } else {
        showError('Error', response.error || 'Failed to create stock promotion');
      }
    } catch (error) {
      console.error('Error creating stock promotion:', error);
      showError('Error', 'Failed to create stock promotion');
    } finally {
      setCreating(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft color={COLORS.TEXT.WHITE} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Stock Promotion</Text>
        <View style={styles.headerActions} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Promotion Name *</Text>
              <TextInput
                style={styles.textInput}
                value={newPromotion.name}
                onChangeText={(text) => setNewPromotion(prev => ({ ...prev, name: text }))}
                placeholder="Enter promotion name"
                placeholderTextColor={COLORS.TEXT.SECONDARY}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description *</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={newPromotion.description}
                onChangeText={(text) => setNewPromotion(prev => ({ ...prev, description: text }))}
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
                    newPromotion.valueType === 'PERCENT' && styles.selectedOption
                  ]}
                  onPress={() => setNewPromotion(prev => ({ ...prev, valueType: 'PERCENT' }))}
                >
                  <Text style={[
                    styles.selectorOptionText,
                    newPromotion.valueType === 'PERCENT' && styles.selectedOptionText
                  ]}>
                    PERCENT (%)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.selectorOption,
                    newPromotion.valueType === 'FIXED' && styles.selectedOption
                  ]}
                  onPress={() => setNewPromotion(prev => ({ ...prev, valueType: 'FIXED' }))}
                >
                  <Text style={[
                    styles.selectorOptionText,
                    newPromotion.valueType === 'FIXED' && styles.selectedOptionText
                  ]}>
                    FIXED (VND)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Value *</Text>
              <TextInput
                style={styles.textInput}
                value={newPromotion.value}
                onChangeText={(text) => setNewPromotion(prev => ({ ...prev, value: text }))}
                placeholder={newPromotion.valueType === 'PERCENT' ? 'Enter percentage (e.g., 10)' : 'Enter amount (e.g., 50000)'}
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
                <Text style={[
                  styles.dateInputText,
                  !newPromotion.startAt && styles.dateInputTextPlaceholder
                ]}>
                  {newPromotion.startAt ? formatDateForDisplay(newPromotion.startAt) : 'Select start date'}
                </Text>
                <Calendar size={20} color={COLORS.TEXT.SECONDARY} />
              </TouchableOpacity>
            </View>

            {showStartDatePicker && (
              <DateTimePicker
                value={startDate}
                mode={Platform.OS === 'ios' ? 'datetime' : 'date'}
                is24Hour={true}
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
                <Text style={[
                  styles.dateInputText,
                  !newPromotion.endAt && styles.dateInputTextPlaceholder
                ]}>
                  {newPromotion.endAt ? formatDateForDisplay(newPromotion.endAt) : 'Select end date'}
                </Text>
                <Calendar size={20} color={COLORS.TEXT.SECONDARY} />
              </TouchableOpacity>
            </View>

            {showEndDatePicker && (
              <DateTimePicker
                value={endDate}
                mode={Platform.OS === 'ios' ? 'datetime' : 'date'}
                is24Hour={true}
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
                    newPromotion.status === 'ACTIVE' && styles.selectedOption
                  ]}
                  onPress={() => setNewPromotion(prev => ({ ...prev, status: 'ACTIVE' }))}
                >
                  <Text style={[
                    styles.selectorOptionText,
                    newPromotion.status === 'ACTIVE' && styles.selectedOptionText
                  ]}>
                    ACTIVE
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.selectorOption,
                    newPromotion.status === 'INACTIVE' && styles.selectedOption
                  ]}
                  onPress={() => setNewPromotion(prev => ({ ...prev, status: 'INACTIVE' }))}
                >
                  <Text style={[
                    styles.selectorOptionText,
                    newPromotion.status === 'INACTIVE' && styles.selectedOptionText
                  ]}>
                    INACTIVE
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.createButton, creating && styles.createButtonDisabled]}
              onPress={handleCreatePromotion}
              disabled={creating}
            >
          {creating ? (
            <ActivityIndicator color="#009DFF" />
              ) : (
                <Text style={styles.createButtonText}>Create</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.PADDING.LARGE,
    paddingTop: Platform.OS === 'ios' ? SIZES.PADDING.XLARGE : SIZES.PADDING.XXXLARGE + 5,
    paddingBottom: SIZES.PADDING.MEDIUM,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
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
    height: 40,
  },
  createButton: {
    backgroundColor: '#009DFF',
    borderRadius: SIZES.RADIUS.LARGE,
    paddingVertical: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SIZES.PADDING.XLARGE,
    alignSelf: 'stretch',
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.SURFACE,
    borderTopLeftRadius: SIZES.RADIUS.XXLARGE,
    borderTopRightRadius: SIZES.RADIUS.XXLARGE,
    paddingBottom: SIZES.PADDING.XXXLARGE,
  },
  formSection: {
    padding: SIZES.PADDING.LARGE,
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
    minHeight: 100,
    textAlignVertical: 'top',
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
});

export default CreateStockPromotionScreen;

