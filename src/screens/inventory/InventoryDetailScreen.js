import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { ArrowLeft, Package, Pencil, Trash2 } from 'lucide-react-native';
import { COLORS, SIZES } from '../../constants';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import { inventoryService } from '../../services/inventoryService';

const InventoryDetailScreen = ({ navigation, route }) => {
  const { item } = route.params;
  const [inventoryData, setInventoryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [colorId, setColorId] = useState(item?.colorId);
  const { alertConfig, hideAlert, showSuccess, showError, showConfirm } = useCustomAlert();

  useEffect(() => {
    loadInventoryDetail();
  }, []);

  // Reload inventory detail when screen comes into focus (e.g., after editing)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadInventoryDetail();
    });

    return unsubscribe;
  }, [navigation]);

  const loadInventoryDetail = async () => {
    if (!item?.electricMotorbikeId || !item?.warehouseId || !item?.colorId) {
      showError('Error', 'Missing required inventory information');
      return;
    }
    
    setLoading(true);
    try {
      const res = await inventoryService.getInventoryDetail(
        item.electricMotorbikeId,
        item.warehouseId,
        item.colorId
      );
      if (res?.success) {
        setInventoryData(res.data);
      } else {
        showError('Error', res?.error || 'Unable to load inventory detail');
      }
    } catch (error) {
      console.error('Error loading inventory detail:', error);
      showError('Error', 'Unable to load inventory detail');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (inventoryData && colorId) {
      navigation.navigate('EditInventory', { 
        item: {
          electricMotorbikeId: inventoryData.motorbike.id,
          warehouseId: inventoryData.warehouse.id,
          colorId: colorId,
          quantity: inventoryData.quantity,
          stockDate: inventoryData.stockDate,
          lastUpdate: inventoryData.lastUpdate,
        }
      });
    }
  };

  const handleDelete = () => {
    if (!inventoryData || !colorId) return;
    
    showConfirm(
      'Confirm Delete',
      'Are you sure you want to delete this inventory item?',
      async () => {
        try {
          const res = await inventoryService.deleteInventoryItem(
            inventoryData.motorbike.id,
            inventoryData.warehouse.id,
            colorId
          );
          if (res?.success) {
            showSuccess('Success', 'Inventory item deleted successfully!');
            setTimeout(() => {
              navigation.goBack();
            }, 1500);
          } else {
            showError('Error', res?.error || 'Unable to delete inventory item');
          }
        } catch (error) {
          console.error('Error deleting inventory:', error);
          showError('Error', 'Unable to delete inventory item');
        }
      }
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      return 'N/A';
    }
  };

  const formatPrice = (price) => {
    if (!price) return 'N/A';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const getStatusMeta = (quantity) => {
    if (quantity === 0) {
      return {
        color: COLORS.ERROR,
        label: 'Out of Stock',
      };
    }
    if (quantity <= 10) {
      return {
        color: COLORS.WARNING,
        label: 'Low Stock',
      };
    }
    return {
      color: COLORS.SUCCESS,
      label: 'In Stock',
    };
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#009DFF" />
        </View>
      </SafeAreaView>
    );
  }

  if (!inventoryData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <ArrowLeft size={24} color={COLORS.TEXT.WHITE} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Inventory Detail</Text>
          <View style={styles.headerActions} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>No inventory data available</Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusMeta = getStatusMeta(inventoryData.quantity);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={COLORS.TEXT.WHITE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Inventory Detail</Text>
        <View style={styles.headerActions}>
          {/* Empty space to balance layout */}
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Package Icon */}
        <View style={styles.iconContainer}>
          <Package size={80} color="#009DFF" />
        </View>

        {/* Inventory Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Inventory Information</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Quantity</Text>
              <View style={styles.quantityContainer}>
                <Text style={[styles.infoValue, { color: statusMeta.color }]}>
                  {inventoryData.quantity} units
                </Text>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: statusMeta.color }
                ]}>
                  <Text style={styles.statusText}>
                    {statusMeta.label}
                  </Text>
                </View>
              </View>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Color</Text>
              <Text style={styles.infoValue}>{inventoryData.color || 'N/A'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Stock Date</Text>
              <Text style={styles.infoValue}>{formatDate(inventoryData.stockDate)}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Last Updated</Text>
              <Text style={styles.infoValue}>{formatDate(inventoryData.lastUpdate)}</Text>
            </View>
          </View>
        </View>

        {/* Motorbike Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Motorbike Information</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name</Text>
              <Text style={styles.infoValue}>{inventoryData.motorbike?.name || 'N/A'}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Model</Text>
              <Text style={styles.infoValue}>{inventoryData.motorbike?.model || 'N/A'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Price</Text>
              <Text style={styles.infoValue}>{formatPrice(inventoryData.motorbike?.price)}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Version</Text>
              <Text style={styles.infoValue}>{inventoryData.motorbike?.version || 'N/A'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Made From</Text>
              <Text style={styles.infoValue}>{inventoryData.motorbike?.makeFrom || 'N/A'}</Text>
            </View>

            {inventoryData.motorbike?.description && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Description</Text>
                <Text style={[styles.infoValue, styles.descriptionText]}>
                  {inventoryData.motorbike.description}
                </Text>
              </View>
            )}

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Motorbike ID</Text>
              <Text style={styles.infoValue}>#{inventoryData.motorbike?.id || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Warehouse Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Warehouse Information</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Warehouse Name</Text>
              <Text style={styles.infoValue}>{inventoryData.warehouse?.name || 'N/A'}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Location</Text>
              <Text style={styles.infoValue}>{inventoryData.warehouse?.location || 'N/A'}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Address</Text>
              <Text style={styles.infoValue}>{inventoryData.warehouse?.address || 'N/A'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Status</Text>
              <View style={[
                styles.statusBadge,
                { backgroundColor: inventoryData.warehouse?.isActive ? COLORS.SUCCESS : COLORS.ERROR }
              ]}>
                <Text style={styles.statusText}>
                  {inventoryData.warehouse?.isActive ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Warehouse ID</Text>
              <Text style={styles.infoValue}>#{inventoryData.warehouse?.id || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={handleEdit}
          >
            <Pencil size={20} color={COLORS.TEXT.WHITE} />
            <Text style={styles.editButtonText}>Edit Inventory</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleDelete}
          >
            <Trash2 size={20} color={COLORS.TEXT.WHITE} />
            <Text style={styles.deleteButtonText}>Delete Inventory</Text>
          </TouchableOpacity>
        </View>
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
  headerTitle: {
    fontSize: SIZES.FONT.XXLARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
    flex: 1,
    textAlign: 'center',
  },
  headerActions: {
    width: 60,
    alignItems: 'flex-end',
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
  errorText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
  },
  iconContainer: {
    alignItems: 'center',
    paddingVertical: SIZES.PADDING.XXXLARGE,
    backgroundColor: COLORS.SURFACE,
  },
  section: {
    paddingHorizontal: SIZES.PADDING.LARGE,
    marginBottom: SIZES.PADDING.LARGE,
  },
  sectionTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  infoCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.LARGE,
    padding: SIZES.PADDING.MEDIUM,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: SIZES.PADDING.MEDIUM,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER.PRIMARY,
  },
  infoLabel: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
    fontWeight: '500',
    flex: 1,
  },
  infoValue: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  descriptionText: {
    textAlign: 'right',
    flexWrap: 'wrap',
  },
  quantityContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: SIZES.PADDING.SMALL,
  },
  statusBadge: {
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.XSMALL,
    borderRadius: SIZES.RADIUS.SMALL,
  },
  statusText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
  },
  actionsSection: {
    paddingHorizontal: SIZES.PADDING.LARGE,
    paddingBottom: SIZES.PADDING.XXXLARGE,
  },
  actionButton: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.LARGE,
    paddingVertical: SIZES.PADDING.MEDIUM,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SIZES.PADDING.SMALL,
    marginBottom: SIZES.PADDING.MEDIUM,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  editButton: {
    backgroundColor: "#009DFF",
  },
  editButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
  deleteButton: {
    backgroundColor: "#000000",
  },
  deleteButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
});

export default InventoryDetailScreen;

