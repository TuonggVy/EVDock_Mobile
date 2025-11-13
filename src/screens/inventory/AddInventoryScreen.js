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
import { ArrowLeft, Check } from 'lucide-react-native';
import { COLORS, SIZES } from '../../constants';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import { inventoryService } from '../../services/inventoryService';
import warehouseService from '../../services/warehouseService';
import motorbikeService from '../../services/motorbikeService';

const AddInventoryScreen = ({ navigation }) => {
  const [warehouses, setWarehouses] = useState([]);
  const [motorbikes, setMotorbikes] = useState([]);
  
  const [newItem, setNewItem] = useState({
    motorbikeId: '',
    warehouseId: '',
    quantity: '',
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
      const response = await motorbikeService.getAllMotorbikes({ limit: 1000 });
      if (response.success) {
        setMotorbikes(response.data || []);
      }
    } catch (error) {
      console.error('Error loading motorbikes:', error);
    }
  };

  const handleSaveItem = async () => {
    if (!newItem.motorbikeId || !newItem.warehouseId || !newItem.quantity) {
      showError('Error', 'Please fill in all required fields');
      return;
    }

    // Validate that quantity is a positive number
    const quantity = parseInt(newItem.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      showError('Error', 'Quantity must be a positive number greater than 0');
      return;
    }

    // Validate motorbikeId and warehouseId are valid numbers
    const motorbikeId = parseInt(newItem.motorbikeId);
    const warehouseId = parseInt(newItem.warehouseId);
    if (isNaN(motorbikeId) || isNaN(warehouseId)) {
      showError('Error', 'Please select both a motorbike and a warehouse');
      return;
    }

    try {
      const response = await inventoryService.createInventoryItem(
        motorbikeId,
        warehouseId,
        quantity
      );

      if (response.success) {
        showSuccess('Success', 'Inventory item added successfully!', () => {
          navigation.goBack();
        });
      } else {
        const errorMessage = typeof response.error === 'string' 
          ? response.error 
          : (response.error?.message || JSON.stringify(response.error) || 'Unable to save inventory information');
        showError('Error', errorMessage);
      }
    } catch (error) {
      console.error('Error saving item:', error);
      showError('Error', 'Unable to save inventory information');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={COLORS.TEXT.WHITE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Inventory</Text>
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

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Motorbike <Text style={styles.required}>*</Text>
              </Text>
              <Text style={styles.inputSubLabel}>Select a motorbike to add to inventory</Text>
              <View style={styles.selectContainer}>
                {motorbikes.map((motorbike) => {
                  const isSelected = newItem.motorbikeId === motorbike.id.toString();
                  return (
                    <TouchableOpacity
                      key={motorbike.id}
                      style={[
                        styles.selectOption,
                        isSelected && styles.selectedOption
                      ]}
                      onPress={() => setNewItem({ ...newItem, motorbikeId: motorbike.id.toString() })}
                    >
                      <Text
                        style={[
                          styles.selectOptionText,
                          isSelected && styles.selectedOptionText
                        ]}
                      >
                        {motorbike.name}
                      </Text>
                      {isSelected && <Check size={18} color="#009DFF" />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Warehouse <Text style={styles.required}>*</Text>
              </Text>
              <Text style={styles.inputSubLabel}>Choose a warehouse for storage</Text>
              <View style={styles.selectContainer}>
                {warehouses.map((warehouse) => {
                  const isSelected = newItem.warehouseId === warehouse.id.toString();
                  return (
                    <TouchableOpacity
                      key={warehouse.id}
                      style={[
                        styles.selectOption,
                        isSelected && styles.selectedOption
                      ]}
                      onPress={() => setNewItem({ ...newItem, warehouseId: warehouse.id.toString() })}
                    >
                      <View style={styles.selectInfo}>
                        <Text
                          style={[
                            styles.selectOptionText,
                            isSelected && styles.selectedOptionText
                          ]}
                        >
                          {warehouse.name}
                        </Text>
                        <Text style={styles.warehouseLocation}>{warehouse.location}</Text>
                      </View>
                      {isSelected && <Check size={18} color="#009DFF" />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Quantity <Text style={styles.required}>*</Text>
              </Text>
              <Text style={styles.inputSubLabel}>Enter the number of vehicles in stock</Text>
              <TextInput
                style={styles.textInput}
                value={newItem.quantity}
                onChangeText={(text) => setNewItem({ ...newItem, quantity: text })}
                placeholder="Enter quantity"
                placeholderTextColor={COLORS.TEXT.SECONDARY}
                keyboardType="numeric"
              />
            </View>
          </View>
        </ScrollView>
        
        {/* Fixed Button at Bottom */}
        <View style={styles.fixedButtonContainer}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSaveItem}>
            <Text style={styles.saveButtonText}>Add Inventory</Text>
          </TouchableOpacity>
        </View>
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
    paddingBottom: 100, // Extra padding for fixed button
  },
  formSection: {
    paddingBottom: SIZES.PADDING.MEDIUM,
  },
  sectionTitle: {
    fontSize: SIZES.FONT.XLARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SIZES.PADDING.LARGE,
  },
  inputGroup: {
    marginBottom: SIZES.PADDING.LARGE,
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
  selectContainer: {
    gap: SIZES.PADDING.SMALL,
  },
  selectOption: {
    backgroundColor: '#F5F5F5',
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.MEDIUM,
    borderWidth: 1,
    borderColor: COLORS.BORDER.PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SIZES.PADDING.SMALL,
  },
  selectedOption: {
    borderColor: '#009DFF',
    backgroundColor: 'rgba(0, 157, 255, 0.08)',
  },
  selectInfo: {
    flex: 1,
  },
  selectOptionText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '600',
  },
  selectedOptionText: {
    color: '#009DFF',
  },
  warehouseLocation: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    marginTop: 2,
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
  fixedButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.SURFACE,
    paddingHorizontal: SIZES.PADDING.LARGE,
    paddingTop: SIZES.PADDING.MEDIUM,
    paddingBottom: Platform.OS === 'ios' ? SIZES.PADDING.MEDIUM : SIZES.PADDING.LARGE,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER.PRIMARY,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  saveButton: {
    backgroundColor: '#009DFF',
    borderRadius: SIZES.RADIUS.LARGE,
    paddingVertical: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
});

export default AddInventoryScreen;

