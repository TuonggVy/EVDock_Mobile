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
  Image,
  Modal,
} from 'react-native';
import { COLORS, SIZES } from '../../constants';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import { useAuth } from '../../contexts/AuthContext';
import agencyStockService from '../../services/agencyStockService';
import motorbikeService from '../../services/motorbikeService';
import LoadingScreen from '../../components/common/LoadingScreen';
import { ArrowLeft, Bike, Check, ChevronDown, CircleX, Palette, Package, Search } from 'lucide-react-native';

const StaffStockListScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [stocks, setStocks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [motorbikes, setMotorbikes] = useState([]);
  const [colors, setColors] = useState([]);
  const [allStocksForColors, setAllStocksForColors] = useState([]);
  const [selectedMotorbikeId, setSelectedMotorbikeId] = useState(null);
  const [selectedColorId, setSelectedColorId] = useState(null);
  const [showMotorbikeModal, setShowMotorbikeModal] = useState(false);
  const [showColorModal, setShowColorModal] = useState(false);
  const { alertConfig, hideAlert, showError } = useCustomAlert();

  useEffect(() => {
    loadAllStocksForColors();
    loadStocks();
    loadMotorbikes();
  }, []);

  // Load all stocks (without filters) to extract available colors
  const loadAllStocksForColors = async () => {
    try {
      if (!user?.agencyId) return;

      const agencyId = parseInt(user.agencyId);
      const response = await agencyStockService.getAgencyStocks(agencyId, { page: 1, limit: 1000 });

      if (response.success) {
        const stocksData = response.data || [];
        setAllStocksForColors(stocksData);
        
        // Extract unique colorIds from all stocks
        const colorIdSet = new Set();
        const stockIdByColorId = new Map();
        
        stocksData.forEach(stock => {
          if (stock.colorId && !colorIdSet.has(stock.colorId)) {
            colorIdSet.add(stock.colorId);
            stockIdByColorId.set(stock.colorId, stock.id);
          }
        });
        
        // Load color details from stock details to get colorType
        const colorMap = new Map();
        const loadColorPromises = Array.from(colorIdSet).map(async (colorId) => {
          const stockId = stockIdByColorId.get(colorId);
          try {
            const detailResponse = await agencyStockService.getAgencyStockDetail(stockId);
            if (detailResponse.success && detailResponse.data?.color) {
              const color = detailResponse.data.color;
              colorMap.set(colorId, {
                id: colorId,
                colorType: color.colorType || `Color ${colorId}`
              });
            } else {
              colorMap.set(colorId, {
                id: colorId,
                colorType: `Color ${colorId}`
              });
            }
          } catch (error) {
            console.error(`Error loading color info for colorId ${colorId}:`, error);
            colorMap.set(colorId, {
              id: colorId,
              colorType: `Color ${colorId}`
            });
          }
        });
        
        await Promise.all(loadColorPromises);
        setColors(Array.from(colorMap.values()));
      }
    } catch (error) {
      console.error('Error loading stocks for colors:', error);
    }
  };

  // Refresh stocks when filters change
  useEffect(() => {
    loadStocks();
  }, [selectedMotorbikeId, selectedColorId]);

  // Refresh stocks when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadStocks();
    });

    return unsubscribe;
  }, [navigation]);

  const loadStocks = async () => {
    try {
      setLoading(true);
      if (!user?.agencyId) {
        showError('Error', 'Agency information not found');
        return;
      }

      const agencyId = parseInt(user.agencyId);
      const params = { page: 1, limit: 1000 };
      if (selectedMotorbikeId) {
        params.motorbikeId = selectedMotorbikeId;
      }
      if (selectedColorId) {
        params.colorId = selectedColorId;
      }

      const response = await agencyStockService.getAgencyStocks(agencyId, params);

      if (response.success) {
        const stocksData = response.data || [];
        // Sort by createAt descending (newest first)
        const sortedStocks = stocksData.sort((a, b) => {
          const dateA = new Date(a.createAt || a.createdAt || 0);
          const dateB = new Date(b.createAt || b.createdAt || 0);
          return dateB - dateA;
        });
        setStocks(sortedStocks);
      } else {
        showError('Error', response.error || 'Failed to load stock list');
      }
    } catch (error) {
      console.error('Error loading stocks:', error);
      showError('Error', 'Failed to load stock list');
    } finally {
      setLoading(false);
    }
  };

  const loadMotorbikes = async () => {
    try {
      const response = await motorbikeService.getAllMotorbikes({ limit: 1000 });
      if (response.success) {
        setMotorbikes(response.data || []);
      }
    } catch (error) {
      console.error('Error loading motorbikes:', error);
    }
  };

  const getMotorbikeInfo = (motorbikeId) => {
    const motorbike = motorbikes.find(m => m.id === motorbikeId);
    return motorbike || null;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const filteredStocks = stocks.filter(stock => {
    const motorbike = getMotorbikeInfo(stock.motorbikeId);
    const searchLower = searchQuery.toLowerCase();
    
    const matchesSearch = !searchQuery ||
      (motorbike?.name?.toLowerCase().includes(searchLower)) ||
      (motorbike?.model?.toLowerCase().includes(searchLower));
    
    return matchesSearch;
  });

  const handleFilterMotorbike = (motorbikeId) => {
    setSelectedMotorbikeId(motorbikeId);
    setShowMotorbikeModal(false);
  };

  const handleFilterColor = (colorId) => {
    setSelectedColorId(colorId);
    setShowColorModal(false);
  };

  const clearFilters = () => {
    setSelectedMotorbikeId(null);
    setSelectedColorId(null);
  };

  const getSelectedMotorbikeName = () => {
    if (!selectedMotorbikeId) return 'All Motorbikes';
    const motorbike = motorbikes.find(m => m.id === selectedMotorbikeId);
    return motorbike?.name || `ID: ${selectedMotorbikeId}`;
  };

  const getSelectedColorName = () => {
    if (!selectedColorId) return 'All Colors';
    const color = colors.find(c => c.id === selectedColorId);
    return color?.colorType || `Color ${selectedColorId}`;
  };

  const handleViewDetail = (stock) => {
    navigation.navigate('StaffStockDetail', { stockId: stock.id });
  };

  const renderStockCard = (stock) => {
    const motorbike = getMotorbikeInfo(stock.motorbikeId);
    const stockImage = motorbike?.images?.[0]?.imageUrl || null;

    return (
      <TouchableOpacity
        key={stock.id}
        style={styles.stockCard}
        onPress={() => handleViewDetail(stock)}
        activeOpacity={0.8}
      >
        {stockImage && (
          <Image
            source={{ uri: stockImage }}
            style={styles.stockImage}
            resizeMode="cover"
          />
        )}
        <View style={styles.stockContent}>
          <View style={styles.stockHeader}>
            <Text style={styles.motorbikeName}>{motorbike?.name || 'Unknown Motorbike'}</Text>
            <View style={[styles.quantityBadge, stock.quantity > 0 ? styles.inStockBadge : styles.outOfStockBadge]}>
              <Text style={styles.quantityText}>{stock.quantity}</Text>
            </View>
          </View>
          
          <Text style={styles.modelText}>{motorbike?.model || 'N/A'}</Text>
          
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Selling Price:</Text>
              <Text style={styles.detailValue}>{formatPrice(stock.price)}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <LoadingScreen />;
  }

  // Calculate statistics
  const totalStocks = stocks.length;
  const totalQuantity = stocks.reduce((sum, stock) => sum + stock.quantity, 0);
  const inStockCount = stocks.filter(stock => stock.quantity > 0).length;
  const outOfStockCount = stocks.filter(stock => stock.quantity === 0).length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}><ArrowLeft color="#FFFFFF" size={18} /></Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Stock Management</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}><Search /></Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search motorbikes..."
          placeholderTextColor={COLORS.TEXT.SECONDARY}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filter Section */}
      <View style={styles.filterContainer}>
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedMotorbikeId && styles.filterButtonActive
            ]}
            onPress={() => setShowMotorbikeModal(true)}
          >
            <View style={styles.filterButtonContent}>
              <Bike 
                size={16} 
                color={selectedMotorbikeId ? COLORS.PRIMARY : COLORS.TEXT.PRIMARY} 
              />
              <Text style={[
                styles.filterButtonText,
                selectedMotorbikeId && styles.filterButtonTextActive
              ]}>
                {getSelectedMotorbikeName()}
              </Text>
            </View>
            <ChevronDown 
              size={16} 
              color={COLORS.TEXT.SECONDARY} 
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedColorId && styles.filterButtonActive
            ]}
            onPress={() => setShowColorModal(true)}
          >
            <View style={styles.filterButtonContent}>
              <Palette 
                size={16} 
                color={selectedColorId ? COLORS.PRIMARY : COLORS.TEXT.PRIMARY} 
              />
              <Text style={[
                styles.filterButtonText,
                selectedColorId && styles.filterButtonTextActive
              ]}>
                {getSelectedColorName()}
              </Text>
            </View>
            <ChevronDown 
              size={16} 
              color={COLORS.TEXT.SECONDARY} 
            />
          </TouchableOpacity>
        </View>

        {(selectedMotorbikeId || selectedColorId) && (
          <TouchableOpacity
            style={styles.clearFilterButton}
            onPress={clearFilters}
          >
            <Text style={styles.clearFilterText}>Clear Filters</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalStocks}</Text>
          <Text style={styles.statLabel}>Total Stock</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: COLORS.SUCCESS }]}>{totalQuantity}</Text>
          <Text style={styles.statLabel}>Total Quantity</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: COLORS.SUCCESS }]}>{inStockCount}</Text>
          <Text style={styles.statLabel}>In Stock</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: COLORS.ERROR }]}>{outOfStockCount}</Text>
          <Text style={styles.statLabel}>Out of Stock</Text>
        </View>
      </View>

      {/* Stock List */}
      <ScrollView
        style={styles.stockList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.stockListContent}
      >
        {filteredStocks.length > 0 ? (
          filteredStocks.map(renderStockCard)
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}><Package size={80} color="#FFFFFF" /></Text>
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No results found' : 'No stock items'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? 'Try searching with different keywords'
                : 'No stock items available'
              }
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Motorbike Filter Modal */}
      <Modal
        visible={showMotorbikeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowMotorbikeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Motorbike</Text>
              <TouchableOpacity onPress={() => setShowMotorbikeModal(false)}>
                <Text style={styles.modalCloseIcon}><CircleX size={18} /></Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScrollView}>
              <TouchableOpacity
                style={[
                  styles.modalOption,
                  !selectedMotorbikeId && styles.modalOptionSelected
                ]}
                onPress={() => handleFilterMotorbike(null)}
              >
                <Text style={[
                  styles.modalOptionText,
                  !selectedMotorbikeId && styles.modalOptionTextSelected
                ]}>
                  All Motorbikes
                </Text>
                {!selectedMotorbikeId && (
                  <Text style={styles.modalCheckIcon}><Check size={18} /></Text>
                )}
              </TouchableOpacity>
              {motorbikes.map((motorbike) => (
                <TouchableOpacity
                  key={motorbike.id}
                  style={[
                    styles.modalOption,
                    selectedMotorbikeId === motorbike.id && styles.modalOptionSelected
                  ]}
                  onPress={() => handleFilterMotorbike(motorbike.id)}
                >
                  <Text style={[
                    styles.modalOptionText,
                    selectedMotorbikeId === motorbike.id && styles.modalOptionTextSelected
                  ]}>
                    {motorbike.name || `ID: ${motorbike.id}`}
                  </Text>
                  {selectedMotorbikeId === motorbike.id && (
                    <Text style={styles.modalCheckIcon}><Check size={18} /></Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Color Filter Modal */}
      <Modal
        visible={showColorModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowColorModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Color</Text>
              <TouchableOpacity onPress={() => setShowColorModal(false)}>
                <Text style={styles.modalCloseIcon}><CircleX size={18} /></Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScrollView}>
              <TouchableOpacity
                style={[
                  styles.modalOption,
                  !selectedColorId && styles.modalOptionSelected
                ]}
                onPress={() => handleFilterColor(null)}
              >
                <Text style={[
                  styles.modalOptionText,
                  !selectedColorId && styles.modalOptionTextSelected
                ]}>
                  All Colors
                </Text>
                {!selectedColorId && (
                  <Text style={styles.modalCheckIcon}><Check size={18} /></Text>
                )}
              </TouchableOpacity>
              {colors.map((color) => (
                <TouchableOpacity
                  key={color.id}
                  style={[
                    styles.modalOption,
                    selectedColorId === color.id && styles.modalOptionSelected
                  ]}
                  onPress={() => handleFilterColor(color.id)}
                >
                  <Text style={[
                    styles.modalOptionText,
                    selectedColorId === color.id && styles.modalOptionTextSelected
                  ]}>
                    {color.colorType || `Color ${color.id}`}
                  </Text>
                  {selectedColorId === color.id && (
                    <Text style={styles.modalCheckIcon}><Check size={18} /></Text>
                  )}
                </TouchableOpacity>
              ))}
              {colors.length === 0 && (
                <Text style={styles.modalEmptyText}>No colors available</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
      
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
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingTop: Platform.OS === 'ios' ? 20 : 10,
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
  backIcon: {
    fontSize: SIZES.FONT.LARGE,
    color: COLORS.TEXT.WHITE,
    fontWeight: 'bold',
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
    height: 40,
  },

  // Search
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

  // Filter Section
  filterContainer: {
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  filterRow: {
    flexDirection: 'row',
    gap: SIZES.PADDING.SMALL,
    marginBottom: SIZES.PADDING.SMALL,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: SIZES.PADDING.SMALL,
  },
  filterButtonActive: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
  },
  filterButtonText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.PRIMARY,
    flex: 1,
    marginLeft: SIZES.PADDING.XSMALL,
  },
  filterButtonTextActive: {
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  clearFilterButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    borderRadius: SIZES.RADIUS.SMALL,
    backgroundColor: 'rgba(255, 107, 53, 0.2)',
  },
  clearFilterText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.SURFACE,
    borderTopLeftRadius: SIZES.RADIUS.LARGE,
    borderTopRightRadius: SIZES.RADIUS.LARGE,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.PADDING.MEDIUM,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
  },
  modalCloseIcon: {
    fontSize: SIZES.FONT.LARGE,
    color: COLORS.TEXT.SECONDARY,
    fontWeight: 'bold',
  },
  modalScrollView: {
    maxHeight: 400,
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.MEDIUM,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  modalOptionSelected: {
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
  },
  modalOptionText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
    flex: 1,
  },
  modalOptionTextSelected: {
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  modalCheckIcon: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.PRIMARY,
    fontWeight: 'bold',
    marginLeft: SIZES.PADDING.SMALL,
  },
  modalEmptyText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
    textAlign: 'center',
    paddingVertical: SIZES.PADDING.LARGE,
    fontStyle: 'italic',
  },

  // Stats
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

  // Stock List
  stockList: {
    flex: 1,
  },
  stockListContent: {
    padding: SIZES.PADDING.MEDIUM,
  },
  stockCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.LARGE,
    marginBottom: SIZES.PADDING.MEDIUM,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stockImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#F5F5F5',
  },
  stockContent: {
    padding: SIZES.PADDING.MEDIUM,
  },
  stockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.PADDING.SMALL,
  },
  motorbikeName: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    flex: 1,
  },
  quantityBadge: {
    paddingHorizontal: SIZES.PADDING.SMALL,
    paddingVertical: 4,
    borderRadius: SIZES.RADIUS.SMALL,
    minWidth: 50,
    alignItems: 'center',
  },
  inStockBadge: {
    backgroundColor: COLORS.SUCCESS,
  },
  outOfStockBadge: {
    backgroundColor: COLORS.ERROR,
  },
  quantityText: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
  modelText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: SIZES.PADDING.SMALL,
  },
  detailsRow: {
    marginBottom: SIZES.PADDING.SMALL,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
  },
  detailValue: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
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
    marginBottom: SIZES.PADDING.MEDIUM,
  },
});

export default StaffStockListScreen;

