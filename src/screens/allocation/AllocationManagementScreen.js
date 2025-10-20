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
import { allocationService, warehouseService } from '../../services/orderService';
import { inventoryService } from '../../services/inventoryService';
import { dealerCatalogStorageService } from '../../services/storage/dealerCatalogStorageService';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width } = Dimensions.get('window');

const AllocationManagementScreen = ({ navigation }) => {
  const [allocations, setAllocations] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllocationModal, setShowAllocationModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'allocated'
  const [allocationData, setAllocationData] = useState({
    warehouseLocation: '',
    estimatedDelivery: '',
    notes: '',
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [estimatedDate, setEstimatedDate] = useState(new Date());

  // Date helpers
  const formatDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const { alertConfig, hideAlert, showSuccess, showError, showConfirm, showInfo } = useCustomAlert();

  // Utility function to ensure unique keys
  const getUniqueKey = (item, index) => {
    return `${item.id || item.orderId || 'item'}_${index}`;
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([
      loadPendingOrders(),
      loadAllocations(),
      loadWarehouses(),
    ]);
  };

  const loadPendingOrders = async () => {
    try {
      const response = await allocationService.getPendingOrders();
      if (response.success) {
        setPendingOrders(response.data);
      } else {
        showError('Lỗi', response.error || 'Không thể tải danh sách đơn hàng chờ phân phối');
      }
    } catch (error) {
      console.error('Error loading pending orders:', error);
      showError('Lỗi', 'Không thể tải danh sách đơn hàng chờ phân phối');
    }
  };

  const loadAllocations = async () => {
    try {
      const response = await allocationService.getAllocations();
      if (response.success) {
        setAllocations(response.data);
      } else {
        showError('Lỗi', response.error || 'Không thể tải danh sách phân phối');
      }
    } catch (error) {
      console.error('Error loading allocations:', error);
      showError('Lỗi', 'Không thể tải danh sách phân phối');
    }
  };

  const loadWarehouses = async () => {
    try {
      const response = await warehouseService.getWarehouses();
      if (response.success) {
        setWarehouses(response.data);
      } else {
        showError('Lỗi', response.error || 'Không thể tải danh sách kho');
      }
    } catch (error) {
      console.error('Error loading warehouses:', error);
      showError('Lỗi', 'Không thể tải danh sách kho');
    }
  };

  const filteredOrders = pendingOrders.filter(order =>
    order.dealerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.vehicleModel.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAllocations = allocations.filter(allocation =>
    allocation.dealerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    allocation.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    allocation.vehicleModel.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get orders that haven't been allocated yet
  const unallocatedOrders = pendingOrders.filter(order => 
    !allocations.some(allocation => allocation.orderId === order.id)
  );

  const filteredUnallocatedOrders = unallocatedOrders.filter(order =>
    order.dealerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.vehicleModel.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Newest orders first (based on orderDate or createdAt)
  const sortedFilteredUnallocatedOrders = [...filteredUnallocatedOrders].sort((a, b) => {
    const aTime = new Date(a.orderDate || a.createdAt || 0).getTime();
    const bTime = new Date(b.orderDate || b.createdAt || 0).getTime();
    return bTime - aTime;
  });

  // Get warehouse names for display
  const warehouseNames = warehouses.map(warehouse => warehouse.name);

  const handleAllocateVehicle = (order) => {
    setSelectedOrder(order);
    setAllocationData({
      warehouseLocation: '',
      estimatedDelivery: formatDate(new Date()),
      notes: '',
    });
    setEstimatedDate(new Date());
    setShowAllocationModal(true);
  };

  const handleConfirmAllocation = async () => {
    if (!allocationData.warehouseLocation || !allocationData.estimatedDelivery) {
      showError('Lỗi', 'Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    try {
      // Step 1: Check inventory availability and reduce quantity
      const inventoryResponse = await inventoryService.reduceInventoryQuantity(
        selectedOrder.vehicleModel,
        selectedOrder.color,
        allocationData.warehouseLocation,
        selectedOrder.quantity
      );

      if (!inventoryResponse.success) {
        showError('Lỗi', inventoryResponse.error || 'Không đủ xe trong kho');
        return;
      }

      // Step 2: Create allocation
      const allocationDataToSend = {
        orderId: selectedOrder.id,
        dealerId: selectedOrder.dealerId,
        dealerName: selectedOrder.dealerName,
        vehicleModel: selectedOrder.vehicleModel,
        quantity: selectedOrder.quantity,
        color: selectedOrder.color,
        warehouseLocation: allocationData.warehouseLocation,
        estimatedDelivery: allocationData.estimatedDelivery,
        notes: allocationData.notes,
      };

      const response = await allocationService.createAllocation(allocationDataToSend);
      if (response.success) {
        // Check if allocation already exists to avoid duplicates
        const existingAllocation = allocations.find(alloc => alloc.id === response.data.id);
        if (!existingAllocation) {
          setAllocations([response.data, ...allocations]);
        }
        setShowAllocationModal(false);
        setSelectedOrder(null);
        // Switch to allocated tab after successful allocation
        setActiveTab('allocated');
        showSuccess('Thành công', `Phân phối ${selectedOrder.quantity} xe ${selectedOrder.vehicleModel} thành công!`);
      } else {
        // If allocation fails, restore inventory quantity
        await inventoryService.restoreInventoryQuantity(
          selectedOrder.vehicleModel,
          selectedOrder.color,
          allocationData.warehouseLocation,
          selectedOrder.quantity
        );
        showError('Lỗi', response.error || 'Không thể phân phối xe');
      }
    } catch (error) {
      console.error('Error creating allocation:', error);
      // Try to restore inventory quantity in case of error
      try {
        await inventoryService.restoreInventoryQuantity(
          selectedOrder.vehicleModel,
          selectedOrder.color,
          allocationData.warehouseLocation,
          selectedOrder.quantity
        );
      } catch (restoreError) {
        console.error('Error restoring inventory:', restoreError);
      }
      showError('Lỗi', 'Không thể phân phối xe');
    }
  };

  const handleUpdateStatus = (allocationId, newStatus) => {
    showConfirm(
      'Xác nhận cập nhật',
      `Bạn có chắc chắn muốn cập nhật trạng thái thành "${getStatusText(newStatus)}"?`,
      async () => {
        try {
          const response = await allocationService.updateAllocationStatus(allocationId, newStatus);
          if (response.success) {
            setAllocations(prevAllocations => 
              prevAllocations.map(allocation =>
                allocation.id === allocationId ? response.data : allocation
              )
            );
            // If delivered, push delivered vehicles into Dealer Catalog storage (new retail flow)
            if (newStatus === 'delivered') {
              try {
                await dealerCatalogStorageService.addDeliveredVehicles({
                  vehicleModel: response.data.vehicleModel,
                  color: response.data.color,
                  quantity: response.data.quantity || 1,
                });
              } catch (e) {
                console.error('Error updating dealer catalog after delivery:', e);
              }
            }
            showSuccess('Thành công', 'Cập nhật trạng thái thành công!');
          } else {
            showError('Lỗi', response.error || 'Không thể cập nhật trạng thái');
          }
        } catch (error) {
          console.error('Error updating allocation status:', error);
          showError('Lỗi', 'Không thể cập nhật trạng thái');
        }
      }
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return COLORS.WARNING;
      case 'pending_allocation': return COLORS.WARNING;
      case 'allocated': return COLORS.PRIMARY;
      case 'shipped': return COLORS.SUCCESS;
      case 'delivered': return COLORS.SUCCESS;
      case 'cancelled': return COLORS.ERROR;
      default: return COLORS.TEXT.SECONDARY;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Chờ phân phối';
      case 'pending_allocation': return 'Chờ phân phối';
      case 'allocated': return 'Đã phân phối';
      case 'shipped': return 'Đã vận chuyển';
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

  const renderPendingOrderCard = (order) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderId}>{order.id}</Text>
          <Text style={styles.dealerName}>{order.dealerName}</Text>
        </View>
        <View style={styles.orderStatus}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
            <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.orderDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Mẫu xe:</Text>
          <Text style={styles.detailValue}>{order.vehicleModel}</Text>
        </View>
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
          <Text style={styles.detailLabel}>Ưu tiên:</Text>
          <Text style={[styles.detailValue, { color: getPriorityColor(order.priority) }]}>
            {getPriorityText(order.priority)}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Tổng giá trị:</Text>
          <Text style={[styles.detailValue, styles.priceValue]}>{formatPrice(order.totalValue)}</Text>
        </View>
        {order.specialRequests && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Yêu cầu đặc biệt:</Text>
            <Text style={styles.detailValue}>{order.specialRequests}</Text>
          </View>
        )}
      </View>

      <View style={styles.orderActions}>
        <TouchableOpacity
          style={styles.allocateButton}
          onPress={() => handleAllocateVehicle(order)}
        >
          <Text style={styles.allocateButtonText}>Phân phối xe</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderAllocationCard = (allocation) => (
    <View style={styles.allocationCard}>
      <View style={styles.allocationHeader}>
        <View style={styles.allocationInfo}>
          <Text style={styles.allocationId}>{allocation.id}</Text>
          <Text style={styles.dealerName}>{allocation.dealerName}</Text>
        </View>
        <View style={styles.allocationStatus}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(allocation.status) }]}>
            <Text style={styles.statusText}>{getStatusText(allocation.status)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.allocationDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Mẫu xe:</Text>
          <Text style={styles.detailValue}>{allocation.vehicleModel}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Số lượng:</Text>
          <Text style={styles.detailValue}>{allocation.quantity} xe</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Màu sắc:</Text>
          <Text style={styles.detailValue}>{allocation.color}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>VIN:</Text>
          <Text style={styles.detailValue}>{allocation.vehicleVIN}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Kho:</Text>
          <Text style={styles.detailValue}>{allocation.warehouseLocation}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Ngày phân phối:</Text>
          <Text style={styles.detailValue}>{allocation.allocatedDate}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Dự kiến giao:</Text>
          <Text style={styles.detailValue}>{allocation.estimatedDelivery}</Text>
        </View>
        {allocation.notes && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Ghi chú:</Text>
            <Text style={styles.detailValue}>{allocation.notes}</Text>
          </View>
        )}
      </View>

      <View style={styles.allocationActions}>
        {allocation.status === 'allocated' && (
          <TouchableOpacity
            style={styles.updateButton}
            onPress={() => handleUpdateStatus(allocation.id, 'shipped')}
          >
            <Text style={styles.updateButtonText}>Đã vận chuyển</Text>
          </TouchableOpacity>
        )}
        {allocation.status === 'shipped' && (
          <TouchableOpacity
            style={styles.updateButton}
            onPress={() => handleUpdateStatus(allocation.id, 'delivered')}
          >
            <Text style={styles.updateButtonText}>Đã giao hàng</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderAllocationModal = () => (
    <Modal
      visible={showAllocationModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => {
              setShowAllocationModal(false);
              setSelectedOrder(null);
              setAllocationData({
                vehicleVIN: '',
                warehouseLocation: '',
                estimatedDelivery: '',
                notes: '',
              });
              setEstimatedDate(new Date());
              setShowDatePicker(false);
            }}
          >
            <Text style={styles.modalCloseText}>Hủy</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Phân phối xe</Text>
          <TouchableOpacity
            style={styles.modalSaveButton}
            onPress={handleConfirmAllocation}
          >
            <Text style={styles.modalSaveText}>Xác nhận</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {selectedOrder && (
            <View style={styles.orderSummary}>
              <Text style={styles.summaryTitle}>Thông tin đơn hàng</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Mã đơn:</Text>
                <Text style={styles.summaryValue}>{selectedOrder.id}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Đại lý:</Text>
                <Text style={styles.summaryValue}>{selectedOrder.dealerName}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Mẫu xe:</Text>
                <Text style={styles.summaryValue}>{selectedOrder.vehicleModel}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Số lượng:</Text>
                <Text style={styles.summaryValue}>{selectedOrder.quantity} xe</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Màu sắc:</Text>
                <Text style={styles.summaryValue}>{selectedOrder.color}</Text>
              </View>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Kho xuất hàng *</Text>
            <View style={styles.locationSelector}>
              {warehouseNames.map((location) => (
                <TouchableOpacity
                  key={location}
                  style={[
                    styles.locationOption,
                    allocationData.warehouseLocation === location && styles.selectedLocationOption
                  ]}
                  onPress={() => setAllocationData({ ...allocationData, warehouseLocation: location })}
                >
                  <Text style={[
                    styles.locationOptionText,
                    allocationData.warehouseLocation === location && styles.selectedLocationOptionText
                  ]}>
                    {location}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Ngày giao dự kiến *</Text>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={{ color: COLORS.TEXT.PRIMARY }}>
                {allocationData.estimatedDelivery
                  ? formatDateForDisplay(allocationData.estimatedDelivery)
                  : 'Chọn ngày (DD/MM/YYYY)'}
              </Text>
              <Text style={{ color: COLORS.TEXT.SECONDARY }}>📅</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={estimatedDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) {
                    setEstimatedDate(selectedDate);
                    setAllocationData({
                      ...allocationData,
                      estimatedDelivery: formatDate(selectedDate),
                    });
                  }
                }}
                minimumDate={new Date()}
                style={styles.datePicker}
              />
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Ghi chú</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={allocationData.notes}
              onChangeText={(text) => setAllocationData({ ...allocationData, notes: text })}
              placeholder="Nhập ghi chú (nếu có)"
              placeholderTextColor={COLORS.TEXT.SECONDARY}
              multiline
              numberOfLines={3}
            />
          </View>
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
        <Text style={styles.headerTitle}>Quản lý phân phối</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm đơn hàng, đại lý..."
          placeholderTextColor={COLORS.TEXT.SECONDARY}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{unallocatedOrders.length}</Text>
          <Text style={styles.statLabel}>Chờ phân phối</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{allocations.length}</Text>
          <Text style={styles.statLabel}>Đã phân phối</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {allocations.filter(a => a.status === 'shipped').length}
          </Text>
          <Text style={styles.statLabel}>Đang vận chuyển</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'pending' && styles.activeTabButton]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>
            Chờ phân phối ({unallocatedOrders.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'allocated' && styles.activeTabButton]}
          onPress={() => setActiveTab('allocated')}
        >
          <Text style={[styles.tabText, activeTab === 'allocated' && styles.activeTabText]}>
            Đã phân phối ({allocations.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {activeTab === 'pending' ? (
          /* Pending Orders */
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Đơn hàng chờ phân phối</Text>
            {sortedFilteredUnallocatedOrders.length > 0 ? (
              sortedFilteredUnallocatedOrders.map((order, index) => (
                <View key={getUniqueKey(order, index)}>
                  {renderPendingOrderCard(order)}
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📦</Text>
                <Text style={styles.emptyTitle}>Không có đơn hàng chờ</Text>
                <Text style={styles.emptySubtitle}>
                  Tất cả đơn hàng đã được phân phối
                </Text>
              </View>
            )}
          </View>
        ) : (
          /* Allocations */
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Lịch sử phân phối</Text>
            {filteredAllocations.length > 0 ? (
              [...filteredAllocations]
                .sort((a, b) => {
                  const aTime = new Date(a.allocatedDate || a.createdAt || a.updatedAt || 0).getTime();
                  const bTime = new Date(b.allocatedDate || b.createdAt || b.updatedAt || 0).getTime();
                  return bTime - aTime;
                })
                .map((allocation, index) => (
                <View key={getUniqueKey(allocation, index)}>
                  {renderAllocationCard(allocation)}
                </View>
                ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🚚</Text>
                <Text style={styles.emptyTitle}>Chưa có phân phối</Text>
                <Text style={styles.emptySubtitle}>
                  Bắt đầu phân phối xe cho đại lý
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {renderAllocationModal()}
      
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
  headerRight: {
    width: 40,
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

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  tabButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.SMALL,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  tabText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
  },
  activeTabButton: {
    backgroundColor: COLORS.PRIMARY,
  },
  activeTabText: {
    color: COLORS.TEXT.WHITE,
    fontWeight: 'bold',
  },

  // Content
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SIZES.PADDING.MEDIUM,
  },
  section: {
    marginBottom: SIZES.PADDING.LARGE,
  },
  sectionTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
    marginBottom: SIZES.PADDING.MEDIUM,
  },

  // Order/Allocation Cards
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
  allocationCard: {
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
  allocationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SIZES.PADDING.SMALL,
  },
  orderInfo: {
    flex: 1,
  },
  allocationInfo: {
    flex: 1,
  },
  orderId: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginBottom: 4,
  },
  allocationId: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginBottom: 4,
  },
  dealerName: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '600',
  },
  orderStatus: {
    marginLeft: SIZES.PADDING.SMALL,
  },
  allocationStatus: {
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
  allocationDetails: {
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
  allocationActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  allocateButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: SIZES.RADIUS.SMALL,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
  },
  allocateButtonText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
  },
  updateButton: {
    backgroundColor: COLORS.SUCCESS,
    borderRadius: SIZES.RADIUS.SMALL,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
  },
  updateButtonText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.WHITE,
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
  dateInput: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.MEDIUM,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  datePicker: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    marginHorizontal: SIZES.PADDING.MEDIUM,
    marginVertical: SIZES.PADDING.SMALL,
  },
  orderSummary: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
    marginBottom: SIZES.PADDING.LARGE,
  },
  summaryTitle: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
    marginBottom: SIZES.PADDING.SMALL,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
  },
  summaryValue: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
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
  locationSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.PADDING.SMALL,
  },
  locationOption: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    borderWidth: 1,
    borderColor: 'transparent',
    minWidth: '45%',
    alignItems: 'center',
  },
  selectedLocationOption: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
  },
  locationOptionText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
  },
  selectedLocationOptionText: {
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

export default AllocationManagementScreen;
