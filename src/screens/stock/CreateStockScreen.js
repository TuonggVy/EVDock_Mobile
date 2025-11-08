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
  KeyboardAvoidingView,
} from 'react-native';
import { COLORS, SIZES } from '../../constants';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import { useAuth } from '../../contexts/AuthContext';
import agencyStockService from '../../services/agencyStockService';
import motorbikeService from '../../services/motorbikeService';
import orderRestockManagerService from '../../services/orderRestockManagerService';
import LoadingScreen from '../../components/common/LoadingScreen';
import { ArrowLeft, Check } from 'lucide-react-native';

const PRIMARY_ACCENT = '#009DFF';

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
      if (!user?.agencyId) {
        showError('Error', 'Agency information not found');
        return;
      }

      // Get order restock list from API
      const orderRestockResponse = await orderRestockManagerService.getOrderRestockListByAgency(
        parseInt(user.agencyId),
        { limit: 1000 }
      );

      if (!orderRestockResponse.success) {
        showError('Error', orderRestockResponse.error || 'Failed to load order restock list');
        return;
      }

      // Extract unique electricMotorbikeIds from orderItems
      const ordersList = orderRestockResponse.data || [];
      const uniqueMotorbikeIds = new Set();
      
      ordersList.forEach((order) => {
        if (order.orderItems && Array.isArray(order.orderItems)) {
          order.orderItems.forEach((item) => {
            if (item.electricMotorbikeId) {
              uniqueMotorbikeIds.add(item.electricMotorbikeId);
            }
          });
        }
      });

      // Fetch motorbike details for each unique ID
      const motorbikePromises = Array.from(uniqueMotorbikeIds).map(async (motorbikeId) => {
        try {
          const response = await motorbikeService.getMotorbikeById(motorbikeId);
          if (response.success) {
            const motorbikeData = response.data?.data || response.data;
            return {
              id: motorbikeId,
              name: motorbikeData?.name || `Motorbike ${motorbikeId}`,
              model: motorbikeData?.model,
              version: motorbikeData?.version,
              makeFrom: motorbikeData?.makeFrom,
              ...motorbikeData,
            };
          }
          return null;
        } catch (error) {
          console.error(`Error loading motorbike ${motorbikeId}:`, error);
          return null;
        }
      });

      const motorbikesList = await Promise.all(motorbikePromises);
      const validMotorbikes = motorbikesList.filter(m => m !== null);
      
      setMotorbikes(validMotorbikes);
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
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={20} color={COLORS.TEXT.WHITE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Stock</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Stock Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Motorbike <Text style={styles.required}>*</Text>
              </Text>
              {errors.motorbikeId && <Text style={styles.errorText}>{errors.motorbikeId}</Text>}
              <View style={styles.selectContainer}>
                {motorbikes.map((motorbike) => {
                  const isSelected = formData.motorbikeId === motorbike.id.toString();
                  return (
                    <TouchableOpacity
                      key={motorbike.id}
                      style={[styles.selectOption, isSelected && styles.selectedOption]}
                      onPress={() => handleInputChange('motorbikeId', motorbike.id.toString())}
                    >
                      <Text
                        style={[
                          styles.selectOptionText,
                          isSelected && styles.selectedOptionText,
                        ]}
                      >
                        {motorbike.name}
                      </Text>
                      {isSelected && (
                        <View style={styles.optionCheck}>
                          <Check size={16} color="#fff" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {formData.motorbikeId && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Color <Text style={styles.required}>*</Text>
                </Text>
                {errors.colorId && <Text style={styles.errorText}>{errors.colorId}</Text>}
                {motorbikeColors.length > 0 ? (
                  <View style={styles.colorContainer}>
                    {motorbikeColors.map((color) => {
                      const isSelected = formData.colorId === color.id.toString();
                      return (
                        <TouchableOpacity
                          key={color.id}
                          style={[
                            styles.colorOption,
                            isSelected && styles.selectedColorOption,
                          ]}
                          onPress={() => handleInputChange('colorId', color.id.toString())}
                        >
                          {color.imageUrl ? (
                            <Image
                              source={{ uri: color.imageUrl }}
                              style={styles.colorImage}
                              resizeMode="cover"
                            />
                          ) : (
                            <View style={styles.colorFallback}>
                              <Text style={styles.colorFallbackText}>{color.colorType}</Text>
                            </View>
                          )}
                          <Text
                            style={[
                              styles.colorText,
                              isSelected && styles.selectedColorText,
                            ]}
                          >
                            {color.colorType}
                          </Text>
                          {isSelected && (
                            <View style={styles.colorCheck}>
                              <Check size={16} color="#FFFFFF" />
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : (
                  <Text style={styles.loadingText}>Loading colors...</Text>
                )}
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Quantity <Text style={styles.required}>*</Text>
              </Text>
              {errors.quantity && <Text style={styles.errorText}>{errors.quantity}</Text>}
              <TextInput
                style={[styles.input, errors.quantity && styles.inputError]}
                placeholder="Enter quantity"
                placeholderTextColor={COLORS.TEXT.SECONDARY}
                value={formData.quantity}
                onChangeText={(value) => handleInputChange('quantity', value)}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Selling Price (VND) <Text style={styles.required}>*</Text>
              </Text>
              {errors.price && <Text style={styles.errorText}>{errors.price}</Text>}
              <TextInput
                style={[styles.input, errors.price && styles.inputError]}
                placeholder="Enter selling price"
                placeholderTextColor={COLORS.TEXT.SECONDARY}
                value={formData.price}
                onChangeText={(value) => handleInputChange('price', value)}
                keyboardType="numeric"
              />
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={handleSave}>
              <Text style={styles.submitButtonText}>Create Stock</Text>
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
    paddingTop: Platform.OS === 'ios' ? SIZES.PADDING.XLARGE : SIZES.PADDING.XXXLARGE,
    paddingBottom: SIZES.PADDING.MEDIUM,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: SIZES.FONT.XXLARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
  headerPlaceholder: {
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
  scrollContent: {
    paddingBottom: SIZES.PADDING.XXXLARGE,
  },
  formSection: {
    padding: SIZES.PADDING.LARGE,
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
  label: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SIZES.PADDING.SMALL,
  },
  required: {
    color: COLORS.ERROR,
  },
  errorText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.ERROR,
    marginBottom: SIZES.PADDING.SMALL,
  },
  selectContainer: {
    gap: SIZES.PADDING.SMALL,
  },
  selectOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.MEDIUM,
    borderWidth: 1,
    borderColor: COLORS.BORDER.PRIMARY,
    marginBottom: SIZES.PADDING.SMALL,
  },
  selectedOption: {
    borderColor: PRIMARY_ACCENT,
    backgroundColor: 'rgba(0, 157, 255, 0.12)',
  },
  selectOptionText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
    flex: 1,
    marginRight: SIZES.PADDING.SMALL,
  },
  selectedOptionText: {
    color: PRIMARY_ACCENT,
    fontWeight: '600',
  },
  optionCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: PRIMARY_ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.PADDING.MEDIUM,
  },
  colorOption: {
    width: 130,
    borderRadius: SIZES.RADIUS.MEDIUM,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
    backgroundColor: '#F8F9FA',
  },
  selectedColorOption: {
    borderColor: PRIMARY_ACCENT,
  },
  colorImage: {
    width: '100%',
    height: 90,
    backgroundColor: '#E9ECEF',
  },
  colorFallback: {
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E9ECEF',
    paddingHorizontal: SIZES.PADDING.SMALL,
  },
  colorFallbackText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    textAlign: 'center',
  },
  colorText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.PRIMARY,
    textAlign: 'center',
    paddingVertical: SIZES.PADDING.SMALL,
    fontWeight: '600',
  },
  selectedColorText: {
    color: PRIMARY_ACCENT,
  },
  colorCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: PRIMARY_ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.MEDIUM,
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
    borderWidth: 1,
    borderColor: COLORS.BORDER.PRIMARY,
  },
  inputError: {
    borderColor: COLORS.ERROR,
  },
  loadingText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    fontStyle: 'italic',
  },
  submitButton: {
    backgroundColor: PRIMARY_ACCENT,
    borderRadius: SIZES.RADIUS.LARGE,
    paddingVertical: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
    marginTop: SIZES.PADDING.XLARGE,
  },
  submitButtonText: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
});

export default CreateStockScreen;

