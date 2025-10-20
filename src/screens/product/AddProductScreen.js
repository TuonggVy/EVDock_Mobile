import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES, IMAGES } from '../../constants';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';

const AddProductScreen = ({ navigation }) => {
  const { alertConfig, hideAlert, showConfirm, showInfo } = useCustomAlert();
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    specifications: {
      battery: '',
      topSpeed: '',
      range: '',
      weight: '',
      maxLoad: '',
      chargingTime: ''
    },
    image: null,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

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

  const handleSpecChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      specifications: {
        ...prev.specifications,
        [field]: value
      }
    }));
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

    // Stock quantity removed in this screen

    // Validate specifications (align with Product Detail fields)
    if (!formData.specifications.battery.trim()) {
      newErrors.battery = 'Battery capacity is required';
    }
    if (!formData.specifications.topSpeed.trim()) {
      newErrors.topSpeed = 'Top speed is required';
    }
    if (!formData.specifications.range.trim()) {
      newErrors.range = 'Range is required';
    }
    // Optional: weight, maxLoad, chargingTime can be empty

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
      // TODO: Replace with actual API call
      // const response = await productService.createProduct({
      //   ...formData,
      //   price: Number(formData.price),
      //   stock: Number(formData.stock),
      //   status: 'available'
      // });

      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      showInfo('Success', 'Product created successfully!');
      
      // Navigate back after a short delay
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
      
    } catch (error) {
      console.error('Error creating product:', error);
      showInfo('Error', 'Failed to create product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = () => {
    // TODO: Implement image selection
    showInfo('Image Selection', 'Image selection feature will be implemented');
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

  const renderSpecInput = (label, field, value, placeholder) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label} *</Text>
      <TextInput
        style={[
          styles.textInput,
          errors[field] && styles.textInputError
        ]}
        value={value}
        onChangeText={(text) => handleSpecChange(field, text)}
        placeholder={placeholder}
        placeholderTextColor={COLORS.TEXT.SECONDARY}
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
          
          {renderInput('Product Name', 'name', formData.name, 'e.g., Tesla Model X')}
          
        {/* Category removed */}

          {renderInput('Price ($)', 'price', formData.price, 'e.g., 89990', 'numeric')}
          {/* Stock quantity removed */}
          {renderInput('Description', 'description', formData.description, 'Enter product description...', 'default', true)}
        </View>

        {/* Specifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Specifications</Text>
          
          <View style={styles.specsGrid}>
            <View style={styles.specsGridInputGroup}>
              {renderSpecInput('Battery Capacity', 'battery', formData.specifications.battery, 'e.g., 36V 10Ah')}
            </View>
            <View style={styles.specsGridInputGroup}>
              {renderSpecInput('Maximum Speed', 'topSpeed', formData.specifications.topSpeed, 'e.g., 155 mph')}
            </View>
            <View style={styles.specsGridInputGroup}>
              {renderSpecInput('Distance (WLTP)', 'range', formData.specifications.range, 'e.g., 348 miles')}
            </View>
            <View style={styles.specsGridInputGroup}>
              {renderSpecInput('Weight', 'weight', formData.specifications.weight, 'e.g., 25 kg')}
            </View>
            <View style={styles.specsGridInputGroup}>
              {renderSpecInput('Max Load', 'maxLoad', formData.specifications.maxLoad, 'e.g., 150 kg')}
            </View>
            <View style={styles.specsGridInputGroup}>
              {renderSpecInput('Charging Time', 'chargingTime', formData.specifications.chargingTime, 'e.g., 6-8 hours')}
            </View>
          </View>
        </View>

        {/* Image Upload */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Product Image</Text>
          
          <TouchableOpacity style={styles.imageUploadContainer} onPress={handleImageSelect}>
            {formData.image ? (
              <Image source={formData.image} style={styles.uploadedImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.uploadIcon}>📷</Text>
                <Text style={styles.uploadText}>Tap to add image</Text>
                <Text style={styles.uploadSubtext}>Recommended: 400x300px</Text>
              </View>
            )}
          </TouchableOpacity>
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
