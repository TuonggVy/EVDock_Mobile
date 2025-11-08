import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  TextInput,
  Image,
  Modal,
  ActivityIndicator,
  FlatList,
  RefreshControl,
} from 'react-native';
import { COLORS, SIZES } from '../../constants';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import { useAuth } from '../../contexts/AuthContext';
import agencyStockService from '../../services/agencyStockService';
import motorbikeService from '../../services/motorbikeService';
import { ArrowLeft, Bike, CircleX, Palette, Package, Plus, Search, Filter, Trash2, Pencil } from 'lucide-react-native';

const PRIMARY_ACCENT = '#009DFF';

const StockManagementScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [stocks, setStocks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [motorbikes, setMotorbikes] = useState([]);
  const [colors, setColors] = useState([]);
  const [allStocksForColors, setAllStocksForColors] = useState([]);
  const [selectedMotorbikeId, setSelectedMotorbikeId] = useState(null);
  const [selectedColorId, setSelectedColorId] = useState(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const { alertConfig, hideAlert, showSuccess, showError, showConfirm } = useCustomAlert();

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
        const stockIdByColorId = new Map(); // Map colorId to first stockId that has it
        
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
                colorType: color.colorType || `Màu ${colorId}`
              });
            } else {
              // Fallback if no color info
              colorMap.set(colorId, {
                id: colorId,
                colorType: `Màu ${colorId}`
              });
            }
          } catch (error) {
            console.error(`Error loading color info for colorId ${colorId}:`, error);
            // Fallback
            colorMap.set(colorId, {
              id: colorId,
              colorType: `Màu ${colorId}`
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

  const loadStocks = async (showLoader = true) => {
    try {
      if (showLoader) {
      setLoading(true);
      }
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
          return dateB - dateA; // Descending order (newest first)
        });
        setStocks(sortedStocks);
      } else {
        showError('Error', response.error || 'Failed to load stock list');
      }
    } catch (error) {
      console.error('Error loading stocks:', error);
      showError('Error', 'Failed to load stock list');
    } finally {
      if (showLoader) {
      setLoading(false);
      }
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
    
    // Filter by search query
    const matchesSearch = !searchQuery ||
      (motorbike?.name?.toLowerCase().includes(searchLower)) ||
      (motorbike?.model?.toLowerCase().includes(searchLower));
    
    return matchesSearch;
  });

  const handleFilterMotorbike = (motorbikeId) => {
    setSelectedMotorbikeId(motorbikeId);
  };

  const handleFilterColor = (colorId) => {
    setSelectedColorId(colorId);
  };

  const clearFilters = () => {
    setSelectedMotorbikeId(null);
    setSelectedColorId(null);
    setShowFilterModal(false);
  };

  const applyFilters = () => {
    setShowFilterModal(false);
  };

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await loadStocks(false);
    } finally {
      setRefreshing(false);
    }
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

  const getColorName = (colorId) => {
    if (!colorId) return 'N/A';
    const color = colors.find(c => c.id === colorId);
    return color?.colorType || `Color ${colorId}`;
  };

  const handleAddStock = () => {
    navigation.navigate('CreateStock');
  };

  const handleViewDetail = (stock) => {
    navigation.navigate('StockDetail', { stockId: stock.id });
  };

  const handleEditStock = (stock) => {
    navigation.navigate('EditStock', { stockId: stock.id, stock });
  };

  const handleDeleteStock = (stock) => {
    showConfirm(
      'Confirm Delete',
      'Are you sure you want to delete this stock?',
      async () => {
        try {
          const response = await agencyStockService.deleteAgencyStock(stock.id);
          if (response.success) {
            setStocks(prevStocks => prevStocks.filter(s => s.id !== stock.id));
            showSuccess('Success', 'Stock deleted successfully!');
            loadStocks();
          } else {
            showError('Error', response.error || 'Failed to delete stock');
          }
        } catch (error) {
          console.error('Error deleting stock:', error);
          showError('Error', 'Failed to delete stock');
        }
      }
    );
  };

  const renderStockCard = ({ item: stock }) => {
    const motorbike = getMotorbikeInfo(stock.motorbikeId);
    const stockImage =
      motorbike?.images?.[0]?.imageUrl ||
      'https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png';
    const isInStock = stock.quantity > 0;
    const updatedDate = new Date(stock.createAt || stock.createdAt || Date.now()).toLocaleDateString('vi-VN');
    const colorName = getColorName(stock.colorId);

    return (
      <View style={styles.stockCardShadow}>
        <TouchableOpacity
          style={styles.stockCard}
          activeOpacity={0.85}
          onPress={() => handleViewDetail(stock)}
        >
        <View style={styles.stockImageContainer}>
          <Image
            source={{ uri: stockImage }}
            style={styles.stockImage}
            resizeMode="cover"
          />
          <View
            style={[
              styles.statusBadge,
              isInStock ? styles.statusBadgeSuccess : styles.statusBadgeError,
            ]}
          >
            <Text style={styles.statusText}>{isInStock ? 'In Stock' : 'Out of Stock'}</Text>
          </View>
        </View>

        <View style={styles.stockInfo}>
          <Text style={styles.motorbikeName}>{motorbike?.name || 'Unknown Motorbike'}</Text>
          <Text style={styles.modelText}>{motorbike?.model || 'N/A'}</Text>

          <View style={styles.stockSpecs}>
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>Color</Text>
              <Text style={styles.specValue} numberOfLines={1}>{colorName}</Text>
            </View>
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>Updated</Text>
              <Text style={styles.specValue}>{updatedDate}</Text>
            </View>
          </View>

            <View style={styles.stockFooter}>
              <Text style={styles.stockPrice}>{formatPrice(stock.price)}</Text>
              <Text style={styles.stockQuantity}>Quantity: {stock.quantity}</Text>
            </View>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={(event) => {
              event.stopPropagation?.();
              handleEditStock(stock);
            }}
          >
            <Pencil size={18} color={PRIMARY_ACCENT} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteActionButton]}
            onPress={(event) => {
              event.stopPropagation?.();
              handleDeleteStock(stock);
            }}
          >
            <Trash2 size={18} color={PRIMARY_ACCENT} />
          </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderFilterModal = () => (
    <Modal
      visible={showFilterModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowFilterModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter Stocks</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowFilterModal(false)}
            >
              <CircleX size={18} color={COLORS.TEXT.SECONDARY} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Motorbike</Text>
              <View style={styles.filterOptions}>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    !selectedMotorbikeId && styles.selectedFilterOption,
                  ]}
                  onPress={() => handleFilterMotorbike(null)}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      !selectedMotorbikeId && styles.selectedFilterOptionText,
                    ]}
                  >
                    All Motorbikes
                  </Text>
                </TouchableOpacity>
                {motorbikes.map((motorbike) => (
                  <TouchableOpacity
                    key={motorbike.id}
                    style={[
                      styles.filterOption,
                      selectedMotorbikeId === motorbike.id && styles.selectedFilterOption,
                    ]}
                    onPress={() => handleFilterMotorbike(motorbike.id)}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        selectedMotorbikeId === motorbike.id && styles.selectedFilterOptionText,
                      ]}
                    >
                      {motorbike.name || `ID: ${motorbike.id}`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Color</Text>
              <View style={styles.filterOptions}>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    !selectedColorId && styles.selectedFilterOption,
                  ]}
                  onPress={() => handleFilterColor(null)}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      !selectedColorId && styles.selectedFilterOptionText,
                    ]}
                  >
                    All Colors
                  </Text>
                </TouchableOpacity>
                {colors.map((color) => (
                  <TouchableOpacity
                    key={color.id}
                    style={[
                      styles.filterOption,
                      selectedColorId === color.id && styles.selectedFilterOption,
                    ]}
                    onPress={() => handleFilterColor(color.id)}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        selectedColorId === color.id && styles.selectedFilterOptionText,
                      ]}
                    >
                      {color.colorType || `Color ${color.id}`}
                    </Text>
                  </TouchableOpacity>
                ))}
                {colors.length === 0 && (
                  <Text style={styles.modalEmptyText}>No colors available</Text>
                )}
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
              <Text style={styles.clearButtonText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Calculate statistics
  const totalStocks = stocks.length;
  const totalQuantity = stocks.reduce((sum, stock) => sum + stock.quantity, 0);
  const inStockCount = stocks.filter(stock => stock.quantity > 0).length;
  const outOfStockCount = stocks.filter(stock => stock.quantity === 0).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
            <ArrowLeft size={18} color={COLORS.TEXT.WHITE} />
        </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={styles.headerTitleText}>Stock Management</Text>
            <Text style={styles.headerSubtitle}>Manage your agency inventory</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={handleAddStock}>
            <Plus size={18} color={COLORS.TEXT.WHITE} />
        </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchSection}>
      <View style={styles.searchContainer}>
          <Search size={18} color={COLORS.TEXT.SECONDARY} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search motorbikes..."
          placeholderTextColor={COLORS.TEXT.SECONDARY}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilterModal(true)}
          >
            <Filter size={20} color={COLORS.TEXT.SECONDARY} />
          </TouchableOpacity>
            </View>
        </View>

      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={PRIMARY_ACCENT} />
      </View>
        ) : (
          <FlatList
            data={filteredStocks}
            renderItem={renderStockCard}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={PRIMARY_ACCENT}
                colors={[PRIMARY_ACCENT]}
              />
            }
            ListHeaderComponent={
              <View style={styles.listHeader}>
                <View style={styles.listHeaderTop}>
                  <Text style={styles.listTitle}>Stocks ({filteredStocks.length})</Text>
                  <TouchableOpacity
                    style={styles.inlineFilterButton}
                    onPress={() => setShowFilterModal(true)}
                  >
                  </TouchableOpacity>
                </View>
                <View style={styles.statsContainer}>
                  <View style={styles.statCard}>
                    <Text style={styles.statNumber}>{totalStocks}</Text>
                    <Text style={styles.statLabel}>Total Stock</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={[styles.statNumber, styles.statNumberSuccess]}>{totalQuantity}</Text>
                    <Text style={styles.statLabel}>Total Quantity</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={[styles.statNumber, styles.statNumberSuccess]}>{inStockCount}</Text>
                    <Text style={styles.statLabel}>In Stock</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={[styles.statNumber, styles.statNumberError]}>{outOfStockCount}</Text>
                    <Text style={styles.statLabel}>Out of Stock</Text>
                  </View>
                </View>

                {(selectedMotorbikeId || selectedColorId) && (
                  <View style={styles.activeFilters}>
                    {selectedMotorbikeId && (
                      <View style={styles.filterChip}>
                        <Bike size={14} color={PRIMARY_ACCENT} />
                        <Text style={styles.filterChipText}>{getSelectedMotorbikeName()}</Text>
                      </View>
                    )}
                    {selectedColorId && (
                      <View style={styles.filterChip}>
                        <Palette size={14} color={PRIMARY_ACCENT} />
                        <Text style={styles.filterChipText}>{getSelectedColorName()}</Text>
                      </View>
                    )}
                    <TouchableOpacity style={styles.clearChip} onPress={clearFilters}>
                      <Text style={styles.clearChipText}>Clear</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Package size={64} color={COLORS.TEXT.SECONDARY} />
                <Text style={styles.emptyTitle}>
                  {searchQuery ? 'No results found' : 'No stock items'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery
                    ? 'Try adjusting your search'
                    : 'Add a new stock item to get started'}
                </Text>
                {!searchQuery && (
                  <TouchableOpacity
                    style={styles.addFirstButton}
                    onPress={handleAddStock}
                  >
                    <Text style={styles.addFirstButtonText}>Add Stock</Text>
                  </TouchableOpacity>
                )}
              </View>
            }
          />
        )}
            </View>

      {renderFilterModal()}
      
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
    backgroundColor: PRIMARY_ACCENT,
    justifyContent: 'center',
    alignItems: 'center',
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
  filterButton: {
    paddingHorizontal: SIZES.PADDING.SMALL,
    paddingVertical: SIZES.PADDING.XSMALL,
    marginLeft: SIZES.PADDING.SMALL,
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.SURFACE,
    borderTopLeftRadius: SIZES.RADIUS.XXLARGE,
    borderTopRightRadius: SIZES.RADIUS.XXLARGE,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: SIZES.PADDING.LARGE,
    paddingBottom: Platform.OS === 'ios' ? SIZES.PADDING.XXXLARGE : SIZES.PADDING.XXLARGE,
  },
  listHeader: {
    paddingTop: SIZES.PADDING.LARGE,
    paddingBottom: SIZES.PADDING.MEDIUM,
  },
  listHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SIZES.PADDING.SMALL,
  },
  listTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
  },
  inlineFilterButton: {
    // flexDirection: 'row',
    // alignItems: 'center',
    // backgroundColor: 'rgba(0, 157, 255, 0.12)',
    // paddingHorizontal: SIZES.PADDING.MEDIUM,
    // paddingVertical: SIZES.PADDING.XSMALL,
    // borderRadius: SIZES.RADIUS.LARGE,
    // gap: SIZES.PADDING.XSMALL,
  },
  inlineFilterText: {
    fontSize: SIZES.FONT.SMALL,
    color: PRIMARY_ACCENT,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: SIZES.PADDING.MEDIUM,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.SMALL,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statNumber: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: PRIMARY_ACCENT,
    marginBottom: 4,
  },
  statNumberSuccess: {
    color: PRIMARY_ACCENT,
  },
  statNumberError: {
    color: COLORS.ERROR,
  },
  statLabel: {
    fontSize: SIZES.FONT.XSMALL,
    color: COLORS.TEXT.SECONDARY,
  },
  activeFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: SIZES.PADDING.MEDIUM,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 157, 255, 0.12)',
    borderRadius: SIZES.RADIUS.LARGE,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.XSMALL,
    marginRight: SIZES.PADDING.SMALL,
    marginBottom: SIZES.PADDING.XSMALL,
  },
  filterChipText: {
    marginLeft: SIZES.PADDING.XSMALL,
    fontSize: SIZES.FONT.SMALL,
    color: PRIMARY_ACCENT,
    fontWeight: '600',
  },
  clearChip: {
    backgroundColor: '#F1F3F5',
    borderRadius: SIZES.RADIUS.LARGE,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.XSMALL,
    marginBottom: SIZES.PADDING.XSMALL,
  },
  clearChipText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    fontWeight: '600',
  },
  stockCardShadow: {
    marginBottom: SIZES.PADDING.MEDIUM,
    borderRadius: SIZES.RADIUS.LARGE,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    backgroundColor: 'transparent',
  },
  stockCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.LARGE,
    overflow: 'hidden',
  },
  stockImageContainer: {
    position: 'relative',
    height: 200,
  },
  stockImage: {
    width: '100%',
    height: '100%',
  },
  statusBadge: {
    position: 'absolute',
    top: SIZES.PADDING.MEDIUM,
    right: SIZES.PADDING.MEDIUM,
    paddingHorizontal: SIZES.PADDING.SMALL,
    paddingVertical: SIZES.PADDING.XSMALL,
    borderRadius: SIZES.RADIUS.SMALL,
  },
  statusBadgeSuccess: {
    backgroundColor: COLORS.SUCCESS,
  },
  statusBadgeError: {
    backgroundColor: COLORS.ERROR,
  },
  statusText: {
    fontSize: SIZES.FONT.XSMALL,
    color: COLORS.TEXT.WHITE,
    fontWeight: 'bold',
  },
  stockInfo: {
    padding: SIZES.PADDING.MEDIUM,
  },
  motorbikeName: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
  },
  modelText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.PRIMARY,
    fontWeight: '600',
    marginTop: 2,
    marginBottom: SIZES.PADDING.SMALL,
  },
  stockSpecs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.PADDING.SMALL,
    gap: SIZES.PADDING.SMALL,
  },
  specItem: {
    flex: 1,
    alignItems: 'center',
  },
  specLabel: {
    fontSize: SIZES.FONT.XSMALL,
    color: COLORS.TEXT.SECONDARY,
  },
  specValue: {
    fontSize: SIZES.FONT.SMALL,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
    textAlign: 'center',
  },
  stockFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SIZES.PADDING.MEDIUM,
  },
  stockPrice: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.SECONDARY,
  },
  stockQuantity: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingBottom: SIZES.PADDING.MEDIUM,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: SIZES.RADIUS.SMALL,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SIZES.PADDING.SMALL,
  },
  deleteActionButton: {
    backgroundColor: '#FFE5E5',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SIZES.PADDING.XXXLARGE,
  },
  emptyTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginTop: SIZES.PADDING.MEDIUM,
    marginBottom: SIZES.PADDING.SMALL,
  },
  emptySubtitle: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
    textAlign: 'center',
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  addFirstButton: {
    backgroundColor: PRIMARY_ACCENT,
    borderRadius: SIZES.RADIUS.LARGE,
    paddingHorizontal: SIZES.PADDING.LARGE,
    paddingVertical: SIZES.PADDING.MEDIUM,
  },
  addFirstButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.SURFACE,
    borderTopLeftRadius: SIZES.RADIUS.XXLARGE,
    borderTopRightRadius: SIZES.RADIUS.XXLARGE,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.PADDING.LARGE,
    paddingVertical: SIZES.PADDING.LARGE,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: SIZES.RADIUS.ROUND,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    paddingHorizontal: SIZES.PADDING.LARGE,
    paddingVertical: SIZES.PADDING.MEDIUM,
  },
  filterSection: {
    marginBottom: SIZES.PADDING.XLARGE,
  },
  filterSectionTitle: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.PADDING.SMALL,
  },
  filterOption: {
    backgroundColor: '#F8F9FA',
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedFilterOption: {
    backgroundColor: "#009DFF",
    borderColor: "#009DFF",
  },
  filterOptionText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '500',
  },
  selectedFilterOptionText: {
    color: COLORS.TEXT.WHITE,
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.PADDING.LARGE,
    paddingVertical: SIZES.PADDING.LARGE,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: SIZES.PADDING.MEDIUM,
  },
  clearButton: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: SIZES.RADIUS.LARGE,
    paddingVertical: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  clearButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
  },
  applyButton: {
    flex: 1,
    backgroundColor: "#009DFF",
    borderRadius: SIZES.RADIUS.LARGE,
    paddingVertical: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: '600',
    color: COLORS.TEXT.WHITE,
  },
  modalEmptyText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
    textAlign: 'center',
    paddingVertical: SIZES.PADDING.LARGE,
    fontStyle: 'italic',
  },
});

export default StockManagementScreen;

