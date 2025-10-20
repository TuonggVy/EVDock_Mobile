import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  RefreshControl,
  Alert,
  FlatList,
  Animated,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import { quotationService } from '../../services/quotationService';

const QuotationManagementScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [quotations, setQuotations] = useState([]);
  const [allQuotations, setAllQuotations] = useState([]); // Store all quotations for filter counts
  const [filteredQuotations, setFilteredQuotations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Vehicle image mapping
  const getVehicleImage = (vehicleImage) => {
    if (!vehicleImage) {
      return require('../../../assets/images/banner/banner-modely.png');
    }
    
    const imageMap = {
      'banner-modely.png': require('../../../assets/images/banner/banner-modely.png'),
      'banner-modelx.png': require('../../../assets/images/banner/Banner-modelx.png'),
      'banner-modelv.png': require('../../../assets/images/banner/banner-modelv.png'),
    };
    return imageMap[vehicleImage] || require('../../../assets/images/banner/banner-modely.png');
  };

  useEffect(() => {
    loadQuotations();
  }, []);

  useEffect(() => {
    filterQuotations();
  }, [allQuotations, searchQuery, selectedFilter]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadQuotations();
    }, [])
  );

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      filterQuotations();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedFilter]);

  const loadQuotations = async () => {
    setLoading(true);
    try {
      // Load all quotations for filter counts and display
      const response = await quotationService.getQuotations();
      setAllQuotations(response.data || []);
    } catch (error) {
      console.error('Error loading quotations:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách báo giá');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadQuotations();
    setRefreshing(false);
  };

  const filterQuotations = () => {
    // Use allQuotations for filtering to get accurate counts
    let filtered = allQuotations;
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(quotation => 
        quotation.customerName?.toLowerCase().includes(query) ||
        quotation.customerPhone?.includes(searchQuery) ||
        quotation.customerEmail?.toLowerCase().includes(query) ||
        quotation.vehicleModel?.toLowerCase().includes(query) ||
        quotation.id?.toLowerCase().includes(query)
      );
    }
    
    // Apply status filter
    if (selectedFilter !== 'all') {
      if (selectedFilter === 'installment') {
        // Filter for installment payment type
        filtered = filtered.filter(quotation => quotation.paymentType === 'installment');
      } else {
        // Filter by status
        filtered = filtered.filter(quotation => quotation.status === selectedFilter);
      }
    }
    
    setQuotations(filtered);
    setFilteredQuotations(filtered);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return COLORS.WARNING;
      case 'paid': return COLORS.SUCCESS;
      case 'expired': return COLORS.TEXT.SECONDARY;
      default: return COLORS.TEXT.SECONDARY;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Chờ thanh toán';
      case 'paid': return 'Đã thanh toán';
      case 'expired': return 'Hết hạn';
      default: return 'Không xác định';
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('vi-VN');
    } catch (error) {
      return 'N/A';
    }
  };

  const handleQuotationPress = (quotation) => {
    navigation.navigate('QuotationDetail', { 
      quotation,
      onQuotationUpdate: handleQuotationUpdate
    });
  };

  const handleQuotationUpdate = (updatedQuotation) => {
    // Update the quotation in the local state
    setAllQuotations(prevQuotations => 
      prevQuotations.map(q => 
        q.id === updatedQuotation.id ? updatedQuotation : q
      )
    );
  };

  const handleCreateQuotation = () => {
    // Navigate to catalog to select vehicle
    navigation.navigate('Catalog');
  };

  const filterOptions = [
    { key: 'all', label: 'Tất cả', count: allQuotations.length },
    { key: 'pending', label: 'Chờ thanh toán', count: allQuotations.filter(q => q.status === 'pending').length },
    { key: 'paid', label: 'Đã thanh toán', count: allQuotations.filter(q => q.status === 'paid').length },
    { key: 'installment', label: 'Trả góp', count: allQuotations.filter(q => q.paymentType === 'installment').length },
  ];

  const renderQuotationCard = ({ item: quotation }) => {
    if (!quotation) return null;
    
    return (
      <TouchableOpacity
        style={styles.quotationCard}
        onPress={() => handleQuotationPress(quotation)}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <View style={styles.quotationInfo}>
            <Text style={styles.quotationId}>#{quotation.id || 'N/A'}</Text>
            <Text style={styles.customerName}>{quotation.customerName || 'Khách hàng'}</Text>
            <Text style={styles.customerPhone}>{quotation.customerPhone || 'N/A'}</Text>
          </View>
          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(quotation.status) }]}>
              <Text style={styles.statusText}>{getStatusText(quotation.status)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.vehicleInfo}>
          <Image source={getVehicleImage(quotation.vehicleImage)} style={styles.vehicleImage} />
          <View style={styles.vehicleDetails}>
            <Text style={styles.vehicleModel}>{quotation.vehicleModel || 'Model không xác định'}</Text>
            <Text style={styles.totalAmount}>{formatPrice(quotation.totalAmount || 0)}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.dateInfo}>
            <Text style={styles.dateLabel}>Tạo: {formatDate(quotation.createdAt)}</Text>
          </View>
          <View style={styles.itemCount}>
            <Text style={styles.itemCountText}>{quotation.items?.length || 0} mục</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>📋</Text>
      <Text style={styles.emptyTitle}>Chưa có báo giá nào</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery || selectedFilter !== 'all' 
          ? 'Không tìm thấy báo giá phù hợp' 
          : 'Tạo báo giá đầu tiên cho khách hàng'
        }
      </Text>
      {!searchQuery && selectedFilter === 'all' && (
        <TouchableOpacity style={styles.createButton} onPress={handleCreateQuotation}>
          <LinearGradient
            colors={COLORS.GRADIENT.BLUE}
            style={styles.createButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.createButtonText}>Tạo báo giá mới</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate('Main')}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={styles.headerTitleText}>Quản lý báo giá</Text>
            <Text style={styles.headerSubtitle}>Dealer Staff</Text>
          </View>
          <TouchableOpacity
            style={styles.createIconButton}
            onPress={handleCreateQuotation}
          >
            <Text style={styles.createIcon}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search and Filters */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm báo giá..."
            placeholderTextColor={COLORS.TEXT.SECONDARY}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
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
                styles.filterChipText,
                selectedFilter === option.key && styles.filterChipTextActive
              ]}>
                {option.label} ({option.count})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Quotations List */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Đang tải...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredQuotations}
            renderItem={renderQuotationCard}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[COLORS.PRIMARY]}
                tintColor={COLORS.PRIMARY}
              />
            }
            ListEmptyComponent={renderEmptyState}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
  },
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
    marginTop: SIZES.PADDING.XSMALL,
  },
  createIconButton: {
    width: 40,
    height: 40,
    borderRadius: SIZES.RADIUS.ROUND,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createIcon: {
    fontSize: SIZES.FONT.LARGE,
    color: COLORS.TEXT.WHITE,
    fontWeight: 'bold',
  },
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
  filterContainer: {
    marginBottom: SIZES.PADDING.SMALL,
  },
  filterContent: {
    paddingRight: SIZES.PADDING.LARGE,
  },
  filterChip: {
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    borderRadius: SIZES.RADIUS.ROUND,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginRight: SIZES.PADDING.SMALL,
  },
  filterChipActive: {
    backgroundColor: COLORS.PRIMARY,
  },
  filterChipText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.WHITE,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: COLORS.TEXT.WHITE,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.SURFACE,
    borderTopLeftRadius: SIZES.RADIUS.XXLARGE,
    borderTopRightRadius: SIZES.RADIUS.XXLARGE,
    overflow: 'hidden',
  },
  listContainer: {
    padding: SIZES.PADDING.LARGE,
    paddingBottom: SIZES.PADDING.XXXLARGE,
  },
  quotationCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.LARGE,
    padding: SIZES.PADDING.LARGE,
    marginBottom: SIZES.PADDING.MEDIUM,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.BORDER.PRIMARY,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  quotationInfo: {
    flex: 1,
  },
  quotationId: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: SIZES.PADDING.XSMALL,
  },
  customerName: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SIZES.PADDING.XSMALL,
  },
  customerPhone: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.XSMALL,
    borderRadius: SIZES.RADIUS.ROUND,
  },
  statusText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.WHITE,
    fontWeight: 'bold',
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  vehicleImage: {
    width: 60,
    height: 40,
    borderRadius: SIZES.RADIUS.SMALL,
    marginRight: SIZES.PADDING.MEDIUM,
  },
  vehicleDetails: {
    flex: 1,
  },
  vehicleModel: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SIZES.PADDING.XSMALL,
  },
  totalAmount: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.SUCCESS,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SIZES.PADDING.MEDIUM,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER.SECONDARY,
  },
  dateInfo: {
    flex: 1,
  },
  dateLabel: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: SIZES.PADDING.XSMALL,
  },
  itemCount: {
    alignItems: 'flex-end',
  },
  itemCountText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SIZES.PADDING.XXXLARGE,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: SIZES.PADDING.LARGE,
  },
  emptyTitle: {
    fontSize: SIZES.FONT.XLARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SIZES.PADDING.SMALL,
  },
  emptySubtitle: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
    textAlign: 'center',
    marginBottom: SIZES.PADDING.XLARGE,
  },
  createButton: {
    borderRadius: SIZES.RADIUS.LARGE,
    overflow: 'hidden',
  },
  createButtonGradient: {
    paddingHorizontal: SIZES.PADDING.XLARGE,
    paddingVertical: SIZES.PADDING.MEDIUM,
  },
  createButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
  },
});

export default QuotationManagementScreen;
