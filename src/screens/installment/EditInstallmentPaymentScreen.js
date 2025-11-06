import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, TextInput, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS, SIZES } from '../../constants';
import { ArrowLeft } from 'lucide-react-native';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import installmentContractService from '../../services/installmentContractService';
import LoadingScreen from '../../components/common/LoadingScreen';

const EditInstallmentPaymentScreen = ({ navigation, route }) => {
  const { installmentPaymentId } = route.params || {};
  const { alertConfig, hideAlert, showError, showSuccess } = useCustomAlert();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [paymentDetail, setPaymentDetail] = useState(null);
  const [installmentContractId, setInstallmentContractId] = useState(null);

  const statusOptions = ['PENDING', 'PAID', 'OVERDUE'];

  const [formData, setFormData] = useState({
    paidDate: new Date(),
    amountDue: '',
    amountPaid: '',
    penaltyAmount: '',
    status: 'PENDING',
  });

  const [showPaidDatePicker, setShowPaidDatePicker] = useState(false);

  useEffect(() => {
    loadPaymentDetail();
  }, [installmentPaymentId]);

  const loadPaymentDetail = async () => {
    try {
      setLoadingData(true);
      const response = await installmentContractService.getInstallmentPaymentDetail(installmentPaymentId);
      if (response.success && response.data) {
        setPaymentDetail(response.data);
        // Store installmentContractId for navigation
        if (response.data.installmentContractId) {
          setInstallmentContractId(response.data.installmentContractId);
        }
        // Pre-fill form with existing data
        const currentStatus = response.data.status || 'PENDING';
        const validStatus = statusOptions.includes(currentStatus) ? currentStatus : 'PENDING';
        
        setFormData({
          paidDate: response.data.paidDate ? new Date(response.data.paidDate) : new Date(),
          amountDue: response.data.amountDue?.toString() || '',
          amountPaid: response.data.amountPaid?.toString() || '',
          penaltyAmount: response.data.penaltyAmount?.toString() || '',
          status: validStatus,
        });
      } else {
        showError('Error', response.error || 'Failed to load payment details');
        setTimeout(() => navigation.goBack(), 2000);
      }
    } catch (error) {
      console.error('Error loading payment detail:', error);
      showError('Error', 'Failed to load payment details');
      setTimeout(() => navigation.goBack(), 2000);
    } finally {
      setLoadingData(false);
    }
  };

  const updateField = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowPaidDatePicker(false);
    }
    if (event.type === 'set' && selectedDate) {
      updateField('paidDate', selectedDate);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (formData.status === 'PAID' && (!formData.amountPaid || parseFloat(formData.amountPaid) <= 0)) {
      showError('Error', 'Please enter a valid amount paid when status is PAID');
      return;
    }

    try {
      setLoading(true);

      const payload = {
        paidDate: formData.paidDate.toISOString(),
        amountDue: formData.amountDue ? parseFloat(formData.amountDue) : 0,
        amountPaid: formData.amountPaid ? parseFloat(formData.amountPaid) : 0,
        penaltyAmount: formData.penaltyAmount ? parseFloat(formData.penaltyAmount) : 0,
        status: formData.status,
      };

      const response = await installmentContractService.updateInstallmentPayment(installmentPaymentId, payload);

      if (response.success) {
        showSuccess('Success', response.message || 'Payment updated successfully');
        setTimeout(() => {
          if (installmentContractId) {
            navigation.navigate('InstallmentPayment', { installmentContractId });
          } else {
            navigation.goBack();
          }
        }, 1500);
      } else {
        showError('Error', response.error || 'Failed to update payment');
      }
    } catch (error) {
      console.error('Error updating payment:', error);
      showError('Error', 'Failed to update payment');
    } finally {
      setLoading(false);
    }
  };

  const formatDateForDisplay = (date) => {
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
            <Text style={styles.title}>Edit Payment</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.formSection}>
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

          {/* Paid Date */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Paid Date</Text>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => setShowPaidDatePicker(true)}
            >
              <Text style={styles.dateInputText}>
                {formatDateForDisplay(formData.paidDate) || 'Select paid date'}
              </Text>
            </TouchableOpacity>
            {showPaidDatePicker && (
              <DateTimePicker
                value={formData.paidDate}
                mode="datetime"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            )}
          </View>

          {/* Amount Due */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Amount Due</Text>
            <TextInput
              style={styles.input}
              value={formData.amountDue}
              onChangeText={(text) => updateField('amountDue', text)}
              placeholder="Enter amount due"
              placeholderTextColor={COLORS.TEXT.SECONDARY}
              keyboardType="numeric"
            />
          </View>

          {/* Amount Paid */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Amount Paid</Text>
            <TextInput
              style={styles.input}
              value={formData.amountPaid}
              onChangeText={(text) => updateField('amountPaid', text)}
              placeholder="Enter amount paid"
              placeholderTextColor={COLORS.TEXT.SECONDARY}
              keyboardType="numeric"
            />
          </View>

          {/* Penalty Amount */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Penalty Amount</Text>
            <TextInput
              style={styles.input}
              value={formData.penaltyAmount}
              onChangeText={(text) => updateField('penaltyAmount', text)}
              placeholder="Enter penalty amount"
              placeholderTextColor={COLORS.TEXT.SECONDARY}
              keyboardType="numeric"
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <LinearGradient colors={['#009DFF', '#009DFF']} style={styles.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={styles.buttonText}>Update Payment</Text>
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
    borderWidth: 1,
    borderColor: COLORS.BORDER.PRIMARY,
  },
  dateInputText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: SIZES.PADDING.SMALL,
    flexWrap: 'wrap',
  },
  typeOption: {
    flex: 1,
    minWidth: '30%',
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
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '500',
  },
  typeOptionTextSelected: {
    color: "#009DFF",
    fontWeight: '700',
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

export default EditInstallmentPaymentScreen;
