import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { COLORS, SIZES } from '../../constants';
import { useCustomAlert } from '../../hooks/useCustomAlert';

const ACCENT_COLOR = '#009DFF';

const UpdateStatusModal = ({ visible, onClose, orderId, currentStatus, nextStatus, onSuccess, title }) => {
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const { showError, showSuccess } = useCustomAlert();

  const getStatusLabel = (status) => {
    const statusMap = {
      'PENDING': 'Pending',
      'APPROVED': 'Approved',
      'DELIVERED': 'Delivered',
      'CANCELED': 'Canceled',
    };
    return statusMap[status] || status;
  };

  const handleUpdate = async () => {
    if (!orderId || !nextStatus) {
      showError('Error', 'Missing required information');
      return;
    }

    try {
      setLoading(true);
      const orderRestockService = require('../../services/orderRestockService').default;
      const response = await orderRestockService.updateOrderRestockStatus(
        orderId,
        nextStatus,
        note.trim() || null
      );

      if (response.success) {
        const successMessage = nextStatus === 'CANCELED' 
          ? 'Order canceled successfully!' 
          : 'Status updated successfully!';
        showSuccess('Success', successMessage);
        setNote('');
        if (onSuccess) {
          onSuccess();
        }
        onClose();
      } else {
        const errorMessage = nextStatus === 'CANCELED'
          ? response.error || 'Cannot cancel order'
          : response.error || 'Cannot update status';
        showError('Error', errorMessage);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      showError('Error', 'Cannot update status');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setNote('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleCancel}
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{title || 'Update Status'}</Text>
            <TouchableOpacity
              style={[styles.saveButton, loading && styles.saveButtonDisabled]}
              onPress={handleUpdate}
              disabled={loading}
            >
              <Text style={styles.saveButtonText}>
                {loading ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            keyboardShouldPersistTaps="handled"
          >
            {/* Status Info */}
            <View style={styles.statusInfoCard}>
              <Text style={styles.statusInfoLabel}>Current Status:</Text>
              <Text style={styles.statusInfoValue}>{getStatusLabel(currentStatus)}</Text>
            </View>

            <View style={styles.statusInfoCard}>
              <Text style={styles.statusInfoLabel}>New Status:</Text>
              <Text style={[styles.statusInfoValue, styles.newStatusValue]}>
                {getStatusLabel(nextStatus)}
              </Text>
            </View>

            {/* Note Input */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Note (Optional)</Text>
              <TextInput
                style={styles.noteInput}
                placeholder="Enter a note for this status update..."
                placeholderTextColor={COLORS.TEXT.SECONDARY}
                value={note}
                onChangeText={setNote}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                editable={!loading}
              />
              <Text style={styles.helperText}>
                Add any additional information about this status change
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.PADDING.LARGE,
    paddingTop: Platform.OS === 'ios' ? SIZES.PADDING.MEDIUM : SIZES.PADDING.LARGE,
    paddingBottom: SIZES.PADDING.MEDIUM,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  cancelButton: {
    paddingVertical: SIZES.PADDING.SMALL,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
  },
  cancelButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
  },
  headerTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    paddingVertical: SIZES.PADDING.SMALL,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    borderRadius: SIZES.RADIUS.SMALL,
    backgroundColor: ACCENT_COLOR,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.SURFACE,
  },
  contentContainer: {
    padding: SIZES.PADDING.LARGE,
  },
  statusInfoCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
    marginBottom: SIZES.PADDING.MEDIUM,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statusInfoLabel: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: SIZES.PADDING.XSMALL,
  },
  statusInfoValue: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
  },
  newStatusValue: {
    color: ACCENT_COLOR,
  },
  section: {
    marginTop: SIZES.PADDING.MEDIUM,
  },
  sectionTitle: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SIZES.PADDING.SMALL,
  },
  noteInput: {
    backgroundColor: "#D9D9D9",
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
    minHeight: 120,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  helperText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    marginTop: SIZES.PADDING.SMALL,
  },
});

export default UpdateStatusModal;

