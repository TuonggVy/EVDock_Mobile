import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from 'react-native';
import { COLORS, SIZES } from '../../constants';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import orderRestockService from '../../services/orderRestockService';
import agencyService from '../../services/agencyService';

const OrderRestockDetailScreen = ({ navigation, route }) => {
  const { orderId, onStatusUpdate } = route.params || {};
  const [order, setOrder] = useState(null);
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(true);
  // Cache for order item details (motorbike, warehouse, color names)
  const [orderItemDetails, setOrderItemDetails] = useState({});
  const [loadingItemDetails, setLoadingItemDetails] = useState({});

  const { alertConfig, hideAlert, showSuccess, showError, showConfirm } = useCustomAlert();

  const orderStatuses = [
    { key: 'PENDING', label: 'Pending', color: COLORS.WARNING },
    { key: 'APPROVED', label: 'Approved', color: COLORS.SUCCESS },
    { key: 'DELIVERED', label: 'Delivered', color: COLORS.PRIMARY },
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
    if (!order?.agencyId) return null;
    // First try to get from agencies list
    const agency = agencies.find(a => 
      a.id === order.agencyId || 
      a.id?.toString() === order.agencyId?.toString()
    );
    // If found, return it
    if (agency) return agency;
    // Otherwise, check if agencyBill is in order response
    if (order.agencyBill) return order.agencyBill;
    // Return null if nothing found
    return null;
  };

  // Get the next status based on current status
  const getNextStatus = () => {
    const statusFlow = {
      'PENDING': 'APPROVED',
      'APPROVED': 'DELIVERED',
    };
    return statusFlow[order?.status] || null;
  };

  const handleUpdateToNextStatus = () => {
    const nextStatus = getNextStatus();
    if (!nextStatus) {
      showError('Error', 'Cannot move to next status');
      return;
    }

    showConfirm(
      'Confirm Update',
      `Are you sure you want to change order from "${getStatusLabel(order.status)}" to "${getStatusLabel(nextStatus)}"?`,
      async () => {
        try {
          const response = await orderRestockService.updateOrderRestockStatus(orderId, nextStatus);
          if (response.success) {
            setOrder(response.data);
            // Reload order item details if orderItems exist
            if (response.data.orderItems && response.data.orderItems.length > 0) {
              const itemDetailPromises = response.data.orderItems.map(item => 
                loadOrderItemDetail(item.id)
              );
              await Promise.all(itemDetailPromises);
            }
            showSuccess('Success', 'Status updated successfully!');
            // Trigger refresh on parent screen immediately
            if (onStatusUpdate) {
              onStatusUpdate();
            }
          } else {
            showError('Error', response.error || 'Cannot update status');
          }
        } catch (error) {
          console.error('Error updating status:', error);
          showError('Error', 'Cannot update status');
        }
      }
    );
  };

  const handleCheckCredit = () => {
    showConfirm(
      'Confirm Check Credit',
      `Are you sure you want to check credit for order #${order.id}?`,
      async () => {
        try {
          const response = await orderRestockService.checkOrderCredit(orderId);
          if (response.success) {
            setOrder(response.data);
            // Reload order item details if orderItems exist
            if (response.data.orderItems && response.data.orderItems.length > 0) {
              const itemDetailPromises = response.data.orderItems.map(item => 
                loadOrderItemDetail(item.id)
              );
              await Promise.all(itemDetailPromises);
            }
            showSuccess('Success', 'Credit checked successfully!');
            // Trigger refresh on parent screen immediately
            if (onStatusUpdate) {
              onStatusUpdate();
            }
          } else {
            showError('Error', response.error || 'Cannot check credit');
          }
        } catch (error) {
          console.error('Error checking credit:', error);
          showError('Error', 'Cannot check credit');
        }
      }
    );
  };

  const handleCancelOrder = () => {
    showConfirm(
      'Confirm Cancel Order',
      `Are you sure you want to cancel order #${order.id}?`,
      async () => {
        try {
          const response = await orderRestockService.updateOrderRestockStatus(orderId, 'CANCELED');
          if (response.success) {
            setOrder(response.data);
            // Reload order item details if orderItems exist
            if (response.data.orderItems && response.data.orderItems.length > 0) {
              const itemDetailPromises = response.data.orderItems.map(item => 
                loadOrderItemDetail(item.id)
              );
              await Promise.all(itemDetailPromises);
            }
            showSuccess('Success', 'Order canceled successfully!');
            // Trigger refresh on parent screen immediately
            if (onStatusUpdate) {
              onStatusUpdate();
            }
          } else {
            showError('Error', response.error || 'Cannot cancel order');
          }
        } catch (error) {
          console.error('Error canceling order:', error);
          showError('Error', 'Cannot cancel order');
        }
      }
    );
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
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
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={styles.placeholder} />
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
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
              <Text style={styles.statusText}>{getStatusLabel(order.status)}</Text>
            </View>
          </View>
        </View>

        {/* Order Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Information</Text>
          {renderInfoRow('Order ID', `#${order.id}`)}
          {renderInfoRow('Order Date', formatDate(order.orderAt))}
          {renderInfoRow('Quantity', `${order.itemQuantity || 0} units`)}
          {renderInfoRow('Order Type', order.orderType || 'N/A')}
          {renderInfoRow('Credit Checked', order.creditChecked ? 'Yes' : 'No')}
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
                </View>
              );
            })}
          </View>
        )}

        {/* Pricing Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pricing Summary</Text>
          {renderInfoRow('Total', formatPrice(order.subtotal), { 
            color: COLORS.SUCCESS, 
            fontWeight: 'bold',
            fontSize: SIZES.FONT.MEDIUM 
          })}
        </View>
      </ScrollView>

      {/* Fixed Actions Bar */}
      <View style={styles.fixedActionsContainer}>
        <View style={styles.actionsRow}>
          {order.status === 'PENDING' && !order.creditChecked && (
            <TouchableOpacity
              style={[styles.actionButton, styles.checkCreditButton]}
              onPress={handleCheckCredit}
            >
              <Text style={styles.actionButtonText}>Check Credit</Text>
            </TouchableOpacity>
          )}
          
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
          
          {order.status !== 'CANCELED' && order.status !== 'DELIVERED' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={handleCancelOrder}
            >
              <Text style={styles.cancelButtonText}>Cancel Order</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

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
  backIcon: {
    fontSize: SIZES.FONT.LARGE,
    color: COLORS.TEXT.WHITE,
    fontWeight: 'bold',
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
    paddingBottom: 100, // Space for fixed action buttons
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: SIZES.PADDING.MEDIUM,
  },
  actionButton: {
    flex: 1,
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextStatusButton: {
    backgroundColor: COLORS.PRIMARY,
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
  checkCreditButton: {
    backgroundColor: COLORS.WARNING,
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
    color: COLORS.PRIMARY,
    marginBottom: SIZES.PADDING.SMALL,
  },
});

export default OrderRestockDetailScreen;
