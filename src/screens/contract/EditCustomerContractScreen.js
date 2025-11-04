import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, TextInput, KeyboardAvoidingView, Platform, Modal, FlatList, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS, SIZES } from '../../constants';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import customerContractService from '../../services/customerContractService';
import customerManagementService from '../../services/customerManagementService';
import motorbikeService from '../../services/motorbikeService';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowLeft, ChevronDown, Calendar } from 'lucide-react-native';
import { formatPrice } from '../../utils/promotionUtils';
import LoadingScreen from '../../components/common/LoadingScreen';

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'COMPLETED', label: 'Completed' },
];

const EditCustomerContractScreen = ({ navigation, route }) => {
  const { contractId } = route.params || {};
  const { user } = useAuth();
  const { alertConfig, hideAlert, showSuccess, showError } = useCustomAlert();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [motorbikes, setMotorbikes] = useState([]);
  const [colors, setColors] = useState([]);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showMotorbikeModal, setShowMotorbikeModal] = useState(false);
  const [showColorModal, setShowColorModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showSignDatePicker, setShowSignDatePicker] = useState(false);
  const [showDeliveryDatePicker, setShowDeliveryDatePicker] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '', content: '', finalPrice: '', signDate: null, deliveryDate: null,
    contractPaidType: 'FULL', status: 'PENDING',
  });
  const [errors, setErrors] = useState({});
  const [contract, setContract] = useState(null);

  useEffect(() => {
    loadContractDetail();
    loadOptions();
  }, [contractId]);

  useEffect(() => {
    if (contract?.electricMotorbikeId) {
      loadColorsForMotorbike(parseInt(contract.electricMotorbikeId));
    }
  }, [contract]);

  const loadContractDetail = async () => {
    try {
      setLoading(true);
      const response = await customerContractService.getCustomerContractDetail(contractId);
      if (response.success && response.data) {
        const contractData = response.data;
        setContract(contractData);
        setFormData({
          title: contractData.title || '',
          content: contractData.content || '',
          finalPrice: contractData.finalPrice?.toString() || '',
          signDate: contractData.signDate ? new Date(contractData.signDate) : null,
          deliveryDate: contractData.deliveryDate ? new Date(contractData.deliveryDate) : null,
          contractPaidType: contractData.contractPaidType || 'FULL',
          status: contractData.status || 'PENDING',
        });
        // Load colors for the motorbike if available
        if (contractData.electricMotorbikeId) {
          loadColorsForMotorbike(parseInt(contractData.electricMotorbikeId));
        }
      } else {
        showError('Error', response.error || 'Failed to load contract details');
        setTimeout(() => navigation.goBack(), 2000);
      }
    } catch (error) {
      console.error('Error loading contract:', error);
      showError('Error', 'Failed to load contract details');
      setTimeout(() => navigation.goBack(), 2000);
    } finally {
      setLoading(false);
    }
  };

  const loadOptions = async () => {
    try {
      if (user?.agencyId) {
        const customersResponse = await customerManagementService.getCustomers(parseInt(user.agencyId), { limit: 1000 });
        setCustomers(Array.isArray(customersResponse) ? customersResponse : []);
      }
      const motorbikesResponse = await motorbikeService.getAllMotorbikes({ limit: 1000 });
      if (motorbikesResponse.success) setMotorbikes(motorbikesResponse.data || []);
    } catch (error) {
      console.error('Error loading options:', error);
    }
  };

  const loadColorsForMotorbike = async (motorbikeId) => {
    try {
      const response = await motorbikeService.getMotorbikeById(motorbikeId);
      if (response.success) {
        const motorbikeData = response.data?.data || response.data;
        const colorsArray = Array.isArray(motorbikeData?.colors)
          ? motorbikeData.colors.map(item => ({ id: item?.color?.id || item?.id, colorType: item?.color?.colorType || item?.colorType })).filter(c => c.id && c.colorType)
          : [];
        setColors(colorsArray);
      }
    } catch (error) {
      console.error('Error loading colors:', error);
      setColors([]);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDateForDisplay = (date) => {
    if (!date) return '';
    try {
      const d = new Date(date);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return '';
    }
  };

  const getStatusName = () => {
    const status = STATUS_OPTIONS.find(opt => opt.value === formData.status);
    return status ? status.label : 'Select Status';
  };

  const handleDateChange = (event, selectedDate, field) => {
    if (Platform.OS === 'android') {
      setShowSignDatePicker(false);
      setShowDeliveryDatePicker(false);
    }
    if (selectedDate) {
      handleInputChange(field, selectedDate);
      if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.content.trim()) newErrors.content = 'Content is required';
    if (!formData.finalPrice || parseFloat(formData.finalPrice) <= 0) newErrors.finalPrice = 'Final price must be greater than 0';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      showError('Error', 'Please check your input');
      return;
    }
    setSaving(true);
    try {
      const contractData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        finalPrice: parseFloat(formData.finalPrice),
        contractPaidType: formData.contractPaidType,
        status: formData.status,
        ...(formData.signDate && { signDate: new Date(formData.signDate).toISOString() }),
        ...(formData.deliveryDate && { deliveryDate: new Date(formData.deliveryDate).toISOString() }),
      };
      const response = await customerContractService.updateCustomerContract(contractId, contractData);
      if (response.success) {
        showSuccess('Success', 'Customer contract updated successfully!');
        setTimeout(() => navigation.goBack(), 1500);
      } else {
        showError('Error', response.error || 'Failed to update customer contract');
      }
    } catch (error) {
      console.error('Error updating customer contract:', error);
      showError('Error', error.message || 'Failed to update customer contract. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <ArrowLeft color={COLORS.TEXT.WHITE} size={24} />
          </TouchableOpacity>
          <View style={styles.headerTitle}><Text style={styles.title}>Edit Contract</Text></View>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Contract Information</Text>

            {contract && (
              <>
                <View style={styles.infoCard}>
                  {contract.contractCode && (
                    <>
                      <Text style={styles.infoLabel}>Contract Code:</Text>
                      <Text style={styles.infoValue}>{contract.contractCode}</Text>
                    </>
                  )}
                  {contract.customer && (
                    <>
                      <Text style={styles.infoLabel}>Customer:</Text>
                      <Text style={styles.infoValue}>{contract.customer.name || 'N/A'}</Text>
                      {contract.customer.phone && (
                        <>
                          <Text style={styles.infoLabel}>Customer Phone:</Text>
                          <Text style={styles.infoValue}>{contract.customer.phone}</Text>
                        </>
                      )}
                      {contract.customer.email && (
                        <>
                          <Text style={styles.infoLabel}>Customer Email:</Text>
                          <Text style={styles.infoValue}>{contract.customer.email}</Text>
                        </>
                      )}
                    </>
                  )}
                  {contract.electricMotorbike && (
                    <>
                      <Text style={styles.infoLabel}>Motorbike:</Text>
                      <Text style={styles.infoValue}>
                        {contract.electricMotorbike.name || 'N/A'}
                        {contract.electricMotorbike.model && ` - ${contract.electricMotorbike.model}`}
                        {contract.electricMotorbike.version && ` (${contract.electricMotorbike.version})`}
                      </Text>
                    </>
                  )}
                  {contract.color && (
                    <>
                      <Text style={styles.infoLabel}>Color:</Text>
                      <Text style={styles.infoValue}>{contract.color.colorType || 'N/A'}</Text>
                    </>
                  )}
                  {contract.staff && (
                    <>
                      <Text style={styles.infoLabel}>Created by Staff:</Text>
                      <Text style={styles.infoValue}>{contract.staff.username || contract.staff.email || 'N/A'}</Text>
                    </>
                  )}
                  {contract.quotationId && (
                    <>
                      <Text style={styles.infoLabel}>Quotation ID:</Text>
                      <Text style={styles.infoValue}>#{contract.quotationId}</Text>
                    </>
                  )}
                </View>
              </>
            )}

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Title <Text style={styles.required}>*</Text></Text>
              <TextInput style={[styles.formInput, errors.title && styles.formInputError]} placeholder="Enter contract title" placeholderTextColor={COLORS.TEXT.SECONDARY} value={formData.title} onChangeText={(value) => handleInputChange('title', value)} />
              {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Content <Text style={styles.required}>*</Text></Text>
              <TextInput style={[styles.formInput, styles.textArea, errors.content && styles.formInputError]} placeholder="Enter contract content/description" placeholderTextColor={COLORS.TEXT.SECONDARY} value={formData.content} onChangeText={(value) => handleInputChange('content', value)} multiline numberOfLines={4} textAlignVertical="top" />
              {errors.content && <Text style={styles.errorText}>{errors.content}</Text>}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Final Price (VND) <Text style={styles.required}>*</Text></Text>
              <TextInput style={[styles.formInput, errors.finalPrice && styles.formInputError]} placeholder="Enter final price" placeholderTextColor={COLORS.TEXT.SECONDARY} value={formData.finalPrice} onChangeText={(value) => handleInputChange('finalPrice', value.replace(/[^0-9]/g, ''))} keyboardType="numeric" />
              {formData.finalPrice && <Text style={styles.formHelper}>{formatPrice(parseFloat(formData.finalPrice) || 0)}</Text>}
              {errors.finalPrice && <Text style={styles.errorText}>{errors.finalPrice}</Text>}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Sign Date</Text>
              <TouchableOpacity style={styles.dateInput} onPress={() => setShowSignDatePicker(true)}>
                <Text style={[styles.dateInputText, !formData.signDate && styles.dateInputPlaceholder]}>
                  {formData.signDate ? formatDateForDisplay(formData.signDate) : 'Select sign date'}
                </Text>
                <Calendar size={20} color={COLORS.TEXT.SECONDARY} />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Delivery Date</Text>
              <TouchableOpacity style={styles.dateInput} onPress={() => setShowDeliveryDatePicker(true)}>
                <Text style={[styles.dateInputText, !formData.deliveryDate && styles.dateInputPlaceholder]}>
                  {formData.deliveryDate ? formatDateForDisplay(formData.deliveryDate) : 'Select delivery date'}
                </Text>
                <Calendar size={20} color={COLORS.TEXT.SECONDARY} />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Contract Paid Type</Text>
              <View style={styles.radioGroup}>
                <TouchableOpacity style={[styles.radioButton, formData.contractPaidType === 'FULL' && styles.radioButtonActive]} onPress={() => handleInputChange('contractPaidType', 'FULL')}>
                  <View style={[styles.radioCircle, formData.contractPaidType === 'FULL' && styles.radioCircleActive]} />
                  <Text style={styles.radioLabel}>Full Payment</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.radioButton, formData.contractPaidType === 'DEBT' && styles.radioButtonActive]} onPress={() => handleInputChange('contractPaidType', 'DEBT')}>
                  <View style={[styles.radioCircle, formData.contractPaidType === 'DEBT' && styles.radioCircleActive]} />
                  <Text style={styles.radioLabel}>Debt</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Status</Text>
              <TouchableOpacity style={styles.dropdown} onPress={() => setShowStatusModal(true)}>
                <Text style={[styles.dropdownText, !formData.status && styles.dropdownPlaceholder]}>
                  {getStatusName()}
                </Text>
                <ChevronDown color={COLORS.TEXT.SECONDARY} size={20} />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <TouchableOpacity style={[styles.submitButton, saving && styles.submitButtonDisabled]} onPress={handleSubmit} disabled={saving}>
          <LinearGradient colors={COLORS.GRADIENT.BLUE} style={styles.submitGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            {saving ? <ActivityIndicator color={COLORS.TEXT.WHITE} /> : <Text style={styles.submitButtonText}>Update Contract</Text>}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {showSignDatePicker && (
        <DateTimePicker value={formData.signDate || new Date()} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={(event, date) => handleDateChange(event, date, 'signDate')} />
      )}

      {showDeliveryDatePicker && (
        <DateTimePicker value={formData.deliveryDate || new Date()} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={(event, date) => handleDateChange(event, date, 'deliveryDate')} />
      )}

      <Modal visible={showStatusModal} transparent animationType="slide" onRequestClose={() => setShowStatusModal(false)}>
        <View style={styles.modalOverlay}><View style={styles.modalContent}>
          <View style={styles.modalHeader}><Text style={styles.modalTitle}>Select Status</Text><TouchableOpacity onPress={() => setShowStatusModal(false)}><Text style={styles.modalClose}>✕</Text></TouchableOpacity></View>
          <FlatList data={STATUS_OPTIONS} keyExtractor={(item) => item.value} renderItem={({ item }) => (
            <TouchableOpacity style={styles.modalItem} onPress={() => { setFormData(prev => ({ ...prev, status: item.value })); setShowStatusModal(false); }}>
              <Text style={styles.modalItemTitle}>{item.label}</Text>
            </TouchableOpacity>
          )} ListEmptyComponent={<View style={styles.emptyModal}><Text style={styles.emptyModalText}>No status found</Text></View>} />
        </View></View>
      </Modal>

      <CustomAlert visible={alertConfig.visible} title={alertConfig.title} message={alertConfig.message} type={alertConfig.type} onClose={hideAlert} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND.PRIMARY },
  header: { backgroundColor: COLORS.BACKGROUND.PRIMARY, paddingTop: SIZES.PADDING.XXXLARGE, paddingHorizontal: SIZES.PADDING.LARGE, paddingBottom: SIZES.PADDING.LARGE },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 40, height: 40, borderRadius: SIZES.RADIUS.ROUND, backgroundColor: 'rgba(255, 255, 255, 0.1)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { flex: 1, alignItems: 'center' },
  title: { fontSize: SIZES.FONT.HEADER, fontWeight: 'bold', color: COLORS.TEXT.WHITE },
  headerSpacer: { width: 40 },
  keyboardView: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { padding: SIZES.PADDING.LARGE },
  formSection: { backgroundColor: COLORS.SURFACE, borderRadius: SIZES.RADIUS.LARGE, padding: SIZES.PADDING.LARGE },
  sectionTitle: { fontSize: SIZES.FONT.LARGE, fontWeight: 'bold', color: COLORS.TEXT.PRIMARY, marginBottom: SIZES.PADDING.LARGE },
  infoCard: { backgroundColor: '#E5E7EB', borderRadius: SIZES.RADIUS.MEDIUM, padding: SIZES.PADDING.MEDIUM, marginBottom: SIZES.PADDING.MEDIUM },
  infoLabel: { fontSize: SIZES.FONT.SMALL, color: COLORS.TEXT.SECONDARY, marginTop: SIZES.PADDING.XSMALL },
  infoValue: { fontSize: SIZES.FONT.MEDIUM, color: COLORS.TEXT.PRIMARY, fontWeight: '600', marginBottom: SIZES.PADDING.XSMALL },
  formGroup: { marginBottom: SIZES.PADDING.MEDIUM },
  formLabel: { fontSize: SIZES.FONT.MEDIUM, fontWeight: '600', color: COLORS.TEXT.PRIMARY, marginBottom: SIZES.PADDING.SMALL },
  required: { color: COLORS.ERROR },
  formInput: { backgroundColor: '#E5E7EB', borderRadius: SIZES.RADIUS.MEDIUM, padding: SIZES.PADDING.MEDIUM, fontSize: SIZES.FONT.MEDIUM, color: COLORS.TEXT.PRIMARY, borderWidth: 1, borderColor: '#D1D5DB' },
  formInputError: { borderColor: COLORS.ERROR },
  textArea: { minHeight: 100, paddingTop: SIZES.PADDING.MEDIUM },
  formHelper: { fontSize: SIZES.FONT.SMALL, color: COLORS.TEXT.SECONDARY, marginTop: SIZES.PADDING.XSMALL },
  errorText: { fontSize: SIZES.FONT.SMALL, color: COLORS.ERROR, marginTop: SIZES.PADDING.XSMALL },
  dateInput: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#E5E7EB', borderRadius: SIZES.RADIUS.MEDIUM, padding: SIZES.PADDING.MEDIUM, borderWidth: 1, borderColor: '#D1D5DB' },
  dateInputText: { flex: 1, fontSize: SIZES.FONT.MEDIUM, color: COLORS.TEXT.PRIMARY },
  dateInputPlaceholder: { color: COLORS.TEXT.SECONDARY },
  dropdown: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#E5E7EB', borderRadius: SIZES.RADIUS.MEDIUM, padding: SIZES.PADDING.MEDIUM, borderWidth: 1, borderColor: '#D1D5DB' },
  dropdownText: { flex: 1, fontSize: SIZES.FONT.MEDIUM, color: COLORS.TEXT.PRIMARY },
  dropdownPlaceholder: { color: COLORS.TEXT.SECONDARY },
  radioGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: SIZES.PADDING.SMALL },
  radioButton: { flexDirection: 'row', alignItems: 'center', padding: SIZES.PADDING.MEDIUM, backgroundColor: '#E5E7EB', borderRadius: SIZES.RADIUS.MEDIUM, flex: 1 },
  radioButtonSmall: { flex: 0, paddingHorizontal: SIZES.PADDING.SMALL, paddingVertical: SIZES.PADDING.SMALL, marginRight: SIZES.PADDING.SMALL },
  radioButtonActive: { backgroundColor: COLORS.PRIMARY + '20', borderWidth: 1, borderColor: COLORS.PRIMARY },
  radioCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: COLORS.TEXT.SECONDARY, marginRight: SIZES.PADDING.SMALL },
  radioCircleSmall: { width: 16, height: 16, borderRadius: 8, marginRight: SIZES.PADDING.XSMALL },
  radioCircleActive: { borderColor: COLORS.PRIMARY, backgroundColor: COLORS.PRIMARY },
  radioLabel: { fontSize: SIZES.FONT.SMALL, color: COLORS.TEXT.PRIMARY },
  footer: { padding: SIZES.PADDING.LARGE, backgroundColor: COLORS.BACKGROUND.PRIMARY, borderTopWidth: 1, borderTopColor: COLORS.BACKGROUND.SECONDARY },
  submitButton: { borderRadius: SIZES.RADIUS.LARGE, overflow: 'hidden' },
  submitButtonDisabled: { opacity: 0.6 },
  submitGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: SIZES.PADDING.MEDIUM, gap: SIZES.PADDING.SMALL },
  submitButtonText: { fontSize: SIZES.FONT.LARGE, fontWeight: 'bold', color: COLORS.TEXT.WHITE },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.SURFACE, borderTopLeftRadius: SIZES.RADIUS.LARGE, borderTopRightRadius: SIZES.RADIUS.LARGE, maxHeight: '80%', paddingBottom: SIZES.PADDING.LARGE },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SIZES.PADDING.LARGE, borderBottomWidth: 1, borderBottomColor: COLORS.BACKGROUND.SECONDARY },
  modalTitle: { fontSize: SIZES.FONT.LARGE, fontWeight: 'bold', color: COLORS.TEXT.PRIMARY },
  modalClose: { fontSize: SIZES.FONT.XXLARGE, color: COLORS.TEXT.SECONDARY },
  modalItem: { padding: SIZES.PADDING.LARGE, borderBottomWidth: 1, borderBottomColor: COLORS.BACKGROUND.SECONDARY },
  modalItemTitle: { fontSize: SIZES.FONT.MEDIUM, fontWeight: '600', color: COLORS.TEXT.PRIMARY, marginBottom: SIZES.PADDING.XSMALL },
  emptyModal: { padding: SIZES.PADDING.XXXLARGE, alignItems: 'center' },
  emptyModalText: { fontSize: SIZES.FONT.MEDIUM, color: COLORS.TEXT.SECONDARY },
});

export default EditCustomerContractScreen;
