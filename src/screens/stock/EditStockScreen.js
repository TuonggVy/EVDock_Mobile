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
import { COLORS, SIZES } from '../../constants';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import agencyStockService from '../../services/agencyStockService';
import LoadingScreen from '../../components/common/LoadingScreen';
import { ArrowLeft } from 'lucide-react-native';

const EditStockScreen = ({ navigation, route }) => {
  const { stockId, stock } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stockDetail, setStockDetail] = useState(null);
  const [formData, setFormData] = useState({
    quantity: '',
    price: '',
  });
  const [errors, setErrors] = useState({});
  const { alertConfig, hideAlert, showSuccess, showError } = useCustomAlert();

  useEffect(() => {
    loadStockDetail();
  }, [stockId]);

  const loadStockDetail = async () => {
    try {
      setLoading(true);
      const response = await agencyStockService.getAgencyStockDetail(stockId);
      
      if (response.success) {
        const detail = response.data;
        setStockDetail(detail);
        setFormData({
          quantity: detail.quantity.toString(),
          price: detail.price.toString(),
        });
      } else {
        showError('Error', response.error || 'Failed to load stock information');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading stock detail:', error);
      showError('Error', 'Failed to load stock information');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.quantity) {
      newErrors.quantity = 'Please enter quantity';
    } else {
      const quantity = parseInt(formData.quantity);
      if (isNaN(quantity) || quantity < 0) {
        newErrors.quantity = 'Quantity must be a non-negative number';
      }
    }

    if (!formData.price) {
      newErrors.price = 'Please enter selling price';
    } else {
      const price = parseFloat(formData.price);
      if (isNaN(price) || price <= 0) {
        newErrors.price = 'Selling price must be a positive number greater than 0';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      const updateData = {
        quantity: parseInt(formData.quantity),
        price: parseFloat(formData.price),
      };

      const response = await agencyStockService.updateAgencyStock(stockId, updateData);

      if (response.success) {
        showSuccess('Success', 'Stock updated successfully!', () => {
          navigation.goBack();
        });
      } else {
        showError('Error', response.error || 'Failed to update stock');
      }
    } catch (error) {
      console.error('Error updating stock:', error);
      showError('Error', 'Failed to update stock');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (!stockDetail) {
    return null;
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}><ArrowLeft color="#FFFFFF" size={18} /></Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Stock</Text>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Stock Info (Read-only) */}
        <View style={styles.infoGroup}>
          <Text style={styles.infoLabel}>Stock Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Motorbike:</Text>
              <Text style={styles.infoValue}>{stockDetail.motorbike?.name || 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Model:</Text>
              <Text style={styles.infoValue}>{stockDetail.motorbike?.model || 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Color:</Text>
              <Text style={styles.infoValue}>{stockDetail.color?.colorType || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Quantity */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Quantity *</Text>
          {errors.quantity && (
            <Text style={styles.errorText}>{errors.quantity}</Text>
          )}
          <TextInput
            style={[styles.textInput, errors.quantity && styles.inputError]}
            placeholder="Enter quantity"
            placeholderTextColor={COLORS.TEXT.SECONDARY}
            value={formData.quantity}
            onChangeText={(value) => handleInputChange('quantity', value)}
            keyboardType="numeric"
          />
        </View>

        {/* Price */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Selling Price (VND) *</Text>
          {errors.price && (
            <Text style={styles.errorText}>{errors.price}</Text>
          )}
          <TextInput
            style={[styles.textInput, errors.price && styles.inputError]}
            placeholder="Enter selling price"
            placeholderTextColor={COLORS.TEXT.SECONDARY}
            value={formData.price}
            onChangeText={(value) => handleInputChange('price', value)}
            keyboardType="numeric"
          />
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
    paddingTop: Platform.OS === 'ios' ? 0 : 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingTop: Platform.OS === 'ios' ? 20 : 10,
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
  saveButton: {
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
  },
  saveButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SIZES.PADDING.MEDIUM,
  },
  infoGroup: {
    marginBottom: SIZES.PADDING.LARGE,
  },
  infoLabel: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: '600',
    color: COLORS.TEXT.WHITE,
    marginBottom: SIZES.PADDING.SMALL,
  },
  infoCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.PADDING.SMALL,
  },
  infoKey: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
  },
  infoValue: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
  },
  inputGroup: {
    marginBottom: SIZES.PADDING.LARGE,
  },
  inputLabel: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: '600',
    color: COLORS.TEXT.WHITE,
    marginBottom: SIZES.PADDING.SMALL,
  },
  errorText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.ERROR,
    marginBottom: SIZES.PADDING.SMALL,
  },
  textInput: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
  },
  inputError: {
    borderWidth: 1,
    borderColor: COLORS.ERROR,
  },
});

export default EditStockScreen;

