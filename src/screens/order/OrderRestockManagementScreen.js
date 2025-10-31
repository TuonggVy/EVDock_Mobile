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
import { Search } from 'lucide-react-native';

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
    { key: 'DELIVERED', label: 'Delivered', color: COLORS.PRIMARY },
    { key: 'PAID', label: 'Paid', color: COLORS.SUCCESS },
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
      const response = await orderRestockService.getOrderRestockDetail(orderId);
      
      if (response.success && response.data) {
        const detail = {
          warehouseName: response.data.warehouse?.name || null,
          motorbikeName: response.data.electricMotorbike?.name || null,
        };
        
        // Cache the detail
        setOrderDetailsCache(prev => ({
          ...prev,
          [orderId]: detail
        }));
        
        return detail;
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
      'DELIVERED': 'PAID',
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
          <Text style={styles.detailValue}>{order.quantity} units</Text>
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
            style={[styles.actionButton, styles.nextStatusButton]}
            onPress={(e) => {
              e.stopPropagation();
              handleUpdateToNextStatus(order);
            }}
          >
            <Text style={styles.actionButtonText}>
              {getStatusLabel(getNextStatus(order))}
            </Text>
          </TouchableOpacity>
        )}
        
        {order.status !== 'CANCELED' && order.status !== 'PAID' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={(e) => {
              e.stopPropagation();
              handleCancelOrder(order);
            }}
          >
            <Text style={styles.cancelButtonText}>Cancel Order</Text>
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
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Restock Management</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}><Search /></Text>
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
          <Text style={[styles.statNumber, { color: COLORS.PRIMARY }]}>
            {statusCounts.DELIVERED || 0}
          </Text>
          <Text style={styles.statLabel}>Delivered</Text>
        </View>
      </View>

      {/* Status Filter */}
      <View style={styles.statusFilterWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.statusFilter}
          contentContainerStyle={styles.statusFilterContent}
        >
          {orderStatuses.map((status) => (
            <TouchableOpacity
              key={status.key}
              style={[
                styles.statusChip,
                selectedStatus === status.key && styles.selectedStatusChip,
                status.key === 'all' && styles.statusChipCenter
              ]}
              onPress={() => handleStatusFilter(status.key)}
            >
              <Text style={[
                styles.statusChipText,
                selectedStatus === status.key && styles.selectedStatusChipText
              ]}>
                {status.label}
              </Text>
              {status.key !== 'all' && (
                <View style={[
                  styles.statusCount,
                  selectedStatus === status.key && styles.statusCountActive
                ]}>
                  <Text style={[
                    styles.statusCountText,
                    selectedStatus === status.key && styles.statusCountTextActive
                  ]}>
                    {statusCounts[status.key] || 0}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
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
            tintColor={COLORS.PRIMARY}
          />
        }
      >
        {loading && filteredOrders.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>⏳</Text>
            <Text style={styles.emptyTitle}>Loading...</Text>
          </View>
        ) : filteredOrders.length > 0 ? (
          filteredOrders.map(renderOrderCard)
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📦</Text>
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
  },
  searchIcon: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
    marginRight: SIZES.PADDING.SMALL,
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
    color: COLORS.PRIMARY,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: SIZES.FONT.XSMALL,
    color: COLORS.TEXT.SECONDARY,
    textAlign: 'center',
  },
  statusFilterWrapper: {
    marginBottom: SIZES.PADDING.MEDIUM,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
  },
  statusFilter: {
    maxHeight: 50,
  },
  statusFilterContent: {
    gap: SIZES.PADDING.SMALL,
    paddingRight: SIZES.PADDING.MEDIUM,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: SIZES.RADIUS.LARGE,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    gap: SIZES.PADDING.SMALL,
    minWidth: 80,
    maxWidth: 120,
  },
  statusChipCenter: {
    justifyContent: 'center',
  },
  selectedStatusChip: {
    backgroundColor: COLORS.PRIMARY,
  },
  statusChipText: {
    fontSize: SIZES.FONT.XSMALL,
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
  },
  selectedStatusChipText: {
    color: COLORS.TEXT.WHITE,
  },
  statusCount: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: SIZES.RADIUS.ROUND,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  statusCountActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  statusCountText: {
    fontSize: SIZES.FONT.XSMALL,
    color: COLORS.TEXT.WHITE,
    fontWeight: 'bold',
  },
  statusCountTextActive: {
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
    color: COLORS.PRIMARY,
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
  },
  actionButton: {
    borderRadius: SIZES.RADIUS.SMALL,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextStatusButton: {
    backgroundColor: COLORS.PRIMARY,
  },
  actionButtonText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.ERROR,
  },
  cancelButtonText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.ERROR,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.PADDING.XXXLARGE,
  },
  emptyIcon: {
    fontSize: 64,
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

