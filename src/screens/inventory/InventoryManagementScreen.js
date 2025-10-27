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

const { width } = Dimensions.get('window');

const InventoryManagementScreen = ({ navigation }) => {
  const [inventory, setInventory] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [warehouses, setWarehouses] = useState([]);
  const [motorbikes, setMotorbikes] = useState([]);
  const [activeTab, setActiveTab] = useState('in_stock'); // 'in_stock' or 'out_of_stock'

  const { alertConfig, hideAlert, showSuccess, showError, showConfirm } = useCustomAlert();

  useEffect(() => {
    loadInventory();
    loadWarehouses();
    loadMotorbikes();
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
          : (response.error?.message || JSON.stringify(response.error) || 'Không thể tải danh sách tồn kho');
        showError('Lỗi', errorMessage);
      }
    } catch (error) {
      console.error('Error loading inventory:', error);
      showError('Lỗi', 'Không thể tải danh sách tồn kho');
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
      const response = await motorbikeService.getAllMotorbikes();
      if (response.success) {
        setMotorbikes(response.data || []);
      }
    } catch (error) {
      console.error('Error loading motorbikes:', error);
    }
  };

  const filteredInventory = inventory.filter(item => {
    const motorbike = motorbikes.find(m => m.id === item.electricMotorbikeId);
    const warehouse = warehouses.find(w => w.id === item.warehouseId);
    const searchLower = searchQuery.toLowerCase();
    
    // Filter by search query
    const matchesSearch = (
      (motorbike?.name?.toLowerCase().includes(searchLower)) ||
      (motorbike?.model?.toLowerCase().includes(searchLower)) ||
      (warehouse?.name?.toLowerCase().includes(searchLower)) ||
      (warehouse?.location?.toLowerCase().includes(searchLower))
    );
    
    // Filter by tab status
    const matchesTab = activeTab === 'in_stock' 
      ? item.quantity > 0  // Còn hàng
      : item.quantity === 0; // Hết hàng
    
    return matchesSearch && matchesTab;
  });

  const getStatusColor = (quantity) => {
    if (quantity === 0) return COLORS.ERROR;
    if (quantity <= 10) return COLORS.WARNING;
    return COLORS.SUCCESS;
  };

  const getStatusText = (quantity) => {
    if (quantity === 0) return 'Hết hàng';
    if (quantity <= 10) return 'Sắp hết';
    return 'Còn hàng';
  };

  const getStatusIcon = (quantity) => {
    if (quantity === 0) return '❌';
    if (quantity <= 10) return '⚠️';
    return '✅';
  };

  const handleAddItem = () => {
    navigation.navigate('AddInventory');
  };

  const handleEditItem = (item) => {
    navigation.navigate('EditInventory', { item });
  };

  const handleDeleteItem = (item) => {
    showConfirm(
      'Xác nhận xóa',
      'Bạn có chắc chắn muốn xóa mục tồn kho này?',
      async () => {
        try {
          const response = await inventoryService.deleteInventoryItem(
            item.electricMotorbikeId,
            item.warehouseId
          );
          if (response.success) {
            // Remove the item from state immediately
            setInventory(prevInventory => {
              return prevInventory.filter(prevItem => 
                !(prevItem.electricMotorbikeId === item.electricMotorbikeId &&
                  prevItem.warehouseId === item.warehouseId)
              );
            });
            
            showSuccess('Thành công', 'Xóa tồn kho thành công!');
            
            // Reload inventory to ensure sync with server
            loadInventory();
          } else {
            // Ensure error message is always a string
            const errorMessage = typeof response.error === 'string' 
              ? response.error 
              : (response.error?.message || JSON.stringify(response.error) || 'Không thể xóa mục tồn kho');
            showError('Lỗi', errorMessage);
          }
        } catch (error) {
          console.error('Error deleting item:', error);
          showError('Lỗi', 'Không thể xóa mục tồn kho');
        }
      }
    );
  };

  const getMotorbikeName = (motorbikeId) => {
    const motorbike = motorbikes.find(m => m.id === motorbikeId);
    return motorbike?.name || motorbike?.model || 'Unknown Motorbike';
  };

  const getWarehouseName = (warehouseId) => {
    const warehouse = warehouses.find(w => w.id === warehouseId);
    return warehouse?.name || 'Unknown Warehouse';
  };

  const getWarehouseLocation = (warehouseId) => {
    const warehouse = warehouses.find(w => w.id === warehouseId);
    return warehouse?.location || '';
  };

  const renderInventoryCard = (item) => {
    const motorbike = motorbikes.find(m => m.id === item.electricMotorbikeId);
    const warehouse = warehouses.find(w => w.id === item.warehouseId);

    return (
      <View key={`${item.electricMotorbikeId}-${item.warehouseId}`} style={styles.inventoryCard}>
      <View style={styles.cardHeader}>
        <View style={styles.itemInfo}>
            <Text style={styles.motorbikeName}>{motorbike?.name || 'Unknown'}</Text>
            <Text style={styles.warehouseName}>{warehouse?.name || 'Unknown'}</Text>
        </View>
        <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.quantity) }]}>
              <Text style={styles.statusIcon}>{getStatusIcon(item.quantity)}</Text>
              <Text style={styles.statusText}>{getStatusText(item.quantity)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Mẫu xe:</Text>
            <Text style={styles.detailValue}>{motorbike?.model || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Địa điểm kho:</Text>
            <Text style={styles.detailValue}>{warehouse?.location || 'N/A'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Số lượng:</Text>
            <Text style={[styles.detailValue, { color: getStatusColor(item.quantity) }]}>
            {item.quantity} xe
          </Text>
        </View>
        <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Ngày nhập kho:</Text>
            <Text style={styles.detailValue}>
              {item.stockDate ? new Date(item.stockDate).toLocaleDateString('vi-VN') : 'N/A'}
            </Text>
        </View>
        <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Cập nhật lần cuối:</Text>
            <Text style={styles.detailValue}>
              {item.lastUpdate ? new Date(item.lastUpdate).toLocaleDateString('vi-VN') : 'N/A'}
            </Text>
        </View>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => handleEditItem(item)}
        >
          <Text style={styles.editButtonText}>Chỉnh sửa</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
            onPress={() => handleDeleteItem(item)}
        >
          <Text style={styles.deleteButtonText}>Xóa</Text>
        </TouchableOpacity>
      </View>
    </View>
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
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quản lý tồn kho</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddItem}
        >
          <Text style={styles.addIcon}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm xe máy, kho..."
          placeholderTextColor={COLORS.TEXT.SECONDARY}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalItems}</Text>
          <Text style={styles.statLabel}>Tổng mục</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: COLORS.SUCCESS }]}>{inStockItems}</Text>
          <Text style={styles.statLabel}>Còn hàng</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: COLORS.WARNING }]}>{lowStockItems}</Text>
          <Text style={styles.statLabel}>Sắp hết</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: COLORS.ERROR }]}>{outOfStockItems}</Text>
          <Text style={styles.statLabel}>Hết hàng</Text>
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
            Còn hàng ({inStockItems})
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
            Hết hàng ({outOfStockItems})
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
            <Text style={styles.emptyIcon}>
              {activeTab === 'in_stock' ? '📦' : '❌'}
            </Text>
            <Text style={styles.emptyTitle}>
              {activeTab === 'in_stock' ? 'Không có xe còn hàng' : 'Không có xe hết hàng'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'in_stock' 
                ? 'Tất cả xe đều đã hết hàng' 
                : 'Tất cả xe đều còn hàng'
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: SIZES.RADIUS.ROUND,
    backgroundColor: COLORS.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIcon: {
    fontSize: SIZES.FONT.LARGE,
    color: COLORS.TEXT.WHITE,
    fontWeight: 'bold',
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
    backgroundColor: COLORS.PRIMARY,
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
    color: COLORS.PRIMARY,
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
  statusIcon: {
    fontSize: SIZES.FONT.SMALL,
    marginRight: 4,
  },
  statusText: {
    fontSize: SIZES.FONT.XSMALL,
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
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
  editButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: SIZES.RADIUS.SMALL,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
  },
  editButtonText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: COLORS.ERROR,
    borderRadius: SIZES.RADIUS.SMALL,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
  },
  deleteButtonText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
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

