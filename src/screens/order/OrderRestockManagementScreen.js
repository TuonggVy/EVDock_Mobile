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
    limit: 10,
    total: 0
  });

  const { alertConfig, hideAlert, showSuccess, showError, showConfirm } = useCustomAlert();

  const orderStatuses = [
    { key: 'all', label: 'Tất cả', color: COLORS.TEXT.SECONDARY },
    { key: 'DRAFT', label: 'Draft', color: COLORS.TEXT.SECONDARY },
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
  }, [searchQuery, selectedStatus, orders]);

  const loadOrders = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
      };
      
      if (selectedStatus !== 'all') {
        params.status = selectedStatus;
      }

      const response = await orderRestockService.getOrderRestockList(params);
      
      if (response.success) {
        setOrders(response.data || []);
        setPaginationInfo(response.paginationInfo || { page: 1, limit: 10, total: 0 });
      } else {
        showError('Lỗi', response.error || 'Không thể tải danh sách đơn hàng');
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      showError('Lỗi', 'Không thể tải danh sách đơn hàng');
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
    await loadAgencies();
    await loadOrders();
  };

  const filterOrders = () => {
    let filtered = [...orders];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order =>
        order.id?.toString().toLowerCase().includes(query) ||
        order.electricMotorbike?.name?.toLowerCase().includes(query) ||
        order.warehouse?.name?.toLowerCase().includes(query) ||
        getAgencyName(order.agencyId).toLowerCase().includes(query)
      );
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

  const handleDeleteOrder = (order) => {
    showConfirm(
      'Xác nhận xóa',
      `Bạn có chắc chắn muốn xóa đơn hàng #${order.id}?`,
      async () => {
        try {
          const response = await orderRestockService.deleteOrderRestock(order.id);
          if (response.success) {
            showSuccess('Thành công', 'Xóa đơn hàng thành công!');
            loadOrders();
          } else {
            showError('Lỗi', response.error || 'Không thể xóa đơn hàng');
          }
        } catch (error) {
          console.error('Error deleting order:', error);
          showError('Lỗi', 'Không thể xóa đơn hàng');
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

  const getAgencyName = (agencyId) => {
    if (!agencyId) return 'N/A';
    const agency = agencies.find(a => a.id === agencyId || a.id?.toString() === agencyId?.toString());
    return agency?.name || `Agency #${agencyId}`;
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
          <Text style={styles.detailLabel}>Đại lý:</Text>
          <Text style={styles.detailValue}>
            {getAgencyName(order.agencyId)}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Xe:</Text>
          <Text style={styles.detailValue}>
            {order.electricMotorbike?.name || 'N/A'}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Kho:</Text>
          <Text style={styles.detailValue}>
            {order.warehouse?.name || 'N/A'}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Số lượng:</Text>
          <Text style={styles.detailValue}>{order.quantity} xe</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Tổng giá trị:</Text>
          <Text style={[styles.detailValue, styles.priceValue]}>
            {formatPrice(order.subtotal)}
          </Text>
        </View>
      </View>

      <View style={styles.orderActions}>
        <TouchableOpacity
          style={styles.viewButton}
          onPress={() => handleViewOrder(order)}
        >
          <Text style={styles.viewButtonText}>Xem chi tiết</Text>
        </TouchableOpacity>
        {order.status === 'DRAFT' && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteOrder(order)}
          >
            <Text style={styles.deleteButtonText}>Xóa</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  // Calculate statistics
  const totalOrders = orders.length;
  const statusCounts = orderStatuses.reduce((acc, status) => {
    if (status.key !== 'all') {
      acc[status.key] = orders.filter(o => o.status === status.key).length;
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
        <Text style={styles.headerTitle}>Quản lý đơn hàng nhập kho</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}><Search /></Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm theo ID, tên xe, kho..."
          placeholderTextColor={COLORS.TEXT.SECONDARY}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalOrders}</Text>
          <Text style={styles.statLabel}>Tổng đơn</Text>
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
                selectedStatus === status.key && styles.selectedStatusChip
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
            <Text style={styles.emptyTitle}>Đang tải...</Text>
          </View>
        ) : filteredOrders.length > 0 ? (
          filteredOrders.map(renderOrderCard)
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyTitle}>Không có đơn hàng</Text>
            <Text style={styles.emptySubtitle}>
              {selectedStatus !== 'all'
                ? `Không có đơn hàng với trạng thái "${getStatusLabel(selectedStatus)}"`
                : 'Chưa có đơn hàng nào trong hệ thống'}
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
  viewButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: SIZES.RADIUS.SMALL,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
  },
  viewButtonText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: COLORS.ERROR,
    borderRadius: SIZES.RADIUS.SMALL,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
  },
  deleteButtonText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.WHITE,
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

