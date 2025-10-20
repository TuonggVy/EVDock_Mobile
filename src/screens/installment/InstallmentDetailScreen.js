import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES } from '../../constants';
import installmentStorageService from '../../services/storage/installmentStorageService';

const InstallmentDetailScreen = ({ navigation, route }) => {
  const { installment: initialInstallment, viewOnly = false } = route.params;
  const [installment, setInstallment] = useState(initialInstallment);

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

  const getProgressPercentage = (paidMonths, totalMonths) => {
    return Math.round((paidMonths / totalMonths) * 100);
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'paid': return COLORS.SUCCESS;
      case 'overdue': return COLORS.ERROR;
      case 'pending': return COLORS.WARNING;
      default: return COLORS.TEXT.SECONDARY;
    }
  };

  const getPaymentStatusText = (status) => {
    switch (status) {
      case 'paid': return 'Đã trả';
      case 'overdue': return 'Quá hạn';
      case 'pending': return 'Chờ trả';
      default: return 'N/A';
    }
  };

  const handleRecordPayment = async (payment) => {
    if (payment.status === 'paid') {
      Alert.alert('Thông báo', 'Khoản thanh toán này đã được ghi nhận');
      return;
    }

    Alert.alert(
      'Xác nhận thanh toán',
      `Ghi nhận thanh toán tháng ${payment.month}?\n\nSố tiền: ${formatCurrency(payment.amount)}`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: async () => {
            try {
              const updatedInstallment = await installmentStorageService.recordPayment(
                installment.id,
                payment.month,
                {
                  paidAmount: payment.amount,
                  paidDate: new Date().toISOString(),
                }
              );
              
              setInstallment(updatedInstallment);
              Alert.alert('Thành công', 'Đã ghi nhận thanh toán');
            } catch (error) {
              console.error('Error recording payment:', error);
              Alert.alert('Lỗi', 'Không thể ghi nhận thanh toán');
            }
          }
        }
      ]
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backIcon}>←</Text>
      </TouchableOpacity>
      <View style={styles.headerTitle}>
        <Text style={styles.headerTitleText}>Chi tiết trả góp</Text>
        <Text style={styles.headerSubtitle}>#{installment.id}</Text>
      </View>
      <View style={styles.headerSpacer} />
    </View>
  );

  const renderSummary = () => (
    <View style={styles.summarySection}>
      <View style={styles.customerInfo}>
        <Text style={styles.customerName}>{installment.customerName}</Text>
        <Text style={styles.customerPhone}>{installment.customerPhone}</Text>
        <Text style={styles.vehicleModel}>{installment.vehicleModel}</Text>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>
            Đã trả {installment.paidMonths}/{installment.installmentMonths} tháng
          </Text>
          <Text style={styles.progressPercentage}>
            {getProgressPercentage(installment.paidMonths, installment.installmentMonths)}%
          </Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, {
            width: `${getProgressPercentage(installment.paidMonths, installment.installmentMonths)}%`
          }]} />
        </View>
      </View>

      <View style={styles.summaryGrid}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Tổng giá trị</Text>
          <Text style={styles.summaryValue}>{formatCurrency(installment.totalAmount)}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Trả hàng tháng</Text>
          <Text style={styles.summaryValueHighlight}>{formatCurrency(installment.monthlyPayment)}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Còn lại</Text>
          <Text style={styles.summaryValue}>{formatCurrency(installment.remainingAmount)}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Lãi suất</Text>
          <Text style={styles.summaryValue}>{installment.interestRate}%/năm</Text>
        </View>
      </View>
    </View>
  );

  const renderPaymentSchedule = () => (
    <View style={styles.scheduleSection}>
      <Text style={styles.scheduleTitle}>Lịch thanh toán</Text>
      
      {installment.paymentSchedule.map((payment, index) => {
        const isOverdue = payment.status === 'overdue';
        const isPaid = payment.status === 'paid';
        const isNext = payment.status === 'pending' && index === installment.paymentSchedule.findIndex(p => p.status === 'pending');
        
        return (
          <View
            key={payment.month}
            style={[
              styles.paymentCard,
              isPaid && styles.paymentCardPaid,
              isOverdue && styles.paymentCardOverdue,
              isNext && styles.paymentCardNext,
            ]}
          >
            <View style={styles.paymentHeader}>
              <View style={styles.paymentMonthInfo}>
                <Text style={[styles.paymentMonth, isPaid && styles.paymentMonthPaid]}>
                  Tháng {payment.month}
                </Text>
                {isNext && (
                  <View style={styles.nextBadge}>
                    <Text style={styles.nextBadgeText}>Kỳ tiếp</Text>
                  </View>
                )}
              </View>
              <View style={[styles.paymentStatusBadge, { backgroundColor: getPaymentStatusColor(payment.status) }]}>
                <Text style={styles.paymentStatusText}>{getPaymentStatusText(payment.status)}</Text>
              </View>
            </View>

            <View style={styles.paymentDetails}>
              <View style={styles.paymentDetailRow}>
                <Text style={styles.paymentDetailLabel}>Hạn trả:</Text>
                <Text style={[styles.paymentDetailValue, isOverdue && styles.paymentDetailValueOverdue]}>
                  {formatDate(payment.dueDate)}
                </Text>
              </View>
              <View style={styles.paymentDetailRow}>
                <Text style={styles.paymentDetailLabel}>Số tiền:</Text>
                <Text style={styles.paymentDetailValueHighlight}>{formatCurrency(payment.amount)}</Text>
              </View>
              {isPaid && (
                <View style={styles.paymentDetailRow}>
                  <Text style={styles.paymentDetailLabel}>Ngày trả:</Text>
                  <Text style={styles.paymentDetailValue}>{formatDate(payment.paidDate)}</Text>
                </View>
              )}
            </View>

            {!isPaid && !viewOnly && (
              <TouchableOpacity
                style={[
                  styles.recordButton,
                  isOverdue && styles.recordButtonOverdue
                ]}
                onPress={() => handleRecordPayment(payment)}
              >
                <LinearGradient
                  colors={isOverdue ? ['#EF4444', '#DC2626'] : COLORS.GRADIENT.BLUE}
                  style={styles.recordButtonGradient}
                >
                  <Text style={styles.recordButtonText}>
                    {isOverdue ? '⚠️ Ghi nhận thanh toán quá hạn' : '✓ Ghi nhận thanh toán'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
            
            {!isPaid && viewOnly && (
              <View style={styles.viewOnlyBadge}>
                <Text style={styles.viewOnlyText}>
                  👁️ Dealer Staff ghi nhận thanh toán
                </Text>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderSummary()}
        {renderPaymentSchedule()}
      </ScrollView>
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

  // Summary Section
  summarySection: {
    paddingHorizontal: SIZES.PADDING.LARGE,
    paddingBottom: SIZES.PADDING.LARGE,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  customerInfo: {
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  customerName: {
    fontSize: SIZES.FONT.XLARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: 4,
  },
  customerPhone: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: 4,
  },
  vehicleModel: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: '600',
    color: COLORS.PRIMARY,
  },
  progressContainer: {
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.PADDING.XSMALL,
  },
  progressLabel: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    fontWeight: '500',
  },
  progressPercentage: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.PRIMARY,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 10,
    backgroundColor: '#E9ECEF',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.SUCCESS,
    borderRadius: 5,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.PADDING.SMALL,
  },
  summaryCard: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: '#F8F9FA',
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
  },
  summaryLabel: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
  },
  summaryValueHighlight: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
  },

  // Schedule Section
  scheduleSection: {
    paddingHorizontal: SIZES.PADDING.LARGE,
    paddingTop: SIZES.PADDING.LARGE,
    paddingBottom: SIZES.PADDING.XXXLARGE,
  },
  scheduleTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SIZES.PADDING.MEDIUM,
  },

  // Payment Card
  paymentCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.LARGE,
    padding: SIZES.PADDING.MEDIUM,
    marginBottom: SIZES.PADDING.MEDIUM,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.WARNING,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  paymentCardPaid: {
    backgroundColor: '#F0FFF4',
    borderLeftColor: COLORS.SUCCESS,
    opacity: 0.8,
  },
  paymentCardOverdue: {
    backgroundColor: '#FFE6E6',
    borderLeftColor: COLORS.ERROR,
    borderWidth: 1,
    borderColor: COLORS.ERROR,
  },
  paymentCardNext: {
    borderLeftColor: COLORS.PRIMARY,
    borderWidth: 2,
    borderColor: COLORS.PRIMARY,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.PADDING.SMALL,
  },
  paymentMonthInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.PADDING.SMALL,
  },
  paymentMonth: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
  },
  paymentMonthPaid: {
    color: COLORS.SUCCESS,
  },
  nextBadge: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: SIZES.PADDING.SMALL,
    paddingVertical: 2,
    borderRadius: SIZES.RADIUS.SMALL,
  },
  nextBadgeText: {
    fontSize: SIZES.FONT.XSMALL,
    color: COLORS.TEXT.WHITE,
    fontWeight: 'bold',
  },
  paymentStatusBadge: {
    paddingHorizontal: SIZES.PADDING.SMALL,
    paddingVertical: SIZES.PADDING.XSMALL,
    borderRadius: SIZES.RADIUS.SMALL,
  },
  paymentStatusText: {
    fontSize: SIZES.FONT.XSMALL,
    color: COLORS.TEXT.WHITE,
    fontWeight: 'bold',
  },
  paymentDetails: {
    marginBottom: SIZES.PADDING.SMALL,
  },
  paymentDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.PADDING.XSMALL,
  },
  paymentDetailLabel: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    fontWeight: '500',
  },
  paymentDetailValue: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '600',
  },
  paymentDetailValueOverdue: {
    color: COLORS.ERROR,
    fontWeight: 'bold',
  },
  paymentDetailValueHighlight: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.PRIMARY,
    fontWeight: 'bold',
  },
  recordButton: {
    marginTop: SIZES.PADDING.SMALL,
    borderRadius: SIZES.RADIUS.MEDIUM,
    overflow: 'hidden',
  },
  recordButtonOverdue: {
    // Additional styles for overdue
  },
  recordButtonGradient: {
    paddingVertical: SIZES.PADDING.SMALL,
    alignItems: 'center',
  },
  recordButtonText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.WHITE,
    fontWeight: 'bold',
  },
  viewOnlyBadge: {
    marginTop: SIZES.PADDING.SMALL,
    backgroundColor: '#E3F2FD',
    borderRadius: SIZES.RADIUS.SMALL,
    paddingVertical: SIZES.PADDING.SMALL,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
  },
  viewOnlyText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
});

export default InstallmentDetailScreen;
