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
  ActivityIndicator,
} from 'react-native';
import { COLORS, SIZES } from '../../constants';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import { discountService } from '../../services/discountService';
import motorbikeService from '../../services/motorbikeService';
import agencyService from '../../services/agencyService';
import {
  ArrowLeft,
  Plus,
  Search,
  Tag,
  Percent,
  Calendar,
  Building2,
  Bike,
  CheckCircle,
  XCircle,
  Pencil,
  Trash2,
} from 'lucide-react-native';

const ACCENT_COLOR = '#009DFF';

const DiscountManagementScreen = ({ navigation }) => {
  const [discounts, setDiscounts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'ACTIVE', 'INACTIVE'
  const [filterType, setFilterType] = useState('all'); // 'all', 'VOLUME', 'SPECIAL'
  const [loading, setLoading] = useState(false);
  const [agencies, setAgencies] = useState([]);
  const [motorbikes, setMotorbikes] = useState([]);

  const { alertConfig, hideAlert, showSuccess, showError, showConfirm } = useCustomAlert();

  useEffect(() => {
    loadDiscounts();
    loadAgencies();
    loadMotorbikes();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadDiscounts();
    });
    return unsubscribe;
  }, [navigation]);

  const loadDiscounts = async () => {
    setLoading(true);
    try {
      const response = await discountService.getDiscounts(1, 100);
      if (response.success) {
        // Sort by ID descending (newest first)
        const sortedDiscounts = response.data.sort((a, b) => b.id - a.id);
        setDiscounts(sortedDiscounts);
      } else {
        showError('Error', response.error || 'Unable to load discount list');
      }
    } catch (error) {
      console.error('Error loading discounts:', error);
      showError('Error', 'Unable to load discount list');
    } finally {
      setLoading(false);
    }
  };

  const loadAgencies = async () => {
    try {
      const result = await agencyService.getAgencies({ limit: 100 });
      setAgencies(result?.data || []);
    } catch (error) {
      console.error('Error loading agencies:', error);
    }
  };

  const loadMotorbikes = async () => {
    try {
      const response = await motorbikeService.getAllMotorbikes({ limit: 100 });
      if (response.success && Array.isArray(response.data)) {
        setMotorbikes(response.data);
      }
    } catch (error) {
      console.error('Error loading motorbikes:', error);
    }
  };

  const handleAddDiscount = () => {
    navigation.navigate('AddDiscount');
  };

  const handleEditDiscount = (discount) => {
    navigation.navigate('EditDiscount', { discount });
  };

  const handleDeleteDiscount = (discount) => {
    showConfirm(
      'Confirm Delete',
      'Are you sure you want to delete this discount?',
      async () => {
        try {
          const response = await discountService.deleteDiscount(discount.id);
          if (response.success) {
            await loadDiscounts();
            showSuccess('Success', 'Discount deleted successfully!');
          } else {
            showError('Error', response.error || 'Unable to delete discount');
          }
        } catch (error) {
          console.error('Error deleting discount:', error);
          showError('Error', 'Unable to delete discount');
        }
      }
    );
  };

  const statusTabs = [
    { value: 'all', label: 'All' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'INACTIVE', label: 'Inactive' },
  ];

  const typeFilters = [
    { value: 'all', label: 'All' },
    { value: 'VOLUME', label: 'Volume' },
    { value: 'SPECIAL', label: 'Special' },
  ];

  const filteredDiscounts = discounts.filter((discount) => {
    const matchesSearch = discount.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      discount.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || discount.status === filterStatus;
    const matchesType = filterType === 'all' || discount.type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const totalDiscounts = discounts.length;
  const activeDiscounts = discounts.filter(discount => discount.status === 'ACTIVE').length;
  const inactiveDiscounts = discounts.filter(discount => discount.status === 'INACTIVE').length;

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  const renderDiscountCard = (discount) => {
    const numericValue = Number(discount.value);
    const formattedValue = discount.valueType === 'PERCENT'
      ? `${discount.value}%`
      : Number.isNaN(numericValue)
        ? `${discount.value || 0} VND`
        : `${numericValue.toLocaleString('vi-VN')} VND`;

    return (
      <View key={discount.id} style={styles.discountCard}>
        <View style={styles.cardHeader}>
          <View style={styles.discountInfo}>
            <Text style={styles.discountName}>{discount.name}</Text>
            <View style={styles.metaRow}>
              <View style={styles.metaChip}>
                <Tag size={14} color={ACCENT_COLOR} />
                <Text style={styles.metaChipText}>{discount.type === 'VOLUME' ? 'Volume' : 'Special'}</Text>
              </View>
              <View style={styles.metaChip}>
                <Percent size={14} color={ACCENT_COLOR} />
                <Text style={styles.metaChipText}>{formattedValue}</Text>
              </View>
              {discount.min_quantity ? (
                <View style={styles.metaChip}>
                  <Text style={styles.metaChipText}>{`Min ${discount.min_quantity}`}</Text>
                </View>
              ) : null}
            </View>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: discount.status === 'ACTIVE' ? COLORS.SUCCESS : COLORS.ERROR },
            ]}
          >
            {discount.status === 'ACTIVE' ? (
              <CheckCircle size={14} color={COLORS.TEXT.WHITE} style={styles.statusIcon} />
            ) : (
              <XCircle size={14} color={COLORS.TEXT.WHITE} style={styles.statusIcon} />
            )}
            <Text style={styles.statusText}>{discount.status === 'ACTIVE' ? 'Active' : 'Inactive'}</Text>
          </View>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.detailRow}>
            <View style={styles.detailLabelWrapper}>
              <Calendar size={14} color={COLORS.TEXT.SECONDARY} />
              <Text style={styles.detailLabel}>From</Text>
            </View>
            <Text style={styles.detailValue}>{formatDate(discount.startAt)}</Text>
          </View>
          <View style={styles.detailRow}>
            <View style={styles.detailLabelWrapper}>
              <Calendar size={14} color={COLORS.TEXT.SECONDARY} />
              <Text style={styles.detailLabel}>To</Text>
            </View>
            <Text style={styles.detailValue}>{formatDate(discount.endAt)}</Text>
          </View>
          {discount.agencyId && (
            <View style={styles.detailRow}>
              <View style={styles.detailLabelWrapper}>
                <Building2 size={14} color={COLORS.TEXT.SECONDARY} />
                <Text style={styles.detailLabel}>Agency</Text>
              </View>
              <Text style={styles.detailValue}>
                {agencies.find(a => a.id === discount.agencyId)?.name || `ID: ${discount.agencyId}`}
              </Text>
            </View>
          )}
          {discount.motorbikeId && (
            <View style={styles.detailRow}>
              <View style={styles.detailLabelWrapper}>
                <Bike size={14} color={COLORS.TEXT.SECONDARY} />
                <Text style={styles.detailLabel}>Motorbike</Text>
              </View>
              <Text style={styles.detailValue}>
                {motorbikes.find(b => b.id === discount.motorbikeId)?.name || `ID: ${discount.motorbikeId}`}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => handleEditDiscount(discount)}
          >
            <Pencil size={16} color={COLORS.TEXT.WHITE} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconButton, styles.iconButtonDanger]}
            onPress={() => handleDeleteDiscount(discount)}
          >
            <Trash2 size={16} color={COLORS.TEXT.WHITE} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft color={COLORS.TEXT.WHITE} size={18} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Discount Management</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddDiscount}
        >
          <Plus color={COLORS.TEXT.WHITE} size={18} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={18} color={COLORS.TEXT.SECONDARY} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search discount name..."
          placeholderTextColor={COLORS.TEXT.SECONDARY}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalDiscounts}</Text>
          <Text style={styles.statLabel}>Total Discounts</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: COLORS.SUCCESS }]}>{activeDiscounts}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: COLORS.SUCCESS }]}>{inactiveDiscounts}</Text>
          <Text style={styles.statLabel}>Inactive</Text>
        </View>
      </View>

      {/* Status Tabs */}
      <View style={styles.tabContainer}>
        {statusTabs.map((tab) => (
          <TouchableOpacity
            key={tab.value}
            style={[
              styles.tabButton,
              filterStatus === tab.value && styles.activeTabButton,
            ]}
            onPress={() => setFilterStatus(tab.value)}
          >
            <Text
              style={[
                styles.tabText,
                filterStatus === tab.value && styles.activeTabText,
              ]}
            >
              {tab.value === 'all'
                ? `All (${totalDiscounts})`
                : tab.value === 'ACTIVE'
                  ? `Active (${activeDiscounts})`
                  : `Inactive (${inactiveDiscounts})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Type Filters */}
      <View style={styles.typeFilterContainer}>
        {typeFilters.map((type) => (
          <TouchableOpacity
            key={type.value}
            style={[
              styles.typeFilterChip,
              filterType === type.value && styles.typeFilterChipActive,
            ]}
            onPress={() => setFilterType(type.value)}
          >
            <Text
              style={[
                styles.typeFilterText,
                filterType === type.value && styles.typeFilterTextActive,
              ]}
            >
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Discounts List */}
      <ScrollView
        style={styles.discountsList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.discountsContent}
      >
        {loading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={ACCENT_COLOR} />
            <Text style={styles.loadingText}>Loading discounts...</Text>
          </View>
        ) : filteredDiscounts.length > 0 ? (
          filteredDiscounts.map(renderDiscountCard)
        ) : (
          <View style={styles.emptyState}>
            <Tag size={64} color={COLORS.TEXT.SECONDARY} />
            <Text style={styles.emptyTitle}>No discounts</Text>
            <Text style={styles.emptySubtitle}>Create a new discount to get started</Text>
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
    backgroundColor: ACCENT_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
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
    color: ACCENT_COLOR,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: SIZES.FONT.XSMALL,
    color: COLORS.TEXT.SECONDARY,
    textAlign: 'center',
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
    backgroundColor: ACCENT_COLOR,
  },
  tabText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
    fontWeight: '600',
  },
  activeTabText: {
    color: COLORS.TEXT.WHITE,
  },
  typeFilterContainer: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    marginBottom: SIZES.PADDING.MEDIUM,
    gap: SIZES.PADDING.SMALL,
  },
  typeFilterChip: {
    flex: 1,
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  typeFilterChipActive: {
    borderColor: ACCENT_COLOR,
    backgroundColor: 'rgba(0, 157, 255, 0.12)',
  },
  typeFilterText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '600',
  },
  typeFilterTextActive: {
    color: ACCENT_COLOR,
  },
  discountsList: {
    flex: 1,
  },
  discountsContent: {
    padding: SIZES.PADDING.MEDIUM,
  },
  discountCard: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SIZES.PADDING.SMALL,
  },
  discountInfo: {
    flex: 1,
  },
  discountName: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: ACCENT_COLOR,
    marginBottom: SIZES.PADDING.XSMALL,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.PADDING.XSMALL,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 157, 255, 0.08)',
    borderRadius: SIZES.RADIUS.SMALL,
    paddingHorizontal: SIZES.PADDING.SMALL,
    paddingVertical: 4,
    gap: 6,
  },
  metaChipText: {
    fontSize: SIZES.FONT.XSMALL,
    color: ACCENT_COLOR,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.PADDING.SMALL,
    paddingVertical: 4,
    borderRadius: SIZES.RADIUS.SMALL,
  },
  statusIcon: {
    marginRight: 4,
  },
  statusText: {
    fontSize: SIZES.FONT.XSMALL,
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
  },
  cardContent: {
    marginBottom: SIZES.PADDING.MEDIUM,
    gap: SIZES.PADDING.XSMALL,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabelWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SIZES.PADDING.SMALL,
  },
  iconButton: {
    backgroundColor: '#000000',
    borderRadius: SIZES.RADIUS.SMALL,
    padding: SIZES.PADDING.SMALL,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 36,
    minHeight: 36,
  },
  iconButtonDanger: {
    backgroundColor: COLORS.ERROR,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.PADDING.XXXLARGE,
    gap: SIZES.PADDING.MEDIUM,
  },
  emptyTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
  },
  emptySubtitle: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
    textAlign: 'center',
  },
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.PADDING.XXLARGE,
    gap: SIZES.PADDING.SMALL,
  },
  loadingText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
  },
});

export default DiscountManagementScreen;

