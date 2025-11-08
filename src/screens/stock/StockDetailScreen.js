import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES } from '../../constants';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import agencyStockService from '../../services/agencyStockService';
import LoadingScreen from '../../components/common/LoadingScreen';
import { ArrowLeft, Pencil, Trash2, Package } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const PRIMARY_ACCENT = '#009DFF';

const StockDetailScreen = ({ navigation, route }) => {
  const { stockId } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [stockDetail, setStockDetail] = useState(null);
  const { alertConfig, hideAlert, showError, showConfirm } = useCustomAlert();

  useEffect(() => {
    loadStockDetail();
  }, [stockId]);

  // Refresh when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadStockDetail();
    });

    return unsubscribe;
  }, [navigation]);

  const loadStockDetail = async () => {
    try {
      setLoading(true);
      const response = await agencyStockService.getAgencyStockDetail(stockId);
      
      if (response.success) {
        setStockDetail(response.data);
      } else {
        showError('Error', response.error || 'Failed to load stock information');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading stock detail:', error);
      showError('Error', 'Failed to load stock information');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigation.navigate('EditStock', { stockId, stock: stockDetail });
  };

  const handleDelete = () => {
    showConfirm(
      'Confirm Delete',
      'Are you sure you want to delete this stock?',
      async () => {
        try {
          const response = await agencyStockService.deleteAgencyStock(stockId);
          if (response.success) {
            navigation.goBack();
          } else {
            showError('Error', response.error || 'Failed to delete stock');
          }
        } catch (error) {
          console.error('Error deleting stock:', error);
          showError('Error', 'Failed to delete stock');
        }
      }
    );
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderDetailRow = (label, value) => (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value || 'N/A'}</Text>
    </View>
  );

  if (loading) {
    return <LoadingScreen />;
  }

  if (!stockDetail) {
    return null;
  }

  const motorbike = stockDetail.motorbike || {};
  const color = stockDetail.color || {};
  const images = motorbike.images || [];
  const promotions = stockDetail.agencyStockPromotion || [];
  const primaryImage = images[0]?.imageUrl;
  const quantityStatus = stockDetail.quantity > 0 ? 'In Stock' : 'Out of Stock';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={18} color={COLORS.TEXT.WHITE} />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={styles.headerTitleText}>Stock Details</Text>
            <Text style={styles.headerSubtitle}>{motorbike.model || 'Inventory item'}</Text>
          </View>
          <View style={styles.headerActions} />
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.imageContainer}>
          {primaryImage ? (
            <Image source={{ uri: primaryImage }} style={styles.stockImage} resizeMode="cover" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Package size={48} color={COLORS.TEXT.SECONDARY} />
              <Text style={styles.imagePlaceholderText}>No image available</Text>
            </View>
          )}
          <View
            style={[
              styles.statusBadge,
              stockDetail.quantity > 0 ? styles.statusBadgeSuccess : styles.statusBadgeError,
            ]}
          >
            <Text style={styles.statusText}>{quantityStatus}</Text>
          </View>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.titleRow}>
            <Text style={styles.stockName}>{motorbike.name || 'Unnamed Motorbike'}</Text>
            <Text style={styles.stockPrice}>{formatPrice(stockDetail.price)}</Text>
          </View>
          <View style={styles.metaRow}>
            <View style={styles.metaBadge}>
              <Text style={styles.metaBadgeText}>{motorbike.model || 'Unknown model'}</Text>
            </View>
            <Text style={styles.metaQuantity}>Quantity: {stockDetail.quantity}</Text>
          </View>
          {motorbike.description ? (
            <Text style={styles.stockDescription}>{motorbike.description}</Text>
          ) : null}
        </View>

        <View style={styles.cardsWrapper}>
          <View style={styles.detailCard}>
            <Text style={styles.cardTitle}>Motorbike Information</Text>
            {renderDetailRow('Model', motorbike.model)}
            {renderDetailRow('Version', motorbike.version)}
            {renderDetailRow('Origin', motorbike.makeFrom)}
            {renderDetailRow('Color', color.colorType)}
          </View>

          <View style={styles.detailCard}>
            <Text style={styles.cardTitle}>Stock Information</Text>
            <View style={styles.quantityRow}>
              <Text style={styles.detailLabel}>Quantity</Text>
              <View
                style={[
                  styles.quantityBadge,
                  stockDetail.quantity > 0 ? styles.quantityBadgeInStock : styles.quantityBadgeOut,
                ]}
              >
                <Text
                  style={[
                    styles.quantityText,
                    stockDetail.quantity <= 0 && styles.quantityTextOut,
                  ]}
                >
                  {stockDetail.quantity}
                </Text>
              </View>
            </View>
            {renderDetailRow('Selling Price', formatPrice(stockDetail.price))}
            {renderDetailRow('Created At', formatDate(stockDetail.createAt))}
            {renderDetailRow('Last Updated', formatDate(stockDetail.updateAt))}
          </View>
        </View>

        {promotions.length > 0 && (
          <View style={styles.promotionsSection}>
            <Text style={styles.sectionTitle}>Active Promotions</Text>
            {promotions.map((promoItem, index) => {
              const promo = promoItem.stockPromotion || {};
              const valueDisplay =
                promo.valueType === 'PERCENT' ? `${promo.value}%` : formatPrice(promo.value);

              return (
                <View key={promoItem.stockPromotionId || index} style={styles.promoCard}>
                  <View style={styles.promoHeader}>
                    <Text style={styles.promoName}>{promo.name}</Text>
                    <View
                      style={[
                        styles.promoStatus,
                        promo.status === 'ACTIVE' && styles.promoStatusActive,
                      ]}
                    >
                      <Text style={styles.promoStatusText}>
                        {promo.status === 'ACTIVE' ? 'Active' : promo.status || 'Inactive'}
                      </Text>
                    </View>
                  </View>
                  {promo.description ? (
                    <Text style={styles.promoDescription}>{promo.description}</Text>
                  ) : null}
                  <View style={styles.promoDetails}>
                    <View style={styles.promoDetailRow}>
                      <Text style={styles.promoDetailLabel}>Value</Text>
                      <Text style={styles.promoDetailValue}>{valueDisplay}</Text>
                    </View>
                    <View style={styles.promoDetailRow}>
                      <Text style={styles.promoDetailLabel}>Start Date</Text>
                      <Text style={styles.promoDetailValue}>{formatDate(promo.startAt)}</Text>
                    </View>
                    <View style={styles.promoDetailRow}>
                      <Text style={styles.promoDetailLabel}>End Date</Text>
                      <Text style={styles.promoDetailValue}>{formatDate(promo.endAt)}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.primaryAction} onPress={handleEdit}>
            <LinearGradient
              colors={[PRIMARY_ACCENT, PRIMARY_ACCENT]}
              style={styles.primaryActionGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.primaryActionContent}>
                <Pencil size={18} color={COLORS.TEXT.WHITE} />
                <Text style={styles.primaryActionText}>Edit Stock</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryAction} onPress={handleDelete}>
            <View style={styles.secondaryActionContent}>
              <Trash2 size={18} color={COLORS.TEXT.WHITE} />
              <Text style={styles.secondaryActionText}>Delete Stock</Text>
            </View>
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
  headerTitleText: {
    fontSize: SIZES.FONT.HEADER,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
  headerSubtitle: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    marginTop: 2,
  },
  headerActions: {
    width: 40,
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.SURFACE,
    borderTopLeftRadius: SIZES.RADIUS.XXLARGE,
    borderTopRightRadius: SIZES.RADIUS.XXLARGE,
  },
  scrollContent: {
    paddingBottom: SIZES.PADDING.XXXLARGE,
  },
  imageContainer: {
    position: 'relative',
    height: 240,
    marginHorizontal: SIZES.PADDING.LARGE,
    marginBottom: SIZES.PADDING.LARGE,
    borderRadius: SIZES.RADIUS.LARGE,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  stockImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SIZES.PADDING.SMALL,
  },
  imagePlaceholderText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
  },
  statusBadge: {
    position: 'absolute',
    top: SIZES.PADDING.MEDIUM,
    right: SIZES.PADDING.MEDIUM,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.XSMALL,
    borderRadius: SIZES.RADIUS.MEDIUM,
  },
  statusBadgeSuccess: {
    backgroundColor: COLORS.SUCCESS,
  },
  statusBadgeError: {
    backgroundColor: COLORS.ERROR,
  },
  statusText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.WHITE,
    fontWeight: 'bold',
  },
  infoSection: {
    paddingHorizontal: SIZES.PADDING.LARGE,
    marginBottom: SIZES.PADDING.XLARGE,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  stockName: {
    fontSize: SIZES.FONT.XXLARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    flex: 1,
    marginRight: SIZES.PADDING.MEDIUM,
  },
  stockPrice: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.SECONDARY,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  metaBadge: {
    backgroundColor: PRIMARY_ACCENT,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.XSMALL,
    borderRadius: SIZES.RADIUS.MEDIUM,
  },
  metaBadgeText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  metaQuantity: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    fontWeight: '500',
  },
  stockDescription: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
    lineHeight: 22,
  },
  cardsWrapper: {
    paddingHorizontal: SIZES.PADDING.LARGE,
    gap: SIZES.PADDING.LARGE,
  },
  detailCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.LARGE,
    padding: SIZES.PADDING.LARGE,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#EEF1F4',
  },
  cardTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SIZES.PADDING.SMALL,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailLabel: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '600',
    textAlign: 'right',
  },
  quantityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.PADDING.SMALL,
  },
  quantityBadge: {
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.XSMALL,
    borderRadius: SIZES.RADIUS.MEDIUM,
    minWidth: 64,
    alignItems: 'center',
  },
  quantityBadgeInStock: {
    backgroundColor: 'rgba(0, 157, 255, 0.12)',
  },
  quantityBadgeOut: {
    backgroundColor: 'rgba(255, 99, 99, 0.15)',
  },
  quantityText: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: '600',
    color: PRIMARY_ACCENT,
  },
  quantityTextOut: {
    color: COLORS.ERROR,
  },
  promotionsSection: {
    paddingHorizontal: SIZES.PADDING.LARGE,
    marginTop: SIZES.PADDING.XLARGE,
    gap: SIZES.PADDING.MEDIUM,
  },
  sectionTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
  },
  promoCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.LARGE,
    padding: SIZES.PADDING.LARGE,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#EEF1F4',
  },
  promoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.PADDING.SMALL,
  },
  promoName: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    flex: 1,
    marginRight: SIZES.PADDING.SMALL,
  },
  promoStatus: {
    paddingHorizontal: SIZES.PADDING.SMALL,
    paddingVertical: SIZES.PADDING.XSMALL,
    borderRadius: SIZES.RADIUS.SMALL,
    backgroundColor: '#F1F3F5',
  },
  promoStatusActive: {
    backgroundColor: 'rgba(0, 157, 255, 0.15)',
  },
  promoStatusText: {
    fontSize: SIZES.FONT.XSMALL,
    color: PRIMARY_ACCENT,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  promoDescription: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: SIZES.PADDING.MEDIUM,
    lineHeight: 20,
  },
  promoDetails: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: SIZES.PADDING.SMALL,
    gap: SIZES.PADDING.SMALL,
  },
  promoDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  promoDetailLabel: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
  },
  promoDetailValue: {
    fontSize: SIZES.FONT.SMALL,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
  },
  actionSection: {
    paddingHorizontal: SIZES.PADDING.LARGE,
    paddingTop: SIZES.PADDING.XLARGE,
    paddingBottom: SIZES.PADDING.XXLARGE,
    gap: SIZES.PADDING.MEDIUM,
  },
  primaryAction: {
    borderRadius: SIZES.RADIUS.LARGE,
    overflow: 'hidden',
  },
  primaryActionGradient: {
    paddingVertical: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
  },
  primaryActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.PADDING.SMALL,
  },
  primaryActionText: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
  secondaryAction: {
    backgroundColor: COLORS.ERROR,
    borderRadius: SIZES.RADIUS.LARGE,
    paddingVertical: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
  },
  secondaryActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.PADDING.SMALL,
  },
  secondaryActionText: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
});

export default StockDetailScreen;

