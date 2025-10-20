import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES } from '../../constants';
import depositStorageService from '../../services/storage/depositStorageService';

const CreateDepositAvailableScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    vehicleModel: '',
    vehicleColor: '',
    vehiclePrice: '',
    depositPercentage: '20',
    expectedDeliveryDate: '',
    notes: '',
  });

  const [errors, setErrors] = useState({});
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [showColorSelector, setShowColorSelector] = useState(false);
  const [selectedModel, setSelectedModel] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  // Group available vehicles by model
  const availableVehiclesByModel = {
    'Tesla Model Y': [
      { id: 'V001', color: 'Đen', price: 1250000000, vin: 'VIN123456789', status: 'available', location: 'Showroom EVDock' },
      { id: 'V002', color: 'Trắng', price: 1250000000, vin: 'VIN987654321', status: 'available', location: 'Showroom EVDock' },
      { id: 'V005', color: 'Xám', price: 1250000000, vin: 'VIN321654987', status: 'available', location: 'Showroom EVDock' },
    ],
    'Tesla Model X': [
      { id: 'V003', color: 'Đỏ', price: 1800000000, vin: 'VIN456789123', status: 'available', location: 'Showroom EVDock' },
    ],
    'Tesla Model V': [
      { id: 'V004', color: 'Xanh', price: 1500000000, vin: 'VIN789123456', status: 'available', location: 'Showroom EVDock' },
    ],
  };

  // Get unique models with count
  const availableModels = Object.keys(availableVehiclesByModel).map(model => ({
    name: model,
    count: availableVehiclesByModel[model].length,
    colors: availableVehiclesByModel[model],
  }));

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleSelectModel = (modelData) => {
    setSelectedModel(modelData);
    setSelectedVehicle(null); // Reset selected vehicle when model changes
    setFormData(prev => ({
      ...prev,
      vehicleModel: modelData.name,
      vehicleColor: '', // Reset color when model changes
      vehiclePrice: '', // Reset price when model changes
    }));
    setShowModelSelector(false);
    
    // Clear error if exists
    if (errors.vehicleModel) {
      setErrors(prev => ({ ...prev, vehicleModel: null }));
    }
    
    // Auto-open color selector next
    setTimeout(() => setShowColorSelector(true), 300);
  };

  const handleSelectColor = (vehicle) => {
    setSelectedVehicle(vehicle);
    setFormData(prev => ({
      ...prev,
      vehicleColor: vehicle.color,
      vehiclePrice: vehicle.price.toString(),
    }));
    setShowColorSelector(false);
    
    // Clear error if exists
    if (errors.vehiclePrice) {
      setErrors(prev => ({ ...prev, vehiclePrice: null }));
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const calculateAmounts = () => {
    const price = parseFloat(formData.vehiclePrice) || 0;
    const percentage = parseFloat(formData.depositPercentage) || 0;
    const depositAmount = (price * percentage) / 100;
    const remainingAmount = price - depositAmount;

    return {
      depositAmount,
      remainingAmount,
    };
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.customerName.trim()) {
      newErrors.customerName = 'Vui lòng nhập tên khách hàng';
    }
    if (!formData.customerPhone.trim()) {
      newErrors.customerPhone = 'Vui lòng nhập số điện thoại';
    }
    if (!formData.vehicleModel.trim()) {
      newErrors.vehicleModel = 'Vui lòng chọn xe';
    }
    if (!formData.vehiclePrice.trim()) {
      newErrors.vehiclePrice = 'Vui lòng nhập giá xe';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    const { depositAmount, remainingAmount } = calculateAmounts();

    Alert.alert(
      'Xác nhận tạo đặt cọc',
      `Khách hàng: ${formData.customerName}\nXe: ${formData.vehicleModel}\nĐặt cọc: ${formatCurrency(depositAmount)}`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: async () => {
            try {
              // Calculate expected delivery date (7 days from now for available)
              const expectedDeliveryDate = new Date();
              expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + 7);
              
              // Calculate final payment due date (14 days from now)
              const finalPaymentDueDate = new Date();
              finalPaymentDueDate.setDate(finalPaymentDueDate.getDate() + 14);

              // Create deposit data
              const depositData = {
                type: 'available',
                customerName: formData.customerName,
                customerPhone: formData.customerPhone,
                customerEmail: formData.customerEmail,
                vehicleId: selectedVehicle?.id, // Vehicle ID from inventory
                vehicleModel: formData.vehicleModel,
                vehicleColor: formData.vehicleColor,
                vehiclePrice: parseFloat(formData.vehiclePrice),
                depositAmount: depositAmount,
                depositPercentage: parseFloat(formData.depositPercentage),
                remainingAmount: remainingAmount,
                status: 'pending',
                depositDate: new Date().toISOString(),
                expectedDeliveryDate: expectedDeliveryDate.toISOString(),
                finalPaymentDueDate: finalPaymentDueDate.toISOString(),
                notes: formData.notes,
                createdBy: 'Dealer Staff',
              };

              // Save to storage
              const newDeposit = await depositStorageService.createDeposit(depositData);
              
              console.log('✅ Deposit created:', newDeposit);

              Alert.alert(
                'Thành công',
                `Đã tạo đặt cọc xe có sẵn!\n\nMã đặt cọc: ${newDeposit.id}\nSố tiền đặt cọc: ${formatCurrency(depositAmount)}`,
                [
                  {
                    text: 'OK',
                    onPress: () => navigation.goBack()
                  }
                ]
              );
            } catch (error) {
              console.error('Error creating deposit:', error);
              Alert.alert('Lỗi', 'Không thể tạo đặt cọc. Vui lòng thử lại.');
            }
          }
        }
      ]
    );
  };

  const { depositAmount, remainingAmount } = calculateAmounts();

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={styles.headerTitleText}>Đặt cọc xe có sẵn</Text>
            <Text style={styles.headerSubtitle}>Tạo đặt cọc mới</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Customer Info Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông tin khách hàng</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Tên khách hàng *</Text>
              <TextInput
                style={[styles.input, errors.customerName && styles.inputError]}
                placeholder="Nhập tên khách hàng"
                placeholderTextColor={COLORS.TEXT.SECONDARY}
                value={formData.customerName}
                onChangeText={(value) => handleInputChange('customerName', value)}
              />
              {errors.customerName && <Text style={styles.errorText}>{errors.customerName}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Số điện thoại *</Text>
              <TextInput
                style={[styles.input, errors.customerPhone && styles.inputError]}
                placeholder="Nhập số điện thoại"
                placeholderTextColor={COLORS.TEXT.SECONDARY}
                value={formData.customerPhone}
                onChangeText={(value) => handleInputChange('customerPhone', value)}
                keyboardType="phone-pad"
              />
              {errors.customerPhone && <Text style={styles.errorText}>{errors.customerPhone}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập email (tùy chọn)"
                placeholderTextColor={COLORS.TEXT.SECONDARY}
                value={formData.customerEmail}
                onChangeText={(value) => handleInputChange('customerEmail', value)}
                keyboardType="email-address"
              />
            </View>
          </View>

          {/* Vehicle Info Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông tin xe</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Model xe *</Text>
              <TouchableOpacity
                style={[styles.selectInput, errors.vehicleModel && styles.inputError]}
                onPress={() => setShowModelSelector(true)}
              >
                <View style={styles.selectInputContent}>
                  <Text style={[styles.selectInputText, !formData.vehicleModel && styles.placeholderText]}>
                    {formData.vehicleModel || 'Chọn model từ kho có sẵn'}
                  </Text>
                  {selectedModel && (
                    <Text style={styles.selectInputSubtext}>
                      {selectedModel.count} xe có sẵn
                    </Text>
                  )}
                </View>
                <Text style={styles.selectIcon}>›</Text>
              </TouchableOpacity>
              {errors.vehicleModel && <Text style={styles.errorText}>{errors.vehicleModel}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Màu xe *</Text>
              <TouchableOpacity
                style={[styles.selectInput, !formData.vehicleModel && styles.inputDisabled]}
                onPress={() => {
                  if (!formData.vehicleModel) {
                    Alert.alert('Thông báo', 'Vui lòng chọn model xe trước');
                  } else {
                    setShowColorSelector(true);
                  }
                }}
                disabled={!formData.vehicleModel}
              >
                <Text style={[styles.selectInputText, !formData.vehicleColor && styles.placeholderText]}>
                  {formData.vehicleColor || 'Chọn màu xe có sẵn'}
                </Text>
                <Text style={styles.selectIcon}>›</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Giá xe *</Text>
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                placeholder="Giá sẽ tự động điền khi chọn màu"
                placeholderTextColor={COLORS.TEXT.SECONDARY}
                value={formData.vehiclePrice ? formatCurrency(parseFloat(formData.vehiclePrice)) : ''}
                editable={false}
              />
              {errors.vehiclePrice && <Text style={styles.errorText}>{errors.vehiclePrice}</Text>}
            </View>
          </View>

          {/* Deposit Info Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông tin đặt cọc</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Tỷ lệ đặt cọc (%)</Text>
              <TextInput
                style={styles.input}
                placeholder="20"
                placeholderTextColor={COLORS.TEXT.SECONDARY}
                value={formData.depositPercentage}
                onChangeText={(value) => handleInputChange('depositPercentage', value)}
                keyboardType="numeric"
              />
            </View>

            {/* Calculation Display */}
            {formData.vehiclePrice && (
              <View style={styles.calculationCard}>
                <View style={styles.calculationRow}>
                  <Text style={styles.calculationLabel}>Số tiền đặt cọc:</Text>
                  <Text style={styles.calculationValueHighlight}>{formatCurrency(depositAmount)}</Text>
                </View>
                <View style={styles.calculationRow}>
                  <Text style={styles.calculationLabel}>Số tiền còn lại:</Text>
                  <Text style={styles.calculationValue}>{formatCurrency(remainingAmount)}</Text>
                </View>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Ghi chú</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Nhập ghi chú (tùy chọn)"
                placeholderTextColor={COLORS.TEXT.SECONDARY}
                value={formData.notes}
                onChangeText={(value) => handleInputChange('notes', value)}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
          >
            <LinearGradient
              colors={COLORS.GRADIENT.BLUE}
              style={styles.submitButtonGradient}
            >
              <Text style={styles.submitButtonText}>Tạo đặt cọc</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Model Selector Modal */}
      <Modal
        visible={showModelSelector}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModelSelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.vehicleSelectorModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn model xe</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowModelSelector(false)}
              >
                <Text style={styles.closeIcon}>×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {availableModels.map((modelData, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.modelCard,
                    selectedModel?.name === modelData.name && styles.modelCardSelected
                  ]}
                  onPress={() => handleSelectModel(modelData)}
                >
                  <View style={styles.modelCardHeader}>
                    <View style={styles.modelCardInfo}>
                      <Text style={styles.modelCardModel}>{modelData.name}</Text>
                      <Text style={styles.modelCardCount}>
                        {modelData.count} xe có sẵn ({modelData.colors.length} màu)
                      </Text>
                    </View>
                    <View style={styles.availableBadge}>
                      <Text style={styles.availableBadgeText}>Có sẵn</Text>
                    </View>
                  </View>
                  {selectedModel?.name === modelData.name && (
                    <View style={styles.selectedIndicator}>
                      <Text style={styles.selectedIndicatorText}>✓ Đã chọn</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Color Selector Modal */}
      <Modal
        visible={showColorSelector}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowColorSelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.colorSelectorModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn màu xe - {formData.vehicleModel}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowColorSelector(false)}
              >
                <Text style={styles.closeIcon}>×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {selectedModel?.colors.map((vehicle) => {
                const isSelected = formData.vehicleColor === vehicle.color;
                
                return (
                  <TouchableOpacity
                    key={vehicle.id}
                    style={[
                      styles.colorCard,
                      isSelected && styles.colorCardSelected
                    ]}
                    onPress={() => handleSelectColor(vehicle)}
                  >
                    <View style={styles.colorCardContent}>
                      <Text style={styles.colorCardName}>{vehicle.color}</Text>
                      <Text style={styles.colorCardVin}>VIN: {vehicle.vin}</Text>
                      <Text style={styles.colorCardPrice}>{formatCurrency(vehicle.price)}</Text>
                    </View>
                    {isSelected && (
                      <View style={styles.colorSelectedIcon}>
                        <Text style={styles.colorSelectedIconText}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
  },
  keyboardView: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.PADDING.LARGE,
    paddingTop: SIZES.PADDING.MEDIUM,
    paddingBottom: SIZES.PADDING.MEDIUM,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: SIZES.FONT.LARGE,
    color: COLORS.TEXT.WHITE,
    fontWeight: 'bold',
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitleText: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
  headerSubtitle: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    marginTop: 2,
  },
  headerSpacer: {
    width: 40,
  },

  // Content
  content: {
    flex: 1,
    backgroundColor: COLORS.SURFACE,
    borderTopLeftRadius: SIZES.RADIUS.XXLARGE,
    borderTopRightRadius: SIZES.RADIUS.XXLARGE,
    paddingTop: SIZES.PADDING.LARGE,
  },

  // Section
  section: {
    paddingHorizontal: SIZES.PADDING.LARGE,
    marginBottom: SIZES.PADDING.LARGE,
  },
  sectionTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SIZES.PADDING.MEDIUM,
  },

  // Input Group
  inputGroup: {
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  inputLabel: {
    fontSize: SIZES.FONT.SMALL,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SIZES.PADDING.XSMALL,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  inputError: {
    borderColor: COLORS.ERROR,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  selectInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectInputText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
  },
  placeholderText: {
    color: COLORS.TEXT.SECONDARY,
  },
  selectIcon: {
    fontSize: SIZES.FONT.LARGE,
    color: COLORS.TEXT.SECONDARY,
  },
  selectInputContent: {
    flex: 1,
  },
  selectInputSubtext: {
    fontSize: SIZES.FONT.XSMALL,
    color: COLORS.TEXT.SECONDARY,
    marginTop: 2,
  },
  inputDisabled: {
    backgroundColor: '#FAFAFA',
    opacity: 0.6,
  },
  errorText: {
    fontSize: SIZES.FONT.XSMALL,
    color: COLORS.ERROR,
    marginTop: SIZES.PADDING.XSMALL,
  },

  // Calculation Card
  calculationCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  calculationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.PADDING.XSMALL,
  },
  calculationLabel: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    fontWeight: '500',
  },
  calculationValue: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '600',
  },
  calculationValueHighlight: {
    fontSize: SIZES.FONT.LARGE,
    color: COLORS.PRIMARY,
    fontWeight: 'bold',
  },

  // Footer
  footer: {
    padding: SIZES.PADDING.LARGE,
    paddingBottom: SIZES.PADDING.XXXLARGE,
    backgroundColor: COLORS.SURFACE,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  submitButton: {
    borderRadius: SIZES.RADIUS.MEDIUM,
    overflow: 'hidden',
  },
  submitButtonGradient: {
    paddingVertical: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.WHITE,
    fontWeight: 'bold',
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  vehicleSelectorModal: {
    backgroundColor: COLORS.SURFACE,
    borderTopLeftRadius: SIZES.RADIUS.XXLARGE,
    borderTopRightRadius: SIZES.RADIUS.XXLARGE,
    maxHeight: '70%',
  },
  colorSelectorModal: {
    backgroundColor: COLORS.SURFACE,
    borderTopLeftRadius: SIZES.RADIUS.XXLARGE,
    borderTopRightRadius: SIZES.RADIUS.XXLARGE,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.PADDING.LARGE,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  modalTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    fontSize: 28,
    color: COLORS.TEXT.SECONDARY,
    fontWeight: '300',
  },
  modalBody: {
    padding: SIZES.PADDING.LARGE,
  },

  // Model Card
  modelCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
    marginBottom: SIZES.PADDING.MEDIUM,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  modelCardSelected: {
    borderColor: COLORS.PRIMARY,
    borderWidth: 2,
    backgroundColor: '#E3F2FD',
  },
  modelCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modelCardInfo: {
    flex: 1,
  },
  modelCardModel: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: 4,
  },
  modelCardCount: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
  },
  availableBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: SIZES.RADIUS.SMALL,
  },
  availableBadgeText: {
    fontSize: SIZES.FONT.XSMALL,
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
  },
  selectedIndicator: {
    marginTop: SIZES.PADDING.SMALL,
    paddingTop: SIZES.PADDING.SMALL,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
    alignItems: 'center',
  },
  selectedIndicatorText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },

  // Color Card
  colorCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
    marginBottom: SIZES.PADDING.MEDIUM,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  colorCardSelected: {
    borderColor: COLORS.PRIMARY,
    borderWidth: 2,
    backgroundColor: '#E3F2FD',
  },
  colorCardContent: {
    flex: 1,
  },
  colorCardName: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: 4,
  },
  colorCardVin: {
    fontSize: SIZES.FONT.XSMALL,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: 4,
  },
  colorCardPrice: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  colorSelectedIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorSelectedIconText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.WHITE,
    fontWeight: 'bold',
  },
});

export default CreateDepositAvailableScreen;
