import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  RefreshControl,
  Modal,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES } from '../../constants';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import { useAuth } from '../../contexts/AuthContext';
import { USER_ROLES } from '../../constants/roles';
import depositStorageService from '../../services/storage/depositStorageService';

const DepositManagementScreen = ({ navigation }) => {
  const { alertConfig, hideAlert, showConfirm, showInfo } = useCustomAlert();
  const { user } = useAuth();
  const userRole = user?.role;
  const isDealerManager = userRole === USER_ROLES.DEALER_MANAGER;
  
  // State management
  const [activeTab, setActiveTab] = useState('available'); // available, pre_order
  const [deposits, setDeposits] = useState([]);
  const [filteredDeposits, setFilteredDeposits] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Load deposits on mount and focus
  useEffect(() => {
    loadDeposits();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadDeposits();
    }, [])
  );

  useEffect(() => {
    filterDeposits();
  }, [deposits, searchQuery, selectedStatus, activeTab]);

  const loadDeposits = async () => {
    try {
      setLoading(true);
      
      // Load deposits from storage
      let allDeposits = await depositStorageService.getDeposits();
      
      // Do not seed mock data
      
      setDeposits(allDeposits);
      setLoading(false);
    } catch (error) {
      console.error('Error loading deposits:', error);
      showInfo('Error', 'Failed to load deposits');
      setLoading(false);
    }
  };

  const filterDeposits = () => {
    let filtered = deposits;

    // Filter by tab (type)
    filtered = filtered.filter(d => d.type === activeTab);

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(d => d.status === selectedStatus);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(d =>
        d.customerName.toLowerCase().includes(query) ||
        d.customerPhone.includes(searchQuery) ||
        d.vehicleModel.toLowerCase().includes(query) ||
        d.id.toLowerCase().includes(query)
      );
    }

    // Sort by newest first (createdAt desc; fallback to depositDate)
    filtered = filtered.sort((a, b) => {
      const aTime = new Date(a.createdAt || a.depositDate || 0).getTime();
      const bTime = new Date(b.createdAt || b.depositDate || 0).getTime();
      return bTime - aTime;
    });

    setFilteredDeposits(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDeposits();
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return COLORS.WARNING;
      case 'confirmed': return COLORS.SUCCESS;
      case 'completed': return COLORS.TEXT.SECONDARY;
      case 'cancelled': return COLORS.ERROR;
      default: return COLORS.TEXT.SECONDARY;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Chờ xác nhận';
      case 'confirmed': return 'Đã xác nhận';
      case 'completed': return 'Hoàn thành';
      case 'cancelled': return 'Đã hủy';
      default: return 'Unknown';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const handleAddDeposit = () => {
    setShowAddModal(true);
  };

  const handleViewDeposit = (deposit) => {
    navigation.navigate('DepositDetail', { 
      deposit,
      onDepositUpdate: handleDepositUpdate,
    });
  };

  const handleDepositUpdate = async (updatedDeposit) => {
    // Reload deposits to get latest data
    await loadDeposits();
    
    // If deposit was confirmed, switch to 'confirmed' filter
    if (updatedDeposit && updatedDeposit.status === 'confirmed') {
      setSelectedStatus('confirmed');
    }
  };

  const handleCreateAvailableDeposit = () => {
    setShowAddModal(false);
    navigation.navigate('CreateDepositAvailable');
  };

  const handleCreatePreOrder = () => {
    setShowAddModal(false);
    navigation.navigate('CreatePreOrder');
  };

  const renderDepositCard = ({ item }) => {
    const isPreOrder = item.type === 'pre_order';
    const isCompleted = item.status === 'completed';

    return (
      <TouchableOpacity
        style={styles.depositCard}
        onPress={() => handleViewDeposit(item)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={isCompleted ? ['#F8F9FA', '#E9ECEF'] : ['#FFFFFF', '#F8F9FA']}
          style={styles.cardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Header */}
          <View style={styles.cardHeader}>
            <View style={styles.depositInfo}>
              <Text style={styles.depositId}>#{item.id}</Text>
              <Text style={styles.customerName}>{item.customerName}</Text>
              <Text style={styles.customerPhone}>{item.customerPhone}</Text>
            </View>
            <View style={styles.statusBadges}>
              {isPreOrder && (
                <View style={[styles.typeBadge, { backgroundColor: COLORS.PRIMARY }]}>
                  <Text style={styles.badgeText}>Pre-order</Text>
                </View>
              )}
              {/* Notification state badges for pre-order */}
              {isPreOrder && item.notificationStatus === 'notified' && (
                <View style={[styles.typeBadge, { backgroundColor: '#F59E0B' }]}>
                  <Text style={styles.badgeText}>Đã gửi thông báo</Text>
                </View>
              )}
              {isPreOrder && item.notificationStatus === 'acknowledged' && (
                <View style={[styles.typeBadge, { backgroundColor: '#10B981' }]}>
                  <Text style={styles.badgeText}>Staff đã xác nhận</Text>
                </View>
              )}
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                <Text style={styles.badgeText}>{getStatusText(item.status)}</Text>
              </View>
            </View>
          </View>

          {/* Vehicle Info */}
          <View style={styles.vehicleSection}>
            <View style={styles.vehicleInfo}>
              <Text style={styles.vehicleModel}>{item.vehicleModel}</Text>
              <Text style={styles.vehicleColor}>Màu: {item.vehicleColor}</Text>
            </View>
            <Text style={styles.vehiclePrice}>{formatCurrency(item.vehiclePrice)}</Text>
          </View>

          {/* Deposit Amount */}
          <View style={styles.depositAmountSection}>
            <View style={styles.depositAmountCard}>
              <Text style={styles.depositAmountLabel}>Đã đặt cọc</Text>
              <Text style={styles.depositAmountValue}>{formatCurrency(item.depositAmount)}</Text>
              <Text style={styles.depositPercentage}>{item.depositPercentage}% tổng giá</Text>
            </View>
            <View style={styles.remainingAmountCard}>
              <Text style={styles.remainingAmountLabel}>Còn lại</Text>
              <Text style={styles.remainingAmountValue}>{formatCurrency(item.remainingAmount)}</Text>
            </View>
          </View>

          {/* Delivery Info */}
          <View style={styles.deliveryInfo}>
            <View style={styles.deliveryRow}>
              <Text style={styles.deliveryLabel}>Ngày đặt cọc:</Text>
              <Text style={styles.deliveryValue}>{formatDate(item.depositDate)}</Text>
            </View>
            <View style={styles.deliveryRow}>
              <Text style={styles.deliveryLabel}>Dự kiến giao xe:</Text>
              <Text style={styles.deliveryValue}>{formatDate(item.expectedDeliveryDate)}</Text>
            </View>
            {isPreOrder && item.manufacturerOrderId && (
              <View style={styles.deliveryRow}>
                <Text style={styles.deliveryLabel}>Mã đơn hãng:</Text>
                <Text style={styles.deliveryValueHighlight}>{item.manufacturerOrderId}</Text>
              </View>
            )}
            {item.finalPaymentType && (
              <View style={styles.deliveryRow}>
                <Text style={styles.deliveryLabel}>Hình thức thanh toán:</Text>
                <Text style={styles.deliveryValue}>
                  {item.finalPaymentType === 'full' ? 'Trả full' : `Trả góp ${item.installmentMonths} tháng`}
                </Text>
              </View>
            )}
          </View>

          {/* Action Indicator */}
          {!isCompleted && (
            <View style={styles.actionIndicator}>
              <Text style={styles.actionText}>
                {item.status === 'pending' 
                  ? '⏳ Chờ xác nhận đặt cọc'
                  : isPreOrder
                  ? '📦 Chờ xe về từ hãng'
                  : '🚗 Xe sẵn sàng - Chờ thanh toán'}
              </Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'available' && styles.activeTab]}
        onPress={() => setActiveTab('available')}
      >
        <Text style={styles.tabIcon}>🚗</Text>
        <Text style={[styles.tabText, activeTab === 'available' && styles.activeTabText]}>
          Xe có sẵn
        </Text>
        <View style={[styles.tabCount, activeTab === 'available' && styles.activeTabCount]}>
          <Text style={[styles.tabCountText, activeTab === 'available' && styles.activeTabCountText]}>
            {deposits.filter(d => d.type === 'available').length}
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'pre_order' && styles.activeTab]}
        onPress={() => setActiveTab('pre_order')}
      >
        <Text style={styles.tabIcon}>📦</Text>
        <Text style={[styles.tabText, activeTab === 'pre_order' && styles.activeTabText]}>
          Pre-order
        </Text>
        <View style={[styles.tabCount, activeTab === 'pre_order' && styles.activeTabCount]}>
          <Text style={[styles.tabCountText, activeTab === 'pre_order' && styles.activeTabCountText]}>
            {deposits.filter(d => d.type === 'pre_order').length}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderStatusFilter = () => {
    const statusOptions = [
      { key: 'all', label: 'Tất cả', count: deposits.filter(d => d.type === activeTab).length },
      { key: 'pending', label: 'Chờ xác nhận', count: deposits.filter(d => d.type === activeTab && d.status === 'pending').length },
      { key: 'confirmed', label: 'Đã xác nhận', count: deposits.filter(d => d.type === activeTab && d.status === 'confirmed').length },
      { key: 'completed', label: 'Hoàn thành', count: deposits.filter(d => d.type === activeTab && d.status === 'completed').length },
    ];

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.statusFilter}
        contentContainerStyle={styles.statusFilterContent}
      >
        {statusOptions.map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.statusChip,
              selectedStatus === option.key && styles.selectedStatusChip
            ]}
            onPress={() => setSelectedStatus(option.key)}
          >
            <Text style={[
              styles.statusChipText,
              selectedStatus === option.key && styles.selectedStatusChipText
            ]}>
              {option.label}
            </Text>
            <View style={[
              styles.statusCount,
              selectedStatus === option.key && styles.statusCountActive
            ]}>
              <Text style={[
                styles.statusCountText,
                selectedStatus === option.key && styles.statusCountTextActive
              ]}>
                {option.count}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  const renderAddModal = () => (
    <Modal
      visible={showAddModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowAddModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.addModalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Chọn loại đặt cọc</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowAddModal(false)}
            >
              <Text style={styles.closeIcon}>×</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            {/* Available Vehicle Deposit */}
            <TouchableOpacity
              style={styles.depositTypeCard}
              onPress={handleCreateAvailableDeposit}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={COLORS.GRADIENT.BLUE}
                style={styles.depositTypeGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.depositTypeIconContainer}>
                  <Text style={styles.depositTypeIcon}>🚗</Text>
                </View>
                <Text style={styles.depositTypeTitle}>Xe có sẵn</Text>
                <Text style={styles.depositTypeDescription}>
                  Đặt cọc để giành slot xe đang có sẵn tại đại lý
                </Text>
                <View style={styles.depositTypeFeatures}>
                  <Text style={styles.featureItem}>✓ Xe sẵn sàng giao ngay</Text>
                  <Text style={styles.featureItem}>✓ Không phải chờ đợi lâu</Text>
                  <Text style={styles.featureItem}>✓ Chọn màu xe có sẵn</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* Pre-order Deposit */}
            <TouchableOpacity
              style={styles.depositTypeCard}
              onPress={handleCreatePreOrder}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={COLORS.GRADIENT.PURPLE}
                style={styles.depositTypeGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.depositTypeIconContainer}>
                  <Text style={styles.depositTypeIcon}>📦</Text>
                </View>
                <Text style={styles.depositTypeTitle}>Pre-order</Text>
                <Text style={styles.depositTypeDescription}>
                  Đặt cọc để lấy xe mới từ hãng sản xuất
                </Text>
                <View style={styles.depositTypeFeatures}>
                  <Text style={styles.featureItem}>✓ Đặt xe mới từ hãng</Text>
                  <Text style={styles.featureItem}>✓ Chọn màu theo ý muốn</Text>
                  <Text style={styles.featureItem}>✓ Xe mới 100%</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const getTabDescription = () => {
    return activeTab === 'available'
      ? 'Xe đang có sẵn tại đại lý'
      : 'Xe đặt từ hãng sản xuất';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={styles.headerTitleText}>Quản lý đặt cọc</Text>
            <Text style={styles.headerSubtitle}>
              {deposits.length} khoản đặt cọc
            </Text>
          </View>
          {!isDealerManager && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddDeposit}
            >
              <Text style={styles.addIcon}>+</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tabs */}
      {renderTabs()}

      {/* Search */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder={`Tìm kiếm ${activeTab === 'available' ? 'xe có sẵn' : 'pre-order'}...`}
            placeholderTextColor={COLORS.TEXT.SECONDARY}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Status Filter */}
        {renderStatusFilter()}
      </View>

      {/* Deposits List */}
      <View style={styles.content}>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>
            {activeTab === 'available' ? 'Xe có sẵn' : 'Pre-order'} ({filteredDeposits.length})
          </Text>
          <Text style={styles.listDescription}>{getTabDescription()}</Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Đang tải...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredDeposits || []}
            renderItem={renderDepositCard}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>
                  {activeTab === 'available' ? '🚗' : '📦'}
                </Text>
                <Text style={styles.emptyTitle}>Không có đặt cọc</Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery 
                    ? 'Thử tìm kiếm khác' 
                    : activeTab === 'available'
                    ? 'Chưa có khách hàng đặt cọc xe có sẵn'
                    : 'Chưa có pre-order nào'
                  }
                </Text>
                {!isDealerManager && (
                  <TouchableOpacity
                    style={styles.emptyAddButton}
                    onPress={handleAddDeposit}
                  >
                    <LinearGradient
                      colors={COLORS.GRADIENT.BLUE}
                      style={styles.emptyAddButtonGradient}
                    >
                      <Text style={styles.emptyAddButtonText}>+ Tạo đặt cọc mới</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            }
          />
        )}
      </View>

      {/* Add Deposit Modal */}
      {renderAddModal()}

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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
  },

  // Header
  header: {
    paddingTop: SIZES.PADDING.XXXLARGE,
    paddingHorizontal: SIZES.PADDING.LARGE,
    paddingBottom: SIZES.PADDING.MEDIUM,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: SIZES.FONT.LARGE,
    color: COLORS.TEXT.WHITE,
    fontWeight: 'bold',
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitleText: {
    fontSize: SIZES.FONT.HEADER,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
  headerSubtitle: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    marginTop: 2,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addIcon: {
    fontSize: SIZES.FONT.LARGE,
    color: COLORS.TEXT.WHITE,
    fontWeight: 'bold',
  },

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.PADDING.LARGE,
    gap: SIZES.PADDING.SMALL,
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    paddingHorizontal: SIZES.PADDING.SMALL,
    gap: SIZES.PADDING.XSMALL,
  },
  activeTab: {
    backgroundColor: COLORS.SURFACE,
  },
  tabIcon: {
    fontSize: 18,
  },
  tabText: {
    fontSize: SIZES.FONT.SMALL,
    fontWeight: '600',
    color: COLORS.TEXT.WHITE,
  },
  activeTabText: {
    color: COLORS.TEXT.PRIMARY,
    fontWeight: 'bold',
  },
  tabCount: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    paddingHorizontal: SIZES.PADDING.XSMALL,
    paddingVertical: 1,
    minWidth: 20,
    alignItems: 'center',
  },
  activeTabCount: {
    backgroundColor: COLORS.PRIMARY,
  },
  tabCountText: {
    fontSize: SIZES.FONT.XSMALL,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
  activeTabCountText: {
    color: COLORS.TEXT.WHITE,
  },

  // Search section
  searchSection: {
    paddingHorizontal: SIZES.PADDING.LARGE,
    paddingBottom: SIZES.PADDING.MEDIUM,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.LARGE,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  searchIcon: {
    fontSize: SIZES.FONT.MEDIUM,
    marginRight: SIZES.PADDING.SMALL,
  },
  searchInput: {
    flex: 1,
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
  },

  // Status Filter
  statusFilter: {
    marginBottom: SIZES.PADDING.SMALL,
  },
  statusFilterContent: {
    gap: SIZES.PADDING.SMALL,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.ROUND,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    gap: SIZES.PADDING.XSMALL,
  },
  selectedStatusChip: {
    backgroundColor: COLORS.PRIMARY,
  },
  statusChipText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '500',
  },
  selectedStatusChipText: {
    color: COLORS.TEXT.WHITE,
    fontWeight: 'bold',
  },
  statusCount: {
    backgroundColor: COLORS.BACKGROUND.SECONDARY,
    borderRadius: 10,
    paddingHorizontal: SIZES.PADDING.XSMALL,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  statusCountActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  statusCountText: {
    fontSize: SIZES.FONT.XSMALL,
    color: COLORS.TEXT.SECONDARY,
    fontWeight: 'bold',
  },
  statusCountTextActive: {
    color: COLORS.TEXT.WHITE,
  },

  // Content
  content: {
    flex: 1,
    backgroundColor: COLORS.SURFACE,
    borderTopLeftRadius: SIZES.RADIUS.XXLARGE,
    borderTopRightRadius: SIZES.RADIUS.XXLARGE,
    overflow: 'hidden',
  },
  listHeader: {
    paddingHorizontal: SIZES.PADDING.LARGE,
    paddingTop: SIZES.PADDING.LARGE,
    paddingBottom: SIZES.PADDING.MEDIUM,
  },
  listTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
  },
  listDescription: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    marginTop: 2,
  },
  listContent: {
    paddingHorizontal: SIZES.PADDING.LARGE,
    paddingBottom: SIZES.PADDING.XXXLARGE,
  },

  // Deposit Card
  depositCard: {
    marginBottom: SIZES.PADDING.MEDIUM,
    borderRadius: SIZES.RADIUS.LARGE,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardGradient: {
    padding: SIZES.PADDING.MEDIUM,
    borderRadius: SIZES.RADIUS.LARGE,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SIZES.PADDING.SMALL,
  },
  depositInfo: {
    flex: 1,
  },
  depositId: {
    fontSize: SIZES.FONT.SMALL,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginBottom: 2,
  },
  customerName: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: 2,
  },
  customerPhone: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
  },
  statusBadges: {
    flexDirection: 'row',
    gap: SIZES.PADDING.XSMALL,
  },
  typeBadge: {
    paddingHorizontal: SIZES.PADDING.SMALL,
    paddingVertical: SIZES.PADDING.XSMALL,
    borderRadius: SIZES.RADIUS.SMALL,
  },
  statusBadge: {
    paddingHorizontal: SIZES.PADDING.SMALL,
    paddingVertical: SIZES.PADDING.XSMALL,
    borderRadius: SIZES.RADIUS.SMALL,
  },
  badgeText: {
    fontSize: SIZES.FONT.XSMALL,
    color: COLORS.TEXT.WHITE,
    fontWeight: 'bold',
  },

  // Vehicle Section
  vehicleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.PADDING.MEDIUM,
    paddingBottom: SIZES.PADDING.SMALL,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleModel: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: 2,
  },
  vehicleColor: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
  },
  vehiclePrice: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
  },

  // Deposit Amount Section
  depositAmountSection: {
    flexDirection: 'row',
    gap: SIZES.PADDING.SMALL,
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  depositAmountCard: {
    flex: 1,
    backgroundColor: '#E3F2FD',
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.SMALL,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.PRIMARY,
  },
  depositAmountLabel: {
    fontSize: SIZES.FONT.XSMALL,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: 2,
  },
  depositAmountValue: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginBottom: 2,
  },
  depositPercentage: {
    fontSize: SIZES.FONT.XSMALL,
    color: COLORS.TEXT.SECONDARY,
  },
  remainingAmountCard: {
    flex: 1,
    backgroundColor: '#FFF3E0',
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.SMALL,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.WARNING,
  },
  remainingAmountLabel: {
    fontSize: SIZES.FONT.XSMALL,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: 2,
  },
  remainingAmountValue: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.WARNING,
  },

  // Delivery Info
  deliveryInfo: {
    backgroundColor: '#F8F9FA',
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.SMALL,
    marginBottom: SIZES.PADDING.SMALL,
  },
  deliveryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.PADDING.XSMALL,
  },
  deliveryLabel: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    fontWeight: '500',
  },
  deliveryValue: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '600',
  },
  deliveryValueHighlight: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.PRIMARY,
    fontWeight: 'bold',
  },

  // Action Indicator
  actionIndicator: {
    backgroundColor: '#E3F2FD',
    borderRadius: SIZES.RADIUS.SMALL,
    paddingVertical: SIZES.PADDING.XSMALL,
    paddingHorizontal: SIZES.PADDING.SMALL,
    alignItems: 'center',
  },
  actionText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },

  // Add Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  addModalContent: {
    backgroundColor: COLORS.SURFACE,
    borderTopLeftRadius: SIZES.RADIUS.XXLARGE,
    borderTopRightRadius: SIZES.RADIUS.XXLARGE,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.PADDING.LARGE,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  modalTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.BACKGROUND.SECONDARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    fontSize: SIZES.FONT.LARGE,
    color: COLORS.TEXT.WHITE,
  },
  modalBody: {
    padding: SIZES.PADDING.LARGE,
    gap: SIZES.PADDING.LARGE,
  },

  // Deposit Type Cards (in modal)
  depositTypeCard: {
    borderRadius: SIZES.RADIUS.LARGE,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  depositTypeGradient: {
    padding: SIZES.PADDING.LARGE,
    alignItems: 'center',
  },
  depositTypeIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  depositTypeIcon: {
    fontSize: 40,
  },
  depositTypeTitle: {
    fontSize: SIZES.FONT.XLARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
    marginBottom: SIZES.PADDING.SMALL,
  },
  depositTypeDescription: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.WHITE,
    textAlign: 'center',
    opacity: 0.9,
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  depositTypeFeatures: {
    alignItems: 'flex-start',
    width: '100%',
  },
  featureItem: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.WHITE,
    marginBottom: SIZES.PADDING.XSMALL,
    opacity: 0.9,
  },

  // Loading and Empty States
  loadingContainer: {
    paddingVertical: SIZES.PADDING.XXXLARGE,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
  },
  emptyContainer: {
    paddingVertical: SIZES.PADDING.XXXLARGE,
    alignItems: 'center',
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
    marginBottom: SIZES.PADDING.LARGE,
  },
  emptyAddButton: {
    borderRadius: SIZES.RADIUS.MEDIUM,
    overflow: 'hidden',
  },
  emptyAddButtonGradient: {
    paddingVertical: SIZES.PADDING.MEDIUM,
    paddingHorizontal: SIZES.PADDING.LARGE,
  },
  emptyAddButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.WHITE,
    fontWeight: 'bold',
  },
});

export default DepositManagementScreen;
