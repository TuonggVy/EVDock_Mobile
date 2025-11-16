import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Image,
  TextInput,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
  Modal,
  FlatList,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS, SIZES, USER_ROLES } from '../../constants';
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
import { ArrowLeft, Calendar, Check } from 'lucide-react-native';

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
  const [colorStockMap, setColorStockMap] = useState(new Map()); // Map colorId -> quantity
  const [loadingColorStocks, setLoadingColorStocks] = useState(false);
  const [colorCodeMap, setColorCodeMap] = useState(new Map()); // Map colorId -> colorCode/hex
  const [configurations, setConfigurations] = useState({
    appearance: null,
    configuration: null,
    battery: null,
    safeFeature: null,
  });
  const [customerId, setCustomerId] = useState(null);
  const [customerFormData, setCustomerFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    credentialId: '',
    dob: null,
  });
  const [customerErrors, setCustomerErrors] = useState({});
  const [showCustomerDobPicker, setShowCustomerDobPicker] = useState(false);
  const [creatingCustomer, setCreatingCustomer] = useState(false);
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
  const [hasStockAtAgency, setHasStockAtAgency] = useState(true); // Track if vehicle has stock at agency
  const [isBasePriceManual, setIsBasePriceManual] = useState(false); // Track if basePrice was manually edited
  const [isFinalPriceManual, setIsFinalPriceManual] = useState(false); // Track if finalPrice was manually edited

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

  // Auto-adjust quotation type or clear color when quotation type changes
  useEffect(() => {
    // If switching to AT_STORE or ORDER, check if selected color has stock
    if (quotationType === 'AT_STORE' || quotationType === 'ORDER') {
      if (selectedColorId) {
        const quantity = colorStockMap.get(selectedColorId) || 0;
        if (quantity === 0) {
          // Selected color doesn't have stock, switch to PRE_ORDER
          setQuotationType('PRE_ORDER');
        }
      }
    }
    // If switching to PRE_ORDER, no need to clear color - allow any color
  }, [quotationType, selectedColorId, colorStockMap]);

  useEffect(() => {
    loadMotorbikeColorData();
    loadAllColors(); // Load all colors from API to get color codes
    checkVehicleStock(); // Check if vehicle has stock at agency
  }, [vehicle, user]);

  // Check if vehicle has stock at agency
  const checkVehicleStock = async () => {
    // For Dealer Staff, check actual stock from API
    if (user?.role === USER_ROLES.DEALER_STAFF && user?.agencyId && vehicle?.id) {
      try {
        const agencyId = parseInt(user.agencyId);
        const stockResponse = await agencyStockService.getAgencyStocks(agencyId, {
          motorbikeId: parseInt(vehicle.id),
          limit: 1000
        });

        if (stockResponse.success && stockResponse.data && stockResponse.data.length > 0) {
          // Check if there's any stock with quantity > 0
          const hasStock = stockResponse.data.some(stock => (stock.quantity || 0) > 0);
          setHasStockAtAgency(hasStock);
          
          if (!hasStock) {
            // No stock at all, only allow PRE_ORDER
            setQuotationType('PRE_ORDER');
          }
          // If has stock, allow all types - don't auto-change quotation type
        } else {
          // No stock found
          setHasStockAtAgency(false);
          setQuotationType('PRE_ORDER');
        }
      } catch (error) {
        console.error('Error checking vehicle stock:', error);
        // On error, check vehicle properties as fallback
        const hasStock = vehicle?.inStock !== false && (vehicle?.quantity || 0) > 0;
        setHasStockAtAgency(hasStock);
        
        if (!hasStock) {
          setQuotationType('PRE_ORDER');
        }
      }
    } else {
      // For other roles, use vehicle.inStock and quantity properties
      const hasStock = vehicle?.inStock !== false && (vehicle?.quantity || 0) > 0;
      setHasStockAtAgency(hasStock);
      
      if (!hasStock) {
        // No stock at all, only allow PRE_ORDER
        setQuotationType('PRE_ORDER');
      }
      // If has stock, allow all types - don't auto-change quotation type
    }
  };

  // Load all colors from API to build color code map
  const loadAllColors = async () => {
    try {
      const response = await motorbikeService.getAllColors();
      if (response.success && response.data && Array.isArray(response.data)) {
        const codeMap = new Map();
        response.data.forEach(color => {
          if (color.id) {
            // Store colorCode or hex, fallback to colorType
            // Priority: colorCode > hex > colorType
            const code = color.colorCode || color.hex || color.colorType;
            if (code) {
              codeMap.set(color.id, code);
            }
          }
        });
        setColorCodeMap(codeMap);
        console.log('Loaded color code map:', Array.from(codeMap.entries()));
      }
    } catch (error) {
      console.error('Error loading all colors:', error);
    }
  };

  // Load stock information for all colors
  useEffect(() => {
    if (availableColors.length > 0 && user?.agencyId && vehicle?.id) {
      loadColorStocks();
    }
  }, [availableColors, user?.agencyId, vehicle?.id]);

  // Load stock information for all colors
  const loadColorStocks = async () => {
    if (!user?.agencyId || !vehicle?.id || availableColors.length === 0) return;
    
    setLoadingColorStocks(true);
    try {
      const stockMap = new Map();
      
      // Load stock for each color
      const stockPromises = availableColors.map(async (colorItem) => {
        const colorId = colorItem.color?.id || colorItem.id;
        if (!colorId) return;
        
        try {
          const stockResponse = await agencyStockService.getAgencyStocks(
            parseInt(user.agencyId),
            {
              motorbikeId: parseInt(vehicle.id),
              colorId: parseInt(colorId),
              limit: 1000
            }
          );
          
          if (stockResponse.success && stockResponse.data && stockResponse.data.length > 0) {
            // Sum up total quantity for this color
            const totalQuantity = stockResponse.data.reduce((sum, stock) => {
              return sum + (stock.quantity || 0);
            }, 0);
            stockMap.set(colorId, totalQuantity);
          } else {
            stockMap.set(colorId, 0);
          }
        } catch (error) {
          console.error(`Error loading stock for colorId ${colorId}:`, error);
          stockMap.set(colorId, 0);
        }
      });
      
      await Promise.all(stockPromises);
      setColorStockMap(stockMap);
      
      // Auto-select color based on availability
      // Priority: First in-stock color (for AT_STORE/ORDER), otherwise first color (for PRE_ORDER)
      if (availableColors.length > 0 && !selectedColorId) {
        // Find first in-stock color
        const firstInStockColor = availableColors.find(colorItem => {
          const cId = colorItem.color?.id || colorItem.id;
          return (stockMap.get(cId) || 0) > 0;
        });
        
        if (firstInStockColor) {
          // Found in-stock color, select it and set to AT_STORE
          const colorType = firstInStockColor.color?.colorType || firstInStockColor.colorType;
          const colorId = firstInStockColor.color?.id || firstInStockColor.id;
          setSelectedColor(colorType);
          setSelectedColorId(colorId);
          
          // Set quotation type to AT_STORE if vehicle has stock
          if (hasStockAtAgency && quotationType === 'PRE_ORDER') {
            setQuotationType('AT_STORE');
          }
          
          // Update image
          if (firstInStockColor.imageUrl) {
            setCurrentVehicleImage({ uri: firstInStockColor.imageUrl });
          }
        } else {
          // No in-stock color, select first color and set to PRE_ORDER
          const firstColor = availableColors[0];
          const colorType = firstColor.color?.colorType || firstColor.colorType;
          const colorId = firstColor.color?.id || firstColor.id;
          setSelectedColor(colorType);
          setSelectedColorId(colorId);
          
          // Set quotation type to PRE_ORDER
          setQuotationType('PRE_ORDER');
          
          // Update image
          if (firstColor.imageUrl) {
            setCurrentVehicleImage({ uri: firstColor.imageUrl });
          }
        }
      }
    } catch (error) {
      console.error('Error loading color stocks:', error);
    } finally {
      setLoadingColorStocks(false);
    }
  };

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
          
          // If no color selected yet, wait for stock loading to select first in-stock color
          // (will be handled in loadColorStocks useEffect)
          if (!selectedColor && data.colors.length > 0) {
            const firstColor = data.colors[0];
            const firstColorName = firstColor.color?.colorType || firstColor.colorType;
            const firstColorId = firstColor.color?.id || firstColor.id;
            // Temporarily set, will be adjusted after stock loading
            setSelectedColor(firstColorName);
            setSelectedColorId(firstColorId);
            
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
    // Use manual basePrice if it was manually edited, otherwise use vehicle price
    let basePrice = isBasePriceManual ? pricing.basePrice : (Number(vehicle?.price) || 0);
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

    // If finalPrice was manually edited, use it; otherwise calculate from basePrice and discount
    let finalPricePerUnit;
    if (isFinalPriceManual) {
      finalPricePerUnit = pricing.finalPricePerUnit;
      // Recalculate promotion discount based on manual final price
      promotionDiscount = pricePerUnit - finalPricePerUnit;
      if (promotionDiscount < 0) promotionDiscount = 0;
    } else {
      // Calculate final price per unit after promotion
      finalPricePerUnit = pricePerUnit - promotionDiscount;
    }

    // Calculate total price (fixed quantity of 1)
    const totalPrice = finalPricePerUnit;

    setPricing(prev => ({
      ...prev,
      basePrice,
      colorPrice,
      quantityDiscount: 0,
      promotionDiscount,
      totalPrice,
      pricePerUnit,
      finalPricePerUnit,
    }));
  };

  // Handle base price change
  const handleBasePriceChange = (value) => {
    const numValue = parseFloat(value) || 0;
    setIsBasePriceManual(true);
    
    // Recalculate pricing based on new base price
    let promotionDiscount = 0;
    const pricePerUnit = numValue;
    
    // Calculate discount from selected promotion
    if (selectedPromotionId && availablePromotions.length > 0) {
      const selectedPromo = availablePromotions.find(p => p.stockPromotionId === selectedPromotionId);
      if (selectedPromo && selectedPromo.stockPromotion) {
        promotionDiscount = calculateDiscount(selectedPromo.stockPromotion, pricePerUnit);
      }
    }
    
    // If final price was manually edited, keep it; otherwise recalculate
    let finalPricePerUnit;
    if (isFinalPriceManual) {
      finalPricePerUnit = pricing.finalPricePerUnit;
      // Recalculate promotion discount based on manual final price
      promotionDiscount = pricePerUnit - finalPricePerUnit;
      if (promotionDiscount < 0) promotionDiscount = 0;
    } else {
      finalPricePerUnit = pricePerUnit - promotionDiscount;
    }
    
    setPricing(prev => ({
      ...prev,
      basePrice: numValue,
      pricePerUnit,
      promotionDiscount,
      finalPricePerUnit,
      totalPrice: finalPricePerUnit,
    }));
  };

  // Handle final price change
  const handleFinalPriceChange = (value) => {
    const numValue = parseFloat(value) || 0;
    setIsFinalPriceManual(true);
    
    // Recalculate promotion discount based on manual final price
    const basePrice = isBasePriceManual ? pricing.basePrice : (Number(vehicle?.price) || 0);
    const pricePerUnit = basePrice;
    let promotionDiscount = pricePerUnit - numValue;
    if (promotionDiscount < 0) promotionDiscount = 0;
    
    setPricing(prev => ({
      ...prev,
      finalPricePerUnit: numValue,
      totalPrice: numValue,
      promotionDiscount,
      pricePerUnit,
    }));
  };

  // Handle customer form input change
  const handleCustomerInputChange = (field, value) => {
    setCustomerFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (customerErrors[field]) {
      setCustomerErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // Handle customer date of birth change
  const handleCustomerDobChange = (event, selectedDate) => {
    setShowCustomerDobPicker(Platform.OS === 'ios');
    
    if (event.type === 'dismissed') {
      return;
    }
    
    if (selectedDate) {
      handleCustomerInputChange('dob', selectedDate);
    }
  };

  // Validate customer form
  const validateCustomerForm = () => {
    const newErrors = {};

    if (!customerFormData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!customerFormData.email.trim()) {
      newErrors.email = 'Email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(customerFormData.email)) {
        newErrors.email = 'Invalid email format';
      }
    }

    if (!customerFormData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else {
      const phoneRegex = /^[0-9]{10,11}$/;
      if (!phoneRegex.test(customerFormData.phone.replace(/\s/g, ''))) {
        newErrors.phone = 'Invalid phone number (10-11 digits)';
      }
    }

    if (customerFormData.dob) {
      const date = new Date(customerFormData.dob);
      if (isNaN(date.getTime())) {
        newErrors.dob = 'Invalid date of birth';
      } else {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (date > today) {
          newErrors.dob = 'Date of birth cannot be in the future';
        }
      }
    }

    setCustomerErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Helper function to find customer by email or phone
  const findExistingCustomer = async (email, phone) => {
    try {
      const customers = await customerManagementService.getCustomers(parseInt(user.agencyId), { limit: 1000 });
      
      // Search by email first (more unique)
      if (email) {
        const customerByEmail = customers.find(c => 
          c.email && c.email.toLowerCase() === email.toLowerCase()
        );
        if (customerByEmail) {
          return customerByEmail;
        }
      }
      
      // Search by phone
      if (phone) {
        const normalizedPhone = phone.replace(/\s/g, '');
        const customerByPhone = customers.find(c => {
          const customerPhone = c.phone ? c.phone.replace(/\s/g, '') : '';
          return customerPhone === normalizedPhone;
        });
        if (customerByPhone) {
          return customerByPhone;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error searching for existing customer:', error);
      return null;
    }
  };

  // Create customer
  const handleCreateCustomer = async () => {
    if (!validateCustomerForm()) {
      showError('Validation Error', 'Please check your input fields');
      return;
    }

    if (!user?.agencyId) {
      showError('Authentication Error', 'User information not found. Please login again.');
      return;
    }

    setCreatingCustomer(true);
    try {
      const customerData = {
        name: customerFormData.name.trim(),
        email: customerFormData.email.trim(),
        phone: customerFormData.phone.trim(),
        address: customerFormData.address.trim() || undefined,
        credentialId: customerFormData.credentialId.trim() || undefined,
        dob: customerFormData.dob ? new Date(customerFormData.dob).toISOString() : undefined,
        agencyId: parseInt(user.agencyId),
      };

      const newCustomer = await customerManagementService.createCustomer(customerData);

      if (newCustomer && newCustomer.id) {
        setCustomerId(newCustomer.id);
        showSuccess('Customer Created', 'Customer information has been saved successfully.');
      } else {
        throw new Error('Failed to create customer - no ID returned');
      }
    } catch (error) {
      // Check if error is due to duplicate customer
      const errorStatus = error.response?.status;
      const errorMessage = error.response?.data?.message || error.message || '';
      const isDuplicateError = errorStatus === 400 || errorStatus === 409 || 
                               errorMessage.toLowerCase().includes('duplicate') ||
                               errorMessage.toLowerCase().includes('already exists') ||
                               errorMessage.toLowerCase().includes('already registered');
      
      // Only log errors that are NOT duplicate errors (duplicates are expected behavior)
      if (!isDuplicateError) {
        console.error('Error creating customer:', error);
      }
      
      if (isDuplicateError) {
        // Try to find existing customer
        const existingCustomer = await findExistingCustomer(
          customerFormData.email.trim(),
          customerFormData.phone.trim()
        );
        
        if (existingCustomer && existingCustomer.id) {
          // Use existing customer and update form data with existing customer info
          setCustomerId(existingCustomer.id);
          // Update form data with existing customer information for display
          setCustomerFormData(prev => ({
            ...prev,
            name: existingCustomer.name || prev.name,
            email: existingCustomer.email || prev.email,
            phone: existingCustomer.phone || prev.phone,
            address: existingCustomer.address || prev.address,
            credentialId: existingCustomer.credentialId || prev.credentialId,
            dob: existingCustomer.dob ? new Date(existingCustomer.dob) : prev.dob,
          }));
          showInfo(
            'Customer Already Exists',
            'This customer already exists in the system. Using existing customer information.',
          );
        } else {
          // Couldn't find existing customer, show error
          showError(
            'Customer Already Exists',
            'This customer may already exist in the system. Please check the email or phone number, or try again later.'
          );
        }
      } else {
        // Other errors
        const displayMessage = errorMessage || 'Failed to create customer. Please try again.';
        showError('Error', displayMessage);
      }
    } finally {
      setCreatingCustomer(false);
    }
  };

  const handleCreateQuotation = async () => {
    if (!vehicle) {
      showError('Missing Data', 'Vehicle information not found');
      return;
    }

    // Validate customerId
    if (!customerId) {
      showError('Missing Information', 'Please create customer information first');
      return;
    }

    // Validate user context
    if (!user?.id || !user?.agencyId) {
      showError('Authentication Error', 'User information not found. Please login again.');
      return;
    }

    // Validate colorId - required for all quotation types
    if (!selectedColorId) {
      showError('Missing Information', 'Please select a color.');
      return;
    }
    
    // Validate color stock for AT_STORE and ORDER
    if (quotationType === 'AT_STORE' || quotationType === 'ORDER') {
      const quantity = colorStockMap.get(selectedColorId) || 0;
      if (quantity === 0) {
        showError('Invalid Selection', 'Selected color is not in stock. Please select Pre-order type or choose a color with stock.');
        return;
      }
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
        customerId: customerId,
        motorbikeId: parseInt(vehicle.id),
        colorId: selectedColorId, // Color is required for all quotation types
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
    setCustomerId(null);
    setCustomerFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      credentialId: '',
      dob: null,
    });
    setCustomerErrors({});
    setSelectedColor((Array.isArray(vehicle?.colors) && vehicle.colors[0]) || 'Black');
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <ArrowLeft color={COLORS.TEXT.WHITE} size={18} />
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
    const colorItem = availableColors.find(c => 
      (c.color?.colorType || c.colorType) === color
    );
    
    if (!colorItem) return;
    
    const colorId = colorItem.color?.id || colorItem.id;
    const quantity = colorStockMap.get(colorId) || 0;
    const hasStock = quantity > 0;
    
    // Set selected color
    setSelectedColor(color);
    setSelectedColorId(colorId);
    
    // Auto-adjust quotation type based on color stock
    // If color has stock and current type is PRE_ORDER, switch to AT_STORE
    // If color doesn't have stock and current type is AT_STORE/ORDER, switch to PRE_ORDER
    if (hasStock) {
      if (quotationType === 'PRE_ORDER') {
        setQuotationType('AT_STORE');
      }
    } else {
      // Color doesn't have stock, must use PRE_ORDER
      if (quotationType !== 'PRE_ORDER') {
        setQuotationType('PRE_ORDER');
      }
    }
    
    loadMotorbikeColorData(color);
  };

  // Helper function to get actual color code/hex from color object
  const getColorFromObject = (colorItem) => {
    const colorId = colorItem.color?.id || colorItem.id;
    
    // First try to get from colorCodeMap (loaded from API)
    if (colorId && colorCodeMap.has(colorId)) {
      const code = colorCodeMap.get(colorId);
      // If it's already a hex code, return it
      if (code && typeof code === 'string' && code.startsWith('#')) {
        return code;
      }
      // If it's a color name, get hex from map
      if (code) {
        return getColorHex(code);
      }
    }
    
    // Try different possible fields for color code from colorItem itself
    // Check nested color object first
    if (colorItem.color) {
      if (colorItem.color.colorCode && typeof colorItem.color.colorCode === 'string') {
        const code = colorItem.color.colorCode;
        return code.startsWith('#') ? code : getColorHex(code);
      }
      if (colorItem.color.hex && typeof colorItem.color.hex === 'string') {
        return colorItem.color.hex;
      }
    }
    
    // Check direct properties
    if (colorItem.colorCode && typeof colorItem.colorCode === 'string') {
      const code = colorItem.colorCode;
      return code.startsWith('#') ? code : getColorHex(code);
    }
    if (colorItem.hex && typeof colorItem.hex === 'string') {
      return colorItem.hex;
    }
    
    // Fallback to colorType name (case-insensitive lookup)
    const colorType = colorItem.color?.colorType || colorItem.colorType || '';
    if (colorType) {
      return getColorHex(colorType);
    }
    
    // Ultimate fallback - gray color instead of black
    return '#808080';
  };

  const renderColorSelection = () => {
    if (availableColors.length === 0) {
      return null;
    }

    const isPreorderType = quotationType === 'PRE_ORDER';
    const isStoreOrOrder = quotationType === 'AT_STORE' || quotationType === 'ORDER';

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Color</Text>
        {isStoreOrOrder && (
          <Text style={styles.sectionSubtitle}>
            Only colors available in stock can be selected for At Store/Order quotations.
          </Text>
        )}
        {isPreorderType && (
          <Text style={styles.sectionSubtitle}>
            All colors can be selected for Pre-order quotations.
          </Text>
        )}
        <View style={styles.colorsContainer}>
          {availableColors.map((colorItem, index) => {
            const colorId = colorItem.color?.id || colorItem.id;
            const colorType = colorItem.color?.colorType || colorItem.colorType || '';
            const colorCode = getColorFromObject(colorItem);
            const quantity = colorStockMap.get(colorId) || 0;
            const hasStock = quantity > 0;
            const isSelected = selectedColor === colorType;
            
            // Disable logic:
            // - If AT_STORE/ORDER: only enable colors with stock
            // - If PRE_ORDER: enable all colors
            const isDisabled = isStoreOrOrder && !hasStock;
            
            // Debug log (can be removed later)
            if (index === 0) {
              console.log('Color Item:', JSON.stringify(colorItem, null, 2));
              console.log('Color Code Result:', colorCode);
              console.log('Color Code Map has ID:', colorId, '?', colorCodeMap.has(colorId));
            }

            return (
              <View key={colorId || index} style={styles.colorOptionWrapper}>
                <TouchableOpacity
                  style={[
                    styles.colorOption,
                    { backgroundColor: colorCode },
                    isSelected && styles.selectedColorOption,
                    isDisabled && styles.colorOptionDisabled,
                  ]}
                  onPress={() => {
                    if (!isDisabled) {
                      handleColorChange(colorType);
                    }
                  }}
                  disabled={isDisabled}
                  activeOpacity={isDisabled ? 0.5 : 0.8}
                >
                  {isSelected && !isDisabled && (
                    <View style={styles.colorCheckmark}>
                      <Check color="#FFFFFF" size={14} />
                    </View>
                  )}
                  {isDisabled && (
                    <View style={styles.outOfStockOverlay}>
                      <Text style={styles.outOfStockText}>✕</Text>
                    </View>
                  )}
                </TouchableOpacity>
                {isDisabled && (
                  <Text style={styles.outOfStockLabel}>Not in Stock</Text>
                )}
                {!isDisabled && !hasStock && isPreorderType && (
                  <Text style={styles.preorderLabel}>Pre-order</Text>
                )}
              </View>
            );
          })}
        </View>
        <Text style={styles.selectedColorText}>
          Selected: {selectedColor || 'None'}
          {selectedColorId && (colorStockMap.get(selectedColorId) || 0) > 0 && (
            <Text style={styles.stockInfoText}> (In Stock)</Text>
          )}
          {selectedColorId && (colorStockMap.get(selectedColorId) || 0) === 0 && (
            <Text style={styles.preorderInfoText}> (Pre-order)</Text>
          )}
        </Text>
      </View>
    );
  };

  const renderQuotationTypeSelection = () => {
    // If vehicle doesn't have stock at agency, only allow PRE_ORDER
    // If vehicle has stock at agency, allow all types (AT_STORE/ORDER for colors with stock, PRE_ORDER for colors without stock)
    const isPreorderOnly = !hasStockAtAgency;
    const isStockAvailable = hasStockAtAgency;
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quotation Type</Text>
        {isPreorderOnly && (
          <Text style={styles.sectionSubtitle}>
            This vehicle is not available at the agency. Only Pre-order is available.
          </Text>
        )}
        {isStockAvailable && (
          <Text style={styles.sectionSubtitle}>
            Select At Store/Order for colors in stock, or Pre-order for colors not in stock.
          </Text>
        )}
        <View style={styles.typeContainer}>
          {['AT_STORE', 'ORDER', 'PRE_ORDER'].map((type) => {
            // Only disable AT_STORE/ORDER if vehicle doesn't have stock at all
            // If vehicle has stock, all types are available (but color selection will be restricted)
            const isDisabled = isPreorderOnly && type !== 'PRE_ORDER';
            const isSelected = quotationType === type;
            
            return (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeOption,
                  isSelected && styles.typeOptionSelected,
                  isDisabled && styles.typeOptionDisabled,
                ]}
                onPress={() => {
                  if (!isDisabled) {
                    setQuotationType(type);
                  }
                }}
                disabled={isDisabled}
                activeOpacity={isDisabled ? 0.5 : 0.8}
              >
                <Text style={[
                  styles.typeText,
                  isSelected && styles.typeTextSelected,
                  isDisabled && styles.typeTextDisabled,
                ]}>
                  {type === 'AT_STORE' ? 'At Store' : type === 'ORDER' ? 'Order' : 'Pre-Order'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

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

  const renderCustomerInfo = () => {
    const formatDateForDisplay = (date) => {
      if (!date) return '';
      const d = new Date(date);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    };

    // If customer already created, show customer info
    if (customerId) {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          <View style={styles.customerInfoCard}>
            <Text style={styles.customerInfoTitle}>Customer Created Successfully</Text>
            <View style={styles.customerInfoRow}>
              <Text style={styles.customerInfoLabel}>Name:</Text>
              <Text style={styles.customerInfoValue}>{customerFormData.name || 'N/A'}</Text>
            </View>
            <View style={styles.customerInfoRow}>
              <Text style={styles.customerInfoLabel}>Email:</Text>
              <Text style={styles.customerInfoValue}>{customerFormData.email || 'N/A'}</Text>
            </View>
            <View style={styles.customerInfoRow}>
              <Text style={styles.customerInfoLabel}>Phone:</Text>
              <Text style={styles.customerInfoValue}>{customerFormData.phone || 'N/A'}</Text>
            </View>
            {customerFormData.address && (
              <View style={styles.customerInfoRow}>
                <Text style={styles.customerInfoLabel}>Address:</Text>
                <Text style={styles.customerInfoValue}>{customerFormData.address}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={styles.editCustomerButton}
            onPress={() => {
              setCustomerId(null);
              setCustomerErrors({});
            }}
          >
            <Text style={styles.editCustomerButtonText}>Edit Customer Information</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Show customer creation form
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Customer Information</Text>
        <Text style={styles.sectionSubtitle}>Please fill in customer information to create quotation</Text>
        
        {/* Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>
            Name <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.textInput, customerErrors.name && styles.inputError]}
            placeholder="Enter customer name"
            placeholderTextColor={COLORS.TEXT.SECONDARY}
            value={customerFormData.name}
            onChangeText={(text) => handleCustomerInputChange('name', text)}
            autoCapitalize="words"
          />
          {customerErrors.name && (
            <Text style={styles.errorText}>{customerErrors.name}</Text>
          )}
        </View>

        {/* Email */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>
            Email <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.textInput, customerErrors.email && styles.inputError]}
            placeholder="Enter email"
            placeholderTextColor={COLORS.TEXT.SECONDARY}
            value={customerFormData.email}
            onChangeText={(text) => handleCustomerInputChange('email', text)}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {customerErrors.email && (
            <Text style={styles.errorText}>{customerErrors.email}</Text>
          )}
        </View>

        {/* Phone */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>
            Phone <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.textInput, customerErrors.phone && styles.inputError]}
            placeholder="Enter phone number (10-11 digits)"
            placeholderTextColor={COLORS.TEXT.SECONDARY}
            value={customerFormData.phone}
            onChangeText={(text) => handleCustomerInputChange('phone', text)}
            keyboardType="phone-pad"
          />
          {customerErrors.phone && (
            <Text style={styles.errorText}>{customerErrors.phone}</Text>
          )}
        </View>

        {/* Address */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Address</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder="Enter address (optional)"
            placeholderTextColor={COLORS.TEXT.SECONDARY}
            value={customerFormData.address}
            onChangeText={(text) => handleCustomerInputChange('address', text)}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Credential ID */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>ID Card</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter ID card number (optional)"
            placeholderTextColor={COLORS.TEXT.SECONDARY}
            value={customerFormData.credentialId}
            onChangeText={(text) => handleCustomerInputChange('credentialId', text)}
          />
        </View>

        {/* Date of Birth */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Date of Birth</Text>
          <TouchableOpacity
            style={[styles.dateInput, customerErrors.dob && styles.inputError]}
            onPress={() => setShowCustomerDobPicker(true)}
          >
            <Text style={[
              styles.dateInputText,
              !customerFormData.dob && styles.dateInputPlaceholder
            ]}>
              {customerFormData.dob ? formatDateForDisplay(customerFormData.dob) : 'Select date of birth (optional)'}
            </Text>
            <Text style={styles.datePickerIcon}><Calendar color="#FFFFFF" size={16} /></Text>
          </TouchableOpacity>
          {customerErrors.dob && (
            <Text style={styles.errorText}>{customerErrors.dob}</Text>
          )}
        </View>

        {/* Create Customer Button */}
        <TouchableOpacity
          style={[styles.createCustomerButton, creatingCustomer && styles.disabledButton]}
          onPress={handleCreateCustomer}
          disabled={creatingCustomer}
        >
          {creatingCustomer ? (
            <ActivityIndicator color="#009DFF" />
          ) : (
            <Text style={styles.createCustomerButtonText}>Create Customer</Text>
          )}
        </TouchableOpacity>

        {/* Date Picker */}
        {showCustomerDobPicker && (
          <Modal
            visible={showCustomerDobPicker}
            transparent
            animationType="fade"
            onRequestClose={() => setShowCustomerDobPicker(false)}
          >
            <TouchableWithoutFeedback onPress={() => setShowCustomerDobPicker(false)}>
              <View style={styles.datePickerOverlay}>
                <TouchableWithoutFeedback onPress={() => {}}>
                  <View style={styles.datePickerContainer}>
                    <DateTimePicker
                      value={customerFormData.dob || new Date()}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={handleCustomerDobChange}
                      maximumDate={new Date()}
                      locale="vi-VN"
                      textColor="#000"
                    />
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
        )}
      </View>
    );
  };


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
          {/* Base Price - Editable */}
          <View style={styles.pricingInputRow}>
            <Text style={styles.pricingLabel}>Base Price:</Text>
            <View style={styles.pricingInputContainer}>
              <TextInput
                style={styles.pricingInput}
                value={pricing.basePrice.toString()}
                onChangeText={handleBasePriceChange}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={COLORS.TEXT.SECONDARY}
              />
              <Text style={styles.pricingCurrency}>VND</Text>
            </View>
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
          
          {/* Final Price - Editable */}
          <View style={styles.pricingInputRow}>
            <Text style={styles.totalLabel}>Final Price:</Text>
            <View style={styles.pricingInputContainer}>
              <TextInput
                style={[styles.pricingInput, styles.finalPriceInput]}
                value={pricing.finalPricePerUnit.toString()}
                onChangeText={handleFinalPriceChange}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={COLORS.TEXT.SECONDARY}
              />
              <Text style={[styles.pricingCurrency, styles.finalPriceCurrency]}>VND</Text>
            </View>
          </View>
          
          {/* Total (same as final price) */}
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
        style={[styles.createButton, (loading || !customerId) && styles.disabledButton]}
        onPress={handleCreateQuotation}
        disabled={loading || !customerId}
      >
        {loading ? (
          <ActivityIndicator color="#009DFF" />
        ) : (
          <Text style={styles.createButtonText}>Create Quotation</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.contentContainer}>
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {renderVehicleInfo()}
            {renderColorSelection()}
            {renderQuotationTypeSelection()}
            {renderValidUntilSelection()}
            {renderCustomerInfo()}
            {renderPromotionSelection()}
            {renderPricing()}
          </ScrollView>
          {renderActionButtons()}
        </View>
      </KeyboardAvoidingView>
      
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

// Helper function to get color hex (case-insensitive)
const getColorHex = (colorName) => {
  if (!colorName || typeof colorName !== 'string') {
    return '#808080'; // Gray as fallback instead of black
  }
  
  // Normalize color name (trim and capitalize first letter)
  const normalizedName = colorName.trim();
  
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
    'Grey': '#808080',
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
  
  // Try exact match first
  if (colorMap[normalizedName]) {
    return colorMap[normalizedName];
  }
  
  // Try case-insensitive match
  const lowerName = normalizedName.toLowerCase();
  for (const [key, value] of Object.entries(colorMap)) {
    if (key.toLowerCase() === lowerName) {
      return value;
    }
  }
  
  // If still not found, check if it's already a hex code
  if (normalizedName.startsWith('#')) {
    return normalizedName;
  }
  
  // Ultimate fallback - gray instead of black
  return '#808080';
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
    paddingTop: Platform.OS === 'ios' ? SIZES.PADDING.XXXLARGE : SIZES.PADDING.XXXLARGE,
    paddingBottom: SIZES.PADDING.MEDIUM,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
  placeholder: {
    width: 40,
  },
  keyboardView: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: COLORS.SURFACE,
    borderTopLeftRadius: SIZES.RADIUS.XXLARGE,
    borderTopRightRadius: SIZES.RADIUS.XXLARGE,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SIZES.PADDING.LARGE,
    paddingTop: SIZES.PADDING.LARGE,
    paddingBottom: SIZES.PADDING.XXXLARGE,
  },
  section: {
    marginVertical: SIZES.PADDING.MEDIUM,
  },
  sectionTitle: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: "#000000",
    marginBottom: SIZES.PADDING.SMALL,
  },
  vehicleCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
    borderWidth: 1,
    borderColor: COLORS.BORDER.PRIMARY,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
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
    color: '#000000',
    marginBottom: 2,
  },
  vehicleModel: {
    fontSize: SIZES.FONT.SMALL,
    color: '#000000',
    marginBottom: SIZES.PADDING.SMALL,
  },
  specsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  specText: {
    fontSize: SIZES.FONT.SMALL,
    color: '#000000',
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
    color: '#000000',
    fontStyle: 'italic',
  },
  preorderLabel: {
    fontSize: SIZES.FONT.XSMALL,
    color: '#009DFF',
    marginTop: 2,
    textAlign: 'center',
  },
  stockInfoText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.SUCCESS || '#4CAF50',
    fontWeight: '600',
  },
  preorderInfoText: {
    fontSize: SIZES.FONT.SMALL,
    color: '#009DFF',
    fontWeight: '600',
  },
  colorOptionWrapper: {
    alignItems: 'center',
    marginRight: SIZES.PADDING.SMALL,
    marginBottom: SIZES.PADDING.SMALL,
  },
  colorOptionDisabled: {
    opacity: 0.4,
  },
  outOfStockOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outOfStockText: {
    color: COLORS.TEXT.WHITE,
    fontSize: 18,
    fontWeight: 'bold',
  },
  outOfStockLabel: {
    fontSize: SIZES.FONT.XSMALL,
    color: COLORS.ERROR,
    marginTop: 2,
    textAlign: 'center',
  },
  typeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SIZES.PADDING.SMALL,
  },
  typeOption: {
    flex: 1,
    paddingVertical: SIZES.PADDING.SMALL,
    paddingHorizontal: SIZES.PADDING.SMALL,
    borderRadius: SIZES.RADIUS.SMALL,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: COLORS.BORDER.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeOptionSelected: {
    backgroundColor: "#009DFF",
    borderColor: '#009DFF',
  },
  typeText: {
    fontSize: SIZES.FONT.SMALL,
    color: '#000000',
    fontWeight: '600',
  },
  typeTextSelected: {
    color: COLORS.TEXT.WHITE,
    fontWeight: 'bold',
  },
  typeOptionDisabled: {
    opacity: 0.5,
    backgroundColor: '#E0E0E0',
  },
  typeTextDisabled: {
    color: COLORS.TEXT.SECONDARY,
  },
  inputGroup: {
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  inputLabel: {
    fontSize: SIZES.FONT.SMALL,
    fontWeight: '600',
    color: '#000000',
    marginBottom: SIZES.PADDING.SMALL,
  },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.BORDER.PRIMARY,
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    fontSize: SIZES.FONT.SMALL,
    color: '#000000',
    backgroundColor: '#F5F5F5',
  },
  hintText: {
    fontSize: SIZES.FONT.XSMALL,
    color: '#000000',
    marginTop: SIZES.PADDING.XSMALL,
    fontStyle: 'italic',
  },
  dateInput: {
    borderWidth: 1,
    borderColor: COLORS.BORDER.PRIMARY,
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    backgroundColor: '#F5F5F5',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateInputText: {
    fontSize: SIZES.FONT.SMALL,
    color: '#000000',
  },
  datePickerIcon: {
    fontSize: 20,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  sectionSubtitle: {
    fontSize: SIZES.FONT.SMALL,
    color: '#000000',
    marginBottom: SIZES.PADDING.MEDIUM,
    fontStyle: 'italic',
  },
  required: {
    color: COLORS.ERROR,
  },
  inputError: {
    borderColor: COLORS.ERROR,
    borderWidth: 2,
  },
  createCustomerButton: {
    backgroundColor: '#009DFF',
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingVertical: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SIZES.PADDING.SMALL,
  },
  createCustomerButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
  editCustomerButton: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
    marginTop: SIZES.PADDING.SMALL,
    borderWidth: 1,
    borderColor: COLORS.BORDER.PRIMARY,
  },
  editCustomerButtonText: {
    fontSize: SIZES.FONT.SMALL,
    color: '#009DFF',
    fontWeight: '600',
  },
  dateInputPlaceholder: {
    color: '#000000',
  },
  customerInfoCard: {
    backgroundColor: COLORS.SURFACE,
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
    color: '#000000',
    width: 100,
  },
  customerInfoValue: {
    fontSize: SIZES.FONT.SMALL,
    color: '#000000',
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
    backgroundColor: '#009DFF',
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
    color: '#000000',
    marginHorizontal: SIZES.PADDING.MEDIUM,
    minWidth: 30,
    textAlign: 'center',
  },
  pricingContainer: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
    borderWidth: 1,
    borderColor: COLORS.BORDER.PRIMARY,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SIZES.PADDING.SMALL,
  },
  pricingInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SIZES.PADDING.SMALL,
  },
  pricingInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  pricingInput: {
    borderWidth: 1,
    borderColor: COLORS.BORDER.PRIMARY,
    borderRadius: SIZES.RADIUS.SMALL,
    paddingHorizontal: SIZES.PADDING.SMALL,
    paddingVertical: SIZES.PADDING.XSMALL,
    fontSize: SIZES.FONT.SMALL,
    color: '#000000',
    backgroundColor: '#F5F5F5',
    minWidth: 120,
    textAlign: 'right',
  },
  finalPriceInput: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: '600',
    minWidth: 140,
  },
  pricingCurrency: {
    fontSize: SIZES.FONT.SMALL,
    color: '#000000',
    marginLeft: SIZES.PADDING.SMALL,
  },
  finalPriceCurrency: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: '600',
  },
  pricingLabel: {
    fontSize: SIZES.FONT.SMALL,
    color: '#000000',
  },
  pricingValue: {
    fontSize: SIZES.FONT.SMALL,
    fontWeight: '600',
    color: '#000000',
  },
  discountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SIZES.PADDING.SMALL,
    borderRadius: SIZES.RADIUS.SMALL,
    paddingHorizontal: SIZES.PADDING.SMALL,
    marginVertical: SIZES.PADDING.SMALL,
  },
  discountLabel: {
    fontSize: SIZES.FONT.SMALL,
    color: '#000000',
    fontWeight: '600',
  },
  discountValue: {
    fontSize: SIZES.FONT.SMALL,
    fontWeight: 'bold',
    color: '#000000',
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
    borderRadius: SIZES.RADIUS.SMALL,
    padding: SIZES.PADDING.MEDIUM,
    marginTop: SIZES.PADDING.SMALL,
  },
  totalLabel: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: '#000000',
  },
  totalValue: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: '#009DFF',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.PADDING.LARGE,
    paddingVertical: SIZES.PADDING.LARGE,
    backgroundColor: COLORS.SURFACE,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER.PRIMARY,
  },
  resetButton: {
    flex: 1,
    backgroundColor: '#000000',
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
    backgroundColor: '#009DFF',
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
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#009DFF',
  },
  promotionInfo: {
    flex: 1,
  },
  promotionCode: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: '#009DFF',
    marginBottom: 4,
  },
  promotionName: {
    fontSize: SIZES.FONT.SMALL,
    color: '#000000',
    fontWeight: '600',
    marginBottom: 2,
  },
  promotionDescription: {
    fontSize: SIZES.FONT.XSMALL,
    color: '#000000',
    marginBottom: 4,
  },
  promotionDiscount: {
    fontSize: SIZES.FONT.SMALL,
    color: '#000000',
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
    backgroundColor: '#009DFF',
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
  },
  promotionButtonText: {
    color: COLORS.TEXT.WHITE,
    fontSize: SIZES.FONT.SMALL,
    fontWeight: '600',
  },
  datePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerContainer: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.LARGE,
    padding: SIZES.PADDING.LARGE,
    width: '90%',
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
    backgroundColor: COLORS.SURFACE,
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
    color: '#009DFF',
    marginBottom: 2,
  },
  promotionItemName: {
    fontSize: SIZES.FONT.SMALL,
    color: '#000000',
    fontWeight: '600',
    marginBottom: 2,
  },
  promotionItemDescription: {
    fontSize: SIZES.FONT.XSMALL,
    color: '#000000',
    marginBottom: 2,
  },
  promotionItemDiscount: {
    fontSize: SIZES.FONT.XSMALL,
    color: '#000000',
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
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
    borderWidth: 1,
    borderColor: COLORS.BORDER.PRIMARY,
    marginBottom: SIZES.PADDING.SMALL,
  },
  promotionCardSelected: {
    borderColor: '#009DFF',
    borderWidth: 2,
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
    backgroundColor: '#009DFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CreateQuotationScreen;
