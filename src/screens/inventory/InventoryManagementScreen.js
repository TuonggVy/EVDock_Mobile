import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Dimensions,
  TextInput,
} from 'react-native';
import { COLORS, SIZES } from '../../constants';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import { inventoryService } from '../../services/inventoryService';
import warehouseService from '../../services/warehouseService';
import motorbikeService from '../../services/motorbikeService';
import {
  ArrowLeft,
  Plus,
  Search,
  CheckCircle,
  AlertTriangle,
  XCircle,
  PackageSearch,
  PackageX,
  Pencil,
  Trash2,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

const InventoryManagementScreen = ({ navigation }) => {
  const [inventory, setInventory] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [warehouses, setWarehouses] = useState([]);
  const [motorbikes, setMotorbikes] = useState([]);
  const [activeTab, setActiveTab] = useState('in_stock'); // 'in_stock' or 'out_of_stock'
  const [colors, setColors] = useState([]);

  const { alertConfig, hideAlert, showSuccess, showError, showConfirm } = useCustomAlert();

  useEffect(() => {
    loadInventory();
    loadWarehouses();
    loadMotorbikes();
    loadColors();
  }, []);

  // Refresh inventory when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadInventory();
    });

    return unsubscribe;
  }, [navigation]);

  const loadInventory = async () => {
    try {
      const response = await inventoryService.getInventory();
      if (response.success) {
        // Sort by lastUpdate or stockDate descending (newest first)
        const sortedData = response.data.sort((a, b) => {
          const dateA = new Date(a.lastUpdate || a.stockDate || 0);
          const dateB = new Date(b.lastUpdate || b.stockDate || 0);
          return dateB - dateA; // Descending order (newest first)
        });
        setInventory(sortedData);
      } else {
        // Ensure error message is always a string
        const errorMessage = typeof response.error === 'string' 
          ? response.error 
          : (response.error?.message || JSON.stringify(response.error) || 'Unable to load inventory list');
        showError('Error', errorMessage);
      }
    } catch (error) {
      console.error('Error loading inventory:', error);
      showError('Error', 'Unable to load inventory list');
    }
  };

  const loadWarehouses = async () => {
    try {
      const response = await warehouseService.getWarehousesList();
      if (response.success) {
        setWarehouses(response.data || []);
      }
    } catch (error) {
      console.error('Error loading warehouses:', error);
    }
  };

  const loadMotorbikes = async () => {
    try {
      // Load all motorbikes with a large limit to ensure all are loaded
      const response = await motorbikeService.getAllMotorbikes({ limit: 1000 });
      if (response.success) {
        setMotorbikes(response.data || []);
        console.log('Loaded motorbikes count:', (response.data || []).length);
      } else {
        console.error('Failed to load motorbikes:', response.error);
      }
    } catch (error) {
      console.error('Error loading motorbikes:', error);
    }
  };

  const loadColors = async () => {
    try {
      const response = await motorbikeService.getAllColors();
      if (response.success) {
        const rawColors = response.data?.data || response.data || [];
        const normalized = rawColors
          .map(color => ({
            id: color?.id || color?.color?.id,
            name: color?.colorType || color?.color?.colorType || color?.name || `Color ${color?.id || color?.color?.id}`,
          }))
          .filter(color => color.id);
        setColors(normalized);
      }
    } catch (error) {
      console.error('Error loading colors:', error);
    }
  };

  const getColorName = (colorId) => {
    if (!colorId) return 'N/A';
    const color = colors.find(c => Number(c.id) === Number(colorId));
    return color?.name || `Color ${colorId}`;
  };

  const filteredInventory = inventory.filter(item => {
    // Ensure proper ID comparison (handle both number and string types)
    const motorbike = motorbikes.find(m => 
      Number(m.id) === Number(item.electricMotorbikeId)
    );
    const warehouse = warehouses.find(w => 
      Number(w.id) === Number(item.warehouseId)
    );
    const colorName = getColorName(item.colorId);
    const searchLower = searchQuery.toLowerCase();
    
    // Filter by search query
    const matchesSearch = (
      (motorbike?.name?.toLowerCase().includes(searchLower)) ||
      (motorbike?.model?.toLowerCase().includes(searchLower)) ||
      (warehouse?.name?.toLowerCase().includes(searchLower)) ||
      (warehouse?.location?.toLowerCase().includes(searchLower)) ||
      (colorName?.toLowerCase().includes(searchLower))
    );
    
    // Filter by tab status
    const matchesTab = activeTab === 'in_stock' 
      ? item.quantity > 0  // Còn hàng
      : item.quantity === 0; // Hết hàng
    
    return matchesSearch && matchesTab;
  });

  const getStatusMeta = (quantity) => {
    if (quantity === 0) {
      return {
        color: COLORS.ERROR,
        label: 'Out of Stock',
        Icon: XCircle,
      };
    }

    if (quantity <= 10) {
      return {
        color: COLORS.WARNING,
        label: 'Low Stock',
        Icon: AlertTriangle,
      };
    }

    return {
      color: COLORS.SUCCESS,
      label: 'In Stock',
      Icon: CheckCircle,
    };
  };

  const handleAddItem = () => {
    navigation.navigate('AddInventory');
  };

  const handleViewItem = (item) => {
    navigation.navigate('InventoryDetail', { item });
  };

  const handleEditItem = (item) => {
    navigation.navigate('EditInventory', { item });
  };

  const handleDeleteItem = (item) => {
    showConfirm(
      'Delete Inventory Item',
      'Are you sure you want to delete this inventory item?',
      async () => {
        try {
          const response = await inventoryService.deleteInventoryItem(
            item.electricMotorbikeId,
            item.warehouseId,
            item.colorId
          );
          if (response.success) {
            // Remove the item from state immediately
            setInventory(prevInventory => {
              return prevInventory.filter(prevItem => 
                !(prevItem.electricMotorbikeId === item.electricMotorbikeId &&
                  prevItem.warehouseId === item.warehouseId &&
                  prevItem.colorId === item.colorId)
              );
            });
            
            showSuccess('Success', 'Inventory item deleted successfully!');
            
            // Reload inventory to ensure sync with server
            loadInventory();
          } else {
            // Ensure error message is always a string
            const errorMessage = typeof response.error === 'string' 
              ? response.error 
              : (response.error?.message || JSON.stringify(response.error) || 'Unable to delete inventory item');
            showError('Error', errorMessage);
          }
        } catch (error) {
          console.error('Error deleting item:', error);
          showError('Error', 'Unable to delete inventory item');
        }
      }
    );
  };

  const getMotorbikeName = (motorbikeId) => {
    const motorbike = motorbikes.find(m => Number(m.id) === Number(motorbikeId));
    return motorbike?.name || motorbike?.model || 'Unknown Motorbike';
  };

  const getWarehouseName = (warehouseId) => {
    const warehouse = warehouses.find(w => Number(w.id) === Number(warehouseId));
    return warehouse?.name || 'Unknown Warehouse';
  };

  const getWarehouseLocation = (warehouseId) => {
    const warehouse = warehouses.find(w => Number(w.id) === Number(warehouseId));
    return warehouse?.location || '';
  };

  const renderInventoryCard = (item) => {
    // Ensure proper ID comparison (handle both number and string types)
    const motorbike = motorbikes.find(m => 
      Number(m.id) === Number(item.electricMotorbikeId)
    );
    const warehouse = warehouses.find(w => 
      Number(w.id) === Number(item.warehouseId)
    );
    const statusMeta = getStatusMeta(item.quantity);

    return (
      <TouchableOpacity 
        key={`${item.electricMotorbikeId}-${item.warehouseId}-${item.colorId}`} 
        style={styles.inventoryCard}
        onPress={() => handleViewItem(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.itemInfo}>
            <Text style={styles.motorbikeName}>{motorbike?.name || 'Unknown'}</Text>
            <Text style={styles.warehouseName}>{warehouse?.name || 'Unknown'}</Text>
          </View>
          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, { backgroundColor: statusMeta.color }]}>
              <statusMeta.Icon size={14} color={COLORS.TEXT.WHITE} />
              <Text style={styles.statusText}>{statusMeta.label}</Text>
            </View>
          </View>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Model:</Text>
            <Text style={styles.detailValue}>{motorbike?.model || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Warehouse Location:</Text>
            <Text style={styles.detailValue}>{warehouse?.location || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Color:</Text>
            <Text style={styles.detailValue}>{getColorName(item.colorId)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Quantity:</Text>
            <Text style={[styles.detailValue, { color: statusMeta.color }]}>
              {item.quantity} units
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Stock Date:</Text>
            <Text style={styles.detailValue}>
              {item.stockDate ? new Date(item.stockDate).toLocaleDateString('en-US') : 'N/A'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Last Updated:</Text>
            <Text style={styles.detailValue}>
              {item.lastUpdate ? new Date(item.lastUpdate).toLocaleDateString('en-US') : 'N/A'}
            </Text>
          </View>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => handleEditItem(item)}
          >
            <Pencil size={16} color={COLORS.TEXT.WHITE} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => handleDeleteItem(item)}
          >
            <Trash2 size={16} color={COLORS.TEXT.WHITE} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // Calculate statistics
  const totalItems = inventory.length;
  const inStockItems = inventory.filter(item => item.quantity > 10).length;
  const lowStockItems = inventory.filter(item => item.quantity > 0 && item.quantity <= 10).length;
  const outOfStockItems = inventory.filter(item => item.quantity === 0).length;

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
        <Text style={styles.headerTitle}>Inventory Management</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddItem}
        >
          <Plus color={COLORS.TEXT.WHITE} size={18} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={18} color={COLORS.TEXT.SECONDARY} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search motorbikes, warehouses..."
          placeholderTextColor={COLORS.TEXT.SECONDARY}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalItems}</Text>
          <Text style={styles.statLabel}>Total Items</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: COLORS.SUCCESS }]}>{inStockItems}</Text>
          <Text style={styles.statLabel}>In Stock</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: COLORS.WARNING }]}>{lowStockItems}</Text>
          <Text style={styles.statLabel}>Low Stock</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: COLORS.ERROR }]}>{outOfStockItems}</Text>
          <Text style={styles.statLabel}>Out of Stock</Text>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'in_stock' && styles.activeTabButton
          ]}
          onPress={() => setActiveTab('in_stock')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'in_stock' && styles.activeTabText
          ]}>
            In Stock ({inStockItems})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'out_of_stock' && styles.activeTabButton
          ]}
          onPress={() => setActiveTab('out_of_stock')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'out_of_stock' && styles.activeTabText
          ]}>
            Out of Stock ({outOfStockItems})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Inventory List */}
      <ScrollView
        style={styles.inventoryList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.inventoryContent}
      >
        {filteredInventory.length > 0 ? (
          filteredInventory.map(renderInventoryCard)
        ) : (
          <View style={styles.emptyState}>
            {activeTab === 'in_stock' ? (
              <PackageSearch size={64} color={COLORS.TEXT.SECONDARY} />
            ) : (
              <PackageX size={64} color={COLORS.TEXT.SECONDARY} />
            )}
            <Text style={styles.emptyTitle}>
              {activeTab === 'in_stock' ? 'No Vehicles In Stock' : 'No Vehicles Out of Stock'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'in_stock' 
                ? 'All vehicles are currently out of stock.' 
                : 'All vehicles are currently available.'
              }
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
  
  // Header
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
    gap: SIZES.PADDING.SMALL,
  },
  searchInput: {
    flex: 1,
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
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
    color: COLORS.SUCCESS,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: SIZES.FONT.XSMALL,
    color: COLORS.TEXT.SECONDARY,
    textAlign: 'center',
  },

  // Tab Navigation
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

  // Inventory List
  inventoryList: {
    flex: 1,
  },
  inventoryContent: {
    padding: SIZES.PADDING.MEDIUM,
  },
  inventoryCard: {
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
  itemInfo: {
    flex: 1,
  },
  motorbikeName: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: '#009DFF',
    marginBottom: 4,
  },
  warehouseName: {
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
  },
  statusText: {
    fontSize: SIZES.FONT.XSMALL,
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
    marginLeft: 4,
  },
  cardContent: {
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

  // Empty State
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

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingTop: Platform.OS === 'ios' ? 20 : 0,
    paddingBottom: SIZES.PADDING.MEDIUM,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalCloseButton: {
    padding: SIZES.PADDING.SMALL,
  },
  modalCloseText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
  },
  modalTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
    flex: 1,
    textAlign: 'center',
  },
  modalSaveButton: {
    padding: SIZES.PADDING.SMALL,
  },
  modalSaveText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: SIZES.PADDING.MEDIUM,
  },
  inputGroup: {
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  inputLabel: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.WHITE,
    marginBottom: SIZES.PADDING.SMALL,
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
  },
  selectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.PADDING.SMALL,
  },
  selectOption: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    borderWidth: 1,
    borderColor: 'transparent',
    minWidth: '45%',
    alignItems: 'center',
  },
  selectedOption: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
  },
  selectOptionText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
  },
  selectedOptionText: {
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
});

export default InventoryManagementScreen;

