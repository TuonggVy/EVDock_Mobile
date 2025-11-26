import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SIZES } from '../../constants';
import { ArrowLeft, FileText, Pencil, Trash2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import installmentContractService from '../../services/installmentContractService';
import LoadingScreen from '../../components/common/LoadingScreen';
import { formatPrice } from '../../utils/promotionUtils';

const InstallmentContractDetailScreen = ({ navigation, route }) => {
  const { installmentContractId } = route.params || {};
  const { alertConfig, hideAlert, showError, showSuccess, showDeleteConfirm } = useCustomAlert();
  const [loading, setLoading] = useState(true);
  const [contractDetail, setContractDetail] = useState(null);

  useEffect(() => {
    loadContractDetail();
  }, [installmentContractId]);

  useFocusEffect(
    React.useCallback(() => {
      if (installmentContractId) {
        loadContractDetail();
      }
    }, [installmentContractId])
  );

  const loadContractDetail = async () => {
    try {
      setLoading(true);
      const response = await installmentContractService.getInstallmentContractDetail(installmentContractId);
      if (response.success && response.data) {
        let contractData = response.data;
        
        // Fetch totalInterestPaid from customer contract endpoint if customerContractId exists
        if (contractData.customerContractId) {
          try {
            const customerContractResponse = await installmentContractService.getInstallmentContractByCustomerContract(contractData.customerContractId);
            if (customerContractResponse.success && customerContractResponse.data) {
              // Merge totalInterestPaid into contract data
              contractData = {
                ...contractData,
                totalInterestPaid: customerContractResponse.data.totalInterestPaid,
              };
            }
          } catch (error) {
            console.error('Error fetching totalInterestPaid:', error);
            // Continue even if this fails, just don't show totalInterestPaid
          }
        }
        
        setContractDetail(contractData);
      } else {
        showError('Error', response.error || 'Failed to load installment contract details');
        setTimeout(() => navigation.goBack(), 2000);
      }
    } catch (error) {
      console.error('Error loading installment contract:', error);
      showError('Error', 'Failed to load installment contract details');
      setTimeout(() => navigation.goBack(), 2000);
    } finally {
      setLoading(false);
    }
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
      case 'ACTIVE': return COLORS.SUCCESS;
      case 'COMPLETED': return COLORS.SUCCESS;
      case 'OVERDUE': return COLORS.ERROR;
      default: return COLORS.TEXT.SECONDARY;
    }
  };

  const getStatusText = (status) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE': return 'Active';
      case 'COMPLETED': return 'Completed';
      case 'OVERDUE': return 'Overdue';
      default: return status || 'Unknown';
    }
  };

  const getContractTypeLabel = (type) => {
    switch (type?.toUpperCase()) {
      case 'FULL': return 'Full Payment';
      case 'DEBT': return 'Debt';
      default: return type || 'Unknown';
    }
  };

  const getCustomerContractStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'PENDING': return COLORS.WARNING;
      case 'CONFIRMED': return '#3B82F6';
      case 'PROCESSING': return '#A855F7';
      case 'DELIVERED': return COLORS.SUCCESS;
      case 'COMPLETED': return COLORS.SUCCESS;
      default: return COLORS.TEXT.SECONDARY;
    }
  };

  const getCustomerContractStatusText = (status) => {
    switch (status?.toUpperCase()) {
      case 'PENDING': return 'Pending';
      case 'CONFIRMED': return 'Confirmed';
      case 'PROCESSING': return 'Processing';
      case 'DELIVERED': return 'Delivered';
      case 'COMPLETED': return 'Completed';
      default: return status || 'Unknown';
    }
  };

  const handleEdit = () => {
    navigation.navigate('EditInstallmentContract', { installmentContractId });
  };

  const handleDelete = () => {
    showDeleteConfirm(
      'Delete Installment Contract',
      'Are you sure you want to delete this installment contract?',
      async () => {
        try {
          const response = await installmentContractService.deleteInstallmentContract(installmentContractId);
          if (response.success) {
            showSuccess('Success', response.message || 'Installment contract deleted successfully');
            setTimeout(() => {
              navigation.goBack();
            }, 1500);
          } else {
            showError('Error', response.error || 'Failed to delete installment contract');
          }
        } catch (error) {
          console.error('Error deleting installment contract:', error);
          showError('Error', 'Failed to delete installment contract');
        }
      }
    );
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (!contractDetail) {
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
            <Text style={styles.title}>Installment Contract Detail</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.contentSection}>
          <View style={styles.titleRow}>
            <FileText color={COLORS.PRIMARY} size={24} />
            <Text style={styles.contractTitle}>Installment Contract #{contractDetail.id}</Text>
          </View>

          {contractDetail.status && (
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(contractDetail.status) }]}>
              <Text style={styles.statusText}>{getStatusText(contractDetail.status)}</Text>
            </View>
          )}

          {/* Installment Contract Information */}
          <View style={styles.infoCard}>
            <Text style={styles.sectionTitle}>Installment Contract Information</Text>

            {contractDetail.id && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Contract ID:</Text>
                <Text style={styles.infoValue}>#{contractDetail.id}</Text>
              </View>
            )}

            {contractDetail.startAt && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Start Date:</Text>
                <Text style={styles.infoValue}>{formatDateForDisplay(contractDetail.startAt)}</Text>
              </View>
            )}

            {contractDetail.prePaidTotal !== undefined && contractDetail.prePaidTotal !== null && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Prepaid Total:</Text>
                <Text style={styles.infoValue}>{formatPrice(contractDetail.prePaidTotal || 0)}</Text>
              </View>
            )}

            {contractDetail.totalDebtPaid !== undefined && contractDetail.totalDebtPaid !== null && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Total Debt Paid:</Text>
                <Text style={styles.infoValue}>{formatPrice(contractDetail.totalDebtPaid || 0)}</Text>
              </View>
            )}

            {contractDetail.totalInterestPaid !== undefined && contractDetail.totalInterestPaid !== null && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Total Interest Paid:</Text>
                <Text style={styles.infoValue}>{formatPrice(contractDetail.totalInterestPaid || 0)}</Text>
              </View>
            )}

            {contractDetail.penaltyValue !== undefined && contractDetail.penaltyValue !== null && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Penalty Value:</Text>
                <Text style={styles.infoValue}>{formatPrice(contractDetail.penaltyValue || 0)}</Text>
              </View>
            )}

            {contractDetail.penaltyType && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Penalty Type:</Text>
                <Text style={styles.infoValue}>{contractDetail.penaltyType}</Text>
              </View>
            )}

            {contractDetail.status && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Status:</Text>
                <Text style={styles.infoValue}>{getStatusText(contractDetail.status)}</Text>
              </View>
            )}

            {contractDetail.customerContractId && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Customer Contract ID:</Text>
                <Text style={styles.infoValue}>#{contractDetail.customerContractId}</Text>
              </View>
            )}

            {contractDetail.installmentPlanId && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Installment Plan ID:</Text>
                <Text style={styles.infoValue}>#{contractDetail.installmentPlanId}</Text>
              </View>
            )}
          </View>

          {/* Customer Contract Information */}
          {contractDetail.customerContract && (
            <View style={styles.infoCard}>
              <Text style={styles.sectionTitle}>Customer Contract Information</Text>

              {contractDetail.customerContract.id && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Contract ID:</Text>
                  <Text style={styles.infoValue}>#{contractDetail.customerContract.id}</Text>
                </View>
              )}

              {contractDetail.customerContract.contractCode && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Contract Code:</Text>
                  <Text style={styles.infoValue}>{contractDetail.customerContract.contractCode}</Text>
                </View>
              )}

              {contractDetail.customerContract.title && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Title:</Text>
                  <Text style={styles.infoValue}>{contractDetail.customerContract.title}</Text>
                </View>
              )}

              {contractDetail.customerContract.content && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Content:</Text>
                  <Text style={styles.infoValue}>{contractDetail.customerContract.content}</Text>
                </View>
              )}

              {contractDetail.customerContract.contractPaidType && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Type:</Text>
                  <Text style={styles.infoValue}>{getContractTypeLabel(contractDetail.customerContract.contractPaidType)}</Text>
                </View>
              )}

              {contractDetail.customerContract.finalPrice !== undefined && contractDetail.customerContract.finalPrice !== null && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Final Price:</Text>
                  <Text style={styles.infoValue}>{formatPrice(contractDetail.customerContract.finalPrice || 0)}</Text>
                </View>
              )}

              {contractDetail.customerContract.signDate && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Sign Date:</Text>
                  <Text style={styles.infoValue}>{formatDateForDisplay(contractDetail.customerContract.signDate)}</Text>
                </View>
              )}

              {contractDetail.customerContract.deliveryDate && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Delivery Date:</Text>
                  <Text style={styles.infoValue}>{formatDateForDisplay(contractDetail.customerContract.deliveryDate)}</Text>
                </View>
              )}

              {contractDetail.customerContract.status && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Status:</Text>
                  <Text style={styles.infoValue}>{getCustomerContractStatusText(contractDetail.customerContract.status)}</Text>
                </View>
              )}
            </View>
          )}

          {/* Installment Plan Information */}
          {contractDetail.installmentPlan && (
            <View style={styles.infoCard}>
              <Text style={styles.sectionTitle}>Installment Plan Information</Text>

              {contractDetail.installmentPlan.id && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Plan ID:</Text>
                  <Text style={styles.infoValue}>#{contractDetail.installmentPlan.id}</Text>
                </View>
              )}

              {contractDetail.installmentPlan.name && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Plan Name:</Text>
                  <Text style={styles.infoValue}>{contractDetail.installmentPlan.name}</Text>
                </View>
              )}

              {contractDetail.installmentPlan.tensor && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Tensor:</Text>
                  <Text style={styles.infoValue}>{contractDetail.installmentPlan.tensor}</Text>
                </View>
              )}

              {contractDetail.installmentPlan.interestRate !== undefined && contractDetail.installmentPlan.interestRate !== null && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Interest Rate:</Text>
                  <Text style={styles.infoValue}>{contractDetail.installmentPlan.interestRate}%</Text>
                </View>
              )}

              {contractDetail.installmentPlan.interestPaidType && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Interest Type:</Text>
                  <Text style={styles.infoValue}>{contractDetail.installmentPlan.interestPaidType}</Text>
                </View>
              )}

              {contractDetail.installmentPlan.interestRateTotalMonth !== undefined && contractDetail.installmentPlan.interestRateTotalMonth !== null && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Total Months:</Text>
                  <Text style={styles.infoValue}>{contractDetail.installmentPlan.interestRateTotalMonth} months</Text>
                </View>
              )}

              {contractDetail.installmentPlan.totalPaidMonth !== undefined && contractDetail.installmentPlan.totalPaidMonth !== null && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Payment Period:</Text>
                  <Text style={styles.infoValue}>{contractDetail.installmentPlan.totalPaidMonth} months</Text>
                </View>
              )}

              {contractDetail.installmentPlan.prePaidPercent !== undefined && contractDetail.installmentPlan.prePaidPercent !== null && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Prepaid Percent:</Text>
                  <Text style={styles.infoValue}>{contractDetail.installmentPlan.prePaidPercent}%</Text>
                </View>
              )}

              {contractDetail.installmentPlan.processFee !== undefined && contractDetail.installmentPlan.processFee !== null && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Process Fee:</Text>
                  <Text style={styles.infoValue}>{formatPrice(contractDetail.installmentPlan.processFee || 0)}</Text>
                </View>
              )}

              {contractDetail.installmentPlan.status && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Status:</Text>
                  <Text style={styles.infoValue}>{getStatusText(contractDetail.installmentPlan.status)}</Text>
                </View>
              )}

              {contractDetail.installmentPlan.startAt && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Start Date:</Text>
                  <Text style={styles.infoValue}>{formatDateForDisplay(contractDetail.installmentPlan.startAt)}</Text>
                </View>
              )}

              {contractDetail.installmentPlan.endAt && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>End Date:</Text>
                  <Text style={styles.infoValue}>{formatDateForDisplay(contractDetail.installmentPlan.endAt)}</Text>
                </View>
              )}
            </View>
          )}

          {/* Installment Payments */}
          {contractDetail.installmentPayments && contractDetail.installmentPayments.length > 0 && (
            <View style={styles.infoCard}>
              <Text style={styles.sectionTitle}>Installment Payments ({contractDetail.installmentPayments.length})</Text>
              {contractDetail.installmentPayments.map((payment, index) => (
                <View key={payment.id || index} style={styles.paymentItem}>
                  <Text style={styles.paymentTitle}>Payment #{index + 1}</Text>
                  {/* Add more payment details as needed */}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
            <LinearGradient colors={COLORS.GRADIENT.BLUE} style={styles.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Pencil color={COLORS.TEXT.WHITE} size={20} />
              <Text style={styles.buttonText}>Edit Contract</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <LinearGradient colors={[COLORS.ERROR, COLORS.ERROR]} style={styles.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Trash2 color={COLORS.TEXT.WHITE} size={20} />
              <Text style={styles.buttonText}>Delete Contract</Text>
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  contractTitle: {
    fontSize: SIZES.FONT.XLARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginLeft: SIZES.PADDING.SMALL,
    flex: 1,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    borderRadius: SIZES.RADIUS.MEDIUM,
    marginBottom: SIZES.PADDING.LARGE,
  },
  statusText: {
    fontSize: SIZES.FONT.SMALL,
    fontWeight: '600',
    color: COLORS.TEXT.WHITE,
  },
  sectionTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  infoCard: {
    backgroundColor: '#E5E7EB',
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SIZES.PADDING.SMALL,
    paddingBottom: SIZES.PADDING.SMALL,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BACKGROUND.SECONDARY,
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
    flex: 2,
    textAlign: 'right',
  },
  paymentItem: {
    marginBottom: SIZES.PADDING.MEDIUM,
    paddingBottom: SIZES.PADDING.MEDIUM,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BACKGROUND.SECONDARY,
  },
  paymentTitle: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
  },
  footer: {
    padding: SIZES.PADDING.LARGE,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
    borderTopWidth: 1,
    borderTopColor: COLORS.BACKGROUND.SECONDARY,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: SIZES.PADDING.MEDIUM,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.PADDING.MEDIUM,
    gap: SIZES.PADDING.SMALL,
  },
  buttonText: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
});

export default InstallmentContractDetailScreen;
