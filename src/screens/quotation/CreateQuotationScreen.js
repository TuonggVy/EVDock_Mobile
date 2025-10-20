import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { COLORS, SIZES } from '../../constants';
import { vehicleService } from '../../services/vehicleService';
import { promotionService, formatPrice, formatDiscountValue, isPromotionValid } from '../../services/promotionService';
import { quotationService } from '../../services/quotationService';
import { dealerCatalogStorageService } from '../../services/storage/dealerCatalogStorageService';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';

const { width, height } = Dimensions.get('window');

const CreateQuotationScreen = ({ navigation, route }) => {
  const vehicle = route?.params?.vehicle;
  const [loading, setLoading] = useState(false);
  const [selectedColor, setSelectedColor] = useState(
    (Array.isArray(vehicle?.colors) && vehicle.colors[0]) || 'Black'
  );
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [pricing, setPricing] = useState({
    basePrice: Number(vehicle?.price) || 0,
    colorPrice: 0,
    quantityDiscount: 0,
    promotionDiscount: 0,
    pricePerUnit: Number(vehicle?.price) || 0,
    finalPricePerUnit: Number(vehicle?.price) || 0,
    totalPrice: Number(vehicle?.price) || 0,
  });
  const [promotions, setPromotions] = useState([]);
  const [selectedPromotion, setSelectedPromotion] = useState(null);
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [promotionCode, setPromotionCode] = useState('');
  const [promotionError, setPromotionError] = useState('');

  const { alertConfig, hideAlert, showSuccess, showError, showInfo } = useCustomAlert();

  useEffect(() => {
    calculatePricing();
  }, [selectedColor, selectedPromotion]);

  useEffect(() => {
    loadPromotions();
  }, []);

  const loadPromotions = async () => {
    try {
      const response = await promotionService.getActivePromotions();
      if (response.success) {
        setPromotions(response.data);
      }
    } catch (error) {
      console.error('Error loading promotions:', error);
    }
  };

  const calculatePricing = () => {
    let basePrice = Number(vehicle?.price) || 0;
    let colorPrice = 0;
    let promotionDiscount = 0;

    // Color pricing (example logic)
    const colorPricing = {
      'Black': 0,
      'White': 0,
      'Red': 500000,
      'Blue': 300000,
      'Green': 400000,
      'Yellow': 600000,
      'Pink': 700000,
      'Silver': 200000,
      'Gold': 800000,
    };
    colorPrice = colorPricing[selectedColor] || 0;

    // Calculate price per unit after color
    const pricePerUnit = basePrice + colorPrice;

    // Apply promotion discount to price per unit if selected
    if (selectedPromotion) {
      // Check if promotion is valid (simplified check for now)
      const now = new Date();
      const validFrom = new Date(selectedPromotion.validFrom);
      const validTo = new Date(selectedPromotion.validTo);
      const isActive = selectedPromotion.isActive;
      const isInDateRange = now >= validFrom && now <= validTo;
      
      if (isActive && isInDateRange) {
        promotionDiscount = promotionService.calculateDiscount(selectedPromotion, pricePerUnit);
      }
    }

    // Calculate final price per unit after promotion
    const finalPricePerUnit = pricePerUnit - promotionDiscount;

    // Calculate total price (fixed quantity of 1)
    const totalPrice = finalPricePerUnit;

    setPricing({
      basePrice,
      colorPrice,
      quantityDiscount: 0,
      promotionDiscount,
      totalPrice,
      pricePerUnit,
      finalPricePerUnit,
    });
  };

  const handleCreateQuotation = async () => {
    if (!vehicle) {
      showError('Thiếu dữ liệu', 'Không tìm thấy thông tin xe');
      return;
    }
    // Validate required fields
    if (!customerInfo.name || !customerInfo.email || !customerInfo.phone) {
      showError('Thông tin thiếu', 'Vui lòng điền đầy đủ thông tin khách hàng');
      return;
    }


    setLoading(true);

    try {
      // Create quotation data
      const quotationData = {
        customerName: customerInfo.name,
        customerEmail: customerInfo.email,
        customerPhone: customerInfo.phone,
        vehicleModel: vehicle.name,
        vehicleImage: vehicle.imageName || 'banner-modely.png', // Use image name for consistency
        totalAmount: pricing.totalPrice,
        status: 'pending',
        createdAt: new Date().toISOString(),
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        createdBy: 'staff001', // This should come from auth context
        dealerId: 'dealer001', // This should come from auth context
        items: [
          {
            name: vehicle.name,
            quantity: 1,
            price: pricing.finalPricePerUnit,
            type: 'vehicle'
          }
        ],
        notes: '',
        lastModified: new Date().toISOString(),
        // Additional details for quotation detail screen
        vehicle: {
          ...(vehicle || {}),
          selectedColor,
        },
        customer: customerInfo,
        details: {
          quantity: 1,
        },
        pricing,
        promotion: selectedPromotion ? {
          id: selectedPromotion.id,
          code: selectedPromotion.code,
          name: selectedPromotion.name,
          discountAmount: pricing.promotionDiscount,
        } : null,
      };

      // Save quotation using service (will save to local storage for now)
      await quotationService.createQuotation(quotationData);

      // Decrement dealer catalog stock by 1 (retail flow) and fallback to manufacturer stock
      try {
        const modelKey = vehicle.id || vehicle.name;
        const res = await dealerCatalogStorageService.decrementColorStock({
          vehicleModelOrId: modelKey,
          color: selectedColor,
          quantity: 1,
        });
        if (!res?.success) {
          await vehicleService.decrementVehicleColorStock(vehicle.id, selectedColor, 1);
        }
      } catch (stockErr) {
        // Non-blocking: log but don't break user flow
        console.error('Error decrementing stock after quotation:', stockErr);
      }

      // Use promotion if selected
      if (selectedPromotion) {
        try {
          await promotionService.usePromotion(selectedPromotion.id, quotationData.id);
        } catch (error) {
          console.error('Error using promotion:', error);
          // Continue with quotation creation even if promotion usage fails
        }
      }

      showSuccess(
        'Tạo báo giá thành công',
        `Báo giá ${quotationData.id} đã được tạo thành công`,
        () => {
          // Navigate to QuotationManagement screen and reset navigation stack
          navigation.reset({
            index: 1,
            routes: [
              { name: 'Main' }, // Go back to main tab navigator (home)
              { name: 'QuotationManagement' }, // Then navigate to QuotationManagement
            ],
          });
        }
      );
    } catch (error) {
      console.error('Error creating quotation:', error);
      showError('Lỗi', 'Không thể tạo báo giá. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handlePromotionCodeSubmit = async () => {
    if (!promotionCode.trim()) {
      setPromotionError('Vui lòng nhập mã khuyến mãi');
      return;
    }

    try {
      // Use price per unit for validation instead of total order amount
      const pricePerUnit = pricing.basePrice + pricing.colorPrice - pricing.quantityDiscount;
      const response = await promotionService.validatePromotionCode(
        String(promotionCode).trim(),
        Number(pricePerUnit) || 0
      );
      
      if (response && typeof response === 'object' && response.success) {
        setSelectedPromotion(response.data || null);
        setPromotionError('');
        setShowPromotionModal(false);
        setPromotionCode('');
      } else {
        setPromotionError((response && response.error) || 'Mã khuyến mãi không hợp lệ');
      }
    } catch (error) {
      setPromotionError('Lỗi khi kiểm tra mã khuyến mãi');
    }
  };

  const handleRemovePromotion = () => {
    setSelectedPromotion(null);
    setPromotionError('');
  };

  const handleSelectPromotion = (promotion) => {
    setSelectedPromotion(promotion);
    setShowPromotionModal(false);
    setPromotionError('');
  };

  const resetForm = () => {
    setCustomerInfo({
      name: '',
      email: '',
      phone: '',
    });
    setSelectedColor((Array.isArray(vehicle?.colors) && vehicle.colors[0]) || 'Black');
    setSelectedPromotion(null);
    setPromotionError('');
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>←</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Tạo Báo Giá</Text>
      <View style={styles.placeholder} />
    </View>
  );

  const renderVehicleInfo = () => (
    !vehicle ? null : (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thông Tin Xe</Text>
        <View style={styles.vehicleCard}>
          <Image source={vehicle.image} style={styles.vehicleImage} />
          <View style={styles.vehicleDetails}>
            <Text style={styles.vehicleName}>{vehicle.name}</Text>
            <Text style={styles.vehicleModel}>{vehicle.model}</Text>
            <View style={styles.specsRow}>
              <Text style={styles.specText}>Battery: {vehicle.specifications?.battery || '-'}</Text>
              <Text style={styles.specText}>Motor: {vehicle.specifications?.motor || '-'}</Text>
            </View>
            <View style={styles.specsRow}>
              <Text style={styles.specText}>Weight: {vehicle.specifications?.weight || '-'}</Text>
              <Text style={styles.specText}>Max Load: {vehicle.specifications?.maxLoad || '-'}</Text>
            </View>
            <View style={styles.specsRow}>
              <Text style={styles.specText}>Charging: {vehicle.specifications?.chargingTime || '-'}</Text>
              <Text style={styles.specText}>Price: {formatPrice(Number(vehicle?.price) || 0)}</Text>
            </View>
          </View>
        </View>
      </View>
    )
  );

  const renderColorSelection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Màu Sắc</Text>
      <View style={styles.colorsContainer}>
        {(Array.isArray(vehicle?.colors) ? vehicle.colors : ['Black', 'White']).map((color, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.colorOption,
              { backgroundColor: getColorHex(color) },
              selectedColor === color && styles.selectedColorOption,
            ]}
            onPress={() => setSelectedColor(color)}
          >
            {selectedColor === color && (
              <View style={styles.colorCheckmark}>
                <Text style={styles.checkmarkText}>✓</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.selectedColorText}>Đã chọn: {selectedColor}</Text>
    </View>
  );

  const renderCustomerInfo = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Thông Tin Khách Hàng</Text>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Tên khách hàng *</Text>
        <TextInput
          style={styles.textInput}
          value={customerInfo.name}
          onChangeText={(text) => setCustomerInfo({ ...customerInfo, name: text })}
          placeholder="Nhập tên khách hàng"
          placeholderTextColor={COLORS.TEXT.SECONDARY}
        />
      </View>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Email *</Text>
        <TextInput
          style={styles.textInput}
          value={customerInfo.email}
          onChangeText={(text) => setCustomerInfo({ ...customerInfo, email: text })}
          placeholder="Nhập email"
          placeholderTextColor={COLORS.TEXT.SECONDARY}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Số điện thoại *</Text>
        <TextInput
          style={styles.textInput}
          value={customerInfo.phone}
          onChangeText={(text) => setCustomerInfo({ ...customerInfo, phone: text })}
          placeholder="Nhập số điện thoại"
          placeholderTextColor={COLORS.TEXT.SECONDARY}
          keyboardType="phone-pad"
        />
      </View>
    </View>
  );


  const renderPromotionSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Mã Khuyến Mãi</Text>
      {selectedPromotion ? (
        <View style={styles.selectedPromotionCard}>
          <View style={styles.promotionInfo}>
            <Text style={styles.promotionCode}>{selectedPromotion.code}</Text>
            <Text style={styles.promotionName}>{selectedPromotion.name}</Text>
            <Text style={styles.promotionDescription}>{selectedPromotion.description}</Text>
            <Text style={styles.promotionDiscount}>
              Giảm: {formatDiscountValue(selectedPromotion)}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.removePromotionButton}
            onPress={handleRemovePromotion}
          >
            <Text style={styles.removePromotionText}>✕</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.promotionButtons}>
          <TouchableOpacity
            style={styles.promotionButton}
            onPress={() => setShowPromotionModal(true)}
          >
            <Text style={styles.promotionButtonText}>Chọn mã khuyến mãi</Text>
          </TouchableOpacity>
        </View>
      )}
      {promotionError ? (
        <Text style={styles.errorText}>{promotionError}</Text>
      ) : null}
    </View>
  );

  const renderPricing = () => {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bảng Giá</Text>
        <View style={styles.pricingContainer}>
          <View style={styles.pricingRow}>
            <Text style={styles.pricingLabel}>Giá cơ bản:</Text>
            <Text style={styles.pricingValue}>{formatPrice(pricing.basePrice)}</Text>
          </View>
          
          {/* Price per unit before promotion */}
          <View style={[styles.pricingRow, styles.subtotalRow]}>
            <Text style={styles.subtotalLabel}>Giá xe (trước KM):</Text>
            <Text style={styles.subtotalValue}>{formatPrice(pricing.pricePerUnit)}</Text>
          </View>
          
          {/* Promotion discount */}
          {pricing.promotionDiscount > 0 && (
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>
                {selectedPromotion ? `Giảm giá (${selectedPromotion.code}):` : 'Giảm giá khuyến mãi:'}
              </Text>
              <Text style={[styles.pricingValue, styles.discountText]}>-{formatPrice(pricing.promotionDiscount)}</Text>
            </View>
          )}
          
          {/* Final price per unit */}
          <View style={[styles.pricingRow, styles.finalPriceRow]}>
            <Text style={styles.finalPriceLabel}>Giá xe (sau KM):</Text>
            <Text style={styles.finalPriceValue}>{formatPrice(pricing.finalPricePerUnit)}</Text>
          </View>
          
          <View style={styles.pricingRow}>
            <Text style={styles.pricingLabel}>Số lượng:</Text>
            <Text style={styles.pricingValue}>1</Text>
          </View>
          
          {/* Final total */}
          <View style={[styles.pricingRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Tổng cộng:</Text>
            <Text style={styles.totalValue}>{formatPrice(pricing.totalPrice)}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderPromotionModal = () => (
    <Modal
      visible={showPromotionModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => {
              setShowPromotionModal(false);
              setPromotionCode('');
              setPromotionError('');
            }}
          >
            <Text style={styles.modalCloseText}>Hủy</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Chọn Mã Khuyến Mãi</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.modalContent}>
          {/* Manual Code Input */}
          <View style={styles.codeInputSection}>
            <Text style={styles.inputLabel}>Nhập mã khuyến mãi</Text>
            <View style={styles.codeInputContainer}>
              <TextInput
                style={styles.codeInput}
                value={promotionCode}
                onChangeText={(text) => {
                  setPromotionCode(text.toUpperCase());
                  setPromotionError('');
                }}
                placeholder="Nhập mã khuyến mãi"
                placeholderTextColor={COLORS.TEXT.SECONDARY}
                autoCapitalize="characters"
              />
              <TouchableOpacity
                style={styles.applyButton}
                onPress={handlePromotionCodeSubmit}
              >
                <Text style={styles.applyButtonText}>Áp dụng</Text>
              </TouchableOpacity>
            </View>
            {promotionError ? (
              <Text style={styles.errorText}>{promotionError}</Text>
            ) : null}
          </View>

          {/* Available Promotions List */}
          <View style={styles.promotionsListSection}>
            <Text style={styles.inputLabel}>Mã khuyến mãi có sẵn</Text>
            <FlatList
              data={promotions}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.promotionItem}
                  onPress={() => handleSelectPromotion(item)}
                >
                  <View style={styles.promotionItemInfo}>
                    <Text style={styles.promotionItemCode}>{item.code}</Text>
                    <Text style={styles.promotionItemName}>{item.name}</Text>
                    <Text style={styles.promotionItemDescription}>{item.description}</Text>
                    <Text style={styles.promotionItemDiscount}>
                      Giảm: {formatDiscountValue(item)}
                    </Text>
                  </View>
                  <Text style={styles.promotionItemArrow}>→</Text>
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );

  const renderActionButtons = () => (
    <View style={styles.actionButtons}>
      <TouchableOpacity
        style={styles.resetButton}
        onPress={resetForm}
      >
        <Text style={styles.resetButtonText}>Làm Mới</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.createButton, loading && styles.disabledButton]}
        onPress={handleCreateQuotation}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.TEXT.WHITE} />
        ) : (
          <Text style={styles.createButtonText}>Tạo Báo Giá</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderVehicleInfo()}
        {renderColorSelection()}
        {renderCustomerInfo()}
        {renderPromotionSection()}
        {renderPricing()}
      </ScrollView>
      {renderActionButtons()}
      {renderPromotionModal()}
      
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

// Helper function to get color hex
const getColorHex = (colorName) => {
  const colorMap = {
    'Black': '#000000',
    'White': '#FFFFFF',
    'Red': '#FF0000',
    'Blue': '#0000FF',
    'Green': '#00FF00',
    'Yellow': '#FFFF00',
    'Pink': '#FFC0CB',
    'Silver': '#C0C0C0',
    'Gray': '#808080',
    'Orange': '#FFA500',
    'Purple': '#800080',
    'Brown': '#A52A2A',
    'Gold': '#FFD700',
    'Navy': '#000080',
    'Maroon': '#800000',
    'Teal': '#008080',
    'Lime': '#00FF00',
    'Cyan': '#00FFFF',
  };
  return colorMap[colorName] || '#000000';
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
    paddingVertical: SIZES.PADDING.SMALL,
    backgroundColor: COLORS.BACKGROUND.SECONDARY,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 20,
    color: COLORS.TEXT.WHITE,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
  },
  section: {
    marginVertical: SIZES.PADDING.MEDIUM,
  },
  sectionTitle: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
    marginBottom: SIZES.PADDING.SMALL,
  },
  vehicleCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.BACKGROUND.SECONDARY,
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  vehicleImage: {
    width: 80,
    height: 80,
    borderRadius: SIZES.RADIUS.SMALL,
    marginRight: SIZES.PADDING.MEDIUM,
  },
  vehicleDetails: {
    flex: 1,
  },
  vehicleName: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
    marginBottom: 4,
  },
  vehicleModel: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.WHITE,
    marginBottom: SIZES.PADDING.SMALL,
  },
  specsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  specText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.WHITE,
  },
  colorsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SIZES.PADDING.SMALL,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: SIZES.PADDING.SMALL,
    marginBottom: SIZES.PADDING.SMALL,
    borderWidth: 2,
    borderColor: COLORS.BORDER.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedColorOption: {
    borderColor: COLORS.PRIMARY,
    borderWidth: 3,
  },
  colorCheckmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: COLORS.TEXT.WHITE,
    fontSize: 12,
    fontWeight: 'bold',
  },
  selectedColorText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.WHITE,
    fontStyle: 'italic',
  },
  inputGroup: {
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  inputLabel: {
    fontSize: SIZES.FONT.SMALL,
    fontWeight: '600',
    color: COLORS.TEXT.WHITE,
    marginBottom: SIZES.PADDING.SMALL,
  },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.BORDER.PRIMARY,
    borderRadius: SIZES.RADIUS.SMALL,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.WHITE,
    backgroundColor: COLORS.BACKGROUND.SECONDARY,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
  },
  quantityButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonText: {
    color: COLORS.TEXT.WHITE,
    fontSize: 18,
    fontWeight: 'bold',
  },
  quantityText: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
    marginHorizontal: SIZES.PADDING.MEDIUM,
    minWidth: 30,
    textAlign: 'center',
  },
  pricingContainer: {
    backgroundColor: COLORS.BACKGROUND.SECONDARY,
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SIZES.PADDING.SMALL,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER.PRIMARY,
  },
  pricingLabel: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.WHITE,
  },
  pricingValue: {
    fontSize: SIZES.FONT.SMALL,
    fontWeight: '600',
    color: COLORS.TEXT.WHITE,
  },
  discountText: {
    color: COLORS.SUCCESS,
  },
  subtotalRow: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER.PRIMARY,
    marginTop: SIZES.PADDING.SMALL,
    paddingTop: SIZES.PADDING.MEDIUM,
    paddingBottom: SIZES.PADDING.MEDIUM,
  },
  subtotalLabel: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: '600',
    color: COLORS.TEXT.WHITE,
  },
  subtotalValue: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: '600',
    color: COLORS.TEXT.WHITE,
  },
  finalPriceRow: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER.PRIMARY,
    marginTop: SIZES.PADDING.SMALL,
    paddingTop: SIZES.PADDING.MEDIUM,
    paddingBottom: SIZES.PADDING.MEDIUM,
  },
  finalPriceLabel: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
  },
  finalPriceValue: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
  },
  totalRow: {
    borderBottomWidth: 0,
    borderTopColor: COLORS.PRIMARY,
    marginTop: SIZES.PADDING.SMALL,
    paddingTop: SIZES.PADDING.MEDIUM,
  },
  totalLabel: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
  totalValue: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.MEDIUM,
    backgroundColor: COLORS.BACKGROUND.SECONDARY,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER.PRIMARY,
  },
  resetButton: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
    borderWidth: 1,
    borderColor: COLORS.BORDER.PRIMARY,
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingVertical: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
    marginRight: SIZES.PADDING.SMALL,
  },
  resetButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: '600',
    color: COLORS.TEXT.WHITE,
  },
  createButton: {
    flex: 2,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingVertical: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
    marginLeft: SIZES.PADDING.SMALL,
  },
  createButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
  disabledButton: {
    opacity: 0.6,
  },

  // Promotion Styles
  selectedPromotionCard: {
    backgroundColor: COLORS.BACKGROUND.SECONDARY,
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.PRIMARY,
  },
  promotionInfo: {
    flex: 1,
  },
  promotionCode: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginBottom: 4,
  },
  promotionName: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
    marginBottom: 2,
  },
  promotionDescription: {
    fontSize: SIZES.FONT.XSMALL,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: 4,
  },
  promotionDiscount: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.SUCCESS,
    fontWeight: '600',
  },
  removePromotionButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.ERROR,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SIZES.PADDING.SMALL,
  },
  removePromotionText: {
    color: COLORS.TEXT.WHITE,
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
  },
  promotionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  promotionButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
  },
  promotionButtonText: {
    color: COLORS.TEXT.WHITE,
    fontSize: SIZES.FONT.SMALL,
    fontWeight: '600',
  },
  errorText: {
    color: COLORS.ERROR,
    fontSize: SIZES.FONT.XSMALL,
    marginTop: SIZES.PADDING.SMALL,
    textAlign: 'center',
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    backgroundColor: COLORS.BACKGROUND.SECONDARY,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER.PRIMARY,
  },
  modalCloseButton: {
    padding: SIZES.PADDING.SMALL,
  },
  modalCloseText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
  },
  modalTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
    flex: 1,
    textAlign: 'center',
  },
  modalContent: {
    flex: 1,
    padding: SIZES.PADDING.MEDIUM,
  },
  codeInputSection: {
    marginBottom: SIZES.PADDING.LARGE,
  },
  codeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SIZES.PADDING.SMALL,
  },
  codeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.BORDER.PRIMARY,
    borderRadius: SIZES.RADIUS.SMALL,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.WHITE,
    backgroundColor: COLORS.BACKGROUND.SECONDARY,
    marginRight: SIZES.PADDING.SMALL,
  },
  applyButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: SIZES.RADIUS.SMALL,
    paddingVertical: SIZES.PADDING.SMALL,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
  },
  applyButtonText: {
    color: COLORS.TEXT.WHITE,
    fontSize: SIZES.FONT.SMALL,
    fontWeight: '600',
  },
  promotionsListSection: {
    flex: 1,
  },
  promotionItem: {
    backgroundColor: COLORS.BACKGROUND.SECONDARY,
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
    marginBottom: SIZES.PADDING.SMALL,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.BORDER.PRIMARY,
  },
  promotionItemInfo: {
    flex: 1,
  },
  promotionItemCode: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginBottom: 2,
  },
  promotionItemName: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
    marginBottom: 2,
  },
  promotionItemDescription: {
    fontSize: SIZES.FONT.XSMALL,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: 2,
  },
  promotionItemDiscount: {
    fontSize: SIZES.FONT.XSMALL,
    color: COLORS.SUCCESS,
    fontWeight: '600',
  },
  promotionItemArrow: {
    fontSize: SIZES.FONT.LARGE,
    color: COLORS.TEXT.SECONDARY,
    marginLeft: SIZES.PADDING.SMALL,
  },
});

export default CreateQuotationScreen;
