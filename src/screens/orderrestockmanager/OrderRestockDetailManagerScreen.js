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
  Modal,
  TextInput,
} from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { COLORS, SIZES } from '../../constants';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import orderRestockManagerService from '../../services/orderRestockManagerService';
import agencyService from '../../services/agencyService';
import { useAuth } from '../../contexts/AuthContext';

const OrderRestockDetailManagerScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const { orderId, orderItemId, orderInfo, onStatusUpdate } = route.params || {};
  const [orderItems, setOrderItems] = useState([]); // All orderItems from order
  const [order, setOrder] = useState(orderInfo || null); // Order info from list or params
  const [agencies, setAgencies] = useState([]);
  const [agencyDetail, setAgencyDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');

  const { alertConfig, hideAlert, showSuccess, showError, showConfirm } = useCustomAlert();

  const orderStatuses = [
    { key: 'DRAFT', label: 'Draft', color: COLORS.TEXT.SECONDARY },
    { key: 'PENDING', label: 'Pending', color: COLORS.WARNING },
    { key: 'APPROVED', label: 'Approved', color: COLORS.SUCCESS },
    { key: 'DELIVERED', label: 'Delivered', color: COLORS.PRIMARY },
    { key: 'COMPLETED', label: 'Completed', color: COLORS.SUCCESS },
    { key: 'CANCELED', label: 'Canceled', color: COLORS.ERROR },
  ];

  useEffect(() => {
    loadAgencies();
    loadOrderDetail();
  }, [orderItemId || orderId]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('🔄 [OrderRestockDetailManager] Screen focused, refreshing data...');
      loadAgencies();
      loadOrderDetail();
    });

    return unsubscribe;
  }, [navigation, orderId]);

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

  // Calculate total paid amount from order
  const getTotalPaidAmount = (order) => {
    if (!order) return 0;
    // First, try to calculate from orderPayments array (most accurate)
    if (order.orderPayments && Array.isArray(order.orderPayments) && order.orderPayments.length > 0) {
      const totalFromPayments = order.orderPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
      return totalFromPayments;
    }
    // Fallback to paidAmount field if available
    if (order.paidAmount !== undefined && order.paidAmount !== null) {
      return order.paidAmount;
    }
    // Otherwise try agencyBill paidAmount
    if (order.agencyBill?.paidAmount !== undefined && order.agencyBill?.paidAmount !== null) {
      return order.agencyBill.paidAmount;
    }
    return 0;
  };

  // Get total amount (final price) from order
  const getTotalAmount = (order) => {
    if (!order) return 0;
    // First try total field
    if (order.total !== undefined && order.total !== null) {
      return order.total;
    }
    // Otherwise try agencyBill amount
    if (order.agencyBill?.amount !== undefined && order.agencyBill?.amount !== null) {
      return order.agencyBill.amount;
    }
    return 0;
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

  const handlePayment = () => {
    if (!order || !order.id) {
      showError('Error', 'Order information not found');
      return;
    }

    // Get max amount (order total or agency bill amount)
    const maxAmount = order.total || order.agencyBill?.amount || 0;
    setPaymentAmount(maxAmount > 0 ? String(maxAmount) : '');
    setShowPaymentModal(true);
  };

  const processPayment = async () => {
    if (!order || !order.id) {
      showError('Error', 'Order information not found');
      return;
    }

    // Get orderId as number
    const orderId = parseInt(order.id, 10);
    if (!orderId || isNaN(orderId)) {
      showError('Error', 'Invalid order ID');
      return;
    }

    // Validate and get amount as number
    const amountValue = parseFloat(paymentAmount.replace(/,/g, ''));
    if (!paymentAmount || isNaN(amountValue) || amountValue <= 0) {
      showError('Error', 'Please enter a valid payment amount');
      return;
    }

    const maxAmount = order.total || order.agencyBill?.amount || 0;
    if (amountValue > maxAmount) {
      showError('Error', `Payment amount cannot exceed ${formatPrice(maxAmount)}`);
      return;
    }

    const amount = parseInt(amountValue, 10);

    setShowPaymentModal(false);
    setProcessingPayment(true);

    try {
      console.log('💳 [Payment] Starting payment process with request body:', {
        orderId,
        amount,
        orderIdType: typeof orderId,
        amountType: typeof amount
      });

      const response = await orderRestockManagerService.getVNPayPaymentUrl(orderId, amount);
      
      console.log('💳 [Payment] API Response:', {
        success: response.success,
        hasPaymentUrl: !!response.paymentUrl,
        paymentUrl: response.paymentUrl,
        error: response.error,
        data: response.data
      });
      
      if (response.success && response.paymentUrl) {
        const paymentUrl = response.paymentUrl;
        console.log('💳 [Payment] Attempting to open URL:', paymentUrl);
        
        // Check if URL can be opened
        const canOpen = await Linking.canOpenURL(paymentUrl);
        console.log('💳 [Payment] Can open URL:', canOpen);
        
        if (canOpen) {
          const opened = await Linking.openURL(paymentUrl);
          console.log('💳 [Payment] URL opened:', opened);
          showSuccess('Success', 'Opening payment page...');
          
          // Refresh order data after a delay to get updated payment information
          setTimeout(async () => {
            console.log('🔄 [Payment] Refreshing order data after payment...');
            
            // Try to reload order from list API to get updated paidAmount
            if (user?.agencyId && orderId) {
              try {
                const response = await orderRestockManagerService.getOrderRestockListByAgency(
                  parseInt(user.agencyId),
                  { page: 1, limit: 1000 }
                );
                if (response.success && response.data) {
                  const updatedOrder = response.data.find(o => o.id === orderId);
                  if (updatedOrder) {
                    console.log('✅ [Payment] Found updated order from API:', {
                      orderId: updatedOrder.id,
                      paidAmount: updatedOrder.paidAmount,
                      agencyBillPaidAmount: updatedOrder.agencyBill?.paidAmount,
                      orderTotal: updatedOrder.total,
                      agencyBillAmount: updatedOrder.agencyBill?.amount,
                      previousPaidAmount: order.paidAmount || order.agencyBill?.paidAmount || 0,
                      fullOrder: JSON.stringify(updatedOrder, null, 2)
                    });
                    
                    // Check if paidAmount is being accumulated correctly
                    const previousPaid = order.paidAmount || order.agencyBill?.paidAmount || 0;
                    const newPaid = updatedOrder.paidAmount || updatedOrder.agencyBill?.paidAmount || 0;
                    
                    if (newPaid < previousPaid) {
                      console.error('⚠️ [Payment] WARNING: New paidAmount is LESS than previous! This suggests Backend is not accumulating payments correctly.', {
                        previousPaid,
                        newPaid,
                        difference: previousPaid - newPaid
                      });
                    }
                    
                    setOrder(updatedOrder);
                  }
                }
              } catch (error) {
                console.error('⚠️ [Payment] Error reloading order from list:', error);
                // Fallback to loadOrderDetail
                loadOrderDetail();
              }
            } else {
              loadOrderDetail();
            }
            
            if (onStatusUpdate) {
              onStatusUpdate();
            }
          }, 3000);
        } else {
          console.error('💳 [Payment] Cannot open URL');
          showError('Error', 'Cannot open payment URL. Please check your browser settings.');
        }
      } else {
        const errorMsg = response.error || 'Unable to get payment URL';
        console.error('💳 [Payment] Error:', errorMsg);
        showError('Error', errorMsg);
      }
    } catch (error) {
      console.error('💳 [Payment] Exception:', error);
      console.error('💳 [Payment] Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      showError('Error', error.response?.data?.message || error.message || 'Unable to process payment');
    } finally {
      setProcessingPayment(false);
    }
  };

  const renderStatusModal = () => null;

  const formatAmountInput = (text) => {
    // Remove all non-numeric characters except decimal point
    const numericValue = text.replace(/[^0-9]/g, '');
    return numericValue;
  };

  const renderPaymentModal = () => {
    const maxAmount = order?.total || order?.agencyBill?.amount || 0;
    
    return (
      <Modal
        visible={showPaymentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter Payment Amount</Text>
            
            <View style={styles.modalInfo}>
              <Text style={styles.modalInfoLabel}>Order Total:</Text>
              <Text style={styles.modalInfoValue}>{formatPrice(maxAmount)}</Text>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Amount (VND) *</Text>
              <TextInput
                style={styles.textInput}
                value={paymentAmount}
                onChangeText={(text) => {
                  const formatted = formatAmountInput(text);
                  setPaymentAmount(formatted);
                }}
                placeholder="Enter payment amount"
                placeholderTextColor={COLORS.TEXT.SECONDARY}
                keyboardType="numeric"
                autoFocus
              />
              {paymentAmount && !isNaN(parseFloat(paymentAmount.replace(/,/g, ''))) && (
                <Text style={styles.amountPreview}>
                  {formatPrice(parseFloat(paymentAmount.replace(/,/g, '')))}
                </Text>
              )}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => {
                  setShowPaymentModal(false);
                  setPaymentAmount('');
                }}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={processPayment}
                disabled={processingPayment || !paymentAmount}
              >
                {processingPayment ? (
                  <ActivityIndicator color={COLORS.TEXT.WHITE} />
                ) : (
                  <Text style={styles.modalConfirmButtonText}>Pay</Text>
                )}
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
          {order && renderInfoRow('Status', getOrderStatusLabel(order) || 'N/A', {
            color: getOrderStatusColor(order),
            fontWeight: '600'
          })}
          {order && order.note && renderInfoRow('Note', order.note)}
          {order && order.total && renderInfoRow('Order Total', formatPrice(order.total || 0))}
          {(() => {
            // NOTE: paidAmount should be accumulated total from ALL payments, not just the last payment
            // ⚠️ BACKEND ISSUE: Currently Backend returns only the last payment amount instead of accumulated total
            // TODO: Backend needs to fix: paidAmount should be sum of all payment transactions for this order/agencyBill
            // Frontend just displays what Backend returns - we don't calculate/sum here as it's Backend's responsibility
            
            const paidAmount = order.paidAmount || order.agencyBill?.paidAmount || 0;
            const totalAmount = order.total || order.agencyBill?.amount || 0;
            
            console.log('💰 [Display] Paid Amount Calculation:', {
              orderPaidAmount: order.paidAmount,
              agencyBillPaidAmount: order.agencyBill?.paidAmount,
              calculatedPaidAmount: paidAmount,
              orderTotal: order.total,
              agencyBillAmount: order.agencyBill?.amount,
              calculatedTotal: totalAmount,
              remaining: totalAmount - paidAmount,
              note: 'paidAmount should be accumulated total from all payments - if wrong, this is a Backend issue'
            });
            
            return (paidAmount > 0) ? (
              <>
                {renderInfoRow('Paid Amount', formatPrice(paidAmount), {
                  color: COLORS.SUCCESS,
                  fontWeight: 'bold'
                })}
                {totalAmount > 0 && paidAmount < totalAmount && (
                  renderInfoRow('Remaining Amount', formatPrice(totalAmount - paidAmount), {
                    color: COLORS.WARNING
                  })
                )}
              </>
            ) : null;
          })()}
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

        {/* Payment History */}
        {order && order.orderPayments && order.orderPayments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment History ({order.orderPayments.length})</Text>
            {(() => {
              // Calculate total from orderPayments
              const totalPayments = order.orderPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
              
              return (
                <>
                  {renderInfoRow('Total Payments', formatPrice(totalPayments), {
                    color: COLORS.SUCCESS,
                    fontWeight: 'bold'
                  })}
                  {order.total && (
                    renderInfoRow('Remaining', formatPrice(order.total - totalPayments), {
                      color: order.total - totalPayments > 0 ? COLORS.WARNING : COLORS.SUCCESS,
                      fontWeight: '600'
                    })
                  )}
                </>
              );
            })()}
            {[...order.orderPayments]
              .sort((a, b) => {
                // Sort by payment id (newest first - highest id = most recent)
                // If id is not available, fallback to payAt date
                if (a.id && b.id) {
                  return b.id - a.id;
                }
                // Fallback to payAt date (newest first)
                const dateA = new Date(a.payAt || 0);
                const dateB = new Date(b.payAt || 0);
                return dateB - dateA;
              })
              .map((payment, index) => (
                <View key={payment.id || index} style={styles.paymentItemContainer}>
                  <Text style={styles.paymentItemTitle}>Payment #{payment.id || index + 1}</Text>
                  {renderInfoRow('Invoice Number', payment.invoiceNumber || 'N/A')}
                  {renderInfoRow('Amount', formatPrice(payment.amount), {
                    color: COLORS.SUCCESS,
                    fontWeight: '600'
                  })}
                  {renderInfoRow('Payment Date', formatDate(payment.payAt))}
                </View>
              ))}
          </View>
        )}

        {order && order.agencyBill && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bill Information</Text>
            {renderInfoRow('Bill ID', `#${order.agencyBill.id || 'N/A'}`)}
            {renderInfoRow('Amount', formatPrice(order.agencyBill.amount))}
            {order.agencyBill.paidAmount !== undefined && order.agencyBill.paidAmount > 0 && (
              renderInfoRow('Paid Amount', formatPrice(order.agencyBill.paidAmount), {
                color: COLORS.SUCCESS,
                fontWeight: 'bold'
              })
            )}
            {order.agencyBill.amount && order.agencyBill.paidAmount !== undefined && order.agencyBill.paidAmount < order.agencyBill.amount && (
              renderInfoRow('Remaining Amount', formatPrice(order.agencyBill.amount - (order.agencyBill.paidAmount || 0)), {
                color: COLORS.WARNING
              })
            )}
            {renderInfoRow('Payment Type', order.agencyBill.type === 'FULL' ? 'Full Payment' : 'Deferred Payment')}
            {renderInfoRow('Created Date', formatDate(order.agencyBill.createAt))}
            {order.agencyBill.paidAt && renderInfoRow('Paid Date', formatDate(order.agencyBill.paidAt))}
            {renderInfoRow('Status', order.agencyBill.isCompleted ? 'Completed' : 'Pending', {
              color: order.agencyBill.isCompleted ? COLORS.SUCCESS : COLORS.WARNING
            })}
          </View>
        )}
      </ScrollView>

      {order && (() => {
        return (
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
            ) : order.status === 'DELIVERED' && order.status !== 'COMPLETED' ? (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handlePayment}
                disabled={processingPayment}
              >
                {processingPayment ? (
                  <ActivityIndicator color={COLORS.TEXT.WHITE} />
                ) : (
                  <Text style={styles.actionButtonText}>Pay</Text>
                )}
              </TouchableOpacity>
            ) : null}
          </View>
        );
      })()}

      {renderStatusModal()}
      {renderPaymentModal()}

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
  paymentItemContainer: {
    marginBottom: SIZES.PADDING.MEDIUM,
    paddingBottom: SIZES.PADDING.MEDIUM,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  paymentItemTitle: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: "#009DFF",
    marginBottom: SIZES.PADDING.SMALL,
  },
  // Payment Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
    borderTopLeftRadius: SIZES.RADIUS.LARGE,
    borderTopRightRadius: SIZES.RADIUS.LARGE,
    padding: SIZES.PADDING.LARGE,
    paddingBottom: Platform.OS === 'ios' ? SIZES.PADDING.XXXLARGE : SIZES.PADDING.LARGE,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
    marginBottom: SIZES.PADDING.MEDIUM,
    textAlign: 'center',
  },
  modalInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.SURFACE,
    padding: SIZES.PADDING.MEDIUM,
    borderRadius: SIZES.RADIUS.MEDIUM,
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  modalInfoLabel: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
  },
  modalInfoValue: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
  },
  inputGroup: {
    marginBottom: SIZES.PADDING.LARGE,
  },
  inputLabel: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.WHITE,
    marginBottom: SIZES.PADDING.SMALL,
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.MEDIUM,
    fontSize: SIZES.FONT.LARGE,
    color: COLORS.TEXT.PRIMARY,
    borderWidth: 1,
    borderColor: COLORS.BORDER.PRIMARY,
  },
  amountPreview: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    marginTop: SIZES.PADDING.XSMALL,
    fontStyle: 'italic',
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
    justifyContent: 'center',
  },
  modalCancelButton: {
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1,
    borderColor: COLORS.BORDER.PRIMARY,
  },
  modalCancelButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '600',
  },
  modalConfirmButton: {
    backgroundColor: "#009DFF",
  },
  modalConfirmButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
  },
});

export default OrderRestockDetailManagerScreen;


