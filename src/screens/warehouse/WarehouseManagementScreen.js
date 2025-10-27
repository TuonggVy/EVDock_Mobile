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
  FlatList,
  Alert,
} from 'react-native';
import { COLORS, SIZES } from '../../constants';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import warehouseService from '../../services/warehouseService';

const { width } = Dimensions.get('window');

const WarehouseManagementScreen = ({ navigation }) => {
  const [warehouses, setWarehouses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'inactive'
  const [loading, setLoading] = useState(false);

  const { alertConfig, hideAlert, showSuccess, showError, showConfirm, showInfo } = useCustomAlert();

  useEffect(() => {
    loadWarehouses();
  }, []);

  // Reload warehouses when screen comes into focus (e.g., after adding/editing)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadWarehouses();
    });

    return unsubscribe;
  }, [navigation]);

  const loadWarehouses = async () => {
    setLoading(true);
    try {
      const res = await warehouseService.getWarehousesList();
      if (res?.success) {
        setWarehouses(res.data || []);
      } else {
        showError('Lỗi', res?.error || 'Không thể tải danh sách warehouse');
      }
    } catch (error) {
      showError('Lỗi', 'Không thể tải danh sách warehouse');
    } finally {
      setLoading(false);
    }
  };

  const filteredWarehouses = warehouses.filter(warehouse => {
    const matchesSearch = 
      warehouse.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      warehouse.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      warehouse.address?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTab = activeTab === 'active' 
      ? warehouse.isActive === true
      : warehouse.isActive === false;
    
    return matchesSearch && matchesTab;
  });

  const handleAddWarehouse = () => {
    navigation.navigate('AddWarehouse');
  };

  const handleViewWarehouse = (warehouse) => {
    navigation.navigate('WarehouseDetail', { warehouse });
  };

  const handleDeleteWarehouse = (warehouseId, warehouseName) => {
    showConfirm(
      'Xác nhận xóa',
      `Bạn có chắc chắn muốn xóa warehouse "${warehouseName}"?`,
      async () => {
        try {
          const res = await warehouseService.deleteWarehouse(warehouseId);
          if (res?.success) {
            await loadWarehouses();
            showSuccess('Thành công', 'Xóa warehouse thành công!');
          } else {
            showError('Lỗi', res?.error || 'Không thể xóa warehouse');
          }
        } catch (error) {
          showError('Lỗi', 'Không thể xóa warehouse');
        }
      }
    );
  };

  const renderWarehouseCard = ({ item }) => (
    <TouchableOpacity
      style={styles.warehouseCard}
      onPress={() => handleViewWarehouse(item)}
      activeOpacity={0.7}
    >
      <View style={styles.warehouseCardHeader}>
        <View style={styles.warehouseCardTitleContainer}>
          <Text style={styles.warehouseCardTitle}>{item.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: item.isActive ? COLORS.SUCCESS : COLORS.ERROR }]}>
            <Text style={styles.statusText}>{item.isActive ? 'Active' : 'Inactive'}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={(e) => {
            e.stopPropagation();
            handleDeleteWarehouse(item.id, item.name);
          }}
        >
          <Text style={styles.actionIcon}>🗑️</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.warehouseCardContent}>
        <View style={styles.warehouseInfoRow}>
          <Text style={styles.warehouseInfoIcon}>📍</Text>
          <Text style={styles.warehouseInfoText}>{item.location}</Text>
        </View>
        <View style={styles.warehouseInfoRow}>
          <Text style={styles.warehouseInfoIcon}>🏢</Text>
          <Text style={styles.warehouseInfoText}>{item.address}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Warehouse Management</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddWarehouse}>
          <Text style={styles.addIcon}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search warehouses..."
          placeholderTextColor={COLORS.TEXT.SECONDARY}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Tab Filter */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'active' && styles.activeTab]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>
            Active
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'inactive' && styles.activeTab]}
          onPress={() => setActiveTab('inactive')}
        >
          <Text style={[styles.tabText, activeTab === 'inactive' && styles.activeTabText]}>
            Inactive
          </Text>
        </TouchableOpacity>
      </View>

      {/* Warehouse List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : filteredWarehouses.length > 0 ? (
        <FlatList
          data={filteredWarehouses}
          renderItem={renderWarehouseCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🏭</Text>
          <Text style={styles.emptyText}>No warehouses found</Text>
          <Text style={styles.emptySubtext}>
            {searchQuery ? 'Try a different search term' : 'Add a new warehouse to get started'}
          </Text>
        </View>
      )}

      <CustomAlert {...alertConfig} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.PADDING.LARGE,
    paddingTop: Platform.OS === 'ios' ? SIZES.PADDING.XLARGE : SIZES.PADDING.XXXLARGE + 5,
    paddingBottom: SIZES.PADDING.MEDIUM,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: SIZES.FONT.XXLARGE,
    color: COLORS.TEXT.WHITE,
  },
  headerTitle: {
    fontSize: SIZES.FONT.XXLARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addIcon: {
    fontSize: SIZES.FONT.XXLARGE,
    color: COLORS.TEXT.WHITE,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.SURFACE,
    marginHorizontal: SIZES.PADDING.LARGE,
    marginBottom: SIZES.PADDING.MEDIUM,
    borderRadius: SIZES.RADIUS.LARGE,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
  },
  searchIcon: {
    fontSize: SIZES.FONT.MEDIUM,
    marginRight: SIZES.PADDING.SMALL,
  },
  searchInput: {
    flex: 1,
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.PADDING.LARGE,
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  tab: {
    flex: 1,
    paddingVertical: SIZES.PADDING.SMALL,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginRight: SIZES.PADDING.MEDIUM,
  },
  activeTab: {
    borderBottomColor: COLORS.PRIMARY,
  },
  tabText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
    fontWeight: '500',
  },
  activeTabText: {
    color: COLORS.PRIMARY,
    fontWeight: 'bold',
  },
  listContainer: {
    paddingHorizontal: SIZES.PADDING.LARGE,
    paddingBottom: SIZES.PADDING.XXXLARGE,
  },
  warehouseCard: {
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
  warehouseCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SIZES.PADDING.SMALL,
  },
  warehouseCardTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  warehouseCardTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginRight: SIZES.PADDING.SMALL,
  },
  statusBadge: {
    paddingHorizontal: SIZES.PADDING.SMALL,
    paddingVertical: 2,
    borderRadius: SIZES.RADIUS.SMALL,
  },
  statusText: {
    fontSize: SIZES.FONT.XSMALL,
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
  },
  warehouseCardActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: SIZES.PADDING.SMALL,
    marginLeft: SIZES.PADDING.SMALL,
  },
  actionIcon: {
    fontSize: SIZES.FONT.LARGE,
  },
  warehouseCardContent: {
    marginTop: SIZES.PADDING.SMALL,
  },
  warehouseInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.PADDING.XSMALL,
  },
  warehouseInfoIcon: {
    fontSize: SIZES.FONT.MEDIUM,
    marginRight: SIZES.PADDING.SMALL,
  },
  warehouseInfoText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: SIZES.FONT.LARGE,
    color: COLORS.TEXT.SECONDARY,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SIZES.PADDING.XXXLARGE,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  emptyText: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.SECONDARY,
    marginBottom: SIZES.PADDING.XSMALL,
  },
  emptySubtext: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
  },
});

export default WarehouseManagementScreen;

