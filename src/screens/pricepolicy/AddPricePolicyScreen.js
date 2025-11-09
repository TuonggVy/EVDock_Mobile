import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Modal,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { COLORS, SIZES } from '../../constants';
import CustomAlert from '../../components/common/CustomAlert';
import pricePolicyService from '../../services/pricePolicyService';
import agencyService from '../../services/agencyService';
import motorbikeService from '../../services/motorbikeService';
import { ChevronDown, ArrowLeft, X } from 'lucide-react-native';
import { useCustomAlert } from '../../hooks/useCustomAlert';

const AddPricePolicyScreen = ({ navigation, route }) => {

  const [loading, setLoading] = useState(false);
  const [agencies, setAgencies] = useState([]);
  const [motorbikes, setMotorbikes] = useState([]);
  const [agencyModalVisible, setAgencyModalVisible] = useState(false);
  const [motorbikeModalVisible, setMotorbikeModalVisible] = useState(false);
  const { alertConfig, hideAlert, showSuccess, showError } = useCustomAlert();

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    policy: '',
    wholesalePrice: '',
    agencyId: null,
    motorbikeId: null,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadAgencies();
    loadMotorbikes();

      }, []);

  const loadAgencies = async () => {
    try {
      const response = await agencyService.getAgencies({ limit: 100 });
      if (response.success && Array.isArray(response.data)) {
        setAgencies(response.data);
      }
    } catch (error) {
      console.error('Error loading agencies:', error);
    }
  };

  const loadMotorbikes = async () => {
    try {
      const response = await motorbikeService.getAllMotorbikes({ limit: 100 });
      if (response.success && Array.isArray(response.data)) {
        setMotorbikes(response.data);
      }
    } catch (error) {
      console.error('Error loading motorbikes:', error);
    }
  };

  const handleSave = async () => {
    setErrors({});

    const validation = pricePolicyService.validatePricePolicy(formData);

    if (!validation.isValid) {
      setErrors(validation.errors);
      showError('Validation Error', Object.values(validation.errors)[0]);
      return;
    }

    setLoading(true);
    try {
      const response = await pricePolicyService.createPricePolicy(formData);

      if (response.success) {
        showSuccess('Success', 'Price policy created successfully!');
        setTimeout(() => {
          hideAlert();
          navigation.goBack();
        }, 1500);
      } else {
        const errorMessage = typeof response.error === 'string' 
          ? response.error 
          : (response.error?.message || JSON.stringify(response.error) || 'Failed to save price policy');
        showError('Error', errorMessage);
      }
    } catch (error) {
      console.error('Error saving price policy:', error);
      showError('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAgency = (agency) => {
    setFormData({ ...formData, agencyId: agency.id });
    setAgencyModalVisible(false);
  };

  const handleSelectMotorbike = (motorbike) => {
    setFormData({ ...formData, motorbikeId: motorbike.id });
    setMotorbikeModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <CustomAlert {...alertConfig} onClose={hideAlert} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={COLORS.TEXT.WHITE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Price Policy</Text>
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
            <Text style={styles.sectionTitle}>Basic Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Title <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.textInput, errors.title && styles.inputError]}
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
                placeholder="Enter policy title"
                placeholderTextColor={COLORS.TEXT.SECONDARY}
              />
              {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Content <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.textInput, styles.textArea, errors.content && styles.inputError]}
                value={formData.content}
                onChangeText={(text) => setFormData({ ...formData, content: text })}
                placeholder="Enter policy content"
                placeholderTextColor={COLORS.TEXT.SECONDARY}
                multiline
                numberOfLines={4}
              />
              {errors.content && <Text style={styles.errorText}>{errors.content}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Policy <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.textInput, styles.textArea, errors.policy && styles.inputError]}
                value={formData.policy}
                onChangeText={(text) => setFormData({ ...formData, policy: text })}
                placeholder="Enter policy details"
                placeholderTextColor={COLORS.TEXT.SECONDARY}
                multiline
                numberOfLines={3}
              />
              {errors.policy && <Text style={styles.errorText}>{errors.policy}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Wholesale Price (VND) <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.textInput, errors.wholesalePrice && styles.inputError]}
                value={formData.wholesalePrice}
                onChangeText={(text) => setFormData({ ...formData, wholesalePrice: text })}
                placeholder="Enter wholesale price"
                placeholderTextColor={COLORS.TEXT.SECONDARY}
                keyboardType="numeric"
              />
              {errors.wholesalePrice && <Text style={styles.errorText}>{errors.wholesalePrice}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Agency <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={[styles.dropdownButton, errors.agencyId && styles.inputError]}
                onPress={() => setAgencyModalVisible(true)}
              >
                <Text
                  style={[
                    styles.dropdownButtonText,
                    !formData.agencyId && styles.dropdownButtonTextPlaceholder,
                  ]}
                >
                  {formData.agencyId
                    ? agencies.find(a => a.id === formData.agencyId)?.name || `Agency ${formData.agencyId}`
                    : 'Select agency'}
                </Text>
                <ChevronDown size={20} color={COLORS.TEXT.SECONDARY} />
              </TouchableOpacity>
              {errors.agencyId && <Text style={styles.errorText}>{errors.agencyId}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Motorbike <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={[styles.dropdownButton, errors.motorbikeId && styles.inputError]}
                onPress={() => setMotorbikeModalVisible(true)}
              >
                <Text
                  style={[
                    styles.dropdownButtonText,
                    !formData.motorbikeId && styles.dropdownButtonTextPlaceholder,
                  ]}
                >
                  {formData.motorbikeId
                    ? motorbikes.find(b => b.id === formData.motorbikeId)?.name || `ID: ${formData.motorbikeId}`
                    : 'Select motorbike'}
                </Text>
                <ChevronDown size={20} color={COLORS.TEXT.SECONDARY} />
              </TouchableOpacity>
              {errors.motorbikeId && <Text style={styles.errorText}>{errors.motorbikeId}</Text>}
            </View>

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#009DFF" />
              ) : (
                <Text style={styles.submitButtonText}>Create Price Policy</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Agency Modal */}
      <Modal
        visible={agencyModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setAgencyModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Agency</Text>
              <TouchableOpacity onPress={() => setAgencyModalVisible(false)}>
                <X size={24} color={COLORS.TEXT.SECONDARY} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {agencies.map((agency) => (
                <TouchableOpacity
                  key={agency.id}
                  style={styles.modalItem}
                  onPress={() => handleSelectAgency(agency)}
                >
                  <Text style={styles.modalItemText}>{agency.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Motorbike Modal */}
      <Modal
        visible={motorbikeModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setMotorbikeModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Motorbike</Text>
              <TouchableOpacity onPress={() => setMotorbikeModalVisible(false)}>
                <X size={24} color={COLORS.TEXT.SECONDARY} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {motorbikes.map((motorbike) => (
                <TouchableOpacity
                  key={motorbike.id}
                  style={styles.modalItem}
                  onPress={() => handleSelectMotorbike(motorbike)}
                >
                  <Text style={styles.modalItemText}>{motorbike.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND.PRIMARY },
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
  inputGroup: { marginBottom: SIZES.PADDING.LARGE },
  inputLabel: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SIZES.PADDING.SMALL,
  },
  textInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
    borderWidth: 1,
    borderColor: COLORS.BORDER.PRIMARY,
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  inputError: { borderColor: COLORS.ERROR },
  errorText: { color: COLORS.ERROR, fontSize: SIZES.FONT.SMALL, marginTop: 4 },
  required: {
    color: COLORS.ERROR,
  },
  dropdownButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: SIZES.RADIUS.MEDIUM,
    borderWidth: 1,
    borderColor: COLORS.BORDER.PRIMARY,
    padding: SIZES.PADDING.MEDIUM,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownButtonText: { fontSize: SIZES.FONT.MEDIUM, color: COLORS.TEXT.PRIMARY },
  dropdownButtonTextPlaceholder: { color: COLORS.TEXT.SECONDARY },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.SURFACE,
    borderTopLeftRadius: SIZES.RADIUS.LARGE,
    borderTopRightRadius: SIZES.RADIUS.LARGE,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.PADDING.LARGE,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  modalTitle: { fontSize: SIZES.FONT.LARGE, fontWeight: 'bold', color: COLORS.TEXT.PRIMARY },
  modalItem: { padding: SIZES.PADDING.MEDIUM, borderBottomWidth: 1, borderBottomColor: '#EFEFEF' },
  modalItemText: { fontSize: SIZES.FONT.MEDIUM, color: COLORS.TEXT.PRIMARY },
  submitButton: {
    backgroundColor: '#009DFF',
    borderRadius: SIZES.RADIUS.LARGE,
    paddingVertical: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
    marginTop: SIZES.PADDING.XLARGE,
    marginBottom: SIZES.PADDING.XXXLARGE,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
});

export default AddPricePolicyScreen;
