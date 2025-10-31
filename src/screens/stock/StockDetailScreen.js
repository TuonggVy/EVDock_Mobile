import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Image,
  Dimensions,
} from 'react-native';
import { COLORS, SIZES } from '../../constants';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import agencyStockService from '../../services/agencyStockService';
import LoadingScreen from '../../components/common/LoadingScreen';

const { width } = Dimensions.get('window');

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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Stock Details</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Images */}
        {images.length > 0 && (
          <View style={styles.imageSection}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} pagingEnabled>
              {images.map((img, index) => (
                <Image
                  key={img.id || index}
                  source={{ uri: img.imageUrl }}
                  style={styles.image}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Motorbike Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Motorbike Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Name:</Text>
              <Text style={styles.infoValue}>{motorbike.name || 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Model:</Text>
              <Text style={styles.infoValue}>{motorbike.model || 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Version:</Text>
              <Text style={styles.infoValue}>{motorbike.version || 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Origin:</Text>
              <Text style={styles.infoValue}>{motorbike.makeFrom || 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Color:</Text>
              <Text style={styles.infoValue}>{color.colorType || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Stock Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Stock Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Quantity:</Text>
              <View style={[
                styles.quantityBadge,
                stockDetail.quantity > 0 ? styles.inStockBadge : styles.outOfStockBadge
              ]}>
                <Text style={styles.quantityText}>{stockDetail.quantity}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Selling Price:</Text>
              <Text style={[styles.infoValue, styles.priceValue]}>
                {formatPrice(stockDetail.price)}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Created At:</Text>
              <Text style={styles.infoValue}>{formatDate(stockDetail.createAt)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Last Updated:</Text>
              <Text style={styles.infoValue}>{formatDate(stockDetail.updateAt)}</Text>
            </View>
          </View>
        </View>

        {/* Promotions */}
        {promotions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Promotions</Text>
            {promotions.map((promoItem, index) => {
              const promo = promoItem.stockPromotion || {};
              const valueDisplay = promo.valueType === 'PERCENT' 
                ? `${promo.value}%` 
                : formatPrice(promo.value);
              
              return (
                <View key={promoItem.stockPromotionId || index} style={styles.promoCard}>
                  <View style={styles.promoHeader}>
                    <Text style={styles.promoName}>{promo.name}</Text>
                    <View style={[styles.promoStatus, promo.status === 'ACTIVE' && styles.activePromo]}>
                      <Text style={styles.promoStatusText}>
                        {promo.status === 'ACTIVE' ? 'Active' : promo.status}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.promoDescription}>{promo.description}</Text>
                  <View style={styles.promoDetails}>
                    <View style={styles.promoDetailRow}>
                      <Text style={styles.promoDetailLabel}>Value:</Text>
                      <Text style={styles.promoDetailValue}>{valueDisplay}</Text>
                    </View>
                    <View style={styles.promoDetailRow}>
                      <Text style={styles.promoDetailLabel}>Start Date:</Text>
                      <Text style={styles.promoDetailValue}>{formatDate(promo.startAt)}</Text>
                    </View>
                    <View style={styles.promoDetailRow}>
                      <Text style={styles.promoDetailLabel}>End Date:</Text>
                      <Text style={styles.promoDetailValue}>{formatDate(promo.endAt)}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Action Buttons at Bottom */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.editButtonBottom}
          onPress={handleEdit}
        >
          <Text style={styles.editButtonTextBottom}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButtonBottom}
          onPress={handleDelete}
        >
          <Text style={styles.deleteButtonTextBottom}>Delete</Text>
        </TouchableOpacity>
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
    paddingTop: Platform.OS === 'ios' ? 0 : 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingTop: Platform.OS === 'ios' ? 20 : 10,
    paddingBottom: SIZES.PADDING.MEDIUM,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: SIZES.RADIUS.ROUND,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: SIZES.FONT.LARGE,
    color: COLORS.TEXT.WHITE,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: SIZES.PADDING.XXXLARGE,
  },
  bottomActions: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.MEDIUM,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    gap: SIZES.PADDING.MEDIUM,
    paddingBottom: Platform.OS === 'ios' ? SIZES.PADDING.LARGE : SIZES.PADDING.MEDIUM,
  },
  editButtonBottom: {
    flex: 1,
    paddingVertical: SIZES.PADDING.MEDIUM,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: SIZES.RADIUS.MEDIUM,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonTextBottom: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
  },
  deleteButtonBottom: {
    flex: 1,
    paddingVertical: SIZES.PADDING.MEDIUM,
    backgroundColor: COLORS.ERROR,
    borderRadius: SIZES.RADIUS.MEDIUM,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonTextBottom: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
  },
  imageSection: {
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  image: {
    width: width,
    height: 250,
    backgroundColor: '#F5F5F5',
  },
  section: {
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    marginBottom: SIZES.PADDING.LARGE,
  },
  sectionTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  infoCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.PADDING.SMALL,
  },
  infoKey: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
  },
  infoValue: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
    flex: 1,
    textAlign: 'right',
  },
  priceValue: {
    color: COLORS.PRIMARY,
    fontSize: SIZES.FONT.LARGE,
  },
  quantityBadge: {
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    borderRadius: SIZES.RADIUS.SMALL,
    minWidth: 60,
    alignItems: 'center',
  },
  inStockBadge: {
    backgroundColor: COLORS.SUCCESS,
  },
  outOfStockBadge: {
    backgroundColor: COLORS.ERROR,
  },
  quantityText: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
  promoCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  promoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.PADDING.SMALL,
  },
  promoName: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    flex: 1,
  },
  promoStatus: {
    paddingHorizontal: SIZES.PADDING.SMALL,
    paddingVertical: 4,
    borderRadius: SIZES.RADIUS.SMALL,
    backgroundColor: COLORS.TEXT.SECONDARY,
  },
  activePromo: {
    backgroundColor: COLORS.SUCCESS,
  },
  promoStatusText: {
    fontSize: SIZES.FONT.XSMALL,
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
  },
  promoDescription: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  promoDetails: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: SIZES.PADDING.SMALL,
  },
  promoDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.PADDING.SMALL,
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
});

export default StockDetailScreen;

