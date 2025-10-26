import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES } from '../../constants';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import motorbikeService from '../../services/motorbikeService';
import { checkAuthStatus } from '../../utils/authUtils';

const AddProductScreen = ({ navigation }) => {
  const { alertConfig, hideAlert, showConfirm, showInfo } = useCustomAlert();
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    model: '',
    makeFrom: '',
    version: '',
    colorId: '',
    colorType: '',
    // Configuration data
    configuration: {
      motorType: '',
      speedLimit: '',
      maximumCapacity: ''
    },
    appearance: {
      length: '',
      width: '',
      height: '',
      weight: '',
      undercarriageDistance: '',
      storageLimit: ''
    },
    battery: {
      type: '',
      capacity: '',
      chargeTime: '',
      chargeType: '',
      energyConsumption: '',
      limit: ''
    },
    safeFeature: {
      brake: '',
      lock: ''
    },
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [colors, setColors] = useState([]);
  const [selectedColor, setSelectedColor] = useState(null);

  // Check authentication status on component mount
  useEffect(() => {
    const checkAuth = async () => {
      const authStatus = await checkAuthStatus();
      if (!authStatus.isAuthenticated) {
        console.warn('User not authenticated, API calls may fail');
      }
    };
    checkAuth();
  }, []);

  // Load colors on component mount
  useEffect(() => {
    loadColors();
  }, []);

  const loadColors = async () => {
    try {
      const result = await motorbikeService.getAllColors();
      if (result.success) {
        setColors(result.data || []);
      }
    } catch (error) {
      console.error('Error loading colors:', error);
    }
  };

  // Category removed in this screen

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };


  const handleConfigChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      configuration: {
        ...prev.configuration,
        [field]: value
      }
    }));
  };

  const handleAppearanceChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      appearance: {
        ...prev.appearance,
        [field]: value
      }
    }));
  };

  const handleBatteryChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      battery: {
        ...prev.battery,
        [field]: value
      }
    }));
  };

  const handleSafeFeatureChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      safeFeature: {
        ...prev.safeFeature,
        [field]: value
      }
    }));
  };

  const handleColorSelect = (color) => {
    // If clicking the same color, deselect it
    if (selectedColor?.id === color.id) {
      setSelectedColor(null);
      setFormData(prev => ({
        ...prev,
        colorId: '',
        colorType: ''
      }));
    } else {
      // Select the new color
      setSelectedColor(color);
      setFormData(prev => ({
        ...prev,
        colorId: color.id,
        colorType: color.colorType
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (!formData.price.trim()) {
      newErrors.price = 'Price is required';
    } else if (isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      newErrors.price = 'Please enter a valid price';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.model.trim()) {
      newErrors.model = 'Model is required';
    }

    if (!formData.makeFrom.trim()) {
      newErrors.makeFrom = 'Make from is required';
    }

    if (!formData.version.trim()) {
      newErrors.version = 'Version is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      showInfo('Validation Error', 'Please fill in all required fields correctly');
      return;
    }

    setLoading(true);
    
    try {
      // First create the motorbike
      const motorbikeData = {
        name: formData.name,
        price: Number(formData.price),
        description: formData.description,
        model: formData.model,
        makeFrom: formData.makeFrom,
        version: formData.version,
        isDeleted: false
      };

      const motorbikeResponse = await motorbikeService.createMotorbike(motorbikeData);
      
      if (!motorbikeResponse.success) {
        showInfo('Error', motorbikeResponse.message || 'Failed to create motorbike');
        return;
      }

      const vehicleId =
  motorbikeResponse?.id ||
  motorbikeResponse?.data?.data?.id ||
  motorbikeResponse?.data?.data?._id ||
  motorbikeResponse?.data?.id ||
  motorbikeResponse?.data?._id;

if (!vehicleId) {
  console.log('CreateMotorbike response:', JSON.stringify(motorbikeResponse, null, 2));
  showInfo('Error', 'Cannot determine created vehicle ID from response');
  setLoading(false);
  return;
}

      // Create all configurations
      const configPromises = [];

      // Configuration
      if (formData.configuration.motorType || formData.configuration.speedLimit || formData.configuration.maximumCapacity) {
        configPromises.push(
          motorbikeService.createConfiguration(vehicleId, {
            motorType: formData.configuration.motorType,
            speedLimit: formData.configuration.speedLimit,
            maximumCapacity: formData.configuration.maximumCapacity ? Number(formData.configuration.maximumCapacity) : undefined
          })
        );
      }

      // Appearance
      if (formData.appearance.length || formData.appearance.width || formData.appearance.height) {
        configPromises.push(
          motorbikeService.createAppearance(vehicleId, {
            length: formData.appearance.length ? Number(formData.appearance.length) : undefined,
            width: formData.appearance.width ? Number(formData.appearance.width) : undefined,
            height: formData.appearance.height ? Number(formData.appearance.height) : undefined,
            weight: formData.appearance.weight ? Number(formData.appearance.weight) : undefined,
            undercarriageDistance: formData.appearance.undercarriageDistance ? Number(formData.appearance.undercarriageDistance) : undefined,
            storageLimit: formData.appearance.storageLimit ? Number(formData.appearance.storageLimit) : undefined
          })
        );
      }

      // Battery
      if (formData.battery.type || formData.battery.capacity || formData.battery.chargeTime) {
        configPromises.push(
          motorbikeService.createBattery(vehicleId, {
            type: formData.battery.type,
            capacity: formData.battery.capacity,
            chargeTime: formData.battery.chargeTime,
            chargeType: formData.battery.chargeType,
            energyConsumption: formData.battery.energyConsumption,
            limit: formData.battery.limit
          })
        );
      }

      // Safe Feature
      if (formData.safeFeature.brake || formData.safeFeature.lock) {
        configPromises.push(
          motorbikeService.createSafeFeature(vehicleId, {
            brake: formData.safeFeature.brake,
            lock: formData.safeFeature.lock
          })
        );
      }

      // Execute all configuration creation
      if (configPromises.length > 0) {
        const configResults = await Promise.allSettled(configPromises);
        console.log('Configuration results:', configResults);
      }

      showInfo('Success', 'Motorbike and configurations created successfully!');
      
      // Navigate back after a short delay
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
      
    } catch (error) {
      console.error('Error creating motorbike:', error);
      showInfo('Error', 'Failed to create motorbike. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (label, field, value, placeholder, keyboardType = 'default', multiline = false) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label} *</Text>
      <TextInput
        style={[
          styles.textInput,
          multiline && styles.textInputMultiline,
          errors[field] && styles.textInputError
        ]}
        value={value}
        onChangeText={(text) => handleInputChange(field, text)}
        placeholder={placeholder}
        placeholderTextColor={COLORS.TEXT.SECONDARY}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
      {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
    </View>
  );


  const renderConfigInput = (label, field, value, placeholder, keyboardType = 'default') => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[
          styles.textInput,
          errors[field] && styles.textInputError
        ]}
        value={value}
        onChangeText={(text) => handleConfigChange(field, text)}
        placeholder={placeholder}
        placeholderTextColor={COLORS.TEXT.SECONDARY}
        keyboardType={keyboardType}
      />
      {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
    </View>
  );

  const renderAppearanceInput = (label, field, value, placeholder, keyboardType = 'default') => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[
          styles.textInput,
          errors[field] && styles.textInputError
        ]}
        value={value}
        onChangeText={(text) => handleAppearanceChange(field, text)}
        placeholder={placeholder}
        placeholderTextColor={COLORS.TEXT.SECONDARY}
        keyboardType={keyboardType}
      />
      {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
    </View>
  );

  const renderBatteryInput = (label, field, value, placeholder, keyboardType = 'default') => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[
          styles.textInput,
          errors[field] && styles.textInputError
        ]}
        value={value}
        onChangeText={(text) => handleBatteryChange(field, text)}
        placeholder={placeholder}
        placeholderTextColor={COLORS.TEXT.SECONDARY}
        keyboardType={keyboardType}
      />
      {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
    </View>
  );

  const renderSafeFeatureInput = (label, field, value, placeholder, keyboardType = 'default') => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[
          styles.textInput,
          errors[field] && styles.textInputError
        ]}
        value={value}
        onChangeText={(text) => handleSafeFeatureChange(field, text)}
        placeholder={placeholder}
        placeholderTextColor={COLORS.TEXT.SECONDARY}
        keyboardType={keyboardType}
      />
      {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={styles.headerTitleText}>Add New Product</Text>
            <Text style={styles.headerSubtitle}>Create a new vehicle model</Text>
          </View>
          <View style={styles.placeholder} />
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          {renderInput('Product Name', 'name', formData.name, 'e.g., EV Superbike')}
          
          {renderInput('Model', 'model', formData.model, 'e.g., Model X')}
          
          {renderInput('Make From', 'makeFrom', formData.makeFrom, 'e.g., Vietnam')}
          
          {renderInput('Version', 'version', formData.version, 'e.g., 2025')}

          {renderInput('Price ($)', 'price', formData.price, 'e.g., 150000', 'numeric')}
          {renderInput('Description', 'description', formData.description, 'Enter product description...', 'default', true)}
        </View>


        {/* Configuration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configuration</Text>
          
          <View style={styles.specsGrid}>
            <View style={styles.specsGridInputGroup}>
              {renderConfigInput('Motor Type', 'motorType', formData.configuration.motorType, 'e.g., Brushless DC')}
            </View>
            <View style={styles.specsGridInputGroup}>
              {renderConfigInput('Speed Limit', 'speedLimit', formData.configuration.speedLimit, 'e.g., 80km/h')}
            </View>
            <View style={styles.specsGridInputGroup}>
              {renderConfigInput('Maximum Capacity', 'maximumCapacity', formData.configuration.maximumCapacity, 'e.g., 2', 'numeric')}
            </View>
          </View>
        </View>

        {/* Appearance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          
          <View style={styles.specsGrid}>
            <View style={styles.specsGridInputGroup}>
              {renderAppearanceInput('Length (mm)', 'length', formData.appearance.length, 'e.g., 2000', 'numeric')}
            </View>
            <View style={styles.specsGridInputGroup}>
              {renderAppearanceInput('Width (mm)', 'width', formData.appearance.width, 'e.g., 700', 'numeric')}
            </View>
            <View style={styles.specsGridInputGroup}>
              {renderAppearanceInput('Height (mm)', 'height', formData.appearance.height, 'e.g., 1100', 'numeric')}
            </View>
            <View style={styles.specsGridInputGroup}>
              {renderAppearanceInput('Weight (kg)', 'weight', formData.appearance.weight, 'e.g., 120', 'numeric')}
            </View>
            <View style={styles.specsGridInputGroup}>
              {renderAppearanceInput('Undercarriage Distance (mm)', 'undercarriageDistance', formData.appearance.undercarriageDistance, 'e.g., 150', 'numeric')}
            </View>
            <View style={styles.specsGridInputGroup}>
              {renderAppearanceInput('Storage Limit (L)', 'storageLimit', formData.appearance.storageLimit, 'e.g., 30', 'numeric')}
            </View>
          </View>
        </View>

        {/* Battery */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Battery</Text>
          
          <View style={styles.specsGrid}>
            <View style={styles.specsGridInputGroup}>
              {renderBatteryInput('Type', 'type', formData.battery.type, 'e.g., Lithium-ion')}
            </View>
            <View style={styles.specsGridInputGroup}>
              {renderBatteryInput('Capacity', 'capacity', formData.battery.capacity, 'e.g., 60V 30Ah')}
            </View>
            <View style={styles.specsGridInputGroup}>
              {renderBatteryInput('Charge Time', 'chargeTime', formData.battery.chargeTime, 'e.g., 4 hours')}
            </View>
            <View style={styles.specsGridInputGroup}>
              {renderBatteryInput('Charge Type', 'chargeType', formData.battery.chargeType, 'e.g., Fast')}
            </View>
            <View style={styles.specsGridInputGroup}>
              {renderBatteryInput('Energy Consumption', 'energyConsumption', formData.battery.energyConsumption, 'e.g., 2kWh/100km')}
            </View>
            <View style={styles.specsGridInputGroup}>
              {renderBatteryInput('Range Limit', 'limit', formData.battery.limit, 'e.g., 100km')}
            </View>
          </View>
        </View>

        {/* Safe Feature */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Safe Feature</Text>
          
          <View style={styles.specsGrid}>
            <View style={styles.specsGridInputGroup}>
              {renderSafeFeatureInput('Brake System', 'brake', formData.safeFeature.brake, 'e.g., ABS')}
            </View>
            <View style={styles.specsGridInputGroup}>
              {renderSafeFeatureInput('Lock System', 'lock', formData.safeFeature.lock, 'e.g., Smart Lock')}
            </View>
          </View>
        </View>

        {/* Color Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Color Selection</Text>
          <View style={styles.colorGrid}>
            {colors.map((color) => (
              <TouchableOpacity
                key={color.id}
                style={[
                  styles.colorOption,
                  selectedColor?.id === color.id && styles.selectedColorOption
                ]}
                onPress={() => handleColorSelect(color)}
              >
                <View 
                  style={[
                    styles.colorCircle,
                    { backgroundColor: color.colorType.toLowerCase() }
                  ]} 
                />
                <Text style={[
                  styles.colorText,
                  selectedColor?.id === color.id && styles.selectedColorText
                ]}>
                  {color.colorType}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {colors.length === 0 && (
            <Text style={styles.noColorText}>No colors available</Text>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <LinearGradient
              colors={loading ? [COLORS.TEXT.SECONDARY, COLORS.TEXT.SECONDARY] : COLORS.GRADIENT.BLUE}
              style={styles.submitGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.submitButtonText}>
                {loading ? 'Creating...' : 'Create Product'}
              </Text>
            </LinearGradient>
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
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
  },
  
  // Header styles
  header: {
    paddingTop: SIZES.PADDING.XXXLARGE,
    paddingHorizontal: SIZES.PADDING.LARGE,
    paddingBottom: SIZES.PADDING.LARGE,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: SIZES.RADIUS.ROUND,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: SIZES.FONT.LARGE,
    color: COLORS.TEXT.WHITE,
    fontWeight: 'bold',
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitleText: {
    fontSize: SIZES.FONT.HEADER,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
  headerSubtitle: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    marginTop: 2,
  },
  placeholder: {
    width: 40,
  },

  // Content
  content: {
    flex: 1,
    backgroundColor: COLORS.SURFACE,
    borderTopLeftRadius: SIZES.RADIUS.XXLARGE,
    borderTopRightRadius: SIZES.RADIUS.XXLARGE,
  },
  scrollContent: {
    paddingHorizontal: SIZES.PADDING.LARGE,
    paddingTop: SIZES.PADDING.LARGE,
    paddingBottom: SIZES.PADDING.XXXLARGE,
  },

  // Sections
  section: {
    marginBottom: SIZES.PADDING.XLARGE,
  },
  sectionTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SIZES.PADDING.LARGE,
  },

  // Form inputs
  inputGroup: {
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  inputLabel: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SIZES.PADDING.SMALL,
  },
  textInput: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.MEDIUM,
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textInputMultiline: {
    height: 80,
    textAlignVertical: 'top',
  },
  textInputError: {
    borderColor: COLORS.ERROR,
  },
  errorText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.ERROR,
    marginTop: SIZES.PADDING.XSMALL,
  },

  // Category selection
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.PADDING.SMALL,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedCategoryOption: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  categoryIcon: {
    fontSize: SIZES.FONT.SMALL,
    marginRight: SIZES.PADDING.XSMALL,
  },
  categoryText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '500',
  },
  selectedCategoryText: {
    color: COLORS.TEXT.WHITE,
  },

  // Specifications grid
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  specsGridInputGroup: {
    width: '48%',
  },

  // Color selection
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.PADDING.SMALL,
  },
  colorOption: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedColorOption: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  colorCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: SIZES.PADDING.SMALL,
  },
  colorText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '500',
  },
  selectedColorText: {
    color: COLORS.TEXT.WHITE,
  },
  noColorText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
    fontStyle: 'italic',
  },

  // Image upload
  imageUploadContainer: {
    borderRadius: SIZES.RADIUS.LARGE,
    overflow: 'hidden',
    backgroundColor: '#F8F9FA',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  imagePlaceholder: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.PADDING.LARGE,
  },
  uploadIcon: {
    fontSize: 48,
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  uploadText: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SIZES.PADDING.XSMALL,
  },
  uploadSubtext: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
  },
  uploadedImage: {
    width: '100%',
    height: 200,
  },

  // Action buttons
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SIZES.PADDING.XLARGE,
    gap: SIZES.PADDING.MEDIUM,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.LARGE,
    paddingVertical: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cancelButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
  },
  submitButton: {
    flex: 2,
    borderRadius: SIZES.RADIUS.LARGE,
    overflow: 'hidden',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitGradient: {
    paddingVertical: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
});

export default AddProductScreen;

