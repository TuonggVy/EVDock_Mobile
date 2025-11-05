import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, SafeAreaView, FlatList } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES } from '../../constants';
import { ArrowLeft, FileText, CreditCard } from 'lucide-react-native';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import installmentContractService from '../../services/installmentContractService';
import LoadingScreen from '../../components/common/LoadingScreen';

const InstallmentContractManagementScreen = ({ navigation, route }) => {
  const { customerContractId } = route.params || {};
  const { alertConfig, hideAlert, showError } = useCustomAlert();
  const [contracts, setContracts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadContracts = async () => {
    try {
      setLoading(true);
      if (!customerContractId) {
        setContracts([]);
        setLoading(false);
        return;
      }

      const response = await installmentContractService.getInstallmentContractByCustomerContract(customerContractId);
      if (response.success && response.data) {
        // API returns a single object, convert to array for consistency
        setContracts([response.data]);
      } else {
        showError('Error', response.error || 'Failed to load installment contract');
        setContracts([]);
      }
    } catch (error) {
      console.error('Error loading installment contract:', error);
      showError('Error', 'Failed to load installment contract');
      setContracts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContracts();
  }, [customerContractId]);

  useFocusEffect(
    useCallback(() => {
      if (customerContractId) {
        loadContracts();
      }
    }, [customerContractId])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadContracts();
    setRefreshing(false);
  };

  const formatDateForDisplay = (date) => {
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

  const formatPrice = (value) => {
    if (value === undefined || value === null) return 'N/A';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  const handleContractPress = (contract) => {
    if (contract.id) {
      navigation.navigate('InstallmentContractDetail', { installmentContractId: contract.id });
    }
  };

  const handleInterestPaymentPress = (contract) => {
    if (contract.id) {
      navigation.navigate('InstallmentPayment', { installmentContractId: contract.id });
    }
  };

  const renderContractCard = ({ item }) => (
    <View style={styles.contractCard}>
      <TouchableOpacity onPress={() => handleContractPress(item)}>
        <View style={styles.contractHeader}>
          <Text style={styles.contractTitle}>Installment Contract</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>

        <View style={styles.contractDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Start Date:</Text>
            <Text style={styles.detailValue}>{formatDateForDisplay(item.startAt)}</Text>
          </View>

          {item.prePaidTotal !== undefined && item.prePaidTotal !== null && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Prepaid Total:</Text>
              <Text style={styles.detailValue}>{formatPrice(item.prePaidTotal)}</Text>
            </View>
          )}

          {item.totalDebtPaid !== undefined && item.totalDebtPaid !== null && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Total Debt Paid:</Text>
              <Text style={styles.detailValue}>{formatPrice(item.totalDebtPaid)}</Text>
            </View>
          )}

          {item.penaltyValue !== undefined && item.penaltyValue !== null && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Penalty Value:</Text>
              <Text style={styles.detailValue}>{formatPrice(item.penaltyValue)}</Text>
            </View>
          )}

          {item.penaltyType && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Penalty Type:</Text>
              <Text style={styles.detailValue}>{item.penaltyType}</Text>
            </View>
          )}

          {item.customerContractId && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Customer Contract ID:</Text>
              <Text style={styles.detailValue}>#{item.customerContractId}</Text>
            </View>
          )}

          {item.installmentPlanId && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Installment Plan ID:</Text>
              <Text style={styles.detailValue}>#{item.installmentPlanId}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.interestPaymentButton} 
        onPress={() => handleInterestPaymentPress(item)}
      >
        <LinearGradient colors={COLORS.GRADIENT.GREEN} style={styles.interestPaymentGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          <CreditCard color={COLORS.TEXT.WHITE} size={18} />
          <Text style={styles.interestPaymentButtonText}>Interest Payment</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

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
            <Text style={styles.headerTitleText}>Installment Contracts</Text>
            <Text style={styles.headerSubtitle}>{contracts.length} contract{contracts.length !== 1 ? 's' : ''}</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      <View style={styles.content}>
        {!customerContractId ? (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.emptyContainer}
          >
            <FileText color={COLORS.TEXT.SECONDARY} size={48} />
            <Text style={styles.emptyTitle}>Select Customer Contract</Text>
            <Text style={styles.emptySubtitle}>
              Please select a customer contract to view installment contracts
            </Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => navigation.navigate('CustomerContractManagement')}
            >
              <LinearGradient
                colors={COLORS.GRADIENT.BLUE}
                style={styles.selectButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.selectButtonText}>Go to Customer Contracts</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        ) : contracts.length === 0 ? (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.emptyContainer}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >
            <FileText color={COLORS.TEXT.SECONDARY} size={48} />
            <Text style={styles.emptyTitle}>No Installment Contracts</Text>
            <Text style={styles.emptySubtitle}>
              No installment contracts found for this customer contract
            </Text>
          </ScrollView>
        ) : (
          <FlatList
            data={contracts}
            renderItem={renderContractCard}
            keyExtractor={(item, index) => `${item.customerContractId}-${item.installmentPlanId}-${index}`}
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
    fontSize: SIZES.FONT.HEADER,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
  headerSubtitle: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    marginTop: 4,
  },
  headerSpacer: {
    width: 40,
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
    marginTop: SIZES.PADDING.LARGE,
    marginBottom: SIZES.PADDING.SMALL,
  },
  emptySubtitle: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
    textAlign: 'center',
    marginBottom: SIZES.PADDING.LARGE,
  },
  selectButton: {
    marginTop: SIZES.PADDING.MEDIUM,
    borderRadius: SIZES.RADIUS.LARGE,
    overflow: 'hidden',
  },
  selectButtonGradient: {
    padding: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
  contractCard: {
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
  contractHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  contractTitle: {
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
  contractDetails: {
    gap: SIZES.PADDING.SMALL,
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
  interestPaymentButton: {
    marginTop: SIZES.PADDING.MEDIUM,
    borderRadius: SIZES.RADIUS.MEDIUM,
    overflow: 'hidden',
  },
  interestPaymentGradient: {
    padding: SIZES.PADDING.MEDIUM,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SIZES.PADDING.SMALL,
  },
  interestPaymentButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
});

export default InstallmentContractManagementScreen;
