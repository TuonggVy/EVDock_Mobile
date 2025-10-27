import React, { useState } from 'react';
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
import { COLORS, SIZES } from '../../constants';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import warehouseService from '../../services/warehouseService';

const AddWarehouseScreen = ({ navigation }) => {
  const { alertConfig, hideAlert, showSuccess, showError } = useCustomAlert();

  const [formData, setFormData] = useState({
    name: '',
    location: '',
    address: '',
    isActive: true,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Warehouse name is required';
    }
    
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }
    
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      showError('Lỗi', 'Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    setLoading(true);
    try {
      const res = await warehouseService.createWarehouse(formData);

      if (res?.success) {
        showSuccess('Thành công', 'Thêm warehouse thành công!');
        setTimeout(() => {
          navigation.goBack();
        }, 1500);
      } else {
        showError('Lỗi', res?.error || 'Không thể tạo warehouse');
      }
    } catch (error) {
      console.error('Error creating warehouse:', error);
      showError('Lỗi', 'Không thể tạo warehouse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Warehouse</Text>
        <View style={styles.headerActions}>
          {/* Empty space to balance layout */}
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Basic Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Warehouse Name <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                placeholder="Enter warehouse name"
                placeholderTextColor={COLORS.TEXT.SECONDARY}
                value={formData.name}
                onChangeText={(text) => {
                  setFormData({ ...formData, name: text });
                  if (errors.name) setErrors({ ...errors, name: null });
                }}
              />
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Location <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.location && styles.inputError]}
                placeholder="Enter location"
                placeholderTextColor={COLORS.TEXT.SECONDARY}
                value={formData.location}
                onChangeText={(text) => {
                  setFormData({ ...formData, location: text });
                  if (errors.location) setErrors({ ...errors, location: null });
                }}
              />
              {errors.location && <Text style={styles.errorText}>{errors.location}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Address <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  errors.address && styles.inputError
                ]}
                placeholder="Enter full address"
                placeholderTextColor={COLORS.TEXT.SECONDARY}
                value={formData.address}
                onChangeText={(text) => {
                  setFormData({ ...formData, address: text });
                  if (errors.address) setErrors({ ...errors, address: null });
                }}
                multiline
                numberOfLines={4}
              />
              {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Active Status</Text>
              <TouchableOpacity
                style={[
                  styles.switch,
                  formData.isActive && styles.switchActive
                ]}
                onPress={() => setFormData({ ...formData, isActive: !formData.isActive })}
              >
                <Text style={styles.switchText}>
                  {formData.isActive ? '✓ Active' : '✗ Inactive'}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>
                {loading ? 'Creating...' : 'Create Warehouse'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <CustomAlert {...alertConfig} />
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
  backIcon: {
    fontSize: SIZES.FONT.XXLARGE,
    color: COLORS.TEXT.WHITE,
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
    alignItems: 'flex-end',
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
  input: {
    backgroundColor: '#F5F5F5',
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
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.ERROR,
    marginTop: SIZES.PADDING.XSMALL,
  },
  switch: {
    backgroundColor: COLORS.BACKGROUND.SECONDARY,
    paddingHorizontal: SIZES.PADDING.LARGE,
    paddingVertical: SIZES.PADDING.MEDIUM,
    borderRadius: SIZES.RADIUS.MEDIUM,
    alignItems: 'center',
  },
  switchActive: {
    backgroundColor: COLORS.SUCCESS,
  },
  switchText: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: '600',
    color: COLORS.TEXT.WHITE,
  },
  submitButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: SIZES.RADIUS.LARGE,
    paddingVertical: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
    marginTop: SIZES.PADDING.XLARGE,
    marginBottom: SIZES.PADDING.XXXLARGE,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
});

export default AddWarehouseScreen;

