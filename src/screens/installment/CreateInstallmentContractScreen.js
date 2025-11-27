import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, TextInput, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES } from '../../constants';
import { ArrowLeft, Calendar } from 'lucide-react-native';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import installmentContractService from '../../services/installmentContractService';
import customerContractService from '../../services/customerContractService';
import installmentPlanService from '../../services/installmentPlanService';
import LoadingScreen from '../../components/common/LoadingScreen';
import DateTimePicker from '@react-native-community/datetimepicker';
import { formatPrice } from '../../utils/promotionUtils';

const CreateInstallmentContractScreen = ({ navigation, route }) => {
  const { contractId, installmentPlanId } = route.params || {};
  const { alertConfig, hideAlert, showError, showSuccess } = useCustomAlert();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [contractDetail, setContractDetail] = useState(null);
  const [planDetail, setPlanDetail] = useState(null);

  const penaltyTypeOptions = ['DAILY', 'FIXED'];
  const statusOptions = ['ACTIVE', 'COMPLETED', 'OVERDUE'];

  const [formData, setFormData] = useState({
    startDate: new Date(),
    penaltyValue: '',
    penaltyType: 'FIXED',
    status: 'ACTIVE',
  });

  const updateField = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    loadContractAndPlanDetails();
  }, [contractId, installmentPlanId]);

  const loadContractAndPlanDetails = async () => {
    try {
      setLoadingData(true);

      // Load contract detail
      if (contractId) {
        const contractResponse = await customerContractService.getCustomerContractDetail(contractId);
        if (contractResponse.success) {
          setContractDetail(contractResponse.data);
        } else {
          console.error('Error loading contract:', contractResponse.error);
        }
      }

      // Load plan detail
      if (installmentPlanId) {
        const planResponse = await installmentPlanService.getInstallmentPlanDetail(installmentPlanId);
        if (planResponse?.data) {
          setPlanDetail(planResponse.data);
        } else {
          console.error('Error loading plan');
        }
      }
    } catch (error) {
      console.error('Error loading details:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const formatDateForDisplay = (date) => {
    if (!date) return 'N/A';
    try {
      const d = new Date(date);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return 'N/A';
    }
  };

  const formatDateTimeForDisplay = (date) => {
    if (!date) return '';
    try {
      const d = new Date(date);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch {
      return '';
    }
  };

  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (event.type === 'set' && selectedDate) {
      updateField('startDate', selectedDate);
      if (Platform.OS === 'android') {
        // On Android, we might need a time picker after date
        // For now, just set the date
      }
    }
  };

  const getContractTypeLabel = (type) => {
    switch (type?.toUpperCase()) {
      case 'FULL': return 'Full Payment';
      case 'DEBT': return 'Debt';
      default: return type || 'Unknown';
    }
  };

  const getStatusText = (status) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE': return 'Active';
      case 'COMPLETED': return 'Completed';
      case 'OVERDUE': return 'Overdue';
      default: return status || 'Unknown';
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.startDate) {
      showError('Error', 'Please select a start date');
      return;
    }

    if (!formData.penaltyValue || parseFloat(formData.penaltyValue) <= 0) {
      showError('Error', 'Please enter a valid penalty value');
      return;
    }

    if (!contractId) {
      showError('Error', 'Customer contract ID is missing');
      return;
    }

    if (!installmentPlanId) {
      showError('Error', 'Installment plan ID is missing');
      return;
    }

    try {
      setLoading(true);

      // Format date to ISO string
      const startDateISO = formData.startDate.toISOString();

      const payload = {
        startDate: startDateISO,
        penaltyValue: parseFloat(formData.penaltyValue),
        penaltyType: formData.penaltyType,
        status: formData.status,
        customerContractId: parseInt(contractId),
        installmentPlanId: parseInt(installmentPlanId),
      };

      const response = await installmentContractService.createInstallmentContract(payload);

      if (response.success) {
        showSuccess('Success', response.message || 'Installment contract created successfully');
        setTimeout(() => {
          navigation.navigate('CustomerContractDetail', { contractId });
        }, 1500);
      } else {
        showError('Error', response.error || 'Failed to create installment contract');
      }
    } catch (error) {
      console.error('Error creating installment contract:', error);
      showError('Error', 'Failed to create installment contract');
    } finally {
      setLoading(false);
    }
  };

  if (loading || loadingData) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <ArrowLeft color={COLORS.TEXT.WHITE} size={24} />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={styles.title}>Create Installment Contract</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.formSection}>
          {/* Start Date */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Start Date *</Text>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateInputText}>
                {formatDateTimeForDisplay(formData.startDate) || 'Select start date'}
              </Text>
              <Calendar color="#009DFF" size={20} />
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={formData.startDate}
                mode={Platform.OS === 'ios' ? 'datetime' : 'date'}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                minimumDate={new Date()}
              />
            )}
          </View>

          {/* Penalty Value */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Penalty Value *</Text>
            <TextInput
              style={styles.input}
              value={formData.penaltyValue}
              onChangeText={(text) => updateField('penaltyValue', text)}
              placeholder="Enter penalty value"
              placeholderTextColor={COLORS.TEXT.SECONDARY}
              keyboardType="numeric"
            />
          </View>

          {/* Penalty Type */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Penalty Type *</Text>
            <View style={styles.typeSelector}>
              {penaltyTypeOptions.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeOption,
                    formData.penaltyType === type && styles.typeOptionSelected
                  ]}
                  onPress={() => updateField('penaltyType', type)}
                >
                  <Text style={[
                    styles.typeOptionText,
                    formData.penaltyType === type && styles.typeOptionTextSelected
                  ]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Status */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Status *</Text>
            <View style={styles.typeSelector}>
              {statusOptions.map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.typeOption,
                    formData.status === status && styles.typeOptionSelected
                  ]}
                  onPress={() => updateField('status', status)}
                >
                  <Text style={[
                    styles.typeOptionText,
                    formData.status === status && styles.typeOptionTextSelected
                  ]}>
                    {status}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Contract Information */}
          {contractDetail && (
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Customer Contract Information</Text>
              {contractDetail.title && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Title:</Text>
                  <Text style={styles.infoValue}>{contractDetail.title}</Text>
                </View>
              )}
              {contractDetail.contractPaidType && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Type:</Text>
                  <Text style={styles.infoValue}>{getContractTypeLabel(contractDetail.contractPaidType)}</Text>
                </View>
              )}
              {contractDetail.finalPrice !== undefined && contractDetail.finalPrice !== null && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Final Price:</Text>
                  <Text style={styles.infoValue}>{formatPrice(contractDetail.finalPrice || 0)}</Text>
                </View>
              )}
              {contractDetail.signDate && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Sign Date:</Text>
                  <Text style={styles.infoValue}>{formatDateForDisplay(contractDetail.signDate)}</Text>
                </View>
              )}
              {contractDetail.deliveryDate && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Delivery Date:</Text>
                  <Text style={styles.infoValue}>{formatDateForDisplay(contractDetail.deliveryDate)}</Text>
                </View>
              )}
              {contractDetail.customer && (
                <>
                  {contractDetail.customer.name && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Customer Name:</Text>
                      <Text style={styles.infoValue}>{contractDetail.customer.name}</Text>
                    </View>
                  )}
                  {contractDetail.customer.phone && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Customer Phone:</Text>
                      <Text style={styles.infoValue}>{contractDetail.customer.phone}</Text>
                    </View>
                  )}
                </>
              )}
            </View>
          )}

          {/* Installment Plan Information */}
          {planDetail && (
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Installment Plan Information</Text>
              {planDetail.name && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Plan Name:</Text>
                  <Text style={styles.infoValue}>{planDetail.name}</Text>
                </View>
              )}
              {planDetail.id && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Plan ID:</Text>
                  <Text style={styles.infoValue}>{planDetail.id}</Text>
                </View>
              )}
              {planDetail.interestRate !== undefined && planDetail.interestRate !== null && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Interest Rate:</Text>
                  <Text style={styles.infoValue}>{planDetail.interestRate}%</Text>
                </View>
              )}
              {planDetail.interestPaidType && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Interest Type:</Text>
                  <Text style={styles.infoValue}>{planDetail.interestPaidType}</Text>
                </View>
              )}
              {planDetail.interestRateTotalMonth !== undefined && planDetail.interestRateTotalMonth !== null && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Total Months:</Text>
                  <Text style={styles.infoValue}>{planDetail.interestRateTotalMonth} months</Text>
                </View>
              )}
              {planDetail.totalPaidMonth !== undefined && planDetail.totalPaidMonth !== null && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Payment Period:</Text>
                  <Text style={styles.infoValue}>{planDetail.totalPaidMonth} months</Text>
                </View>
              )}
              {planDetail.prePaidPercent !== undefined && planDetail.prePaidPercent !== null && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Prepaid Percent:</Text>
                  <Text style={styles.infoValue}>{planDetail.prePaidPercent}%</Text>
                </View>
              )}
              {planDetail.processFee !== undefined && planDetail.processFee !== null && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Process Fee:</Text>
                  <Text style={styles.infoValue}>{planDetail.processFee}</Text>
                </View>
              )}
              {planDetail.status && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Status:</Text>
                  <Text style={styles.infoValue}>{getStatusText(planDetail.status)}</Text>
                </View>
              )}
              {planDetail.startAt && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Start Date:</Text>
                  <Text style={styles.infoValue}>{formatDateForDisplay(planDetail.startAt)}</Text>
                </View>
              )}
              {planDetail.endAt && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>End Date:</Text>
                  <Text style={styles.infoValue}>{formatDateForDisplay(planDetail.endAt)}</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <LinearGradient colors={['#009DFF', '#009DFF']} style={styles.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={styles.buttonText}>Create Contract</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

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
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
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
  title: {
    fontSize: SIZES.FONT.XXLARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SIZES.PADDING.LARGE,
  },
  formSection: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.LARGE,
    padding: SIZES.PADDING.LARGE,
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
  input: {
    backgroundColor: '#E5E7EB',
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
    borderWidth: 1,
    borderColor: COLORS.BORDER.PRIMARY,
  },
  dateInput: {
    backgroundColor: '#E5E7EB',
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.BORDER.PRIMARY,
  },
  dateInputText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
    flex: 1,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: SIZES.PADDING.MEDIUM,
  },
  typeOption: {
    flex: 1,
    backgroundColor: '#E5E7EB',
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.BORDER.PRIMARY,
  },
  typeOptionSelected: {
    borderColor: "#009DFF",
    backgroundColor: 'rgba(106, 163, 255, 0.05)',
  },
  typeOptionText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '500',
  },
  typeOptionTextSelected: {
    color: "#009DFF",
    fontWeight: '700',
  },
  infoCard: {
    backgroundColor: '#E5E7EB',
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
    marginTop: SIZES.PADDING.MEDIUM,
  },
  infoTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: '700',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.PADDING.SMALL,
  },
  infoLabel: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '600',
  },
  footer: {
    padding: SIZES.PADDING.LARGE,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
    borderTopWidth: 1,
    borderTopColor: COLORS.BACKGROUND.SECONDARY,
  },
  submitButton: {
    borderRadius: SIZES.RADIUS.LARGE,
    overflow: 'hidden',
  },
  buttonGradient: {
    padding: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
});

export default CreateInstallmentContractScreen;
