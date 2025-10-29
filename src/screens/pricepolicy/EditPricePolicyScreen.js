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
} from 'react-native';
import { COLORS, SIZES } from '../../constants';
import CustomAlert from '../../components/common/CustomAlert';
import pricePolicyService from '../../services/pricePolicyService';
import agencyService from '../../services/agencyService';
import motorbikeService from '../../services/motorbikeService';
import { ChevronDown, PencilOff } from 'lucide-react-native';

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
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'info' });

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
      setAlertConfig({
        title: 'Validation Error',
        message: Object.values(validation.errors)[0],
        type: 'error'
      });
      setShowAlert(true);
      return;
    }

    setLoading(true);
    try {
      const response = await pricePolicyService.updatePricePolicy(pricePolicy.id, formData);

      if (response.success) {
        setAlertConfig({
          title: 'Success',
          message: 'Price policy updated successfully!',
          type: 'success'
        });
        setShowAlert(true);
        setTimeout(() => {
          navigation.goBack();
        }, 1500);
      } else {
        const errorMessage = typeof response.error === 'string' 
          ? response.error 
          : (response.error?.message || JSON.stringify(response.error) || 'Failed to save price policy');
        setAlertConfig({
          title: 'Error',
          message: errorMessage,
          type: 'error'
        });
        setShowAlert(true);
      }
    } catch (error) {
      console.error('Error saving price policy:', error);
      setAlertConfig({
        title: 'Error',
        message: 'An unexpected error occurred',
        type: 'error'
      });
      setShowAlert(true);
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
      <CustomAlert
        visible={showAlert}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setShowAlert(false)}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Price Policy</Text>
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.PRIMARY} />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
          <Text style={styles.inputLabel}>Policy *</Text>
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
          <Text style={styles.inputLabel}>Wholesale Price (VND) *</Text>
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
      </ScrollView>

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
                <Text style={styles.modalCloseButton}>✕</Text>
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
                <Text style={styles.modalCloseButton}>✕</Text>
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
    padding: SIZES.PADDING.LARGE,
    paddingTop: SIZES.PADDING.XXXLARGE,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backIcon: { fontSize: 24, color: COLORS.PRIMARY, fontWeight: 'bold' },
  headerTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
  saveButton: {
    paddingHorizontal: SIZES.PADDING.LARGE,
    paddingVertical: SIZES.PADDING.SMALL,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: SIZES.RADIUS.SMALL,
  },
  saveButtonDisabled: { opacity: 0.5 },
  saveButtonText: { color: COLORS.TEXT.WHITE, fontWeight: '600' },
  content: { padding: SIZES.PADDING.LARGE },
  inputGroup: { marginBottom: SIZES.PADDING.LARGE },
  inputLabel: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: '600',
    color: COLORS.TEXT.WHITE,
    marginBottom: SIZES.PADDING.SMALL,
  },
  textInput: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.LARGE,
    padding: SIZES.PADDING.MEDIUM,
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  inputError: { borderWidth: 1, borderColor: COLORS.ERROR },
  errorText: { color: COLORS.ERROR, fontSize: SIZES.FONT.SMALL, marginTop: 4 },
  readOnlyInput: {
    backgroundColor: "#BABABA",
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
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.LARGE,
    padding: SIZES.PADDING.MEDIUM,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  modalCloseButton: { fontSize: 24, color: COLORS.TEXT.SECONDARY },
  modalItem: { padding: SIZES.PADDING.MEDIUM, borderBottomWidth: 1, borderBottomColor: '#EFEFEF' },
  modalItemText: { fontSize: SIZES.FONT.MEDIUM, color: COLORS.TEXT.PRIMARY },
});

export default EditPricePolicyScreen;
