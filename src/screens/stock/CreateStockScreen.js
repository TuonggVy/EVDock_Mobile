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
  Image,
} from 'react-native';
import { COLORS, SIZES } from '../../constants';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import { useAuth } from '../../contexts/AuthContext';
import agencyStockService from '../../services/agencyStockService';
import motorbikeService from '../../services/motorbikeService';
import LoadingScreen from '../../components/common/LoadingScreen';
import { ArrowLeft, Check } from 'lucide-react-native';

const CreateStockScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [motorbikes, setMotorbikes] = useState([]);
  const [selectedMotorbike, setSelectedMotorbike] = useState(null);
  const [motorbikeColors, setMotorbikeColors] = useState([]);
  const [formData, setFormData] = useState({
    motorbikeId: '',
    colorId: '',
    quantity: '',
    price: '',
  });
  const [errors, setErrors] = useState({});
  const { alertConfig, hideAlert, showSuccess, showError } = useCustomAlert();

  useEffect(() => {
    loadMotorbikes();
  }, []);

  // Load colors when motorbike is selected
  useEffect(() => {
    const loadColors = async () => {
      if (!formData.motorbikeId) {
        setMotorbikeColors([]);
        setSelectedMotorbike(null);
        return;
      }

      try {
        const motorbikeId = parseInt(formData.motorbikeId);
        const response = await motorbikeService.getMotorbikeById(motorbikeId);
        
        if (response.success) {
          const motorbikeData = response.data?.data || response.data;
          const motorbike = motorbikes.find(m => m.id === motorbikeId);
          setSelectedMotorbike(motorbike);

          // Extract colors from motorbike data
          const colors = Array.isArray(motorbikeData?.colors) 
            ? motorbikeData.colors.map(item => ({
                id: item?.color?.id || item?.id,
                colorType: item?.color?.colorType || item?.colorType,
                imageUrl: item?.imageUrl,
              })).filter(c => c.id && c.colorType)
            : [];

          setMotorbikeColors(colors);
          
          // Auto-select first color if available
          if (colors.length > 0 && !formData.colorId) {
            setFormData(prev => ({ ...prev, colorId: colors[0].id.toString() }));
          }
        }
      } catch (error) {
        console.error('Error loading colors:', error);
        setMotorbikeColors([]);
      }
    };

    loadColors();
  }, [formData.motorbikeId, motorbikes]);

  const loadMotorbikes = async () => {
    try {
      const response = await motorbikeService.getAllMotorbikes({ limit: 1000 });
      if (response.success) {
        setMotorbikes(response.data || []);
      }
    } catch (error) {
      console.error('Error loading motorbikes:', error);
      showError('Error', 'Failed to load motorbikes list');
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

    if (!formData.motorbikeId) {
      newErrors.motorbikeId = 'Please select a motorbike';
    }

    if (!formData.colorId) {
      newErrors.colorId = 'Please select a color';
    }

    if (!formData.quantity) {
      newErrors.quantity = 'Please enter quantity';
    } else {
      const quantity = parseInt(formData.quantity);
      if (isNaN(quantity) || quantity <= 0) {
        newErrors.quantity = 'Quantity must be a positive number greater than 0';
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

    if (!user?.agencyId) {
      showError('Error', 'Agency information not found');
      return;
    }

    try {
      setLoading(true);
      const stockData = {
        agencyId: parseInt(user.agencyId),
        motorbikeId: parseInt(formData.motorbikeId),
        colorId: parseInt(formData.colorId),
        quantity: parseInt(formData.quantity),
        price: parseFloat(formData.price),
      };

      const response = await agencyStockService.createAgencyStock(stockData);

      if (response.success) {
        showSuccess('Success', 'Stock created successfully!', () => {
          navigation.goBack();
        });
      } else {
        showError('Error', response.error || 'Failed to create stock');
      }
    } catch (error) {
      console.error('Error creating stock:', error);
      showError('Error', 'Failed to create stock');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

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
        <Text style={styles.headerTitle}>Add Stock</Text>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
        >
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Motorbike Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Motorbike *</Text>
          {errors.motorbikeId && (
            <Text style={styles.errorText}>{errors.motorbikeId}</Text>
          )}
          <View style={styles.selectContainer}>
            {motorbikes.map((motorbike) => (
              <TouchableOpacity
                key={motorbike.id}
                style={[
                  styles.selectOption,
                  formData.motorbikeId === motorbike.id.toString() && styles.selectedOption
                ]}
                onPress={() => handleInputChange('motorbikeId', motorbike.id.toString())}
              >
                <Text style={[
                  styles.selectOptionText,
                  formData.motorbikeId === motorbike.id.toString() && styles.selectedOptionText
                ]}>
                  {motorbike.name}
                </Text>
                {formData.motorbikeId === motorbike.id.toString() && (
                  <Text style={styles.checkIcon}><Check size={18} color="#FFFFFF" /></Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Color Selection */}
        {formData.motorbikeId && (
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Color *</Text>
            {errors.colorId && (
              <Text style={styles.errorText}>{errors.colorId}</Text>
            )}
            {motorbikeColors.length > 0 ? (
              <View style={styles.colorContainer}>
                {motorbikeColors.map((color) => (
                  <TouchableOpacity
                    key={color.id}
                    style={[
                      styles.colorOption,
                      formData.colorId === color.id.toString() && styles.selectedColorOption
                    ]}
                    onPress={() => handleInputChange('colorId', color.id.toString())}
                  >
                    {color.imageUrl && (
                      <Image
                        source={{ uri: color.imageUrl }}
                        style={styles.colorImage}
                        resizeMode="cover"
                      />
                    )}
                    <Text style={[
                      styles.colorText,
                      formData.colorId === color.id.toString() && styles.selectedColorText
                    ]}>
                      {color.colorType}
                    </Text>
                    {formData.colorId === color.id.toString() && (
                      <View style={styles.colorCheck}>
                        <Text style={styles.colorCheckText}><Check size={18} color="#FFFFFF" /></Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={styles.loadingText}>Loading colors...</Text>
            )}
          </View>
        )}

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
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  checkIcon: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.PRIMARY,
    marginLeft: SIZES.PADDING.SMALL,
  },
  colorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.PADDING.MEDIUM,
  },
  colorOption: {
    width: 120,
    borderRadius: SIZES.RADIUS.MEDIUM,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  selectedColorOption: {
    borderColor: COLORS.PRIMARY,
  },
  colorImage: {
    width: '100%',
    height: 80,
    backgroundColor: '#F5F5F5',
  },
  colorText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.PRIMARY,
    textAlign: 'center',
    padding: SIZES.PADDING.SMALL,
    backgroundColor: COLORS.SURFACE,
  },
  selectedColorText: {
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  colorCheck: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorCheckText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.WHITE,
    fontWeight: 'bold',
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
  loadingText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    fontStyle: 'italic',
  },
});

export default CreateStockScreen;

