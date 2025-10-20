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
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS, SIZES } from '../../constants';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import promotionStorageService from '../../services/storage/promotionStorageService';
// TODO: Import dealer promotion service when ready for backend integration
// import { dealerPromotionService } from '../../services/dealerPromotionService';

const DealerPromotionManagementScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { alertConfig, hideAlert, showConfirm, showInfo } = useCustomAlert();
  
  // State management
  const [promotions, setPromotions] = useState([]);
  const [filteredPromotions, setFilteredPromotions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Mock data - B2C Promotions (Dealer Manager cho khách hàng cuối)
  // Sẽ được thay thế bằng API calls
  const mockPromotions = [
    {
      id: '1',
      code: 'B2C_VIP_WEEKEND',
      name: 'VIP Weekend Special',
      description: 'Giảm giá đặc biệt cuối tuần cho khách hàng VIP',
      type: 'percentage',
      value: 10,
      minOrderValue: 2000000000, // 2 tỷ VND minimum
      maxDiscount: 50000000, // 50 triệu VND max discount
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      status: 'active',
      usageLimit: 100,
      usedCount: 23,
      targetCustomers: 'VIP Customers',
      targetAudience: 'customers', // B2C specific
      promotionType: 'vip_discount', // B2C specific
      customerSegments: ['VIP', 'Premium'],
      vehicleModels: ['All Models'],
      createdAt: '2024-01-01',
      createdBy: 'Dealer Manager'
    },
    {
      id: '2',
      code: 'B2C_NEWYEAR2024',
      name: 'New Year Customer Promotion',
      description: 'Chào mừng năm mới với ưu đãi hấp dẫn cho khách hàng',
      type: 'fixed',
      value: 30000000, // 30 triệu VND fixed discount
      minOrderValue: 1500000000, // 1.5 tỷ VND minimum
      maxDiscount: 30000000,
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      status: 'expired',
      usageLimit: 50,
      usedCount: 50,
      targetCustomers: 'All Customers',
      targetAudience: 'customers',
      promotionType: 'seasonal_promotion',
      customerSegments: ['All'],
      vehicleModels: ['Model 3', 'Model Y'],
      createdAt: '2023-12-15',
      createdBy: 'Dealer Manager'
    },
    {
      id: '3',
      code: 'B2C_SUMMER2024',
      name: 'Summer Customer Campaign',
      description: 'Chiến dịch hè với nhiều ưu đãi hấp dẫn cho khách hàng',
      type: 'percentage',
      value: 15,
      minOrderValue: 1800000000, // 1.8 tỷ VND minimum
      maxDiscount: 80000000, // 80 triệu VND max discount
      startDate: '2024-06-01',
      endDate: '2024-08-31',
      status: 'active',
      usageLimit: 200,
      usedCount: 45,
      targetCustomers: 'All Customers',
      targetAudience: 'customers',
      promotionType: 'seasonal_campaign',
      customerSegments: ['All'],
      vehicleModels: ['All Models'],
      createdAt: '2024-05-15',
      createdBy: 'Dealer Manager'
    },
    {
      id: '4',
      code: 'B2C_BLACKFRIDAY',
      name: 'Black Friday Customer Event',
      description: 'Sự kiện mua sắm lớn nhất năm cho khách hàng',
      type: 'percentage',
      value: 20,
      minOrderValue: 2500000000, // 2.5 tỷ VND minimum
      maxDiscount: 150000000, // 150 triệu VND max discount
      startDate: '2024-11-29',
      endDate: '2024-11-30',
      status: 'scheduled',
      usageLimit: 100,
      usedCount: 0,
      targetCustomers: 'All Customers',
      targetAudience: 'customers',
      promotionType: 'flash_sale',
      customerSegments: ['All'],
      vehicleModels: ['Model S', 'Model X'],
      createdAt: '2024-10-01',
      createdBy: 'Dealer Manager'
    },
    {
      id: '5',
      code: 'B2C_FIRST_TIME',
      name: 'First Time Buyer Bonus',
      description: 'Ưu đãi đặc biệt cho khách hàng mua xe lần đầu',
      type: 'fixed',
      value: 25000000, // 25 triệu VND fixed discount
      minOrderValue: 1200000000, // 1.2 tỷ VND minimum
      maxDiscount: 25000000,
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      status: 'active',
      usageLimit: 150,
      usedCount: 67,
      targetCustomers: 'First Time Buyers',
      targetAudience: 'customers',
      promotionType: 'new_customer_bonus',
      customerSegments: ['New Customers'],
      vehicleModels: ['Model 3'],
      createdAt: '2024-01-01',
      createdBy: 'Dealer Manager'
    }
  ];

  const statusFilters = [
    { id: 'all', name: 'All', color: COLORS.TEXT.SECONDARY },
    { id: 'active', name: 'Active', color: COLORS.SUCCESS },
    { id: 'scheduled', name: 'Scheduled', color: COLORS.WARNING },
    { id: 'expired', name: 'Expired', color: COLORS.ERROR },
  ];

  // Load promotions on component mount
  useEffect(() => {
    loadPromotions();
  }, []);

  // Refresh promotions when screen comes into focus (e.g., returning from add screen)
  useFocusEffect(
    React.useCallback(() => {
      loadPromotions();
    }, [])
  );

  // Filter promotions when search or status changes
  useEffect(() => {
    filterPromotions();
  }, [searchQuery, selectedStatus, promotions]);

  const loadPromotions = async () => {
    try {
      setLoading(true);
      
      // TODO: Replace with actual API call for B2C promotions
      // const response = await dealerPromotionService.getB2CPromotions();
      // setPromotions(response.data);
      
      // For development, load from shared storage (all promotions for Manager)
      const storedPromotions = await promotionStorageService.getPromotionsForManager();
      
      if (storedPromotions.length === 0) {
        // Initialize with mock data if storage is empty
        await promotionStorageService.initializeWithMockData();
        const initializedPromotions = await promotionStorageService.getPromotionsForManager();
        setPromotions(initializedPromotions);
      } else {
        setPromotions(storedPromotions);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading B2C promotions:', error);
      showInfo('Error', 'Failed to load customer promotions');
      setLoading(false);
    }
  };

  const filterPromotions = () => {
    let filtered = promotions;

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(promotion => promotion.status === selectedStatus);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(promotion =>
        promotion.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        promotion.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        promotion.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredPromotions(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPromotions();
    setRefreshing(false);
  };

  const handleAddPromotion = () => {
    navigation.navigate('AddB2CPromotion');
  };

  const handleEditPromotion = (promotion) => {
    navigation.navigate('EditB2CPromotion', { promotion });
  };

  const handleDeletePromotion = (promotion) => {
    showConfirm(
      'Delete Promotion',
      `Are you sure you want to delete "${promotion.name}"?`,
      () => deletePromotion(promotion.id)
    );
  };

  const deletePromotion = async (promotionId) => {
    try {
      // TODO: Replace with actual API call
      // await dealerPromotionService.deletePromotion(promotionId);
      
      // For development, delete from local storage
      const success = await promotionStorageService.deletePromotion(promotionId);
      
      if (success) {
        // Update local state
        setPromotions(prev => prev.filter(p => p.id !== promotionId));
        showInfo('Success', 'Promotion deleted successfully');
      } else {
        showInfo('Error', 'Failed to delete promotion');
      }
    } catch (error) {
      console.error('Error deleting promotion:', error);
      showInfo('Error', 'Failed to delete promotion');
    }
  };

  const handleViewPromotion = (promotion) => {
    navigation.navigate('B2CPromotionDetail', { promotion });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return COLORS.SUCCESS;
      case 'scheduled': return COLORS.WARNING;
      case 'expired': return COLORS.ERROR;
      case 'paused': return COLORS.TEXT.SECONDARY;
      default: return COLORS.TEXT.SECONDARY;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Active';
      case 'scheduled': return 'Scheduled';
      case 'expired': return 'Expired';
      case 'paused': return 'Paused';
      default: return 'Unknown';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatValue = (type, value) => {
    return type === 'percentage' ? `${value}%` : `$${value.toLocaleString()}`;
  };

  const renderPromotionCard = ({ item }) => (
    <TouchableOpacity
      style={styles.promotionCard}
      onPress={() => handleViewPromotion(item)}
    >
      <View style={styles.promotionHeader}>
        <View style={styles.promotionInfo}>
          <Text style={styles.promotionCode}>{item.code}</Text>
          <Text style={styles.promotionName}>{item.name}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>
      
      <Text style={styles.promotionDescription} numberOfLines={2}>
        {item.description}
      </Text>
      
      <View style={styles.promotionDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Discount:</Text>
          <Text style={styles.detailValue}>{formatValue(item.type, item.value)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Valid:</Text>
          <Text style={styles.detailValue}>
            {formatDate(item.startDate)} - {formatDate(item.endDate)}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Usage:</Text>
          <Text style={styles.detailValue}>
            {item.usedCount}/{item.usageLimit}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Target:</Text>
          <Text style={styles.detailValue}>{item.targetCustomers}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Segment:</Text>
          <Text style={styles.detailValue}>{item.customerSegments.join(', ')}</Text>
        </View>
      </View>
      
      <View style={styles.promotionActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleEditPromotion(item)}
        >
          <Text style={styles.actionIcon}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeletePromotion(item)}
        >
          <Text style={styles.actionIcon}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderStatusFilter = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.statusFilter}
      contentContainerStyle={styles.statusFilterContent}
    >
      {statusFilters.map((status) => (
        <TouchableOpacity
          key={status.id}
          style={[
            styles.statusChip,
            selectedStatus === status.id && styles.selectedStatusChip,
            { borderColor: status.color }
          ]}
          onPress={() => setSelectedStatus(status.id)}
        >
          <View style={[styles.statusDot, { backgroundColor: status.color }]} />
          <Text style={[
            styles.statusChipText,
            selectedStatus === status.id && styles.selectedStatusChipText
          ]}>
            {status.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

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
            <Text style={styles.headerTitleText}>Customer Promotions</Text>
            <Text style={styles.headerSubtitle}>B2C promotions for customers</Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddPromotion}
          >
            <Text style={styles.addIcon}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search and Filters */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search promotions..."
            placeholderTextColor={COLORS.TEXT.SECONDARY}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        {renderStatusFilter()}
      </View>

      {/* Promotions List */}
      <View style={styles.content}>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>
            Customer Promotions ({filteredPromotions.length})
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading promotions...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredPromotions || []}
            renderItem={renderPromotionCard}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>🎁</Text>
                <Text style={styles.emptyTitle}>No promotions found</Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery ? 'Try adjusting your search' : 'Create your first promotion'}
                </Text>
              </View>
            }
          />
        )}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
  },
  
  // Header styles
  header: {
    paddingTop: SIZES.PADDING.XXXLARGE,
    paddingHorizontal: SIZES.PADDING.LARGE,
    paddingBottom: SIZES.PADDING.LARGE,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: SIZES.RADIUS.ROUND,
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
    borderRadius: SIZES.RADIUS.ROUND,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addIcon: {
    fontSize: SIZES.FONT.LARGE,
    color: COLORS.TEXT.WHITE,
    fontWeight: 'bold',
  },

  // Search section
  searchSection: {
    paddingHorizontal: SIZES.PADDING.LARGE,
    paddingBottom: SIZES.PADDING.LARGE,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.LARGE,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    marginBottom: SIZES.PADDING.MEDIUM,
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

  // Status filter
  statusFilter: {
    marginBottom: SIZES.PADDING.SMALL,
  },
  statusFilterContent: {
    paddingRight: SIZES.PADDING.LARGE,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.ROUND,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    marginRight: SIZES.PADDING.SMALL,
    borderWidth: 1,
  },
  selectedStatusChip: {
    backgroundColor: COLORS.PRIMARY,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SIZES.PADDING.XSMALL,
  },
  statusChipText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '500',
  },
  selectedStatusChipText: {
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
  listContent: {
    paddingHorizontal: SIZES.PADDING.LARGE,
    paddingBottom: SIZES.PADDING.XXXLARGE,
  },

  // Promotion card
  promotionCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.LARGE,
    marginBottom: SIZES.PADDING.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  promotionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SIZES.PADDING.SMALL,
  },
  promotionInfo: {
    flex: 1,
  },
  promotionCode: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginBottom: 2,
  },
  promotionName: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
  },
  statusBadge: {
    paddingHorizontal: SIZES.PADDING.SMALL,
    paddingVertical: SIZES.PADDING.XSMALL,
    borderRadius: SIZES.RADIUS.SMALL,
  },
  statusText: {
    fontSize: SIZES.FONT.XSMALL,
    color: COLORS.TEXT.WHITE,
    fontWeight: 'bold',
  },
  promotionDescription: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    lineHeight: 18,
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  promotionDetails: {
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.PADDING.XSMALL,
  },
  detailLabel: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '600',
  },
  promotionActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SIZES.PADDING.SMALL,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: SIZES.RADIUS.SMALL,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#FFE5E5',
  },
  actionIcon: {
    fontSize: SIZES.FONT.MEDIUM,
  },

  // Loading and empty states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SIZES.PADDING.XXXLARGE,
  },
  loadingText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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

export default DealerPromotionManagementScreen;
