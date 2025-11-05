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
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { COLORS, SIZES } from '../../constants';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import stockPromotionService from '../../services/stockPromotionService';
import { useAuth } from '../../contexts/AuthContext';
import { Search, Plus, ArrowLeft, Package } from 'lucide-react-native';

const StockPromotionManagementScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [stockPromotions, setStockPromotions] = useState([]);
  const [filteredStockPromotions, setFilteredStockPromotions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [paginationInfo, setPaginationInfo] = useState({
    page: 1,
    limit: 100,
    total: 0
  });

  const { alertConfig, hideAlert, showSuccess, showError } = useCustomAlert();

  useEffect(() => {
    loadStockPromotions();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadStockPromotions();
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    filterStockPromotions();
  }, [searchQuery, stockPromotions]);


  const loadStockPromotions = async () => {
    try {
      setLoading(true);
      const agencyId = user?.agencyId;
      console.log('🔄 [StockPromotionManagement] Loading stock promotions for agencyId:', agencyId);
      
      if (!agencyId) {
        showError('Error', 'Agency information not found');
        return;
      }

      const response = await stockPromotionService.getStockPromotionList(
        parseInt(agencyId),
        { page: 1, limit: 100 }
      );

      console.log('📦 [StockPromotionManagement] API Response:', {
        success: response.success,
        dataLength: response.data?.length || 0,
        error: response.error || null,
        sampleData: response.data?.[0] || null
      });

      if (response.success) {
        const data = response.data || [];
        // Sort by ID descending (newest first - highest ID = created last)
        const sortedData = data.sort((a, b) => (b.id || 0) - (a.id || 0));
        console.log('✅ [StockPromotionManagement] Loaded', sortedData.length, 'items');
        setStockPromotions(sortedData);
        setPaginationInfo(response.pagination || { page: 1, limit: 100, total: sortedData.length });
      } else {
        console.error('❌ [StockPromotionManagement] API Error:', response.error);
        showError('Error', response.error || 'Failed to load stock promotion list');
      }
    } catch (error) {
      console.error('❌ [StockPromotionManagement] Exception:', error);
      showError('Error', 'Failed to load stock promotion list');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStockPromotions();
  };

  const filterStockPromotions = () => {
    let filtered = [...stockPromotions];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => {
        return (
          item.id?.toString().toLowerCase().includes(query) ||
          item.name?.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query) ||
          item.status?.toLowerCase().includes(query) ||
          item.valueType?.toLowerCase().includes(query)
        );
      });
    }

    setFilteredStockPromotions(filtered);
  };

  const formatValue = (value, valueType) => {
    if (valueType === 'PERCENT') {
      return `${value}%`;
    } else if (valueType === 'FIXED') {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(value || 0);
    }
    return value;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return COLORS.SUCCESS;
      case 'INACTIVE': return COLORS.TEXT.SECONDARY;
      default: return COLORS.TEXT.SECONDARY;
    }
  };


  const handleViewDetail = (item) => {
    navigation.navigate('StockPromotionDetail', {
      stockPromotionId: item.id
    });
  };


  const renderStockPromotionCard = (item) => (
    <TouchableOpacity
      key={item.id}
      style={styles.card}
      onPress={() => handleViewDetail(item)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardInfo}>
          <Text style={styles.cardId}>{item.name || `Promotion #${item.id}`}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status || 'N/A'}</Text>
        </View>
      </View>

      <View style={styles.cardDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Description:</Text>
          <Text style={styles.detailValue}>
            {item.description || 'N/A'}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Discount Type:</Text>
          <Text style={styles.detailValue}>
            {item.valueType || 'N/A'}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Value:</Text>
          <Text style={[styles.detailValue, styles.priceValue]}>
            {formatValue(item.value, item.valueType)}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Start Date:</Text>
          <Text style={styles.detailValue}>{formatDate(item.startAt)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>End Date:</Text>
          <Text style={styles.detailValue}>{formatDate(item.endAt)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft color={COLORS.TEXT.WHITE} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Stock Promotion Management</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => navigation.navigate('CreateStockPromotion')}
        >
          <Plus size={20} color={COLORS.TEXT.WHITE} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={18} color={COLORS.TEXT.SECONDARY} style={{ marginRight: SIZES.PADDING.SMALL }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by ID, name, description..."
          placeholderTextColor={COLORS.TEXT.SECONDARY}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stockPromotions.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: COLORS.SUCCESS }]}>
            {stockPromotions.filter(item => item.status === 'ACTIVE').length}
          </Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
      </View>

      {/* Stock Promotions List */}
      <ScrollView
        style={styles.list}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.PRIMARY}
          />
        }
      >
        {loading && filteredStockPromotions.length === 0 ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color={COLORS.PRIMARY} style={{ marginBottom: SIZES.PADDING.MEDIUM }} />
            <Text style={styles.emptyTitle}>Loading...</Text>
          </View>
        ) : filteredStockPromotions.length > 0 ? (
          filteredStockPromotions.map(renderStockPromotionCard)
        ) : (
          <View style={styles.emptyState}>
            <Package size={64} color={COLORS.TEXT.SECONDARY} style={{ marginBottom: SIZES.PADDING.MEDIUM }} />
            <Text style={styles.emptyTitle}>No Data</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery.trim()
                ? 'No matching results found'
                : 'No stock promotions yet'}
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
    paddingTop: Platform.OS === 'ios' ? 0 : 30,
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
  placeholder: {
    width: 40,
  },
  createButton: {
    width: 40,
    height: 40,
    borderRadius: SIZES.RADIUS.ROUND,
    backgroundColor: COLORS.PRIMARY,
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
    color: COLORS.PRIMARY,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: SIZES.FONT.XSMALL,
    color: COLORS.TEXT.SECONDARY,
    textAlign: 'center',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: SIZES.PADDING.MEDIUM,
  },
  card: {
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
  cardInfo: {
    flex: 1,
  },
  cardId: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginBottom: 4,
  },
  cardDate: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
  },
  cardDetails: {
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.PADDING.XXXLARGE,
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

export default StockPromotionManagementScreen;

