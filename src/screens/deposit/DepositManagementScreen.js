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
import depositService from '../../services/depositService';
import { getQuotationById } from '../../services/quotationService';
import { ArrowLeft, Plus, Search, FileText } from 'lucide-react-native';

const DepositManagementScreen = ({ navigation }) => {
  const { alertConfig, hideAlert, showConfirm, showInfo } = useCustomAlert();
  const { user } = useAuth();
  const userRole = user?.role;
  const isDealerManager = userRole === USER_ROLES.DEALER_MANAGER;
  
  // State management
  const [deposits, setDeposits] = useState([]);
  const [filteredDeposits, setFilteredDeposits] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

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
  }, [deposits, searchQuery, selectedStatus]);

  const loadDeposits = async () => {
    try {
      setLoading(true);
      
      // TODO: When API list endpoint is available, replace with:
      // const result = await depositService.getDeposits();
      // For now, deposits must be loaded via their IDs from another source
      // (e.g., from quotations or stored deposit IDs)
      
      setDeposits([]);
      setLoading(false);
    } catch (error) {
      console.error('Error loading deposits:', error);
      showInfo('Error', 'Failed to load deposits');
      setLoading(false);
    }
  };

  // Map API deposit response to UI deposit format
  const mapApiDepositToUIDeposit = async (apiDeposit) => {
    try {
      // API response: { id, depositPercent, depositAmount, holdDay, status, quotationId }
      let deposit = {
        id: apiDeposit.id?.toString() || '',
        apiDepositId: apiDeposit.id?.toString() || null, // Store API ID for reference
        depositAmount: apiDeposit.depositAmount || 0,
        depositPercentage: apiDeposit.depositPercent || 0,
        holdDay: apiDeposit.holdDay || null,
        quotationId: apiDeposit.quotationId || null,
        // Map status from API to UI format
        status: mapApiStatusToUI(apiDeposit.status),
      };

      // If deposit has quotationId, fetch quotation details for customer/vehicle info
      if (deposit.quotationId) {
        const quotationResult = await getQuotationById(deposit.quotationId);
        if (quotationResult.success && quotationResult.data) {
          const quotation = quotationResult.data;
          // Extract customer and vehicle info from quotation
          deposit.customerName = quotation.customerName || quotation.customer?.name || 'N/A';
          deposit.customerPhone = quotation.customerPhone || quotation.customer?.phone || 'N/A';
          deposit.customerEmail = quotation.customerEmail || quotation.customer?.email || '';
          deposit.vehicleModel = quotation.vehicleModel || quotation.items?.[0]?.model || 'N/A';
          deposit.vehicleColor = quotation.vehicleColor || quotation.items?.[0]?.color || 'N/A';
          deposit.vehiclePrice = quotation.totalAmount || quotation.items?.[0]?.price || 0;
          
          // Calculate remaining amount
          deposit.remainingAmount = deposit.vehiclePrice - deposit.depositAmount;
          
          // Extract dates
          deposit.depositDate = deposit.holdDay || quotation.createdAt;
          deposit.expectedDeliveryDate = quotation.expectedDeliveryDate;
        }
      } else {
        // If no quotation, use defaults
        deposit.customerName = 'N/A';
        deposit.customerPhone = 'N/A';
        deposit.vehicleModel = 'N/A';
        deposit.vehicleColor = 'N/A';
        deposit.vehiclePrice = 0;
        deposit.remainingAmount = 0;
        deposit.depositDate = deposit.holdDay || new Date().toISOString();
      }

      // Created date
      deposit.createdAt = deposit.holdDay || deposit.depositDate || new Date().toISOString();

      return deposit;
    } catch (error) {
      console.error('Error mapping deposit:', error);
      return null;
    }
  };

  // Map API status to UI status format
  const mapApiStatusToUI = (apiStatus) => {
    const statusMap = {
      'PENDING': 'pending',
      'HOLDING': 'holding',
      'APPLIED': 'applied',
      'EXPIRED': 'expired',
    };
    return statusMap[apiStatus?.toUpperCase()] || 'pending';
  };

  // Map UI status to API status format
  const mapUIStatusToAPI = (uiStatus) => {
    const statusMap = {
      'pending': 'PENDING',
      'holding': 'HOLDING',
      'applied': 'APPLIED',
      'expired': 'EXPIRED',
    };
    return statusMap[uiStatus?.toLowerCase()] || 'PENDING';
  };

  const filterDeposits = () => {
    let filtered = deposits;

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(d => d.status === selectedStatus);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(d =>
        (d.customerName && d.customerName.toLowerCase().includes(query)) ||
        (d.customerPhone && d.customerPhone.includes(searchQuery)) ||
        (d.vehicleModel && d.vehicleModel.toLowerCase().includes(query)) ||
        (d.id && d.id.toString().toLowerCase().includes(query))
      );
    }

    // Sort by newest first (holdDay desc)
    filtered = filtered.sort((a, b) => {
      const aTime = new Date(a.holdDay || a.createdAt || 0).getTime();
      const bTime = new Date(b.holdDay || b.createdAt || 0).getTime();
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
      case 'pending': return COLORS.WARNING; // Chờ khách trả cọc
      case 'holding': return COLORS.SUCCESS; // Đã trả cọc xong
      case 'applied': return COLORS.PRIMARY; // Đã áp dụng
      case 'expired': return COLORS.ERROR; // Đã hết hạn
      default: return COLORS.TEXT.SECONDARY;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'holding': return 'Holding';
      case 'applied': return 'Applied';
      case 'expired': return 'Expired';
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
    return new Date(dateString).toLocaleDateString('en-US');
  };



  const handleEditDeposit = (deposit) => {
    navigation.navigate('EditDeposit', { 
      deposit,
      onDepositUpdate: handleDepositUpdate,
    });
  };

  const handleDepositUpdate = async (updatedDeposit) => {
    // Reload deposits to get latest data
    await loadDeposits();
    
    // If deposit status changed, switch to that status filter
    if (updatedDeposit && updatedDeposit.status) {
      setSelectedStatus(updatedDeposit.status);
    }
  };


  const renderDepositCard = ({ item }) => {
    const isCompleted = item.status === 'applied' || item.status === 'expired';

    return (
      <TouchableOpacity
        style={styles.depositCard}
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
              <Text style={styles.customerName}>{item.customerName || 'N/A'}</Text>
              <Text style={styles.customerPhone}>{item.customerPhone || 'N/A'}</Text>
            </View>
            <View style={styles.statusBadges}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                <Text style={styles.badgeText}>{getStatusText(item.status)}</Text>
              </View>
            </View>
          </View>

          {/* Vehicle Info */}
          <View style={styles.vehicleSection}>
            <View style={styles.vehicleInfo}>
              <Text style={styles.vehicleModel}>{item.vehicleModel || 'N/A'}</Text>
              <Text style={styles.vehicleColor}>Color: {item.vehicleColor || 'N/A'}</Text>
            </View>
            {item.vehiclePrice > 0 && (
              <Text style={styles.vehiclePrice}>{formatCurrency(item.vehiclePrice)}</Text>
            )}
          </View>

          {/* Deposit Amount */}
          <View style={styles.depositAmountSection}>
            <View style={styles.depositAmountCard}>
              <Text style={styles.depositAmountLabel}>Deposit Paid</Text>
              <Text style={styles.depositAmountValue}>{formatCurrency(item.depositAmount)}</Text>
              <Text style={styles.depositPercentage}>{item.depositPercentage}% of total</Text>
            </View>
            <View style={styles.remainingAmountCard}>
              <Text style={styles.remainingAmountLabel}>Remaining</Text>
              <Text style={styles.remainingAmountValue}>{formatCurrency(item.remainingAmount || 0)}</Text>
            </View>
          </View>

          {/* Delivery Info */}
          <View style={styles.deliveryInfo}>
            <View style={styles.deliveryRow}>
              <Text style={styles.deliveryLabel}>Deposit Date:</Text>
              <Text style={styles.deliveryValue}>{formatDate(item.depositDate || item.holdDay)}</Text>
            </View>
            {item.expectedDeliveryDate && (
              <View style={styles.deliveryRow}>
                <Text style={styles.deliveryLabel}>Expected Delivery:</Text>
                <Text style={styles.deliveryValue}>{formatDate(item.expectedDeliveryDate)}</Text>
              </View>
            )}
            {item.quotationId && (
              <View style={styles.deliveryRow}>
                <Text style={styles.deliveryLabel}>Quotation ID:</Text>
                <Text style={styles.deliveryValueHighlight}>#{item.quotationId}</Text>
              </View>
            )}
          </View>

          {/* Action Indicator */}
          {!isCompleted && (
            <View style={styles.actionIndicator}>
              <Text style={styles.actionText}>
                {item.status === 'pending' 
                  ? '⏳ Waiting for deposit payment'
                  : item.status === 'holding'
                  ? '✅ Deposit received - Awaiting processing'
                  : '🚗 Processing'}
              </Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  };


  const renderStatusFilter = () => {
    const statusOptions = [
      { key: 'all', label: 'All', count: deposits.length },
      { key: 'pending', label: 'Pending', count: deposits.filter(d => d.status === 'pending').length },
      { key: 'holding', label: 'Holding', count: deposits.filter(d => d.status === 'holding').length },
      { key: 'applied', label: 'Applied', count: deposits.filter(d => d.status === 'applied').length },
      { key: 'expired', label: 'Expired', count: deposits.filter(d => d.status === 'expired').length },
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


  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={24} color={COLORS.TEXT.WHITE} />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={styles.headerTitleText}>Deposit Management</Text>
            <Text style={styles.headerSubtitle}>
              {deposits.length} deposits
            </Text>
          </View>
          {!isDealerManager && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('CreateDeposit')}
            >
              <Plus size={24} color={COLORS.TEXT.WHITE} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Search size={20} color={COLORS.TEXT.SECONDARY} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search deposits..."
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
            Deposit List ({filteredDeposits.length})
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading...</Text>
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
                <FileText size={64} color={COLORS.TEXT.SECONDARY} />
                <Text style={styles.emptyTitle}>No Deposits</Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery 
                    ? 'Try a different search' 
                    : 'No deposits yet'
                  }
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
    gap: SIZES.PADDING.SMALL,
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

export default DepositManagementScreen;
