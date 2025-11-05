import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SIZES } from '../../constants';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import installmentContractService from '../../services/installmentContractService';
import LoadingScreen from '../../components/common/LoadingScreen';
import { formatPrice } from '../../utils/promotionUtils';

const InstallmentPaymentDetailScreen = ({ navigation, route }) => {
  const { installmentPaymentId } = route.params || {};
  const { alertConfig, hideAlert, showError, showSuccess, showDeleteConfirm } = useCustomAlert();
  const [loading, setLoading] = useState(true);
  const [paymentDetail, setPaymentDetail] = useState(null);

  useEffect(() => {
    loadPaymentDetail();
  }, [installmentPaymentId]);

  useFocusEffect(
    React.useCallback(() => {
      if (installmentPaymentId) {
        loadPaymentDetail();
      }
    }, [installmentPaymentId])
  );

  const loadPaymentDetail = async () => {
    try {
      setLoading(true);
      const response = await installmentContractService.getInstallmentPaymentDetail(installmentPaymentId);
      if (response.success && response.data) {
        setPaymentDetail(response.data);
      } else {
        showError('Error', response.error || 'Failed to load payment details');
        setTimeout(() => navigation.goBack(), 2000);
      }
    } catch (error) {
      console.error('Error loading payment detail:', error);
      showError('Error', 'Failed to load payment details');
      setTimeout(() => navigation.goBack(), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigation.navigate('EditInstallmentPayment', { installmentPaymentId });
  };

  const handleDelete = () => {
    if (!paymentDetail?.id) return;

    showDeleteConfirm(
      'Delete Payment',
      'Are you sure you want to delete this payment?',
      async () => {
        try {
          const response = await installmentContractService.deleteInstallmentPayment(paymentDetail.id);
          if (response.success) {
            showSuccess('Success', response.message || 'Payment deleted successfully');
            setTimeout(() => {
              navigation.goBack();
            }, 1500);
          } else {
            showError('Error', response.error || 'Failed to delete payment');
          }
        } catch (error) {
          console.error('Error deleting payment:', error);
          showError('Error', 'Failed to delete payment');
        }
      }
    );
  };

  const formatDateForDisplay = (date) => {
    if (!date) return 'N/A';
    try {
      const d = new Date(date);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return 'N/A';
    }
  };

  const formatDateTimeForDisplay = (date) => {
    if (!date) return 'N/A';
    try {
      const d = new Date(date);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch {
      return 'N/A';
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'PENDING': return COLORS.WARNING;
      case 'PAID': return COLORS.SUCCESS;
      case 'OVERDUE': return COLORS.ERROR;
      default: return COLORS.TEXT.SECONDARY;
    }
  };

  const getStatusText = (status) => {
    switch (status?.toUpperCase()) {
      case 'PENDING': return 'Pending';
      case 'PAID': return 'Paid';
      case 'OVERDUE': return 'Overdue';
      default: return status || 'Unknown';
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (!paymentDetail) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <ArrowLeft color={COLORS.TEXT.WHITE} size={24} />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={styles.title}>Payment Detail</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.contentSection}>
          {/* Payment Information */}
          <Text style={styles.sectionTitle}>Payment Information</Text>
          
          <View style={styles.infoCard}>
            {paymentDetail.id && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Payment ID:</Text>
                <Text style={styles.infoValue}>#{paymentDetail.id}</Text>
              </View>
            )}

            {paymentDetail.status && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Status:</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(paymentDetail.status) }]}>
                  <Text style={styles.statusText}>{getStatusText(paymentDetail.status)}</Text>
                </View>
              </View>
            )}

            {paymentDetail.period && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Period:</Text>
                <Text style={styles.infoValue}>{formatDateForDisplay(paymentDetail.period)}</Text>
              </View>
            )}

            {paymentDetail.dueDate && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Due Date:</Text>
                <Text style={styles.infoValue}>{formatDateForDisplay(paymentDetail.dueDate)}</Text>
              </View>
            )}

            {paymentDetail.paidDate && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Paid Date:</Text>
                <Text style={styles.infoValue}>{formatDateTimeForDisplay(paymentDetail.paidDate)}</Text>
              </View>
            )}

            {paymentDetail.amountDue !== undefined && paymentDetail.amountDue !== null && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Amount Due:</Text>
                <Text style={styles.infoValue}>{formatPrice(paymentDetail.amountDue)}</Text>
              </View>
            )}

            {paymentDetail.amountPaid !== undefined && paymentDetail.amountPaid !== null && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Amount Paid:</Text>
                <Text style={styles.infoValue}>{formatPrice(paymentDetail.amountPaid)}</Text>
              </View>
            )}

            {paymentDetail.penaltyAmount !== undefined && paymentDetail.penaltyAmount !== null && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Penalty Amount:</Text>
                <Text style={styles.infoValue}>{formatPrice(paymentDetail.penaltyAmount)}</Text>
              </View>
            )}

            {paymentDetail.installmentContractId && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Installment Contract ID:</Text>
                <Text style={styles.infoValue}>#{paymentDetail.installmentContractId}</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
            <LinearGradient colors={COLORS.GRADIENT.BLUE} style={styles.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Pencil color={COLORS.TEXT.WHITE} size={20} />
              <Text style={styles.buttonText}>Edit Payment</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <LinearGradient colors={[COLORS.ERROR, COLORS.ERROR]} style={styles.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Trash2 color={COLORS.TEXT.WHITE} size={20} />
              <Text style={styles.buttonText}>Delete Payment</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={hideAlert}
        onConfirm={alertConfig.onConfirm}
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
  contentSection: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.LARGE,
    padding: SIZES.PADDING.LARGE,
  },
  sectionTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: '700',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  infoCard: {
    backgroundColor: '#E5E7EB',
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.LARGE,
    gap: SIZES.PADDING.MEDIUM,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SIZES.PADDING.XSMALL,
  },
  infoLabel: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
    fontWeight: '500',
    flex: 1,
  },
  infoValue: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  statusBadge: {
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    borderRadius: SIZES.RADIUS.MEDIUM,
  },
  statusText: {
    fontSize: SIZES.FONT.SMALL,
    fontWeight: '600',
    color: COLORS.TEXT.WHITE,
  },
  footer: {
    paddingHorizontal: SIZES.PADDING.LARGE,
    paddingTop: SIZES.PADDING.SMALL,
    paddingBottom: SIZES.PADDING.SMALL,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
    borderTopWidth: 1,
    borderTopColor: COLORS.BACKGROUND.SECONDARY,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: SIZES.PADDING.SMALL,
  },
  editButton: {
    flex: 1,
    borderRadius: SIZES.RADIUS.LARGE,
    overflow: 'hidden',
  },
  deleteButton: {
    flex: 1,
    borderRadius: SIZES.RADIUS.LARGE,
    overflow: 'hidden',
  },
  buttonGradient: {
    padding: SIZES.PADDING.MEDIUM,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SIZES.PADDING.SMALL,
  },
  buttonText: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
});

export default InstallmentPaymentDetailScreen;
