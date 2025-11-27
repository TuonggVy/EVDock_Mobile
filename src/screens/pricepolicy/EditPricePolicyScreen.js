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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { COLORS, SIZES } from '../../constants';
import CustomAlert from '../../components/common/CustomAlert';
import pricePolicyService from '../../services/pricePolicyService';
import agencyService from '../../services/agencyService';
import motorbikeService from '../../services/motorbikeService';
import { ChevronDown, PencilOff, ArrowLeft, X } from 'lucide-react-native';
import { useCustomAlert } from '../../hooks/useCustomAlert';

const EditPricePolicyScreen = ({ navigation, route }) => {
  const pricePolicy = route?.params?.pricePolicy;
  if (!pricePolicy) {
    navigation.goBack();
    return null;
  }

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

    // Load price policy details if needed
    const loadPricePolicyDetail = async () => {
      try {
        const response = await pricePolicyService.getPricePolicyDetail(pricePolicy.id);
        if (response.success && response.data) {
          setFormData({
            title: response.data.title || '',
            content: response.data.content || '',
            policy: response.data.policy || '',
            wholesalePrice: response.data.wholesalePrice?.toString() || '',
            agencyId: response.data.agencyId || null,
            motorbikeId: response.data.motorbikeId || null,
          });
        }
      } catch (error) {
        console.error('Error loading price policy detail:', error);
      }
    };

    if (pricePolicy.title) {
      // Already has data from navigation
      setFormData({
        title: pricePolicy.title || '',
        content: pricePolicy.content || '',
        policy: pricePolicy.policy || '',
        wholesalePrice: pricePolicy.wholesalePrice?.toString() || '',
        agencyId: pricePolicy.agencyId || null,
        motorbikeId: pricePolicy.motorbikeId || null,
      });
    } else {
      // Need to load detail from API
      loadPricePolicyDetail();
    }
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
      const response = await pricePolicyService.updatePricePolicy(pricePolicy.id, formData);

      if (response.success) {
        showSuccess('Success', 'Price policy updated successfully!');
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
        <Text style={styles.headerTitle}>Edit Price Policy</Text>
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
            <Text style={styles.sectionTitle}>Policy Details</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Title</Text>
              <View style={[styles.textInput, styles.readOnlyInput, styles.readOnlyContainer]}>
                <Text style={styles.readOnlyText}>{formData.title || 'Policy title'}</Text>
                <PencilOff size={16} color={COLORS.TEXT.SECONDARY} />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Content</Text>
              <View style={[styles.textInput, styles.textArea, styles.readOnlyInput, styles.readOnlyContainer]}>
                <Text style={styles.readOnlyText}>{formData.content || 'Policy content'}</Text>
                <PencilOff size={16} color={COLORS.TEXT.SECONDARY} style={styles.readOnlyIcon} />
              </View>
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
              <Text style={styles.inputLabel}>Agency</Text>
              <View style={[styles.dropdownButton, styles.readOnlyInput]}>
                <Text style={styles.readOnlyText}>
                  {formData.agencyId
                    ? agencies.find(a => a.id === formData.agencyId)?.name || `Agency ${formData.agencyId}`
                    : 'No agency selected'}
                </Text>
                <PencilOff size={16} color={COLORS.TEXT.SECONDARY} />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Motorbike</Text>
              <View style={[styles.dropdownButton, styles.readOnlyInput]}>
                <Text style={styles.readOnlyText}>
                  {formData.motorbikeId
                    ? motorbikes.find(b => b.id === formData.motorbikeId)?.name || `ID: ${formData.motorbikeId}`
                    : 'No motorbike selected'}
                </Text>
                <PencilOff size={16} color={COLORS.TEXT.SECONDARY} />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#009DFF" />
              ) : (
                <Text style={styles.submitButtonText}>Update Price Policy</Text>
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
  required: {
    color: COLORS.ERROR,
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
  readOnlyInput: {
    backgroundColor: '#E0E0E0',
    borderColor: 'transparent',
  },
  readOnlyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: SIZES.PADDING.MEDIUM,
  },
  readOnlyText: {
    color: COLORS.TEXT.SECONDARY,
    flex: 1,
  },
  readOnlyIcon: {
    marginLeft: SIZES.PADDING.SMALL,
  },
  dropdownButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.BORDER.PRIMARY,
  },
  dropdownButtonText: { fontSize: SIZES.FONT.MEDIUM, color: COLORS.TEXT.PRIMARY },
  dropdownButtonTextPlaceholder: { color: COLORS.TEXT.SECONDARY },
  dropdownIcon: { color: COLORS.TEXT.SECONDARY },
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

export default EditPricePolicyScreen;
