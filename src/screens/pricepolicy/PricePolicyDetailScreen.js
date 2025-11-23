import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Platform,
} from 'react-native';
import { COLORS, SIZES } from '../../constants';
import pricePolicyService from '../../services/pricePolicyService';
import CustomAlert from '../../components/common/CustomAlert';
import { Pencil, Trash2, ArrowLeft, DollarSign } from 'lucide-react-native';
import { useCustomAlert } from '../../hooks/useCustomAlert';

const PricePolicyDetailScreen = ({ navigation, route }) => {
  const { pricePolicyId } = route.params;
  const [pricePolicy, setPricePolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const { alertConfig, hideAlert, showError, showSuccess, showDeleteConfirm } = useCustomAlert();

  useEffect(() => {
    loadPricePolicyDetail();

    // Reload when screen comes into focus (after editing)
    const unsubscribe = navigation.addListener('focus', () => {
      loadPricePolicyDetail();
    });

    return unsubscribe;
  }, [pricePolicyId, navigation]);

  const loadPricePolicyDetail = async () => {
    try {
      setLoading(true);
      const response = await pricePolicyService.getPricePolicyDetail(pricePolicyId);
      
      if (response.success) {
        setPricePolicy(response.data);
      } else {
        const errorMessage = typeof response.error === 'string' 
          ? response.error 
          : (response.error?.message || JSON.stringify(response.error) || 'Failed to load price policy detail');
        showError('Error', errorMessage);
      }
    } catch (error) {
      console.error('Error loading price policy detail:', error);
      showError('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (pricePolicy) {
      navigation.navigate('EditPricePolicy', { pricePolicy });
    }
  };

  const handleDelete = () => {
    if (!pricePolicy) return;
    showDeleteConfirm(
      'Delete Price Policy',
      `Are you sure you want to delete "${pricePolicy.title}"?`,
      async () => {
        const response = await pricePolicyService.deletePricePolicy(pricePolicyId);
        if (response.success) {
          showSuccess('Success', 'Price policy deleted successfully');
          setTimeout(() => {
            navigation.goBack();
          }, 1500);
        } else {
          const errorMessage = typeof response.error === 'string' 
            ? response.error 
            : (response.error?.message || JSON.stringify(response.error) || 'Failed to delete price policy');
          showError('Error', errorMessage);
        }
      }
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#009DFF" />
        </View>
      );
    }

    if (!pricePolicy) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Price policy not found</Text>
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.iconContainer}>
          <DollarSign size={80} color="#009DFF" />
        </View>

        {/* Price Policy Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Price Policy Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Policy ID</Text>
              <Text style={styles.infoValue}>#{pricePolicy.id}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Title</Text>
              <Text style={styles.infoValue}>{pricePolicy.title || 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Policy Code</Text>
              <Text style={styles.infoValue}>{pricePolicy.policy || 'N/A'}</Text>
            </View>
            {pricePolicy.content && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Content</Text>
                <Text style={styles.infoValue}>{pricePolicy.content}</Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Wholesale Price</Text>
              <Text style={[styles.infoValue, styles.highlightValue]}>
                {pricePolicyService.formatPrice(pricePolicy.wholesalePrice)}
              </Text>
            </View>
          </View>
        </View>

        {/* Agency Information */}
        {pricePolicy.agency && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Agency Information</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Agency Name</Text>
                <Text style={styles.infoValue}>
                  {pricePolicy.agency.name || `Agency #${pricePolicy.agencyId}`}
                </Text>
              </View>
              {pricePolicy.agency.location && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Location</Text>
                  <Text style={styles.infoValue}>{pricePolicy.agency.location}</Text>
                </View>
              )}
              {pricePolicy.agency.address && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Address</Text>
                  <Text style={styles.infoValue}>{pricePolicy.agency.address}</Text>
                </View>
              )}
              {pricePolicy.agency.contactInfo && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Contact</Text>
                  <Text style={styles.infoValue}>{pricePolicy.agency.contactInfo}</Text>
                </View>
              )}
              {pricePolicy.agency.status && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Status</Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: pricePolicy.agency.status === 'Active' ? COLORS.SUCCESS : COLORS.ERROR }
                  ]}>
                    <Text style={styles.statusText}>{pricePolicy.agency.status}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Motorbike Information */}
        {pricePolicy.motorbike && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Motorbike Information</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Motorbike Name</Text>
                <Text style={styles.infoValue}>
                  {pricePolicy.motorbike.name || `Motorbike #${pricePolicy.motorbikeId}`}
                </Text>
              </View>
              {pricePolicy.motorbike.model && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Model</Text>
                  <Text style={styles.infoValue}>{pricePolicy.motorbike.model}</Text>
                </View>
              )}
              {pricePolicy.motorbike.version && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Version</Text>
                  <Text style={styles.infoValue}>{pricePolicy.motorbike.version}</Text>
                </View>
              )}
              {pricePolicy.motorbike.makeFrom && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Made From</Text>
                  <Text style={styles.infoValue}>{pricePolicy.motorbike.makeFrom}</Text>
                </View>
              )}
              {pricePolicy.motorbike.price && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Retail Price</Text>
                  <Text style={[styles.infoValue, styles.highlightValue]}>
                    {pricePolicyService.formatPrice(pricePolicy.motorbike.price)}
                  </Text>
                </View>
              )}
              {pricePolicy.motorbike.description && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Description</Text>
                  <Text style={styles.infoValue}>{pricePolicy.motorbike.description}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={handleEdit}
          >
            <Pencil size={18} color={COLORS.TEXT.WHITE} />
            <Text style={styles.actionButtonText}>Edit Price Policy</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleDelete}
          >
            <Trash2 size={18} color={COLORS.TEXT.WHITE} />
            <Text style={styles.actionButtonText}>Delete Price Policy</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
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

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={20} color={COLORS.TEXT.WHITE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Price Policy Detail</Text>
        <View style={styles.headerActions} />
      </View>

      {renderContent()}
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
    borderRadius: SIZES.RADIUS.ROUND,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: {
    fontSize: SIZES.FONT.XXLARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
    flex: 1,
    textAlign: 'center',
  },
  headerActions: {
    width: 40,
    alignItems: 'flex-end',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.SURFACE,
    borderTopLeftRadius: SIZES.RADIUS.XXLARGE,
    borderTopRightRadius: SIZES.RADIUS.XXLARGE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: COLORS.SURFACE,
    borderTopLeftRadius: SIZES.RADIUS.XXLARGE,
    borderTopRightRadius: SIZES.RADIUS.XXLARGE,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SIZES.PADDING.LARGE,
  },
  emptyText: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.SECONDARY,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.SURFACE,
    borderTopLeftRadius: SIZES.RADIUS.XXLARGE,
    borderTopRightRadius: SIZES.RADIUS.XXLARGE,
  },
  contentInner: {
    padding: SIZES.PADDING.LARGE,
    paddingBottom: SIZES.PADDING.XXXLARGE,
  },
  iconContainer: {
    alignItems: 'center',
    paddingVertical: SIZES.PADDING.XXXLARGE,
  },
  section: {
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
    paddingVertical: SIZES.PADDING.SMALL,
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
  highlightValue: {
    fontSize: SIZES.FONT.LARGE,
    color: COLORS.PRIMARY,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: SIZES.PADDING.SMALL,
    paddingVertical: SIZES.PADDING.XSMALL,
    borderRadius: SIZES.RADIUS.SMALL,
    alignSelf: 'flex-end',
  },
  statusText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
  },
  actionsSection: {
    marginTop: SIZES.PADDING.LARGE,
    paddingBottom: SIZES.PADDING.XXXLARGE,
  },
  actionButton: {
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
    backgroundColor: '#009DFF',
  },
  deleteButton: {
    backgroundColor: '#000000',
  },
  actionButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
});

export default PricePolicyDetailScreen;

