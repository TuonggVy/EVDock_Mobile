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

const CreatePreOrderScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    vehicleModel: '',
    vehicleColor: '',
    vehiclePrice: '',
    depositPercentage: '20',
    expectedArrival: '',
    notes: '',
  });

  const [errors, setErrors] = useState({});
  const [showVehicleSelector, setShowVehicleSelector] = useState(false);
  const [showColorSelector, setShowColorSelector] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  // Manufacturer catalog - All available models
  const manufacturerCatalog = [
    {
      id: 'MODEL_Y',
      model: 'Tesla Model Y',
      basePrice: 1250000000,
      availableColors: [
        { name: 'Trắng Pearl', price: 1250000000 },
        { name: 'Đen', price: 1250000000 },
        { name: 'Xám', price: 1250000000 },
        { name: 'Xanh Deep Blue', price: 1280000000 },
        { name: 'Đỏ Multi-Coat', price: 1300000000 },
      ],
      estimatedDelivery: '1-2 tháng',
      description: 'SUV điện 7 chỗ, hiệu suất cao',
    },
    {
      id: 'MODEL_X',
      model: 'Tesla Model X',
      basePrice: 1800000000,
      availableColors: [
        { name: 'Trắng Pearl', price: 1800000000 },
        { name: 'Đen', price: 1800000000 },
        { name: 'Xám', price: 1800000000 },
        { name: 'Xanh Deep Blue', price: 1850000000 },
        { name: 'Đỏ Multi-Coat', price: 1900000000 },
      ],
      estimatedDelivery: '2-3 tháng',
      description: 'SUV điện cao cấp, cửa cánh chim',
    },
    {
      id: 'MODEL_V',
      model: 'Tesla Model V',
      basePrice: 1500000000,
      availableColors: [
        { name: 'Trắng Pearl', price: 1500000000 },
        { name: 'Đen', price: 1500000000 },
        { name: 'Xám', price: 1500000000 },
        { name: 'Xanh Deep Blue', price: 1530000000 },
        { name: 'Đỏ Multi-Coat', price: 1550000000 },
      ],
      estimatedDelivery: '1-3 tháng',
      description: 'Sedan điện sang trọng',
    },
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleSelectVehicleModel = (catalogItem) => {
    setSelectedVehicle(catalogItem);
    setFormData(prev => ({
      ...prev,
      vehicleModel: catalogItem.model,
      vehicleColor: '', // Reset color when model changes
      vehiclePrice: '', // Reset price when model changes
      expectedArrival: catalogItem.estimatedDelivery,
    }));
    setShowVehicleSelector(false);
    
    // Clear errors
    if (errors.vehicleModel) {
      setErrors(prev => ({ ...prev, vehicleModel: null }));
    }
    
    // Open color selector next
    setTimeout(() => setShowColorSelector(true), 300);
  };

  const handleSelectColor = (color) => {
    setFormData(prev => ({
      ...prev,
      vehicleColor: color.name,
      vehiclePrice: color.price.toString(),
    }));
    setShowColorSelector(false);
    
    // Clear errors
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
      'Xác nhận tạo pre-order',
      `Khách hàng: ${formData.customerName}\nXe: ${formData.vehicleModel}\nĐặt cọc: ${formatCurrency(depositAmount)}\n\nĐơn hàng sẽ được gửi đến hãng sản xuất.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: async () => {
            try {
              // Calculate expected delivery date (90 days from now for pre-order)
              const expectedDeliveryDate = new Date();
              expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + 90);
              
              // Calculate final payment due date (7 days after delivery)
              const finalPaymentDueDate = new Date(expectedDeliveryDate);
              finalPaymentDueDate.setDate(finalPaymentDueDate.getDate() + 7);

              // Create deposit data
              const depositData = {
                type: 'pre_order',
                customerName: formData.customerName,
                customerPhone: formData.customerPhone,
                customerEmail: formData.customerEmail,
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
                manufacturerOrderId: null, // Manager will place order later
                manufacturerStatus: 'requested', // Requested by Dealer Staff
                estimatedArrival: formData.expectedArrival || '1-3 tháng',
                notes: formData.notes,
                createdBy: 'Dealer Staff',
              };

              // Save to storage
              const newDeposit = await depositStorageService.createDeposit(depositData);
              
              console.log('✅ Pre-order created:', newDeposit);

              Alert.alert(
                'Thành công',
                `Pre-order đã được tạo!\n\nMã đặt cọc: ${newDeposit.id}\nTrạng thái: Đã gửi yêu cầu lên hãng\nSố tiền đặt cọc: ${formatCurrency(depositAmount)}\n\nDealer Manager sẽ đặt xe từ hãng và thông báo khi xe về.`,
                [
                  {
                    text: 'OK',
                    onPress: () => navigation.goBack()
                  }
                ]
              );
            } catch (error) {
              console.error('Error creating pre-order:', error);
              Alert.alert('Lỗi', 'Không thể tạo pre-order. Vui lòng thử lại.');
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
            <Text style={styles.headerTitleText}>Tạo Pre-order</Text>
            <Text style={styles.headerSubtitle}>Đặt xe từ hãng</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Info Banner */}
          <View style={styles.infoBanner}>
            <Text style={styles.infoBannerIcon}>📦</Text>
            <View style={styles.infoBannerContent}>
              <Text style={styles.infoBannerTitle}>Pre-order từ hãng</Text>
              <Text style={styles.infoBannerText}>
                Đơn hàng sẽ được gửi đến hãng sản xuất. Thời gian chờ dự kiến: 1-3 tháng.
              </Text>
            </View>
          </View>

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
                onPress={() => setShowVehicleSelector(true)}
              >
                <View style={styles.selectInputContent}>
                  <Text style={[styles.selectInputText, !formData.vehicleModel && styles.placeholderText]}>
                    {formData.vehicleModel || 'Chọn xe từ catalog hãng'}
                  </Text>
                  {selectedVehicle && (
                    <Text style={styles.selectInputSubtext}>
                      {selectedVehicle.description} • Giao hàng: {selectedVehicle.estimatedDelivery}
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
                  {formData.vehicleColor || 'Chọn màu từ catalog hãng'}
                </Text>
                <Text style={styles.selectIcon}>›</Text>
              </TouchableOpacity>
              <Text style={styles.helperText}>
                💡 Giá có thể khác nhau tùy theo màu xe
              </Text>
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
              <Text style={styles.helperText}>
                💡 Thường 20-30% cho pre-order
              </Text>
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
              <Text style={styles.inputLabel}>Thời gian dự kiến (tháng)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ví dụ: 1-3 tháng"
                placeholderTextColor={COLORS.TEXT.SECONDARY}
                value={formData.expectedArrival}
                onChangeText={(value) => handleInputChange('expectedArrival', value)}
              />
              <Text style={styles.helperText}>
                ⏱️ Thời gian từ khi đặt hàng đến khi xe về
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Ghi chú</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Nhập ghi chú, yêu cầu đặc biệt (tùy chọn)"
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
              <Text style={styles.submitButtonText}>Tạo Pre-order</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Vehicle Model Selector Modal */}
      <Modal
        visible={showVehicleSelector}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowVehicleSelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.vehicleSelectorModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn xe từ catalog hãng</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowVehicleSelector(false)}
              >
                <Text style={styles.closeIcon}>×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {manufacturerCatalog.map((catalogItem) => (
                <TouchableOpacity
                  key={catalogItem.id}
                  style={[
                    styles.catalogCard,
                    selectedVehicle?.id === catalogItem.id && styles.catalogCardSelected
                  ]}
                  onPress={() => handleSelectVehicleModel(catalogItem)}
                >
                  <View style={styles.catalogCardHeader}>
                    <View style={styles.catalogCardInfo}>
                      <Text style={styles.catalogCardModel}>{catalogItem.model}</Text>
                      <Text style={styles.catalogCardDescription}>{catalogItem.description}</Text>
                      <Text style={styles.catalogCardDelivery}>
                        ⏱️ Giao hàng: {catalogItem.estimatedDelivery}
                      </Text>
                    </View>
                    <View style={styles.catalogCardRight}>
                      <Text style={styles.catalogCardPrice}>
                        {formatCurrency(catalogItem.basePrice)}
                      </Text>
                      <View style={styles.catalogBadge}>
                        <Text style={styles.catalogBadgeText}>Catalog hãng</Text>
                      </View>
                    </View>
                  </View>
                  {selectedVehicle?.id === catalogItem.id && (
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
              <Text style={styles.modalTitle}>Chọn màu xe</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowColorSelector(false)}
              >
                <Text style={styles.closeIcon}>×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {selectedVehicle?.availableColors.map((color, index) => {
                const isSelected = formData.vehicleColor === color.name;
                const priceDiff = color.price - selectedVehicle.basePrice;
                
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.colorCard,
                      isSelected && styles.colorCardSelected
                    ]}
                    onPress={() => handleSelectColor(color)}
                  >
                    <View style={styles.colorCardContent}>
                      <Text style={styles.colorCardName}>{color.name}</Text>
                      <View style={styles.colorCardPricing}>
                        <Text style={styles.colorCardPrice}>{formatCurrency(color.price)}</Text>
                        {priceDiff > 0 && (
                          <Text style={styles.colorCardPriceDiff}>
                            +{formatCurrency(priceDiff)}
                          </Text>
                        )}
                      </View>
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

  // Info Banner
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    marginHorizontal: SIZES.PADDING.LARGE,
    marginBottom: SIZES.PADDING.LARGE,
    padding: SIZES.PADDING.MEDIUM,
    borderRadius: SIZES.RADIUS.MEDIUM,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.PRIMARY,
  },
  infoBannerIcon: {
    fontSize: 32,
    marginRight: SIZES.PADDING.SMALL,
  },
  infoBannerContent: {
    flex: 1,
  },
  infoBannerTitle: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginBottom: 4,
  },
  infoBannerText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    lineHeight: 18,
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
  helperText: {
    fontSize: SIZES.FONT.XSMALL,
    color: COLORS.TEXT.SECONDARY,
    marginTop: SIZES.PADDING.XSMALL,
  },

  // Calculation Card
  calculationCard: {
    backgroundColor: '#F3E5F5',
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
    marginBottom: SIZES.PADDING.MEDIUM,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.SECONDARY,
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
    color: COLORS.SECONDARY,
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
    maxHeight: '80%',
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

  // Catalog Card
  catalogCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
    marginBottom: SIZES.PADDING.MEDIUM,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  catalogCardSelected: {
    borderColor: COLORS.SECONDARY,
    borderWidth: 2,
    backgroundColor: '#F3E5F5',
  },
  catalogCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  catalogCardInfo: {
    flex: 1,
  },
  catalogCardModel: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: 4,
  },
  catalogCardDescription: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: 4,
  },
  catalogCardDelivery: {
    fontSize: SIZES.FONT.XSMALL,
    color: COLORS.TEXT.SECONDARY,
  },
  catalogCardRight: {
    alignItems: 'flex-end',
  },
  catalogCardPrice: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.SECONDARY,
    marginBottom: 6,
  },
  catalogBadge: {
    backgroundColor: COLORS.SECONDARY,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: SIZES.RADIUS.SMALL,
  },
  catalogBadgeText: {
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
    color: COLORS.SECONDARY,
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
    borderColor: COLORS.SECONDARY,
    borderWidth: 2,
    backgroundColor: '#F3E5F5',
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
  colorCardPricing: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorCardPrice: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '600',
  },
  colorCardPriceDiff: {
    fontSize: SIZES.FONT.XSMALL,
    color: '#FF6B6B',
    marginLeft: 8,
    fontWeight: '600',
  },
  colorSelectedIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.SECONDARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorSelectedIconText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.WHITE,
    fontWeight: 'bold',
  },
});

export default CreatePreOrderScreen;
