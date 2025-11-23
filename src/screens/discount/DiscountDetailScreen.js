import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {
  ArrowLeft,
  Tag,
  Percent,
  Calendar,
  Building2,
  Bike,
  CheckCircle,
  XCircle,
  Pencil,
  Trash2,
} from 'lucide-react-native';
import { COLORS, SIZES } from '../../constants';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import { discountService } from '../../services/discountService';

const ACCENT_COLOR = '#009DFF';

const DiscountDetailScreen = ({ navigation, route }) => {
  const { discount } = route.params;
  const [discountData, setDiscountData] = useState(discount);
  const [loading, setLoading] = useState(false);
  const { alertConfig, hideAlert, showSuccess, showError, showConfirm } = useCustomAlert();

  useEffect(() => {
    loadDiscountDetail();
  }, []);

  // Reload discount detail when screen comes into focus (e.g., after editing)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadDiscountDetail();
    });

    return unsubscribe;
  }, [navigation]);

  const loadDiscountDetail = async () => {
    if (!discount.id) return;
    
    setLoading(true);
    try {
      const res = await discountService.getDiscountDetail(discount.id);
      if (res?.success) {
        setDiscountData(res.data);
      } else {
        showError('Error', res?.error || 'Unable to load discount detail');
      }
    } catch (error) {
      console.error('Error loading discount detail:', error);
      showError('Error', 'Unable to load discount detail');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigation.navigate('EditDiscount', { discount: discountData });
  };

  const handleDelete = () => {
    showConfirm(
      'Confirm Delete',
      'Are you sure you want to delete this discount?',
      async () => {
        try {
          const res = await discountService.deleteDiscount(discountData.id);
          if (res?.success) {
            showSuccess('Success', 'Discount deleted successfully!');
            setTimeout(() => {
              navigation.goBack();
            }, 1500);
          } else {
            showError('Error', res?.error || 'Unable to delete discount');
          }
        } catch (error) {
          console.error('Error deleting discount:', error);
          showError('Error', 'Unable to delete discount');
        }
      }
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatValue = () => {
    if (!discountData) return 'N/A';
    const numericValue = Number(discountData.value);
    if (discountData.valueType === 'PERCENT') {
      return `${discountData.value}%`;
    }
    return Number.isNaN(numericValue)
      ? `${discountData.value || 0} VND`
      : `${numericValue.toLocaleString('vi-VN')} VND`;
  };

  const formatPrice = (price) => {
    if (!price) return 'N/A';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={ACCENT_COLOR} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={COLORS.TEXT.WHITE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Discount Detail</Text>
        <View style={styles.headerActions}>
          {/* Empty space to balance layout */}
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Discount Icon */}
        <View style={styles.iconContainer}>
          <Tag size={80} color={ACCENT_COLOR} />
        </View>

        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Discount Name</Text>
              <Text style={styles.infoValue}>{discountData.name || 'N/A'}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Type</Text>
              <View style={styles.typeBadge}>
                <Tag size={14} color={ACCENT_COLOR} />
                <Text style={styles.typeText}>
                  {discountData.type === 'VOLUME' ? 'Volume' : 'Special'}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Value Type</Text>
              <Text style={styles.infoValue}>
                {discountData.valueType === 'PERCENT' ? 'Percentage' : 'Fixed Amount'}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Discount Value</Text>
              <View style={styles.valueBadge}>
                <Text style={styles.valueText}>{formatValue()}</Text>
              </View>
            </View>

            {discountData.min_quantity && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Minimum Quantity</Text>
                <Text style={styles.infoValue}>{discountData.min_quantity}</Text>
              </View>
            )}

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Status</Text>
              <View style={[
                styles.statusBadge,
                { backgroundColor: discountData.status === 'ACTIVE' ? COLORS.SUCCESS : COLORS.ERROR }
              ]}>
                {discountData.status === 'ACTIVE' ? (
                  <CheckCircle size={14} color={COLORS.TEXT.WHITE} style={styles.statusIcon} />
                ) : (
                  <XCircle size={14} color={COLORS.TEXT.WHITE} style={styles.statusIcon} />
                )}
                <Text style={styles.statusText}>
                  {discountData.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Discount ID</Text>
              <Text style={styles.infoValue}>#{discountData.id}</Text>
            </View>
          </View>
        </View>

        {/* Date Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Date Information</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.detailLabelWrapper}>
                <Calendar size={16} color={COLORS.TEXT.SECONDARY} />
                <Text style={styles.infoLabel}>Start Date</Text>
              </View>
              <Text style={styles.infoValue}>{formatDate(discountData.startAt)}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <View style={styles.detailLabelWrapper}>
                <Calendar size={16} color={COLORS.TEXT.SECONDARY} />
                <Text style={styles.infoLabel}>End Date</Text>
              </View>
              <Text style={styles.infoValue}>{formatDate(discountData.endAt)}</Text>
            </View>
          </View>
        </View>

        {/* Agency Information */}
        {discountData.agency && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Agency Information</Text>
            
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <View style={styles.detailLabelWrapper}>
                  <Building2 size={16} color={COLORS.TEXT.SECONDARY} />
                  <Text style={styles.infoLabel}>Agency Name</Text>
                </View>
                <Text style={styles.infoValue}>{discountData.agency.name || 'N/A'}</Text>
              </View>
              
              {discountData.agency.location && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Location</Text>
                  <Text style={styles.infoValue}>{discountData.agency.location}</Text>
                </View>
              )}

              {discountData.agency.address && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Address</Text>
                  <Text style={styles.infoValue}>{discountData.agency.address}</Text>
                </View>
              )}

              {discountData.agency.contactInfo && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Contact Info</Text>
                  <Text style={styles.infoValue}>{discountData.agency.contactInfo}</Text>
                </View>
              )}

              {discountData.agency.status && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Agency Status</Text>
                  <Text style={styles.infoValue}>{discountData.agency.status}</Text>
                </View>
              )}

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Agency ID</Text>
                <Text style={styles.infoValue}>#{discountData.agency.id}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Motorbike Information */}
        {discountData.motorbike && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Motorbike Information</Text>
            
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <View style={styles.detailLabelWrapper}>
                  <Bike size={16} color={COLORS.TEXT.SECONDARY} />
                  <Text style={styles.infoLabel}>Motorbike Name</Text>
                </View>
                <Text style={styles.infoValue}>{discountData.motorbike.name || 'N/A'}</Text>
              </View>
              
              {discountData.motorbike.price && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Price</Text>
                  <Text style={styles.infoValue}>{formatPrice(discountData.motorbike.price)}</Text>
                </View>
              )}

              {discountData.motorbike.model && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Model</Text>
                  <Text style={styles.infoValue}>{discountData.motorbike.model}</Text>
                </View>
              )}

              {discountData.motorbike.makeFrom && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Made From</Text>
                  <Text style={styles.infoValue}>{discountData.motorbike.makeFrom}</Text>
                </View>
              )}

              {discountData.motorbike.version && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Version</Text>
                  <Text style={styles.infoValue}>{discountData.motorbike.version}</Text>
                </View>
              )}

              {discountData.motorbike.description && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Description</Text>
                  <Text style={styles.infoValue}>{discountData.motorbike.description}</Text>
                </View>
              )}

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Motorbike ID</Text>
                <Text style={styles.infoValue}>#{discountData.motorbike.id}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={handleEdit}
          >
            <Pencil size={20} color={COLORS.TEXT.WHITE} />
            <Text style={styles.editButtonText}>Edit Discount</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleDelete}
          >
            <Trash2 size={20} color={COLORS.TEXT.WHITE} />
            <Text style={styles.deleteButtonText}>Delete Discount</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.PADDING.LARGE,
    paddingTop: Platform.OS === 'ios' ? SIZES.PADDING.XLARGE : SIZES.PADDING.XXXLARGE + 5,
    paddingBottom: SIZES.PADDING.MEDIUM,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: SIZES.FONT.XXLARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
    flex: 1,
    textAlign: 'center',
  },
  headerActions: {
    width: 60,
    alignItems: 'flex-end',
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.SURFACE,
    borderTopLeftRadius: SIZES.RADIUS.XXLARGE,
    borderTopRightRadius: SIZES.RADIUS.XXLARGE,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    paddingVertical: SIZES.PADDING.XXXLARGE,
    backgroundColor: COLORS.SURFACE,
  },
  section: {
    paddingHorizontal: SIZES.PADDING.LARGE,
    marginBottom: SIZES.PADDING.LARGE,
  },
  sectionTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  infoCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.LARGE,
    padding: SIZES.PADDING.MEDIUM,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: SIZES.PADDING.MEDIUM,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER.PRIMARY,
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
  detailLabelWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.XSMALL,
    borderRadius: SIZES.RADIUS.SMALL,
    gap: 6,
  },
  statusIcon: {
    marginRight: 0,
  },
  statusText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 157, 255, 0.12)',
    paddingHorizontal: SIZES.PADDING.SMALL,
    paddingVertical: 4,
    borderRadius: SIZES.RADIUS.SMALL,
    gap: 6,
  },
  typeText: {
    fontSize: SIZES.FONT.SMALL,
    color: ACCENT_COLOR,
    fontWeight: '600',
  },
  valueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 157, 255, 0.12)',
    paddingHorizontal: SIZES.PADDING.SMALL,
    paddingVertical: 4,
    borderRadius: SIZES.RADIUS.SMALL,
    gap: 6,
  },
  valueText: {
    fontSize: SIZES.FONT.SMALL,
    color: ACCENT_COLOR,
    fontWeight: '600',
  },
  actionsSection: {
    paddingHorizontal: SIZES.PADDING.LARGE,
    paddingBottom: SIZES.PADDING.XXXLARGE,
  },
  actionButton: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.LARGE,
    paddingVertical: SIZES.PADDING.MEDIUM,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SIZES.PADDING.SMALL,
    marginBottom: SIZES.PADDING.MEDIUM,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  editButton: {
    backgroundColor: ACCENT_COLOR,
  },
  editButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
  deleteButton: {
    backgroundColor: COLORS.ERROR,
  },
  deleteButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
});

export default DiscountDetailScreen;

