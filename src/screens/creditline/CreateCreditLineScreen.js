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
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { COLORS, SIZES } from '../../constants';
import CustomAlert from '../../components/common/CustomAlert';
import creditLineService from '../../services/creditLineService';
import agencyService from '../../services/agencyService';
import { ArrowLeft, ChevronDown, X } from 'lucide-react-native';

const CreateCreditLineScreen = ({ navigation, route }) => {
  const creditLine = route?.params?.creditLine;
  const isEditMode = !!creditLine;
  
  const [loading, setLoading] = useState(false);
  const [agencies, setAgencies] = useState([]);
  const [agencyModalVisible, setAgencyModalVisible] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'info' });
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [pendingSubmissionData, setPendingSubmissionData] = useState(null);

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

  const submitCreditLine = async (submissionData) => {
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

  const handleSubmit = () => {
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

    setErrors({});
    setPendingSubmissionData(submissionData);
    setConfirmVisible(true);
  };

  const selectedAgency = agencies.find(a => a.id.toString() === formData.agencyId);

  return (
    <SafeAreaView style={styles.container}>
      <CustomAlert
        visible={showAlert}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setShowAlert(false)}
      />
      <CustomAlert
        visible={confirmVisible}
        title={isEditMode ? 'Confirm Update' : 'Confirm Creation'}
        message={isEditMode ? 'Are you sure you want to save the changes to this credit line?' : 'Are you sure you want to create this credit line?'}
        type="warning"
        showCancel
        confirmText={isEditMode ? 'Save' : 'Create'}
        cancelText="Cancel"
        onConfirm={() => {
          setConfirmVisible(false);
          if (pendingSubmissionData) {
            submitCreditLine(pendingSubmissionData);
            setPendingSubmissionData(null);
          }
        }}
        onCancel={() => {
          setConfirmVisible(false);
          setPendingSubmissionData(null);
        }}
        onClose={() => {
          setConfirmVisible(false);
          setPendingSubmissionData(null);
        }}
      />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={20} color={COLORS.TEXT.WHITE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditMode ? 'Edit Credit Line' : 'Create Credit Line'}
        </Text>
        <View style={styles.headerActions} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={styles.content}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.contentInner}
          >
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
        </View>
      </KeyboardAvoidingView>
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.TEXT.WHITE} />
          ) : (
            <Text style={styles.submitButtonText}>
              {isEditMode ? 'Save Changes' : 'Save Credit Line'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
  },
  flex: {
    flex: 1,
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
    borderRadius: SIZES.RADIUS.ROUND,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
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
  saveButton: {
    width: 40,
    height: 40,
    borderRadius: SIZES.RADIUS.ROUND,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#009DFF',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.SURFACE,
    borderTopLeftRadius: SIZES.RADIUS.XXLARGE,
    borderTopRightRadius: SIZES.RADIUS.XXLARGE,
  },
  contentInner: {
    padding: SIZES.PADDING.LARGE,
    paddingBottom: SIZES.PADDING.XXXLARGE,
  },
  section: {
    marginBottom: SIZES.PADDING.LARGE,
  },
  label: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SIZES.PADDING.SMALL,
    fontWeight: '600',
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
    backgroundColor: '#F5F5F5',
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.MEDIUM,
    borderWidth: 1,
    borderColor: COLORS.BORDER.PRIMARY,
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
    backgroundColor: '#F5F5F5',
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingVertical: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.BORDER.PRIMARY,
  },
  statusButtonActive: {
    borderColor: 'transparent',
  },
  statusButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
  },
  statusButtonTextActive: {
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: SIZES.PADDING.LARGE,
    paddingBottom: Platform.OS === 'ios' ? SIZES.PADDING.XLARGE : SIZES.PADDING.LARGE,
    paddingTop: SIZES.PADDING.MEDIUM,
    backgroundColor: COLORS.SURFACE,
  },
  submitButton: {
    backgroundColor: '#009DFF',
    borderRadius: SIZES.RADIUS.LARGE,
    paddingVertical: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.SURFACE,
    borderTopLeftRadius: SIZES.RADIUS.XXLARGE,
    borderTopRightRadius: SIZES.RADIUS.XXLARGE,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.PADDING.LARGE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER.PRIMARY,
  },
  modalTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
  },
  modalItem: {
    padding: SIZES.PADDING.LARGE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER.PRIMARY,
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

