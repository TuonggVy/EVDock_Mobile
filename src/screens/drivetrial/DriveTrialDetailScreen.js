import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
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
  X,
  Trash
} from 'lucide-react-native';

const DriveTrialDetailScreen = ({ navigation, route }) => {
  const { bookingId } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [booking, setBooking] = useState(null);
  const { alertConfig, hideAlert, showError, showInfo, showSuccess, showConfirm } = useCustomAlert();

  useEffect(() => {
    loadBookingDetail();
  }, [bookingId]);

  const loadBookingDetail = async () => {
    try {
      setLoading(true);
      const response = await driveTrialService.getDriveTrialDetail(bookingId);
      
      if (response.success && response.data) {
        setBooking(response.data);
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

  const handleAccept = async () => {
    try {
      setUpdating(true);
      const response = await driveTrialService.updateDriveTrial(bookingId, {
        status: 'ACCEPTED',
      });

      if (response.success) {
        showSuccess('Success', 'Booking accepted successfully');
        loadBookingDetail();
      } else {
        showError('Error', response.error || 'Failed to accept booking');
      }
    } catch (error) {
      console.error('Error accepting booking:', error);
      showError('Error', 'Failed to accept booking');
    } finally {
      setUpdating(false);
    }
  };

  const handleComplete = async () => {
    try {
      setUpdating(true);
      const response = await driveTrialService.updateDriveTrial(bookingId, {
        status: 'COMPLETED',
      });

      if (response.success) {
        showSuccess('Success', 'Booking completed successfully');
        loadBookingDetail();
      } else {
        showError('Error', response.error || 'Failed to complete booking');
      }
    } catch (error) {
      console.error('Error completing booking:', error);
      showError('Error', 'Failed to complete booking');
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = () => {
    showConfirm(
      'Cancel Booking',
      `Are you sure you want to cancel this booking for "${booking?.fullname}"?`,
      cancelBooking
    );
  };

  const cancelBooking = async () => {
    try {
      setUpdating(true);
      const response = await driveTrialService.updateDriveTrial(bookingId, {
        status: 'CANCELED',
      });

      if (response.success) {
        showSuccess('Success', 'Booking canceled successfully');
        loadBookingDetail();
      } else {
        showError('Error', response.error || 'Failed to cancel booking');
      }
    } catch (error) {
      console.error('Error canceling booking:', error);
      showError('Error', 'Failed to cancel booking');
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

  if (loading) {
    return <LoadingScreen />;
  }

  if (!booking) {
    return null;
  }

  // Get current status in uppercase for comparison
  const currentStatus = booking.status?.toUpperCase() || '';
  
  // Determine which buttons to show based on status
  const showAcceptButton = currentStatus === 'PENDING';
  const showCompleteButton = currentStatus === 'ACCEPTED';
  const showCancelButton = currentStatus === 'PENDING' || currentStatus === 'ACCEPTED';

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

      <View style={styles.content}>
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
        {(showAcceptButton || showCompleteButton || showCancelButton) && (
          <View style={styles.bottomActions}>
            {/* Accept Button - shown when status is PENDING */}
            {showAcceptButton && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleAccept}
                disabled={updating}
              >
                <LinearGradient
                  colors={['#4CAF50', '#4CAF50']}
                  style={styles.buttonGradient}
                >
                  <View style={styles.buttonContent}>
                    <Check size={16} color="#FFFFFF" />
                    <Text style={styles.buttonText}> Accept</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* Complete Button - shown when status is ACCEPTED */}
            {showCompleteButton && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleComplete}
                disabled={updating}
              >
                <LinearGradient
                  colors={['#2196F3', '#2196F3']}
                  style={styles.buttonGradient}
                >
                  <View style={styles.buttonContent}>
                    <Check size={16} color="#FFFFFF" />
                    <Text style={styles.buttonText}> Complete</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* Cancel Button - shown when status is PENDING or ACCEPTED */}
            {showCancelButton && (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancel}
                disabled={updating}
              >
                <View style={styles.cancelButtonContent}>
                  <X size={16} color={COLORS.TEXT.WHITE} />
                  <Text style={styles.cancelButtonText}> Cancel</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        showCancel={alertConfig.showCancel}
        confirmText={alertConfig.confirmText}
        cancelText={alertConfig.cancelText}
        onConfirm={alertConfig.onConfirm}
        onCancel={alertConfig.onCancel}
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
  content: {
    flex: 1,
    backgroundColor: COLORS.SURFACE,
    borderTopLeftRadius: SIZES.RADIUS.XXLARGE,
    borderTopRightRadius: SIZES.RADIUS.XXLARGE,
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
    backgroundColor: "#009DFF",
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
    backgroundColor: COLORS.SURFACE,
    gap: SIZES.PADDING.SMALL,
  },
  actionButton: {
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
  cancelButton: {
    backgroundColor: '#F44336',
    borderRadius: SIZES.RADIUS.LARGE,
    paddingVertical: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
  },
  cancelButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
    marginLeft: 6,
  },
});

export default DriveTrialDetailScreen;

