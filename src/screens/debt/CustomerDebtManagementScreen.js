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
import installmentStorageService from '../../services/storage/installmentStorageService';

const CustomerDebtManagementScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { alertConfig, hideAlert, showConfirm, showInfo } = useCustomAlert();
  
  // State management
  const [installments, setInstallments] = useState([]);
  const [filteredInstallments, setFilteredInstallments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Filter options for Dealer Manager view
  const filterOptions = [
    { id: 'all', name: 'Tất cả', color: COLORS.TEXT.SECONDARY },
    { id: 'active', name: 'Đang trả', color: COLORS.SUCCESS },
    { id: 'overdue', name: 'Quá hạn', color: COLORS.ERROR },
    { id: 'completed', name: 'Hoàn thành', color: COLORS.TEXT.SECONDARY },
  ];

  // Load installments on component mount
  useEffect(() => {
    loadInstallments();
  }, []);

  // Auto refresh when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadInstallments();
    }, [])
  );

  // Filter installments when search or filter changes
  useEffect(() => {
    filterInstallments();
  }, [searchQuery, selectedFilter, installments]);

  const loadInstallments = async () => {
    try {
      setLoading(true);
      
      // Load installments from storage (created by Dealer Staff)
      let allInstallments = await installmentStorageService.getInstallments();
      
      // Initialize with mock data if empty
      if (allInstallments.length === 0) {
        allInstallments = await installmentStorageService.initializeWithMockData();
      }
      
      setInstallments(allInstallments);
      setLoading(false);
    } catch (error) {
      console.error('Error loading installments:', error);
      showInfo('Error', 'Failed to load customer installments');
      setLoading(false);
    }
  };

  const filterInstallments = () => {
    let filtered = installments;

    // Filter by status
    if (selectedFilter === 'active') {
      filtered = filtered.filter(i => i.status === 'active');
    } else if (selectedFilter === 'completed') {
      filtered = filtered.filter(i => i.status === 'completed');
    } else if (selectedFilter === 'overdue') {
      filtered = filtered.filter(i => 
        i.paymentSchedule.some(p => p.status === 'overdue')
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(installment =>
        installment.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        installment.customerPhone.includes(searchQuery) ||
        installment.vehicleModel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        installment.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredInstallments(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInstallments();
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return COLORS.SUCCESS;
      case 'completed': return COLORS.TEXT.SECONDARY;
      case 'defaulted': return COLORS.ERROR;
      default: return COLORS.TEXT.SECONDARY;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Đang trả';
      case 'completed': return 'Hoàn thành';
      case 'defaulted': return 'Vỡ nợ';
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

  const getProgressPercentage = (paidMonths, totalMonths) => {
    return Math.round((paidMonths / totalMonths) * 100);
  };

  const renderInstallmentCard = ({ item }) => {
    const nextPayment = item.paymentSchedule.find(p => p.status === 'pending' || p.status === 'overdue');
    const hasOverdue = item.paymentSchedule.some(p => p.status === 'overdue');
    const progressPercentage = getProgressPercentage(item.paidMonths, item.installmentMonths);

    return (
      <TouchableOpacity
        style={[styles.installmentCard, hasOverdue && styles.installmentCardOverdue]}
        onPress={() => handleViewInstallment(item)}
      >
        <LinearGradient
          colors={hasOverdue ? ['#FFE6E6', '#FFF5F5'] : ['#FFFFFF', '#F8F9FA']}
          style={styles.cardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Header */}
          <View style={styles.debtHeader}>
            <View style={styles.debtInfo}>
              <Text style={styles.debtId}>#{item.id}</Text>
              <Text style={styles.customerName}>{item.customerName}</Text>
              <Text style={styles.customerPhone}>{item.customerPhone}</Text>
            </View>
            <View style={styles.debtBadges}>
              {hasOverdue && (
                <View style={[styles.statusBadge, { backgroundColor: COLORS.ERROR }]}>
                  <Text style={styles.badgeText}>Quá hạn</Text>
                </View>
              )}
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                <Text style={styles.badgeText}>{getStatusText(item.status)}</Text>
              </View>
            </View>
          </View>
          
          {/* Vehicle Info */}
          <View style={styles.vehicleInfo}>
            <Text style={styles.vehicleModel}>{item.vehicleModel}</Text>
            <Text style={styles.vehiclePrice}>{formatCurrency(item.totalAmount)}</Text>
          </View>

          {/* Progress Section */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>
                Đã trả {item.paidMonths}/{item.installmentMonths} tháng
              </Text>
              <Text style={styles.progressPercentage}>{progressPercentage}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { 
                width: `${progressPercentage}%`,
                backgroundColor: hasOverdue ? COLORS.ERROR : COLORS.SUCCESS
              }]} />
            </View>
          </View>
          
          {/* Payment Details */}
          <View style={styles.debtDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Trả hàng tháng:</Text>
              <Text style={styles.detailValueHighlight}>{formatCurrency(item.monthlyPayment)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Còn lại:</Text>
              <Text style={styles.detailValue}>{formatCurrency(item.remainingAmount)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Lãi suất:</Text>
              <Text style={styles.detailValue}>{item.interestRate}%/năm</Text>
            </View>
            {nextPayment && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Kỳ tiếp theo:</Text>
                <Text style={[styles.detailValue, hasOverdue && { color: COLORS.ERROR, fontWeight: 'bold' }]}>
                  {formatDate(nextPayment.dueDate)}
                  {hasOverdue && ' (Quá hạn)'}
                </Text>
              </View>
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderFilterChips = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.filterSection}
      contentContainerStyle={styles.filterContent}
    >
      {filterOptions.map((filter) => {
        const count = filter.id === 'all' 
          ? installments.length
          : filter.id === 'active'
          ? installments.filter(i => i.status === 'active').length
          : filter.id === 'completed'
          ? installments.filter(i => i.status === 'completed').length
          : installments.filter(i => i.paymentSchedule.some(p => p.status === 'overdue')).length;

        return (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.filterChip,
              selectedFilter === filter.id && styles.selectedFilterChip,
              { borderColor: filter.color }
            ]}
            onPress={() => setSelectedFilter(filter.id)}
          >
            <View style={[styles.filterDot, { backgroundColor: filter.color }]} />
            <Text style={[
              styles.filterChipText,
              selectedFilter === filter.id && styles.selectedFilterChipText
            ]}>
              {filter.name}
            </Text>
            <View style={[
              styles.filterCount,
              selectedFilter === filter.id && styles.filterCountActive
            ]}>
              <Text style={[
                styles.filterCountText,
                selectedFilter === filter.id && styles.filterCountTextActive
              ]}>
                {count}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  const handleViewInstallment = (installment) => {
    // Manager can only view, not record payments
    navigation.navigate('InstallmentDetail', { 
      installment,
      viewOnly: true // Manager view-only mode
    });
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
            <Text style={styles.headerTitleText}>Trả góp khách hàng</Text>
            <Text style={styles.headerSubtitle}>Theo dõi quá trình trả góp</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      {/* Search and Filters */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm theo tên, SĐT, xe..."
            placeholderTextColor={COLORS.TEXT.SECONDARY}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        {renderFilterChips()}
      </View>

      {/* Installments List */}
      <View style={styles.content}>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>
            Khoản trả góp ({filteredInstallments.length})
          </Text>
          <Text style={styles.listSubtitle}>
            Dealer Staff quản lý thanh toán
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Đang tải...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredInstallments || []}
            renderItem={renderInstallmentCard}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>📅</Text>
                <Text style={styles.emptyTitle}>Không có khoản trả góp</Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery ? 'Thử tìm kiếm khác' : 'Chưa có khách hàng nào trả góp'}
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
  headerSpacer: {
    width: 40,
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

  // Filter section
  filterSection: {
    marginBottom: SIZES.PADDING.SMALL,
  },
  filterContent: {
    gap: SIZES.PADDING.SMALL,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.ROUND,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    marginRight: SIZES.PADDING.SMALL,
    borderWidth: 1,
    gap: SIZES.PADDING.XSMALL,
  },
  selectedFilterChip: {
    backgroundColor: COLORS.PRIMARY,
  },
  filterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  filterChipText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '500',
  },
  selectedFilterChipText: {
    color: COLORS.TEXT.WHITE,
  },
  filterCount: {
    backgroundColor: COLORS.BACKGROUND.SECONDARY,
    borderRadius: 10,
    paddingHorizontal: SIZES.PADDING.XSMALL,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  filterCountActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  filterCountText: {
    fontSize: SIZES.FONT.XSMALL,
    color: COLORS.TEXT.SECONDARY,
    fontWeight: 'bold',
  },
  filterCountTextActive: {
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
  listSubtitle: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    marginTop: 2,
  },
  listContent: {
    paddingHorizontal: SIZES.PADDING.LARGE,
    paddingBottom: SIZES.PADDING.XXXLARGE,
  },

  // Installment card
  installmentCard: {
    marginBottom: SIZES.PADDING.MEDIUM,
    borderRadius: SIZES.RADIUS.LARGE,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  installmentCardOverdue: {
    borderWidth: 2,
    borderColor: COLORS.ERROR,
  },
  cardGradient: {
    padding: SIZES.PADDING.MEDIUM,
    borderRadius: SIZES.RADIUS.LARGE,
  },
  debtHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SIZES.PADDING.SMALL,
  },
  debtInfo: {
    flex: 1,
  },
  debtId: {
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
  debtBadges: {
    flexDirection: 'row',
    gap: SIZES.PADDING.XSMALL,
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
  vehicleInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.PADDING.MEDIUM,
    paddingBottom: SIZES.PADDING.SMALL,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  vehicleModel: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
  },
  vehiclePrice: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
  },

  // Progress Section
  progressSection: {
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.PADDING.XSMALL,
  },
  progressLabel: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    fontWeight: '500',
  },
  progressPercentage: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.PRIMARY,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E9ECEF',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },

  // Debt Details
  debtDetails: {
    backgroundColor: '#F8F9FA',
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.SMALL,
    marginBottom: SIZES.PADDING.SMALL,
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
  detailValueHighlight: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.PRIMARY,
    fontWeight: 'bold',
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

export default CustomerDebtManagementScreen;