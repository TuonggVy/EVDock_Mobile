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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES } from '../../constants';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import { inventoryService } from '../../services/inventoryService';
import warehouseService from '../../services/warehouseService';
import motorbikeService from '../../services/motorbikeService';

const EditInventoryScreen = ({ navigation, route }) => {
  const { item } = route.params;
  const [warehouses, setWarehouses] = useState([]);
  const [motorbikes, setMotorbikes] = useState([]);
  
  const [editedItem, setEditedItem] = useState({
    motorbikeId: item.electricMotorbikeId.toString(),
    warehouseId: item.warehouseId.toString(),
    quantity: item.quantity.toString(),
  });

  const { alertConfig, hideAlert, showSuccess, showError } = useCustomAlert();

  useEffect(() => {
    loadWarehouses();
    loadMotorbikes();
  }, []);

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

  const handleSaveItem = async () => {
    if (!editedItem.motorbikeId || !editedItem.warehouseId || !editedItem.quantity) {
      showError('Lỗi', 'Vui lòng điền đầy đủ thông tin');
      return;
    }

    // Validate that quantity is a positive number
    const quantity = parseInt(editedItem.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      showError('Lỗi', 'Số lượng phải là số dương lớn hơn 0');
      return;
    }

    try {
      const response = await inventoryService.updateInventoryItem(
        item.electricMotorbikeId,
        item.warehouseId,
        { quantity: quantity }
      );

      if (response.success) {
        showSuccess('Thành công', 'Cập nhật tồn kho thành công!', () => {
          navigation.goBack();
        });
      } else {
        const errorMessage = typeof response.error === 'string' 
          ? response.error 
          : (response.error?.message || JSON.stringify(response.error) || 'Không thể cập nhật thông tin tồn kho');
        showError('Lỗi', errorMessage);
      }
    } catch (error) {
      console.error('Error saving item:', error);
      showError('Lỗi', 'Không thể cập nhật thông tin tồn kho');
    }
  };

  const selectedMotorbike = motorbikes.find(m => m.id === parseInt(editedItem.motorbikeId));
  const selectedWarehouse = warehouses.find(w => w.id === parseInt(editedItem.warehouseId));

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
        <Text style={styles.headerTitle}>Chỉnh sửa tồn kho</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Thông tin hiện tại</Text>
          <Text style={styles.infoLabel}>Xe máy:</Text>
          <Text style={styles.infoValue}>{selectedMotorbike?.name || 'Loading...'}</Text>
          
          <Text style={styles.infoLabel}>Kho:</Text>
          <Text style={styles.infoValue}>{selectedWarehouse?.name || 'Loading...'}</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Số lượng mới *</Text>
          <Text style={styles.inputSubLabel}>Cập nhật số lượng xe trong kho</Text>
          <TextInput
            style={styles.textInput}
            value={editedItem.quantity}
            onChangeText={(text) => setEditedItem({ ...editedItem, quantity: text })}
            placeholder="Nhập số lượng xe"
            placeholderTextColor={COLORS.TEXT.SECONDARY}
            keyboardType="numeric"
          />
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={handleSaveItem}
        >
          <LinearGradient
            colors={[COLORS.PRIMARY, '#FF8A65']}
            style={styles.saveButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.saveButtonText}>Cập nhật tồn kho</Text>
          </LinearGradient>
        </TouchableOpacity>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
    paddingTop: Platform.OS === 'ios' ? 0 : 20,
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
  },
  placeholder: {
    width: 40,
  },

  // Content
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SIZES.PADDING.MEDIUM,
    paddingBottom: 100,
  },
  infoSection: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
    marginBottom: SIZES.PADDING.XLARGE,
  },
  infoTitle: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  infoLabel: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    marginTop: SIZES.PADDING.SMALL,
  },
  infoValue: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: SIZES.PADDING.XLARGE,
  },
  inputLabel: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
    marginBottom: SIZES.PADDING.XSMALL,
  },
  inputSubLabel: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  textInput: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.MEDIUM,
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
    minHeight: 50,
  },

  // Footer
  footer: {
    padding: SIZES.PADDING.MEDIUM,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  saveButton: {
    borderRadius: SIZES.RADIUS.MEDIUM,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    paddingVertical: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: SIZES.FONT.LARGE,
    color: COLORS.TEXT.WHITE,
    fontWeight: 'bold',
  },
});

export default EditInventoryScreen;

