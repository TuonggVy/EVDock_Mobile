import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Modal,
  Dimensions,
  TextInput,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES } from '../../constants';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import { inventoryService } from '../../services/inventoryService';
import { vehicleService } from '../../services/vehicleService';

const { width } = Dimensions.get('window');

const InventoryManagementScreen = ({ navigation }) => {
  const [inventory, setInventory] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('in_stock'); // 'in_stock' or 'out_of_stock'
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [newItem, setNewItem] = useState({
    vehicleModel: '',
    color: '',
    quantity: '',
    warehouseLocation: '',
    price: '',
    description: '',
  });
  const [catalogModels, setCatalogModels] = useState([]); // names (derived)
  const [modelToColors, setModelToColors] = useState({});

  const { alertConfig, hideAlert, showSuccess, showError, showConfirm, showInfo } = useCustomAlert();

  // Derived warehouse locations (no hardcode)
  const warehouseLocations = Array.from(new Set(
    (inventory || [])
      .map((i) => i.warehouseLocation)
      .filter((v) => typeof v === 'string' && v.trim().length > 0)
  ));

  // Catalog-backed model/color options
  const vehicleModels = catalogModels;
  const availableColors = newItem.vehicleModel ? (modelToColors[newItem.vehicleModel] || []) : [];

  useEffect(() => {
    const loadCatalogFromVehicles = async () => {
      try {
        const res = await vehicleService.getAllVehicles();
        if (res?.success) {
          const list = res.data || [];
          const nameToColors = {};
          list.forEach((v) => {
            const name = v.name || v.model || 'Unknown';
            if (!nameToColors[name]) nameToColors[name] = new Set();
            (v.colors || []).forEach((c) => nameToColors[name].add(c));
          });
          const names = Object.keys(nameToColors);
          const map = {};
          names.forEach((n) => { map[n] = Array.from(nameToColors[n]); });
          setCatalogModels(names);
          setModelToColors(map);
        }
      } catch (e) {
        console.error('Error loading catalog options from Vehicles:', e);
      }
    };
    loadInventory();
    loadCatalogFromVehicles();
  }, []);

  // Refresh inventory when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadInventory();
      // refresh catalog options from Vehicles when screen focused
      (async () => {
        try {
          const res = await vehicleService.getAllVehicles();
          if (res?.success) {
            const list = res.data || [];
            const nameToColors = {};
            list.forEach((v) => {
              const name = v.name || v.model || 'Unknown';
              if (!nameToColors[name]) nameToColors[name] = new Set();
              (v.colors || []).forEach((c) => nameToColors[name].add(c));
            });
            const names = Object.keys(nameToColors);
            const map = {};
            names.forEach((n) => { map[n] = Array.from(nameToColors[n]); });
            setCatalogModels(names);
            setModelToColors(map);
          }
        } catch (e) {
          // noop
        }
      })();
    });

    return unsubscribe;
  }, [navigation]);

  const loadInventory = async () => {
    try {
      const response = await inventoryService.getInventory();
      if (response.success) {
        setInventory(response.data);
      } else {
        showError('Lỗi', response.error || 'Không thể tải danh sách tồn kho');
      }
    } catch (error) {
      console.error('Error loading inventory:', error);
      showError('Lỗi', 'Không thể tải danh sách tồn kho');
    }
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.vehicleModel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.color.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.warehouseLocation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTab = activeTab === 'in_stock' 
      ? (item.status === 'in_stock' || item.status === 'low_stock')
      : item.status === 'out_of_stock';
    
    return matchesSearch && matchesTab;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'in_stock': return COLORS.SUCCESS;
      case 'low_stock': return COLORS.WARNING;
      case 'out_of_stock': return COLORS.ERROR;
      default: return COLORS.TEXT.SECONDARY;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'in_stock': return 'Còn hàng';
      case 'low_stock': return 'Sắp hết';
      case 'out_of_stock': return 'Hết hàng';
      default: return 'Không xác định';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'in_stock': return '✅';
      case 'low_stock': return '⚠️';
      case 'out_of_stock': return '❌';
      default: return '❓';
    }
  };

  const updateItemStatus = (item) => {
    let status = 'in_stock';
    if (item.quantity === 0) {
      status = 'out_of_stock';
    } else if (item.quantity <= 10) {
      status = 'low_stock';
    }
    return { ...item, status };
  };

  const handleAddItem = () => {
    setNewItem({
      vehicleModel: '',
      color: '',
      quantity: '',
      warehouseLocation: '',
      price: '',
      description: '',
    });
    setShowAddModal(true);
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setNewItem({
      vehicleModel: item.vehicleModel,
      color: item.color,
      quantity: item.quantity.toString(),
      warehouseLocation: item.warehouseLocation,
      price: item.price.toString(),
      description: item.description,
    });
    setShowEditModal(true);
  };

  const handleSaveItem = async () => {
    if (!newItem.vehicleModel || !newItem.color || !newItem.quantity || !newItem.warehouseLocation || !newItem.price) {
      showError('Lỗi', 'Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    try {
      const itemData = {
        vehicleModel: newItem.vehicleModel,
        color: newItem.color,
        quantity: parseInt(newItem.quantity),
        warehouseLocation: newItem.warehouseLocation,
        price: parseInt(newItem.price),
        description: newItem.description,
      };

      let response;
      if (editingItem) {
        response = await inventoryService.updateInventoryItem(editingItem.id, itemData);
      } else {
        response = await inventoryService.createInventoryItem(itemData);
      }

      if (response.success) {
        // Reload inventory and derived model/color options
        await loadInventory();
        const latest = await inventoryService.getInventory();
        if (latest.success) {
          const list = latest.data || [];
          const nameToColors = {};
          list.forEach((it) => {
            const name = it.vehicleModel || 'Unknown';
            if (!nameToColors[name]) nameToColors[name] = new Set();
            if (it.color) nameToColors[name].add(it.color);
          });
          const names = Object.keys(nameToColors);
          const map = {};
          names.forEach((n) => { map[n] = Array.from(nameToColors[n]); });
          setCatalogModels(names);
          setModelToColors(map);
        }
        
        if (editingItem) {
          setShowEditModal(false);
          setEditingItem(null);
          showSuccess('Thành công', 'Cập nhật tồn kho thành công!');
        } else {
          setShowAddModal(false);
          showSuccess('Thành công', 'Thêm mới tồn kho thành công!');
        }

        setNewItem({
          vehicleModel: '',
          color: '',
          quantity: '',
          warehouseLocation: '',
          price: '',
          description: '',
        });
      } else {
        showError('Lỗi', response.error || 'Không thể lưu thông tin tồn kho');
      }
    } catch (error) {
      console.error('Error saving item:', error);
      showError('Lỗi', 'Không thể lưu thông tin tồn kho');
    }
  };

  const handleDeleteItem = (itemId) => {
    showConfirm(
      'Xác nhận xóa',
      'Bạn có chắc chắn muốn xóa mục tồn kho này?',
      async () => {
        try {
          const response = await inventoryService.deleteInventoryItem(itemId);
          if (response.success) {
            await loadInventory(); // Reload inventory
            showSuccess('Thành công', 'Xóa tồn kho thành công!');
          } else {
            showError('Lỗi', response.error || 'Không thể xóa mục tồn kho');
          }
        } catch (error) {
          console.error('Error deleting item:', error);
          showError('Lỗi', 'Không thể xóa mục tồn kho');
        }
      }
    );
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const renderInventoryCard = (item) => (
    <View key={item.id} style={styles.inventoryCard}>
      <View style={styles.cardHeader}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemId}>{item.id}</Text>
          <Text style={styles.vehicleModel}>{item.vehicleModel}</Text>
        </View>
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusIcon}>{getStatusIcon(item.status)}</Text>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Màu sắc:</Text>
          <Text style={styles.detailValue}>{item.color}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Số lượng:</Text>
          <Text style={[styles.detailValue, { color: getStatusColor(item.status) }]}>
            {item.quantity} xe
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Kho:</Text>
          <Text style={styles.detailValue}>{item.warehouseLocation}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Giá:</Text>
          <Text style={[styles.detailValue, styles.priceValue]}>{formatPrice(item.price)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Cập nhật:</Text>
          <Text style={styles.detailValue}>{item.lastUpdated}</Text>
        </View>
        {item.description && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Mô tả:</Text>
            <Text style={styles.detailValue}>{item.description}</Text>
          </View>
        )}
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
          onPress={() => handleDeleteItem(item.id)}
        >
          <Text style={styles.deleteButtonText}>Xóa</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderAddEditModal = () => (
    <Modal
      visible={showAddModal || showEditModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => {
              setShowAddModal(false);
              setShowEditModal(false);
              setEditingItem(null);
              setNewItem({
                vehicleModel: '',
                color: '',
                quantity: '',
                warehouseLocation: '',
                price: '',
                description: '',
              });
            }}
          >
            <Text style={styles.modalCloseText}>Hủy</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>
            {editingItem ? 'Chỉnh sửa tồn kho' : 'Thêm mới tồn kho'}
          </Text>
          <TouchableOpacity
            style={styles.modalSaveButton}
            onPress={handleSaveItem}
          >
            <Text style={styles.modalSaveText}>Lưu</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Mẫu xe *</Text>
            <View style={styles.modelSelector}>
              {vehicleModels.map((model) => (
                <TouchableOpacity
                  key={model}
                  style={[
                    styles.modelOption,
                    newItem.vehicleModel === model && styles.selectedModelOption
                  ]}
                  onPress={() => setNewItem({ ...newItem, vehicleModel: model, color: '' })}
                >
                  <Text style={[
                    styles.modelOptionText,
                    newItem.vehicleModel === model && styles.selectedModelOptionText
                  ]}>
                    {model}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Màu sắc *</Text>
            <View style={styles.colorSelector}>
              {availableColors.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    newItem.color === color && styles.selectedColorOption
                  ]}
                  onPress={() => setNewItem({ ...newItem, color: color })}
                >
                  <Text style={[
                    styles.colorOptionText,
                    newItem.color === color && styles.selectedColorOptionText
                  ]}>
                    {color}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Số lượng *</Text>
            <TextInput
              style={styles.textInput}
              value={newItem.quantity}
              onChangeText={(text) => setNewItem({ ...newItem, quantity: text })}
              placeholder="Nhập số lượng xe"
              placeholderTextColor={COLORS.TEXT.SECONDARY}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Kho lưu trữ *</Text>
            <View style={styles.warehouseSelector}>
              {warehouseLocations.map((location) => (
                <TouchableOpacity
                  key={location}
                  style={[
                    styles.warehouseOption,
                    newItem.warehouseLocation === location && styles.selectedWarehouseOption
                  ]}
                  onPress={() => setNewItem({ ...newItem, warehouseLocation: location })}
                >
                  <Text style={[
                    styles.warehouseOptionText,
                    newItem.warehouseLocation === location && styles.selectedWarehouseOptionText
                  ]}>
                    {location}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Giá bán *</Text>
            <TextInput
              style={styles.textInput}
              value={newItem.price}
              onChangeText={(text) => setNewItem({ ...newItem, price: text })}
              placeholder="Nhập giá bán (VND)"
              placeholderTextColor={COLORS.TEXT.SECONDARY}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Mô tả</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={newItem.description}
              onChangeText={(text) => setNewItem({ ...newItem, description: text })}
              placeholder="Nhập mô tả sản phẩm (nếu có)"
              placeholderTextColor={COLORS.TEXT.SECONDARY}
              multiline
              numberOfLines={3}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  // Calculate statistics
  const totalItems = inventory.length;
  const inStockItems = inventory.filter(item => item.status === 'in_stock').length;
  const lowStockItems = inventory.filter(item => item.status === 'low_stock').length;
  const outOfStockItems = inventory.filter(item => item.status === 'out_of_stock').length;
  const totalValue = inventory.reduce((sum, item) => sum + (item.price * item.quantity), 0);

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
          placeholder="Tìm kiếm mẫu xe, màu sắc, kho..."
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

      {/* Total Value Card */}
      <View style={styles.valueCard}>
        <Text style={styles.valueLabel}>Tổng giá trị tồn kho</Text>
        <Text style={styles.valueAmount}>{formatPrice(totalValue)}</Text>
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
            Còn hàng ({inStockItems + lowStockItems})
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
              {activeTab === 'in_stock' 
                ? 'Không có xe còn hàng' 
                : 'Không có xe hết hàng'
              }
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

      {renderAddEditModal()}
      
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

  // Value Card
  valueCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
    marginHorizontal: SIZES.PADDING.MEDIUM,
    marginBottom: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
  },
  valueLabel: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: SIZES.PADDING.SMALL,
  },
  valueAmount: {
    fontSize: SIZES.FONT.XXLARGE,
    fontWeight: 'bold',
    color: COLORS.SUCCESS,
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
  itemId: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: 4,
  },
  vehicleModel: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
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
  priceValue: {
    color: COLORS.SUCCESS,
    fontWeight: 'bold',
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },

  // Selectors
  modelSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.PADDING.SMALL,
  },
  modelOption: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    borderWidth: 1,
    borderColor: 'transparent',
    minWidth: '30%',
    alignItems: 'center',
  },
  selectedModelOption: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
  },
  modelOptionText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
  },
  selectedModelOptionText: {
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },

  colorSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.PADDING.SMALL,
  },
  colorOption: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    borderWidth: 1,
    borderColor: 'transparent',
    minWidth: '22%',
    alignItems: 'center',
  },
  selectedColorOption: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
  },
  colorOptionText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
  },
  selectedColorOptionText: {
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },

  warehouseSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.PADDING.SMALL,
  },
  warehouseOption: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    borderWidth: 1,
    borderColor: 'transparent',
    minWidth: '45%',
    alignItems: 'center',
  },
  selectedWarehouseOption: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
  },
  warehouseOptionText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
  },
  selectedWarehouseOptionText: {
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
});

export default InventoryManagementScreen;
