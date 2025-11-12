import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, TextInput, KeyboardAvoidingView, Platform, Modal, FlatList, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES } from '../../constants';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import customerContractService from '../../services/customerContractService';
import customerManagementService from '../../services/customerManagementService';
import motorbikeService from '../../services/motorbikeService';
import { quotationService } from '../../services/quotationService';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowLeft, ChevronDown, Calendar } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { formatPrice } from '../../utils/promotionUtils';

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'COMPLETED', label: 'Completed' },
];

const CreateCustomerContractScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const { alertConfig, hideAlert, showSuccess, showError } = useCustomAlert();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [motorbikes, setMotorbikes] = useState([]);
  const [colors, setColors] = useState([]);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showMotorbikeModal, setShowMotorbikeModal] = useState(false);
  const [showColorModal, setShowColorModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showSignDatePicker, setShowSignDatePicker] = useState(false);
  
  // Get quotationId from route params if available
  const routeQuotationId = route?.params?.quotationId;
  const [quotationId, setQuotationId] = useState(routeQuotationId || '');
  const [loadingQuotation, setLoadingQuotation] = useState(false);
  const [formData, setFormData] = useState({
    title: '', content: '', finalPrice: '',
    contractPaidType: 'FULL', status: 'PENDING',
    customerId: null, electricMotorbikeId: null, colorId: null,
    signDate: null, quotationId: null,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadOptions();
  }, []);

  // Auto-load quotation data if quotationId is provided via route params
  useEffect(() => {
    if (routeQuotationId && routeQuotationId.trim()) {
      loadQuotationData(routeQuotationId);
    }
  }, [routeQuotationId]);

  useEffect(() => {
    if (formData.electricMotorbikeId) {
      loadColorsForMotorbike(parseInt(formData.electricMotorbikeId));
    } else {
      setColors([]);
      setFormData(prev => ({ ...prev, colorId: null }));
    }
  }, [formData.electricMotorbikeId]);

  const loadQuotationData = async (id) => {
    if (!id || !id.trim()) {
      return;
    }
    
    setLoadingQuotation(true);
    try {
      const response = await quotationService.getQuotationById(parseInt(id.trim()));
      if (response.success && response.data) {
        const quotation = response.data;
        
        // Map quotation data to contract form
        setFormData(prev => ({
          ...prev,
          customerId: quotation.customerId || prev.customerId,
          electricMotorbikeId: quotation.motorbikeId || quotation.electricMotorbikeId || prev.electricMotorbikeId,
          colorId: quotation.colorId || prev.colorId,
          finalPrice: quotation.finalPrice?.toString() || prev.finalPrice,
          quotationId: parseInt(id.trim()),
          title: prev.title || `Contract for ${quotation.customer?.name || 'Customer'}`,
          content: prev.content || quotation.note || `Contract created from quotation #${id}`,
        }));
        
        // Load colors for the selected motorbike
        if (quotation.motorbikeId || quotation.electricMotorbikeId) {
          await loadColorsForMotorbike(parseInt(quotation.motorbikeId || quotation.electricMotorbikeId));
        }
        
        showSuccess('Success', 'Quotation data loaded successfully');
      } else {
        showError('Error', response.error || 'Failed to load quotation');
      }
    } catch (error) {
      console.error('Error loading quotation:', error);
      showError('Error', 'Failed to load quotation. Please check the quotation ID.');
    } finally {
      setLoadingQuotation(false);
    }
  };

  const handleQuotationIdChange = (value) => {
    setQuotationId(value.replace(/[^0-9]/g, ''));
  };

  const handleLoadQuotation = () => {
    if (!quotationId.trim()) {
      showError('Error', 'Please enter a quotation ID');
      return;
    }
    loadQuotationData(quotationId);
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
      showError('Error', 'Failed to load form options');
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

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.content.trim()) newErrors.content = 'Content is required';
    if (!formData.finalPrice || parseFloat(formData.finalPrice) <= 0) newErrors.finalPrice = 'Final price must be greater than 0';
    if (!formData.customerId) newErrors.customerId = 'Customer is required';
    if (!formData.electricMotorbikeId) newErrors.electricMotorbikeId = 'Motorbike is required';
    if (!formData.colorId) newErrors.colorId = 'Color is required';
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
      const contractData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        finalPrice: parseFloat(formData.finalPrice),
        contractPaidType: formData.contractPaidType,
        status: formData.status,
        customerId: parseInt(formData.customerId),
        staffId: user?.id ? parseInt(user.id) : 1,
        agencyId: user?.agencyId ? parseInt(user.agencyId) : 1,
        electricMotorbikeId: parseInt(formData.electricMotorbikeId),
        colorId: parseInt(formData.colorId),
        ...(formData.signDate && { signDate: new Date(formData.signDate).toISOString() }),
        ...(formData.quotationId && { quotationId: parseInt(formData.quotationId) }),
      };
      const response = await customerContractService.createCustomerContract(contractData);
      if (response.success) {
        showSuccess('Success', 'Customer contract created successfully!');
        setTimeout(() => {
          navigation.reset({
            index: 0,
            routes: [{ name: 'CustomerContractManagement' }],
          });
        }, 1500);
      } else {
        showError('Error', response.error || 'Failed to create customer contract');
      }
    } catch (error) {
      console.error('Error creating customer contract:', error);
      showError('Error', error.message || 'Failed to create customer contract. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getCustomerName = () => {
    if (!formData.customerId) return 'Select Customer';
    const customer = customers.find(c => c.id === formData.customerId);
    return customer ? `${customer.name} (${customer.phone})` : 'Select Customer';
  };

  const getMotorbikeName = () => {
    if (!formData.electricMotorbikeId) return 'Select Motorbike';
    const motorbike = motorbikes.find(m => m.id === formData.electricMotorbikeId);
    return motorbike ? `${motorbike.name} - ${motorbike.model}` : 'Select Motorbike';
  };

  const getColorName = () => {
    if (!formData.colorId) return 'Select Color';
    const color = colors.find(c => c.id === formData.colorId);
    return color ? color.colorType : 'Select Color';
  };

  const getStatusName = () => {
    const status = STATUS_OPTIONS.find(opt => opt.value === formData.status);
    return status ? status.label : 'Select Status';
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

  const handleDateChange = (event, selectedDate, field) => {
    if (Platform.OS === 'android') {
      setShowSignDatePicker(false);
    }
    if (selectedDate) {
      handleInputChange(field, selectedDate);
      if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <ArrowLeft color={COLORS.TEXT.WHITE} size={24} />
          </TouchableOpacity>
          <View style={styles.headerTitle}><Text style={styles.title}>Create Contract</Text></View>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Contract Information</Text>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Quotation ID</Text>
              <View style={styles.quotationIdContainer}>
                <TextInput 
                  style={[styles.quotationIdInput, routeQuotationId && styles.quotationIdInputDisabled]} 
                  placeholder="Enter quotation ID" 
                  placeholderTextColor={COLORS.TEXT.SECONDARY} 
                  value={quotationId} 
                  onChangeText={handleQuotationIdChange}
                  keyboardType="numeric"
                  editable={!routeQuotationId}
                />
                <TouchableOpacity 
                  style={[styles.loadQuotationButton, (loadingQuotation || !!routeQuotationId || !quotationId.trim()) && styles.loadQuotationButtonDisabled]} 
                  onPress={handleLoadQuotation}
                  disabled={Boolean(loadingQuotation || routeQuotationId || !quotationId.trim())}
                >
                  {loadingQuotation ? (
                    <ActivityIndicator size="small" color="#009DFF" />
                  ) : (
                    <Text style={styles.loadQuotationButtonText}>Load</Text>
                  )}
                </TouchableOpacity>
              </View>
              <Text style={styles.formHelper}>
                {routeQuotationId ? 'Quotation ID loaded from previous screen' : 'Enter quotation ID to auto-fill contract information'}
              </Text>
            </View>

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
              <Text style={styles.formLabel}>Customer <Text style={styles.required}>*</Text></Text>
              <TouchableOpacity style={[styles.dropdown, errors.customerId && styles.dropdownError]} onPress={() => setShowCustomerModal(true)}>
                <Text style={[styles.dropdownText, !formData.customerId && styles.dropdownPlaceholder]}>{getCustomerName()}</Text>
                <ChevronDown color={COLORS.TEXT.SECONDARY} size={20} />
              </TouchableOpacity>
              {errors.customerId && <Text style={styles.errorText}>{errors.customerId}</Text>}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Motorbike <Text style={styles.required}>*</Text></Text>
              <TouchableOpacity style={[styles.dropdown, errors.electricMotorbikeId && styles.dropdownError]} onPress={() => setShowMotorbikeModal(true)}>
                <Text style={[styles.dropdownText, !formData.electricMotorbikeId && styles.dropdownPlaceholder]}>{getMotorbikeName()}</Text>
                <ChevronDown color={COLORS.TEXT.SECONDARY} size={20} />
              </TouchableOpacity>
              {errors.electricMotorbikeId && <Text style={styles.errorText}>{errors.electricMotorbikeId}</Text>}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Color <Text style={styles.required}>*</Text></Text>
              <TouchableOpacity style={[styles.dropdown, errors.colorId && styles.dropdownError]} onPress={() => setShowColorModal(true)} disabled={!formData.electricMotorbikeId}>
                <Text style={[styles.dropdownText, !formData.colorId && styles.dropdownPlaceholder]}>{getColorName()}</Text>
                <ChevronDown color={COLORS.TEXT.SECONDARY} size={20} />
              </TouchableOpacity>
              {errors.colorId && <Text style={styles.errorText}>{errors.colorId}</Text>}
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
                <Calendar color={COLORS.TEXT.SECONDARY} size={20} />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Contract Paid Type <Text style={styles.required}>*</Text></Text>
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
        <TouchableOpacity style={[styles.submitButton, loading && styles.submitButtonDisabled]} onPress={handleSubmit} disabled={loading}>
          <LinearGradient colors={['#009DFF', '#009DFF']} style={styles.submitGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            {loading ? <ActivityIndicator color="#009DFF" /> : <Text style={styles.submitButtonText}>Create Contract</Text>}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <Modal visible={showCustomerModal} transparent animationType="slide" onRequestClose={() => setShowCustomerModal(false)}>
        <View style={styles.modalOverlay}><View style={styles.modalContent}>
          <View style={styles.modalHeader}><Text style={styles.modalTitle}>Select Customer</Text><TouchableOpacity onPress={() => setShowCustomerModal(false)}><Text style={styles.modalClose}>✕</Text></TouchableOpacity></View>
          <FlatList data={customers} keyExtractor={(item) => item.id.toString()} renderItem={({ item }) => (
            <TouchableOpacity style={styles.modalItem} onPress={() => { setFormData(prev => ({ ...prev, customerId: item.id })); setShowCustomerModal(false); }}>
              <Text style={styles.modalItemTitle}>{item.name}</Text><Text style={styles.modalItemSubtitle}>{item.phone} • {item.email}</Text>
            </TouchableOpacity>
          )} ListEmptyComponent={<View style={styles.emptyModal}><Text style={styles.emptyModalText}>No customers found</Text></View>} />
        </View></View>
      </Modal>

      <Modal visible={showMotorbikeModal} transparent animationType="slide" onRequestClose={() => setShowMotorbikeModal(false)}>
        <View style={styles.modalOverlay}><View style={styles.modalContent}>
          <View style={styles.modalHeader}><Text style={styles.modalTitle}>Select Motorbike</Text><TouchableOpacity onPress={() => setShowMotorbikeModal(false)}><Text style={styles.modalClose}>✕</Text></TouchableOpacity></View>
          <FlatList data={motorbikes} keyExtractor={(item) => item.id.toString()} renderItem={({ item }) => (
            <TouchableOpacity style={styles.modalItem} onPress={() => { setFormData(prev => ({ ...prev, electricMotorbikeId: item.id, colorId: null })); setShowMotorbikeModal(false); }}>
              <Text style={styles.modalItemTitle}>{item.name}</Text><Text style={styles.modalItemSubtitle}>{item.model} • {item.makeFrom}</Text>
            </TouchableOpacity>
          )} ListEmptyComponent={<View style={styles.emptyModal}><Text style={styles.emptyModalText}>No motorbikes found</Text></View>} />
        </View></View>
      </Modal>

      <Modal visible={showColorModal} transparent animationType="slide" onRequestClose={() => setShowColorModal(false)}>
        <View style={styles.modalOverlay}><View style={styles.modalContent}>
          <View style={styles.modalHeader}><Text style={styles.modalTitle}>Select Color</Text><TouchableOpacity onPress={() => setShowColorModal(false)}><Text style={styles.modalClose}>✕</Text></TouchableOpacity></View>
          <FlatList data={colors} keyExtractor={(item) => item.id.toString()} renderItem={({ item }) => (
            <TouchableOpacity style={styles.modalItem} onPress={() => { setFormData(prev => ({ ...prev, colorId: item.id })); setShowColorModal(false); }}>
              <Text style={styles.modalItemTitle}>{item.colorType}</Text>
            </TouchableOpacity>
          )} ListEmptyComponent={<View style={styles.emptyModal}><Text style={styles.emptyModalText}>No colors found</Text></View>} />
        </View></View>
      </Modal>

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

      {Platform.OS === 'ios' ? (
        <Modal
          visible={showSignDatePicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowSignDatePicker(false)}
        >
          <View style={styles.datePickerModalOverlay}>
            <View style={styles.datePickerModalContent}>
              <View style={styles.datePickerHeader}>
                <TouchableOpacity onPress={() => setShowSignDatePicker(false)}>
                  <Text style={styles.datePickerCancelButton}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.datePickerTitle}>Select Date</Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowSignDatePicker(false);
                  }}
                >
                  <Text style={styles.datePickerDoneButton}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={formData.signDate || new Date()}
                mode="date"
                display="spinner"
                onChange={(event, date) => handleDateChange(event, date, 'signDate')}
                style={styles.datePickerIOS}
                textColor={COLORS.TEXT.PRIMARY}
              />
            </View>
          </View>
        </Modal>
      ) : (
        showSignDatePicker && (
          <DateTimePicker
            value={formData.signDate || new Date()}
            mode="date"
            display="default"
            onChange={(event, date) => handleDateChange(event, date, 'signDate')}
          />
        )
      )}

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
  formGroup: { marginBottom: SIZES.PADDING.MEDIUM },
  formLabel: { fontSize: SIZES.FONT.MEDIUM, fontWeight: '600', color: COLORS.TEXT.PRIMARY, marginBottom: SIZES.PADDING.SMALL },
  required: { color: COLORS.ERROR },
  formInput: { backgroundColor: '#E5E7EB', borderRadius: SIZES.RADIUS.MEDIUM, padding: SIZES.PADDING.MEDIUM, fontSize: SIZES.FONT.MEDIUM, color: COLORS.TEXT.PRIMARY, borderWidth: 1, borderColor: '#D1D5DB' },
  formInputError: { borderColor: COLORS.ERROR },
  textArea: { minHeight: 100, paddingTop: SIZES.PADDING.MEDIUM },
  formHelper: { fontSize: SIZES.FONT.SMALL, color: COLORS.TEXT.SECONDARY, marginTop: SIZES.PADDING.XSMALL },
  errorText: { fontSize: SIZES.FONT.SMALL, color: COLORS.ERROR, marginTop: SIZES.PADDING.XSMALL },
  dropdown: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#E5E7EB', borderRadius: SIZES.RADIUS.MEDIUM, padding: SIZES.PADDING.MEDIUM, borderWidth: 1, borderColor: '#D1D5DB' },
  dropdownError: { borderColor: COLORS.ERROR },
  dropdownText: { flex: 1, fontSize: SIZES.FONT.MEDIUM, color: COLORS.TEXT.PRIMARY },
  dropdownPlaceholder: { color: COLORS.TEXT.SECONDARY },
  dateInput: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#E5E7EB', borderRadius: SIZES.RADIUS.MEDIUM, padding: SIZES.PADDING.MEDIUM, borderWidth: 1, borderColor: '#D1D5DB' },
  dateInputText: { flex: 1, fontSize: SIZES.FONT.MEDIUM, color: COLORS.TEXT.PRIMARY },
  dateInputPlaceholder: { color: COLORS.TEXT.SECONDARY },
  radioGroup: { flexDirection: 'row', gap: SIZES.PADDING.MEDIUM },
  radioButton: { flexDirection: 'row', alignItems: 'center', padding: SIZES.PADDING.MEDIUM, backgroundColor: '#E5E7EB', borderRadius: SIZES.RADIUS.MEDIUM, flex: 1 },
  radioButtonSmall: { flex: 0, paddingHorizontal: SIZES.PADDING.SMALL, paddingVertical: SIZES.PADDING.SMALL, marginRight: SIZES.PADDING.SMALL },
  radioButtonActive: { backgroundColor: "#009DFF" + '20', borderWidth: 1, borderColor: "#009DFF" },
  radioCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: COLORS.TEXT.SECONDARY, marginRight: SIZES.PADDING.SMALL },
  radioCircleSmall: { width: 16, height: 16, borderRadius: 8, marginRight: SIZES.PADDING.XSMALL },
  radioCircleActive: { borderColor: "#009DFF", backgroundColor: "#009DFF" },
  radioLabel: { fontSize: SIZES.FONT.SMALL, color: COLORS.TEXT.PRIMARY },
  footer: { padding: SIZES.PADDING.LARGE, backgroundColor: COLORS.BACKGROUND.PRIMARY, borderTopWidth: 1, borderTopColor: COLORS.BACKGROUND.SECONDARY },
  submitButton: { borderRadius: SIZES.RADIUS.LARGE, overflow: 'hidden' },
  submitButtonDisabled: { opacity: 0.6 },
  submitGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: SIZES.PADDING.MEDIUM, gap: SIZES.PADDING.SMALL },
  submitButtonText: { fontSize: SIZES.FONT.LARGE, fontWeight: 'bold', color: COLORS.TEXT.WHITE },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.SURFACE, borderTopLeftRadius: SIZES.RADIUS.LARGE, borderTopRightRadius: SIZES.RADIUS.LARGE, maxHeight: '80%', paddingBottom: SIZES.PADDING.LARGE },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SIZES.PADDING.LARGE, borderBottomWidth: 1, borderBottomColor: COLORS.BORDER.PRIMARY },
  modalTitle: { fontSize: SIZES.FONT.LARGE, fontWeight: 'bold', color: COLORS.TEXT.PRIMARY },
  modalClose: { fontSize: SIZES.FONT.XXLARGE, color: COLORS.TEXT.SECONDARY },
  modalItem: { padding: SIZES.PADDING.LARGE, borderBottomWidth: 1, borderBottomColor: COLORS.BORDER.PRIMARY },
  modalItemTitle: { fontSize: SIZES.FONT.MEDIUM, fontWeight: '600', color: COLORS.TEXT.PRIMARY, marginBottom: SIZES.PADDING.XSMALL },
  modalItemSubtitle: { fontSize: SIZES.FONT.SMALL, color: COLORS.TEXT.SECONDARY },
  emptyModal: { padding: SIZES.PADDING.XXXLARGE, alignItems: 'center' },
  emptyModalText: { fontSize: SIZES.FONT.MEDIUM, color: COLORS.TEXT.SECONDARY },
  quotationIdContainer: { flexDirection: 'row', gap: SIZES.PADDING.SMALL },
  quotationIdInput: { flex: 1, backgroundColor: '#E5E7EB', borderRadius: SIZES.RADIUS.MEDIUM, padding: SIZES.PADDING.MEDIUM, fontSize: SIZES.FONT.MEDIUM, color: COLORS.TEXT.PRIMARY, borderWidth: 1, borderColor: '#D1D5DB' },
  quotationIdInputDisabled: { backgroundColor: '#F3F4F6', color: COLORS.TEXT.SECONDARY },
  loadQuotationButton: { backgroundColor: "#009DFF", borderRadius: SIZES.RADIUS.MEDIUM, paddingHorizontal: SIZES.PADDING.LARGE, justifyContent: 'center', alignItems: 'center', minWidth: 80 },
  loadQuotationButtonDisabled: { opacity: 0.6 },
  loadQuotationButtonText: { color: COLORS.TEXT.WHITE, fontSize: SIZES.FONT.MEDIUM, fontWeight: '600' },
  datePickerModalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  datePickerModalContent: { backgroundColor: COLORS.SURFACE, borderTopLeftRadius: SIZES.RADIUS.LARGE, borderTopRightRadius: SIZES.RADIUS.LARGE, paddingBottom: SIZES.PADDING.LARGE },
  datePickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SIZES.PADDING.LARGE, borderBottomWidth: 1, borderBottomColor: COLORS.BORDER.PRIMARY },
  datePickerTitle: { fontSize: SIZES.FONT.LARGE, fontWeight: 'bold', color: COLORS.TEXT.PRIMARY },
  datePickerCancelButton: { fontSize: SIZES.FONT.MEDIUM, color: COLORS.TEXT.SECONDARY },
  datePickerDoneButton: { fontSize: SIZES.FONT.MEDIUM, color: "#009DFF", fontWeight: '600' },
  datePickerIOS: { backgroundColor: COLORS.SURFACE },
});

export default CreateCustomerContractScreen;
