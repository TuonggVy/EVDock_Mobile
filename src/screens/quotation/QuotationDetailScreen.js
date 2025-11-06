import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Share,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES } from '../../constants';
import usePayment from '../../hooks/usePayment';
import { formatPaymentAmount, getPaymentInstructions } from '../../utils/paymentUtils';
import installmentStorageService from '../../services/storage/installmentStorageService';
import { quotationService } from '../../services/quotationService';
import motorbikeService from '../../services/motorbikeService';
import { ArrowLeft, Pencil } from 'lucide-react-native';

const QuotationDetailScreen = ({ navigation, route }) => {
  const { quotation, onQuotationUpdate } = route.params;
  
  // Local state for detail data
  const [quotationDetail, setQuotationDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [motorbikeDetails, setMotorbikeDetails] = useState(null);
  const [configurations, setConfigurations] = useState({
    appearance: null,
    configuration: null,
    battery: null,
    safeFeature: null,
  });
  const [currentVehicleImage, setCurrentVehicleImage] = useState(null);
  
  // Local state for modals
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPaymentTypeModal, setShowPaymentTypeModal] = useState(false);
  const [selectedPaymentType, setSelectedPaymentType] = useState(null);
  const [installmentMonths, setInstallmentMonths] = useState(12);
  const [paymentData, setPaymentData] = useState(null);
  const [depositInfo, setDepositInfo] = useState(null);

  // Payment hook
  const { 
    loading: paymentLoading, 
    error: paymentError, 
    createPayment, 
    processPaymentCompletion 
  } = usePayment();

  // Load quotation detail from API
  useEffect(() => {
    loadQuotationDetail();
  }, []);

  // Reload quotation detail when screen comes into focus (e.g., after creating deposit)
  useFocusEffect(
    React.useCallback(() => {
      const refreshDeposit = route.params?.refreshDeposit;
      
      if (refreshDeposit) {
        // Reload quotation detail to get updated deposit info
        loadQuotationDetail();
        // Clear the refresh flag
        navigation.setParams({ refreshDeposit: false, depositId: null });
      } else {
        // Always reload quotation detail when screen comes into focus
        loadQuotationDetail();
      }
    }, [route.params?.refreshDeposit])
  );

  const loadQuotationDetail = async () => {
    if (!quotation?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await quotationService.getQuotationById(parseInt(quotation.id));
      if (response.success) {
        const detail = response.data?.data || response.data;
        setQuotationDetail(detail);
        
        // Load deposit from quotation detail response
        if (detail.deposit) {
          setDepositInfo(detail.deposit);
        }
        
        // Load motorbike details including configurations
        if (detail.motorbikeId) {
          loadMotorbikeDetails(detail.motorbikeId, detail.colorId);
        }
      } else {
        Alert.alert('Error', response.error || 'Failed to load quotation details');
      }
    } catch (error) {
      console.error('Error loading quotation detail:', error);
      Alert.alert('Error', 'Failed to load quotation details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadMotorbikeDetails = async (motorbikeId, colorId) => {
    if (!motorbikeId) return;
    
    try {
      const response = await motorbikeService.getMotorbikeById(parseInt(motorbikeId));
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
        
        // Load image based on selected color
        if (colorId && data.colors && Array.isArray(data.colors) && data.colors.length > 0) {
          const selectedColorItem = data.colors.find(c => c.color?.id === colorId || c.id === colorId);
          if (selectedColorItem && selectedColorItem.imageUrl) {
            setCurrentVehicleImage({ uri: selectedColorItem.imageUrl });
          } else if (data.images && data.images.length > 0) {
            setCurrentVehicleImage({ uri: data.images[0].imageUrl });
          }
        } else if (data.images && data.images.length > 0) {
          setCurrentVehicleImage({ uri: data.images[0].imageUrl });
        }
      }
    } catch (error) {
      console.error('Error loading motorbike details:', error);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Get the actual quotation data (from API or params)
  const getQuotationData = () => {
    return quotationDetail || quotation;
  };

  const handleShare = async () => {
    try {
      const quote = getQuotationData();
      const vehicle = quote.vehicle || quote.motorbike || {
        name: quote.vehicleModel || 'Unknown Model',
        selectedColor: 'Black'
      };
      const colorName = quote.color?.colorType || vehicle.selectedColor || 'Black';
      const pricing = quote.pricing || { totalPrice: quote.totalAmount || quote.finalPrice || 0 };
      
      const message = `Quotation ${quote.id || 'N/A'}\n\nVehicle: ${vehicle.name}\nColor: ${colorName}\nTotal: ${formatPrice(pricing.totalPrice)}`;
      
      await Share.share({
        message,
        title: `Quotation ${quote.id || 'N/A'}`,
      });
    } catch (error) {
      console.error('Error sharing quotation:', error);
    }
  };

  const handlePrint = () => {
    Alert.alert('Print Quotation', 'Print quotation feature will be implemented');
  };

  // Payment functions
  const handlePayment = async () => {
    // Show payment type selection modal first
    setShowPaymentTypeModal(true);
  };

  const handlePaymentTypeSelect = async (paymentType) => {
    setSelectedPaymentType(paymentType);
    setShowPaymentTypeModal(false);
    
    try {
      const quote = getQuotationData();
      const payment = await createPayment({
        ...quote,
        paymentType,
        installmentMonths: paymentType === 'installment' ? installmentMonths : null,
      });
      setPaymentData(payment);
      setShowPaymentModal(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to create payment. Please try again.');
    }
  };

  const handleContractView = () => {
    const quote = getQuotationData();
    const quotationId = quote.id || quote.quotationId;
    if (quotationId) {
      navigation.navigate('CreateCustomerContract', { quotationId: quotationId.toString() });
    } else {
      Alert.alert('Error', 'Quotation ID not found');
    }
  };

  const processPayment = async () => {
    try {
      const quote = getQuotationData();
      await processPaymentCompletion(quote.id, {
        paymentType: selectedPaymentType,
        installmentMonths: selectedPaymentType === 'installment' ? installmentMonths : null,
      });
      
      setShowPaymentModal(false);
      setPaymentData(null);
      
      // Create installment plan if payment type is installment
      if (selectedPaymentType === 'installment') {
        try {
          const installment = await installmentStorageService.createInstallment({
            quotationId: quote.id,
            customerId: quote.customerId || quote.customer?.id || `C${Date.now()}`,
            customerName: quote.customerName || quote.customer?.name,
            customerPhone: quote.customerPhone || quote.customer?.phone,
            vehicleModel: quote.vehicleModel || quote.vehicle?.name || quote.motorbike?.name,
            totalAmount: quote.pricing?.totalPrice || quote.totalAmount || quote.finalPrice,
            installmentMonths: installmentMonths,
            interestRate: 6.0,
            startDate: new Date().toISOString(),
            createdBy: 'Dealer Staff',
            dealerId: quote.dealerId || 'dealer001',
          });
          
          console.log('✅ Installment plan created:', installment.id);
        } catch (installmentError) {
          console.error('Error creating installment plan:', installmentError);
          // Don't fail the payment if installment creation fails
        }
      }
      
      // Notify parent screen about the update
      if (onQuotationUpdate) {
        onQuotationUpdate({ ...quote, status: 'paid', paymentType: selectedPaymentType });
      }
      
      const paymentMessage = selectedPaymentType === 'installment'
        ? `Quotation has been paid successfully!\n\n✅ ${installmentMonths} month installment plan created\n✅ Customer added to list\n\n📅 View installment details in "Installment Management"`
        : 'Quotation has been paid successfully!\n\nCustomer has been automatically added to the list of customers who purchased a vehicle.';
      
      Alert.alert(
        'Payment Successful',
        paymentMessage,
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back to quotation management to refresh
              navigation.goBack();
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to process payment. Please try again.');
    }
  };

  const generateQRCode = () => {
    if (paymentData && paymentData.qrCode) {
      return paymentData.qrCode;
    }
    
    // Fallback for demo
    const quote = getQuotationData();
    const fallbackData = {
      quotationId: quote.id,
      amount: quote.pricing?.totalPrice || quote.totalAmount || quote.finalPrice || 0,
      merchant: 'EVDock',
      timestamp: new Date().toISOString()
    };
    
    return JSON.stringify(fallbackData);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}><ArrowLeft color="#FFFFFF" size={18} /></Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Quotation Details</Text>
      <View style={styles.placeholder} />
    </View>
  );

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'DRAFT': return COLORS.WARNING;
      case 'ACCEPTED': return COLORS.SUCCESS;
      case 'REJECTED': return COLORS.ERROR;
      case 'EXPIRED': return COLORS.TEXT.SECONDARY;
      case 'REVERSED': return COLORS.PRIMARY;
      default: return COLORS.TEXT.SECONDARY;
    }
  };

  const getStatusText = (status) => {
    switch (status?.toUpperCase()) {
      case 'DRAFT': return 'Draft';
      case 'ACCEPTED': return 'Accepted';
      case 'REJECTED': return 'Rejected';
      case 'EXPIRED': return 'Expired';
      case 'REVERSED': return 'Reversed';
      default: return 'Unknown';
    }
  };

  const renderQuotationInfo = () => {
    const quote = getQuotationData();
    const createDate = quote.createDate || quote.createdAt;
    const validUntil = quote.validUntil;
    const type = quote.type;
    const deposit = quote.deposit;
    
    const getTypeText = (type) => {
      switch (type) {
        case 'AT_STORE': return 'At Store';
        case 'ORDER': return 'Order';
        case 'PRE_ORDER': return 'Pre-Order';
        default: return type || 'N/A';
      }
    };
    
    return (
      <View style={styles.section}>
        <View style={styles.quotationHeader}>
          <View>
            <Text style={styles.quotationId}>Quotation: {quote.id || 'N/A'}</Text>
            {quote.quoteCode && (
              <Text style={styles.quoteCode}>{quote.quoteCode}</Text>
            )}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(quote.status) }]}>
            <Text style={styles.statusText}>{getStatusText(quote.status)}</Text>
          </View>
        </View>
        <Text style={styles.createdDate}>Created: {formatDate(createDate)}</Text>
        {type && (
          <Text style={styles.createdDate}>Type: {getTypeText(type)}</Text>
        )}
        {validUntil && (
          <Text style={styles.createdDate}>Valid Until: {formatDate(validUntil)}</Text>
        )}
      </View>
    );
  };

  const getDepositStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'PENDING': return COLORS.WARNING;
      case 'HOLDING': return COLORS.SUCCESS;
      case 'APPLIED': return COLORS.PRIMARY;
      case 'EXPIRED': return COLORS.ERROR;
      default: return COLORS.TEXT.SECONDARY;
    }
  };

  const getDepositStatusText = (status) => {
    switch (status?.toUpperCase()) {
      case 'PENDING': return 'Pending';
      case 'HOLDING': return 'Holding';
      case 'APPLIED': return 'Applied';
      case 'EXPIRED': return 'Expired';
      default: return 'Unknown';
    }
  };

  const getVehicleImage = (vehicleImage) => {
    if (!vehicleImage) {
      return require('../../../assets/images/banner/banner-modely.png');
    }
    
    const imageMap = {
      'banner-modely.png': require('../../../assets/images/banner/banner-modely.png'),
      'banner-modelx.png': require('../../../assets/images/banner/Banner-modelx.png'),
      'banner-modelv.png': require('../../../assets/images/banner/banner-modelv.png'),
    };
    return imageMap[vehicleImage] || require('../../../assets/images/banner/banner-modely.png');
  };

  const renderVehicleInfo = () => {
    const quote = getQuotationData();
    
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
    
    // Handle both old structure (quote.vehicle) and new API structure (quote.motorbike)
    const vehicle = motorbikeDetails || quote.vehicle || quote.motorbike || {
      name: quote.vehicleModel || 'Unknown Model',
      model: quote.vehicleModel || 'Unknown Model',
      image: quote.vehicleImage || 'banner-modely.png',
      selectedColor: 'Black',
      price: quote.totalAmount || 0,
      specifications: {
        battery: '75 kWh',
        motor: 'Dual Motor AWD',
        weight: '2,000 kg',
        maxLoad: '500 kg',
        chargingTime: '8 hours',
        range: '500 km',
        acceleration: '4.8s'
      }
    };

    // Get color from new API structure
    const colorName = quote.color?.colorType || vehicle.selectedColor || 'Black';
    
    // Use currentVehicleImage if available, otherwise fallback
    const displayImage = currentVehicleImage || (typeof vehicle.image === 'string' ? getVehicleImage(vehicle.image) : vehicle.image);

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vehicle Information</Text>
        <View style={styles.vehicleCard}>
          <Image 
            source={displayImage} 
            style={styles.vehicleImage} 
          />
          <View style={styles.vehicleDetails}>
            <Text style={styles.vehicleName}>{vehicle.name || 'Unknown Model'}</Text>
            <Text style={styles.vehicleModel}>{vehicle.model || 'Unknown Model'}</Text>
            {(vehicle.makeFrom || vehicle.version) && (
              <View style={styles.specsRow}>
                {vehicle.makeFrom && <Text style={styles.specText}>Origin: {vehicle.makeFrom}</Text>}
                {vehicle.version && <Text style={styles.specText}>Version: {vehicle.version}</Text>}
              </View>
            )}
            <Text style={styles.selectedColor}>Color: {colorName}</Text>
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
          </View>
        </View>
      </View>
    );
  };

  const renderCustomerInfo = () => {
    const quote = getQuotationData();
    // Handle both old structure (quotation.customer) and new structure (direct properties)
    const customer = quote.customer || {
      name: quote.customerName || 'Customer',
      email: quote.customerEmail || 'N/A',
      phone: quote.customerPhone || 'N/A',
      address: quote.customerAddress || null,
      dob: null,
      credentialId: null
    };

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Customer Information</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Name:</Text>
            <Text style={styles.infoValue}>{customer.name || 'Customer'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{customer.email || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone:</Text>
            <Text style={styles.infoValue}>{customer.phone || 'N/A'}</Text>
          </View>
          {customer.credentialId && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>ID Number:</Text>
              <Text style={styles.infoValue}>{customer.credentialId}</Text>
            </View>
          )}
          {customer.dob && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Date of Birth:</Text>
              <Text style={styles.infoValue}>{formatDate(customer.dob)}</Text>
            </View>
          )}
          {customer.address && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Address:</Text>
              <Text style={styles.infoValue}>{customer.address}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };


  const renderPricing = () => {
    const quote = getQuotationData();
    
    // Use new API structure: basePrice, promotionPrice, finalPrice
    const basePrice = quote.basePrice || 0;
    const promotionPrice = quote.promotionPrice || 0;
    const finalPrice = quote.finalPrice || 0;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pricing</Text>
        <View style={styles.pricingContainer}>
          <View style={styles.pricingRow}>
            <Text style={styles.pricingLabel}>Base Price:</Text>
            <Text style={styles.pricingValue}>{formatPrice(basePrice)}</Text>
          </View>
          {promotionPrice > 0 && (
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Promotion Discount:</Text>
              <Text style={[styles.pricingValue, styles.discountText]}>-{formatPrice(promotionPrice)}</Text>
            </View>
          )}
          <View style={[styles.pricingRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>{formatPrice(finalPrice)}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderDeposit = () => {
    if (!depositInfo) {
      return null;
    }

    const quote = getQuotationData();

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Deposit</Text>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => {
              navigation.navigate('EditDeposit', {
                deposit: depositInfo,
                quotation: quote,
                onDepositUpdate: () => {
                  // Reload quotation detail to get updated deposit
                  loadQuotationDetail();
                },
              });
            }}
          >
            <Pencil size={18} color="#009DFF" />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.pricingContainer}>
          <View style={styles.pricingRow}>
            <Text style={styles.pricingLabel}>Deposit ID:</Text>
            <Text style={styles.pricingValue}>#{depositInfo.id}</Text>
          </View>
          <View style={styles.pricingRow}>
            <Text style={styles.pricingLabel}>Deposit Percent:</Text>
            <Text style={styles.pricingValue}>{depositInfo.depositPercent}%</Text>
          </View>
          <View style={styles.pricingRow}>
            <Text style={styles.pricingLabel}>Deposit Amount:</Text>
            <Text style={styles.pricingValue}>{formatPrice(depositInfo.depositAmount)}</Text>
          </View>
          <View style={styles.pricingRow}>
            <Text style={styles.pricingLabel}>Hold Days:</Text>
            <Text style={styles.pricingValue}>{formatDate(depositInfo.holdDays)}</Text>
          </View>
          <View style={[styles.pricingRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Status:</Text>
            <Text style={[styles.totalValue, { color: getDepositStatusColor(depositInfo.status) }]}>
              {getDepositStatusText(depositInfo.status)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderActionButtons = () => {
    const quote = getQuotationData();
    const type = quote.type?.toUpperCase();
    const status = quote.status?.toUpperCase();
    const isDraft = status === 'DRAFT';
    const depositStatus = depositInfo?.status?.toUpperCase();
    const isDepositHolding = depositStatus === 'HOLDING';
    const isDepositPending = depositStatus === 'PENDING';
    
    // Render buttons based on type
    const renderButtonsByType = () => {
      if (isDraft) {
        return null; // No buttons for draft status
      }

      // If deposit status is PENDING, don't show any buttons
      if (depositInfo && isDepositPending) {
        return null;
      }

      // If deposit status is HOLDING, show Create Customer Contract button
      if (depositInfo && isDepositHolding) {
        return (
          <TouchableOpacity
            style={styles.contractButton}
            onPress={handleContractView}
          >
            <Text style={styles.contractButtonText}>Create Customer Contract</Text>
          </TouchableOpacity>
        );
      }

      switch (type) {
        case 'AT_STORE':
          return (
            <>
              {!depositInfo && (
                <TouchableOpacity
                  style={styles.depositButton}
                  onPress={() => {
                    const quotationId = quote.id || quote.quotationId;
                    if (quotationId) {
                      navigation.navigate('CreateDeposit', { 
                        quotationId: quotationId.toString(),
                        quotation: quote, // Pass full quotation object for navigation back
                      });
                    } else {
                      Alert.alert('Error', 'Quotation ID not found');
                    }
                  }}
                >
                  <Text style={styles.depositButtonText}>Deposit</Text>
                </TouchableOpacity>
              )}
              {!depositInfo && (
                <TouchableOpacity
                  style={styles.fullPaymentButton}
                  onPress={() => Alert.alert('Full Payment', 'Full payment feature is under development')}
                >
                  <Text style={styles.fullPaymentButtonText}>Full Payment</Text>
                </TouchableOpacity>
              )}
            </>
          );
        
        case 'ORDER':
        case 'PRE_ORDER':
          return (
            !depositInfo && (
              <TouchableOpacity
                style={styles.depositButton}
                onPress={() => {
                  const quotationId = quote.id || quote.quotationId;
                  if (quotationId) {
                    navigation.navigate('CreateDeposit', { 
                      quotationId: quotationId.toString(),
                      quotation: quote, // Pass full quotation object for navigation back
                    });
                  } else {
                    Alert.alert('Error', 'Quotation ID not found');
                  }
                }}
              >
                <Text style={styles.depositButtonText}>Deposit</Text>
              </TouchableOpacity>
            )
          );
        
        default:
          return (
            <TouchableOpacity
              style={styles.printButton}
              onPress={handlePrint}
            >
              <Text style={styles.printButtonText}>Print Quotation</Text>
            </TouchableOpacity>
          );
      }
    };
    
    const buttons = renderButtonsByType();
    
    // If no buttons to show, don't render the action buttons container
    if (!buttons) {
      return null;
    }
    
    return (
      <View style={styles.actionButtons}>
        {buttons}
      </View>
    );
  };

  // Render Payment Type Selection Modal
  const renderPaymentTypeModal = () => {
    const calculateMonthlyPayment = (totalAmount, months, annualInterestRate = 6.0) => {
      const monthlyRate = annualInterestRate / 12 / 100;
      const monthlyPayment = (totalAmount / months) * (1 + monthlyRate * months / 2);
      return monthlyPayment;
    };

    const quote = getQuotationData();
    const totalAmount = quote.pricing?.totalPrice || quote.totalAmount || quote.finalPrice || 0;
    const monthlyPayment = calculateMonthlyPayment(totalAmount, installmentMonths);
    const totalPayable = monthlyPayment * installmentMonths;
    const interestAmount = totalPayable - totalAmount;

    const installmentOptions = [
      { months: 6, label: '6 months' },
      { months: 12, label: '12 months' },
      { months: 24, label: '24 months' },
      { months: 36, label: '36 months' },
    ];

    return (
      <Modal
        visible={showPaymentTypeModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPaymentTypeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.paymentTypeModalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Payment Method</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowPaymentTypeModal(false)}
              >
                <Text style={styles.closeIcon}>×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Full Payment Option */}
              <TouchableOpacity
                style={[
                  styles.paymentTypeCard,
                  selectedPaymentType === 'full' && styles.paymentTypeCardSelected,
                ]}
                onPress={() => handlePaymentTypeSelect('full')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={selectedPaymentType === 'full' ? COLORS.GRADIENT.BLUE : ['#FFFFFF', '#F8F9FA']}
                  style={styles.paymentTypeCardGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.paymentTypeHeader}>
                    <View style={styles.paymentTypeIconContainer}>
                      <Text style={styles.paymentTypeIcon}>💰</Text>
                    </View>
                    <View style={styles.paymentTypeTitleContainer}>
                      <Text style={[
                        styles.paymentTypeTitle,
                        selectedPaymentType === 'full' && styles.paymentTypeTitleSelected
                      ]}>
                        Full Payment
                      </Text>
                      <Text style={[
                        styles.paymentTypeSubtitle,
                        selectedPaymentType === 'full' && styles.paymentTypeSubtitleSelected
                      ]}>
                        One-time payment
                      </Text>
                    </View>
                    {selectedPaymentType === 'full' && (
                      <View style={styles.selectedBadge}>
                        <Text style={styles.selectedBadgeText}>✓</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.paymentTypeDetails}>
                    <View style={styles.paymentDetailRow}>
                      <Text style={[
                        styles.paymentDetailLabel,
                        selectedPaymentType === 'full' && styles.paymentDetailLabelSelected
                      ]}>
                        Total Payment:
                      </Text>
                      <Text style={[
                        styles.paymentDetailValue,
                        selectedPaymentType === 'full' && styles.paymentDetailValueSelected
                      ]}>
                        {formatPrice(totalAmount)}
                      </Text>
                    </View>
                    <View style={styles.paymentDetailRow}>
                      <Text style={[
                        styles.paymentDetailLabel,
                        selectedPaymentType === 'full' && styles.paymentDetailLabelSelected
                      ]}>
                        Interest Rate:
                      </Text>
                      <Text style={[
                        styles.paymentDetailValue,
                        selectedPaymentType === 'full' && styles.paymentDetailValueSelected
                      ]}>
                        0%
                      </Text>
                    </View>
                  </View>

                  <View style={[
                    styles.paymentTypeBenefits,
                    selectedPaymentType === 'full' && styles.paymentTypeBenefitsSelected
                  ]}>
                    <Text style={[
                      styles.benefitItem,
                      selectedPaymentType === 'full' && styles.benefitItemSelected
                    ]}>
                      ✓ No interest charges
                    </Text>
                    <Text style={[
                      styles.benefitItem,
                      selectedPaymentType === 'full' && styles.benefitItemSelected
                    ]}>
                      ✓ Receive vehicle immediately
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              {/* Installment Payment Option */}
              <TouchableOpacity
                style={[
                  styles.paymentTypeCard,
                  selectedPaymentType === 'installment' && styles.paymentTypeCardSelected,
                ]}
                onPress={() => setSelectedPaymentType('installment')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={selectedPaymentType === 'installment' ? COLORS.GRADIENT.PURPLE : ['#FFFFFF', '#F8F9FA']}
                  style={styles.paymentTypeCardGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.paymentTypeHeader}>
                    <View style={styles.paymentTypeIconContainer}>
                      <Text style={styles.paymentTypeIcon}>📅</Text>
                    </View>
                    <View style={styles.paymentTypeTitleContainer}>
                      <Text style={[
                        styles.paymentTypeTitle,
                        selectedPaymentType === 'installment' && styles.paymentTypeTitleSelected
                      ]}>
                        Installment
                      </Text>
                      <Text style={[
                        styles.paymentTypeSubtitle,
                        selectedPaymentType === 'installment' && styles.paymentTypeSubtitleSelected
                      ]}>
                        Monthly payment
                      </Text>
                    </View>
                    {selectedPaymentType === 'installment' && (
                      <View style={styles.selectedBadge}>
                        <Text style={styles.selectedBadgeText}>✓</Text>
                      </View>
                    )}
                  </View>

                  {/* Installment Month Selection */}
                  {selectedPaymentType === 'installment' && (
                    <View style={styles.installmentMonthsContainer}>
                      <Text style={styles.installmentMonthsLabel}>Select Term:</Text>
                      <View style={styles.installmentMonthsOptions}>
                        {installmentOptions.map((option) => (
                          <TouchableOpacity
                            key={option.months}
                            style={[
                              styles.monthOption,
                              installmentMonths === option.months && styles.monthOptionSelected
                            ]}
                            onPress={() => setInstallmentMonths(option.months)}
                          >
                            <Text style={[
                              styles.monthOptionText,
                              installmentMonths === option.months && styles.monthOptionTextSelected
                            ]}>
                              {option.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}

                  <View style={styles.paymentTypeDetails}>
                    <View style={styles.paymentDetailRow}>
                      <Text style={[
                        styles.paymentDetailLabel,
                        selectedPaymentType === 'installment' && styles.paymentDetailLabelSelected
                      ]}>
                        Monthly Payment:
                      </Text>
                      <Text style={[
                        styles.paymentDetailValueHighlight,
                        selectedPaymentType === 'installment' && styles.paymentDetailValueSelected
                      ]}>
                        {formatPrice(monthlyPayment)}
                      </Text>
                    </View>
                    <View style={styles.paymentDetailRow}>
                      <Text style={[
                        styles.paymentDetailLabel,
                        selectedPaymentType === 'installment' && styles.paymentDetailLabelSelected
                      ]}>
                        Total Payment:
                      </Text>
                      <Text style={[
                        styles.paymentDetailValue,
                        selectedPaymentType === 'installment' && styles.paymentDetailValueSelected
                      ]}>
                        {formatPrice(totalPayable)}
                      </Text>
                    </View>
                    <View style={styles.paymentDetailRow}>
                      <Text style={[
                        styles.paymentDetailLabel,
                        selectedPaymentType === 'installment' && styles.paymentDetailLabelSelected
                      ]}>
                        Interest Rate:
                      </Text>
                      <Text style={[
                        styles.paymentDetailValue,
                        selectedPaymentType === 'installment' && styles.paymentDetailValueSelected
                      ]}>
                        6.0%/year (~{formatPrice(interestAmount)})
                      </Text>
                    </View>
                  </View>

                  <View style={[
                    styles.paymentTypeBenefits,
                    selectedPaymentType === 'installment' && styles.paymentTypeBenefitsSelected
                  ]}>
                    <Text style={[
                      styles.benefitItem,
                      selectedPaymentType === 'installment' && styles.benefitItemSelected
                    ]}>
                      ✓ Flexible monthly payments
                    </Text>
                    <Text style={[
                      styles.benefitItem,
                      selectedPaymentType === 'installment' && styles.benefitItemSelected
                    ]}>
                      ✓ Receive vehicle now, pay gradually
                    </Text>
                  </View>

                  {selectedPaymentType === 'installment' && (
                    <TouchableOpacity
                      style={styles.confirmInstallmentButton}
                      onPress={() => handlePaymentTypeSelect('installment')}
                    >
                      <LinearGradient
                        colors={COLORS.GRADIENT.BLUE}
                        style={styles.confirmInstallmentButtonGradient}
                      >
                        <Text style={styles.confirmInstallmentButtonText}>
                          Confirm {installmentMonths} Month Installment
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  // Render Payment Modal
  const renderPaymentModal = () => (
    <Modal
      visible={showPaymentModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowPaymentModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.paymentModalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Payment</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowPaymentModal(false)}
            >
              <Text style={styles.closeIcon}>×</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalBody}>
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentLabel}>Amount to Pay:</Text>
              <Text style={styles.paymentAmount}>
                {(() => {
                  const quote = getQuotationData();
                  return formatPaymentAmount(quote.pricing?.totalPrice || quote.totalAmount || quote.finalPrice || 0);
                })()}
              </Text>
            </View>
            
            <View style={styles.qrSection}>
              <Text style={styles.qrTitle}>Scan QR Code to Pay</Text>
              <View style={styles.qrContainer}>
                <View style={styles.qrPlaceholder}>
                  <Text style={styles.qrIcon}>📱</Text>
                  <Text style={styles.qrText}>QR Code</Text>
                  <Text style={styles.qrData}>{generateQRCode()}</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.paymentInstructions}>
              <Text style={styles.instructionsTitle}>Payment Instructions:</Text>
              {getPaymentInstructions('vnpay').map((instruction, index) => (
                <Text key={index} style={styles.instructionText}>
                  {index + 1}. {instruction}
                </Text>
              ))}
            </View>
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowPaymentModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmButton, paymentLoading && styles.disabledButton]}
              onPress={processPayment}
              disabled={paymentLoading}
            >
              {paymentLoading ? (
                <ActivityIndicator color="#009DFF" />
              ) : (
                <Text style={styles.confirmButtonText}>Confirm Payment</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );


  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#009DFF" />
          <Text style={styles.loadingText}>Loading quotation details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderQuotationInfo()}
        {renderVehicleInfo()}
        {renderCustomerInfo()}
        {renderPricing()}
        {renderDeposit()}
      </ScrollView>
      {renderActionButtons()}
      
      {/* Payment Type Selection Modal */}
      {renderPaymentTypeModal()}
      
      {/* Payment Modal */}
      {renderPaymentModal()}
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.PADDING.SMALL,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.PADDING.SMALL,
    paddingVertical: SIZES.PADDING.XSMALL,
    borderRadius: SIZES.RADIUS.SMALL,
    backgroundColor: COLORS.BACKGROUND.SECONDARY,
    borderWidth: 1,
    borderColor: "#009DFF",
  },
  editButtonText: {
    fontSize: SIZES.FONT.SMALL,
    color: "#009DFF",
    fontWeight: '600',
    marginLeft: 4,
  },
  quotationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.PADDING.SMALL,
  },
  quotationId: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: "#009DFF",
  },
  quoteCode: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: SIZES.PADDING.SMALL,
    paddingVertical: 4,
    borderRadius: SIZES.RADIUS.SMALL,
  },
  statusText: {
    fontSize: SIZES.FONT.SMALL,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
  createdDate: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.WHITE,
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
    marginBottom: 4,
  },
  selectedColor: {
    fontSize: SIZES.FONT.SMALL,
    color: "#009DFF",
    fontWeight: '600',
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
  infoCard: {
    backgroundColor: COLORS.BACKGROUND.SECONDARY,
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SIZES.PADDING.SMALL,
  },
  infoLabel: {
    fontSize: SIZES.FONT.SMALL,
    fontWeight: '600',
    color: COLORS.TEXT.WHITE,
    flex: 1,
  },
  infoValue: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.WHITE,
    flex: 2,
    textAlign: 'right',
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
  totalRow: {
    borderBottomWidth: 0,
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
    color: "#009DFF",
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.MEDIUM,
    backgroundColor: COLORS.BACKGROUND.SECONDARY,
  },
  shareButton: {
    flex: 1,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingVertical: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
    marginRight: SIZES.PADDING.SMALL,
  },
  shareButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
  printButton: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY,
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingVertical: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
    marginLeft: SIZES.PADDING.SMALL,
  },
  printButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
  },
  paymentButton: {
    flex: 1,
    backgroundColor: COLORS.SUCCESS,
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingVertical: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
    marginLeft: SIZES.PADDING.SMALL,
  },
  paymentButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
  contractButton: {
    flex: 1,
    backgroundColor: "#009DFF",
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingVertical: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
    marginLeft: SIZES.PADDING.SMALL,
  },
  contractButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
  depositButton: {
    flex: 1,
    backgroundColor: "#009DFF",
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingVertical: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
    marginRight: SIZES.PADDING.SMALL,
  },
  depositButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
  fullPaymentButton: {
    flex: 1,
    backgroundColor: COLORS.SUCCESS,
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingVertical: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
    marginLeft: SIZES.PADDING.SMALL,
  },
  fullPaymentButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  paymentModalContent: {
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
    borderTopLeftRadius: SIZES.RADIUS.LARGE,
    borderTopRightRadius: SIZES.RADIUS.LARGE,
    maxHeight: '80%',
    paddingBottom: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.PADDING.LARGE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER.PRIMARY,
  },
  modalTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.BACKGROUND.SECONDARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    fontSize: SIZES.FONT.LARGE,
    color: COLORS.TEXT.WHITE,
  },
  modalBody: {
    padding: SIZES.PADDING.LARGE,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: SIZES.PADDING.LARGE,
    paddingBottom: SIZES.PADDING.XXXLARGE,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER.PRIMARY,
  },
  
  // Payment Type Selection Modal Styles
  paymentTypeModalContent: {
    backgroundColor: COLORS.SURFACE,
    borderTopLeftRadius: SIZES.RADIUS.XXLARGE,
    borderTopRightRadius: SIZES.RADIUS.XXLARGE,
    maxHeight: '90%',
    paddingBottom: 0,
  },
  paymentTypeCard: {
    marginBottom: SIZES.PADDING.LARGE,
    borderRadius: SIZES.RADIUS.LARGE,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  paymentTypeCardSelected: {
    borderWidth: 2,
    borderColor: COLORS.PRIMARY,
  },
  paymentTypeCardGradient: {
    padding: SIZES.PADDING.LARGE,
    borderRadius: SIZES.RADIUS.LARGE,
  },
  paymentTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  paymentTypeIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.PADDING.MEDIUM,
  },
  paymentTypeIcon: {
    fontSize: 32,
  },
  paymentTypeTitleContainer: {
    flex: 1,
  },
  paymentTypeTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: 4,
  },
  paymentTypeTitleSelected: {
    color: COLORS.TEXT.WHITE,
  },
  paymentTypeSubtitle: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
  },
  paymentTypeSubtitleSelected: {
    color: COLORS.TEXT.WHITE,
    opacity: 0.9,
  },
  selectedBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.SUCCESS,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedBadgeText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.WHITE,
    fontWeight: 'bold',
  },
  paymentTypeDetails: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  paymentDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.PADDING.SMALL,
  },
  paymentDetailLabel: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    fontWeight: '500',
  },
  paymentDetailLabelSelected: {
    color: COLORS.TEXT.WHITE,
    opacity: 0.9,
  },
  paymentDetailValue: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '600',
  },
  paymentDetailValueSelected: {
    color: COLORS.TEXT.WHITE,
  },
  paymentDetailValueHighlight: {
    fontSize: SIZES.FONT.LARGE,
    color: COLORS.PRIMARY,
    fontWeight: 'bold',
  },
  paymentTypeBenefits: {
    marginTop: SIZES.PADDING.SMALL,
  },
  paymentTypeBenefitsSelected: {
    opacity: 1,
  },
  benefitItem: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: SIZES.PADDING.XSMALL,
  },
  benefitItemSelected: {
    color: COLORS.TEXT.WHITE,
    opacity: 0.9,
  },
  
  // Installment Month Selection Styles
  installmentMonthsContainer: {
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  installmentMonthsLabel: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
    marginBottom: SIZES.PADDING.SMALL,
    opacity: 0.9,
  },
  installmentMonthsOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.PADDING.SMALL,
  },
  monthOption: {
    flex: 1,
    minWidth: '22%',
    paddingVertical: SIZES.PADDING.SMALL,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    borderRadius: SIZES.RADIUS.MEDIUM,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  monthOptionSelected: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.TEXT.WHITE,
  },
  monthOptionText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
    opacity: 0.8,
  },
  monthOptionTextSelected: {
    opacity: 1,
    fontWeight: 'bold',
  },
  confirmInstallmentButton: {
    marginTop: SIZES.PADDING.MEDIUM,
    borderRadius: SIZES.RADIUS.MEDIUM,
    overflow: 'hidden',
  },
  confirmInstallmentButtonGradient: {
    paddingVertical: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
  },
  confirmInstallmentButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.WHITE,
    fontWeight: 'bold',
  },
  
  // Payment modal styles
  paymentInfo: {
    backgroundColor: COLORS.BACKGROUND.SECONDARY,
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.LARGE,
    alignItems: 'center',
    marginBottom: SIZES.PADDING.LARGE,
  },
  paymentLabel: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.WHITE,
    marginBottom: SIZES.PADDING.SMALL,
  },
  paymentAmount: {
    fontSize: SIZES.FONT.XLARGE,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
  },
  qrSection: {
    alignItems: 'center',
    marginBottom: SIZES.PADDING.LARGE,
  },
  qrTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  qrContainer: {
    backgroundColor: COLORS.BACKGROUND.SECONDARY,
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.LARGE,
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: COLORS.TEXT.WHITE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.PRIMARY,
    borderStyle: 'dashed',
  },
  qrIcon: {
    fontSize: 48,
    marginBottom: SIZES.PADDING.SMALL,
  },
  qrText: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginBottom: SIZES.PADDING.XSMALL,
  },
  qrData: {
    fontSize: SIZES.FONT.XSMALL,
    color: COLORS.TEXT.SECONDARY,
    textAlign: 'center',
  },
  paymentInstructions: {
    backgroundColor: COLORS.BACKGROUND.SECONDARY,
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.LARGE,
  },
  instructionsTitle: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  instructionText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.WHITE,
    marginBottom: SIZES.PADDING.SMALL,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: SIZES.PADDING.MEDIUM,
    marginRight: SIZES.PADDING.SMALL,
    borderRadius: SIZES.RADIUS.MEDIUM,
    borderWidth: 1,
    borderColor: COLORS.BORDER.PRIMARY,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    marginLeft: SIZES.PADDING.SMALL,
    borderRadius: SIZES.RADIUS.MEDIUM,
    backgroundColor: COLORS.SUCCESS,
    paddingVertical: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.WHITE,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SIZES.PADDING.MEDIUM,
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.WHITE,
  },
});

export default QuotationDetailScreen;
