import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Modal,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES } from '../../constants';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import { ArrowLeft, DollarSign, Calendar, Check } from 'lucide-react-native';
import orderRestockManagerService from '../../services/orderRestockManagerService';
import agencyService from '../../services/agencyService';

const OrderRestockDetailManagerScreen = ({ navigation, route }) => {
  const { orderId, orderItemId, orderInfo, onStatusUpdate } = route.params || {};
  const [orderItem, setOrderItem] = useState(null);
  const [order, setOrder] = useState(orderInfo || null); // Order info from list or params
  const [agencies, setAgencies] = useState([]);
  const [agencyDetail, setAgencyDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showBillModal, setShowBillModal] = useState(false);
  const [selectedPaymentType, setSelectedPaymentType] = useState('FULL');

  const { alertConfig, hideAlert, showSuccess, showError, showConfirm } = useCustomAlert();

  const orderStatuses = [
    { key: 'DRAFT', label: 'Draft', color: COLORS.TEXT.SECONDARY },
    { key: 'PENDING', label: 'Pending', color: COLORS.WARNING },
    { key: 'APPROVED', label: 'Approved', color: COLORS.SUCCESS },
    { key: 'DELIVERED', label: 'Delivered', color: COLORS.PRIMARY },
    { key: 'CANCELED', label: 'Canceled', color: COLORS.ERROR },
  ];

  useEffect(() => {
    loadAgencies();
    loadOrderDetail();
  }, [orderItemId || orderId]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadAgencies();
      loadOrderDetail();
    });

    return unsubscribe;
  }, [navigation]);

  const loadAgencies = async () => {
    try {
      const response = await agencyService.getAgencies();
      if (response.success) {
        setAgencies(response.data || []);
      }
    } catch (error) {
      // silent
    }
  };

  const loadOrderDetail = async () => {
    try {
      setLoading(true);
      
      // API detail requires orderItemId, not orderId
      if (!orderItemId) {
        showError('Error', 'Order Item ID not found');
        navigation.goBack();
        return;
      }
      
      // Get orderItem detail from API
      const response = await orderRestockManagerService.getOrderRestockDetail(orderItemId);
      if (response.success) {
        const orderItemDetail = response.data;
        console.log('📦 [OrderRestockDetailManager] OrderItem detail response:', {
          orderItemId: orderItemDetail.id,
          orderId: orderItemDetail.orderId,
          orderKeys: Object.keys(orderItemDetail || {}),
          fullDetail: orderItemDetail
        });
        setOrderItem(orderItemDetail);
        
        // If we have orderId but no orderInfo, try to get order info from list
        if (orderItemDetail.orderId && !order) {
          await loadOrderInfo(orderItemDetail.orderId);
        }
        
        // Load agency info if needed
        if (orderItemDetail.orderId && order) {
          const agencyId = order?.agencyId;
          if (agencyId) {
            const existsInList = agencies.find(a => a.id === agencyId || a.id?.toString() === agencyId?.toString());
            if (existsInList) {
              setAgencyDetail(existsInList);
            } else {
              const agencyResp = await agencyService.getAgencyById(agencyId);
              if (agencyResp?.success) {
                const detailAgency = agencyResp?.data?.data || agencyResp?.data || null;
                setAgencyDetail(detailAgency);
              }
            }
          }
        }
      } else {
        showError('Error', response.error || 'Unable to load order details');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading order detail:', error);
      showError('Error', 'Unable to load order details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  // Load order info from list API if needed
  const loadOrderInfo = async (orderIdToLoad) => {
    try {
      // Note: This is a workaround - ideally we'd have a direct order detail API
      // For now, we rely on orderInfo passed from the list screen
      // If orderInfo is not passed, we can't get order status/orderAt without calling list API
      console.log('⚠️ [OrderRestockDetailManager] Order info should be passed from list screen for orderId:', orderIdToLoad);
    } catch (error) {
      console.error('Error loading order info:', error);
    }
  };

  const getStatusColor = (status) => {
    const statusOption = orderStatuses.find(s => s.key === status);
    return statusOption ? statusOption.color : COLORS.TEXT.SECONDARY;
  };

  const getStatusLabel = (status) => {
    const statusOption = orderStatuses.find(s => s.key === status);
    return statusOption ? statusOption.label : status;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderInfoRow = (label, value, valueStyle = {}) => (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, valueStyle]}>{value}</Text>
    </View>
  );

  const renderStatusModal = () => null;

  const handleCreateBill = async (paymentType) => {
    if (!order || !order.id) {
      showError('Lỗi', 'Không tìm thấy thông tin đơn hàng');
      return;
    }
    try {
      const response = await orderRestockManagerService.createOrderRestockBill(order.id, paymentType);
      if (response.success) {
        showSuccess('Success', response.message || 'Bill created successfully!');
        setShowBillModal(false);
        // Reload order detail to get updated bill information
        await loadOrderDetail();
        if (onStatusUpdate) onStatusUpdate();
      } else {
        showError('Error', response.error || 'Unable to create bill');
      }
    } catch (error) {
      console.error('Error creating bill:', error);
      showError('Error', 'Unable to create bill');
    }
  };

  const handlePayment = async () => {
    if (!order) {
      showError('Error', 'Order information not found');
      return;
    }
    if (!order.agencyBill || !order.agencyBill.id) {
      showError('Error', 'Bill information not found');
      return;
    }

    if (order.agencyBill.isCompleted) {
      showError('Notification', 'Bill has already been paid');
      return;
    }

    try {
      showConfirm(
        'Confirm Payment',
        `Are you sure you want to pay bill #${order.agencyBill.id}?\nAmount: ${formatPrice(order.agencyBill.amount)}`,
        async () => {
          try {
            const response = await orderRestockManagerService.getVNPayPaymentUrl(order.agencyBill.id);
            if (response.success && response.paymentUrl) {
              // Check if URL can be opened
              const canOpen = await Linking.canOpenURL(response.paymentUrl);
               if (canOpen) {
                 await Linking.openURL(response.paymentUrl);
                 // Reload order detail after payment attempt to check if payment completed
                 // Check multiple times as payment might take a few seconds
                 setTimeout(() => {
                   loadOrderDetail();
                 }, 2000);
                 setTimeout(() => {
                   loadOrderDetail();
                 }, 5000);
                 setTimeout(() => {
                   loadOrderDetail();
                 }, 10000);
               } else {
                showError('Error', 'Unable to open payment URL');
              }
            } else {
              showError('Error', response.error || 'Unable to get payment URL');
            }
          } catch (error) {
            console.error('Error getting payment URL:', error);
            showError('Error', 'Unable to process payment');
          }
        }
      );
    } catch (error) {
      console.error('Error in payment flow:', error);
      showError('Error', 'Unable to process payment');
    }
  };

  const renderBillModal = () => {
    if (!showBillModal) return null;

    return (
      <Modal
        visible={showBillModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowBillModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Payment Method</Text>
            <Text style={styles.modalSubtitle}>Order #{order?.id || orderItem?.orderId || 'N/A'} has been delivered</Text>

            <View style={styles.paymentTypeContainer}>
              <TouchableOpacity
                style={[
                  styles.paymentTypeCard,
                  selectedPaymentType === 'FULL' && styles.paymentTypeCardSelected
                ]}
                onPress={() => setSelectedPaymentType('FULL')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={selectedPaymentType === 'FULL' 
                    ? ['#4A90E2', '#357ABD'] 
                    : ['#FFFFFF', '#F8F9FA']
                  }
                  style={styles.paymentTypeCardGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.paymentTypeHeader}>
                    <View style={styles.paymentTypeIconContainer}>
                      <DollarSign size={28} color={selectedPaymentType === 'FULL' ? COLORS.TEXT.WHITE : COLORS.PRIMARY} />
                    </View>
                    <View style={styles.paymentTypeTitleContainer}>
                      <Text style={[
                        styles.paymentTypeTitle,
                        selectedPaymentType === 'FULL' && styles.paymentTypeTitleSelected
                      ]}>
                        Full Payment
                      </Text>
                      <Text style={[
                        styles.paymentTypeSubtitle,
                        selectedPaymentType === 'FULL' && styles.paymentTypeSubtitleSelected
                      ]}>
                        One-time payment (FULL)
                      </Text>
                    </View>
                    {selectedPaymentType === 'FULL' && (
                      <View style={styles.selectedBadge}>
                        <Check size={16} color={COLORS.TEXT.WHITE} />
                      </View>
                    )}
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.paymentTypeCard,
                  selectedPaymentType === 'DEFERRED' && styles.paymentTypeCardSelected
                ]}
                onPress={() => setSelectedPaymentType('DEFERRED')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={selectedPaymentType === 'DEFERRED' 
                    ? ['#9B59B6', '#8E44AD'] 
                    : ['#FFFFFF', '#F8F9FA']
                  }
                  style={styles.paymentTypeCardGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.paymentTypeHeader}>
                    <View style={styles.paymentTypeIconContainer}>
                      <Calendar size={28} color={selectedPaymentType === 'DEFERRED' ? COLORS.TEXT.WHITE : COLORS.PRIMARY} />
                    </View>
                    <View style={styles.paymentTypeTitleContainer}>
                      <Text style={[
                        styles.paymentTypeTitle,
                        selectedPaymentType === 'DEFERRED' && styles.paymentTypeTitleSelected
                      ]}>
                        Deferred Payment
                      </Text>
                      <Text style={[
                        styles.paymentTypeSubtitle,
                        selectedPaymentType === 'DEFERRED' && styles.paymentTypeSubtitleSelected
                      ]}>
                        Pay later (DEFERRED)
                      </Text>
                    </View>
                    {selectedPaymentType === 'DEFERRED' && (
                      <View style={styles.selectedBadge}>
                        <Check size={16} color={COLORS.TEXT.WHITE} />
                      </View>
                    )}
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowBillModal(false)}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={() => handleCreateBill(selectedPaymentType)}
              >
                <Text style={styles.modalButtonConfirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!orderItem) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Order not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={20} color={COLORS.TEXT.WHITE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Information</Text>
          {renderInfoRow('Order Item ID', `#${orderItem.id}`)}
          {renderInfoRow('Order ID', `#${orderItem.orderId || 'N/A'}`)}
          {order && order.orderAt && renderInfoRow('Order Date', formatDate(order.orderAt))}
          {renderInfoRow('Quantity', `${orderItem.quantity || 0} units`)}
          {order && order.itemQuantity && renderInfoRow('Item Quantity', `${order.itemQuantity} items`)}
          {order && renderInfoRow('Order Type', order.orderType === 'FULL' ? 'Full Payment' : 'Deferred Payment')}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle Information</Text>
          {renderInfoRow('Vehicle Name', orderItem.electricMotorbike?.name || 'N/A')}
          {renderInfoRow('Vehicle ID', orderItem.electricMotorbikeId?.toString() || 'N/A')}
          {renderInfoRow('Color', orderItem.color?.colorType || orderItem.colorId?.toString() || 'N/A')}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Warehouse Information</Text>
          {renderInfoRow('Warehouse Name', orderItem.warehouse?.name || 'N/A')}
          {renderInfoRow('Location', orderItem.warehouse?.location || 'N/A')}
          {renderInfoRow('Address', orderItem.warehouse?.address || 'N/A')}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Price Information</Text>
          {renderInfoRow('Base Price', formatPrice(orderItem.basePrice || 0))}
          {renderInfoRow('Wholesale Price', formatPrice(orderItem.wholesalePrice || 0))}
          {renderInfoRow('Discount', formatPrice(orderItem.discountTotal || 0))}
          {renderInfoRow('Promotion', formatPrice(orderItem.promotionTotal || 0))}
          {renderInfoRow('Final Price', formatPrice(orderItem.finalPrice || 0))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Policy Information</Text>
          {renderInfoRow('Price Policy', orderItem.pricePolicyId?.toString() || 'N/A')}
          {renderInfoRow('Discount', orderItem.discountId ? `#${orderItem.discountId}` : 'N/A')}
          {renderInfoRow('Promotion', orderItem.promotionId ? `#${orderItem.promotionId}` : 'N/A')}
        </View>

        {order && order.agencyBill && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bill Information</Text>
            {renderInfoRow('Bill ID', `#${order.agencyBill.id || 'N/A'}`)}
            {renderInfoRow('Amount', formatPrice(order.agencyBill.amount))}
            {renderInfoRow('Payment Type', order.agencyBill.type === 'FULL' ? 'Full Payment' : 'Deferred Payment')}
            {renderInfoRow('Created Date', formatDate(order.agencyBill.createAt))}
            {order.agencyBill.paidAt && renderInfoRow('Paid Date', formatDate(order.agencyBill.paidAt))}
            {renderInfoRow('Status', order.agencyBill.isCompleted ? 'Completed' : 'Pending', {
              color: order.agencyBill.isCompleted ? COLORS.SUCCESS : COLORS.WARNING
            })}
          </View>
        )}
      </ScrollView>

      {order && (
        <View style={styles.fixedActionsContainer}>
          {order.status === 'DRAFT' ? (
            <>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={async () => {
                  try {
                    const resp = await orderRestockManagerService.acceptOrderRestock(order.id);
                    if (resp.success) {
                      setOrder(resp.data);
                      showSuccess('Success', 'Order has been confirmed!');
                      if (onStatusUpdate) onStatusUpdate();
                    } else {
                      showError('Error', resp.error || 'Unable to confirm order');
                    }
                  } catch (e) {
                    showError('Error', 'Unable to confirm order');
                  }
                }}
              >
                <Text style={styles.actionButtonText}>Accept</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.deleteActionButton]}
                onPress={() => {
                  showConfirm(
                    'Confirm Delete',
                    'Are you sure you want to delete this order? This action cannot be undone.',
                    async () => {
                      try {
                        const resp = await orderRestockManagerService.deleteOrderRestock(order.id);
                        if (resp.success) {
                          showSuccess('Success', 'Order has been deleted!');
                          if (onStatusUpdate) onStatusUpdate();
                          navigation.goBack();
                        } else {
                          showError('Error', resp.error || 'Unable to delete order');
                        }
                      } catch (e) {
                        showError('Error', 'Unable to delete order');
                      }
                    }
                  );
                }}
              >
                <Text style={[styles.actionButtonText, styles.deleteActionButtonText]}>Delete</Text>
              </TouchableOpacity>
            </>
          ) : order.status === 'DELIVERED' && !order.agencyBill ? (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                setSelectedPaymentType('FULL');
                setShowBillModal(true);
              }}
            >
              <Text style={styles.actionButtonText}>Create Bill</Text>
            </TouchableOpacity>
          ) : order.agencyBill && !order.agencyBill.isCompleted ? (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handlePayment}
            >
              <Text style={styles.actionButtonText}>Pay</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}

      {renderBillModal()}

      {renderStatusModal()}

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
    paddingTop: Platform.OS === 'ios' ? 0 : 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingTop: Platform.OS === 'ios' ? 20 : 0,
    paddingBottom: SIZES.PADDING.MEDIUM,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: SIZES.RADIUS.ROUND,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SIZES.PADDING.MEDIUM,
    paddingBottom: 160,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
  },
  statusCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.LARGE,
    padding: SIZES.PADDING.MEDIUM,
    marginBottom: SIZES.PADDING.MEDIUM,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  statusTitle: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
  },
  statusBadge: {
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    borderRadius: SIZES.RADIUS.MEDIUM,
  },
  statusText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
  },
  section: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.LARGE,
    padding: SIZES.PADDING.MEDIUM,
    marginBottom: SIZES.PADDING.MEDIUM,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SIZES.PADDING.SMALL,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoLabel: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
    flex: 1,
  },
  infoValue: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  fixedActionsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
    padding: SIZES.PADDING.MEDIUM,
    paddingBottom: Platform.OS === 'ios' ? SIZES.PADDING.LARGE : SIZES.PADDING.MEDIUM,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    gap: SIZES.PADDING.MEDIUM,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  actionButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
  },
  deleteActionButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.ERROR,
  },
  deleteActionButtonText: {
    color: COLORS.ERROR,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.PADDING.MEDIUM,
  },
  modalContent: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.LARGE,
    padding: SIZES.PADDING.LARGE,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SIZES.PADDING.SMALL,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: SIZES.PADDING.LARGE,
    textAlign: 'center',
  },
  paymentTypeContainer: {
    marginBottom: SIZES.PADDING.LARGE,
    gap: SIZES.PADDING.MEDIUM,
  },
  paymentTypeCard: {
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
  },
  paymentTypeIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
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
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.SUCCESS,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SIZES.PADDING.SMALL,
  },
  modalActions: {
    flexDirection: 'row',
    gap: SIZES.PADDING.MEDIUM,
  },
  modalButton: {
    flex: 1,
    padding: SIZES.PADDING.MEDIUM,
    borderRadius: SIZES.RADIUS.MEDIUM,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.TEXT.SECONDARY,
  },
  modalButtonCancelText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
    fontWeight: '600',
  },
  modalButtonConfirm: {
    backgroundColor: COLORS.PRIMARY,
  },
  modalButtonConfirmText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
  },
});

export default OrderRestockDetailManagerScreen;


