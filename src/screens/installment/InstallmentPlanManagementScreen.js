import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  Platform,
  TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SIZES } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import installmentPlanService from '../../services/installmentPlanService';
import {
  ArrowLeft,
  Plus,
  SquareChartGantt,
  Search,
  CheckCircle,
  XCircle,
  HelpCircle,
} from 'lucide-react-native';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';

const InstallmentPlanManagementScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { alertConfig, hideAlert, showInfo, showError } = useCustomAlert();
  const [plans, setPlans] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('Active');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const agencyId = user?.agencyId;
      if (!agencyId) {
        setPlans([]);
        setLoading(false);
        return;
      }
      const res = await installmentPlanService.getInstallmentPlansByAgency(agencyId, { page: 1, limit: 20 });
      const list = Array.isArray(res?.data) ? [...res.data] : [];
      list.sort((a, b) => {
        const aTime = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (bTime !== aTime) return bTime - aTime; // newest first
        // fallback by id desc
        const aId = Number(a?.id) || 0;
        const bId = Number(b?.id) || 0;
        return bId - aId;
      });
      setPlans(list);
    } catch (e) {
      console.error('Failed to load installment plans', e);
      showError('Lỗi', 'Không thể tải danh sách kế hoạch');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPlans();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPlans();
    setRefreshing(false);
  };

  const planStatusOptions = [
    { value: 'ACTIVE', label: 'Active', color: COLORS.SUCCESS },
    { value: 'INACTIVE', label: 'Inactive', color: COLORS.ERROR },
  ];

  const getStatusOption = (status) => {
    const normalised = status?.toUpperCase?.() || '';
    return planStatusOptions.find((option) => option.value === normalised);
  };

  const getStatusColor = (status) => getStatusOption(status)?.color || COLORS.TEXT.SECONDARY;

  const getStatusText = (status) => getStatusOption(status)?.label || 'Unknown';

  const getStatusIcon = (status) => {
    const normalised = status?.toUpperCase?.();
    switch (normalised) {
      case 'ACTIVE':
        return <CheckCircle size={14} color={COLORS.TEXT.WHITE} />;
      case 'INACTIVE':
        return <XCircle size={14} color={COLORS.TEXT.WHITE} />;
      default:
        return <HelpCircle size={14} color={COLORS.TEXT.WHITE} />;
    }
  };

  const filteredPlans = plans.filter((plan) => {
    const name = plan.name?.toLowerCase() || '';
    const paidType = plan.interestPaidType?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    const matchesSearch = name.includes(query) || paidType.includes(query);

    const status = plan.status?.toUpperCase?.();
    const matchesTab =
      activeTab === 'Active' ? status === 'ACTIVE' : status === 'INACTIVE';

    return matchesSearch && matchesTab;
  });

  const activePlans = plans.filter((plan) => plan.status?.toUpperCase?.() === 'ACTIVE').length;
  const inactivePlans = plans.filter((plan) => plan.status?.toUpperCase?.() === 'INACTIVE').length;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return 'N/A';
    }
  };

  const renderPlanCard = (plan) => (
    <TouchableOpacity
      key={plan.id}
      style={styles.planCard}
      activeOpacity={0.85}
      onPress={() => navigation.navigate('InstallmentPlanDetail', { installmentId: plan.id })}
    >
      <View style={styles.cardHeader}>
        <View style={styles.planInfo}>
          <Text style={styles.planName}>{plan.name || 'Unnamed Plan'}</Text>
          <Text style={styles.planSubtitle}>
            {plan.interestPaidType || 'Payment type unavailable'}
          </Text>
        </View>
        <View style={styles.statusContainer}>
          <View
            style={[styles.statusBadge, { backgroundColor: getStatusColor(plan.status) }]}
          >
            {getStatusIcon(plan.status)}
            <Text style={styles.statusText}>{getStatusText(plan.status)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.planDetailRow}>
          <Text style={styles.detailLabel}>Interest Rate</Text>
          <Text style={styles.detailValue}>
            {plan.interestRate != null ? `${plan.interestRate}%` : 'N/A'}
          </Text>
        </View>
        <View style={styles.planDetailRow}>
          <Text style={styles.detailLabel}>Installment Months</Text>
          <Text style={styles.detailValue}>
            {plan.totalPaidMonth != null ? plan.totalPaidMonth : '-'} /{' '}
            {plan.interestRateTotalMonth != null ? plan.interestRateTotalMonth : '-'}
          </Text>
        </View>
        <View style={styles.planDetailRow}>
          <Text style={styles.detailLabel}>Created At</Text>
          <Text style={styles.detailValue}>{formatDate(plan.createdAt)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft color={COLORS.TEXT.WHITE} size={18} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Installment Plans</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('CreateInstallmentPlan')}
        >
          <Plus color={COLORS.TEXT.WHITE} size={18} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.searchContainer}>
          <Search size={18} color={COLORS.TEXT.SECONDARY} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search plans, payment type..."
            placeholderTextColor={COLORS.TEXT.SECONDARY}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'Active' && styles.activeTabButton]}
            onPress={() => setActiveTab('Active')}
          >
            <Text style={[styles.tabText, activeTab === 'Active' && styles.activeTabText]}>
              Active ({activePlans})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'Inactive' && styles.activeTabButton]}
            onPress={() => setActiveTab('Inactive')}
          >
            <Text style={[styles.tabText, activeTab === 'Inactive' && styles.activeTabText]}>
              Inactive ({inactivePlans})
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading…</Text>
          </View>
        ) : filteredPlans.length > 0 ? (
          filteredPlans.map(renderPlanCard)
        ) : (
          <View style={styles.emptyState}>
            <SquareChartGantt size={64} color={COLORS.TEXT.SECONDARY} />
            <Text style={styles.emptyTitle}>
              {activeTab === 'Active' ? 'No Active Plans' : 'No Inactive Plans'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'Active'
                ? 'All plans are inactive or none exist yet'
                : 'All plans are currently active'}
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
    paddingTop: 30,
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
    backgroundColor: '#009DFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: SIZES.PADDING.XXXLARGE,
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
    gap: SIZES.PADDING.SMALL,
  },
  searchInput: {
    flex: 1,
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: SIZES.RADIUS.MEDIUM,
    marginHorizontal: SIZES.PADDING.MEDIUM,
    marginBottom: SIZES.PADDING.MEDIUM,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: SIZES.PADDING.SMALL,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    borderRadius: SIZES.RADIUS.SMALL,
    alignItems: 'center',
  },
  activeTabButton: {
    backgroundColor: '#009DFF',
  },
  tabText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
    fontWeight: '600',
  },
  activeTabText: {
    color: COLORS.TEXT.WHITE,
  },
  planCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.LARGE,
    padding: SIZES.PADDING.MEDIUM,
    marginHorizontal: SIZES.PADDING.MEDIUM,
    marginBottom: SIZES.PADDING.MEDIUM,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SIZES.PADDING.SMALL,
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: '#009DFF',
    marginBottom: 4,
  },
  planSubtitle: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
  },
  statusContainer: {
    marginLeft: SIZES.PADDING.SMALL,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.PADDING.SMALL,
    paddingVertical: 4,
    borderRadius: SIZES.RADIUS.SMALL,
    gap: 4,
  },
  statusText: {
    fontSize: SIZES.FONT.XSMALL,
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
  },
  cardContent: {
    marginTop: SIZES.PADDING.SMALL,
    gap: SIZES.PADDING.XSMALL,
  },
  planDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  loadingContainer: {
    paddingVertical: SIZES.PADDING.XXLARGE,
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.TEXT.SECONDARY,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.PADDING.XXXLARGE,
    marginHorizontal: SIZES.PADDING.MEDIUM,
    gap: SIZES.PADDING.SMALL,
  },
  emptyTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
    textAlign: 'center',
  },
});

export default InstallmentPlanManagementScreen;


