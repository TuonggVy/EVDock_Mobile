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
  ActivityIndicator,
} from 'react-native';
import { ArrowLeft, Plus, Search, Trash2, Warehouse, CheckCircle, XCircle, AlertTriangle, Pencil } from 'lucide-react-native';
import { COLORS, SIZES } from '../../constants';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import warehouseService from '../../services/warehouseService';

const WarehouseManagementScreen = ({ navigation }) => {
  const [warehouses, setWarehouses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('Active'); // 'Active' or 'Inactive'
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
    
    const matchesTab = activeTab === 'Active' 
      ? warehouse.isActive === true
      : warehouse.isActive === false;
    
    return matchesSearch && matchesTab;
  });

  const getStatusColor = (isActive) => {
    return isActive ? COLORS.SUCCESS : COLORS.ERROR;
  };

  const getStatusText = (isActive) => {
    return isActive ? 'Active' : 'Inactive';
  };

  const getStatusIcon = (isActive) => {
    return isActive 
      ? <CheckCircle size={14} color={COLORS.TEXT.WHITE} />
      : <XCircle size={14} color={COLORS.TEXT.WHITE} />;
  };

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

  const renderWarehouseCard = (warehouse) => (
    <TouchableOpacity
      key={warehouse.id}
      style={styles.warehouseCard}
      onPress={() => handleViewWarehouse(warehouse)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.warehouseInfo}>
          <Text style={styles.warehouseName}>{warehouse.name}</Text>
          <Text style={styles.warehouseLocation}>{warehouse.location}</Text>
        </View>
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(warehouse.isActive) }]}>
            {getStatusIcon(warehouse.isActive)}
            <Text style={styles.statusText}>{getStatusText(warehouse.isActive)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.contactInfo}>
          <Text style={styles.contactLabel}>Address:</Text>
          <Text style={styles.contactValue}>{warehouse.address}</Text>
        </View>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={(e) => {
            e.stopPropagation();
            handleViewWarehouse(warehouse);
          }}
        >
          <Pencil size={16} color={COLORS.TEXT.WHITE} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={(e) => {
            e.stopPropagation();
            handleDeleteWarehouse(warehouse.id, warehouse.name);
          }}
        >
          <Trash2 size={16} color={COLORS.TEXT.WHITE} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  // Calculate statistics
  const totalWarehouses = warehouses.length;
  const activeWarehouses = warehouses.filter(warehouse => warehouse.isActive === true).length;
  const inactiveWarehouses = warehouses.filter(warehouse => warehouse.isActive === false).length;

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
        <Text style={styles.headerTitle}>Warehouse Management</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddWarehouse}
        >
          <Plus color={COLORS.TEXT.WHITE} size={18} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={18} color={COLORS.TEXT.SECONDARY} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search warehouses..."
          placeholderTextColor={COLORS.TEXT.SECONDARY}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalWarehouses}</Text>
          <Text style={styles.statLabel}>Total Warehouses</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: COLORS.SUCCESS }]}>{activeWarehouses}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: COLORS.ERROR }]}>{inactiveWarehouses}</Text>
          <Text style={styles.statLabel}>Inactive</Text>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'Active' && styles.activeTabButton
          ]}
          onPress={() => setActiveTab('Active')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'Active' && styles.activeTabText
          ]}>
            Active ({activeWarehouses})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'Inactive' && styles.activeTabButton
          ]}
          onPress={() => setActiveTab('Inactive')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'Inactive' && styles.activeTabText
          ]}>
            Inactive ({inactiveWarehouses})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Warehouses List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#009DFF" />
        </View>
      ) : (
        <ScrollView
          style={styles.warehousesList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.warehousesContent}
        >
          {filteredWarehouses.length > 0 ? (
            filteredWarehouses.map(renderWarehouseCard)
          ) : (
            <View style={styles.emptyState}>
              {activeTab === 'Active' ? (
                <Warehouse size={64} color={COLORS.TEXT.SECONDARY} />
              ) : (
                <AlertTriangle size={64} color={COLORS.TEXT.SECONDARY} />
              )}
              <Text style={styles.emptyTitle}>
                {activeTab === 'Active' 
                  ? 'No Active Warehouses' 
                  : 'No Inactive Warehouses'
                }
              </Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'Active'
                  ? 'All warehouses are inactive or no warehouses exist yet'
                  : 'All warehouses are currently active'
                }
              </Text>
            </View>
          )}
        </ScrollView>
      )}

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
    backgroundColor: "#009DFF",
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
    backgroundColor: "#009DFF",
  },
  tabText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
    fontWeight: '600',
  },
  activeTabText: {
    color: COLORS.TEXT.WHITE,
  },

  // Warehouses List
  warehousesList: {
    flex: 1,
  },
  warehousesContent: {
    padding: SIZES.PADDING.MEDIUM,
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SIZES.PADDING.SMALL,
  },
  warehouseInfo: {
    flex: 1,
  },
  warehouseName: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: "#009DFF",
    marginBottom: 4,
  },
  warehouseLocation: {
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
    gap: 4,
  },
  statusText: {
    fontSize: SIZES.FONT.XSMALL,
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
  },
  cardContent: {
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  contactInfo: {
    marginBottom: SIZES.PADDING.SMALL,
  },
  contactLabel: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: 4,
  },
  contactValue: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '600',
    marginBottom: 2,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SIZES.PADDING.SMALL,
  },
  editButton: {
    backgroundColor: "#000000",
    borderRadius: SIZES.RADIUS.SMALL,
    padding: SIZES.PADDING.SMALL,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 36,
    minHeight: 36,
  },
  deleteButton: {
    backgroundColor: "#000000",
    borderRadius: SIZES.RADIUS.SMALL,
    padding: SIZES.PADDING.SMALL,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 36,
    minHeight: 36,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginTop: SIZES.PADDING.MEDIUM,
    marginBottom: SIZES.PADDING.SMALL,
  },
  emptySubtitle: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
    textAlign: 'center',
  },
});

export default WarehouseManagementScreen;


