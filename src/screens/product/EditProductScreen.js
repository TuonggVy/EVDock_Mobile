import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES } from '../../constants';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import motorbikeService from '../../services/motorbikeService';
import * as ImagePicker from 'expo-image-picker';

const EditProductScreen = ({ navigation, route }) => {
  const { product } = route.params;
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
    image: null,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [configurations, setConfigurations] = useState({
    appearance: null,
    battery: null,
    configuration: null,
    safeFeature: null,
  });
  const [colors, setColors] = useState([]);
  const [selectedColor, setSelectedColor] = useState(null);
  const [motorbikeImages, setMotorbikeImages] = useState([]);
  const [colorImage, setColorImage] = useState(null);

  // Category removed in this screen

  // Initialize form with product data and load configurations
  useEffect(() => {
    setFormData({
      name: product.name || '',
      price: product.price?.toString() || '',
      description: product.description || '',
      model: product.model || '',
      makeFrom: product.makeFrom || '',
      version: product.version || '',
      colorId: product.colorId || '',
      colorType: product.colorType || '',
      image: product.image || null,
    });

    // Load existing configurations
    loadConfigurations();
    
    // Load colors
    loadColors();
    
    // Set selected color if product has a color
    if (product.colorId && product.colorType) {
      setSelectedColor({ id: product.colorId, colorType: product.colorType });
    }
  }, [product]);

  const loadConfigurations = async () => {
    if (!product.id) return;
    
    console.log('Loading configurations for product ID:', product.id);
    
    try {
      const [batteryResult, configResult, safeFeatureResult, appearanceResult] = await Promise.all([
        motorbikeService.getBattery(product.id),
        motorbikeService.getConfiguration(product.id),
        motorbikeService.getSafeFeature(product.id),
        motorbikeService.getAppearance(product.id),
      ]);

      const configData = {
        appearance: appearanceResult.success ? appearanceResult.data : null,
        battery: batteryResult.success ? batteryResult.data : null,
        configuration: configResult.success ? configResult.data : null,
        safeFeature: safeFeatureResult.success ? safeFeatureResult.data : null,
      };

      setConfigurations(configData);
      console.log('Loaded configuration data:', configData);

      // Update form data with loaded configurations
      setFormData(prev => ({
        ...prev,
        configuration: {
          motorType: configData.configuration?.motorType || '',
          speedLimit: configData.configuration?.speedLimit || '',
          maximumCapacity: configData.configuration?.maximumCapacity?.toString() || '',
        },
        appearance: {
          length: configData.appearance?.length?.toString() || '',
          width: configData.appearance?.width?.toString() || '',
          height: configData.appearance?.height?.toString() || '',
          weight: configData.appearance?.weight?.toString() || '',
          undercarriageDistance: configData.appearance?.undercarriageDistance?.toString() || '',
          storageLimit: configData.appearance?.storageLimit?.toString() || '',
        },
        battery: {
          type: configData.battery?.type || '',
          capacity: configData.battery?.capacity || '',
          chargeTime: configData.battery?.chargeTime || '',
          chargeType: configData.battery?.chargeType || '',
          energyConsumption: configData.battery?.energyConsumption || '',
          limit: configData.battery?.limit || '',
        },
        safeFeature: {
          brake: configData.safeFeature?.brake || '',
          lock: configData.safeFeature?.lock || '',
        },
      }));
      
      console.log('Updated formData with configurations');
    } catch (error) {
      console.error('Error loading configurations:', error);
    }
  };

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
      // First update the motorbike
      const motorbikeData = {
        name: formData.name,
        price: Number(formData.price),
        description: formData.description,
        model: formData.model,
        makeFrom: formData.makeFrom,
        version: formData.version,
        isDeleted: false
      };

      const motorbikeResponse = await motorbikeService.updateMotorbike(product.id, motorbikeData);
      
      if (!motorbikeResponse.success) {
        showInfo('Error', motorbikeResponse.message || 'Failed to update motorbike');
        return;
      }

      // Update all configurations
      const configPromises = [];

      // Configuration
      if (formData.configuration.motorType || formData.configuration.speedLimit || formData.configuration.maximumCapacity) {
        configPromises.push(
          motorbikeService.updateConfiguration(product.id, {
            motorType: formData.configuration.motorType,
            speedLimit: formData.configuration.speedLimit,
            maximumCapacity: formData.configuration.maximumCapacity ? Number(formData.configuration.maximumCapacity) : undefined
          })
        );
      }

      // Appearance
      if (formData.appearance.length || formData.appearance.width || formData.appearance.height) {
        configPromises.push(
          motorbikeService.updateAppearance(product.id, {
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
          motorbikeService.updateBattery(product.id, {
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
          motorbikeService.updateSafeFeature(product.id, {
            brake: formData.safeFeature.brake,
            lock: formData.safeFeature.lock
          })
        );
      }

      // Execute all configuration updates
      if (configPromises.length > 0) {
        const configResults = await Promise.allSettled(configPromises);
        console.log('Configuration update results:', configResults);
      }

      // Upload motorbike images if any selected
      if (motorbikeImages.length > 0) {
        const imageResult = await motorbikeService.uploadMotorbikeImages(product.id, motorbikeImages);
        if (!imageResult.success) {
          console.error('Error uploading motorbike images:', imageResult.message);
        }
      }

      // Upload color image if selected
      if (colorImage && selectedColor) {
        const colorImageResult = await motorbikeService.uploadColorImage(product.id, selectedColor.id, colorImage);
        if (!colorImageResult.success) {
          console.error('Error uploading color image:', colorImageResult.message);
        }
      }

      showInfo('Success', 'Motorbike and configurations updated successfully!');
      
      // Update the product object with new data for immediate display
      const updatedProduct = {
        ...product,
        name: formData.name,
        price: Number(formData.price),
        description: formData.description,
        model: formData.model,
        makeFrom: formData.makeFrom,
        version: formData.version,
      };
      
      // Refresh the product data to show updated information
      await loadConfigurations();
      
      // Navigate back to ProductManagement after successful update
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
      
    } catch (error) {
      console.error('Error updating motorbike:', error);
      showInfo('Error', 'Failed to update motorbike. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const requestImagePickerPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showInfo('Permission Required', 'Camera roll permission is required to select images');
      return false;
    }
    return true;
  };

  const handleSelectMotorbikeImages = async () => {
    const hasPermission = await requestImagePickerPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets.map(asset => ({
          uri: asset.uri,
          type: 'image/jpeg',
          name: asset.fileName || `image_${Date.now()}.jpg`,
        }));
        setMotorbikeImages(prev => [...prev, ...newImages]);
        showInfo('Success', `${newImages.length} image(s) selected`);
      }
    } catch (error) {
      console.error('Error selecting images:', error);
      showInfo('Error', 'Failed to select images');
    }
  };

  const handleSelectColorImage = async () => {
    if (!selectedColor) {
      showInfo('Color Required', 'Please select a color first');
      return;
    }

    const hasPermission = await requestImagePickerPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setColorImage({
          uri: asset.uri,
          type: 'image/jpeg',
          name: asset.fileName || `color_${selectedColor.colorType}_${Date.now()}.jpg`,
        });
        showInfo('Success', 'Color image selected');
      }
    } catch (error) {
      console.error('Error selecting color image:', error);
      showInfo('Error', 'Failed to select color image');
    }
  };

  const removeImage = (index) => {
    setMotorbikeImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeColorImage = () => {
    setColorImage(null);
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
            <Text style={styles.headerTitleText}>Edit Product</Text>
            <Text style={styles.headerSubtitle}>Update vehicle model</Text>
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
              {renderConfigInput('Motor Type', 'motorType', formData.configuration?.motorType || '', 'e.g., Brushless DC')}
            </View>
            <View style={styles.specsGridInputGroup}>
              {renderConfigInput('Speed Limit', 'speedLimit', formData.configuration?.speedLimit || '', 'e.g., 80km/h')}
            </View>
            <View style={styles.specsGridInputGroup}>
              {renderConfigInput('Maximum Capacity', 'maximumCapacity', formData.configuration?.maximumCapacity || '', 'e.g., 2', 'numeric')}
            </View>
          </View>
        </View>

        {/* Appearance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          
          <View style={styles.specsGrid}>
            <View style={styles.specsGridInputGroup}>
              {renderAppearanceInput('Length (mm)', 'length', formData.appearance?.length || '', 'e.g., 2000', 'numeric')}
            </View>
            <View style={styles.specsGridInputGroup}>
              {renderAppearanceInput('Width (mm)', 'width', formData.appearance?.width || '', 'e.g., 700', 'numeric')}
            </View>
            <View style={styles.specsGridInputGroup}>
              {renderAppearanceInput('Height (mm)', 'height', formData.appearance?.height || '', 'e.g., 1100', 'numeric')}
            </View>
            <View style={styles.specsGridInputGroup}>
              {renderAppearanceInput('Weight (kg)', 'weight', formData.appearance?.weight || '', 'e.g., 120', 'numeric')}
            </View>
            <View style={styles.specsGridInputGroup}>
              {renderAppearanceInput('Undercarriage Distance (mm)', 'undercarriageDistance', formData.appearance?.undercarriageDistance || '', 'e.g., 150', 'numeric')}
            </View>
            <View style={styles.specsGridInputGroup}>
              {renderAppearanceInput('Storage Limit (L)', 'storageLimit', formData.appearance?.storageLimit || '', 'e.g., 30', 'numeric')}
            </View>
          </View>
        </View>

        {/* Battery */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Battery</Text>
          
          <View style={styles.specsGrid}>
            <View style={styles.specsGridInputGroup}>
              {renderBatteryInput('Type', 'type', formData.battery?.type || '', 'e.g., Lithium-ion')}
            </View>
            <View style={styles.specsGridInputGroup}>
              {renderBatteryInput('Capacity', 'capacity', formData.battery?.capacity || '', 'e.g., 60V 30Ah')}
            </View>
            <View style={styles.specsGridInputGroup}>
              {renderBatteryInput('Charge Time', 'chargeTime', formData.battery?.chargeTime || '', 'e.g., 4 hours')}
            </View>
            <View style={styles.specsGridInputGroup}>
              {renderBatteryInput('Charge Type', 'chargeType', formData.battery?.chargeType || '', 'e.g., Fast')}
            </View>
            <View style={styles.specsGridInputGroup}>
              {renderBatteryInput('Energy Consumption', 'energyConsumption', formData.battery?.energyConsumption || '', 'e.g., 2kWh/100km')}
            </View>
            <View style={styles.specsGridInputGroup}>
              {renderBatteryInput('Range Limit', 'limit', formData.battery?.limit || '', 'e.g., 100km')}
            </View>
          </View>
        </View>

        {/* Safe Feature */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Safe Feature</Text>
          
          <View style={styles.specsGrid}>
            <View style={styles.specsGridInputGroup}>
              {renderSafeFeatureInput('Brake System', 'brake', formData.safeFeature?.brake || '', 'e.g., ABS')}
            </View>
            <View style={styles.specsGridInputGroup}>
              {renderSafeFeatureInput('Lock System', 'lock', formData.safeFeature?.lock || '', 'e.g., Smart Lock')}
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

        {/* Motorbike Images Upload */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Product Images</Text>
          <Text style={styles.sectionSubtitle}>Upload multiple images for the motorbike</Text>
          
          {/* Selected Images Preview */}
          {motorbikeImages.length > 0 && (
            <View style={styles.imagesGrid}>
              {motorbikeImages.map((image, index) => (
                <View key={index} style={styles.imageItemContainer}>
                  <Image source={{ uri: image.uri }} style={styles.imagePreview} />
                  <TouchableOpacity 
                    style={styles.removeImageButton}
                    onPress={() => removeImage(index)}
                  >
                    <Text style={styles.removeImageButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity style={styles.imageUploadButton} onPress={handleSelectMotorbikeImages}>
            <Text style={styles.imageUploadButtonText}>📷 Add Images</Text>
          </TouchableOpacity>
        </View>

        {/* Color Image Upload */}
        {selectedColor && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Color Image</Text>
            <Text style={styles.sectionSubtitle}>Upload image for {selectedColor.colorType} color</Text>
            
            {colorImage && (
              <View style={styles.colorImageContainer}>
                <Image source={{ uri: colorImage.uri }} style={styles.colorImagePreview} />
                <TouchableOpacity 
                  style={styles.removeColorImageButton}
                  onPress={removeColorImage}
                >
                  <Text style={styles.removeImageButtonText}>✕ Remove</Text>
                </TouchableOpacity>
              </View>
            )}

            {!colorImage && (
              <TouchableOpacity style={styles.imageUploadButton} onPress={handleSelectColorImage}>
                <Text style={styles.imageUploadButtonText}>📷 Select Color Image</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

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
                {loading ? 'Updating...' : 'Update Product'}
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
    gap: 12,
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
  sectionSubtitle: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: SIZES.PADDING.MEDIUM,
  },

  // Image upload
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.PADDING.SMALL,
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  imageItemContainer: {
    width: '48%',
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: 150,
    borderRadius: SIZES.RADIUS.MEDIUM,
  },
  removeImageButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  imageUploadButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingVertical: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
  },
  imageUploadButtonText: {
    color: COLORS.TEXT.WHITE,
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: '600',
  },
  colorImageContainer: {
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  colorImagePreview: {
    width: '100%',
    height: 200,
    borderRadius: SIZES.RADIUS.MEDIUM,
    marginBottom: SIZES.PADDING.SMALL,
  },
  removeColorImageButton: {
    backgroundColor: COLORS.ERROR,
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    alignItems: 'center',
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

export default EditProductScreen;
