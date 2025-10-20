import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES } from '../../constants';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';

const PromotionDetailScreen = ({ navigation, route }) => {
  const { promotion } = route.params;
  const { alertConfig, hideAlert, showConfirm, showInfo } = useCustomAlert();
  
  const [loading, setLoading] = useState(false);

  const handleEdit = () => {
    navigation.navigate('EditPromotion', { promotion });
  };

  const handleDelete = () => {
    showConfirm(
      'Delete Promotion',
      `Are you sure you want to delete "${promotion.name}"? This action cannot be undone.`,
      () => deletePromotion()
    );
  };

  const deletePromotion = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // await promotionService.deletePromotion(promotion.id);
      
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      showInfo('Success', 'Promotion deleted successfully');
      
      // Navigate back after a short delay
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
      
    } catch (error) {
      console.error('Error deleting promotion:', error);
      showInfo('Error', 'Failed to delete promotion. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this promotion: ${promotion.name} - ${promotion.description}`,
        title: promotion.name,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return COLORS.SUCCESS;
      case 'scheduled': return COLORS.WARNING;
      case 'expired': return COLORS.ERROR;
      case 'paused': return COLORS.TEXT.SECONDARY;
      default: return COLORS.TEXT.SECONDARY;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Active';
      case 'scheduled': return 'Scheduled';
      case 'expired': return 'Expired';
      case 'paused': return 'Paused';
      default: return 'Unknown';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatValue = (type, value) => {
    return type === 'percentage' ? `${value}%` : `$${value.toLocaleString()}`;
  };

  const renderInfoItem = (label, value, icon) => (
    <View style={styles.infoItem}>
      <View style={styles.infoIconContainer}>
        <Text style={styles.infoIcon}>{icon}</Text>
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );

  const renderDealerItem = (dealer, index) => (
    <View key={index} style={styles.dealerItem}>
      <View style={styles.dealerInfo}>
        <Text style={styles.dealerName}>{dealer}</Text>
      </View>
      <View style={styles.dealerStatus}>
        <Text style={styles.dealerStatusText}>Active</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={styles.headerTitleText}>Promotion Details</Text>
          </View>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShare}
          >
            <Text style={styles.shareIcon}>📤</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Promotion Header */}
        <View style={styles.promotionHeader}>
          <View style={styles.promotionInfo}>
            <Text style={styles.promotionCode}>{promotion.code}</Text>
            <Text style={styles.promotionName}>{promotion.name}</Text>
            <Text style={styles.promotionDescription}>{promotion.description}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(promotion.status) }]}>
            <Text style={styles.statusText}>{getStatusText(promotion.status)}</Text>
          </View>
        </View>

        {/* Discount Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Discount Information</Text>
          <View style={styles.discountCard}>
            <View style={styles.discountMain}>
              <Text style={styles.discountValue}>
                {formatValue(promotion.type, promotion.value)}
              </Text>
              <Text style={styles.discountType}>
                {promotion.type === 'percentage' ? 'Percentage Discount' : 'Fixed Amount Discount'}
              </Text>
            </View>
            <View style={styles.discountDetails}>
              <View style={styles.discountDetailItem}>
                <Text style={styles.discountDetailLabel}>Min. Order</Text>
                <Text style={styles.discountDetailValue}>${promotion.minOrderValue.toLocaleString()}</Text>
              </View>
              {promotion.maxDiscount && (
                <View style={styles.discountDetailItem}>
                  <Text style={styles.discountDetailLabel}>Max. Discount</Text>
                  <Text style={styles.discountDetailValue}>${promotion.maxDiscount.toLocaleString()}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Validity Period */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Validity Period</Text>
          <View style={styles.validityCard}>
            {renderInfoItem('Start Date', formatDate(promotion.startDate), '📅')}
            {renderInfoItem('End Date', formatDate(promotion.endDate), '📅')}
            {renderInfoItem('Duration', `${Math.ceil((new Date(promotion.endDate) - new Date(promotion.startDate)) / (1000 * 60 * 60 * 24))} days`, '⏱️')}
          </View>
        </View>

        {/* Usage Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Usage Statistics</Text>
          <View style={styles.usageCard}>
            <View style={styles.usageItem}>
              <Text style={styles.usageNumber}>{promotion.usedCount}</Text>
              <Text style={styles.usageLabel}>Used</Text>
            </View>
            <View style={styles.usageItem}>
              <Text style={styles.usageNumber}>{promotion.usageLimit}</Text>
              <Text style={styles.usageLabel}>Limit</Text>
            </View>
            <View style={styles.usageItem}>
              <Text style={styles.usageNumber}>
                {Math.round((promotion.usedCount / promotion.usageLimit) * 100)}%
              </Text>
              <Text style={styles.usageLabel}>Usage Rate</Text>
            </View>
          </View>
        </View>

        {/* Applicable Dealers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Applicable Dealers</Text>
          <View style={styles.dealersCard}>
            {promotion.applicableDealers && promotion.applicableDealers.length > 0 
              ? promotion.applicableDealers.map((dealer, index) => renderDealerItem(dealer, index))
              : <Text style={styles.noDealersText}>No dealers assigned</Text>
            }
          </View>
        </View>

        {/* Additional Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Information</Text>
          <View style={styles.additionalInfoCard}>
            {renderInfoItem('Promotion ID', promotion.id, '🆔')}
            {renderInfoItem('Created By', promotion.createdBy, '👤')}
            {renderInfoItem('Created Date', formatDate(promotion.createdAt), '📅')}
            {renderInfoItem('Status', getStatusText(promotion.status), '📊')}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEdit}
          >
            <LinearGradient
              colors={COLORS.GRADIENT.GREEN || ['#4CAF50', '#66BB6A']}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.editButtonText}>✏️ Edit Promotion</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.deleteButton, loading && styles.deleteButtonDisabled]}
            onPress={handleDelete}
            disabled={loading}
          >
            <Text style={styles.deleteButtonText}>
              {loading ? 'Deleting...' : '🗑️ Delete Promotion'}
            </Text>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
  },
  
  // Header styles
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
  backIcon: {
    fontSize: SIZES.FONT.LARGE,
    color: COLORS.TEXT.WHITE,
    fontWeight: 'bold',
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
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: SIZES.RADIUS.ROUND,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareIcon: {
    fontSize: SIZES.FONT.MEDIUM,
  },

  // Content
  content: {
    flex: 1,
    backgroundColor: COLORS.SURFACE,
    borderTopLeftRadius: SIZES.RADIUS.XXLARGE,
    borderTopRightRadius: SIZES.RADIUS.XXLARGE,
  },
  scrollContent: {
    paddingBottom: SIZES.PADDING.XXXLARGE,
  },

  // Promotion header
  promotionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: SIZES.PADDING.LARGE,
    paddingTop: SIZES.PADDING.LARGE,
    paddingBottom: SIZES.PADDING.MEDIUM,
  },
  promotionInfo: {
    flex: 1,
    marginRight: SIZES.PADDING.MEDIUM,
  },
  promotionCode: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginBottom: SIZES.PADDING.XSMALL,
  },
  promotionName: {
    fontSize: SIZES.FONT.XXLARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SIZES.PADDING.SMALL,
  },
  promotionDescription: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
    lineHeight: 22,
  },
  statusBadge: {
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    borderRadius: SIZES.RADIUS.MEDIUM,
  },
  statusText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.WHITE,
    fontWeight: 'bold',
  },

  // Sections
  section: {
    paddingHorizontal: SIZES.PADDING.LARGE,
    marginBottom: SIZES.PADDING.XLARGE,
  },
  sectionTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SIZES.PADDING.LARGE,
  },

  // Discount card
  discountCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.LARGE,
    padding: SIZES.PADDING.LARGE,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  discountMain: {
    alignItems: 'center',
    marginBottom: SIZES.PADDING.LARGE,
  },
  discountValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.SECONDARY,
    marginBottom: SIZES.PADDING.SMALL,
  },
  discountType: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
    textAlign: 'center',
  },
  discountDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  discountDetailItem: {
    alignItems: 'center',
  },
  discountDetailLabel: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: SIZES.PADDING.XSMALL,
  },
  discountDetailValue: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
  },

  // Validity card
  validityCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.LARGE,
    padding: SIZES.PADDING.MEDIUM,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },

  // Usage card
  usageCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.LARGE,
    padding: SIZES.PADDING.LARGE,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  usageItem: {
    alignItems: 'center',
  },
  usageNumber: {
    fontSize: SIZES.FONT.XXLARGE,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginBottom: SIZES.PADDING.XSMALL,
  },
  usageLabel: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    textAlign: 'center',
  },

  // Dealers card
  dealersCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.LARGE,
    padding: SIZES.PADDING.MEDIUM,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  dealerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SIZES.PADDING.SMALL,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dealerInfo: {
    flex: 1,
  },
  dealerName: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
  },
  dealerStatus: {
    backgroundColor: COLORS.SUCCESS,
    paddingHorizontal: SIZES.PADDING.SMALL,
    paddingVertical: SIZES.PADDING.XSMALL,
    borderRadius: SIZES.RADIUS.SMALL,
  },
  dealerStatusText: {
    fontSize: SIZES.FONT.XSMALL,
    color: COLORS.TEXT.WHITE,
    fontWeight: 'bold',
  },
  noDealersText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
    textAlign: 'center',
    paddingVertical: SIZES.PADDING.LARGE,
  },

  // Additional info card
  additionalInfoCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.LARGE,
    padding: SIZES.PADDING.MEDIUM,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },

  // Info items
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.PADDING.SMALL,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: SIZES.RADIUS.MEDIUM,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.PADDING.MEDIUM,
  },
  infoIcon: {
    fontSize: SIZES.FONT.MEDIUM,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
  },

  // Action buttons
  actionSection: {
    paddingHorizontal: SIZES.PADDING.LARGE,
    gap: SIZES.PADDING.MEDIUM,
  },
  editButton: {
    borderRadius: SIZES.RADIUS.LARGE,
    overflow: 'hidden',
  },
  buttonGradient: {
    paddingVertical: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
  deleteButton: {
    backgroundColor: COLORS.ERROR,
    borderRadius: SIZES.RADIUS.LARGE,
    paddingVertical: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
  },
  deleteButtonDisabled: {
    opacity: 0.6,
  },
  deleteButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
});

export default PromotionDetailScreen;
