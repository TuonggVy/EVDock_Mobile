import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { ArrowLeft, Edit } from 'lucide-react-native';
import { COLORS, SIZES } from '../../constants';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import orderRestockService from '../../services/orderRestockService';
import agencyService from '../../services/agencyService';
import UpdateStatusModal from './UpdateStatusModal';

const ACCENT_COLOR = '#009DFF';

const OrderRestockDetailScreen = ({ navigation, route }) => {
  const { orderId, onStatusUpdate } = route.params || {};
  const [order, setOrder] = useState(null);
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(true);
  // Cache for order item details (motorbike, warehouse, color names)
  const [orderItemDetails, setOrderItemDetails] = useState({});
  const [loadingItemDetails, setLoadingItemDetails] = useState({});
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const { alertConfig, hideAlert, showSuccess, showError, showConfirm } = useCustomAlert();

  const orderStatuses = [
    { key: 'PENDING', label: 'Pending', color: COLORS.WARNING },
    { key: 'APPROVED', label: 'Approved', color: COLORS.SUCCESS },
    { key: 'DELIVERED', label: 'Delivered', color: COLORS.PRIMARY },
    { key: 'COMPLETED', label: 'Completed', color: COLORS.SUCCESS },
    { key: 'CANCELED', label: 'Canceled', color: COLORS.ERROR },
  ];

  useEffect(() => {
    loadAgencies();
    loadOrderDetail();
  }, [orderId]);

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
      console.error('Error loading agencies:', error);
      // Don't show error, just fail silently
    }
  };

  const loadOrderItemDetail = async (orderItemId) => {
    // Check cache first
    if (orderItemDetails[orderItemId]) {
      return orderItemDetails[orderItemId];
    }

    // Check if already loading
    if (loadingItemDetails[orderItemId]) {
      return null;
    }

    try {
      setLoadingItemDetails(prev => ({ ...prev, [orderItemId]: true }));
      const response = await orderRestockService.getOrderItemDetail(orderItemId);
      
      if (response.success && response.data) {
        const detail = {
          motorbikeName: response.data.electricMotorbike?.name || null,
          warehouseName: response.data.warehouse?.name || null,
          colorName: response.data.color?.colorType || null,
        };
        
        // Cache the detail
        setOrderItemDetails(prev => ({
          ...prev,
          [orderItemId]: detail
        }));
        
        return detail;
      }
      return null;
    } catch (error) {
      console.error(`Error loading order item detail ${orderItemId}:`, error);
      return null;
    } finally {
      setLoadingItemDetails(prev => {
        const newState = { ...prev };
        delete newState[orderItemId];
        return newState;
      });
    }
  };

  const loadOrderDetail = async () => {
    try {
      setLoading(true);
      const response = await orderRestockService.getOrderRestockDetail(orderId);
      
      if (response.success) {
        setOrder(response.data);
        
        // Load details for all order items
        if (response.data.orderItems && response.data.orderItems.length > 0) {
          const itemDetailPromises = response.data.orderItems.map(item => 
            loadOrderItemDetail(item.id)
          );
          await Promise.all(itemDetailPromises);
        }
      } else {
        showError('Error', response.error || 'Cannot load order details');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading order detail:', error);
      showError('Error', 'Cannot load order details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const getAgencyInfo = () => {
    // First try to get from order.agency object (from API response)
    if (order?.agency) {
      return order.agency;
    }
    // Fallback to agencies list
    if (order?.agencyId) {
      const agency = agencies.find(a => 
        a.id === order.agencyId || 
        a.id?.toString() === order.agencyId?.toString()
      );
      if (agency) return agency;
    }
    // Return null if nothing found
    return null;
  };

  // Get the next status based on current status
  const getNextStatus = () => {
    // Don't show next status button for completed or canceled orders
    if (order?.status === 'CANCELED' || order?.status === 'COMPLETED') {
      return null;
    }

    const statusFlow = {
      'PENDING': 'APPROVED',
      'APPROVED': 'DELIVERED',
    };
    const nextStatus = statusFlow[order?.status] || null;
    
    // For DELIVERED status, check if all order items have warehouse
    if (nextStatus === 'DELIVERED') {
      if (!order?.orderItems || order.orderItems.length === 0) {
        return null;
      }
      // Check if all order items have warehouseId
      const allHaveWarehouse = order.orderItems.every(item => item.warehouseId != null);
      return allHaveWarehouse ? 'DELIVERED' : null;
    }
    
    return nextStatus;
  };

  const handleUpdateToNextStatus = () => {
    const nextStatus = getNextStatus();
    if (!nextStatus) {
      showError('Error', 'Cannot move to next status');
      return;
    }
    setShowStatusModal(true);
  };

  const handleStatusUpdateSuccess = async () => {
    await loadOrderDetail();
    if (onStatusUpdate) {
      onStatusUpdate();
    }
  };

  const handleCancelOrder = () => {
    setShowCancelModal(true);
  };

  const handleCancelOrderSuccess = async () => {
    await loadOrderDetail();
    if (onStatusUpdate) {
      onStatusUpdate();
    }
  };

  // Calculate total paid amount from order payments
  const getTotalPaidAmount = (order) => {
    if (!order) return 0;
    // First try paidAmount field if available
    if (order.paidAmount !== undefined && order.paidAmount !== null) {
      return order.paidAmount;
    }
    // Otherwise calculate from orderPayments array
    if (order.orderPayments && order.orderPayments.length > 0) {
      return order.orderPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    }
    return 0;
  };

  // Get total amount (final price) from order
  const getTotalAmount = (order) => {
    if (!order) return 0;
    return order.total || 0;
  };

  const getStatusColor = (status) => {
    const statusOption = orderStatuses.find(s => s.key === status);
    return statusOption ? statusOption.color : COLORS.TEXT.SECONDARY;
  };

  const getStatusLabel = (status) => {
    const statusOption = orderStatuses.find(s => s.key === status);
    return statusOption ? statusOption.label : status;
  };

  // Get status color for an order
  const getOrderStatusColor = (order) => {
    return getStatusColor(order?.status);
  };

  // Get status label for an order
  const getOrderStatusLabel = (order) => {
    return getStatusLabel(order?.status);
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#009DFF" />
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color={COLORS.TEXT.WHITE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={styles.headerActions} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Order Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={styles.statusTitle}>Order Status</Text>
            <View style={[styles.statusBadge, { backgroundColor: getOrderStatusColor(order) }]}>
              <Text style={styles.statusText}>{getOrderStatusLabel(order)}</Text>
            </View>
          </View>
        </View>

        {/* Order Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Information</Text>
          {renderInfoRow('Order ID', `#${order.id}`)}
          {renderInfoRow('Order Date', formatDate(order.orderAt))}
          {renderInfoRow('Quantity', `${order.itemQuantity || 0} units`)}
          {order.paidAmount !== undefined && renderInfoRow('Paid Amount', formatPrice(order.paidAmount))}
          {order.note && renderInfoRow('Note', order.note)}
        </View>

        {/* Agency Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Agency Information</Text>
          {(() => {
            const agencyInfo = getAgencyInfo();
            return (
              <>
                {renderInfoRow('Agency Name', agencyInfo?.name || `Agency #${order.agencyId}` || 'N/A')}
                {renderInfoRow('Location', agencyInfo?.location || 'N/A')}
                {renderInfoRow('Address', agencyInfo?.address || 'N/A')}
                {renderInfoRow('Agency ID', order.agencyId?.toString() || 'N/A')}
              </>
            );
          })()}
        </View>

        {/* Order Items */}
        {order.orderItems && order.orderItems.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order Items ({order.orderItems.length})</Text>
            {order.orderItems.map((item, index) => {
              const itemDetail = orderItemDetails[item.id];
              const isLoading = loadingItemDetails[item.id];
              
              return (
                <View key={item.id || index} style={styles.orderItemContainer}>
                  <Text style={styles.orderItemTitle}>Item #{index + 1}</Text>
                  {renderInfoRow('Quantity', `${item.quantity} units`)}
                  {renderInfoRow('Base Price', formatPrice(item.basePrice))}
                  {renderInfoRow('Wholesale Price', formatPrice(item.wholesalePrice))}
                  {renderInfoRow('Final Price', formatPrice(item.finalPrice))}
                  {renderInfoRow('Discount', formatPrice(item.discountTotal))}
                  {renderInfoRow('Promotion', formatPrice(item.promotionTotal))}
                  {renderInfoRow('Vehicle', itemDetail?.motorbikeName || (isLoading ? 'Loading...' : `ID: ${item.electricMotorbikeId?.toString() || 'N/A'}`))}
                  {renderInfoRow('Warehouse', itemDetail?.warehouseName || (isLoading ? 'Loading...' : `ID: ${item.warehouseId?.toString() || 'N/A'}`))}
                  {renderInfoRow('Color', itemDetail?.colorName || (isLoading ? 'Loading...' : `ID: ${item.colorId?.toString() || 'N/A'}`))}
                  {renderInfoRow('Price Policy ID', item.pricePolicyId?.toString() || 'N/A')}
                  {renderInfoRow('Discount ID', item.discountId?.toString() || 'N/A')}
                  {renderInfoRow('Promotion ID', item.promotionId?.toString() || 'N/A')}
                  <TouchableOpacity
                    style={styles.editItemButton}
                    onPress={() => navigation.navigate('UpdateWarehouseItem', {
                      orderItemId: item.id,
                      orderId: order.id,
                      onUpdate: () => {
                        loadOrderDetail();
                      }
                    })}
                  >
                    <Edit size={18} color={ACCENT_COLOR} />
                    <Text style={styles.editItemButtonText}>Update Warehouse Item</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        {/* Pricing Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pricing Summary</Text>
          {renderInfoRow('Total', formatPrice(order.total), { 
            color: COLORS.SUCCESS, 
            fontWeight: 'bold',
            fontSize: SIZES.FONT.MEDIUM 
          })}
          {order.paidAmount !== undefined && renderInfoRow('Paid Amount', formatPrice(order.paidAmount), {
            color: COLORS.PRIMARY,
            fontWeight: '600'
          })}
          {order.orderPayments && order.orderPayments.length > 0 && (
            <>
              {renderInfoRow('Total Payments', formatPrice(order.orderPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0)), {
                color: COLORS.SUCCESS,
                fontWeight: '600'
              })}
              {order.total && (
                renderInfoRow('Remaining', formatPrice(order.total - order.orderPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0)), {
                  color: order.total - order.orderPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0) > 0 ? COLORS.WARNING : COLORS.SUCCESS,
                  fontWeight: '600'
                })
              )}
            </>
          )}
        </View>

        {/* Order Payments */}
        {order.orderPayments && order.orderPayments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment History ({order.orderPayments.length})</Text>
            {[...order.orderPayments]
              .sort((a, b) => {
                // Sort by payAt date (newest first)
                const dateA = new Date(a.payAt || 0);
                const dateB = new Date(b.payAt || 0);
                return dateB - dateA;
              })
              .map((payment, index) => (
                <View key={payment.id || index} style={styles.paymentItemContainer}>
                  <Text style={styles.paymentItemTitle}>Payment #{index + 1}</Text>
                  {renderInfoRow('Invoice Number', payment.invoiceNumber || 'N/A')}
                  {renderInfoRow('Amount', formatPrice(payment.amount), {
                    color: COLORS.SUCCESS,
                    fontWeight: '600'
                  })}
                  {renderInfoRow('Payment Date', formatDate(payment.payAt))}
                  {payment.id && renderInfoRow('Payment ID', payment.id.toString())}
                </View>
              ))}
          </View>
        )}

        {/* Actions Section */}
        <View style={styles.actionsSection}>
          {getNextStatus() && (
            <TouchableOpacity
              style={[styles.actionButton, styles.nextStatusButton]}
              onPress={handleUpdateToNextStatus}
            >
              <Text style={styles.actionButtonText}>
                {getStatusLabel(getNextStatus())}
              </Text>
            </TouchableOpacity>
          )}
          
          {order.status !== 'CANCELED' && order.status !== 'DELIVERED' && order.status !== 'COMPLETED' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={handleCancelOrder}
            >
              <Text style={styles.cancelButtonText}>Cancel Order</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <UpdateStatusModal
        visible={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        orderId={orderId}
        currentStatus={order?.status}
        nextStatus={getNextStatus()}
        onSuccess={handleStatusUpdateSuccess}
      />

      <UpdateStatusModal
        visible={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        orderId={orderId}
        currentStatus={order?.status}
        nextStatus="CANCELED"
        onSuccess={handleCancelOrderSuccess}
        title="Cancel Order"
      />

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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.PADDING.LARGE,
    paddingTop: Platform.OS === 'ios' ? SIZES.PADDING.XLARGE : SIZES.PADDING.XXXLARGE,
    paddingBottom: SIZES.PADDING.MEDIUM,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
    flex: 1,
    textAlign: 'center',
  },
  headerActions: {
    width: 40,
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.SURFACE,
    borderTopLeftRadius: SIZES.RADIUS.XXLARGE,
    borderTopRightRadius: SIZES.RADIUS.XXLARGE,
    paddingTop: SIZES.PADDING.LARGE,
  },
  contentContainer: {
    padding: SIZES.PADDING.LARGE,
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
    color: COLORS.TEXT.PRIMARY,
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
  actionsSection: {
    paddingHorizontal: SIZES.PADDING.LARGE,
    paddingBottom: SIZES.PADDING.XXXLARGE,
    gap: SIZES.PADDING.MEDIUM,
  },
  actionButton: {
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  nextStatusButton: {
    backgroundColor: ACCENT_COLOR,
  },
  actionButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.ERROR,
  },
  cancelButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.ERROR,
    fontWeight: '600',
  },
  orderItemContainer: {
    marginBottom: SIZES.PADDING.MEDIUM,
    paddingBottom: SIZES.PADDING.MEDIUM,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  orderItemTitle: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: ACCENT_COLOR,
    marginBottom: SIZES.PADDING.SMALL,
  },
  editItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.PADDING.MEDIUM,
    marginTop: SIZES.PADDING.MEDIUM,
    borderRadius: SIZES.RADIUS.MEDIUM,
    backgroundColor: 'rgba(0,157,255,0.1)',
    borderWidth: 1,
    borderColor: ACCENT_COLOR,
    gap: SIZES.PADDING.SMALL,
  },
  editItemButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: ACCENT_COLOR,
    fontWeight: '600',
  },
  paymentItemContainer: {
    marginBottom: SIZES.PADDING.MEDIUM,
    paddingBottom: SIZES.PADDING.MEDIUM,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  paymentItemTitle: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: ACCENT_COLOR,
    marginBottom: SIZES.PADDING.SMALL,
  },
});

export default OrderRestockDetailScreen;
