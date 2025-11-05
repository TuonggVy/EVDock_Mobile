import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { COLORS, SIZES } from '../../constants';
import CustomAlert from '../../components/common/CustomAlert';
import batchManagementService from '../../services/batchManagementService';
import agencyService from '../../services/agencyService';
import { ArrowLeft, Edit, FileText, DollarSign, Calendar, Building, Package } from 'lucide-react-native';

const BatchDetailScreen = ({ navigation, route }) => {
  const { batchId } = route.params || {};
  const [batch, setBatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [agencies, setAgencies] = useState([]);
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'info' });

  useEffect(() => {
    loadAgencies();
    loadBatchDetail();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadBatchDetail();
    });

    return unsubscribe;
  }, [navigation]);

  const loadAgencies = async () => {
    try {
      const response = await agencyService.getAgencies({ limit: 100 });
      if (response.success) {
        setAgencies(response.data || []);
      }
    } catch (error) {
      console.error('Error loading agencies:', error);
    }
  };

  const loadBatchDetail = async () => {
    try {
      setLoading(true);
      const response = await batchManagementService.getBatchDetail(batchId);
      
      if (response.success && response.data) {
        setBatch(response.data);
      } else {
        setAlertConfig({
          title: 'Error',
          message: response.error || 'Cannot load batch detail',
          type: 'error'
        });
        setShowAlert(true);
        setTimeout(() => navigation.goBack(), 2000);
      }
    } catch (error) {
      console.error('Error loading batch detail:', error);
      setAlertConfig({
        title: 'Error',
        message: 'Cannot load batch detail',
        type: 'error'
      });
      setShowAlert(true);
      setTimeout(() => navigation.goBack(), 2000);
    } finally {
      setLoading(false);
    }
  };

  const getAgencyName = (agencyId) => {
    if (!agencyId) return 'N/A';
    const agency = agencies.find(a => a.id === agencyId || a.id?.toString() === agencyId?.toString());
    return agency?.name || `Agency ${agencyId}`;
  };

  const formatPrice = (amount) => {
    if (!amount) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'OPEN':
        return COLORS.WARNING;
      case 'PARTIAL':
        return COLORS.PRIMARY;
      case 'CLOSED':
        return COLORS.SUCCESS;
      case 'OVERDUE':
        return COLORS.ERROR;
      default:
        return COLORS.TEXT.SECONDARY;
    }
  };

  const handleEdit = () => {
    navigation.navigate('EditBatch', { batchId: batch.id, batch });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
      </View>
    );
  }

  if (!batch) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={20} color={COLORS.PRIMARY} />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Batch Detail</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Batch not found</Text>
        </View>
      </View>
    );
  }

  const statusColor = getStatusColor(batch.status);
  const totalPaid = batch.apPayment?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;
  const remainingAmount = (batch.amount || 0) - totalPaid;

  return (
    <View style={styles.container}>
      <CustomAlert
        visible={showAlert}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setShowAlert(false)}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={20} color={COLORS.PRIMARY} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Batch Detail</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={handleEdit}
        >
          <Edit size={20} color={COLORS.PRIMARY} />
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Batch Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Batch Information</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {batch.status || 'N/A'}
              </Text>
            </View>
          </View>

          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}><FileText size={16} color={COLORS.TEXT.SECONDARY} /></Text>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Batch ID</Text>
                <Text style={styles.infoValue}>#{batch.id}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}><FileText size={16} color={COLORS.TEXT.SECONDARY} /></Text>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Invoice Number</Text>
                <Text style={styles.infoValue}>{batch.invoiceNumber || 'N/A'}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}><Building size={16} color={COLORS.TEXT.SECONDARY} /></Text>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Agency</Text>
                <Text style={styles.infoValue}>{getAgencyName(batch.agencyId)}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}><DollarSign size={16} color={COLORS.TEXT.SECONDARY} /></Text>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Total Amount</Text>
                <Text style={styles.amountValue}>{formatPrice(batch.amount)}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}><DollarSign size={16} color={COLORS.SUCCESS} /></Text>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Total Paid</Text>
                <Text style={[styles.amountValue, { color: COLORS.SUCCESS }]}>{formatPrice(totalPaid)}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}><DollarSign size={16} color={COLORS.WARNING} /></Text>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Remaining Amount</Text>
                <Text style={[styles.amountValue, { color: COLORS.WARNING }]}>{formatPrice(remainingAmount)}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}><Calendar size={16} color={COLORS.TEXT.SECONDARY} /></Text>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Due Date</Text>
                <Text style={styles.infoValue}>{formatDate(batch.dueDate)}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}><Calendar size={16} color={COLORS.TEXT.SECONDARY} /></Text>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Created At</Text>
                <Text style={styles.infoValue}>{formatDate(batch.createAt)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Payment History */}
        {batch.apPayment && batch.apPayment.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Payment History</Text>
            {batch.apPayment.map((payment, index) => (
              <View key={index} style={styles.paymentItem}>
                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentDate}>{formatDate(payment.paidDate)}</Text>
                  <Text style={styles.paymentAmount}>{formatPrice(payment.amount)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Agency Order Info */}
        {batch.agencyOrder && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Related Order</Text>
            <View style={styles.infoSection}>
              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}><Package size={16} color={COLORS.TEXT.SECONDARY} /></Text>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Order ID</Text>
                  <Text style={styles.infoValue}>#{batch.agencyOrder.id}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}><Package size={16} color={COLORS.TEXT.SECONDARY} /></Text>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Items Quantity</Text>
                  <Text style={styles.infoValue}>{batch.agencyOrder.itemQuantity || batch.agencyOrder.itemsQuantity || 0}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}><DollarSign size={16} color={COLORS.TEXT.SECONDARY} /></Text>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Sub Total</Text>
                  <Text style={styles.amountValue}>{formatPrice(batch.agencyOrder.subtotal || batch.agencyOrder.subTotal)}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}><Calendar size={16} color={COLORS.TEXT.SECONDARY} /></Text>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Order Date</Text>
                  <Text style={styles.infoValue}>{formatDate(batch.agencyOrder.orderAt)}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}><FileText size={16} color={COLORS.TEXT.SECONDARY} /></Text>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Order Type</Text>
                  <Text style={styles.infoValue}>{batch.agencyOrder.orderType || 'N/A'}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}><FileText size={16} color={COLORS.TEXT.SECONDARY} /></Text>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Order Status</Text>
                  <Text style={styles.infoValue}>{batch.agencyOrder.status || 'N/A'}</Text>
                </View>
              </View>
            </View>
          </View>
        )}
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
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
    paddingTop: SIZES.PADDING.XXXLARGE,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.PADDING.SMALL,
    gap: 4,
  },
  backButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: SIZES.FONT.HEADER,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
    flex: 1,
    textAlign: 'center',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.PADDING.SMALL,
    gap: 4,
  },
  editButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  headerRight: {
    width: 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.SURFACE,
  },
  contentContainer: {
    padding: SIZES.PADDING.LARGE,
    paddingBottom: SIZES.PADDING.XXXLARGE,
  },
  card: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.LARGE,
    padding: SIZES.PADDING.LARGE,
    marginBottom: SIZES.PADDING.MEDIUM,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.PADDING.LARGE,
  },
  cardTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
  },
  statusBadge: {
    paddingHorizontal: SIZES.PADDING.SMALL,
    paddingVertical: 4,
    borderRadius: SIZES.RADIUS.SMALL,
  },
  statusText: {
    fontSize: SIZES.FONT.SMALL,
    fontWeight: '600',
  },
  infoSection: {
    gap: SIZES.PADDING.MEDIUM,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SIZES.PADDING.MEDIUM,
  },
  infoIcon: {
    marginTop: 2,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: SIZES.PADDING.XSMALL,
  },
  infoValue: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '500',
  },
  amountValue: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.SECONDARY,
    fontWeight: 'bold',
  },
  paymentItem: {
    paddingVertical: SIZES.PADDING.MEDIUM,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  paymentInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentDate: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
  },
  paymentAmount: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.SUCCESS,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.PADDING.XXXLARGE,
  },
  emptyText: {
    fontSize: SIZES.FONT.LARGE,
    color: COLORS.TEXT.SECONDARY,
  },
});

export default BatchDetailScreen;
