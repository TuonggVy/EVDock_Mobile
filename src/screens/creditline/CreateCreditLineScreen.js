import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { COLORS, SIZES } from '../../constants';
import CustomAlert from '../../components/common/CustomAlert';
import creditLineService from '../../services/creditLineService';
import agencyService from '../../services/agencyService';
import { ArrowLeft, Save, ChevronDown, X } from 'lucide-react-native';

const CreateCreditLineScreen = ({ navigation, route }) => {
  const creditLine = route?.params?.creditLine;
  const isEditMode = !!creditLine;
  
  const [loading, setLoading] = useState(false);
  const [agencies, setAgencies] = useState([]);
  const [agencyModalVisible, setAgencyModalVisible] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'info' });

  const [formData, setFormData] = useState({
    agencyId: '',
    creditLimit: '',
    warningThreshold: '80',
    overDueThreshHoldDays: '30',
    isBlocked: false,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadAgencies();
    
    if (isEditMode && creditLine) {
      // Pre-fill form with credit line data
      setFormData({
        agencyId: creditLine.agencyId?.toString() || '',
        creditLimit: creditLine.creditLimit?.toString() || '',
        warningThreshold: creditLine.warningThreshold?.toString() || '80',
        overDueThreshHoldDays: creditLine.overDueThreshHoldDays?.toString() || '30',
        isBlocked: creditLine.isBlocked || false,
      });
    }
  }, [creditLine]);

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

  const handleAgencySelect = (agency) => {
    setFormData(prev => ({ ...prev, agencyId: agency.id.toString() }));
    setAgencyModalVisible(false);
  };

  const handleSubmit = async () => {
    setErrors({});
    
    const submissionData = {
      ...formData,
      creditLimit: parseFloat(formData.creditLimit),
      warningThreshold: parseFloat(formData.warningThreshold),
      overDueThreshHoldDays: parseInt(formData.overDueThreshHoldDays),
      agencyId: parseInt(formData.agencyId),
    };

    const validation = creditLineService.validateCreditLine(submissionData);
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setLoading(true);
    
    try {
      let response;
      if (isEditMode) {
        response = await creditLineService.updateCreditLine(creditLine.id, submissionData);
      } else {
        response = await creditLineService.createCreditLine(submissionData);
      }

      if (response.success) {
        setAlertConfig({
          title: 'Success',
          message: isEditMode ? 'Credit line updated successfully!' : 'Credit line created successfully!',
          type: 'success'
        });
        setShowAlert(true);
        setTimeout(() => {
          navigation.goBack();
        }, 1500);
      } else {
        const errorMessage = typeof response.error === 'string' 
          ? response.error 
          : (response.error?.message || JSON.stringify(response.error) || 'Failed to save credit line');
        setAlertConfig({
          title: 'Error',
          message: errorMessage,
          type: 'error'
        });
        setShowAlert(true);
      }
    } catch (error) {
      console.error('Error saving credit line:', error);
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

  const selectedAgency = agencies.find(a => a.id.toString() === formData.agencyId);

  return (
    <View style={styles.container}>
      <CustomAlert
        visible={showAlert}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setShowAlert(false)}
      />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={20} color={COLORS.TEXT.SECONDARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditMode ? 'Edit Credit Line' : 'Create Credit Line'}
        </Text>
        <TouchableOpacity onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.PRIMARY} />
          ) : (
            <Save size={20} color={COLORS.PRIMARY} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Agency Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>Agency *</Text>
          <TouchableOpacity
            style={[styles.selectButton, errors.agencyId && styles.inputError]}
            onPress={() => setAgencyModalVisible(true)}
            disabled={isEditMode}
          >
            <Text style={[
              styles.selectButtonText,
              !selectedAgency && styles.selectButtonTextPlaceholder
            ]}>
              {selectedAgency 
                ? `${selectedAgency.name}${selectedAgency.location ? ` - ${selectedAgency.location}` : ''}`
                : 'Select agency'}
            </Text>
            {!isEditMode && <ChevronDown size={20} color={COLORS.TEXT.SECONDARY} />}
          </TouchableOpacity>
          {errors.agencyId && <Text style={styles.errorText}>{errors.agencyId}</Text>}
        </View>

        {/* Credit Limit */}
        <View style={styles.section}>
          <Text style={styles.label}>Credit Limit (VND) *</Text>
          <TextInput
            style={[styles.input, errors.creditLimit && styles.inputError]}
            value={formData.creditLimit}
            onChangeText={(text) => setFormData(prev => ({ ...prev, creditLimit: text.replace(/[^0-9]/g, '') }))}
            placeholder="Enter credit limit"
            placeholderTextColor={COLORS.TEXT.SECONDARY}
            keyboardType="numeric"
          />
          {errors.creditLimit && <Text style={styles.errorText}>{errors.creditLimit}</Text>}
          {formData.creditLimit && !errors.creditLimit && (
            <Text style={styles.hintText}>
              {creditLineService.formatCreditLimit(parseFloat(formData.creditLimit) || 0)}
            </Text>
          )}
        </View>

        {/* Warning Threshold */}
        <View style={styles.section}>
          <Text style={styles.label}>Warning Threshold (%) *</Text>
          <TextInput
            style={[styles.input, errors.warningThreshold && styles.inputError]}
            value={formData.warningThreshold}
            onChangeText={(text) => setFormData(prev => ({ ...prev, warningThreshold: text.replace(/[^0-9]/g, '') }))}
            placeholder="Enter warning threshold (0-100)"
            placeholderTextColor={COLORS.TEXT.SECONDARY}
            keyboardType="numeric"
          />
          {errors.warningThreshold && <Text style={styles.errorText}>{errors.warningThreshold}</Text>}
          <Text style={styles.hintText}>
            Alert when credit usage reaches this percentage
          </Text>
        </View>

        {/* Overdue Threshold Days */}
        <View style={styles.section}>
          <Text style={styles.label}>Overdue Threshold (Days) *</Text>
          <TextInput
            style={[styles.input, errors.overDueThreshHoldDays && styles.inputError]}
            value={formData.overDueThreshHoldDays}
            onChangeText={(text) => setFormData(prev => ({ ...prev, overDueThreshHoldDays: text.replace(/[^0-9]/g, '') }))}
            placeholder="Enter overdue threshold in days"
            placeholderTextColor={COLORS.TEXT.SECONDARY}
            keyboardType="numeric"
          />
          {errors.overDueThreshHoldDays && <Text style={styles.errorText}>{errors.overDueThreshHoldDays}</Text>}
          <Text style={styles.hintText}>
            Number of days after which payment is considered overdue
          </Text>
        </View>

        {/* Blocked Status (Edit mode only) */}
        {isEditMode && (
          <View style={styles.section}>
            <Text style={styles.label}>Status</Text>
            <View style={styles.statusButtons}>
              <TouchableOpacity
                style={[
                  styles.statusButton,
                  !formData.isBlocked && [styles.statusButtonActive, { backgroundColor: COLORS.SUCCESS }]
                ]}
                onPress={() => setFormData(prev => ({ ...prev, isBlocked: false }))}
              >
                <Text style={[
                  styles.statusButtonText,
                  !formData.isBlocked && styles.statusButtonTextActive
                ]}>
                  Active
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.statusButton,
                  formData.isBlocked && [styles.statusButtonActive, { backgroundColor: COLORS.ERROR }]
                ]}
                onPress={() => setFormData(prev => ({ ...prev, isBlocked: true }))}
              >
                <Text style={[
                  styles.statusButtonText,
                  formData.isBlocked && styles.statusButtonTextActive
                ]}>
                  Blocked
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Agency Selection Modal */}
      <Modal
        visible={agencyModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAgencyModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Agency</Text>
              <TouchableOpacity onPress={() => setAgencyModalVisible(false)}>
                <X size={20} color={COLORS.TEXT.SECONDARY} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {agencies.map((agency) => (
                <TouchableOpacity
                  key={agency.id}
                  style={styles.modalItem}
                  onPress={() => handleAgencySelect(agency)}
                >
                  <Text style={styles.modalItemText}>{agency.name}</Text>
                  {agency.location && (
                    <Text style={styles.modalItemSubtext}>{agency.location}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
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
    padding: SIZES.PADDING.LARGE,
    paddingTop: SIZES.PADDING.XXXLARGE,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
  },
  headerTitle: {
    fontSize: SIZES.FONT.HEADER,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
  content: {
    flex: 1,
    padding: SIZES.PADDING.LARGE,
  },
  section: {
    marginBottom: SIZES.PADDING.LARGE,
  },
  label: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.WHITE,
    marginBottom: SIZES.PADDING.SMALL,
    fontWeight: '600',
  },
  input: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
  },
  inputError: {
    borderWidth: 1,
    borderColor: COLORS.ERROR,
  },
  errorText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.ERROR,
    marginTop: SIZES.PADDING.XSMALL,
  },
  hintText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    marginTop: SIZES.PADDING.XSMALL,
    fontStyle: 'italic',
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
  },
  selectButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
    flex: 1,
  },
  selectButtonTextPlaceholder: {
    color: COLORS.TEXT.SECONDARY,
  },
  statusButtons: {
    flexDirection: 'row',
    gap: SIZES.PADDING.MEDIUM,
  },
  statusButton: {
    flex: 1,
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
  },
  statusButtonActive: {
    opacity: 0.8,
  },
  statusButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
  },
  statusButtonTextActive: {
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.SURFACE,
    borderTopLeftRadius: SIZES.RADIUS.XLARGE,
    borderTopRightRadius: SIZES.RADIUS.XLARGE,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.PADDING.LARGE,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  modalTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
  },
  modalItem: {
    padding: SIZES.PADDING.LARGE,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  modalItemText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '600',
  },
  modalItemSubtext: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    marginTop: SIZES.PADDING.XSMALL,
  },
});

export default CreateCreditLineScreen;

