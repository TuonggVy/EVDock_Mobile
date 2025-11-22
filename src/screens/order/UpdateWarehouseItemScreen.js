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
  TextInput,
  Modal,
} from 'react-native';
import { ArrowLeft, Search } from 'lucide-react-native';
import { COLORS, SIZES } from '../../constants';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import orderRestockService from '../../services/orderRestockService';
import motorbikeService from '../../services/motorbikeService';
import warehouseService from '../../services/warehouseService';

const ACCENT_COLOR = '#009DFF';

const UpdateWarehouseItemScreen = ({ navigation, route }) => {
  const { orderItemId, orderId, onUpdate } = route.params || {};
  const [orderItem, setOrderItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Options
  const [motorbikes, setMotorbikes] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [colors, setColors] = useState([]);
  
  // Selected values
  const [selectedMotorbikeId, setSelectedMotorbikeId] = useState(null);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(null);
  const [selectedColorId, setSelectedColorId] = useState(null);
  
  // Search filters
  const [motorbikeSearch, setMotorbikeSearch] = useState('');
  const [warehouseSearch, setWarehouseSearch] = useState('');
  const [colorSearch, setColorSearch] = useState('');
  
  // Selection modals
  const [showMotorbikeModal, setShowMotorbikeModal] = useState(false);
  const [showWarehouseModal, setShowWarehouseModal] = useState(false);
  const [showColorModal, setShowColorModal] = useState(false);

  const { alertConfig, hideAlert, showSuccess, showError } = useCustomAlert();

  useEffect(() => {
    if (orderItemId) {
      loadOrderItemDetail();
    }
    loadOptions();
  }, [orderItemId]);

  useEffect(() => {
    if (selectedMotorbikeId) {
      loadColorsForMotorbike(selectedMotorbikeId);
    }
  }, [selectedMotorbikeId]);

  const loadOrderItemDetail = async () => {
    try {
      setLoading(true);
      const response = await orderRestockService.getOrderItemDetail(orderItemId);
      
      if (response.success && response.data) {
        setOrderItem(response.data);
        setSelectedMotorbikeId(response.data.electricMotorbikeId);
        setSelectedWarehouseId(response.data.warehouseId);
        setSelectedColorId(response.data.colorId);
      } else {
        showError('Error', response.error || 'Cannot load order item details');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading order item detail:', error);
      showError('Error', 'Cannot load order item details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const loadOptions = async () => {
    try {
      // Load motorbikes
      const motorbikesResponse = await motorbikeService.getAllMotorbikes({ limit: 1000 });
      if (motorbikesResponse.success) {
        setMotorbikes(motorbikesResponse.data || []);
      }

      // Load warehouses
      const warehousesResponse = await warehouseService.getWarehousesList();
      if (warehousesResponse.success) {
        setWarehouses(warehousesResponse.data || []);
      }
    } catch (error) {
      console.error('Error loading options:', error);
    }
  };

  const loadColorsForMotorbike = async (motorbikeId) => {
    try {
      const response = await motorbikeService.getMotorbikeById(motorbikeId);
      if (response.success) {
        const motorbikeData = response.data?.data || response.data;
        const colorsArray = Array.isArray(motorbikeData?.colors)
          ? motorbikeData.colors.map(item => ({
              id: item?.color?.id || item?.id,
              colorType: item?.color?.colorType || item?.colorType || `Color ${item?.color?.id || item?.id}`,
            })).filter(c => c.id && c.colorType)
          : [];
        setColors(colorsArray);
      }
    } catch (error) {
      console.error('Error loading colors:', error);
      setColors([]);
    }
  };

  const handleSave = async () => {
    if (!selectedWarehouseId) {
      showError('Error', 'Please select a warehouse');
      return;
    }

    // Use current motorbike and color IDs (not changeable)
    const motorbikeId = selectedMotorbikeId || orderItem?.electricMotorbikeId;
    const colorId = selectedColorId || orderItem?.colorId;

    if (!motorbikeId || !colorId) {
      showError('Error', 'Missing required information');
      return;
    }

    try {
      setSaving(true);
      const response = await orderRestockService.updateWarehouseItem(
        orderItemId,
        motorbikeId,
        selectedWarehouseId,
        colorId
      );

      if (response.success) {
        showSuccess('Success', 'Warehouse updated successfully!');
        if (onUpdate) {
          onUpdate();
        }
        navigation.goBack();
      } else {
        showError('Error', response.error || 'Cannot update warehouse');
      }
    } catch (error) {
      console.error('Error updating warehouse:', error);
      showError('Error', 'Cannot update warehouse');
    } finally {
      setSaving(false);
    }
  };

  const getSelectedMotorbikeName = () => {
    const motorbike = motorbikes.find(m => m.id === selectedMotorbikeId);
    return motorbike?.name || `Motorbike #${selectedMotorbikeId}`;
  };

  const getSelectedWarehouseName = () => {
    const warehouse = warehouses.find(w => w.id === selectedWarehouseId);
    return warehouse?.name || `Warehouse #${selectedWarehouseId}`;
  };

  const getSelectedColorName = () => {
    const color = colors.find(c => c.id === selectedColorId);
    return color?.colorType || `Color #${selectedColorId}`;
  };

  const filteredMotorbikes = motorbikes.filter(m =>
    m.name?.toLowerCase().includes(motorbikeSearch.toLowerCase())
  );

  const filteredWarehouses = warehouses.filter(w =>
    w.name?.toLowerCase().includes(warehouseSearch.toLowerCase())
  );

  const filteredColors = colors.filter(c =>
    c.colorType?.toLowerCase().includes(colorSearch.toLowerCase())
  );

  const renderSelectionModal = (title, visible, onClose, items, selectedId, onSelect, searchValue, onSearchChange) => (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      transparent={true}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.searchContainer}>
            <Search size={18} color={COLORS.TEXT.SECONDARY} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search..."
              placeholderTextColor={COLORS.TEXT.SECONDARY}
              value={searchValue}
              onChangeText={onSearchChange}
            />
          </View>
          <ScrollView style={styles.modalList}>
            {items.length > 0 ? (
              items.map((item) => {
                const isSelected = item.id === selectedId;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                    onPress={() => {
                      onSelect(item.id);
                      onClose();
                    }}
                  >
                    <Text style={[styles.modalItemText, isSelected && styles.modalItemTextSelected]}>
                      {item.name || item.colorType || `Item #${item.id}`}
                    </Text>
                    {isSelected && <Text style={styles.checkmark}>✓</Text>}
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.modalEmpty}>
                <Text style={styles.modalEmptyText}>No items found</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={ACCENT_COLOR} />
        </View>
      </SafeAreaView>
    );
  }

  if (!orderItem) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Order item not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color={COLORS.TEXT.WHITE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Update Warehouse Item</Text>
        <View style={styles.headerActions} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Current Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Current Vehicle:</Text>
            <Text style={styles.infoValue}>
              {orderItem.electricMotorbike?.name || `ID: ${orderItem.electricMotorbikeId}`}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Current Warehouse:</Text>
            <Text style={styles.infoValue}>
              {orderItem.warehouse?.name || `ID: ${orderItem.warehouseId}`}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Current Color:</Text>
            <Text style={styles.infoValue}>
              {orderItem.color?.colorType || `ID: ${orderItem.colorId}`}
            </Text>
          </View>
        </View>

        {/* Selection Fields */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Update Warehouse</Text>
          
          {/* Motorbike Selection - Disabled */}
          <View style={[styles.selectButton, styles.selectButtonDisabled]}>
            <View style={styles.selectButtonContent}>
              <Text style={styles.selectButtonLabel}>Vehicle</Text>
              <Text style={[styles.selectButtonValue, styles.selectButtonValueDisabled]}>
                {selectedMotorbikeId ? getSelectedMotorbikeName() : 'N/A'}
              </Text>
            </View>
            <Text style={[styles.selectArrow, styles.selectArrowDisabled]}>›</Text>
          </View>

          {/* Warehouse Selection - Enabled */}
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowWarehouseModal(true)}
          >
            <View style={styles.selectButtonContent}>
              <Text style={styles.selectButtonLabel}>Warehouse *</Text>
              <Text style={styles.selectButtonValue}>
                {selectedWarehouseId ? getSelectedWarehouseName() : 'Select Warehouse'}
              </Text>
            </View>
            <Text style={styles.selectArrow}>›</Text>
          </TouchableOpacity>

          {/* Color Selection - Disabled */}
          <View style={[styles.selectButton, styles.selectButtonDisabled]}>
            <View style={styles.selectButtonContent}>
              <Text style={styles.selectButtonLabel}>Color</Text>
              <Text style={[styles.selectButtonValue, styles.selectButtonValueDisabled]}>
                {selectedColorId ? getSelectedColorName() : 'N/A'}
              </Text>
            </View>
            <Text style={[styles.selectArrow, styles.selectArrowDisabled]}>›</Text>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, (saving || !selectedWarehouseId) && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving || !selectedWarehouseId}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving...' : 'Update Warehouse'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Selection Modals */}
      {renderSelectionModal(
        'Select Vehicle',
        showMotorbikeModal,
        () => setShowMotorbikeModal(false),
        filteredMotorbikes,
        selectedMotorbikeId,
        setSelectedMotorbikeId,
        motorbikeSearch,
        setMotorbikeSearch
      )}

      {renderSelectionModal(
        'Select Warehouse',
        showWarehouseModal,
        () => setShowWarehouseModal(false),
        filteredWarehouses,
        selectedWarehouseId,
        setSelectedWarehouseId,
        warehouseSearch,
        setWarehouseSearch
      )}

      {renderSelectionModal(
        'Select Color',
        showColorModal,
        () => setShowColorModal(false),
        filteredColors,
        selectedColorId,
        setSelectedColorId,
        colorSearch,
        setColorSearch
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.PADDING.LARGE,
    paddingTop: Platform.OS === 'ios' ? SIZES.PADDING.XLARGE : SIZES.PADDING.XXXLARGE,
    paddingBottom: SIZES.PADDING.MEDIUM,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
    flex: 1,
    textAlign: 'center',
  },
  headerActions: {
    width: 40,
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.SURFACE,
    borderTopLeftRadius: SIZES.RADIUS.XXLARGE,
    borderTopRightRadius: SIZES.RADIUS.XXLARGE,
    paddingTop: SIZES.PADDING.LARGE,
  },
  contentContainer: {
    padding: SIZES.PADDING.LARGE,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
  },
  section: {
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
  sectionTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SIZES.PADDING.SMALL,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoLabel: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
    flex: 1,
  },
  infoValue: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#D9D9D9',
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
    marginBottom: SIZES.PADDING.SMALL,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  selectButtonDisabled: {
    backgroundColor: "#D9D9D9",
    opacity: 0.6,
  },
  selectButtonContent: {
    flex: 1,
  },
  selectButtonLabel: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: 4,
  },
  selectButtonValue: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '600',
  },
  selectButtonValueDisabled: {
    color: COLORS.TEXT.SECONDARY,
  },
  selectArrow: {
    fontSize: SIZES.FONT.LARGE,
    color: COLORS.TEXT.SECONDARY,
    marginLeft: SIZES.PADDING.SMALL,
  },
  selectArrowDisabled: {
    color: COLORS.TEXT.SECONDARY + '80',
  },
  saveButton: {
    backgroundColor: ACCENT_COLOR,
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SIZES.PADDING.MEDIUM,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
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
    padding: SIZES.PADDING.LARGE,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
  },
  modalCloseText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: ACCENT_COLOR,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D9D9D9',
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    margin: SIZES.PADDING.MEDIUM,
    gap: SIZES.PADDING.SMALL,
  },
  searchInput: {
    flex: 1,
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
  },
  modalList: {
    maxHeight: 400,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.PADDING.MEDIUM,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalItemSelected: {
    backgroundColor: 'rgba(0,157,255,0.1)',
  },
  modalItemText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
    flex: 1,
  },
  modalItemTextSelected: {
    color: ACCENT_COLOR,
    fontWeight: '600',
  },
  checkmark: {
    fontSize: SIZES.FONT.LARGE,
    color: ACCENT_COLOR,
    fontWeight: 'bold',
  },
  modalEmpty: {
    padding: SIZES.PADDING.LARGE,
    alignItems: 'center',
  },
  modalEmptyText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
  },
});

export default UpdateWarehouseItemScreen;

