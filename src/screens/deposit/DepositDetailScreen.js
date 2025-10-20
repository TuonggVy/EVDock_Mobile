import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES } from '../../constants';
import depositStorageService from '../../services/storage/depositStorageService';
import { useAuth } from '../../contexts/AuthContext';
import { USER_ROLES } from '../../constants/roles';
import depositPaymentService from '../../services/depositPaymentService';

const DepositDetailScreen = ({ navigation, route }) => {
  const { deposit: initialDeposit, onDepositUpdate } = route.params;
  const { user } = useAuth();
  const [deposit, setDeposit] = useState(initialDeposit);
  const [showPaymentTypeModal, setShowPaymentTypeModal] = useState(false);
  const [showQRPaymentModal, setShowQRPaymentModal] = useState(false);
  const [selectedPaymentType, setSelectedPaymentType] = useState(null);
  const [installmentMonths, setInstallmentMonths] = useState(12);
  const [processingPayment, setProcessingPayment] = useState(false);

  const userRole = user?.role;
  const isDealerStaff = userRole === USER_ROLES.DEALER_STAFF;
  const isDealerManager = userRole === USER_ROLES.DEALER_MANAGER;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return COLORS.WARNING;
      case 'confirmed': return COLORS.SUCCESS;
      case 'completed': return COLORS.TEXT.SECONDARY;
      case 'cancelled': return COLORS.ERROR;
      default: return COLORS.TEXT.SECONDARY;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Chờ xác nhận';
      case 'confirmed': return 'Đã xác nhận';
      case 'completed': return 'Hoàn thành';
      case 'cancelled': return 'Đã hủy';
      default: return 'Unknown';
    }
  };

  // Dealer Manager actions for pre-order lifecycle
  const handleManagerPlaceManufacturerOrder = async () => {
    Alert.alert(
      'Đặt xe từ hãng',
      `Tạo đơn hãng cho pre-order #${deposit.id}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: async () => {
            try {
              const updated = await depositStorageService.managerPlaceManufacturerOrder(deposit.id, {
                estimatedArrival: deposit.estimatedArrival,
                orderedBy: user?.name || 'Dealer Manager',
              });
              setDeposit(updated);
              onDepositUpdate && onDepositUpdate(updated);
              Alert.alert('Thành công', 'Đã đặt xe từ hãng.');
            } catch (e) {
              console.error('Error placing manufacturer order:', e);
              Alert.alert('Lỗi', 'Không thể đặt xe từ hãng.');
            }
          }
        }
      ]
    );
  };

  const handleManagerMarkVehicleArrived = async () => {
    Alert.alert(
      'Đánh dấu xe đã về',
      'Chỉ xác nhận khi EVM Staff đã giao thành công.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: async () => {
            try {
              const updated = await depositStorageService.managerMarkVehicleArrived(deposit.id, {
                markedBy: user?.name || 'Dealer Manager',
              });
              setDeposit(updated);
              onDepositUpdate && onDepositUpdate(updated);
              Alert.alert('Thành công', 'Đã đánh dấu xe đã về.');
            } catch (e) {
              console.error('Error marking arrived:', e);
              Alert.alert('Lỗi', 'Không thể đánh dấu xe đã về.');
            }
          }
        }
      ]
    );
  };

  const handleManagerNotifyStaff = async () => {
    Alert.alert(
      'Thông báo cho Dealer Staff',
      'Gửi thông báo đã có xe để Dealer Staff tiếp tục xử lý?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Gửi',
          onPress: async () => {
            try {
              const updated = await depositStorageService.managerNotifyStaffVehicleReady(deposit.id, {
                notifiedBy: user?.name || 'Dealer Manager',
              });
              setDeposit(updated);
              onDepositUpdate && onDepositUpdate(updated);
              Alert.alert('Đã gửi', 'Đã thông báo cho Dealer Staff.');
            } catch (e) {
              console.error('Error notifying staff:', e);
              Alert.alert('Lỗi', 'Không thể gửi thông báo.');
            }
          }
        }
      ]
    );
  };

  const handleConfirmDeposit = async () => {
    Alert.alert(
      'Xác nhận đặt cọc',
      `Xác nhận đặt cọc cho khách hàng ${deposit.customerName}?\n\nSố tiền đặt cọc: ${formatCurrency(deposit.depositAmount)}`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: async () => {
            try {
              // Update status in storage
              await depositStorageService.updateDeposit(deposit.id, {
                status: 'confirmed',
                confirmedAt: new Date().toISOString(),
                confirmedBy: 'Dealer Staff',
              });
              
              // Update local state
              const updatedDeposit = { 
                ...deposit, 
                status: 'confirmed',
                confirmedAt: new Date().toISOString(),
              };
              setDeposit(updatedDeposit);
              
              console.log('✅ Deposit confirmed:', deposit.id);
              
              // Call callback to parent screen
              if (onDepositUpdate) {
                onDepositUpdate(updatedDeposit);
              }
              
              Alert.alert(
                'Thành công', 
                'Đã xác nhận đặt cọc!\n\nTrạng thái đã chuyển sang "Đã xác nhận".',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      // Navigate back to management screen
                      // It will auto-refresh and switch to 'confirmed' filter
                      navigation.goBack();
                    }
                  }
                ]
              );
            } catch (error) {
              console.error('Error confirming deposit:', error);
              Alert.alert('Lỗi', 'Không thể xác nhận đặt cọc. Vui lòng thử lại.');
            }
          }
        }
      ]
    );
  };

  const handleFinalPayment = () => {
    setShowPaymentTypeModal(true);
  };

  const handlePaymentTypeSelect = (paymentType) => {
    if (paymentType === 'full') {
      // Direct to QR payment for full payment
      setSelectedPaymentType('full');
      setShowPaymentTypeModal(false);
      setTimeout(() => setShowQRPaymentModal(true), 300);
    }
    // For installment, just select it (user will click confirm button)
  };

  const handleConfirmInstallmentPayment = () => {
    setShowPaymentTypeModal(false);
    setTimeout(() => setShowQRPaymentModal(true), 300);
  };

  const processDepositPayment = async () => {
    try {
      setProcessingPayment(true);

      // Simulate payment processing (2 seconds)
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (selectedPaymentType === 'full') {
        // Full payment flow - Use service
        const result = await depositPaymentService.processFullPayment(deposit);
        
        setProcessingPayment(false);
        setShowQRPaymentModal(false);

        Alert.alert(
          'Thanh toán thành công',
          `✅ Đã thanh toán full!\n\n📋 Báo giá ${result.quotation.id} đã được tạo\n👤 Khách hàng đã được thêm vào danh sách\n\n➡️ Xem tại màn hình "Sales" và "Customers"`,
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        );
      } else if (selectedPaymentType === 'installment') {
        // Installment payment flow - Use service
        const result = await depositPaymentService.processInstallmentPayment(deposit, installmentMonths);
        
        setProcessingPayment(false);
        setShowQRPaymentModal(false);

        Alert.alert(
          'Thanh toán thành công',
          `✅ Kế hoạch trả góp ${installmentMonths} tháng đã được tạo!\n\n📅 Mã trả góp: ${result.installment.id}\n💰 Trả hàng tháng: ${formatCurrency(result.installment.monthlyPayment)}\n\n➡️ Xem tại màn hình "Quản lý trả góp"`,
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      Alert.alert('Lỗi', error.message || 'Không thể xử lý thanh toán. Vui lòng thử lại.');
      setProcessingPayment(false);
    }
  };

  const handleStaffAcknowledgeNotification = async () => {
    try {
      const updated = await depositStorageService.staffAcknowledgeNotification(deposit.id, {
        acknowledgedBy: user?.name || 'Dealer Staff',
      });
      setDeposit(updated);
      onDepositUpdate && onDepositUpdate(updated);
      Alert.alert('Đã xác nhận', 'Bạn đã xác nhận đã nhận thông báo có xe.');
    } catch (e) {
      console.error('Error acknowledging:', e);
      Alert.alert('Lỗi', 'Không thể xác nhận.');
    }
  };

  const calculateMonthlyPayment = (totalAmount, months, annualInterestRate = 6.0) => {
    const monthlyRate = annualInterestRate / 12 / 100;
    const monthlyPayment = (totalAmount / months) * (1 + monthlyRate * months / 2);
    return monthlyPayment;
  };

  const renderPaymentTypeModal = () => {
    const monthlyPayment = calculateMonthlyPayment(deposit.remainingAmount, installmentMonths);
    const totalPayable = monthlyPayment * installmentMonths;
    const interestAmount = totalPayable - deposit.remainingAmount;

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
                style={styles.paymentTypeCard}
                onPress={() => handlePaymentTypeSelect('full')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={selectedPaymentType === 'full' ? COLORS.GRADIENT.BLUE : ['#FFFFFF', '#FFFFFF']}
                  style={styles.paymentTypeCardGradient}
                >
                  <View style={styles.paymentTypeHeader}>
                    <Text style={styles.paymentTypeIcon}>💰</Text>
                    <View style={styles.paymentTypeTitleContainer}>
                      <Text style={[styles.paymentTypeTitle, selectedPaymentType === 'full' && styles.textWhite]}>
                        Trả full
                      </Text>
                      <Text style={[styles.paymentTypeSubtitle, selectedPaymentType === 'full' && styles.textWhite]}>
                        Thanh toán một lần
                      </Text>
                    </View>
                  </View>
                  <View style={[
                    styles.paymentTypeDetails,
                    selectedPaymentType === 'full' ? styles.paymentTypeDetailsSelected : styles.paymentTypeDetailsUnselected
                  ]}>
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, selectedPaymentType === 'full' && styles.textWhite]}>
                        Tổng thanh toán:
                      </Text>
                      <Text style={[styles.detailValueHighlight, selectedPaymentType === 'full' && styles.textWhite]}>
                        {formatCurrency(deposit.remainingAmount)}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, selectedPaymentType === 'full' && styles.textWhite]}>
                        Lãi suất:
                      </Text>
                      <Text style={[styles.detailValue, selectedPaymentType === 'full' && styles.textWhite]}>
                        0%
                      </Text>
                    </View>
                  </View>
                  <View style={styles.benefits}>
                    <Text style={[styles.benefitItem, selectedPaymentType === 'full' && styles.textWhite]}>
                      ✓ Không phát sinh lãi suất
                    </Text>
                    <Text style={[styles.benefitItem, selectedPaymentType === 'full' && styles.textWhite]}>
                      ✓ Nhận xe ngay lập tức
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              {/* Installment Payment Option */}
              <TouchableOpacity
                style={styles.paymentTypeCard}
                onPress={() => setSelectedPaymentType('installment')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={selectedPaymentType === 'installment' ? COLORS.GRADIENT.PURPLE : ['#FFFFFF', '#F8F9FA']}
                  style={styles.paymentTypeCardGradient}
                >
                  <View style={styles.paymentTypeHeader}>
                    <Text style={styles.paymentTypeIcon}>📅</Text>
                    <View style={styles.paymentTypeTitleContainer}>
                      <Text style={[styles.paymentTypeTitle, selectedPaymentType === 'installment' && styles.textWhite]}>
                        Trả góp
                      </Text>
                      <Text style={[styles.paymentTypeSubtitle, selectedPaymentType === 'installment' && styles.textWhite]}>
                        Thanh toán theo tháng
                      </Text>
                    </View>
                  </View>

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

                  <View style={[
                    styles.paymentTypeDetails,
                    selectedPaymentType === 'installment' ? styles.paymentTypeDetailsSelected : styles.paymentTypeDetailsUnselected
                  ]}>
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, selectedPaymentType === 'installment' && styles.textWhite]}>
                        Trả hàng tháng:
                      </Text>
                      <Text style={[styles.detailValueHighlight, selectedPaymentType === 'installment' && styles.textWhite]}>
                        {formatCurrency(monthlyPayment)}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, selectedPaymentType === 'installment' && styles.textWhite]}>
                        Tổng thanh toán:
                      </Text>
                      <Text style={[styles.detailValue, selectedPaymentType === 'installment' && styles.textWhite]}>
                        {formatCurrency(totalPayable)}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, selectedPaymentType === 'installment' && styles.textWhite]}>
                        Lãi suất:
                      </Text>
                      <Text style={[styles.detailValue, selectedPaymentType === 'installment' && styles.textWhite]}>
                        6.0%/năm (~{formatCurrency(interestAmount)})
                      </Text>
                    </View>
                  </View>

                  <View style={styles.benefits}>
                    <Text style={[styles.benefitItem, selectedPaymentType === 'installment' && styles.textWhite]}>
                      ✓ Thanh toán linh hoạt theo tháng
                    </Text>
                    <Text style={[styles.benefitItem, selectedPaymentType === 'installment' && styles.textWhite]}>
                      ✓ Nhận xe ngay, trả dần
                    </Text>
                  </View>

                  {selectedPaymentType === 'installment' && (
                    <TouchableOpacity
                      style={styles.confirmButton}
                      onPress={handleConfirmInstallmentPayment}
                    >
                      <LinearGradient
                        colors={COLORS.GRADIENT.BLUE}
                        style={styles.confirmButtonGradient}
                      >
                        <Text style={styles.confirmButtonText}>
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
        <View style={styles.headerTitle}>
          <Text style={styles.headerTitleText}>Chi tiết đặt cọc</Text>
          <Text style={styles.headerSubtitle}>#{deposit.id}</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusCardHeader}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(deposit.status) }]}>
              <Text style={styles.statusBadgeText}>{getStatusText(deposit.status)}</Text>
            </View>
            {deposit.type === 'pre_order' && (
              <View style={[styles.typeBadge, { backgroundColor: COLORS.PRIMARY }]}>
                <Text style={styles.badgeText}>Pre-order</Text>
              </View>
            )}
          </View>
          <Text style={styles.statusDescription}>
            {deposit.status === 'pending' && '⏳ Chờ xác nhận đặt cọc'}
            {deposit.status === 'confirmed' && (deposit.type === 'pre_order' ? '📦 Chờ xe về từ hãng' : '🚗 Xe sẵn sàng - Chờ thanh toán')}
            {deposit.status === 'completed' && '✅ Đã hoàn thành'}
            {deposit.status === 'cancelled' && '❌ Đã hủy'}
          </Text>
        </View>

        {/* Customer Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin khách hàng</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tên:</Text>
              <Text style={styles.infoValue}>{deposit.customerName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Điện thoại:</Text>
              <Text style={styles.infoValue}>{deposit.customerPhone}</Text>
            </View>
            {deposit.customerEmail && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email:</Text>
                <Text style={styles.infoValue}>{deposit.customerEmail}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Vehicle Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin xe</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Model:</Text>
              <Text style={styles.infoValue}>{deposit.vehicleModel}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Màu:</Text>
              <Text style={styles.infoValue}>{deposit.vehicleColor}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Giá:</Text>
              <Text style={styles.infoValueHighlight}>{formatCurrency(deposit.vehiclePrice)}</Text>
            </View>
            {deposit.manufacturerOrderId && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Mã đơn hãng:</Text>
                <Text style={styles.infoValueHighlight}>{deposit.manufacturerOrderId}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Deposit Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin đặt cọc</Text>
          <View style={styles.depositAmountSection}>
            <View style={styles.depositAmountCard}>
              <Text style={styles.depositAmountLabel}>Đã đặt cọc</Text>
              <Text style={styles.depositAmountValue}>{formatCurrency(deposit.depositAmount)}</Text>
              <Text style={styles.depositPercentage}>{deposit.depositPercentage}% tổng giá</Text>
            </View>
            <View style={styles.remainingAmountCard}>
              <Text style={styles.remainingAmountLabel}>Còn lại</Text>
              <Text style={styles.remainingAmountValue}>{formatCurrency(deposit.remainingAmount)}</Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Ngày đặt cọc:</Text>
              <Text style={styles.infoValue}>{formatDate(deposit.depositDate)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Dự kiến giao xe:</Text>
              <Text style={styles.infoValue}>{formatDate(deposit.expectedDeliveryDate)}</Text>
            </View>
            {deposit.finalPaymentType && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Hình thức thanh toán:</Text>
                <Text style={styles.infoValue}>
                  {deposit.finalPaymentType === 'full' ? 'Trả full' : `Trả góp ${deposit.installmentMonths} tháng`}
                </Text>
              </View>
            )}
            {deposit.type === 'pre_order' && (
              <>
                {deposit.manufacturerOrderId && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Mã đơn hãng:</Text>
                    <Text style={styles.infoValueHighlight}>{deposit.manufacturerOrderId}</Text>
                  </View>
                )}
                {deposit.manufacturerStatus && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Trạng thái hãng:</Text>
                    <Text style={styles.infoValue}>{deposit.manufacturerStatus}</Text>
                  </View>
                )}
                {deposit.staffNotifiedAt && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Đã thông báo Staff:</Text>
                    <Text style={styles.infoValue}>{formatDate(deposit.staffNotifiedAt)}</Text>
                  </View>
                )}
                {deposit.notificationStatus && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Trạng thái thông báo:</Text>
                    <Text style={styles.infoValue}>{
                      deposit.notificationStatus === 'notified' ? 'Đã gửi' :
                      deposit.notificationStatus === 'acknowledged' ? 'Đã xác nhận' : '—'
                    }</Text>
                  </View>
                )}
              </>
            )}
          </View>
        </View>

        {/* Notes */}
        {deposit.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ghi chú</Text>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{deposit.notes}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      {deposit.status !== 'completed' && deposit.status !== 'cancelled' && (
        <View style={styles.footer}>
          {/* Dealer Staff actions */}
          {isDealerStaff && (
            <>
              {deposit.status === 'pending' && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleConfirmDeposit}
                >
                  <LinearGradient
                    colors={COLORS.GRADIENT.GREEN}
                    style={styles.actionButtonGradient}
                  >
                    <Text style={styles.actionButtonText}>✓ Xác nhận đặt cọc</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}

              {/* Staff acknowledge when pre-order notified */}
              {deposit.type === 'pre_order' && deposit.manufacturerStatus === 'arrived' && deposit.notificationStatus === 'notified' && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleStaffAcknowledgeNotification}
                >
                  <LinearGradient
                    colors={COLORS.GRADIENT.PURPLE}
                    style={styles.actionButtonGradient}
                  >
                    <Text style={styles.actionButtonText}>📬 Xác nhận đã nhận thông báo</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}

              {/* Payment allowed for available confirmed OR pre-order after arrival + notified */}
              {deposit.status === 'confirmed' && (
                (() => {
                  const canPay = deposit.type === 'available' ||
                    (deposit.type === 'pre_order' && deposit.manufacturerStatus === 'arrived' && deposit.notificationStatus === 'acknowledged');
                  if (!canPay) return null;
                  return (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={handleFinalPayment}
                    >
                      <LinearGradient
                        colors={COLORS.GRADIENT.BLUE}
                        style={styles.actionButtonGradient}
                      >
                        <Text style={styles.actionButtonText}>💳 Thanh toán phần còn lại</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  );
                })()
              )}
            </>
          )}

          {/* Dealer Manager actions for pre-order lifecycle */}
          {isDealerManager && deposit.type === 'pre_order' && (
            <>
              {!deposit.manufacturerOrderId && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleManagerPlaceManufacturerOrder}
                >
                  <LinearGradient
                    colors={COLORS.GRADIENT.PURPLE}
                    style={styles.actionButtonGradient}
                  >
                    <Text style={styles.actionButtonText}>📦 Đặt xe từ hãng</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}

              {deposit.manufacturerOrderId && deposit.manufacturerStatus === 'ordered' && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleManagerMarkVehicleArrived}
                >
                  <LinearGradient
                    colors={COLORS.GRADIENT.GREEN}
                    style={styles.actionButtonGradient}
                  >
                    <Text style={styles.actionButtonText}>🚚 Đánh dấu xe đã về</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}

              {deposit.manufacturerStatus === 'arrived' && deposit.notificationStatus !== 'notified' && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleManagerNotifyStaff}
                >
                  <LinearGradient
                    colors={COLORS.GRADIENT.BLUE}
                    style={styles.actionButtonGradient}
                  >
                    <Text style={styles.actionButtonText}>📣 Thông báo cho Dealer Staff</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      )}

      {/* Payment Type Modal */}
      {renderPaymentTypeModal()}

      {/* QR Payment Modal */}
      <Modal
        visible={showQRPaymentModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => !processingPayment && setShowQRPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.qrPaymentModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Thanh toán phần còn lại</Text>
              {!processingPayment && (
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowQRPaymentModal(false)}
                >
                  <Text style={styles.closeIcon}>×</Text>
                </TouchableOpacity>
              )}
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Payment Info */}
              <View style={styles.qrPaymentInfo}>
                <Text style={styles.qrPaymentLabel}>Số tiền thanh toán:</Text>
                <Text style={styles.qrPaymentAmount}>
                  {formatCurrency(deposit.remainingAmount)}
                </Text>
                {selectedPaymentType === 'installment' && (
                  <Text style={styles.qrPaymentNote}>
                    Trả góp {installmentMonths} tháng • {formatCurrency(calculateMonthlyPayment(deposit.remainingAmount, installmentMonths))}/tháng
                  </Text>
                )}
                {selectedPaymentType === 'full' && (
                  <Text style={styles.qrPaymentNote}>
                    Thanh toán full
                  </Text>
                )}
              </View>

              {/* QR Code Section */}
              <View style={styles.qrSection}>
                <Text style={styles.qrTitle}>Quét mã QR để thanh toán</Text>
                <View style={styles.qrContainer}>
                  <View style={styles.qrPlaceholder}>
                    <Text style={styles.qrIcon}>📱</Text>
                    <Text style={styles.qrText}>VNPay QR Code</Text>
                    <Text style={styles.qrData}>Demo Mode</Text>
                  </View>
                </View>
              </View>

              {/* Payment Instructions */}
              <View style={styles.paymentInstructions}>
                <Text style={styles.instructionsTitle}>Hướng dẫn thanh toán:</Text>
                <Text style={styles.instructionText}>1. Mở ứng dụng VNPay hoặc app ngân hàng</Text>
                <Text style={styles.instructionText}>2. Quét mã QR phía trên</Text>
                <Text style={styles.instructionText}>3. Xác nhận thông tin thanh toán</Text>
                <Text style={styles.instructionText}>4. Nhấn "Xác nhận thanh toán" bên dưới</Text>
              </View>

              {/* Confirm Payment Button */}
              <TouchableOpacity
                style={[styles.confirmPaymentButton, processingPayment && styles.disabledButton]}
                onPress={processDepositPayment}
                disabled={processingPayment}
              >
                <LinearGradient
                  colors={processingPayment ? ['#CCCCCC', '#999999'] : COLORS.GRADIENT.GREEN}
                  style={styles.confirmPaymentButtonGradient}
                >
                  {processingPayment ? (
                    <>
                      <ActivityIndicator color={COLORS.TEXT.WHITE} style={{ marginRight: 10 }} />
                      <Text style={styles.confirmPaymentButtonText}>Đang xử lý...</Text>
                    </>
                  ) : (
                    <Text style={styles.confirmPaymentButtonText}>✓ Xác nhận thanh toán</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
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

  // Status Card
  statusCard: {
    marginHorizontal: SIZES.PADDING.LARGE,
    marginBottom: SIZES.PADDING.LARGE,
    backgroundColor: '#F8F9FA',
    borderRadius: SIZES.RADIUS.LARGE,
    padding: SIZES.PADDING.MEDIUM,
  },
  statusCardHeader: {
    flexDirection: 'row',
    gap: SIZES.PADDING.SMALL,
    marginBottom: SIZES.PADDING.SMALL,
  },
  statusBadge: {
    paddingHorizontal: SIZES.PADDING.SMALL,
    paddingVertical: SIZES.PADDING.XSMALL,
    borderRadius: SIZES.RADIUS.SMALL,
  },
  statusBadgeText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.WHITE,
    fontWeight: 'bold',
  },
  typeBadge: {
    paddingHorizontal: SIZES.PADDING.SMALL,
    paddingVertical: SIZES.PADDING.XSMALL,
    borderRadius: SIZES.RADIUS.SMALL,
  },
  badgeText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.WHITE,
    fontWeight: 'bold',
  },
  statusDescription: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '600',
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
    marginBottom: SIZES.PADDING.SMALL,
  },
  infoCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.PADDING.SMALL,
  },
  infoLabel: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '600',
  },
  infoValueHighlight: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.PRIMARY,
    fontWeight: 'bold',
  },

  // Deposit Amount Section
  depositAmountSection: {
    flexDirection: 'row',
    gap: SIZES.PADDING.SMALL,
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  depositAmountCard: {
    flex: 1,
    backgroundColor: '#E3F2FD',
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.PRIMARY,
  },
  depositAmountLabel: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: 4,
  },
  depositAmountValue: {
    fontSize: SIZES.FONT.XLARGE,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginBottom: 4,
  },
  depositPercentage: {
    fontSize: SIZES.FONT.XSMALL,
    color: COLORS.TEXT.SECONDARY,
  },
  remainingAmountCard: {
    flex: 1,
    backgroundColor: '#FFF3E0',
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.WARNING,
  },
  remainingAmountLabel: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: 4,
  },
  remainingAmountValue: {
    fontSize: SIZES.FONT.XLARGE,
    fontWeight: 'bold',
    color: COLORS.WARNING,
  },

  // Notes
  notesCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
  },
  notesText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.PRIMARY,
    lineHeight: 20,
  },

  // Footer
  footer: {
    padding: SIZES.PADDING.LARGE,
    paddingBottom: SIZES.PADDING.XXXLARGE,
    backgroundColor: COLORS.SURFACE,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  actionButton: {
    borderRadius: SIZES.RADIUS.MEDIUM,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    paddingVertical: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.WHITE,
    fontWeight: 'bold',
  },

  // Payment Type Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  paymentTypeModalContent: {
    backgroundColor: COLORS.SURFACE,
    borderTopLeftRadius: SIZES.RADIUS.XXLARGE,
    borderTopRightRadius: SIZES.RADIUS.XXLARGE,
    maxHeight: '90%',
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
  paymentTypeCard: {
    marginBottom: SIZES.PADDING.LARGE,
    borderRadius: SIZES.RADIUS.LARGE,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
  },
  paymentTypeCardGradient: {
    padding: SIZES.PADDING.LARGE,
  },
  paymentTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  paymentTypeIcon: {
    fontSize: 40,
    marginRight: SIZES.PADDING.MEDIUM,
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
  paymentTypeSubtitle: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
  },
  textWhite: {
    color: COLORS.TEXT.WHITE,
  },
  paymentTypeDetails: {
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
    marginBottom: SIZES.PADDING.SMALL,
  },
  paymentTypeDetailsSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  paymentTypeDetailsUnselected: {
    backgroundColor: '#F5F5F5',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.PADDING.XSMALL,
  },
  detailLabel: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '600',
  },
  detailValueHighlight: {
    fontSize: SIZES.FONT.LARGE,
    color: COLORS.PRIMARY,
    fontWeight: 'bold',
  },
  benefits: {
    marginTop: SIZES.PADDING.SMALL,
  },
  benefitItem: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: SIZES.PADDING.XSMALL,
  },
  
  // Installment Options
  installmentMonthsContainer: {
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  installmentMonthsLabel: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
    marginBottom: SIZES.PADDING.SMALL,
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
  },
  monthOptionTextSelected: {
    fontWeight: 'bold',
  },
  confirmButton: {
    marginTop: SIZES.PADDING.MEDIUM,
    borderRadius: SIZES.RADIUS.MEDIUM,
    overflow: 'hidden',
  },
  confirmButtonGradient: {
    paddingVertical: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.WHITE,
    fontWeight: 'bold',
  },

  // QR Payment Modal
  qrPaymentModalContent: {
    backgroundColor: COLORS.SURFACE,
    borderTopLeftRadius: SIZES.RADIUS.XXLARGE,
    borderTopRightRadius: SIZES.RADIUS.XXLARGE,
    maxHeight: '85%',
  },
  qrPaymentInfo: {
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    borderRadius: SIZES.RADIUS.LARGE,
    padding: SIZES.PADDING.LARGE,
    marginBottom: SIZES.PADDING.LARGE,
  },
  qrPaymentLabel: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: 8,
  },
  qrPaymentAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginBottom: 4,
  },
  qrPaymentNote: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    textAlign: 'center',
  },
  qrSection: {
    alignItems: 'center',
    marginBottom: SIZES.PADDING.LARGE,
  },
  qrTitle: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SIZES.PADDING.MEDIUM,
    textAlign: 'center',
  },
  qrContainer: {
    backgroundColor: COLORS.SURFACE,
    padding: SIZES.PADDING.LARGE,
    borderRadius: SIZES.RADIUS.LARGE,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: '#F8F9FA',
    borderRadius: SIZES.RADIUS.MEDIUM,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  qrText: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: 4,
  },
  qrData: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
  },
  paymentInstructions: {
    backgroundColor: '#FFF3E0',
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
    marginBottom: SIZES.PADDING.LARGE,
  },
  instructionsTitle: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.WARNING,
    marginBottom: SIZES.PADDING.SMALL,
  },
  instructionText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SIZES.PADDING.XSMALL,
    lineHeight: 20,
  },
  confirmPaymentButton: {
    borderRadius: SIZES.RADIUS.MEDIUM,
    overflow: 'hidden',
    marginBottom: SIZES.PADDING.LARGE,
  },
  confirmPaymentButtonGradient: {
    paddingVertical: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  confirmPaymentButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.WHITE,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default DepositDetailScreen;
