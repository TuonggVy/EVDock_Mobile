import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { COLORS, SIZES } from '../../constants';
import CustomAlert from '../../components/common/CustomAlert';
import creditLineService from '../../services/creditLineService';
import { ArrowLeft, Save } from 'lucide-react-native';

const EVMStaffCreditLineEditScreen = ({ navigation, route }) => {
  const creditLine = route?.params?.creditLine;
  
  const [loading, setLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'info' });

  const [formData, setFormData] = useState({
    creditLimit: '',
    warningThreshold: '80',
    overDueThreshHoldDays: '30',
    isBlocked: false,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (creditLine) {
      // Pre-fill form with credit line data
      setFormData({
        creditLimit: creditLine.creditLimit?.toString() || '',
        warningThreshold: creditLine.warningThreshold?.toString() || '80',
        overDueThreshHoldDays: creditLine.overDueThreshHoldDays?.toString() || '30',
        isBlocked: creditLine.isBlocked || false,
      });
    }
  }, [creditLine]);

  const handleSubmit = async () => {
    setErrors({});
    
    const submissionData = {
      creditLimit: parseFloat(formData.creditLimit),
      warningThreshold: parseFloat(formData.warningThreshold),
      overDueThreshHoldDays: parseInt(formData.overDueThreshHoldDays),
      isBlocked: formData.isBlocked,
    };

    // Validate credit limit
    if (!formData.creditLimit || submissionData.creditLimit <= 0) {
      setErrors({ creditLimit: 'Credit limit must be greater than 0' });
      return;
    }

    // Validate warning threshold
    if (!formData.warningThreshold || submissionData.warningThreshold < 0 || submissionData.warningThreshold > 100) {
      setErrors({ warningThreshold: 'Warning threshold must be between 0 and 100' });
      return;
    }

    // Validate overdue threshold
    if (!formData.overDueThreshHoldDays || submissionData.overDueThreshHoldDays < 0) {
      setErrors({ overDueThreshHoldDays: 'Overdue threshold days must be 0 or greater' });
      return;
    }

    setLoading(true);
    
    try {
      const response = await creditLineService.updateCreditLine(creditLine.id, submissionData);

      if (response.success) {
        setAlertConfig({
          title: 'Success',
          message: 'Credit line updated successfully!',
          type: 'success'
        });
        setShowAlert(true);
        setTimeout(() => {
          navigation.goBack();
        }, 1500);
      } else {
        const errorMessage = typeof response.error === 'string' 
          ? response.error 
          : (response.error?.message || JSON.stringify(response.error) || 'Failed to update credit line');
        setAlertConfig({
          title: 'Error',
          message: errorMessage,
          type: 'error'
        });
        setShowAlert(true);
      }
    } catch (error) {
      console.error('Error updating credit line:', error);
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
        <Text style={styles.headerTitle}>Edit Credit Line</Text>
        <TouchableOpacity onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.PRIMARY} />
          ) : (
            <Save size={20} color={COLORS.PRIMARY} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Agency Display (Read-only) */}
        <View style={styles.section}>
          <Text style={styles.label}>Agency</Text>
          <View style={styles.readOnlyField}>
            <Text style={styles.readOnlyText}>
              {creditLine?.agency?.name || `Agency #${creditLine?.agencyId || 'N/A'}`}
            </Text>
          </View>
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

        {/* Blocked Status */}
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
      </ScrollView>
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
  readOnlyField: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
    opacity: 0.6,
  },
  readOnlyText: {
    fontSize: SIZES.FONT.MEDIUM,
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
});

export default EVMStaffCreditLineEditScreen;

