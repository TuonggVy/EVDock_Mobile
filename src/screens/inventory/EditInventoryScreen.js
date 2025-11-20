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
  KeyboardAvoidingView,
} from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
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
      // Load all motorbikes with a large limit to ensure all are loaded
      const response = await motorbikeService.getAllMotorbikes({ limit: 1000 });
      if (response.success) {
        setMotorbikes(response.data || []);
      } else {
        console.error('Failed to load motorbikes:', response.error);
      }
    } catch (error) {
      console.error('Error loading motorbikes:', error);
    }
  };

  const handleSaveItem = async () => {
    if (!editedItem.motorbikeId || !editedItem.warehouseId || !editedItem.quantity) {
      showError('Error', 'Please fill in all required fields');
      return;
    }

    // Validate that quantity is a positive number
    const quantity = parseInt(editedItem.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      showError('Error', 'Quantity must be a positive number greater than 0');
      return;
    }

    try {
      // Include stockDate from existing item to maintain the original stock date
      // If not available, service will use current date
      const response = await inventoryService.updateInventoryItem(
        item.electricMotorbikeId,
        item.warehouseId,
        { 
          quantity: quantity,
          stockDate: item.stockDate || new Date().toISOString()
        }
      );

      if (response.success) {
        showSuccess('Success', 'Inventory updated successfully!', () => {
          navigation.goBack();
        });
      } else {
        const errorMessage = typeof response.error === 'string' 
          ? response.error 
          : (response.error?.message || JSON.stringify(response.error) || 'Unable to update inventory information');
        showError('Error', errorMessage);
      }
    } catch (error) {
      console.error('Error saving item:', error);
      showError('Error', 'Unable to update inventory information');
    }
  };

  // Ensure proper ID comparison (handle both number and string types)
  const selectedMotorbike = motorbikes.find(m => 
    Number(m.id) === Number(editedItem.motorbikeId)
  );
  const selectedWarehouse = warehouses.find(w => 
    Number(w.id) === Number(editedItem.warehouseId)
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={COLORS.TEXT.WHITE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Inventory</Text>
        <View style={styles.headerActions} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Inventory Details</Text>

            <View style={styles.infoSection}>
              <Text style={styles.infoLabel}>Motorbike</Text>
              <Text style={styles.infoValue}>{selectedMotorbike?.name || 'Loading...'}</Text>

              <Text style={styles.infoLabel}>Warehouse</Text>
              <Text style={styles.infoValue}>{selectedWarehouse?.name || 'Loading...'}</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                New Quantity <Text style={styles.required}>*</Text>
              </Text>
              <Text style={styles.inputSubLabel}>Update the number of vehicles in stock</Text>
              <TextInput
                style={styles.textInput}
                value={editedItem.quantity}
                onChangeText={(text) => setEditedItem({ ...editedItem, quantity: text })}
                placeholder="Enter quantity"
                placeholderTextColor={COLORS.TEXT.SECONDARY}
                keyboardType="numeric"
              />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveItem}>
              <Text style={styles.saveButtonText}>Update Inventory</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

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
    width: 40,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.SURFACE,
    borderTopLeftRadius: SIZES.RADIUS.XXLARGE,
    borderTopRightRadius: SIZES.RADIUS.XXLARGE,
  },
  contentContainer: {
    padding: SIZES.PADDING.LARGE,
  },
  formSection: {
    paddingBottom: SIZES.PADDING.XXLARGE,
  },
  sectionTitle: {
    fontSize: SIZES.FONT.XLARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SIZES.PADDING.LARGE,
  },
  infoSection: {
    backgroundColor: '#F5F5F5',
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
    marginBottom: SIZES.PADDING.LARGE,
    borderWidth: 1,
    borderColor: COLORS.BORDER.PRIMARY,
  },
  infoLabel: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: SIZES.PADDING.XSMALL,
  },
  infoValue: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SIZES.PADDING.SMALL,
  },
  inputGroup: {
    marginBottom: SIZES.PADDING.XLARGE,
  },
  inputLabel: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SIZES.PADDING.XSMALL,
  },
  required: {
    color: COLORS.ERROR,
  },
  inputSubLabel: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: SIZES.PADDING.SMALL,
  },
  textInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.MEDIUM,
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
    borderWidth: 1,
    borderColor: COLORS.BORDER.PRIMARY,
  },
  saveButton: {
    backgroundColor: '#009DFF',
    borderRadius: SIZES.RADIUS.LARGE,
    paddingVertical: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
    marginTop: SIZES.PADDING.XLARGE,
  },
  saveButtonText: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
});

export default EditInventoryScreen;

