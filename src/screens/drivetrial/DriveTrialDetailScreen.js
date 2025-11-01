import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES } from '../../constants';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import driveTrialService from '../../services/driveTrialService';
import LoadingScreen from '../../components/common/LoadingScreen';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Mail, 
  Phone, 
  User,
  Check,
  Pencil,
  Trash
} from 'lucide-react-native';

const DriveTrialDetailScreen = ({ navigation, route }) => {
  const { bookingId, updateStatus } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [booking, setBooking] = useState(null);
  const { alertConfig, hideAlert, showError, showInfo, showSuccess, showConfirm } = useCustomAlert();
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => {
    loadBookingDetail();
    if (updateStatus) {
      setShowStatusModal(true);
    }
  }, [bookingId, updateStatus]);

  const loadBookingDetail = async () => {
    try {
      setLoading(true);
      const response = await driveTrialService.getDriveTrialDetail(bookingId);
      
      if (response.success && response.data) {
        setBooking(response.data);
        setNewStatus(response.data.status);
      } else {
        showError('Error', response.error || 'Failed to load booking details');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading booking detail:', error);
      showError('Error', 'Failed to load booking details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    try {
      setUpdating(true);
      const response = await driveTrialService.updateDriveTrial(bookingId, {
        status: newStatus,
      });

      if (response.success) {
        showSuccess('Success', 'Status updated successfully');
        setShowStatusModal(false);
        loadBookingDetail();
      } else {
        showError('Error', response.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      showError('Error', 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = () => {
    showConfirm(
      'Delete Booking',
      `Are you sure you want to delete this booking for "${booking?.fullname}"?`,
      deleteBooking
    );
  };

  const deleteBooking = async () => {
    try {
      setLoading(true);
      const response = await driveTrialService.deleteDriveTrial(bookingId);

      if (response.success) {
        showSuccess('Success', 'Booking deleted successfully');
        setTimeout(() => {
          navigation.goBack();
        }, 1500);
      } else {
        showError('Error', response.error || 'Failed to delete booking');
      }
    } catch (error) {
      console.error('Error deleting booking:', error);
      showError('Error', 'Failed to delete booking');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return timeString;
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return '#FF9800';
      case 'ACCEPTED':
        return '#4CAF50';
      case 'COMPLETED':
        return '#2196F3';
      case 'CANCELED':
        return '#F44336';
      default:
        return COLORS.TEXT.SECONDARY;
    }
  };

  const getStatusText = (status) => {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return 'Pending';
      case 'ACCEPTED':
        return 'Accepted';
      case 'COMPLETED':
        return 'Completed';
      case 'CANCELED':
        return 'Canceled';
      default:
        return status || 'Unknown';
    }
  };

  const statusOptions = [
    { value: 'PENDING', label: 'Pending' },
    { value: 'ACCEPTED', label: 'Accepted' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CANCELED', label: 'Canceled' },
  ];

  if (loading) {
    return <LoadingScreen />;
  }

  if (!booking) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft color="#FFFFFF" size={18} />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={styles.title}>Booking Details</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Booking Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {booking.fullname?.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
            <View style={styles.cardHeaderInfo}>
              <Text style={styles.customerName}>{booking.fullname}</Text>
              <View style={styles.statusBadge}>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(booking.status) }]} />
                <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
                  {getStatusText(booking.status)}
                </Text>
              </View>
            </View>
          </View>

          {/* Display Mode */}
          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <View style={styles.infoLabelContainer}>
                <Mail size={14} color={COLORS.TEXT.SECONDARY} />
                <Text style={styles.infoLabel}> Email</Text>
              </View>
              <Text style={styles.infoValue}>{booking.email || 'N/A'}</Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoLabelContainer}>
                <Phone size={14} color={COLORS.TEXT.SECONDARY} />
                <Text style={styles.infoLabel}> Phone</Text>
              </View>
              <Text style={styles.infoValue}>{booking.phone || 'N/A'}</Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoLabelContainer}>
                <Calendar size={14} color={COLORS.TEXT.SECONDARY} />
                <Text style={styles.infoLabel}> Drive Date</Text>
              </View>
              <Text style={styles.infoValue}>{formatDate(booking.driveDate)}</Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoLabelContainer}>
                <Clock size={14} color={COLORS.TEXT.SECONDARY} />
                <Text style={styles.infoLabel}> Drive Time</Text>
              </View>
              <Text style={styles.infoValue}>{formatTime(booking.driveTime)}</Text>
            </View>

            {booking.electricMotorbikeId && (
              <View style={styles.infoRow}>
                <View style={styles.infoLabelContainer}>
                  <User size={14} color={COLORS.TEXT.SECONDARY} />
                  <Text style={styles.infoLabel}> Vehicle ID</Text>
                </View>
                <Text style={styles.infoValue}>#{booking.electricMotorbikeId}</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons at Bottom */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.statusButton}
          onPress={() => setShowStatusModal(true)}
          disabled={updating}
        >
          <LinearGradient
            colors={[getStatusColor(booking.status), getStatusColor(booking.status)]}
            style={styles.buttonGradient}
          >
            <View style={styles.buttonContent}>
              <Pencil size={14} color="#FFFFFF" />
              <Text style={styles.buttonText}> Update Status</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          disabled={loading}
        >
          <View style={styles.deleteButtonContent}>
            {loading ? (
              <Text style={styles.deleteButtonText}>Deleting...</Text>
            ) : (
              <>
                <Trash size={14} color={COLORS.TEXT.WHITE} />
                <Text style={styles.deleteButtonText}> Delete</Text>
              </>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* Status Update Modal */}
      <Modal
        visible={showStatusModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowStatusModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowStatusModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Update Status</Text>
                
                <View style={styles.statusOptionsContainer}>
                  {statusOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.statusOptionButton,
                        newStatus === option.value && styles.statusOptionButtonActive,
                      ]}
                      onPress={() => setNewStatus(option.value)}
                    >
                      <Text
                        style={[
                          styles.statusOptionText,
                          newStatus === option.value && styles.statusOptionTextActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                      {newStatus === option.value && (
                        <Check size={16} color="#FFFFFF" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonCancel]}
                    onPress={() => setShowStatusModal(false)}
                  >
                    <Text style={styles.modalButtonCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonConfirm]}
                    onPress={handleUpdateStatus}
                    disabled={updating}
                  >
                    {updating ? (
                      <Text style={styles.modalButtonConfirmText}>Updating...</Text>
                    ) : (
                      <Text style={styles.modalButtonConfirmText}>Confirm</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <CustomAlert config={alertConfig} onDismiss={hideAlert} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
  },
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
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  title: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SIZES.PADDING.LARGE,
    paddingTop: SIZES.PADDING.LARGE,
    paddingBottom: SIZES.PADDING.LARGE,
  },
  infoCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.LARGE,
    padding: SIZES.PADDING.LARGE,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.PADDING.LARGE,
    paddingBottom: SIZES.PADDING.LARGE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER.PRIMARY,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.PADDING.MEDIUM,
  },
  avatarText: {
    fontSize: SIZES.FONT.XXLARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
  cardHeaderInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: SIZES.FONT.XXLARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: '600',
  },
  infoSection: {
    marginTop: SIZES.PADDING.MEDIUM,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.PADDING.LARGE,
  },
  infoLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoLabel: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
    marginLeft: 6,
  },
  infoValue: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },
  bottomActions: {
    paddingHorizontal: SIZES.PADDING.LARGE,
    paddingVertical: SIZES.PADDING.MEDIUM,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER.PRIMARY,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
    gap: SIZES.PADDING.SMALL,
  },
  statusButton: {
    borderRadius: SIZES.RADIUS.LARGE,
    overflow: 'hidden',
  },
  buttonGradient: {
    paddingVertical: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
    marginLeft: 6,
  },
  deleteButton: {
    backgroundColor: '#F44336',
    borderRadius: SIZES.RADIUS.LARGE,
    paddingVertical: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
  },
  deleteButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
    marginLeft: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.SURFACE,
    borderTopLeftRadius: SIZES.RADIUS.XXLARGE,
    borderTopRightRadius: SIZES.RADIUS.XXLARGE,
    padding: SIZES.PADDING.LARGE,
  },
  modalTitle: {
    fontSize: SIZES.FONT.XLARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SIZES.PADDING.LARGE,
  },
  statusOptionsContainer: {
    marginBottom: SIZES.PADDING.LARGE,
  },
  statusOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SIZES.PADDING.MEDIUM,
    borderRadius: SIZES.RADIUS.MEDIUM,
    backgroundColor: COLORS.SURFACE,
    marginBottom: SIZES.PADDING.SMALL,
    borderWidth: 1,
    borderColor: COLORS.BORDER.PRIMARY,
  },
  statusOptionButtonActive: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  statusOptionText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '600',
  },
  statusOptionTextActive: {
    color: COLORS.TEXT.WHITE,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: SIZES.PADDING.SMALL,
  },
  modalButton: {
    flex: 1,
    paddingVertical: SIZES.PADDING.MEDIUM,
    borderRadius: SIZES.RADIUS.LARGE,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1,
    borderColor: COLORS.BORDER.PRIMARY,
  },
  modalButtonCancelText: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
  },
  modalButtonConfirm: {
    backgroundColor: COLORS.PRIMARY,
  },
  modalButtonConfirmText: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: '600',
    color: COLORS.TEXT.WHITE,
  },
});

export default DriveTrialDetailScreen;

