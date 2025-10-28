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
  Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS, SIZES } from '../../constants';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import { discountService } from '../../services/discountService';
import motorbikeService from '../../services/motorbikeService';
import agencyService from '../../services/agencyService';

const EditDiscountScreen = ({ navigation, route }) => {
  const discount = route.params?.discount;
  const [motorbikes, setMotorbikes] = useState([]);
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [agencyModalVisible, setAgencyModalVisible] = useState(false);
  const [motorbikeModalVisible, setMotorbikeModalVisible] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

  const { alertConfig, hideAlert, showSuccess, showError } = useCustomAlert();

  const [formData, setFormData] = useState({
    name: discount?.name || '',
    type: discount?.type || 'VOLUME',
    valueType: discount?.valueType || discount?.value_type || 'PERCENT',
    value: discount?.value?.toString() || '',
    min_quantity: discount?.min_quantity?.toString() || '',
    startAt: discount?.startAt ? discount.startAt.split('T')[0] : '',
    endAt: discount?.endAt ? discount.endAt.split('T')[0] : '',
    status: discount?.status || 'ACTIVE',
    agencyId: discount?.agencyId || null,
    motorbikeId: discount?.motorbikeId || null,
  });

  useEffect(() => {
    loadMotorbikes();
    loadAgencies();
    
    // Initialize dates from discount data
    if (discount) {
      if (discount.startAt) {
        const start = new Date(discount.startAt);
        setStartDate(start);
      }
      if (discount.endAt) {
        const end = new Date(discount.endAt);
        setEndDate(end);
      }
    }
  }, [discount]);

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

  const loadAgencies = async () => {
    try {
      const data = await agencyService.getAgencies({ limit: 100 });
      setAgencies(data || []);
    } catch (error) {
      console.error('Error loading agencies:', error);
    }
  };

  // Date formatting function for form data (YYYY-MM-DD)
  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Date formatting function for display (DD/MM/YYYY)
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Date picker handlers
  const handleStartDateChange = (event, selectedDate) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);
      const formattedDate = formatDate(selectedDate);
      setFormData({ ...formData, startAt: formattedDate });
      
      // If end date is before start date, update end date
      if (selectedDate > endDate) {
        setEndDate(selectedDate);
        setFormData({ ...formData, startAt: formattedDate, endAt: formattedDate });
      }
    }
  };

  const handleEndDateChange = (event, selectedDate) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      // Ensure end date is not before start date
      if (selectedDate < startDate) {
        showError('Ngày không hợp lệ', 'Ngày kết thúc phải sau ngày bắt đầu');
        return;
      }
      setEndDate(selectedDate);
      const formattedDate = formatDate(selectedDate);
      setFormData({ ...formData, endAt: formattedDate });
    }
  };

  const handleSave = async () => {
    // Validation
    if (!formData.name || !formData.value || !formData.min_quantity || !formData.startAt || !formData.endAt) {
      showError('Lỗi', 'Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    if (formData.type === 'SPECIAL' && !formData.agencyId) {
      showError('Lỗi', 'Vui lòng chọn đại lý cho discount đặc biệt');
      return;
    }

    if (!formData.motorbikeId) {
      showError('Lỗi', 'Vui lòng chọn xe máy');
      return;
    }

    // For VOLUME type, set agencyId to null if not provided
    const finalAgencyId = formData.type === 'SPECIAL' ? formData.agencyId : null;

    setLoading(true);
    try {
      const dataToSubmit = {
        name: formData.name,
        type: formData.type,
        valueType: formData.valueType,
        value: parseFloat(formData.value),
        min_quantity: parseInt(formData.min_quantity),
        startAt: formData.startAt,
        endAt: formData.endAt,
        status: formData.status,
        agencyId: finalAgencyId,
        motorbikeId: formData.motorbikeId,
      };

      const response = await discountService.updateDiscount(discount.id, dataToSubmit);

      if (response.success) {
        showSuccess('Thành công', 'Cập nhật discount thành công!');
        // Wait a moment for alert to show before navigating back
        setTimeout(() => {
          navigation.goBack();
        }, 500);
      } else {
        showError('Lỗi', response.error || 'Không thể cập nhật discount');
      }
    } catch (error) {
      console.error('Error updating discount:', error);
      showError('Lỗi', 'Không thể cập nhật discount');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chỉnh sửa Discount</Text>
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>Lưu</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Tên discount *</Text>
          <TextInput
            style={styles.textInput}
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            placeholder="Nhập tên discount"
            placeholderTextColor={COLORS.TEXT.SECONDARY}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Loại *</Text>
          <View style={styles.typeSelector}>
            {['VOLUME', 'SPECIAL'].map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeOption,
                  formData.type === type && styles.selectedTypeOption
                ]}
                onPress={() => setFormData({ ...formData, type })}
              >
                <Text style={[
                  styles.typeOptionText,
                  formData.type === type && styles.selectedTypeOptionText
                ]}>
                  {type === 'VOLUME' ? 'Khối lượng' : 'Đặc biệt'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Đại lý {formData.type === 'SPECIAL' ? '*' : ''}</Text>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setAgencyModalVisible(true)}
          >
            <Text style={[
              styles.dropdownButtonText,
              !formData.agencyId && styles.dropdownButtonTextPlaceholder
            ]}>
              {formData.agencyId 
                ? agencies.find(a => a.id === formData.agencyId)?.name || `Agency ${formData.agencyId}`
                : 'Chọn đại lý'}
            </Text>
            <Text style={styles.dropdownIcon}>▼</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Xe máy *</Text>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setMotorbikeModalVisible(true)}
          >
            <Text style={[
              styles.dropdownButtonText,
              !formData.motorbikeId && styles.dropdownButtonTextPlaceholder
            ]}>
              {formData.motorbikeId 
                ? motorbikes.find(b => b.id === formData.motorbikeId)?.name || `ID: ${formData.motorbikeId}`
                : 'Chọn xe máy'}
            </Text>
            <Text style={styles.dropdownIcon}>▼</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Giá trị *</Text>
          <View style={styles.valueTypeSelector}>
            {['PERCENT', 'FIXED'].map((vt) => (
              <TouchableOpacity
                key={vt}
                style={[
                  styles.valueTypeOption,
                  formData.valueType === vt && styles.selectedValueTypeOption
                ]}
                onPress={() => setFormData({ ...formData, valueType: vt })}
              >
                <Text style={[
                  styles.valueTypeOptionText,
                  formData.valueType === vt && styles.selectedValueTypeOptionText
                ]}>
                  {vt === 'PERCENT' ? 'Phần trăm (%)' : 'Cố định (VND)'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={styles.textInput}
            value={formData.value}
            onChangeText={(text) => setFormData({ ...formData, value: text })}
            placeholder={formData.valueType === 'PERCENT' ? 'Ví dụ: 10' : 'Ví dụ: 50000'}
            placeholderTextColor={COLORS.TEXT.SECONDARY}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Số lượng tối thiểu *</Text>
          <TextInput
            style={styles.textInput}
            value={formData.min_quantity}
            onChangeText={(text) => setFormData({ ...formData, min_quantity: text })}
            placeholder="Nhập số lượng tối thiểu"
            placeholderTextColor={COLORS.TEXT.SECONDARY}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Ngày bắt đầu *</Text>
          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => setShowStartDatePicker(true)}
          >
            <Text style={[styles.dateInputText, !formData.startAt && styles.dateInputTextPlaceholder]}>
              {formData.startAt ? formatDateForDisplay(formData.startAt) : 'Chọn ngày bắt đầu'}
            </Text>
            <Text style={styles.dateIcon}>📅</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Ngày kết thúc *</Text>
          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => setShowEndDatePicker(true)}
          >
            <Text style={[styles.dateInputText, !formData.endAt && styles.dateInputTextPlaceholder]}>
              {formData.endAt ? formatDateForDisplay(formData.endAt) : 'Chọn ngày kết thúc'}
            </Text>
            <Text style={styles.dateIcon}>📅</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Trạng thái *</Text>
          <View style={styles.statusSelector}>
            {['ACTIVE', 'INACTIVE'].map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.statusOption,
                  formData.status === status && styles.selectedStatusOption
                ]}
                onPress={() => setFormData({ ...formData, status })}
              >
                <Text style={[
                  styles.statusOptionText,
                  formData.status === status && styles.selectedStatusOptionText
                ]}>
                  {status === 'ACTIVE' ? 'Hoạt động' : 'Ngừng hoạt động'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Agency Dropdown Modal */}
      <Modal
        visible={agencyModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setAgencyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn đại lý</Text>
              <TouchableOpacity onPress={() => setAgencyModalVisible(false)}>
                <Text style={styles.modalCloseIcon}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView>
              <TouchableOpacity
                style={styles.dropdownOption}
                onPress={() => {
                  setFormData({ ...formData, agencyId: null });
                  setAgencyModalVisible(false);
                }}
              >
                <Text style={styles.dropdownOptionText}>Không chọn</Text>
              </TouchableOpacity>
              {agencies.map((agency) => (
                <TouchableOpacity
                  key={agency.id}
                  style={styles.dropdownOption}
                  onPress={() => {
                    setFormData({ ...formData, agencyId: agency.id });
                    setAgencyModalVisible(false);
                  }}
                >
                  <Text style={styles.dropdownOptionText}>
                    {agency.name || `Agency ${agency.id}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Motorbike Dropdown Modal */}
      <Modal
        visible={motorbikeModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setMotorbikeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn xe máy</Text>
              <TouchableOpacity onPress={() => setMotorbikeModalVisible(false)}>
                <Text style={styles.modalCloseIcon}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView>
              {motorbikes.map((bike) => (
                <TouchableOpacity
                  key={bike.id}
                  style={styles.dropdownOption}
                  onPress={() => {
                    setFormData({ ...formData, motorbikeId: bike.id });
                    setMotorbikeModalVisible(false);
                  }}
                >
                  <Text style={styles.dropdownOptionText}>
                    {bike.name || `ID: ${bike.id}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Date Pickers */}
      {showStartDatePicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleStartDateChange}
        />
      )}
      
      {showEndDatePicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleEndDateChange}
          minimumDate={startDate}
        />
      )}

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
    paddingTop: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingTop: Platform.OS === 'ios' ? 20 : 0,
    paddingBottom: SIZES.PADDING.MEDIUM,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backButton: {
    padding: SIZES.PADDING.SMALL,
  },
  backIcon: {
    fontSize: SIZES.FONT.LARGE,
    color: COLORS.TEXT.WHITE,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    borderRadius: SIZES.RADIUS.MEDIUM,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: SIZES.PADDING.MEDIUM,
  },
  inputGroup: {
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  inputLabel: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.WHITE,
    marginBottom: SIZES.PADDING.SMALL,
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: SIZES.PADDING.SMALL,
  },
  typeOption: {
    flex: 1,
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedTypeOption: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
  },
  typeOptionText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
  },
  selectedTypeOptionText: {
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  dropdownButton: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 48,
  },
  dropdownButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
  },
  dropdownButtonTextPlaceholder: {
    color: COLORS.TEXT.SECONDARY,
  },
  dropdownIcon: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.BACKGROUND.SECONDARY,
    borderTopLeftRadius: SIZES.RADIUS.LARGE,
    borderTopRightRadius: SIZES.RADIUS.LARGE,
    maxHeight: '80%',
    paddingBottom: SIZES.PADDING.LARGE,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.MEDIUM,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
  modalCloseIcon: {
    fontSize: SIZES.FONT.XLARGE,
    color: COLORS.TEXT.WHITE,
  },
  dropdownOption: {
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.MEDIUM,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  dropdownOptionText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.WHITE,
  },
  valueTypeSelector: {
    flexDirection: 'row',
    gap: SIZES.PADDING.SMALL,
    marginBottom: SIZES.PADDING.SMALL,
  },
  valueTypeOption: {
    flex: 1,
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedValueTypeOption: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
  },
  valueTypeOptionText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.PRIMARY,
  },
  selectedValueTypeOptionText: {
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  statusSelector: {
    flexDirection: 'row',
    gap: SIZES.PADDING.SMALL,
  },
  statusOption: {
    flex: 1,
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedStatusOption: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
  },
  statusOptionText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
  },
  selectedStatusOptionText: {
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  dateInput: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 48,
  },
  dateInputText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
  },
  dateInputTextPlaceholder: {
    color: COLORS.TEXT.SECONDARY,
  },
  dateIcon: {
    fontSize: SIZES.FONT.MEDIUM,
  },
});

export default EditDiscountScreen;

