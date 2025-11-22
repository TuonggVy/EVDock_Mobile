import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { COLORS, SIZES } from '../../constants';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import orderRestockManagerService from '../../services/orderRestockManagerService';
import agencyService from '../../services/agencyService';

const OrderRestockDetailManagerScreen = ({ navigation, route }) => {
  const { orderId, orderItemId, orderInfo, onStatusUpdate } = route.params || {};
  const [orderItems, setOrderItems] = useState([]); // All orderItems from order
  const [order, setOrder] = useState(orderInfo || null); // Order info from list or params
  const [agencies, setAgencies] = useState([]);
  const [agencyDetail, setAgencyDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');

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
      
      // Use orderInfo from params if available (contains all orderItems)
      if (orderInfo && orderInfo.id) {
        setOrder(orderInfo);
        // Set all orderItems from orderInfo
        if (Array.isArray(orderInfo.orderItems) && orderInfo.orderItems.length > 0) {
          // Fetch detailed info for each orderItem to get motorbike name and color name
          const itemsWithDetails = await Promise.all(
            orderInfo.orderItems.map(async (item) => {
              // If item already has nested objects, use it directly
              if (item.electricMotorbike && item.color) {
                return item;
              }
              // Otherwise, fetch detail for this item
              try {
                const response = await orderRestockManagerService.getOrderRestockDetail(item.id);
                if (response.success) {
                  return response.data; // This will have electricMotorbike and color nested objects
                }
                return item; // Fallback to original item if fetch fails
              } catch (error) {
                console.error(`Error fetching detail for item ${item.id}:`, error);
                return item; // Fallback to original item
              }
            })
          );
          
          setOrderItems(itemsWithDetails);
          console.log('📦 [OrderRestockDetailManager] Using orderInfo from params:', {
            orderId: orderInfo.id,
            status: orderInfo.status,
            itemQuantity: orderInfo.itemQuantity,
            total: orderInfo.total,
            orderItemsCount: itemsWithDetails.length
          });
        } else {
          // If orderInfo doesn't have orderItems, try to fetch first orderItem to get details
          if (orderItemId || orderInfo.orderItems?.[0]?.id) {
            const detailOrderItemId = orderItemId || orderInfo.orderItems?.[0]?.id;
            const response = await orderRestockManagerService.getOrderRestockDetail(detailOrderItemId);
            if (response.success) {
              setOrderItems([response.data]);
            }
          }
        }
      } else if (orderItemId) {
        // Fallback: fetch single orderItem if orderInfo not provided
        const response = await orderRestockManagerService.getOrderRestockDetail(orderItemId);
        if (response.success) {
          const orderItemDetail = response.data;
          setOrderItems([orderItemDetail]);
          // Try to get order info from orderId
          if (orderItemDetail.orderId && !order) {
            console.warn('⚠️ [OrderRestockDetailManager] Order info should be passed from list screen for orderId:', orderItemDetail.orderId);
          }
        } else {
          showError('Error', response.error || 'Unable to load order details');
          navigation.goBack();
          return;
        }
      } else {
        showError('Error', 'Order information not found');
        navigation.goBack();
        return;
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


  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#009DFF" />
        </View>
      </SafeAreaView>
    );
  }

  if (!order && orderItems.length === 0) {
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
          {renderInfoRow('Order ID', `#${order?.id || 'N/A'}`)}
          {order && order.orderAt && renderInfoRow('Order Date', formatDate(order.orderAt))}
          {order && order.itemQuantity && renderInfoRow('Item Quantity', `${order.itemQuantity} items`)}
          {order && renderInfoRow('Status', order.status || 'N/A')}
          {order && order.note && renderInfoRow('Note', order.note)}
          {order && order.total && renderInfoRow('Order Total', formatPrice(order.total || 0))}
          {order && order.paidAmount !== undefined && renderInfoRow('Paid Amount', formatPrice(order.paidAmount || 0))}
        </View>

        {/* Order Items List */}
        {orderItems.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order Items ({orderItems.length})</Text>
            {orderItems.map((item, index) => (
              <View key={item.id || index} style={styles.orderItemCard}>
                <Text style={styles.orderItemTitle}>Item #{index + 1}</Text>
                
                <View style={styles.orderItemContent}>
                  <View style={styles.orderItemRow}>
                    <Text style={styles.orderItemLabel}>Order Item ID:</Text>
                    <Text style={styles.orderItemValue}>#{item.id}</Text>
                  </View>
                  
                  <View style={styles.orderItemRow}>
                    <Text style={styles.orderItemLabel}>Vehicle:</Text>
                    <Text style={styles.orderItemValue}>
                      {item.electricMotorbike?.name || 'Loading...'}
                    </Text>
                  </View>
                  
                  <View style={styles.orderItemRow}>
                    <Text style={styles.orderItemLabel}>Color:</Text>
                    <Text style={styles.orderItemValue}>
                      {item.color?.colorType || 'Loading...'}
                    </Text>
                  </View>
                  
                  <View style={styles.orderItemRow}>
                    <Text style={styles.orderItemLabel}>Quantity:</Text>
                    <Text style={styles.orderItemValue}>{item.quantity} units</Text>
                  </View>
                  
                  <View style={styles.orderItemRow}>
                    <Text style={styles.orderItemLabel}>Base Price:</Text>
                    <Text style={styles.orderItemValue}>{formatPrice(item.basePrice || 0)}</Text>
                  </View>
                  
                  <View style={styles.orderItemRow}>
                    <Text style={styles.orderItemLabel}>Wholesale Price:</Text>
                    <Text style={styles.orderItemValue}>{formatPrice(item.wholesalePrice || 0)}</Text>
                  </View>
                  
                  {item.discountTotal > 0 && (
                    <View style={styles.orderItemRow}>
                      <Text style={styles.orderItemLabel}>Discount Total:</Text>
                      <Text style={[styles.orderItemValue, { color: COLORS.ERROR }]}>
                        -{formatPrice(item.discountTotal || 0)}
                      </Text>
                    </View>
                  )}
                  
                  {item.promotionTotal > 0 && (
                    <View style={styles.orderItemRow}>
                      <Text style={styles.orderItemLabel}>Promotion Total:</Text>
                      <Text style={[styles.orderItemValue, { color: COLORS.SUCCESS }]}>
                        -{formatPrice(item.promotionTotal || 0)}
                      </Text>
                    </View>
                  )}
                  
                  <View style={styles.orderItemRow}>
                    <Text style={[styles.orderItemLabel, { fontWeight: 'bold' }]}>Final Price:</Text>
                    <Text style={[styles.orderItemValue, { fontWeight: 'bold', color: COLORS.PRIMARY }]}>
                      {formatPrice(item.finalPrice || 0)}
                    </Text>
                  </View>
                  
                  {item.pricePolicyId && (
                    <View style={styles.orderItemRow}>
                      <Text style={styles.orderItemLabel}>Price Policy ID:</Text>
                      <Text style={styles.orderItemValue}>#{item.pricePolicyId}</Text>
                    </View>
                  )}
                  
                  {item.discountId && (
                    <View style={styles.orderItemRow}>
                      <Text style={styles.orderItemLabel}>Discount ID:</Text>
                      <Text style={styles.orderItemValue}>
                        {item.discountPolicy?.name || `#${item.discountId}`}
                      </Text>
                    </View>
                  )}
                  
                  {item.promotionId && (
                    <View style={styles.orderItemRow}>
                      <Text style={styles.orderItemLabel}>Promotion ID:</Text>
                      <Text style={styles.orderItemValue}>
                        {item.promotion?.name || `#${item.promotionId}`}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}


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
    paddingBottom: 120,
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
    color: "#009DFF",
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
    backgroundColor: "#009DFF",
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
    borderColor: "#009DFF",
  },
  deleteActionButtonText: {
    color: "#FFFFFF",
  },
  orderItemCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
    marginBottom: SIZES.PADDING.MEDIUM,
    borderWidth: 1,
    borderColor: COLORS.BORDER.PRIMARY,
  },
  orderItemTitle: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SIZES.PADDING.SMALL,
    paddingBottom: SIZES.PADDING.SMALL,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER.PRIMARY,
  },
  orderItemContent: {
    gap: SIZES.PADDING.XSMALL,
  },
  orderItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  orderItemLabel: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    flex: 1,
  },
  orderItemValue: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
});

export default OrderRestockDetailManagerScreen;


