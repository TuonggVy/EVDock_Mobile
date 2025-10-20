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
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS, SIZES } from '../../constants';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';

const ManufacturerDebtManagementScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { alertConfig, hideAlert, showConfirm, showInfo } = useCustomAlert();
  
  // State management
  const [debts, setDebts] = useState([]);
  const [filteredDebts, setFilteredDebts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Mock data - Manufacturer Debts
  const mockManufacturerDebts = [
    {
      id: 'MD001',
      manufacturerName: 'Tesla Inc.',
      manufacturerCode: 'TSLA',
      debtType: 'lump_sum', // lump_sum, rolling_credit
      totalDebtAmount: 50000000000, // 50 billion VND
      remainingDebtAmount: 35000000000, // 35 billion VND remaining
      paidAmount: 15000000000, // 15 billion VND paid
      paymentType: 'full_payment', // full_payment, rolling_credit
      creditLimit: null, // null for lump sum
      availableCredit: null, // null for lump sum
      vehiclesOrdered: 25,
      vehiclesDelivered: 15,
      vehiclesPending: 10,
      orderDate: '2024-01-15',
      dueDate: '2024-12-31',
      lastPaymentDate: '2024-11-01',
      nextPaymentDate: '2024-12-01',
      interestRate: 0, // Usually no interest for manufacturer debt
      status: 'active', // active, completed, overdue, blocked
      blocked: false,
      blockedReason: null,
      createdAt: '2024-01-15',
      createdBy: 'Dealer Manager'
    },
    {
      id: 'MD002',
      manufacturerName: 'Tesla Inc.',
      manufacturerCode: 'TSLA',
      debtType: 'rolling_credit',
      totalDebtAmount: 0, // No fixed amount for rolling credit
      remainingDebtAmount: 20000000000, // 20 billion VND outstanding
      paidAmount: 0,
      paymentType: 'rolling_credit',
      creditLimit: 50000000000, // 50 billion VND credit limit
      availableCredit: 30000000000, // 30 billion VND available
      vehiclesOrdered: 40,
      vehiclesDelivered: 30,
      vehiclesPending: 10,
      orderDate: '2024-06-01',
      dueDate: null, // No fixed due date for rolling credit
      lastPaymentDate: '2024-11-15',
      nextPaymentDate: null,
      interestRate: 0,
      status: 'active',
      blocked: false,
      blockedReason: null,
      createdAt: '2024-06-01',
      createdBy: 'Dealer Manager'
    },
    {
      id: 'MD003',
      manufacturerName: 'Tesla Inc.',
      manufacturerCode: 'TSLA',
      debtType: 'lump_sum',
      totalDebtAmount: 30000000000, // 30 billion VND
      remainingDebtAmount: 30000000000, // 30 billion VND (not paid yet)
      paidAmount: 0,
      paymentType: 'full_payment',
      creditLimit: null,
      availableCredit: null,
      vehiclesOrdered: 15,
      vehiclesDelivered: 0,
      vehiclesPending: 15,
      orderDate: '2024-11-01',
      dueDate: '2025-02-28',
      lastPaymentDate: null,
      nextPaymentDate: '2025-02-28',
      interestRate: 0,
      status: 'pending',
      blocked: false,
      blockedReason: null,
      createdAt: '2024-11-01',
      createdBy: 'Dealer Manager'
    },
    {
      id: 'MD004',
      manufacturerName: 'Tesla Inc.',
      manufacturerCode: 'TSLA',
      debtType: 'rolling_credit',
      totalDebtAmount: 0,
      remainingDebtAmount: 80000000000, // 80 billion VND (exceeded limit)
      paidAmount: 0,
      paymentType: 'rolling_credit',
      creditLimit: 50000000000, // 50 billion VND credit limit
      availableCredit: 0, // No available credit (exceeded)
      vehiclesOrdered: 60,
      vehiclesDelivered: 40,
      vehiclesPending: 20,
      orderDate: '2024-08-01',
      dueDate: null,
      lastPaymentDate: '2024-10-15',
      nextPaymentDate: null,
      interestRate: 0,
      status: 'blocked',
      blocked: true,
      blockedReason: 'Credit limit exceeded',
      createdAt: '2024-08-01',
      createdBy: 'Dealer Manager'
    }
  ];

  const debtTypeFilters = [
    { id: 'all', name: 'All', color: COLORS.TEXT.SECONDARY },
    { id: 'lump_sum', name: 'Trả một lần', color: COLORS.PRIMARY },
    { id: 'rolling_credit', name: 'Gối đầu', color: COLORS.WARNING },
  ];

  const statusFilters = [
    { id: 'all', name: 'All', color: COLORS.TEXT.SECONDARY },
    { id: 'active', name: 'Active', color: COLORS.SUCCESS },
    { id: 'pending', name: 'Pending', color: COLORS.WARNING },
    { id: 'overdue', name: 'Overdue', color: COLORS.ERROR },
    { id: 'blocked', name: 'Blocked', color: COLORS.ERROR },
    { id: 'completed', name: 'Completed', color: COLORS.TEXT.SECONDARY },
  ];

  // Load debts on component mount
  useEffect(() => {
    loadDebts();
  }, []);

  // Filter debts when search or type changes
  useEffect(() => {
    filterDebts();
  }, [searchQuery, selectedType, debts]);

  const loadDebts = async () => {
    try {
      setLoading(true);
      
      // TODO: Replace with actual API call
      // const response = await manufacturerDebtService.getManufacturerDebts();
      // setDebts(response.data);
      
      // Mock data for development
      setTimeout(() => {
        setDebts(mockManufacturerDebts);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading manufacturer debts:', error);
      showInfo('Error', 'Failed to load manufacturer debts');
      setLoading(false);
    }
  };

  const filterDebts = () => {
    let filtered = debts;

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(debt => debt.debtType === selectedType);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(debt =>
        debt.manufacturerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        debt.manufacturerCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        debt.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredDebts(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDebts();
    setRefreshing(false);
  };

  const getDebtTypeText = (type) => {
    switch (type) {
      case 'lump_sum': return 'Trả một lần';
      case 'rolling_credit': return 'Gối đầu';
      default: return 'Unknown';
    }
  };

  const getDebtTypeColor = (type) => {
    switch (type) {
      case 'lump_sum': return COLORS.PRIMARY;
      case 'rolling_credit': return COLORS.WARNING;
      default: return COLORS.TEXT.SECONDARY;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return COLORS.SUCCESS;
      case 'pending': return COLORS.WARNING;
      case 'overdue': return COLORS.ERROR;
      case 'blocked': return COLORS.ERROR;
      case 'completed': return COLORS.TEXT.SECONDARY;
      default: return COLORS.TEXT.SECONDARY;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Active';
      case 'pending': return 'Pending';
      case 'overdue': return 'Overdue';
      case 'blocked': return 'Blocked';
      case 'completed': return 'Completed';
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

  const getCreditUtilization = (remaining, limit) => {
    if (!limit) return 0;
    return Math.round((remaining / limit) * 100);
  };

  const renderDebtCard = ({ item }) => (
    <TouchableOpacity
      style={[styles.debtCard, item.blocked && styles.blockedCard]}
      onPress={() => handleViewDebt(item)}
    >
      <View style={styles.debtHeader}>
        <View style={styles.debtInfo}>
          <Text style={styles.debtId}>{item.id}</Text>
          <Text style={styles.manufacturerName}>{item.manufacturerName}</Text>
          <Text style={styles.manufacturerCode}>{item.manufacturerCode}</Text>
        </View>
        <View style={styles.debtBadges}>
          <View style={[styles.typeBadge, { backgroundColor: getDebtTypeColor(item.debtType) }]}>
            <Text style={styles.badgeText}>{getDebtTypeText(item.debtType)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.badgeText}>{getStatusText(item.status)}</Text>
          </View>
          {item.blocked && (
            <View style={[styles.blockedBadge, { backgroundColor: COLORS.ERROR }]}>
              <Text style={styles.badgeText}>BLOCKED</Text>
            </View>
          )}
        </View>
      </View>
      
      <View style={styles.vehicleSummary}>
        <View style={styles.vehicleStat}>
          <Text style={styles.vehicleStatNumber}>{item.vehiclesOrdered}</Text>
          <Text style={styles.vehicleStatLabel}>Đã đặt</Text>
        </View>
        <View style={styles.vehicleStat}>
          <Text style={styles.vehicleStatNumber}>{item.vehiclesDelivered}</Text>
          <Text style={styles.vehicleStatLabel}>Đã giao</Text>
        </View>
        <View style={styles.vehicleStat}>
          <Text style={styles.vehicleStatNumber}>{item.vehiclesPending}</Text>
          <Text style={styles.vehicleStatLabel}>Chờ giao</Text>
        </View>
      </View>
      
      <View style={styles.debtDetails}>
        {item.debtType === 'lump_sum' && (
          <>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Tổng nợ:</Text>
              <Text style={styles.detailValue}>{formatCurrency(item.totalDebtAmount)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Còn nợ:</Text>
              <Text style={styles.detailValue}>{formatCurrency(item.remainingDebtAmount)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Đã trả:</Text>
              <Text style={styles.detailValue}>{formatCurrency(item.paidAmount)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Hạn thanh toán:</Text>
              <Text style={styles.detailValue}>{formatDate(item.dueDate)}</Text>
            </View>
          </>
        )}
        
        {item.debtType === 'rolling_credit' && (
          <>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Hạn mức tín dụng:</Text>
              <Text style={styles.detailValue}>{formatCurrency(item.creditLimit)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Đang nợ:</Text>
              <Text style={styles.detailValue}>{formatCurrency(item.remainingDebtAmount)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Còn có thể vay:</Text>
              <Text style={styles.detailValue}>{formatCurrency(item.availableCredit)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Sử dụng tín dụng:</Text>
              <Text style={[styles.detailValue, { 
                color: getCreditUtilization(item.remainingDebtAmount, item.creditLimit) > 80 ? COLORS.ERROR : COLORS.PRIMARY 
              }]}>
                {getCreditUtilization(item.remainingDebtAmount, item.creditLimit)}%
              </Text>
            </View>
            <View style={styles.creditBar}>
              <View style={[
                styles.creditProgress,
                {
                  width: `${Math.min(getCreditUtilization(item.remainingDebtAmount, item.creditLimit), 100)}%`,
                  backgroundColor: getCreditUtilization(item.remainingDebtAmount, item.creditLimit) > 80 ? COLORS.ERROR : COLORS.PRIMARY
                }
              ]} />
            </View>
          </>
        )}
        
        {item.blocked && (
          <View style={styles.blockedWarning}>
            <Text style={styles.blockedWarningText}>
              ⚠️ {item.blockedReason}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderTypeFilter = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.typeFilter}
      contentContainerStyle={styles.typeFilterContent}
    >
      {debtTypeFilters.map((type) => (
        <TouchableOpacity
          key={type.id}
          style={[
            styles.typeChip,
            selectedType === type.id && styles.selectedTypeChip,
            { borderColor: type.color }
          ]}
          onPress={() => setSelectedType(type.id)}
        >
          <View style={[styles.typeDot, { backgroundColor: type.color }]} />
          <Text style={[
            styles.typeChipText,
            selectedType === type.id && styles.selectedTypeChipText
          ]}>
            {type.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const handleViewDebt = (debt) => {
    // TODO: Navigate to debt detail screen
    showInfo('Debt Detail', `View details for ${debt.id}`);
  };

  const handleAddDebt = () => {
    // TODO: Navigate to add debt screen
    showInfo('Add Debt', 'Navigate to add debt screen');
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
            <Text style={styles.headerTitleText}>Manufacturer Debt</Text>
            <Text style={styles.headerSubtitle}>Manage manufacturer debts</Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddDebt}
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
            placeholder="Search debts..."
            placeholderTextColor={COLORS.TEXT.SECONDARY}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        {renderTypeFilter()}
      </View>

      {/* Debts List */}
      <View style={styles.content}>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>
            Manufacturer Debts ({filteredDebts.length})
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading debts...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredDebts || []}
            renderItem={renderDebtCard}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>🏭</Text>
                <Text style={styles.emptyTitle}>No debts found</Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery ? 'Try adjusting your search' : 'No manufacturer debts available'}
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

  // Type filter
  typeFilter: {
    marginBottom: SIZES.PADDING.SMALL,
  },
  typeFilterContent: {
    paddingRight: SIZES.PADDING.LARGE,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.ROUND,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    marginRight: SIZES.PADDING.SMALL,
    borderWidth: 1,
  },
  selectedTypeChip: {
    backgroundColor: COLORS.PRIMARY,
  },
  typeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SIZES.PADDING.XSMALL,
  },
  typeChipText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '500',
  },
  selectedTypeChipText: {
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

  // Debt card
  debtCard: {
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
  blockedCard: {
    borderWidth: 2,
    borderColor: COLORS.ERROR,
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
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginBottom: 2,
  },
  manufacturerName: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: 2,
  },
  manufacturerCode: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
  },
  debtBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
  blockedBadge: {
    paddingHorizontal: SIZES.PADDING.SMALL,
    paddingVertical: SIZES.PADDING.XSMALL,
    borderRadius: SIZES.RADIUS.SMALL,
  },
  badgeText: {
    fontSize: SIZES.FONT.XSMALL,
    color: COLORS.TEXT.WHITE,
    fontWeight: 'bold',
  },
  
  // Vehicle summary
  vehicleSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    backgroundColor: '#F8F9FA',
    borderRadius: SIZES.RADIUS.MEDIUM,
  },
  vehicleStat: {
    alignItems: 'center',
  },
  vehicleStatNumber: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
  },
  vehicleStatLabel: {
    fontSize: SIZES.FONT.XSMALL,
    color: COLORS.TEXT.SECONDARY,
    marginTop: 2,
  },
  
  debtDetails: {
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
  
  // Credit utilization bar
  creditBar: {
    height: 6,
    backgroundColor: '#E9ECEF',
    borderRadius: 3,
    marginTop: SIZES.PADDING.SMALL,
  },
  creditProgress: {
    height: '100%',
    borderRadius: 3,
  },
  
  // Blocked warning
  blockedWarning: {
    backgroundColor: '#FFE6E6',
    padding: SIZES.PADDING.SMALL,
    borderRadius: SIZES.RADIUS.SMALL,
    marginTop: SIZES.PADDING.SMALL,
  },
  blockedWarningText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.ERROR,
    fontWeight: '500',
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

export default ManufacturerDebtManagementScreen;
