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
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS, SIZES } from '../../constants';
import { vehicleService } from '../../services/vehicleService';
import { formatPrice } from '../../utils/promotionUtils';
import { quotationService } from '../../services/quotationService';
import { dealerCatalogStorageService } from '../../services/storage/dealerCatalogStorageService';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import { useAuth } from '../../contexts/AuthContext';
import motorbikeService from '../../services/motorbikeService';
import customerManagementService from '../../services/customerManagementService';
import agencyStockService from '../../services/agencyStockService';
import { ArrowLeft, Calendar, Check, Search } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

const CreateQuotationScreen = ({ navigation, route }) => {
  const vehicle = route?.params?.vehicle;
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [availableColors, setAvailableColors] = useState([]);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedColorId, setSelectedColorId] = useState(null);
  const [currentVehicleImage, setCurrentVehicleImage] = useState(vehicle?.image);
  const [motorbikeDetails, setMotorbikeDetails] = useState(null);
  const [configurations, setConfigurations] = useState({
    appearance: null,
    configuration: null,
    battery: null,
    safeFeature: null,
  });
  const [customerId, setCustomerId] = useState('');
  const [loadedCustomerInfo, setLoadedCustomerInfo] = useState(null);
  const [pricing, setPricing] = useState({
    basePrice: Number(vehicle?.price) || 0,
    colorPrice: 0,
    quantityDiscount: 0,
    promotionDiscount: 0,
    pricePerUnit: Number(vehicle?.price) || 0,
    finalPricePerUnit: Number(vehicle?.price) || 0,
    totalPrice: Number(vehicle?.price) || 0,
  });
  const [quotationType, setQuotationType] = useState('AT_STORE');
  const [validUntil, setValidUntil] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [availablePromotions, setAvailablePromotions] = useState([]);
  const [selectedPromotionId, setSelectedPromotionId] = useState(null);

  const { alertConfig, hideAlert, showSuccess, showError, showInfo } = useCustomAlert();

  // Helper function to format date for API (YYYY-MM-DD)
  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper function to format date for display (DD/MM/YYYY)
  const formatDateForDisplay = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Handle date change from DateTimePicker
  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setValidUntil(selectedDate);
    }
  };

  // Helper function to calculate discount based on promotion valueType
  const calculateDiscount = (promotion, orderValue) => {
    if (!promotion || !orderValue) return 0;
    
    const { valueType, value } = promotion;
    let discount = 0;
    
    if (valueType === 'PERCENT') {
      discount = (orderValue * value) / 100;
    } else if (valueType === 'FIXED') {
      discount = value;
    }
    
    return discount;
  };

  // Load promotions when color changes
  useEffect(() => {
    const loadPromotions = async () => {
      if (!user?.agencyId || !vehicle?.id || !selectedColorId) {
        setAvailablePromotions([]);
        return;
      }
      
      try {
        const stockResponse = await agencyStockService.getAgencyStocks(parseInt(user.agencyId), {
          motorbikeId: parseInt(vehicle.id),
          colorId: parseInt(selectedColorId),
          limit: 1000
        });

        if (stockResponse.success && stockResponse.data && stockResponse.data.length > 0) {
          const availableStock = stockResponse.data.find(stock => stock.quantity > 0);
          
          if (availableStock && availableStock.id) {
            const stockDetailResponse = await agencyStockService.getAgencyStockDetail(availableStock.id);
            
            if (stockDetailResponse.success && stockDetailResponse.data) {
              const allPromotions = stockDetailResponse.data.agencyStockPromotion || [];
              const now = new Date();
              const activePromotions = allPromotions.filter(promoItem => {
                const promo = promoItem.stockPromotion || {};
                const validFrom = new Date(promo.startAt);
                const validTo = new Date(promo.endAt);
                const isActive = promo.status === 'ACTIVE';
                const isInDateRange = now >= validFrom && now <= validTo;
                return isActive && isInDateRange;
              });
              
              setAvailablePromotions(activePromotions);
              
              // Auto-select first promotion if available and no promotion selected
              if (activePromotions.length > 0 && !selectedPromotionId) {
                setSelectedPromotionId(activePromotions[0].stockPromotionId);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading promotions:', error);
        setAvailablePromotions([]);
      }
    };
    
    loadPromotions();
  }, [selectedColor, selectedColorId]);
  
  // Calculate pricing when promotions or selected promotion changes
  useEffect(() => {
    calculatePricing();
  }, [selectedColor, selectedColorId, selectedPromotionId, availablePromotions.length]);

  useEffect(() => {
    loadMotorbikeColorData();
  }, [vehicle]);

  // Load motorbike details including colors and configurations
  const loadMotorbikeColorData = async (colorName = null) => {
    if (!vehicle?.id) return;
    try {
      const response = await motorbikeService.getMotorbikeById(parseInt(vehicle.id));
      if (response.success) {
        const data = response.data?.data || response.data;
        setMotorbikeDetails(data);
        
        // Extract configurations from motorbike details
        setConfigurations({
          appearance: data.appearance || null,
          configuration: data.configuration || null,
          battery: data.battery || null,
          safeFeature: data.safeFeature || null,
        });
        
        if (data.colors && Array.isArray(data.colors) && data.colors.length > 0) {
          // Set available colors list
          setAvailableColors(data.colors);
          
          // If no color selected yet, select first one
          if (!selectedColor && data.colors.length > 0) {
            const firstColor = data.colors[0];
            const firstColorName = firstColor.color?.colorType || firstColor.colorType;
            setSelectedColor(firstColorName);
            setSelectedColorId(firstColor.color?.id || firstColor.id);
            
            // Update image for first color
            if (firstColor.imageUrl) {
              setCurrentVehicleImage({ uri: firstColor.imageUrl });
            } else if (data.images && data.images.length > 0) {
              setCurrentVehicleImage({ uri: data.images[0].imageUrl });
            }
          } else {
            // Update colorId and image for selected color
            const colorToSearch = colorName || selectedColor;
            const colorItem = data.colors.find(c => 
              (c.color?.colorType || c.colorType) === colorToSearch
            );
            if (colorItem) {
              setSelectedColorId(colorItem.color?.id || colorItem.id);
              
              // Update image for selected color
              if (colorItem.imageUrl) {
                setCurrentVehicleImage({ uri: colorItem.imageUrl });
              }
            }
          }
        } else if (data.images && data.images.length > 0) {
          // Fallback to first image if no colors
          setCurrentVehicleImage({ uri: data.images[0].imageUrl });
        }
      }
    } catch (error) {
      console.error('Error loading motorbike color data:', error);
    }
  };

  const calculatePricing = () => {
    let basePrice = Number(vehicle?.price) || 0;
    let colorPrice = 0;
    let promotionDiscount = 0;

    // Color pricing - set to 0 for now since API doesn't provide color-specific pricing
    // TODO: Implement when API provides color price information
    colorPrice = 0;

    // Calculate price per unit after color
    const pricePerUnit = basePrice + colorPrice;

    // Calculate discount from selected promotion
    if (selectedPromotionId && availablePromotions.length > 0) {
      const selectedPromo = availablePromotions.find(p => p.stockPromotionId === selectedPromotionId);
      if (selectedPromo && selectedPromo.stockPromotion) {
        promotionDiscount = calculateDiscount(selectedPromo.stockPromotion, pricePerUnit);
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

  // Load customer info by ID
  const loadCustomerInfo = async () => {
    if (!customerId || !customerId.trim()) {
      setLoadedCustomerInfo(null);
      return;
    }

    try {
      const response = await customerManagementService.getCustomerDetail(parseInt(customerId));
      if (response) {
        setLoadedCustomerInfo(response);
      } else {
        setLoadedCustomerInfo(null);
        showError('Customer Not Found', 'No customer information found with this ID');
      }
    } catch (error) {
      console.error('Error loading customer info:', error);
      setLoadedCustomerInfo(null);
      showError('Loading Error', 'Failed to load customer information. Please check the ID again.');
    }
  };

  const handleCreateQuotation = async () => {
    if (!vehicle) {
      showError('Missing Data', 'Vehicle information not found');
      return;
    }

    // Validate customerId
    if (!customerId || !customerId.trim()) {
      showError('Missing Information', 'Please enter customer ID');
      return;
    }

    // Validate loaded customer info
    if (!loadedCustomerInfo) {
      showError('Missing Information', 'Customer information not found. Please check the ID.');
      return;
    }

    // Validate user context
    if (!user?.id || !user?.agencyId) {
      showError('Authentication Error', 'User information not found. Please login again.');
      return;
    }

    // Validate colorId
    if (!selectedColorId) {
      showError('Missing Information', 'Color information cannot be retrieved. Please select color again.');
      return;
    }

    setLoading(true);

    try {
      // Build quotation data according to API specs
      const validUntilDate = new Date(validUntil);
      validUntilDate.setHours(23, 59, 59, 0);
      
      const quotationData = {
        type: quotationType, // AT_STORE, ORDER, PRE_ORDER
        basePrice: pricing.basePrice,
        promotionPrice: pricing.promotionDiscount,
        finalPrice: pricing.finalPricePerUnit,
        validUntil: validUntilDate.toISOString(), // User selected date
        customerId: parseInt(customerId),
        motorbikeId: parseInt(vehicle.id),
        colorId: selectedColorId,
        dealerStaffId: parseInt(user.id),
        agencyId: parseInt(user.agencyId),
      };

      // Call real API to create quotation
      const response = await quotationService.createQuotation(quotationData);

      if (!response.success) {
        throw new Error(response.error || 'Failed to create quotation');
      }

      showSuccess(
        'Quotation Created Successfully',
        `The quotation has been created successfully`,
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
      showError('Error', error.message || 'Failed to create quotation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCustomerId('');
    setLoadedCustomerInfo(null);
    setSelectedColor((Array.isArray(vehicle?.colors) && vehicle.colors[0]) || 'Black');
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}><ArrowLeft color="#FFFFFF" size={18} /></Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Create Quotation</Text>
      <View style={styles.placeholder} />
    </View>
  );

  const renderVehicleInfo = () => {
    if (!vehicle) return null;
    
    // Use motorbikeDetails if available, otherwise fallback to vehicle
    const displayData = motorbikeDetails || vehicle;
    
    // Helper function to format spec key
    const formatSpecKey = (key) => {
      return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    };
    
    // Helper function to format spec value based on key
    const formatSpecValue = (key, value) => {
      if (key.toLowerCase().includes('distance') || key.toLowerCase().includes('limit')) {
        return `${value} mm`;
      } else if (key.toLowerCase().includes('weight')) {
        return `${value} kg`;
      } else if (key.toLowerCase().includes('storage')) {
        return `${value} L`;
      } else if (key.toLowerCase().includes('capacity') && typeof value === 'number') {
        return `${value} people`;
      }
      return value;
    };
    
    // Get first few specs from any available configuration
    const getFirstSpecs = () => {
      const allConfigs = [
        configurations.battery,
        configurations.configuration,
        configurations.appearance,
        configurations.safeFeature,
      ].filter(Boolean);
      
      if (allConfigs.length === 0) return [];
      
      // Get first 4 key-value pairs from first available config
      const firstConfig = allConfigs[0];
      const entries = Object.entries(firstConfig).filter(
        ([key]) => key !== 'electricMotorbikeId' && key !== 'id'
      );
      return entries.slice(0, 4);
    };
    
    const specs = getFirstSpecs();
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vehicle Information</Text>
        <View style={styles.vehicleCard}>
          <Image 
            source={
              typeof currentVehicleImage === 'object' && currentVehicleImage !== null 
                ? currentVehicleImage 
                : (currentVehicleImage || vehicle.image)
            } 
            style={styles.vehicleImage} 
          />
          <View style={styles.vehicleDetails}>
            <Text style={styles.vehicleName}>{displayData.name || vehicle.name}</Text>
            <Text style={styles.vehicleModel}>{displayData.model || vehicle.model}</Text>
            {specs.length > 0 ? (
              <>
                {specs.slice(0, 2).length > 0 && (
                  <View style={styles.specsRow}>
                    {specs.slice(0, 2).map(([key, value]) => (
                      <Text key={key} style={styles.specText}>
                        {formatSpecKey(key)}: {formatSpecValue(key, value)}
                      </Text>
                    ))}
                  </View>
                )}
                {specs.length > 2 && specs.slice(2, 4).length > 0 && (
                  <View style={styles.specsRow}>
                    {specs.slice(2, 4).map(([key, value]) => (
                      <Text key={key} style={styles.specText}>
                        {formatSpecKey(key)}: {formatSpecValue(key, value)}
                      </Text>
                    ))}
                  </View>
                )}
              </>
            ) : (
              <>
                {vehicle.specifications && (
                  <>
                    <View style={styles.specsRow}>
                      <Text style={styles.specText}>Battery: {vehicle.specifications?.battery || '-'}</Text>
                      <Text style={styles.specText}>Motor: {vehicle.specifications?.motor || '-'}</Text>
                    </View>
                    <View style={styles.specsRow}>
                      <Text style={styles.specText}>Weight: {vehicle.specifications?.weight || '-'}</Text>
                      <Text style={styles.specText}>Max Load: {vehicle.specifications?.maxLoad || '-'}</Text>
                    </View>
                  </>
                )}
              </>
            )}
            <View style={styles.specsRow}>
              <Text style={styles.specText}>Price: {formatPrice(Number(vehicle?.price || displayData?.price) || 0)}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const handleColorChange = (color) => {
    setSelectedColor(color);
    loadMotorbikeColorData(color);
  };

  const renderColorSelection = () => {
    // Determine color display list
    const colorsToDisplay = availableColors.length > 0 
      ? availableColors.map(c => c.color?.colorType || c.colorType)
      : (Array.isArray(vehicle?.colors) ? vehicle.colors : []);
    
    if (colorsToDisplay.length === 0) {
      return null;
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Color</Text>
        <View style={styles.colorsContainer}>
          {colorsToDisplay.map((color, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.colorOption,
                { backgroundColor: getColorHex(color) },
                selectedColor === color && styles.selectedColorOption,
              ]}
              onPress={() => handleColorChange(color)}
            >
              {selectedColor === color && (
                <View style={styles.colorCheckmark}>
                  <Text style={styles.checkmarkText}><Check color="#FFFFFF" size={14} /></Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.selectedColorText}>Đã chọn: {selectedColor}</Text>
      </View>
    );
  };

  const renderQuotationTypeSelection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Quotation Type</Text>
      <View style={styles.typeContainer}>
        {['AT_STORE', 'ORDER', 'PRE_ORDER'].map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.typeOption,
              quotationType === type && styles.typeOptionSelected,
            ]}
            onPress={() => setQuotationType(type)}
          >
            <Text style={[
              styles.typeText,
              quotationType === type && styles.typeTextSelected,
            ]}>
              {type === 'AT_STORE' ? 'At Store' : type === 'ORDER' ? 'Order' : 'Pre-Order'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderValidUntilSelection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Valid Until</Text>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Quotation valid until *</Text>
        <TouchableOpacity
          style={styles.dateInput}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateInputText}>
            {formatDateForDisplay(validUntil) || 'Select expiry date'}
          </Text>
          <Text style={styles.datePickerIcon}><Calendar color="#FFFFFF" size={16} /></Text>
        </TouchableOpacity>
      </View>
      
      {showDatePicker && (
        <DateTimePicker
          value={validUntil}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          minimumDate={new Date()}
          locale="vi-VN"
        />
      )}
    </View>
  );

  const renderCustomerInfo = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Customer Information</Text>
        <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Customer ID *</Text>
        <View style={styles.searchInputContainer}>
          <TextInput
            style={styles.searchInput}
            value={customerId}
            onChangeText={(text) => setCustomerId(text)}
            placeholder="Enter customer ID"
            placeholderTextColor={COLORS.TEXT.SECONDARY}
            keyboardType="numeric"
          />
          <TouchableOpacity
            style={styles.searchButton}
            onPress={loadCustomerInfo}
            disabled={!customerId || !customerId.trim()}
          >
            <Search color={COLORS.TEXT.WHITE} size={20} />
          </TouchableOpacity>
        </View>
      </View>
      
      {loadedCustomerInfo && (
        <View style={styles.customerInfoCard}>
          <Text style={styles.customerInfoTitle}>Customer Information</Text>
          <View style={styles.customerInfoRow}>
            <Text style={styles.customerInfoLabel}>Name:</Text>
            <Text style={styles.customerInfoValue}>{loadedCustomerInfo.name || 'N/A'}</Text>
          </View>
          <View style={styles.customerInfoRow}>
            <Text style={styles.customerInfoLabel}>Email:</Text>
            <Text style={styles.customerInfoValue}>{loadedCustomerInfo.email || 'N/A'}</Text>
          </View>
          <View style={styles.customerInfoRow}>
            <Text style={styles.customerInfoLabel}>Phone:</Text>
            <Text style={styles.customerInfoValue}>{loadedCustomerInfo.phone || 'N/A'}</Text>
          </View>
        </View>
      )}
    </View>
  );


  // Helper to format promotion discount value
  const formatPromotionValue = (promotion) => {
    if (!promotion) return 'N/A';
    const { valueType, value } = promotion;
    if (valueType === 'PERCENT') {
      return `${value}%`;
    } else if (valueType === 'FIXED') {
      return formatPrice(value);
    }
    return 'N/A';
  };

  const renderPromotionSelection = () => {
    if (availablePromotions.length === 0) return null;
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Promotion</Text>
        <View style={styles.promotionsContainer}>
          {availablePromotions.map((promoItem) => {
            const promo = promoItem.stockPromotion || {};
            const isSelected = selectedPromotionId === promoItem.stockPromotionId;
            
            return (
              <TouchableOpacity
                key={promoItem.stockPromotionId}
                style={[
                  styles.promotionCard,
                  isSelected && styles.promotionCardSelected
                ]}
                onPress={() => setSelectedPromotionId(promoItem.stockPromotionId)}
              >
                <View style={styles.promotionCardHeader}>
                  <View style={styles.promotionCardInfo}>
                    <Text style={styles.promotionCardName}>{promo.name || 'Promotion'}</Text>
                    <Text style={styles.promotionCardDescription} numberOfLines={2}>
                      {promo.description || 'No description'}
                    </Text>
                    <Text style={styles.promotionCardValue}>
                      Discount: {formatPromotionValue(promo)}
                    </Text>
                  </View>
                  {isSelected && (
                    <View style={styles.promotionCheckmark}>
                      <Check color="#FFFFFF" size={20} />
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const renderPricing = () => {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pricing</Text>
        <View style={styles.pricingContainer}>
          {/* Base Price */}
          <View style={styles.pricingRow}>
            <Text style={styles.pricingLabel}>Base Price:</Text>
            <Text style={styles.pricingValue}>{formatPrice(pricing.basePrice)}</Text>
          </View>
          
          {/* Discount Section */}
          {pricing.promotionDiscount > 0 && (
            <>
              <View style={styles.discountRow}>
                <Text style={styles.discountLabel}>
                  Promotion Discount
                </Text>
                <Text style={styles.discountValue}>-{formatPrice(pricing.promotionDiscount)}</Text>
              </View>
            </>
          )}
          
          {/* Divider */}
          <View style={styles.pricingDivider} />
          
          {/* Final Total */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>{formatPrice(pricing.totalPrice)}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderActionButtons = () => (
    <View style={styles.actionButtons}>
      <TouchableOpacity
        style={styles.resetButton}
        onPress={resetForm}
      >
        <Text style={styles.resetButtonText}>Reset</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.createButton, loading && styles.disabledButton]}
        onPress={handleCreateQuotation}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.TEXT.WHITE} />
        ) : (
          <Text style={styles.createButtonText}>Create Quotation</Text>
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
        {renderQuotationTypeSelection()}
        {renderValidUntilSelection()}
        {renderCustomerInfo()}
        {renderPromotionSelection()}
        {renderPricing()}
      </ScrollView>
      {renderActionButtons()}
      
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
    // borderColor: COLORS.PRIMARY,
    borderWidth: 3,
  },
  colorCheckmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    // backgroundColor: COLORS.PRIMARY,
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
  typeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SIZES.PADDING.SMALL,
  },
  typeOption: {
    flex: 1,
    paddingVertical: SIZES.PADDING.MEDIUM,
    paddingHorizontal: SIZES.PADDING.SMALL,
    borderRadius: SIZES.RADIUS.SMALL,
    backgroundColor: COLORS.BACKGROUND.SECONDARY,
    borderWidth: 1,
    borderColor: COLORS.BORDER.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeOptionSelected: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  typeText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    fontWeight: '600',
  },
  typeTextSelected: {
    color: COLORS.TEXT.WHITE,
    fontWeight: 'bold',
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
  hintText: {
    fontSize: SIZES.FONT.XSMALL,
    color: COLORS.TEXT.SECONDARY,
    marginTop: SIZES.PADDING.XSMALL,
    fontStyle: 'italic',
  },
  dateInput: {
    borderWidth: 1,
    borderColor: COLORS.BORDER.PRIMARY,
    borderRadius: SIZES.RADIUS.SMALL,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    backgroundColor: COLORS.BACKGROUND.SECONDARY,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateInputText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.WHITE,
  },
  datePickerIcon: {
    fontSize: 20,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
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
  searchButton: {
    width: 48,
    height: 48,
    borderRadius: SIZES.RADIUS.SMALL,
    backgroundColor: COLORS.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerInfoCard: {
    backgroundColor: COLORS.BACKGROUND.SECONDARY,
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
    marginTop: SIZES.PADDING.SMALL,
    borderWidth: 1,
    borderColor: COLORS.BORDER.PRIMARY,
  },
  customerInfoTitle: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginBottom: SIZES.PADDING.SMALL,
  },
  customerInfoRow: {
    flexDirection: 'row',
    marginBottom: SIZES.PADDING.SMALL,
  },
  customerInfoLabel: {
    fontSize: SIZES.FONT.SMALL,
    fontWeight: '600',
    color: COLORS.TEXT.SECONDARY,
    width: 100,
  },
  customerInfoValue: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.WHITE,
    flex: 1,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SIZES.PADDING.SMALL,
  },
  pricingLabel: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
  },
  pricingValue: {
    fontSize: SIZES.FONT.SMALL,
    fontWeight: '600',
    color: COLORS.TEXT.WHITE,
  },
  discountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SIZES.PADDING.SMALL,
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    borderRadius: SIZES.RADIUS.SMALL,
    paddingHorizontal: SIZES.PADDING.SMALL,
    marginVertical: SIZES.PADDING.SMALL,
  },
  discountLabel: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.SUCCESS,
    fontWeight: '600',
  },
  discountValue: {
    fontSize: SIZES.FONT.SMALL,
    fontWeight: 'bold',
    color: COLORS.SUCCESS,
  },
  pricingDivider: {
    height: 1,
    backgroundColor: COLORS.BORDER.PRIMARY,
    marginVertical: SIZES.PADDING.MEDIUM,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: SIZES.RADIUS.SMALL,
    padding: SIZES.PADDING.MEDIUM,
    marginTop: SIZES.PADDING.SMALL,
  },
  totalLabel: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
  totalValue: {
    fontSize: SIZES.FONT.LARGE,
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

  // Promotion Selection Styles
  promotionsContainer: {
    gap: SIZES.PADDING.SMALL,
  },
  promotionCard: {
    backgroundColor: COLORS.BACKGROUND.SECONDARY,
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
    borderWidth: 1,
    borderColor: COLORS.BORDER.PRIMARY,
    marginBottom: SIZES.PADDING.SMALL,
  },
  promotionCardSelected: {
    borderColor: COLORS.PRIMARY,
    borderWidth: 2,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  promotionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  promotionCardInfo: {
    flex: 1,
    marginRight: SIZES.PADDING.SMALL,
  },
  promotionCardName: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
    marginBottom: 4,
  },
  promotionCardDescription: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: 4,
  },
  promotionCardValue: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.SUCCESS,
    fontWeight: '600',
  },
  promotionCheckmark: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CreateQuotationScreen;
