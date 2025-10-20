import React, { useState } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES } from '../../constants';
import usePayment from '../../hooks/usePayment';
import { formatPaymentAmount, getPaymentInstructions } from '../../utils/paymentUtils';
import installmentStorageService from '../../services/storage/installmentStorageService';

const QuotationDetailScreen = ({ navigation, route }) => {
  const { quotation, onQuotationUpdate } = route.params;
  
  // Local state for modals
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPaymentTypeModal, setShowPaymentTypeModal] = useState(false);
  const [selectedPaymentType, setSelectedPaymentType] = useState(null);
  const [installmentMonths, setInstallmentMonths] = useState(12);
  const [paymentData, setPaymentData] = useState(null);

  // Payment hook
  const { 
    loading: paymentLoading, 
    error: paymentError, 
    createPayment, 
    processPaymentCompletion 
  } = usePayment();

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleShare = async () => {
    try {
      const vehicle = quotation.vehicle || {
        name: quotation.vehicleModel || 'Model không xác định',
        selectedColor: 'Đen'
      };
      const pricing = quotation.pricing || { totalPrice: quotation.totalAmount || 0 };
      
      const message = `Báo giá ${quotation.id || 'N/A'}\n\nXe: ${vehicle.name}\nMàu: ${vehicle.selectedColor}\nTổng tiền: ${formatPrice(pricing.totalPrice)}`;
      
      await Share.share({
        message,
        title: `Báo giá ${quotation.id || 'N/A'}`,
      });
    } catch (error) {
      console.error('Error sharing quotation:', error);
    }
  };

  const handlePrint = () => {
    Alert.alert('In báo giá', 'Tính năng in báo giá sẽ được triển khai');
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
      const payment = await createPayment({
        ...quotation,
        paymentType,
        installmentMonths: paymentType === 'installment' ? installmentMonths : null,
      });
      setPaymentData(payment);
      setShowPaymentModal(true);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tạo thanh toán. Vui lòng thử lại.');
    }
  };

  const handleContractView = () => {
    navigation.navigate('Contract', { quotation });
  };

  const processPayment = async () => {
    try {
      await processPaymentCompletion(quotation.id, {
        paymentType: selectedPaymentType,
        installmentMonths: selectedPaymentType === 'installment' ? installmentMonths : null,
      });
      
      setShowPaymentModal(false);
      setPaymentData(null);
      
      // Update quotation status to paid and payment type
      quotation.status = 'paid';
      quotation.paymentType = selectedPaymentType;
      if (selectedPaymentType === 'installment') {
        quotation.installmentMonths = installmentMonths;
      }
      
      // Create installment plan if payment type is installment
      if (selectedPaymentType === 'installment') {
        try {
          const installment = await installmentStorageService.createInstallment({
            quotationId: quotation.id,
            customerId: quotation.customerId || `C${Date.now()}`,
            customerName: quotation.customerName,
            customerPhone: quotation.customerPhone,
            vehicleModel: quotation.vehicleModel || quotation.vehicle?.name,
            totalAmount: quotation.pricing?.totalPrice || quotation.totalAmount,
            installmentMonths: installmentMonths,
            interestRate: 6.0,
            startDate: new Date().toISOString(),
            createdBy: 'Dealer Staff',
            dealerId: quotation.dealerId || 'dealer001',
          });
          
          console.log('✅ Installment plan created:', installment.id);
          
          // Save installment ID to quotation
          quotation.installmentId = installment.id;
        } catch (installmentError) {
          console.error('Error creating installment plan:', installmentError);
          // Don't fail the payment if installment creation fails
        }
      }
      
      // Notify parent screen about the update
      if (onQuotationUpdate) {
        onQuotationUpdate(quotation);
      }
      
      const paymentMessage = selectedPaymentType === 'installment'
        ? `Báo giá đã được thanh toán thành công!\n\n✅ Kế hoạch trả góp ${installmentMonths} tháng đã được tạo\n✅ Khách hàng đã được thêm vào danh sách\n\n📅 Xem chi tiết trả góp tại màn hình "Quản lý trả góp"`
        : 'Báo giá đã được thanh toán thành công!\n\nKhách hàng đã được tự động thêm vào danh sách khách hàng đã mua xe.';
      
      Alert.alert(
        'Thanh toán thành công',
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
      Alert.alert('Lỗi', 'Không thể xử lý thanh toán. Vui lòng thử lại.');
    }
  };

  const generateQRCode = () => {
    if (paymentData && paymentData.qrCode) {
      return paymentData.qrCode;
    }
    
    // Fallback for demo
    const fallbackData = {
      quotationId: quotation.id,
      amount: quotation.pricing?.totalPrice || quotation.totalAmount || 0,
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
        <Text style={styles.backButtonText}>←</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Chi Tiết Báo Giá</Text>
      <View style={styles.placeholder} />
    </View>
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return COLORS.WARNING;
      case 'approved': return COLORS.SUCCESS;
      case 'rejected': return COLORS.ERROR;
      case 'expired': return COLORS.TEXT.SECONDARY;
      default: return COLORS.TEXT.SECONDARY;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Chờ thanh toán';
      case 'paid': return 'Đã thanh toán';
      case 'rejected': return 'Từ chối';
      case 'expired': return 'Hết hạn';
      default: return 'Không xác định';
    }
  };

  const renderQuotationInfo = () => (
    <View style={styles.section}>
      <View style={styles.quotationHeader}>
        <Text style={styles.quotationId}>Báo giá: {quotation.id || 'N/A'}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(quotation.status) }]}>
          <Text style={styles.statusText}>{getStatusText(quotation.status)}</Text>
        </View>
      </View>
      <Text style={styles.createdDate}>Ngày tạo: {formatDate(quotation.createdAt)}</Text>
    </View>
  );

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
    // Handle both old structure (quotation.vehicle) and new structure (direct properties)
    const vehicle = quotation.vehicle || {
      name: quotation.vehicleModel || 'Model không xác định',
      model: quotation.vehicleModel || 'Model không xác định',
      image: quotation.vehicleImage || 'banner-modely.png',
      selectedColor: 'Đen',
      price: quotation.totalAmount || 0,
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

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thông Tin Xe</Text>
        <View style={styles.vehicleCard}>
          <Image 
            source={typeof vehicle.image === 'string' ? getVehicleImage(vehicle.image) : vehicle.image} 
            style={styles.vehicleImage} 
          />
          <View style={styles.vehicleDetails}>
            <Text style={styles.vehicleName}>{vehicle.name || 'Model không xác định'}</Text>
            <Text style={styles.vehicleModel}>{vehicle.model || 'Model không xác định'}</Text>
            <Text style={styles.selectedColor}>Màu: {vehicle.selectedColor || 'Đen'}</Text>
            <View style={styles.specsRow}>
              <Text style={styles.specText}>Battery: {vehicle.specifications?.battery || '75 kWh'}</Text>
              <Text style={styles.specText}>Motor: {vehicle.specifications?.motor || 'Dual Motor AWD'}</Text>
            </View>
            <View style={styles.specsRow}>
              <Text style={styles.specText}>Weight: {vehicle.specifications?.weight || '2,000 kg'}</Text>
              <Text style={styles.specText}>Max Load: {vehicle.specifications?.maxLoad || '500 kg'}</Text>
            </View>
            <View style={styles.specsRow}>
              <Text style={styles.specText}>Charging: {vehicle.specifications?.chargingTime || '8 hours'}</Text>
              <Text style={styles.specText}>Price: {formatPrice(vehicle.price || 0)}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderCustomerInfo = () => {
    // Handle both old structure (quotation.customer) and new structure (direct properties)
    const customer = quotation.customer || {
      name: quotation.customerName || 'Khách hàng',
      email: quotation.customerEmail || 'N/A',
      phone: quotation.customerPhone || 'N/A',
      address: quotation.customerAddress || null
    };

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thông Tin Khách Hàng</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tên:</Text>
            <Text style={styles.infoValue}>{customer.name || 'Khách hàng'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{customer.email || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Điện thoại:</Text>
            <Text style={styles.infoValue}>{customer.phone || 'N/A'}</Text>
          </View>
          {customer.address && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Địa chỉ:</Text>
              <Text style={styles.infoValue}>{customer.address}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };


  const renderPricing = () => {
    const pricing = quotation.pricing || {
      basePrice: quotation.totalAmount || 0,
      colorPrice: 0,
      promotionDiscount: 0,
      totalPrice: quotation.totalAmount || 0
    };

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bảng Giá</Text>
        <View style={styles.pricingContainer}>
          <View style={styles.pricingRow}>
            <Text style={styles.pricingLabel}>Giá cơ bản:</Text>
            <Text style={styles.pricingValue}>{formatPrice(pricing.basePrice || 0)}</Text>
          </View>
          {(pricing.promotionDiscount || 0) > 0 && (
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Giảm giá khuyến mãi:</Text>
              <Text style={[styles.pricingValue, styles.discountText]}>-{formatPrice(pricing.promotionDiscount || 0)}</Text>
            </View>
          )}
          <View style={[styles.pricingRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Tổng cộng:</Text>
            <Text style={styles.totalValue}>{formatPrice(pricing.totalPrice || 0)}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderActionButtons = () => {
    const isPending = quotation.status === 'pending';
    const isPaid = quotation.status === 'paid';
    
    return (
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShare}
        >
          <Text style={styles.shareButtonText}>Chia Sẻ</Text>
        </TouchableOpacity>
        
        {isPending && (
          <TouchableOpacity
            style={styles.paymentButton}
            onPress={handlePayment}
          >
            <Text style={styles.paymentButtonText}>Thanh Toán</Text>
          </TouchableOpacity>
        )}
        
        {isPaid && (
          <TouchableOpacity
            style={styles.contractButton}
            onPress={handleContractView}
          >
            <Text style={styles.contractButtonText}>Xem Hợp Đồng</Text>
          </TouchableOpacity>
        )}
        
        {!isPending && !isPaid && (
          <TouchableOpacity
            style={styles.printButton}
            onPress={handlePrint}
          >
            <Text style={styles.printButtonText}>In Báo Giá</Text>
          </TouchableOpacity>
        )}
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

    const totalAmount = quotation.pricing?.totalPrice || quotation.totalAmount || 0;
    const monthlyPayment = calculateMonthlyPayment(totalAmount, installmentMonths);
    const totalPayable = monthlyPayment * installmentMonths;
    const interestAmount = totalPayable - totalAmount;

    const installmentOptions = [
      { months: 6, label: '6 tháng' },
      { months: 12, label: '12 tháng' },
      { months: 24, label: '24 tháng' },
      { months: 36, label: '36 tháng' },
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
              <Text style={styles.modalTitle}>Chọn hình thức thanh toán</Text>
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
                        Trả full
                      </Text>
                      <Text style={[
                        styles.paymentTypeSubtitle,
                        selectedPaymentType === 'full' && styles.paymentTypeSubtitleSelected
                      ]}>
                        Thanh toán một lần
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
                        Tổng thanh toán:
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
                        Lãi suất:
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
                      ✓ Không phát sinh lãi suất
                    </Text>
                    <Text style={[
                      styles.benefitItem,
                      selectedPaymentType === 'full' && styles.benefitItemSelected
                    ]}>
                      ✓ Nhận xe ngay lập tức
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
                        Trả góp
                      </Text>
                      <Text style={[
                        styles.paymentTypeSubtitle,
                        selectedPaymentType === 'installment' && styles.paymentTypeSubtitleSelected
                      ]}>
                        Thanh toán theo tháng
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
                      <Text style={styles.installmentMonthsLabel}>Chọn kỳ hạn:</Text>
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
                        Trả hàng tháng:
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
                        Tổng thanh toán:
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
                        Lãi suất:
                      </Text>
                      <Text style={[
                        styles.paymentDetailValue,
                        selectedPaymentType === 'installment' && styles.paymentDetailValueSelected
                      ]}>
                        6.0%/năm (~{formatPrice(interestAmount)})
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
                      ✓ Thanh toán linh hoạt theo tháng
                    </Text>
                    <Text style={[
                      styles.benefitItem,
                      selectedPaymentType === 'installment' && styles.benefitItemSelected
                    ]}>
                      ✓ Nhận xe ngay, trả dần
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
                          Xác nhận trả góp {installmentMonths} tháng
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
            <Text style={styles.modalTitle}>Thanh Toán</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowPaymentModal(false)}
            >
              <Text style={styles.closeIcon}>×</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalBody}>
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentLabel}>Số tiền cần thanh toán:</Text>
              <Text style={styles.paymentAmount}>
                {formatPaymentAmount(quotation.pricing?.totalPrice || quotation.totalAmount || 0)}
              </Text>
            </View>
            
            <View style={styles.qrSection}>
              <Text style={styles.qrTitle}>Quét mã QR để thanh toán</Text>
              <View style={styles.qrContainer}>
                <View style={styles.qrPlaceholder}>
                  <Text style={styles.qrIcon}>📱</Text>
                  <Text style={styles.qrText}>QR Code</Text>
                  <Text style={styles.qrData}>{generateQRCode()}</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.paymentInstructions}>
              <Text style={styles.instructionsTitle}>Hướng dẫn thanh toán:</Text>
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
              <Text style={styles.cancelButtonText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmButton, paymentLoading && styles.disabledButton]}
              onPress={processPayment}
              disabled={paymentLoading}
            >
              {paymentLoading ? (
                <ActivityIndicator color={COLORS.TEXT.WHITE} />
              ) : (
                <Text style={styles.confirmButtonText}>Xác nhận thanh toán</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );


  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderQuotationInfo()}
        {renderVehicleInfo()}
        {renderCustomerInfo()}
        {renderPricing()}
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
  quotationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.PADDING.SMALL,
  },
  quotationId: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
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
    color: COLORS.PRIMARY,
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
    color: COLORS.PRIMARY,
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
    backgroundColor: COLORS.PRIMARY,
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
});

export default QuotationDetailScreen;
