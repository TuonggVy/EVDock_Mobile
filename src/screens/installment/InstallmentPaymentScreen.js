import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, SafeAreaView, FlatList, Modal } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES } from '../../constants';
import { ArrowLeft, Plus, Eye, Pencil, Trash2, MoreVertical, Home, FileText } from 'lucide-react-native';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import installmentContractService from '../../services/installmentContractService';
import LoadingScreen from '../../components/common/LoadingScreen';
import { formatPrice } from '../../utils/promotionUtils';

const InstallmentPaymentScreen = ({ navigation, route }) => {
  const { installmentContractId } = route.params || {};
  const { alertConfig, hideAlert, showError, showSuccess, showDeleteConfirm } = useCustomAlert();
  const [contractDetail, setContractDetail] = useState(null);
  const [payments, setPayments] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    loadContractAndPayments();
  }, [installmentContractId]);

  useFocusEffect(
    useCallback(() => {
      if (installmentContractId) {
        loadContractAndPayments();
      }
    }, [installmentContractId])
  );

  const loadContractAndPayments = async () => {
    try {
      setLoading(true);
      const response = await installmentContractService.getInstallmentContractDetail(installmentContractId);
      if (response.success && response.data) {
        setContractDetail(response.data);
        // Extract payments from contract detail
        const paymentList = response.data.installmentPayments || [];
        setPayments(paymentList);
      } else {
        showError('Error', response.error || 'Failed to load installment contract');
      }
    } catch (error) {
      console.error('Error loading installment contract:', error);
      showError('Error', 'Failed to load installment contract');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadContractAndPayments();
    setRefreshing(false);
  };

  const handleGenerateInterestPayments = async () => {
    try {
      setGenerating(true);
      const response = await installmentContractService.generateInterestPayments(installmentContractId);
      if (response.success) {
        showSuccess('Success', response.message || 'Interest payments generated successfully');
        // Reload contract to get new payments
        setTimeout(() => {
          loadContractAndPayments();
        }, 1000);
      } else {
        showError('Error', response.error || 'Failed to generate interest payments');
      }
    } catch (error) {
      console.error('Error generating interest payments:', error);
      showError('Error', 'Failed to generate interest payments');
    } finally {
      setGenerating(false);
    }
  };

  const handleViewPayment = (payment) => {
    if (payment.id) {
      navigation.navigate('InstallmentPaymentDetail', { installmentPaymentId: payment.id });
    }
  };

  const handleEditPayment = (payment) => {
    if (payment.id) {
      navigation.navigate('EditInstallmentPayment', { installmentPaymentId: payment.id });
    }
  };

  const handleDeletePayment = (payment) => {
    if (!payment.id) return;

    showDeleteConfirm(
      'Delete Payment',
      `Are you sure you want to delete this payment?`,
      async () => {
        try {
          const response = await installmentContractService.deleteInstallmentPayment(payment.id);
          if (response.success) {
            showSuccess('Success', response.message || 'Payment deleted successfully');
            // Reload payments
            setTimeout(() => {
              loadContractAndPayments();
            }, 1000);
          } else {
            showError('Error', response.error || 'Failed to delete payment');
          }
        } catch (error) {
          console.error('Error deleting payment:', error);
          showError('Error', 'Failed to delete payment');
        }
      },
      () => {
        // onCancel - do nothing, just close the dialog
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

  const renderPaymentCard = ({ item, index }) => {
    const periodText = item.period ? formatDateForDisplay(item.period) : '';
    const titleText = periodText ? `Payment ${periodText}` : `Payment #${index + 1}`;
    
    return (
    <View style={styles.paymentCard}>
      <View style={styles.paymentHeader}>
        <Text style={styles.paymentTitle}>{titleText}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>

      <View style={styles.paymentDetails}>
        {item.period && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Period:</Text>
            <Text style={styles.detailValue}>{formatDateForDisplay(item.period)}</Text>
          </View>
        )}

        {item.dueDate && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Due Date:</Text>
            <Text style={styles.detailValue}>{formatDateForDisplay(item.dueDate)}</Text>
          </View>
        )}

        {item.paidDate && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Paid Date:</Text>
            <Text style={styles.detailValue}>{formatDateTimeForDisplay(item.paidDate)}</Text>
          </View>
        )}

        {item.amountDue !== undefined && item.amountDue !== null && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount Due:</Text>
            <Text style={styles.detailValue}>{formatPrice(item.amountDue)}</Text>
          </View>
        )}

        {item.amountPaid !== undefined && item.amountPaid !== null && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount Paid:</Text>
            <Text style={styles.detailValue}>{formatPrice(item.amountPaid)}</Text>
          </View>
        )}

        {item.penaltyAmount !== undefined && item.penaltyAmount !== null && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Penalty Amount:</Text>
            <Text style={styles.detailValue}>{formatPrice(item.penaltyAmount)}</Text>
          </View>
        )}
      </View>

      <View style={styles.paymentActions}>
        <TouchableOpacity style={styles.actionButton} onPress={() => handleViewPayment(item)}>
          <LinearGradient colors={['#000000', '#000000']} style={styles.actionButtonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Eye color={COLORS.TEXT.WHITE} size={16} />
            <Text style={styles.actionButtonText}>View</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => handleEditPayment(item)}>
          <LinearGradient colors={['#000000', '#000000']} style={styles.actionButtonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Pencil color={COLORS.TEXT.WHITE} size={16} />
            <Text style={styles.actionButtonText}>Edit</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => handleDeletePayment(item)}>
          <LinearGradient colors={['#000000', '#000000']} style={styles.actionButtonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Trash2 color={COLORS.TEXT.WHITE} size={16} />
            <Text style={styles.actionButtonText}>Delete</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
    );
  };

  if (loading) {
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
            <Text style={styles.headerTitleText}>Installment Payments</Text>
            <Text style={styles.headerSubtitle}>{payments.length} payment{payments.length !== 1 ? 's' : ''}</Text>
          </View>
          <TouchableOpacity style={styles.menuButton} onPress={() => setShowMenu(true)}>
            <MoreVertical color={COLORS.TEXT.WHITE} size={24} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Popup Menu */}
      <Modal
        visible={showMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={styles.menuContainer}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                navigation.navigate('Main', { screen: 'Home' });
              }}
            >
              <Home color={COLORS.TEXT.PRIMARY} size={20} />
              <Text style={styles.menuItemText}>Home</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                navigation.navigate('CustomerContractManagement');
              }}
            >
              <FileText color={COLORS.TEXT.PRIMARY} size={20} />
              <Text style={styles.menuItemText}>Customer Contract</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <View style={styles.content}>
        <View style={styles.actionBar}>
          <TouchableOpacity 
            style={[styles.generateButton, generating && styles.generateButtonDisabled]} 
            onPress={handleGenerateInterestPayments}
            disabled={generating}
          >
            <LinearGradient colors={['#009DFF', '#009DFF']} style={styles.generateButtonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Plus color={COLORS.TEXT.WHITE} size={20} />
              <Text style={styles.generateButtonText}>
                {generating ? 'Generating...' : 'Generate Interest Payments'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {payments.length === 0 ? (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.emptyContainer}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >
            <Text style={styles.emptyTitle}>No Payments</Text>
            <Text style={styles.emptySubtitle}>
              Generate interest payments to create payment schedule
            </Text>
          </ScrollView>
        ) : (
          <FlatList
            data={payments}
            renderItem={renderPaymentCard}
            keyExtractor={(item, index) => `payment-${item.id || index}`}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            showsVerticalScrollIndicator={false}
          />
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
  headerTitleText: {
    fontSize: SIZES.FONT.XXLARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
  headerSubtitle: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    marginTop: 4,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: SIZES.RADIUS.ROUND,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: SIZES.PADDING.XXXLARGE + 60,
    paddingRight: SIZES.PADDING.LARGE,
  },
  menuContainer: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.LARGE,
    paddingVertical: SIZES.PADDING.SMALL,
    minWidth: 200,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.PADDING.LARGE,
    paddingVertical: SIZES.PADDING.MEDIUM,
    gap: SIZES.PADDING.MEDIUM,
  },
  menuItemText: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: '500',
    color: COLORS.TEXT.PRIMARY,
  },
  menuDivider: {
    height: 1,
    backgroundColor: COLORS.BORDER.PRIMARY,
    marginVertical: SIZES.PADDING.XSMALL,
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.SURFACE,
    borderTopLeftRadius: SIZES.RADIUS.XXLARGE,
    borderTopRightRadius: SIZES.RADIUS.XXLARGE,
  },
  actionBar: {
    padding: SIZES.PADDING.LARGE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER.PRIMARY,
  },
  generateButton: {
    borderRadius: SIZES.RADIUS.LARGE,
    overflow: 'hidden',
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateButtonGradient: {
    padding: SIZES.PADDING.MEDIUM,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SIZES.PADDING.SMALL,
  },
  generateButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
  scrollView: {
    flex: 1,
  },
  listContent: {
    padding: SIZES.PADDING.LARGE,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.PADDING.XXXLARGE,
  },
  emptyTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: '700',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SIZES.PADDING.SMALL,
  },
  emptySubtitle: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
    textAlign: 'center',
  },
  paymentCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.LARGE,
    padding: SIZES.PADDING.LARGE,
    marginBottom: SIZES.PADDING.MEDIUM,
    borderWidth: 1,
    borderColor: COLORS.BORDER.PRIMARY,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  paymentTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: '700',
    color: COLORS.TEXT.PRIMARY,
    flex: 1,
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
  paymentDetails: {
    gap: SIZES.PADDING.SMALL,
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: SIZES.PADDING.XSMALL,
  },
  detailLabel: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
    fontWeight: '500',
    flex: 1,
  },
  detailValue: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  paymentActions: {
    flexDirection: 'row',
    gap: SIZES.PADDING.SMALL,
    marginTop: SIZES.PADDING.SMALL,
  },
  actionButton: {
    flex: 1,
    borderRadius: SIZES.RADIUS.MEDIUM,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    padding: SIZES.PADDING.SMALL,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  actionButtonText: {
    fontSize: SIZES.FONT.SMALL,
    fontWeight: '600',
    color: COLORS.TEXT.WHITE,
  },
});

export default InstallmentPaymentScreen;
