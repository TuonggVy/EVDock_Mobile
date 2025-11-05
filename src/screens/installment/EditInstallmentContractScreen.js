import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES } from '../../constants';
import { ArrowLeft } from 'lucide-react-native';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import installmentContractService from '../../services/installmentContractService';
import LoadingScreen from '../../components/common/LoadingScreen';

const EditInstallmentContractScreen = ({ navigation, route }) => {
  const { installmentContractId } = route.params || {};
  const { alertConfig, hideAlert, showError, showSuccess } = useCustomAlert();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [contractDetail, setContractDetail] = useState(null);

  const statusOptions = ['ACTIVE', 'COMPLETED', 'OVERDUE'];
  const penaltyTypeOptions = ['DAILY', 'FIXED'];

  const [formData, setFormData] = useState({
    penaltyValue: '',
    penaltyType: 'FIXED',
    status: 'ACTIVE',
  });

  useEffect(() => {
    loadContractDetail();
  }, [installmentContractId]);

  const loadContractDetail = async () => {
    try {
      setLoadingData(true);
      const response = await installmentContractService.getInstallmentContractDetail(installmentContractId);
      if (response.success && response.data) {
        setContractDetail(response.data);
        // Pre-fill form with existing data
        const currentStatus = response.data.status || 'ACTIVE';
        // Ensure status is one of the valid options
        const validStatus = statusOptions.includes(currentStatus) ? currentStatus : 'ACTIVE';
        const currentPenaltyType = response.data.penaltyType || 'FIXED';
        // Ensure penaltyType is one of the valid options
        const validPenaltyType = penaltyTypeOptions.includes(currentPenaltyType) ? currentPenaltyType : 'FIXED';
        setFormData({
          penaltyValue: response.data.penaltyValue?.toString() || '',
          penaltyType: validPenaltyType,
          status: validStatus,
        });
      } else {
        showError('Error', response.error || 'Failed to load installment contract details');
        setTimeout(() => navigation.goBack(), 2000);
      }
    } catch (error) {
      console.error('Error loading installment contract:', error);
      showError('Error', 'Failed to load installment contract details');
      setTimeout(() => navigation.goBack(), 2000);
    } finally {
      setLoadingData(false);
    }
  };

  const updateField = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.penaltyValue || parseFloat(formData.penaltyValue) <= 0) {
      showError('Error', 'Please enter a valid penalty value');
      return;
    }

    try {
      setLoading(true);

      const payload = {
        penaltyValue: parseFloat(formData.penaltyValue),
        penaltyType: formData.penaltyType,
        status: formData.status,
      };

      const response = await installmentContractService.updateInstallmentContract(installmentContractId, payload);

      if (response.success) {
        showSuccess('Success', response.message || 'Installment contract updated successfully');
        setTimeout(() => {
          navigation.navigate('InstallmentContractDetail', { installmentContractId });
        }, 1500);
      } else {
        showError('Error', response.error || 'Failed to update installment contract');
      }
    } catch (error) {
      console.error('Error updating installment contract:', error);
      showError('Error', 'Failed to update installment contract');
    } finally {
      setLoading(false);
    }
  };

  if (loading || loadingData) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <ArrowLeft color={COLORS.TEXT.WHITE} size={24} />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={styles.title}>Edit Installment Contract</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.formSection}>
          {/* Penalty Value */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Penalty Value *</Text>
            <TextInput
              style={styles.input}
              value={formData.penaltyValue}
              onChangeText={(text) => updateField('penaltyValue', text)}
              placeholder="Enter penalty value"
              placeholderTextColor={COLORS.TEXT.SECONDARY}
              keyboardType="numeric"
            />
          </View>

          {/* Penalty Type */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Penalty Type *</Text>
            <View style={styles.typeSelector}>
              {penaltyTypeOptions.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeOption,
                    formData.penaltyType === type && styles.typeOptionSelected
                  ]}
                  onPress={() => updateField('penaltyType', type)}
                >
                  <Text style={[
                    styles.typeOptionText,
                    formData.penaltyType === type && styles.typeOptionTextSelected
                  ]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Status */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Status *</Text>
            <View style={styles.typeSelector}>
              {statusOptions.map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.typeOption,
                    formData.status === status && styles.typeOptionSelected
                  ]}
                  onPress={() => updateField('status', status)}
                >
                  <Text style={[
                    styles.typeOptionText,
                    formData.status === status && styles.typeOptionTextSelected
                  ]}>
                    {status}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <LinearGradient colors={COLORS.GRADIENT.GREEN} style={styles.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={styles.buttonText}>Update Contract</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
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
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
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
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: SIZES.FONT.XXLARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SIZES.PADDING.LARGE,
  },
  formSection: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.LARGE,
    padding: SIZES.PADDING.LARGE,
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
  input: {
    backgroundColor: '#E5E7EB',
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
    borderWidth: 1,
    borderColor: COLORS.BORDER.PRIMARY,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: SIZES.PADDING.SMALL,
    flexWrap: 'wrap',
  },
  typeOption: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: '#E5E7EB',
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.BORDER.PRIMARY,
  },
  typeOptionSelected: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
  },
  typeOptionText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '500',
  },
  typeOptionTextSelected: {
    color: COLORS.PRIMARY,
    fontWeight: '700',
  },
  footer: {
    padding: SIZES.PADDING.LARGE,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
    borderTopWidth: 1,
    borderTopColor: COLORS.BACKGROUND.SECONDARY,
  },
  submitButton: {
    borderRadius: SIZES.RADIUS.LARGE,
    overflow: 'hidden',
  },
  buttonGradient: {
    padding: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
});

export default EditInstallmentContractScreen;
