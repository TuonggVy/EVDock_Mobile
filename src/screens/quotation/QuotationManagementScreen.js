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
  FlatList,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import { quotationService } from '../../services/quotationService';
import motorbikeService from '../../services/motorbikeService';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import { ArrowLeft, NotepadText, Pencil, Plus, Search, Trash2 } from 'lucide-react-native';

const QuotationManagementScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { alertConfig, hideAlert, showSuccess, showError, showDeleteConfirm } = useCustomAlert();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedTabType, setSelectedTabType] = useState('AT_STORE'); // Tab selection: AT_STORE, ORDER, PRE_ORDER
  const [quotations, setQuotations] = useState([]);
  const [allQuotations, setAllQuotations] = useState([]); // Store all quotations for filter counts
  const [filteredQuotations, setFilteredQuotations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Vehicle image mapping
  const getVehicleImage = (vehicleImage) => {
    if (!vehicleImage) {
      return require('../../../assets/images/banner/banner-modely.png');
    }
    
    // If vehicleImage is a URL (starts with http), use uri format
    if (vehicleImage.startsWith('http://') || vehicleImage.startsWith('https://')) {
      return { uri: vehicleImage };
    }
    
    // If vehicleImage is a local image name, use require
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
  }, [allQuotations, searchQuery, selectedFilter, selectedTabType]);

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
  }, [searchQuery, selectedFilter, selectedTabType]);

  const loadQuotations = async () => {
    setLoading(true);
    try {
      // Get agencyId from user context
      const agencyId = user?.agencyId;
      if (!agencyId) {
        console.error('No agencyId found for Dealer Staff');
        setAllQuotations([]);
        return;
      }
      
      // Build query params for API
      const queryParams = { limit: 1000 };
      
      // Load all quotations for filter counts and display using real API
      const response = await quotationService.getQuotationsByAgency(parseInt(agencyId), queryParams);
      
      if (response.success) {
        // Transform API response to match UI expectations
        const transformedQuotations = (response.data || []).map(q => ({
          id: q.id?.toString() || '',
          quoteCode: q.quoteCode || '',
          customerId: q.customerId,
          customerName: 'N/A', // Will be loaded from detail API
          customerPhone: 'N/A',
          customerEmail: 'N/A',
          vehicleModel: 'N/A', // Will be loaded from detail API
          vehicleImage: 'banner-modely.png', // Default
          totalAmount: q.finalPrice || 0,
          basePrice: q.basePrice || 0,
          promotionPrice: q.promotionPrice || 0,
          status: q.status?.toUpperCase() || 'DRAFT',
          type: q.type || 'AT_STORE',
          createdAt: q.createDate || new Date().toISOString(),
          validUntil: q.validUntil,
          dealerStaffId: q.dealerStaffId,
          motorbikeId: q.motorbikeId,
          colorId: q.colorId,
          agencyId: q.agencyId,
          items: [],
        }));
        
        // Sort by createdAt (most recent first)
        const sortedQuotations = transformedQuotations.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0);
          const dateB = new Date(b.createdAt || 0);
          return dateB - dateA; // Descending order (newest first)
        });
        
        setAllQuotations(sortedQuotations);
        
        // Load customer and motorbike details for each quotation
        loadQuotationDetails(sortedQuotations);
      } else {
        console.error('Error loading quotations:', response.error);
        setAllQuotations([]);
      }
    } catch (error) {
      console.error('Error loading quotations:', error);
      showError('Error', 'Failed to load quotations list');
      setAllQuotations([]);
    } finally {
      setLoading(false);
    }
  };

  const loadQuotationDetails = async (quotations) => {
    // Load customer and motorbike details for each quotation using GET /quotation/detail/{quotationId}
    const quotationsWithDetails = await Promise.all(
      quotations.map(async (quote) => {
        try {
          const detailResponse = await quotationService.getQuotationById(parseInt(quote.id));
          if (detailResponse.success && detailResponse.data) {
            const detail = detailResponse.data;
            
            // Load vehicle image from motorbike service
            let vehicleImage = 'banner-modely.png'; // Default image
            if (detail.motorbike?.id) {
              try {
                const motorbikeResponse = await motorbikeService.getMotorbikeById(detail.motorbike.id);
                if (motorbikeResponse.success && motorbikeResponse.data) {
                  const motorbikeData = motorbikeResponse.data.data || motorbikeResponse.data;
                  
                  // Extract images from the response
                  if (motorbikeData.images && Array.isArray(motorbikeData.images) && motorbikeData.images.length > 0) {
                    vehicleImage = motorbikeData.images[0].imageUrl;
                  } else if (motorbikeData.colors && Array.isArray(motorbikeData.colors) && motorbikeData.colors.length > 0) {
                    vehicleImage = motorbikeData.colors[0].imageUrl;
                  }
                }
              } catch (imageError) {
                console.error(`Error loading image for motorbike ${detail.motorbike.id}:`, imageError);
              }
            }
            
            return {
              ...quote,
              customerName: detail.customer?.name || 'Khách hàng',
              customerPhone: detail.customer?.phone || 'N/A',
              customerEmail: detail.customer?.email || 'N/A',
              vehicleModel: detail.motorbike?.name || 'Model không xác định',
              vehicleImage: vehicleImage,
            };
          }
          return quote;
        } catch (error) {
          console.error(`Error loading details for quotation ${quote.id}:`, error);
          return quote;
        }
      })
    );

    setAllQuotations(quotationsWithDetails);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadQuotations();
    setRefreshing(false);
  };

  const filterQuotations = () => {
    // Use allQuotations for filtering to get accurate counts
    let filtered = allQuotations;
    
    // Apply type filter (tab selection)
    if (selectedTabType) {
      filtered = filtered.filter(quotation => 
        quotation.type?.toUpperCase() === selectedTabType.toUpperCase()
      );
    }
    
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
      // Filter by status (case-insensitive comparison)
      filtered = filtered.filter(quotation => 
        quotation.status?.toUpperCase() === selectedFilter.toUpperCase()
      );
    }
    
    setQuotations(filtered);
    setFilteredQuotations(filtered);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'draft': return COLORS.WARNING;
      case 'accepted': return COLORS.SUCCESS;
      case 'rejected': return COLORS.ERROR;
      case 'expired': return COLORS.TEXT.SECONDARY;
      case 'reversed': return COLORS.PRIMARY;
      default: return COLORS.TEXT.SECONDARY;
    }
  };

  const getStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case 'draft': return 'Draft';
      case 'accepted': return 'Accepted';
      case 'rejected': return 'Rejected';
      case 'expired': return 'Expired';
      case 'reversed': return 'Reversed';
      default: return 'Unknown';
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

  const handleEditQuotation = (quotation) => {
    navigation.navigate('EditQuotation', { 
      quotationId: quotation.id,
      quotation: quotation 
    });
  };

  const handleUpdateQuotation = (quotation) => {
    showDeleteConfirm(
      'Delete Quotation',
      `Are you sure you want to delete quotation #${quotation.id || 'N/A'}?`,
      async () => {
        try {
          const response = await quotationService.deleteQuotation(parseInt(quotation.id));
          if (response.success) {
            showSuccess('Success', 'Quotation has been deleted successfully', () => {
              loadQuotations();
            });
          } else {
            showError('Error', response.error || 'Failed to delete quotation');
          }
        } catch (error) {
          console.error('Error deleting quotation:', error);
          showError('Error', 'Failed to delete quotation. Please try again.');
        }
      },
      () => {
        // Cancel action - do nothing
      }
    );
  };

  // Get quotations filtered by selected tab type for status filter counts
  const getQuotationsByTab = () => {
    return allQuotations.filter(q => 
      q.type?.toUpperCase() === selectedTabType.toUpperCase()
    );
  };

  const quotationsByTab = getQuotationsByTab();

  const filterOptions = [
    { key: 'all', label: 'All', count: quotationsByTab.length },
    { key: 'DRAFT', label: 'Draft', count: quotationsByTab.filter(q => q.status === 'DRAFT').length },
    { key: 'ACCEPTED', label: 'Accepted', count: quotationsByTab.filter(q => q.status === 'ACCEPTED').length },
    { key: 'REJECTED', label: 'Rejected', count: quotationsByTab.filter(q => q.status === 'REJECTED').length },
    { key: 'EXPIRED', label: 'Expired', count: quotationsByTab.filter(q => q.status === 'EXPIRED').length },
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
            <Text style={styles.customerName}>{quotation.customerName || 'Customer'}</Text>
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
            <Text style={styles.vehicleModel}>{quotation.vehicleModel || 'Unknown Model'}</Text>
            <Text style={styles.totalAmount}>{formatPrice(quotation.totalAmount || 0)}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.dateInfo}>
            <Text style={styles.dateLabel}>Created: {formatDate(quotation.createdAt)}</Text>
          </View>
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={(e) => {
                e.stopPropagation();
                handleEditQuotation(quotation);
              }}
            >
              <Text style={styles.actionButtonText}><Pencil color="#FFFFFF" size={14} /></Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={(e) => {
                e.stopPropagation();
                handleUpdateQuotation(quotation);
              }}
            >
              <Text style={styles.actionButtonText}><Trash2 color="#FFFFFF" size={14} /></Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => {
    const getTabLabel = () => {
      switch (selectedTabType) {
        case 'AT_STORE': return 'At Store';
        case 'ORDER': return 'Order';
        case 'PRE_ORDER': return 'Pre-Order';
        default: return '';
      }
    };

    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}><NotepadText size={70} /></Text>
        <Text style={styles.emptyTitle}>No Quotations Yet</Text>
        <Text style={styles.emptySubtitle}>
          {searchQuery || selectedFilter !== 'all' 
            ? 'No matching quotations found' 
            : `No ${getTabLabel()} quotations found`
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
              <Text style={styles.createButtonText}>Create New Quotation</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate('Main')}
          >
            <Text style={styles.backIcon}><ArrowLeft color="#FFFFFF" size={18} /></Text>
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={styles.headerTitleText}>Quotation Management</Text>
            <Text style={styles.headerSubtitle}>Dealer Staff</Text>
          </View>
          <TouchableOpacity
            style={styles.createIconButton}
            onPress={handleCreateQuotation}
          >
            <Text style={styles.createIcon}><Plus color="#FFFFFF" size={18} /></Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search and Filters */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}><Search /></Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search quotations..."
            placeholderTextColor={COLORS.TEXT.SECONDARY}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Type Tabs */}
        <View style={styles.tabSection}>
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[
                styles.tab,
                selectedTabType === 'AT_STORE' && styles.tabActive
              ]}
              onPress={() => setSelectedTabType('AT_STORE')}
            >
              <Text style={[
                styles.tabText,
                selectedTabType === 'AT_STORE' && styles.tabTextActive
              ]}>
                At Store ({allQuotations.filter(q => q.type?.toUpperCase() === 'AT_STORE').length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                selectedTabType === 'ORDER' && styles.tabActive
              ]}
              onPress={() => setSelectedTabType('ORDER')}
            >
              <Text style={[
                styles.tabText,
                selectedTabType === 'ORDER' && styles.tabTextActive
              ]}>
                Order ({allQuotations.filter(q => q.type?.toUpperCase() === 'ORDER').length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                selectedTabType === 'PRE_ORDER' && styles.tabActive
              ]}
              onPress={() => setSelectedTabType('PRE_ORDER')}
            >
              <Text style={[
                styles.tabText,
                selectedTabType === 'PRE_ORDER' && styles.tabTextActive
              ]}>
                Pre-Order ({allQuotations.filter(q => q.type?.toUpperCase() === 'PRE_ORDER').length})
              </Text>
            </TouchableOpacity>
          </View>
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
            <ActivityIndicator size="large" color="#009DFF" />
            <Text style={styles.loadingText}>Loading...</Text>
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
    fontSize: SIZES.FONT.XXLARGE,
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
    backgroundColor: "#009DFF",
    justifyContent: 'center',
    alignItems: 'center',
  },
  createIcon: {
    fontSize: SIZES.FONT.LARGE,
    color: COLORS.TEXT.WHITE,
    fontWeight: 'bold',
  },
  tabSection: {
    marginTop: SIZES.PADDING.MEDIUM,
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: SIZES.RADIUS.LARGE,
    padding: SIZES.PADDING.XSMALL,
    gap: SIZES.PADDING.XSMALL,
  },
  tab: {
    flex: 1,
    paddingVertical: SIZES.PADDING.SMALL,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    borderRadius: SIZES.RADIUS.MEDIUM,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: "#009DFF",
  },
  tabText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.WHITE,
    fontWeight: '500',
  },
  tabTextActive: {
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
    backgroundColor: "#009DFF",
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
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: SIZES.PADDING.SMALL,
  },
  actionButton: {
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    borderRadius: SIZES.RADIUS.SMALL,
    backgroundColor: "#000000",
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
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
