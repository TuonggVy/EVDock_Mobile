import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { COLORS, SIZES, USER_ROLES } from '../../constants';
import CustomAlert from '../../components/common/CustomAlert';
import batchManagementService from '../../services/batchManagementService';
import agencyService from '../../services/agencyService';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowLeft, Edit, FileText, DollarSign, Calendar, Building, Package } from 'lucide-react-native';

const BatchDetailScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const { batchId } = route.params || {};
  const [batch, setBatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [agencies, setAgencies] = useState([]);
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'info' });
  const [isPaying, setIsPaying] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmountInput, setPaymentAmountInput] = useState('');
  const [paymentError, setPaymentError] = useState('');

  // Check if user is Dealer Manager (read-only)
  const isDealerManager = user?.role === USER_ROLES.DEALER_MANAGER;

  useEffect(() => {
    loadAgencies();
    loadBatchDetail();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadBatchDetail();
    });

    return unsubscribe;
  }, [navigation]);

  const loadAgencies = async () => {
    try {
      const response = await agencyService.getAgencies({ limit: 100 });
      if (response.success) {
        setAgencies(response.data || []);
      }
    } catch (error) {
      console.error('Error loading agencies:', error);
    }
  };

  const loadBatchDetail = async () => {
    try {
      setLoading(true);
      const response = await batchManagementService.getBatchDetail(batchId);
      
      if (response.success && response.data) {
        setBatch(response.data);
      } else {
        setAlertConfig({
          title: 'Error',
          message: response.error || 'Cannot load batch detail',
          type: 'error'
        });
        setShowAlert(true);
        setTimeout(() => navigation.goBack(), 2000);
      }
    } catch (error) {
      console.error('Error loading batch detail:', error);
      setAlertConfig({
        title: 'Error',
        message: 'Cannot load batch detail',
        type: 'error'
      });
      setShowAlert(true);
      setTimeout(() => navigation.goBack(), 2000);
    } finally {
      setLoading(false);
    }
  };

  const getAgencyName = (agencyId) => {
    if (!agencyId) return 'N/A';
    const agency = agencies.find(a => a.id === agencyId || a.id?.toString() === agencyId?.toString());
    return agency?.name || `Agency ${agencyId}`;
  };

  const formatPrice = (amount) => {
    if (!amount) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'OPEN':
        return COLORS.WARNING;
      case 'PARTIAL':
        return COLORS.PRIMARY;
      case 'CLOSED':
        return COLORS.SUCCESS;
      case 'OVERDUE':
        return COLORS.ERROR;
      default:
        return COLORS.TEXT.SECONDARY;
    }
  };

  const handleEdit = () => {
    navigation.navigate('EditBatch', { batchId: batch.id, batch });
  };

  const handlePayBatch = async (amountOverride) => {
    if (!batch?.id) {
      return;
    }

    const paymentAmount = amountOverride;

    if (paymentAmount === undefined || paymentAmount === null) {
      setAlertConfig({
        title: 'Missing Amount',
        message: 'Vui lòng nhập số tiền cần thanh toán.',
        type: 'error'
      });
      setShowAlert(true);
      return;
    }

    if (paymentAmount <= 0) {
      setAlertConfig({
        title: 'Payment Not Required',
        message: 'Số tiền thanh toán phải lớn hơn 0.',
        type: 'info'
      });
      setShowAlert(true);
      return;
    }

    try {
      setIsPaying(true);
      const response = await batchManagementService.getBatchPaymentUrl({
        batchId: batch.id,
        amount: paymentAmount,
        platform: 'mobile',
      });

      if (response.success && response.paymentUrl) {
        console.log('🔎 [BatchDetailScreen] VNPay payment URL:', response.paymentUrl);
        const canOpen = await Linking.canOpenURL(response.paymentUrl);
        if (canOpen) {
          await Linking.openURL(response.paymentUrl);
        } else {
          setAlertConfig({
            title: 'Cannot Open URL',
            message: 'Unable to open the payment link on this device.',
            type: 'error'
          });
          setShowAlert(true);
        }
      } else {
        setAlertConfig({
          title: 'Payment Error',
          message: response.error || 'Failed to get payment link.',
          type: 'error'
        });
        setShowAlert(true);
      }
    } catch (error) {
      console.error('Error initiating batch payment:', error);
      setAlertConfig({
        title: 'Payment Error',
        message: 'An unexpected error occurred. Please try again later.',
        type: 'error'
      });
      setShowAlert(true);
    } finally {
      setIsPaying(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#009DFF" />
      </View>
    );
  }

  if (!batch) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={20} color={COLORS.PRIMARY} />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Batch Detail</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Batch not found</Text>
        </View>
      </View>
    );
  }

  const statusColor = getStatusColor(batch.status);
  const totalPaid = batch.apPayment?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;
  const remainingAmount = (batch.amount || 0) - totalPaid;

  const handleOpenPaymentModal = () => {
    setPaymentAmountInput('');
    setPaymentError('');
    setShowPaymentModal(true);
  };

  const handleClosePaymentModal = () => {
    if (isPaying) {
      return;
    }
    setShowPaymentModal(false);
    setPaymentError('');
    setPaymentAmountInput('');
  };

  const handleChangePaymentAmount = (value) => {
    const numericString = value.replace(/[^0-9]/g, '');
    if (!numericString) {
      setPaymentAmountInput('');
      return;
    }
    const formattedValue = new Intl.NumberFormat('vi-VN').format(Number(numericString));
    setPaymentAmountInput(formattedValue);
  };

  const handleConfirmPayment = async () => {
    if (isPaying) {
      return;
    }

    const numericValue = Number(paymentAmountInput.replace(/[^0-9]/g, ''));

    if (!numericValue || Number.isNaN(numericValue) || numericValue <= 0) {
      setPaymentError('Vui lòng nhập số tiền hợp lệ.');
      return;
    }

    setShowPaymentModal(false);
    setPaymentError('');

    await handlePayBatch(numericValue);
  };

  return (
    <SafeAreaView style={styles.container}>
      <CustomAlert
        visible={showAlert}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setShowAlert(false)}
      />

      <Modal
        visible={showPaymentModal}
        transparent
        animationType="fade"
        onRequestClose={handleClosePaymentModal}
      >
        <TouchableOpacity
          style={styles.paymentModalOverlay}
          activeOpacity={1}
          onPress={handleClosePaymentModal}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.paymentModalWrapper}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => {}}
              style={styles.paymentModalContainer}
            >
              <Text style={styles.paymentModalTitle}>Thanh toán batch</Text>
              <Text style={styles.paymentModalSubtitle}>
                Số tiền còn lại: {formatPrice(Math.max(0, remainingAmount))}
              </Text>
              <TextInput
                value={paymentAmountInput}
                onChangeText={handleChangePaymentAmount}
                keyboardType="numeric"
                placeholder="Nhập số tiền muốn thanh toán"
                style={styles.paymentInput}
                editable={!isPaying}
              />
              {paymentError ? (
                <Text style={styles.paymentErrorText}>{paymentError}</Text>
              ) : null}
              <View style={styles.paymentModalActions}>
                <TouchableOpacity
                  style={styles.paymentModalButton}
                  onPress={handleClosePaymentModal}
                  disabled={isPaying}
                >
                  <Text style={styles.paymentModalButtonText}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.paymentModalButton,
                    styles.paymentModalButtonPrimary,
                    (isPaying || !paymentAmountInput) && styles.paymentModalButtonDisabled,
                  ]}
                  onPress={handleConfirmPayment}
                  disabled={isPaying || !paymentAmountInput}
                >
                  <Text style={styles.paymentModalButtonPrimaryText}>
                    {isPaying ? 'Đang xử lý...' : 'Thanh toán'}
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </TouchableOpacity>
      </Modal>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={20} color={COLORS.TEXT.WHITE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Batch Detail</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.contentWrapper}>
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Batch Info Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Batch Information</Text>
              <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                <Text style={[styles.statusText, { color: statusColor }]}>
                  {batch.status || 'N/A'}
                </Text>
              </View>
            </View>

            <View style={styles.infoSection}>
              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}><FileText size={16} color={COLORS.TEXT.SECONDARY} /></Text>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Batch ID</Text>
                  <Text style={styles.infoValue}>#{batch.id}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}><FileText size={16} color={COLORS.TEXT.SECONDARY} /></Text>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Invoice Number</Text>
                  <Text style={styles.infoValue}>{batch.invoiceNumber || 'N/A'}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}><Building size={16} color={COLORS.TEXT.SECONDARY} /></Text>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Agency</Text>
                  <Text style={styles.infoValue}>{getAgencyName(batch.agencyId)}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}><DollarSign size={16} color={COLORS.TEXT.SECONDARY} /></Text>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Total Amount</Text>
                  <Text style={styles.amountValue}>{formatPrice(batch.amount)}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}><Calendar size={16} color={COLORS.TEXT.SECONDARY} /></Text>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Due Date</Text>
                  <Text style={styles.infoValue}>{formatDate(batch.dueDate)}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}><Calendar size={16} color={COLORS.TEXT.SECONDARY} /></Text>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Created At</Text>
                  <Text style={styles.infoValue}>{formatDate(batch.createAt)}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Payment History */}
          {batch.apPayment && batch.apPayment.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Payment History</Text>
              {batch.apPayment.map((payment, index) => (
                <View key={index} style={styles.paymentItem}>
                  <View style={styles.paymentInfo}>
                    <Text style={styles.paymentDate}>{formatDate(payment.paidDate)}</Text>
                    <Text style={styles.paymentAmount}>{formatPrice(payment.amount)}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Agency Order Info */}
          {batch.agencyOrder && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Related Order</Text>
              <View style={styles.infoSection}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoIcon}><Package size={16} color={COLORS.TEXT.SECONDARY} /></Text>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Order ID</Text>
                    <Text style={styles.infoValue}>#{batch.agencyOrder.id}</Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoIcon}><Package size={16} color={COLORS.TEXT.SECONDARY} /></Text>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Items Quantity</Text>
                    <Text style={styles.infoValue}>{batch.agencyOrder.itemQuantity || batch.agencyOrder.itemsQuantity || 0}</Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoIcon}><DollarSign size={16} color={COLORS.TEXT.SECONDARY} /></Text>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Sub Total</Text>
                    <Text style={styles.amountValue}>{formatPrice(batch.agencyOrder.subtotal || batch.agencyOrder.subTotal)}</Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoIcon}><Calendar size={16} color={COLORS.TEXT.SECONDARY} /></Text>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Order Date</Text>
                    <Text style={styles.infoValue}>{formatDate(batch.agencyOrder.orderAt)}</Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoIcon}><FileText size={16} color={COLORS.TEXT.SECONDARY} /></Text>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Order Type</Text>
                    <Text style={styles.infoValue}>{batch.agencyOrder.orderType || 'N/A'}</Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoIcon}><FileText size={16} color={COLORS.TEXT.SECONDARY} /></Text>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Order Status</Text>
                    <Text style={styles.infoValue}>{batch.agencyOrder.status || 'N/A'}</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actionsSection}>
            {!isDealerManager && (
              <TouchableOpacity
                style={[styles.primaryActionButton, styles.editPrimaryButton]}
                onPress={handleEdit}
                activeOpacity={0.85}
              >
                <Edit size={20} color={COLORS.TEXT.WHITE} />
                <Text style={styles.primaryActionText}>Edit Batch</Text>
              </TouchableOpacity>
            )}

            {isDealerManager && remainingAmount > 0 && (
              <TouchableOpacity
                style={[
                  styles.primaryActionButton,
                  styles.payPrimaryButton,
                  (isPaying) && styles.actionButtonDisabled,
                ]}
                onPress={handleOpenPaymentModal}
                disabled={isPaying}
                activeOpacity={0.85}
              >
                <DollarSign size={20} color={COLORS.TEXT.WHITE} />
                <Text style={styles.primaryActionText}>
                  {isPaying ? 'Processing...' : 'Pay Batch'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </View>

    </SafeAreaView>
  );
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
    paddingTop: Platform.OS === 'ios' ? SIZES.PADDING.XLARGE : SIZES.PADDING.XXXLARGE + 4,
    paddingBottom: SIZES.PADDING.MEDIUM,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: SIZES.RADIUS.ROUND,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
  paymentModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: SIZES.PADDING.LARGE,
  },
  paymentModalWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  paymentModalContainer: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.LARGE,
    padding: SIZES.PADDING.LARGE,
    gap: SIZES.PADDING.MEDIUM,
  },
  paymentModalTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: '700',
    color: COLORS.TEXT.PRIMARY,
  },
  paymentModalSubtitle: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
  },
  paymentInput: {
    borderWidth: 1,
    borderColor: COLORS.BORDER?.DEFAULT || '#E5E5E5',
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
  },
  paymentErrorText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.ERROR,
  },
  paymentModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SIZES.PADDING.MEDIUM,
  },
  paymentModalButton: {
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    borderRadius: SIZES.RADIUS.SMALL,
    borderWidth: 1,
    borderColor: COLORS.BORDER?.DEFAULT || COLORS.PRIMARY,
  },
  paymentModalButtonPrimary: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  paymentModalButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  paymentModalButtonPrimaryText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
  },
  paymentModalButtonDisabled: {
    opacity: 0.7,
  },
  headerRight: {
    width: 40,
    height: 40,
  },
  actionsSection: {
    marginTop: SIZES.PADDING.LARGE,
    gap: SIZES.PADDING.MEDIUM,
  },
  primaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.PRIMARY,
    borderRadius: SIZES.RADIUS.LARGE,
    paddingVertical: SIZES.PADDING.MEDIUM,
    gap: SIZES.PADDING.SMALL,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  editPrimaryButton: {
    backgroundColor: "#009DFF",
  },
  payPrimaryButton: {
    backgroundColor: COLORS.SUCCESS,
  },
  actionButtonDisabled: {
    opacity: 0.7,
  },
  primaryActionText: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: '600',
    color: COLORS.TEXT.WHITE,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
  },
  contentWrapper: {
    flex: 1,
    backgroundColor: COLORS.SURFACE,
    borderTopLeftRadius: SIZES.RADIUS.XXLARGE,
    borderTopRightRadius: SIZES.RADIUS.XXLARGE,
    overflow: 'hidden',
    paddingTop: SIZES.PADDING.LARGE,
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.SURFACE,
  },
  contentContainer: {
    padding: SIZES.PADDING.LARGE,
    paddingBottom: SIZES.PADDING.XXXLARGE,
  },
  card: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.LARGE,
    padding: SIZES.PADDING.LARGE,
    marginBottom: SIZES.PADDING.MEDIUM,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.PADDING.LARGE,
  },
  cardTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
  },
  statusBadge: {
    paddingHorizontal: SIZES.PADDING.SMALL,
    paddingVertical: 4,
    borderRadius: SIZES.RADIUS.SMALL,
  },
  statusText: {
    fontSize: SIZES.FONT.SMALL,
    fontWeight: '600',
  },
  infoSection: {
    gap: SIZES.PADDING.MEDIUM,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SIZES.PADDING.MEDIUM,
  },
  infoIcon: {
    marginTop: 2,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: SIZES.PADDING.XSMALL,
  },
  infoValue: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '500',
  },
  amountValue: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.SECONDARY,
    fontWeight: 'bold',
  },
  paymentItem: {
    paddingVertical: SIZES.PADDING.MEDIUM,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  paymentInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentDate: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
  },
  paymentAmount: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.SUCCESS,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.PADDING.XXXLARGE,
  },
  emptyText: {
    fontSize: SIZES.FONT.LARGE,
    color: COLORS.TEXT.SECONDARY,
  },
});

export default BatchDetailScreen;
