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
  Dimensions,
  TextInput,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES } from '../../constants';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import { orderService } from '../../services/orderService';
import { vehicleService } from '../../services/vehicleService';

const { width } = Dimensions.get('window');

const OrderManagementScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [availableVehicles, setAvailableVehicles] = useState([]); // Synced names from Catalog
  const [editingOrder, setEditingOrder] = useState(null);
  const [newOrder, setNewOrder] = useState({
    vehicleModel: '',
    quantity: '',
    color: '',
  });

  const { alertConfig, hideAlert, showSuccess, showError, showConfirm, showInfo } = useCustomAlert();

  // Utility function to ensure unique keys
  const getUniqueKey = (item, index) => {
    return `${item.id || 'item'}_${index}`;
  };

  // Load vehicle names from Catalog and aggregate per name
  useEffect(() => {
    const loadAvailableFromCatalog = async () => {
      try {
        const response = await vehicleService.getAllVehicles();
        if (response?.success) {
          const list = response.data || [];
          const nameToItems = {};
          list.forEach((v) => {
            const name = v.name || v.model || 'Unknown';
            if (!nameToItems[name]) nameToItems[name] = [];
            nameToItems[name].push(v);
          });
          const aggregated = Object.entries(nameToItems).map(([name, items]) => {
            const price = Math.min(...items.map((i) => Number(i.price) || 0));
            const colorsSet = new Set();
            items.forEach((i) => (i.colors || []).forEach((c) => colorsSet.add(c)));
            const stock = items.reduce((sum, i) => sum + (Number(i.stockCount) || 0), 0);
            return {
              id: name,
              name,
              price,
              stock,
              colors: Array.from(colorsSet),
            };
          });
          setAvailableVehicles(aggregated);
        }
      } catch (e) {
        console.error('Error loading vehicles for order modal:', e);
      }
    };
    loadAvailableFromCatalog();
  }, []);

  // Mock orders data
  const mockOrders = [
    {
      id: 'ORD001',
      vehicleModel: 'Model X',
      quantity: 5,
      color: 'Black',
      status: 'pending',
      orderDate: '2024-01-15',
      expectedDelivery: '2024-02-15',
      totalValue: 600000000,
      priority: 'high',
    },
    {
      id: 'ORD002',
      vehicleModel: 'Model Y',
      quantity: 3,
      color: 'White',
      status: 'confirmed',
      orderDate: '2024-01-10',
      expectedDelivery: '2024-02-10',
      totalValue: 285000000,
      priority: 'normal',
    },
    {
      id: 'ORD003',
      vehicleModel: 'Model V',
      quantity: 2,
      color: 'Silver',
      status: 'shipped',
      orderDate: '2024-01-05',
      expectedDelivery: '2024-01-25',
      totalValue: 170000000,
      priority: 'low',
    },
  ];

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      // TODO: Get dealerId from auth context or props
      const dealerId = 'DEALER001'; // This should come from user context
      const response = await orderService.getOrdersByDealer(dealerId);
      if (response.success) {
        setOrders(response.data);
      } else {
        showError('Lỗi', response.error || 'Không thể tải danh sách đơn hàng');
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      showError('Lỗi', 'Không thể tải danh sách đơn hàng');
    }
  };

  const filteredOrders = orders.filter(order =>
    order.vehicleModel.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.id.toLowerCase().includes(searchQuery.toLowerCase())
  );
  // Newest first by orderDate or createdAt
  const sortedFilteredOrders = [...filteredOrders].sort((a, b) => {
    const aTime = new Date(a.orderDate || a.createdAt || 0).getTime();
    const bTime = new Date(b.orderDate || b.createdAt || 0).getTime();
    return bTime - aTime;
  });

  const handleCreateOrder = async () => {
    if (!newOrder.vehicleModel || !newOrder.quantity || !newOrder.color) {
      showError('Lỗi', 'Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    try {
      // TODO: Get dealerId and dealerName from auth context
      const dealerId = 'DEALER001';
      const dealerName = 'AutoWorld Hanoi';
      
      const orderData = {
        dealerId,
        dealerName,
        vehicleModel: newOrder.vehicleModel,
        quantity: parseInt(newOrder.quantity),
        color: newOrder.color,
        orderDate: new Date().toISOString().split('T')[0],
        totalValue: (availableVehicles.find(v => v.name === newOrder.vehicleModel)?.price || 0) * (parseInt(newOrder.quantity) || 0),
      };

      const response = await orderService.createOrder(orderData);
      if (response.success) {
        // Check if order already exists to avoid duplicates
        const existingOrder = orders.find(order => order.id === response.data.id);
        if (!existingOrder) {
          setOrders([response.data, ...orders]);
        }
        setNewOrder({
          vehicleModel: '',
          quantity: '',
          color: '',
        });
        setShowCreateModal(false);
        showSuccess('Thành công', `Đơn hàng ${response.data.id} đã được tạo thành công!`);
      } else {
        showError('Lỗi', response.error || 'Không thể tạo đơn hàng');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      showError('Lỗi', 'Không thể tạo đơn đặt xe');
    }
  };

  const handleCancelOrder = (orderId) => {
    showConfirm(
      'Xác nhận hủy',
      'Bạn có chắc chắn muốn hủy đơn hàng này?',
      () => {
        setOrders(orders.filter(order => order.id !== orderId));
        showSuccess('Thành công', 'Đã hủy đơn hàng thành công!');
      }
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return COLORS.WARNING;
      case 'confirmed': return COLORS.PRIMARY;
      case 'shipped': return COLORS.SUCCESS;
      case 'delivered': return COLORS.SUCCESS;
      case 'cancelled': return COLORS.ERROR;
      default: return COLORS.TEXT.SECONDARY;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Chờ xác nhận';
      case 'confirmed': return 'Đã xác nhận';
      case 'shipped': return 'Đang vận chuyển';
      case 'delivered': return 'Đã giao hàng';
      case 'cancelled': return 'Đã hủy';
      default: return 'Không xác định';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return COLORS.ERROR;
      case 'normal': return COLORS.PRIMARY;
      case 'low': return COLORS.TEXT.SECONDARY;
      default: return COLORS.TEXT.SECONDARY;
    }
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case 'high': return 'Cao';
      case 'normal': return 'Bình thường';
      case 'low': return 'Thấp';
      default: return 'Bình thường';
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const renderOrderCard = (order) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderId}>{order.id}</Text>
          <Text style={styles.vehicleModel}>{order.vehicleModel}</Text>
        </View>
        <View style={styles.orderStatus}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
            <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.orderDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Số lượng:</Text>
          <Text style={styles.detailValue}>{order.quantity} xe</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Màu sắc:</Text>
          <Text style={styles.detailValue}>{order.color}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Ngày đặt:</Text>
          <Text style={styles.detailValue}>{order.orderDate}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Dự kiến giao:</Text>
          <Text style={styles.detailValue}>{order.expectedDelivery}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Ưu tiên:</Text>
          <Text style={[styles.detailValue, { color: getPriorityColor(order.priority) }]}>
            {getPriorityText(order.priority)}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Tổng giá trị:</Text>
          <Text style={[styles.detailValue, styles.priceValue]}>{formatPrice(order.totalValue)}</Text>
        </View>
      </View>

      {order.status === 'pending' && (
        <View style={styles.orderActions}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => handleCancelOrder(order.id)}
          >
            <Text style={styles.cancelButtonText}>Hủy đơn</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderCreateModal = () => (
    <Modal
      visible={showCreateModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => {
              setShowCreateModal(false);
              setEditingOrder(null);
              setNewOrder({
                vehicleModel: '',
                quantity: '',
                color: '',
              });
            }}
          >
            <Text style={styles.modalCloseText}>Hủy</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Tạo đơn đặt xe mới</Text>
          <TouchableOpacity
            style={styles.modalSaveButton}
            onPress={handleCreateOrder}
          >
            <Text style={styles.modalSaveText}>Tạo đơn</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Mẫu xe *</Text>
            <View style={styles.vehicleSelector}>
              {availableVehicles.map((vehicle) => (
                <TouchableOpacity
                  key={vehicle.id}
                  style={[
                    styles.vehicleOption,
                    newOrder.vehicleModel === vehicle.name && styles.selectedVehicleOption
                  ]}
                  onPress={() => setNewOrder({ ...newOrder, vehicleModel: vehicle.name })}
                >
                  <Text style={[
                    styles.vehicleOptionText,
                    newOrder.vehicleModel === vehicle.name && styles.selectedVehicleOptionText
                  ]}>
                    {vehicle.name}
                  </Text>
                  <Text style={styles.vehiclePrice}>{formatPrice(vehicle.price)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Số lượng *</Text>
            <TextInput
              style={styles.textInput}
              value={newOrder.quantity}
              onChangeText={(text) => setNewOrder({ ...newOrder, quantity: text })}
              placeholder="Nhập số lượng xe"
              placeholderTextColor={COLORS.TEXT.SECONDARY}
              keyboardType="numeric"
            />
          </View>

          {newOrder.vehicleModel && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Màu sắc *</Text>
              <View style={styles.colorSelector}>
                {availableVehicles.find(v => v.name === newOrder.vehicleModel)?.colors.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      newOrder.color === color && styles.selectedColorOption
                    ]}
                    onPress={() => setNewOrder({ ...newOrder, color })}
                  >
                    <Text style={[
                      styles.colorOptionText,
                      newOrder.color === color && styles.selectedColorOptionText
                    ]}>
                      {color}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Compact modal: removed fields (special requests, expected delivery, priority) */}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

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
        <Text style={styles.headerTitle}>Quản lý đơn hàng</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Text style={styles.addIcon}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm đơn hàng..."
          placeholderTextColor={COLORS.TEXT.SECONDARY}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{orders.length}</Text>
          <Text style={styles.statLabel}>Tổng đơn</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {orders.filter(o => o.status === 'pending').length}
          </Text>
          <Text style={styles.statLabel}>Chờ xác nhận</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {orders.filter(o => o.status === 'shipped').length}
          </Text>
          <Text style={styles.statLabel}>Đang vận chuyển</Text>
        </View>
      </View>

      {/* Orders List */}
      <ScrollView
        style={styles.ordersList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.ordersContent}
      >
          {sortedFilteredOrders.length > 0 ? (
            sortedFilteredOrders.map((order, index) => (
              <View key={getUniqueKey(order, index)}>
                {renderOrderCard(order)}
              </View>
            ))
          ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyTitle}>Chưa có đơn hàng</Text>
            <Text style={styles.emptySubtitle}>
              Tạo đơn đặt xe đầu tiên từ EVM
            </Text>
          </View>
        )}
      </ScrollView>

      {renderCreateModal()}
      
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
    paddingTop: 30,
  },
  
  // Header
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: SIZES.RADIUS.ROUND,
    backgroundColor: COLORS.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIcon: {
    fontSize: SIZES.FONT.LARGE,
    color: COLORS.TEXT.WHITE,
    fontWeight: 'bold',
  },

  // Search
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

  // Stats
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statNumber: {
    fontSize: SIZES.FONT.XXLARGE,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    textAlign: 'center',
  },

  // Orders List
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
  vehicleModel: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '600',
  },
  orderStatus: {
    marginLeft: SIZES.PADDING.SMALL,
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
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.ERROR,
    borderRadius: SIZES.RADIUS.SMALL,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
  },
  cancelButtonText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.ERROR,
    fontWeight: '600',
  },

  // Empty State
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

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingTop: Platform.OS === 'ios' ? 20 : 0,
    paddingBottom: SIZES.PADDING.MEDIUM,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalCloseButton: {
    padding: SIZES.PADDING.SMALL,
  },
  modalCloseText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
  },
  modalTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
    flex: 1,
    textAlign: 'center',
  },
  modalSaveButton: {
    padding: SIZES.PADDING.SMALL,
  },
  modalSaveText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: SIZES.PADDING.MEDIUM,
  },
  inputGroup: {
    marginBottom: SIZES.PADDING.MEDIUM,
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
    paddingVertical: SIZES.PADDING.SMALL,
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  vehicleSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.PADDING.SMALL,
  },
  vehicleOption: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
    minWidth: '45%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedVehicleOption: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
  },
  vehicleOptionText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '600',
    marginBottom: 4,
  },
  selectedVehicleOptionText: {
    color: COLORS.PRIMARY,
  },
  vehiclePrice: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
  },
  colorSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.PADDING.SMALL,
  },
  colorOption: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedColorOption: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
  },
  colorOptionText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
  },
  selectedColorOptionText: {
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  prioritySelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  priorityOption: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    borderWidth: 1,
    borderColor: 'transparent',
    minWidth: '30%',
    alignItems: 'center',
  },
  selectedPriorityOption: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
  },
  priorityOptionText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
  },
  selectedPriorityOptionText: {
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
});

export default OrderManagementScreen;
