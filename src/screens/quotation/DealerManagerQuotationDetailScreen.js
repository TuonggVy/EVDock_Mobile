import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { COLORS, SIZES } from '../../constants';
import { quotationService } from '../../services/quotationService';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';

const DealerManagerQuotationDetailScreen = ({ navigation, route }) => {
  const quotationId = route.params?.quotationId || route.params?.quotation?.id;
  const { alertConfig, hideAlert, showError } = useCustomAlert();
  const showErrorRef = useRef(showError);

  useEffect(() => {
    showErrorRef.current = showError;
  }, [showError]);

  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const formatCurrency = (value) => {
    if (value === null || value === undefined) {
      return 'N/A';
    }
    try {
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
    } catch (error) {
      return `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
  };

  const formatDate = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getStatusColor = (status) => {
    switch ((status || '').toUpperCase()) {
      case 'ACCEPTED':
        return COLORS.SUCCESS;
      case 'REJECTED':
        return COLORS.ERROR;
      case 'DRAFT':
        return COLORS.WARNING;
      case 'EXPIRED':
        return COLORS.TEXT.SECONDARY;
      default:
        return COLORS.PRIMARY;
    }
  };

  const loadQuotationDetail = useCallback(async () => {
    if (!quotationId) {
      showErrorRef.current?.('Missing information', 'Quotation ID not found.');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      setLoading(true);
      const response = await quotationService.getQuotationById(Number(quotationId));
      if (response.success) {
        setQuotation(response.data);
      } else {
        showErrorRef.current?.('Failed to load quotation', response.error || 'Unable to load quotation detail.');
        setQuotation(null);
      }
    } catch (error) {
      console.error('loadQuotationDetail error:', error);
      showErrorRef.current?.('System error', 'An error occurred while loading the quotation detail.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [quotationId]);

  useEffect(() => {
    loadQuotationDetail();
  }, [loadQuotationDetail]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadQuotationDetail();
  };

  const renderSectionRow = (label, value) => (
    <View style={styles.row} key={label}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value || '—'}</Text>
    </View>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#009DFF" size="large" />
          <Text style={styles.loadingText}>Loading quotation details...</Text>
        </View>
      );
    }

    if (!quotation) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>Quotation not found</Text>
          <Text style={styles.emptyStateSubtitle}>Please try again later or return to the list.</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Try again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.PRIMARY} />}
      >
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Overview</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(quotation.status) }]}>
              <Text style={styles.statusText}>{(quotation.status || 'Unknown').replace('_', ' ')}</Text>
            </View>
          </View>
          {renderSectionRow('Quotation code', quotation.quoteCode)}
          {renderSectionRow('Quotation type', (quotation.type || 'N/A').replace('_', ' '))}
          {renderSectionRow('Created on', formatDate(quotation.createDate))}
          {renderSectionRow('Valid until', formatDate(quotation.validUntil))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pricing summary</Text>
          {renderSectionRow('Base price', formatCurrency(quotation.basePrice))}
          {renderSectionRow('Promotion', formatCurrency(quotation.promotionPrice))}
          {renderSectionRow('Final price', formatCurrency(quotation.finalPrice))}
        </View>

        {quotation.customer && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Customer information</Text>
            {renderSectionRow('Customer name', quotation.customer.name)}
            {renderSectionRow('Phone number', quotation.customer.phone)}
            {renderSectionRow('Email', quotation.customer.email)}
            {renderSectionRow('Address', quotation.customer.address)}
            {renderSectionRow('Date of birth', formatDate(quotation.customer.dob))}
          </View>
        )}

        {quotation.motorbike && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vehicle information</Text>
            {renderSectionRow('Vehicle name', quotation.motorbike.name)}
            {renderSectionRow('Model', quotation.motorbike.model)}
            {renderSectionRow('Version', quotation.motorbike.version)}
            {renderSectionRow('Origin', quotation.motorbike.makeFrom)}
          </View>
        )}

        {quotation.color && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Color</Text>
            {renderSectionRow('Color', quotation.color.colorType)}
          </View>
        )}
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft color={COLORS.TEXT.WHITE} size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quotation Detail</Text>
      </View>

      {renderContent()}

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
    </View>
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.PADDING.MEDIUM,
  },
  headerTitle: {
    fontSize: SIZES.FONT.HEADER,
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.SURFACE,
    borderTopLeftRadius: SIZES.RADIUS.XXLARGE,
    borderTopRightRadius: SIZES.RADIUS.XXLARGE,
    paddingHorizontal: SIZES.PADDING.LARGE,
    paddingTop: SIZES.PADDING.XLARGE,
  },
  section: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.XLARGE,
    padding: SIZES.PADDING.LARGE,
    marginBottom: SIZES.PADDING.LARGE,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  sectionTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SIZES.PADDING.XSMALL,
  },
  rowLabel: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    flex: 1,
  },
  rowValue: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.PRIMARY,
    flex: 1,
    textAlign: 'right',
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: 6,
    borderRadius: SIZES.RADIUS.ROUND,
  },
  statusText: {
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
    fontSize: SIZES.FONT.SMALL,
    textTransform: 'capitalize',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.SURFACE,
    borderTopLeftRadius: SIZES.RADIUS.XXLARGE,
    borderTopRightRadius: SIZES.RADIUS.XXLARGE,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SIZES.PADDING.LARGE,
  },
  loadingText: {
    marginTop: SIZES.PADDING.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
  },
  emptyState: {
    flex: 1,
    backgroundColor: COLORS.SURFACE,
    borderTopLeftRadius: SIZES.RADIUS.XXLARGE,
    borderTopRightRadius: SIZES.RADIUS.XXLARGE,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SIZES.PADDING.XLARGE,
  },
  emptyStateTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SIZES.PADDING.SMALL,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    textAlign: 'center',
    marginBottom: SIZES.PADDING.LARGE,
  },
  retryButton: {
    paddingHorizontal: SIZES.PADDING.XLARGE,
    paddingVertical: SIZES.PADDING.SMALL,
    borderRadius: SIZES.RADIUS.ROUND,
    backgroundColor: COLORS.PRIMARY,
  },
  retryButtonText: {
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
  },
});

export default DealerManagerQuotationDetailScreen;


