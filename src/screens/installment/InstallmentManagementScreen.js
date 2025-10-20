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
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES } from '../../constants';
import installmentStorageService from '../../services/storage/installmentStorageService';

const InstallmentManagementScreen = ({ navigation }) => {
  const [installments, setInstallments] = useState([]);
  const [filteredInstallments, setFilteredInstallments] = useState([]);
  const [upcomingPayments, setUpcomingPayments] = useState([]);
  const [overduePayments, setOverduePayments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load data on mount and when screen focuses
  useEffect(() => {
    loadData();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  useEffect(() => {
    filterInstallments();
  }, [installments, searchQuery, selectedFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load from storage only; do not seed hardcoded mock data
      const allInstallments = await installmentStorageService.getInstallments();
      
      const upcoming = allInstallments.length ? await installmentStorageService.getUpcomingPayments(7) : [];
      const overdue = allInstallments.length ? await installmentStorageService.getOverduePayments() : [];
      
      setInstallments(allInstallments);
      setUpcomingPayments(upcoming);
      setOverduePayments(overdue);
    } catch (error) {
      console.error('Error loading installment data:', error);
      Alert.alert('Lỗi', 'Không thể tải dữ liệu trả góp');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const filterInstallments = () => {
    let filtered = installments;

    // Apply status filter
    if (selectedFilter === 'active') {
      filtered = filtered.filter(i => i.status === 'active');
    } else if (selectedFilter === 'completed') {
      filtered = filtered.filter(i => i.status === 'completed');
    } else if (selectedFilter === 'overdue') {
      filtered = filtered.filter(i => 
        i.paymentSchedule.some(p => p.status === 'overdue')
      );
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(i =>
        i.customerName.toLowerCase().includes(query) ||
        i.customerPhone.includes(searchQuery) ||
        i.vehicleModel.toLowerCase().includes(query) ||
        i.id.toLowerCase().includes(query)
      );
    }

    // Sort: newest created at the top
    filtered = [...filtered].sort((a, b) => {
      const aTime = new Date(a.createdAt || a.startDate || 0).getTime();
      const bTime = new Date(b.createdAt || b.startDate || 0).getTime();
      return bTime - aTime; // DESC
    });

    setFilteredInstallments(filtered);
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

  const getDaysUntilDue = (dueDate) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getProgressPercentage = (paidMonths, totalMonths) => {
    return Math.round((paidMonths / totalMonths) * 100);
  };

  const handleRecordPayment = async (installment) => {
    const nextPayment = installment.paymentSchedule.find(p => p.status === 'pending');
    
    if (!nextPayment) {
      Alert.alert('Thông báo', 'Không có khoản thanh toán nào đang chờ');
      return;
    }

    Alert.alert(
      'Xác nhận thanh toán',
      `Ghi nhận thanh toán tháng ${nextPayment.month}?\n\nSố tiền: ${formatCurrency(nextPayment.amount)}`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: async () => {
            try {
              await installmentStorageService.recordPayment(
                installment.id,
                nextPayment.month,
                {
                  paidAmount: nextPayment.amount,
                  paidDate: new Date().toISOString(),
                }
              );
              
              Alert.alert('Thành công', 'Đã ghi nhận thanh toán');
              await loadData();
            } catch (error) {
              Alert.alert('Lỗi', 'Không thể ghi nhận thanh toán');
            }
          }
        }
      ]
    );
  };

  const handleViewDetails = (installment) => {
    navigation.navigate('InstallmentDetail', { installment });
  };

  const renderUpcomingPayments = () => {
    if (upcomingPayments.length === 0) return null;

    return (
      <View style={styles.alertSection}>
        <View style={styles.alertHeader}>
          <Text style={styles.alertTitle}>⏰ Sắp tới hạn thanh toán</Text>
          <View style={styles.alertBadge}>
            <Text style={styles.alertBadgeText}>{upcomingPayments.length}</Text>
          </View>
        </View>
        
        {upcomingPayments.slice(0, 3).map((payment, index) => (
          <View key={index} style={styles.alertCard}>
            <View style={styles.alertCardLeft}>
              <Text style={styles.alertCustomerName}>{payment.customerName}</Text>
              <Text style={styles.alertVehicle}>{payment.vehicleModel}</Text>
              <Text style={styles.alertAmount}>{formatCurrency(payment.amount)}</Text>
            </View>
            <View style={styles.alertCardRight}>
              <View style={[styles.dueBadge, { backgroundColor: COLORS.WARNING }]}>
                <Text style={styles.dueBadgeText}>{payment.daysUntilDue} ngày</Text>
              </View>
              <Text style={styles.dueDate}>{formatDate(payment.dueDate)}</Text>
            </View>
          </View>
        ))}
        
        {upcomingPayments.length > 3 && (
          <TouchableOpacity style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>Xem tất cả ({upcomingPayments.length})</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderOverduePayments = () => {
    if (overduePayments.length === 0) return null;

    return (
      <View style={[styles.alertSection, { borderColor: COLORS.ERROR }]}>
        <View style={styles.alertHeader}>
          <Text style={[styles.alertTitle, { color: COLORS.ERROR }]}>🚨 Quá hạn thanh toán</Text>
          <View style={[styles.alertBadge, { backgroundColor: COLORS.ERROR }]}>
            <Text style={styles.alertBadgeText}>{overduePayments.length}</Text>
          </View>
        </View>
        
        {overduePayments.slice(0, 3).map((payment, index) => (
          <View key={index} style={[styles.alertCard, { borderLeftColor: COLORS.ERROR }]}>
            <View style={styles.alertCardLeft}>
              <Text style={styles.alertCustomerName}>{payment.customerName}</Text>
              <Text style={styles.alertVehicle}>{payment.vehicleModel}</Text>
              <Text style={styles.alertAmount}>{formatCurrency(payment.amount)}</Text>
            </View>
            <View style={styles.alertCardRight}>
              <View style={[styles.dueBadge, { backgroundColor: COLORS.ERROR }]}>
                <Text style={styles.dueBadgeText}>Quá {payment.daysOverdue} ngày</Text>
              </View>
              <Text style={styles.dueDate}>{formatDate(payment.dueDate)}</Text>
            </View>
          </View>
        ))}
        
        {overduePayments.length > 3 && (
          <TouchableOpacity style={styles.viewAllButton}>
            <Text style={[styles.viewAllText, { color: COLORS.ERROR }]}>Xem tất cả ({overduePayments.length})</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderInstallmentCard = ({ item }) => {
    const nextPayment = item.paymentSchedule.find(p => p.status === 'pending' || p.status === 'overdue');
    const progressPercentage = getProgressPercentage(item.paidMonths, item.installmentMonths);
    const hasOverdue = item.paymentSchedule.some(p => p.status === 'overdue');

    return (
      <TouchableOpacity
        style={[styles.installmentCard, hasOverdue && styles.installmentCardOverdue]}
        onPress={() => handleViewDetails(item)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={hasOverdue ? ['#FFE6E6', '#FFF5F5'] : ['#FFFFFF', '#F8F9FA']}
          style={styles.cardGradient}
        >
          {/* Header */}
          <View style={styles.cardHeader}>
            <View style={styles.installmentInfo}>
              <Text style={styles.installmentId}>#{item.id}</Text>
              <Text style={styles.customerName}>{item.customerName}</Text>
              <Text style={styles.customerPhone}>{item.customerPhone}</Text>
            </View>
            <View style={styles.statusBadges}>
              {hasOverdue && (
                <View style={[styles.statusBadge, { backgroundColor: COLORS.ERROR }]}>
                  <Text style={styles.statusBadgeText}>Quá hạn</Text>
                </View>
              )}
              <View style={[styles.statusBadge, { 
                backgroundColor: item.status === 'active' ? COLORS.SUCCESS : COLORS.TEXT.SECONDARY 
              }]}>
                <Text style={styles.statusBadgeText}>
                  {item.status === 'active' ? 'Đang trả' : 'Hoàn thành'}
                </Text>
              </View>
            </View>
          </View>

          {/* Vehicle Info */}
          <View style={styles.vehicleSection}>
            <Text style={styles.vehicleModel}>{item.vehicleModel}</Text>
            <Text style={styles.totalAmount}>{formatCurrency(item.totalAmount)}</Text>
          </View>

          {/* Payment Progress */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Đã trả {item.paidMonths}/{item.installmentMonths} tháng</Text>
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
          <View style={styles.paymentDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Trả hàng tháng:</Text>
              <Text style={styles.detailValueHighlight}>{formatCurrency(item.monthlyPayment)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Còn lại:</Text>
              <Text style={styles.detailValue}>{formatCurrency(item.remainingAmount)}</Text>
            </View>
            {nextPayment && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Kỳ tiếp theo:</Text>
                <Text style={[styles.detailValue, hasOverdue && { color: COLORS.ERROR }]}>
                  {formatDate(nextPayment.dueDate)}
                  {hasOverdue && ' (Quá hạn)'}
                </Text>
              </View>
            )}
          </View>

          {/* Action Button */}
          {item.status === 'active' && nextPayment && (
            <TouchableOpacity
              style={[styles.recordPaymentButton, hasOverdue && styles.recordPaymentButtonUrgent]}
              onPress={() => handleRecordPayment(item)}
            >
              <LinearGradient
                colors={hasOverdue ? COLORS.GRADIENT.ERROR : COLORS.GRADIENT.BLUE}
                style={styles.recordPaymentGradient}
              >
                <Text style={styles.recordPaymentText}>
                  {hasOverdue ? '⚠️ Ghi nhận thanh toán quá hạn' : '✓ Ghi nhận thanh toán tháng ' + nextPayment.month}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const filterOptions = [
    { key: 'all', label: 'Tất cả', count: installments.length },
    { key: 'active', label: 'Đang trả', count: installments.filter(i => i.status === 'active').length },
    { key: 'overdue', label: 'Quá hạn', count: overduePayments.length },
    { key: 'completed', label: 'Hoàn thành', count: installments.filter(i => i.status === 'completed').length },
  ];

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
            <Text style={styles.headerTitleText}>Quản lý trả góp</Text>
            <Text style={styles.headerSubtitle}>
              {installments.length} khoản trả góp
            </Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Overdue Payments Alert */}
        {renderOverduePayments()}

        {/* Upcoming Payments */}
        {renderUpcomingPayments()}

        {/* Search */}
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
        </View>

        {/* Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterSection}
          contentContainerStyle={styles.filterContent}
        >
          {filterOptions.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.filterChip,
                selectedFilter === option.key && styles.filterChipActive
              ]}
              onPress={() => setSelectedFilter(option.key)}
            >
              <Text style={[
                styles.filterLabel,
                selectedFilter === option.key && styles.filterLabelActive
              ]}>
                {option.label}
              </Text>
              <View style={[
                styles.filterCount,
                selectedFilter === option.key && styles.filterCountActive
              ]}>
                <Text style={[
                  styles.filterCountText,
                  selectedFilter === option.key && styles.filterCountTextActive
                ]}>
                  {option.count}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Installment List */}
        <View style={styles.listSection}>
          <Text style={styles.listTitle}>
            Danh sách trả góp ({filteredInstallments.length})
          </Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Đang tải...</Text>
            </View>
          ) : filteredInstallments.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📅</Text>
              <Text style={styles.emptyTitle}>Không có khoản trả góp</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery ? 'Thử tìm kiếm khác' : 'Chưa có khoản trả góp nào'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredInstallments}
              renderItem={renderInstallmentCard}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              contentContainerStyle={styles.listContent}
            />
          )}
        </View>
      </ScrollView>
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
  headerSpacer: {
    width: 40,
  },

  // Content
  content: {
    flex: 1,
  },

  // Alert Section
  alertSection: {
    marginHorizontal: SIZES.PADDING.LARGE,
    marginVertical: SIZES.PADDING.MEDIUM,
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.LARGE,
    padding: SIZES.PADDING.MEDIUM,
    borderWidth: 2,
    borderColor: COLORS.WARNING,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  alertTitle: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.WARNING,
  },
  alertBadge: {
    backgroundColor: COLORS.WARNING,
    borderRadius: 12,
    paddingHorizontal: SIZES.PADDING.SMALL,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  alertBadgeText: {
    fontSize: SIZES.FONT.XSMALL,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
  alertCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.SMALL,
    marginBottom: SIZES.PADDING.SMALL,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.WARNING,
  },
  alertCardLeft: {
    flex: 1,
  },
  alertCustomerName: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: 2,
  },
  alertVehicle: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: 2,
  },
  alertAmount: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
  },
  alertCardRight: {
    alignItems: 'flex-end',
  },
  dueBadge: {
    paddingHorizontal: SIZES.PADDING.SMALL,
    paddingVertical: SIZES.PADDING.XSMALL,
    borderRadius: SIZES.RADIUS.SMALL,
    marginBottom: 4,
  },
  dueBadgeText: {
    fontSize: SIZES.FONT.XSMALL,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
  dueDate: {
    fontSize: SIZES.FONT.XSMALL,
    color: COLORS.TEXT.SECONDARY,
  },
  viewAllButton: {
    paddingVertical: SIZES.PADDING.SMALL,
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },

  // Search
  searchSection: {
    paddingHorizontal: SIZES.PADDING.LARGE,
    paddingVertical: SIZES.PADDING.MEDIUM,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.LARGE,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
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

  // Filters
  filterSection: {
    paddingHorizontal: SIZES.PADDING.LARGE,
    marginBottom: SIZES.PADDING.MEDIUM,
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
    gap: SIZES.PADDING.XSMALL,
  },
  filterChipActive: {
    backgroundColor: COLORS.PRIMARY,
  },
  filterLabel: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '500',
  },
  filterLabelActive: {
    color: COLORS.TEXT.WHITE,
    fontWeight: 'bold',
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

  // List
  listSection: {
    paddingHorizontal: SIZES.PADDING.LARGE,
    paddingBottom: SIZES.PADDING.XXXLARGE,
  },
  listTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  listContent: {
    paddingBottom: SIZES.PADDING.LARGE,
  },

  // Installment Card
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SIZES.PADDING.SMALL,
  },
  installmentInfo: {
    flex: 1,
  },
  installmentId: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.PRIMARY,
    fontWeight: 'bold',
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
  statusBadgeText: {
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
  vehicleModel: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
  },
  totalAmount: {
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

  // Payment Details
  paymentDetails: {
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

  // Record Payment Button
  recordPaymentButton: {
    marginTop: SIZES.PADDING.SMALL,
    borderRadius: SIZES.RADIUS.MEDIUM,
    overflow: 'hidden',
  },
  recordPaymentButtonUrgent: {
    // Additional styles for urgent payments
  },
  recordPaymentGradient: {
    paddingVertical: SIZES.PADDING.SMALL,
    alignItems: 'center',
  },
  recordPaymentText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.WHITE,
    fontWeight: 'bold',
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
  },
});

export default InstallmentManagementScreen;
