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
import { useAuth } from '../../contexts/AuthContext';
import { COLORS, SIZES, IMAGES } from '../../constants';
import { vehicleService } from '../../services/vehicleService';
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
  const [selectedVersion, setSelectedVersion] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [versions, setVersions] = useState([{ id: 'all', name: 'All', icon: '🚗' }]);

  // Removed local mock; products will be loaded from manufacturer vehicles (storage / later BE)

  // Versions will be loaded from vehicleService

  // Load products on component mount
  useEffect(() => {
    loadProducts();
  }, []);

  // Load versions from catalog (vehicleService)
  useEffect(() => {
    const loadVersions = async () => {
      try {
        const res = await vehicleService.getVersions();
        if (res?.success && Array.isArray(res.data)) {
          setVersions(res.data);
        }
      } catch (e) {
        // keep default
      }
    };
    loadVersions();
  }, []);

  // Filter products when search or category changes
  useEffect(() => {
    filterProducts();
  }, [searchQuery, selectedVersion, products]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      // In VehicleManagement mode, show manufacturer vehicles from vehicleService
      if (isVehicleManagement) {
        const res = await vehicleService.getAllVehicles();
        const items = Array.isArray(res?.data) ? res.data : [];
        // Map to local card structure; hide stock/status elsewhere
        const mapped = items.map(v => ({
          id: v.id,
          name: v.name,
          category: v.model,
          version: v.version,
          price: v.price,
          status: undefined,
          image: v.image,
          description: v.description,
          specifications: {
            model: v.model,
            version: v.version,
          },
          model: v.model,
          colors: v.colors,
          createdAt: v.createdAt,
        }));
        setProducts(mapped);
        setLoading(false);
        return;
      }
      // In non-VehicleManagement usage, also show manufacturer vehicles (no stock fields)
      const res = await vehicleService.getAllVehicles();
      const items = Array.isArray(res?.data) ? res.data : [];
      const mapped = items.map(v => ({
        id: v.id,
        name: v.name,
        category: v.model,
        version: v.version,
        price: v.price,
        status: undefined,
        image: v.image,
        description: v.description,
        specifications: {
          model: v.model,
          version: v.version,
        },
        model: v.model,
        colors: v.colors,
        createdAt: v.createdAt,
      }));
      setProducts(mapped);
      setLoading(false);
    } catch (error) {
      console.error('Error loading products:', error);
      showInfo('Error', 'Failed to load products');
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = products;

    // Filter by version
    if (selectedVersion !== 'all') {
      filtered = filtered.filter(product => product.version === selectedVersion);
    }

    // Filter by search query
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
      // TODO: Replace with actual API call
      // await productService.deleteProduct(productId);
      
      // Mock deletion
      setProducts(prev => prev.filter(p => p.id !== productId));
      showInfo('Success', 'Product deleted successfully');
    } catch (error) {
      console.error('Error deleting product:', error);
      showInfo('Error', 'Failed to delete product');
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

  const renderCategoryFilter = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.categoryFilter}
      contentContainerStyle={styles.categoryFilterContent}
    >
      {versions.map((ver) => (
        <TouchableOpacity
          key={ver.id}
          style={[
            styles.categoryChip,
            selectedVersion === ver.id && styles.selectedCategoryChip
          ]}
          onPress={() => setSelectedVersion(ver.id)}
        >
          <Text style={styles.categoryIcon}>{ver.icon || '⚡'}</Text>
          <Text style={[
            styles.categoryText,
            selectedVersion === ver.id && styles.selectedCategoryText
          ]}>
            {ver.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

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
        </View>
        
        {renderCategoryFilter()}
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

  // Category filter
  categoryFilter: {
    marginBottom: SIZES.PADDING.SMALL,
  },
  categoryFilterContent: {
    paddingRight: SIZES.PADDING.LARGE,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.ROUND,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    marginRight: SIZES.PADDING.SMALL,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedCategoryChip: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  categoryIcon: {
    fontSize: SIZES.FONT.SMALL,
    marginRight: SIZES.PADDING.XSMALL,
  },
  categoryText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '500',
  },
  selectedCategoryText: {
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
