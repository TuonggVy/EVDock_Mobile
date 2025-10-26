import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  FlatList,
  RefreshControl,
  Modal,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Funnel } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS, SIZES, IMAGES } from '../../constants';
import motorbikeService from '../../services/motorbikeService';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';

const ProductManagementScreen = ({ navigation, route }) => {
  // When opened as VehicleManagement (manufacturer catalog), do not show quantities
  const isVehicleManagement = route?.name === 'VehicleManagement';
  const { user } = useAuth();
  const { alertConfig, hideAlert, showConfirm, showInfo } = useCustomAlert();
  
  // State management
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    modelFilters: [],
    makeFromFilter: []
  });
  const [selectedFilters, setSelectedFilters] = useState({
    model: 'all',
    makeFrom: 'all'
  });

  // Removed local mock; products will be loaded from manufacturer vehicles (storage / later BE)

  // Versions will be loaded from vehicleService

  // Load products on component mount
  useEffect(() => {
    loadProducts();
  }, []);

  // Refresh products when screen comes into focus (after editing)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadProducts();
    });

    return unsubscribe;
  }, [navigation]);

  // Load filter options from motorbike filters API
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        console.log('Loading filter options...');
        const res = await motorbikeService.getMotorbikeFilters();
        console.log('Filter API response:', res);
        
        if (res?.success && res.data) {
          console.log('Filter data:', res.data);
          setFilterOptions({
            modelFilters: res.data.modelFilters || [],
            makeFromFilter: res.data.makeFromFilter || []
          });
        } else {
          console.log('No filter data received or API failed, using fallback data');
          // Fallback data based on the API response structure you provided
          setFilterOptions({
            modelFilters: [
              { model: "Model X" },
              { model: "Model IX" },
              { model: "Model Y" }
            ],
            makeFromFilter: [
              { makeFrom: "Vietnam" }
            ]
          });
        }
      } catch (e) {
        console.error('Error loading filter options:', e);
      }
    };
    loadFilterOptions();
  }, []);

  // Filter products when search changes (local filtering)
  useEffect(() => {
    filterProducts();
  }, [searchQuery, products]);

  // Load products when filters change (API filtering)
  useEffect(() => {
    loadProducts();
  }, [selectedFilters]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      
      // Use motorbike API with pagination and filters
      const filters = {
        limit: 50, // Load more items for management
        page: 1,
        // Apply selected filters
        model: selectedFilters.model !== 'all' ? selectedFilters.model : undefined,
        makeFrom: selectedFilters.makeFrom !== 'all' ? selectedFilters.makeFrom : undefined,
      };
      
      const res = await motorbikeService.getAllMotorbikes(filters);
      const items = Array.isArray(res?.data) ? res.data : [];
      
      // Map motorbike API response to local card structure
      const mapped = items.map(motorbike => ({
        id: motorbike.id,
        name: motorbike.name,
        category: motorbike.model,
        version: motorbike.version,
        price: motorbike.price,
        status: motorbike.isDeleted ? 'out_of_stock' : 'available',
        image: { uri: 'https://via.placeholder.com/400x300?text=Motorbike' }, // Placeholder image
        description: motorbike.description,
        specifications: {
          model: motorbike.model,
          version: motorbike.version,
          makeFrom: motorbike.makeFrom,
        },
        model: motorbike.model,
        makeFrom: motorbike.makeFrom,
        colors: [], // Will be loaded from appearance data if needed
        createdAt: new Date().toISOString(), // Use current date as fallback
        isDeleted: motorbike.isDeleted,
      }));
      
      // Sort products by ID in descending order (newest first)
      const sorted = mapped.sort((a, b) => b.id - a.id);
      
      setProducts(sorted);
      setLoading(false);
    } catch (error) {
      console.error('Error loading products:', error);
      showInfo('Error', 'Failed to load products');
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = products;

    // Filter by search query (local filtering for search)
    if (searchQuery.trim()) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
  };

  const handleFilterChange = (filterType, value) => {
    setSelectedFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const applyFilters = () => {
    loadProducts();
    setShowFilterModal(false);
  };

  const clearFilters = () => {
    setSelectedFilters({
      model: 'all',
      makeFrom: 'all'
    });
  };

  const handleAddProduct = () => {
    navigation.navigate('AddProduct');
  };

  const handleEditProduct = (product) => {
    navigation.navigate('EditProduct', { product });
  };

  const handleDeleteProduct = (product) => {
    showConfirm(
      'Delete Product',
      `Are you sure you want to delete "${product.name}"?`,
      () => deleteProduct(product.id)
    );
  };

  const deleteProduct = async (productId) => {
    try {
      const res = await motorbikeService.deleteMotorbike(productId);
      
      if (res.success) {
        setProducts(prev => prev.filter(p => p.id !== productId));
        showInfo('Success', 'Motorbike deleted successfully');
      } else {
        showInfo('Error', res.message || 'Failed to delete motorbike');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      showInfo('Error', 'Failed to delete motorbike');
    }
  };

  const handleViewProduct = (product) => {
    navigation.navigate('ProductDetail', { product });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return COLORS.SUCCESS;
      case 'low_stock': return COLORS.WARNING;
      case 'out_of_stock': return COLORS.ERROR;
      default: return COLORS.TEXT.SECONDARY;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'available': return 'Available';
      case 'low_stock': return 'Low Stock';
      case 'out_of_stock': return 'Out of Stock';
      default: return 'Unknown';
    }
  };

  const renderProductCard = ({ item }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => handleViewProduct(item)}
    >
      <View style={styles.productImageContainer}>
        <Image source={item.image} style={styles.productImage} resizeMode="cover" />
        {!isVehicleManagement && (
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productCategory}>{item.category}</Text>
        <Text style={styles.productDescription} numberOfLines={2}>
          {item.description}
        </Text>
        
        <View style={styles.productSpecs}>
          {isVehicleManagement ? (
            <>
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>Model</Text>
                <Text style={styles.specValue}>{item.model || item.category}</Text>
              </View>
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>Version</Text>
                <Text style={styles.specValue}>{item.version}</Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>Range</Text>
                <Text style={styles.specValue}>{item.specifications.range}</Text>
              </View>
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>0-60mph</Text>
                <Text style={styles.specValue}>{item.specifications.acceleration}</Text>
              </View>
            </>
          )}
        </View>
        
        <View style={styles.productFooter}>
          <Text style={styles.productPrice}>${item.price.toLocaleString()}</Text>
          {!isVehicleManagement && (
            <Text style={styles.stockText}>Stock: {item.stock}</Text>
          )}
        </View>
      </View>
      
      <View style={styles.productActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleEditProduct(item)}
        >
          <Text style={styles.actionIcon}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteProduct(item)}
        >
          <Text style={styles.actionIcon}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderFilterModal = () => {
    console.log('Rendering filter modal with options:', filterOptions);
    return (
      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Options</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowFilterModal(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

          <ScrollView style={styles.modalBody}>
            {/* Model Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Model</Text>
              <View style={styles.filterOptions}>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    selectedFilters.model === 'all' && styles.selectedFilterOption
                  ]}
                  onPress={() => handleFilterChange('model', 'all')}
                >
                  <Text style={[
                    styles.filterOptionText,
                    selectedFilters.model === 'all' && styles.selectedFilterOptionText
                  ]}>
                    All Models
                  </Text>
                </TouchableOpacity>
                {filterOptions.modelFilters.map((filter, index) => {
                  console.log('Rendering model filter:', filter);
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.filterOption,
                        selectedFilters.model === filter.model && styles.selectedFilterOption
                      ]}
                      onPress={() => handleFilterChange('model', filter.model)}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        selectedFilters.model === filter.model && styles.selectedFilterOptionText
                      ]}>
                        {filter.model}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Make From Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Make From</Text>
              <View style={styles.filterOptions}>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    selectedFilters.makeFrom === 'all' && styles.selectedFilterOption
                  ]}
                  onPress={() => handleFilterChange('makeFrom', 'all')}
                >
                  <Text style={[
                    styles.filterOptionText,
                    selectedFilters.makeFrom === 'all' && styles.selectedFilterOptionText
                  ]}>
                    All Countries
                  </Text>
                </TouchableOpacity>
                {filterOptions.makeFromFilter.map((filter, index) => {
                  console.log('Rendering makeFrom filter:', filter);
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.filterOption,
                        selectedFilters.makeFrom === filter.makeFrom && styles.selectedFilterOption
                      ]}
                      onPress={() => handleFilterChange('makeFrom', filter.makeFrom)}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        selectedFilters.makeFrom === filter.makeFrom && styles.selectedFilterOptionText
                      ]}>
                        {filter.makeFrom}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={clearFilters}
            >
              <Text style={styles.clearButtonText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={applyFilters}
            >
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
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
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={styles.headerTitleText}>{isVehicleManagement ? 'Vehicles' : 'Product Management'}</Text>
            <Text style={styles.headerSubtitle}>{isVehicleManagement ? 'Manufacturer vehicle catalog' : 'Manage vehicle models'}</Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddProduct}
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
            placeholder={isVehicleManagement ? 'Search vehicles...' : 'Search products...'}
            placeholderTextColor={COLORS.TEXT.SECONDARY}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilterModal(true)}
          >
            <Funnel size={20} color={COLORS.TEXT.SECONDARY} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Products List */}
      <View style={styles.content}>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>
            {isVehicleManagement ? 'Vehicles' : 'Products'} ({filteredProducts.length})
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading products...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredProducts}
            renderItem={renderProductCard}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>🚗</Text>
                <Text style={styles.emptyTitle}>{isVehicleManagement ? 'No vehicles found' : 'No products found'}</Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery ? 'Try adjusting your search' : (isVehicleManagement ? 'Add your first vehicle' : 'Add your first product')}
                </Text>
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
  filterButton: {
    paddingHorizontal: SIZES.PADDING.SMALL,
    paddingVertical: SIZES.PADDING.XSMALL,
    marginLeft: SIZES.PADDING.SMALL,
  },

  // Filter Modal
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
  closeButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
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
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
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
    backgroundColor: COLORS.PRIMARY,
    borderRadius: SIZES.RADIUS.LARGE,
    paddingVertical: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: '600',
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

  // Product card
  productCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.LARGE,
    marginBottom: SIZES.PADDING.MEDIUM,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  productImageContainer: {
    position: 'relative',
    height: 200,
  },
  productImage: {
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
  statusText: {
    fontSize: SIZES.FONT.XSMALL,
    color: COLORS.TEXT.WHITE,
    fontWeight: 'bold',
  },
  productInfo: {
    padding: SIZES.PADDING.MEDIUM,
  },
  productName: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SIZES.PADDING.XSMALL,
  },
  productCategory: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.PRIMARY,
    fontWeight: '600',
    marginBottom: SIZES.PADDING.XSMALL,
  },
  productDescription: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    lineHeight: 18,
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  productSpecs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  specItem: {
    flex: 1,
    alignItems: 'center',
  },
  specLabel: {
    fontSize: SIZES.FONT.XSMALL,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: 2,
  },
  specValue: {
    fontSize: SIZES.FONT.SMALL,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.PADDING.SMALL,
  },
  productPrice: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.SECONDARY,
  },
  stockText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
  },
  productActions: {
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
  deleteButton: {
    backgroundColor: '#FFE5E5',
  },
  actionIcon: {
    fontSize: SIZES.FONT.MEDIUM,
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

export default ProductManagementScreen;
