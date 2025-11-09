import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  TextInput,
  RefreshControl,
} from 'react-native';
import { COLORS, SIZES } from '../../constants';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import orderRestockService from '../../services/orderRestockService';
import agencyService from '../../services/agencyService';
import { ArrowLeft, Search, Package } from 'lucide-react-native';

const ACCENT_COLOR = '#009DFF';

const OrderRestockManagementScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [agencies, setAgencies] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [paginationInfo, setPaginationInfo] = useState({
    page: 1,
    limit: 1000,
    total: 0
  });
  // Cache for order details (warehouse and motorbike names)
  const [orderDetailsCache, setOrderDetailsCache] = useState({});
  const [loadingDetails, setLoadingDetails] = useState({});

  const { alertConfig, hideAlert, showSuccess, showError, showConfirm } = useCustomAlert();

  const orderStatuses = [
    { key: 'all', label: 'All', color: COLORS.TEXT.SECONDARY },
    { key: 'PENDING', label: 'Pending', color: COLORS.WARNING },
    { key: 'APPROVED', label: 'Approved', color: COLORS.SUCCESS },
    { key: 'DELIVERED', label: 'Delivered', color: ACCENT_COLOR },
    { key: 'CANCELED', label: 'Canceled', color: COLORS.ERROR },
  ];

  useEffect(() => {
    loadAgencies();
    loadOrders();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Check if we need to refresh after returning from detail screen
      const refresh = navigation.getState()?.routes?.find(r => r.name === 'OrderRestockManagement')?.params?.refresh;
      if (refresh) {
        loadOrders();
        // Clear the refresh flag
        navigation.setParams({ refresh: false });
      } else {
        // Always refresh when screen comes into focus
        loadOrders();
      }
    });

    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    filterOrders();
  }, [searchQuery, selectedStatus, orders, orderDetailsCache]);

  const loadOrderDetail = async (orderId) => {
    // Check cache first
    if (orderDetailsCache[orderId]) {
      return orderDetailsCache[orderId];
    }

    // Check if already loading
    if (loadingDetails[orderId]) {
      return null;
    }

    try {
      setLoadingDetails(prev => ({ ...prev, [orderId]: true }));
      
      // First, get order detail to find orderItemId
      const orderResponse = await orderRestockService.getOrderRestockDetail(orderId);
      
      if (orderResponse.success && orderResponse.data) {
        const firstItem = orderResponse.data.orderItems?.[0];
        const orderItemId = firstItem?.id;
        
        if (!orderItemId) {
          // No order item found, return null
          return null;
        }
        
        // Get order item detail to get full warehouse and motorbike info
        const itemDetailResponse = await orderRestockService.getOrderItemDetail(orderItemId);
        
        if (itemDetailResponse.success && itemDetailResponse.data) {
          const detail = {
            warehouseName: itemDetailResponse.data.warehouse?.name || null,
            motorbikeName: itemDetailResponse.data.electricMotorbike?.name || null,
          };
          
          // Cache the detail
          setOrderDetailsCache(prev => ({
            ...prev,
            [orderId]: detail
          }));
          
          return detail;
        }
      }
      return null;
    } catch (error) {
      console.error(`Error loading order detail ${orderId}:`, error);
      return null;
    } finally {
      setLoadingDetails(prev => {
        const newState = { ...prev };
        delete newState[orderId];
        return newState;
      });
    }
  };

  const loadOrders = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 1000,
      };
      
      if (selectedStatus !== 'all') {
        params.status = selectedStatus;
      }

      const response = await orderRestockService.getOrderRestockList(params);
      
      if (response.success) {
        const ordersList = response.data || [];
        // Filter out DRAFT orders
        const nonDraftOrders = ordersList.filter(order => order.status !== 'DRAFT');
        // Sort by orderAt (most recent first)
        const sortedOrders = nonDraftOrders.sort((a, b) => {
          const dateA = new Date(a.orderAt || a.createdAt || 0);
          const dateB = new Date(b.orderAt || b.createdAt || 0);
          return dateB - dateA; // Descending order (newest first)
        });
        setOrders(sortedOrders);
        setPaginationInfo(response.paginationInfo || { page: 1, limit: 1000, total: sortedOrders.length });
        
        // Load details for all orders in parallel
        const detailPromises = sortedOrders.map(order => loadOrderDetail(order.id));
        await Promise.all(detailPromises);
      } else {
        showError('Error', response.error || 'Cannot load order list');
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      showError('Error', 'Cannot load order list');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadAgencies = async () => {
    try {
      const response = await agencyService.getAgencies();
      if (response.success) {
        setAgencies(response.data || []);
      }
    } catch (error) {
      console.error('Error loading agencies:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Clear cache to force reload of details
    setOrderDetailsCache({});
    await loadAgencies();
    await loadOrders();
  };

  const getAgencyName = (agencyId) => {
    if (!agencyId) return 'N/A';
    const agency = agencies.find(a => a.id === agencyId || a.id?.toString() === agencyId?.toString());
    return agency?.name || `Agency #${agencyId}`;
  };

  const getWarehouseName = (order) => {
    // First check cache
    const cachedDetail = orderDetailsCache[order.id];
    if (cachedDetail?.warehouseName) {
      return cachedDetail.warehouseName;
    }
    // Fallback to order data if available
    return order.warehouse?.name || 'Loading...';
  };

  const getMotorbikeName = (order) => {
    // First check cache
    const cachedDetail = orderDetailsCache[order.id];
    if (cachedDetail?.motorbikeName) {
      return cachedDetail.motorbikeName;
    }
    // Fallback to order data if available
    return order.electricMotorbike?.name || 'Loading...';
  };

  const filterOrders = () => {
    // First filter out DRAFT orders
    let filtered = orders.filter(order => order.status !== 'DRAFT');

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order => {
        const motorbikeName = getMotorbikeName(order).toLowerCase();
        const warehouseName = getWarehouseName(order).toLowerCase();
        return (
          order.id?.toString().toLowerCase().includes(query) ||
          motorbikeName.includes(query) ||
          warehouseName.includes(query) ||
          getAgencyName(order.agencyId).toLowerCase().includes(query)
        );
      });
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(order => order.status === selectedStatus);
    }

    setFilteredOrders(filtered);
  };

  const handleStatusFilter = async (status) => {
    setSelectedStatus(status);
    await loadOrders(1);
  };

  const handleViewOrder = (order) => {
    navigation.navigate('OrderRestockDetail', { 
      orderId: order.id,
      onStatusUpdate: () => {
        // Refresh orders when status is updated
        loadOrders();
      }
    });
  };

  // Get the next status based on current status
  const getNextStatus = (order) => {
    const statusFlow = {
      'PENDING': 'APPROVED',
      'APPROVED': 'DELIVERED',
    };
    return statusFlow[order?.status] || null;
  };

  const handleUpdateToNextStatus = (order) => {
    const nextStatus = getNextStatus(order);
    if (!nextStatus) {
      showError('Error', 'Cannot move to next status');
      return;
    }

    showConfirm(
      'Confirm Update',
      `Are you sure you want to change order #${order.id} from "${getStatusLabel(order.status)}" to "${getStatusLabel(nextStatus)}"?`,
      async () => {
        try {
          const response = await orderRestockService.updateOrderRestockStatus(order.id, nextStatus);
          if (response.success) {
            showSuccess('Success', 'Status updated successfully!');
            loadOrders();
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

  const handleCancelOrder = (order) => {
    showConfirm(
      'Confirm Cancel Order',
      `Are you sure you want to cancel order #${order.id}?`,
      async () => {
        try {
          const response = await orderRestockService.updateOrderRestockStatus(order.id, 'CANCELED');
          if (response.success) {
            showSuccess('Success', 'Order canceled successfully!');
            loadOrders();
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
      day: '2-digit'
    });
  };

  const renderOrderCard = (order) => (
    <TouchableOpacity
      key={order.id}
      style={styles.orderCard}
      onPress={() => handleViewOrder(order)}
    >
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderId}>Order #{order.id}</Text>
          <Text style={styles.orderDate}>{formatDate(order.orderAt)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
          <Text style={styles.statusText}>{getStatusLabel(order.status)}</Text>
        </View>
      </View>

      <View style={styles.orderDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Agency:</Text>
          <Text style={styles.detailValue}>
            {getAgencyName(order.agencyId)}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Vehicle:</Text>
          <Text style={styles.detailValue}>
            {getMotorbikeName(order)}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Warehouse:</Text>
          <Text style={styles.detailValue}>
            {getWarehouseName(order)}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Quantity:</Text>
          <Text style={styles.detailValue}>{order.itemQuantity || 0} units</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Total:</Text>
          <Text style={[styles.detailValue, styles.priceValue]}>
            {formatPrice(order.subtotal)}
          </Text>
        </View>
      </View>

      <View style={styles.orderActions}>
        {getNextStatus(order) && (
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryActionButton]}
            onPress={(e) => {
              e.stopPropagation();
              handleUpdateToNextStatus(order);
            }}
          >
            <Text style={styles.primaryActionText}>
              {getStatusLabel(getNextStatus(order))}
            </Text>
          </TouchableOpacity>
        )}
        
        {order.status !== 'CANCELED' && order.status !== 'DELIVERED' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryActionButton]}
            onPress={(e) => {
              e.stopPropagation();
              handleCancelOrder(order);
            }}
          >
            <Text style={styles.secondaryActionText}>Cancel Order</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  // Calculate statistics (excluding DRAFT orders)
  const totalOrders = orders.filter(o => o.status !== 'DRAFT').length;
  const statusCounts = orderStatuses.reduce((acc, status) => {
    if (status.key !== 'all') {
      acc[status.key] = orders.filter(o => o.status === status.key && o.status !== 'DRAFT').length;
    }
    return acc;
  }, {});

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft color={COLORS.TEXT.WHITE} size={18} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Restock Management</Text>
        <View style={styles.headerButtonPlaceholder} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={18} color={COLORS.TEXT.SECONDARY} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by ID, vehicle name, warehouse..."
          placeholderTextColor={COLORS.TEXT.SECONDARY}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalOrders}</Text>
          <Text style={styles.statLabel}>Total Orders</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: COLORS.WARNING }]}>
            {statusCounts.PENDING || 0}
          </Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: COLORS.SUCCESS }]}>
            {statusCounts.APPROVED || 0}
          </Text>
          <Text style={styles.statLabel}>Approved</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: ACCENT_COLOR }]}>
            {statusCounts.DELIVERED || 0}
          </Text>
          <Text style={styles.statLabel}>Delivered</Text>
        </View>
      </View>

      {/* Status Filter */}
      <View style={styles.statusTabsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statusTabsContent}
        >
          {orderStatuses.map((status) => {
            const isActive = selectedStatus === status.key;
            const count = status.key === 'all'
              ? totalOrders
              : statusCounts[status.key] || 0;

            return (
              <TouchableOpacity
                key={status.key}
                style={[
                  styles.statusTab,
                  isActive && styles.statusTabActive,
                ]}
                onPress={() => handleStatusFilter(status.key)}
              >
                <Text
                  style={[
                    styles.statusTabLabel,
                    isActive && styles.statusTabLabelActive,
                  ]}
                >
                  {status.label}
                </Text>
                <View
                  style={[
                    styles.statusTabCount,
                    isActive && styles.statusTabCountActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusTabCountText,
                      isActive && styles.statusTabCountTextActive,
                    ]}
                  >
                    {count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Orders List */}
      <ScrollView
        style={styles.ordersList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.ordersContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={ACCENT_COLOR}
          />
        }
      >
        {loading && filteredOrders.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrapper}>
              <Package size={64} color={COLORS.TEXT.SECONDARY} />
            </View>
            <Text style={styles.emptyTitle}>Loading...</Text>
          </View>
        ) : filteredOrders.length > 0 ? (
          filteredOrders.map(renderOrderCard)
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrapper}>
              <Package size={64} color={COLORS.TEXT.SECONDARY} />
            </View>
            <Text style={styles.emptyTitle}>No Orders</Text>
            <Text style={styles.emptySubtitle}>
              {selectedStatus !== 'all'
                ? `No orders with status "${getStatusLabel(selectedStatus)}"`
                : 'No orders in the system'}
            </Text>
          </View>
        )}
      </ScrollView>

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
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: SIZES.RADIUS.ROUND,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonPlaceholder: {
    width: 40,
    height: 40,
  },
  headerTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
    flex: 1,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    margin: SIZES.PADDING.MEDIUM,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    gap: SIZES.PADDING.SMALL,
  },
  searchInput: {
    flex: 1,
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.SMALL,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  statNumber: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: ACCENT_COLOR,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: SIZES.FONT.XSMALL,
    color: COLORS.TEXT.SECONDARY,
    textAlign: 'center',
  },
  statusTabsWrapper: {
    marginBottom: SIZES.PADDING.MEDIUM,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
  },
  statusTabsContent: {
    flexDirection: 'row',
    gap: SIZES.PADDING.SMALL,
    paddingRight: SIZES.PADDING.MEDIUM,
  },
  statusTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    gap: SIZES.PADDING.SMALL,
  },
  statusTabActive: {
    backgroundColor: ACCENT_COLOR,
  },
  statusTabLabel: {
    fontSize: SIZES.FONT.XSMALL,
    color: COLORS.TEXT.SECONDARY,
    fontWeight: '600',
  },
  statusTabLabelActive: {
    color: COLORS.TEXT.WHITE,
  },
  statusTabCount: {
    minWidth: 28,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: SIZES.RADIUS.ROUND,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusTabCountActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  statusTabCountText: {
    fontSize: SIZES.FONT.XSMALL,
    color: COLORS.TEXT.WHITE,
    fontWeight: '700',
  },
  statusTabCountTextActive: {
    color: COLORS.TEXT.WHITE,
  },
  ordersList: {
    flex: 1,
  },
  ordersContent: {
    padding: SIZES.PADDING.MEDIUM,
  },
  orderCard: {
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
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SIZES.PADDING.SMALL,
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: ACCENT_COLOR,
    marginBottom: 4,
  },
  orderDate: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
  },
  statusBadge: {
    paddingHorizontal: SIZES.PADDING.SMALL,
    paddingVertical: 4,
    borderRadius: SIZES.RADIUS.SMALL,
  },
  statusText: {
    fontSize: SIZES.FONT.XSMALL,
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
  },
  orderDetails: {
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
  },
  detailValue: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '600',
  },
  priceValue: {
    color: COLORS.SUCCESS,
    fontWeight: 'bold',
  },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SIZES.PADDING.SMALL,
    flexWrap: 'wrap',
  },
  actionButton: {
    borderRadius: SIZES.RADIUS.SMALL,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
  },
  primaryActionButton: {
    backgroundColor: '#000000',
  },
  primaryActionText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
  },
  secondaryActionButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.ERROR,
  },
  secondaryActionText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.ERROR,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.PADDING.XXXLARGE,
  },
  emptyIconWrapper: {
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  emptyTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SIZES.PADDING.SMALL,
  },
  emptySubtitle: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
    textAlign: 'center',
  },
});

export default OrderRestockManagementScreen;

