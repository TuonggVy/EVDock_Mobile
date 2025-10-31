import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from 'react-native';
import { COLORS, SIZES } from '../../constants';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import stockPromotionService from '../../services/stockPromotionService';

const StockPromotionDetailScreen = ({ navigation, route }) => {
  const { stockPromotionId } = route.params || {};
  const [stockPromotion, setStockPromotion] = useState(null);
  const [loading, setLoading] = useState(true);

  const { alertConfig, hideAlert, showSuccess, showError } = useCustomAlert();

  useEffect(() => {
    loadStockPromotionDetail();
  }, [stockPromotionId]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadStockPromotionDetail();
    });
    return unsubscribe;
  }, [navigation]);

  const loadStockPromotionDetail = async () => {
    try {
      setLoading(true);
      console.log('🔄 [StockPromotionDetail] Loading detail for ID:', stockPromotionId);
      
      const response = await stockPromotionService.getStockPromotionDetail(stockPromotionId);
      
      console.log('📦 [StockPromotionDetail] API Response:', {
        success: response.success,
        data: response.data
      });

      if (response.success) {
        setStockPromotion(response.data);
      } else {
        showError('Lỗi', response.error || 'Không thể tải chi tiết stock promotion');
        navigation.goBack();
      }
    } catch (error) {
      console.error('❌ [StockPromotionDetail] Exception:', error);
      showError('Lỗi', 'Không thể tải chi tiết stock promotion');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return COLORS.SUCCESS;
      case 'INACTIVE': return COLORS.TEXT.SECONDARY;
      default: return COLORS.TEXT.SECONDARY;
    }
  };

  const formatValue = (value, valueType) => {
    if (valueType === 'PERCENT') {
      return `${value}%`;
    } else if (valueType === 'FIXED') {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(value || 0);
    }
    return value;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderInfoRow = (label, value, valueStyle = {}) => (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, valueStyle]}>{value}</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!stockPromotion) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Không tìm thấy stock promotion</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết Stock Promotion</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={styles.statusTitle}>Trạng thái</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(stockPromotion.status) }]}>
              <Text style={styles.statusText}>{stockPromotion.status || 'N/A'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin chung</Text>
          {renderInfoRow('Tên', stockPromotion.name || 'N/A')}
          {renderInfoRow('Mô tả', stockPromotion.description || 'N/A')}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin giá trị</Text>
          {renderInfoRow('Loại giảm giá', stockPromotion.valueType || 'N/A')}
          {renderInfoRow('Giá trị gốc', stockPromotion.value?.toString() || 'N/A')}
          {renderInfoRow('Giá trị', formatValue(stockPromotion.value, stockPromotion.valueType), {
            color: COLORS.SUCCESS,
            fontWeight: 'bold',
          })}
          {renderInfoRow('Ngày bắt đầu', formatDate(stockPromotion.startAt))}
          {renderInfoRow('Ngày kết thúc', formatDate(stockPromotion.endAt))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Danh sách Agency Stock Promotion
            {stockPromotion.agencyStockPromotion ? ` (${stockPromotion.agencyStockPromotion.length})` : ' (0)'}
          </Text>
          
          {stockPromotion.agencyStockPromotion && stockPromotion.agencyStockPromotion.length > 0 ? (
            stockPromotion.agencyStockPromotion.map((item, index) => {
              const stock = item?.agencyStock;
              if (!stock) return null;
              
              return (
                <View key={index} style={styles.stockItem}>
                  <View style={styles.stockHeader}>
                    <Text style={styles.stockTitle}>Agency Stock #{stock.id}</Text>
                  </View>
                  
                  <Text style={styles.stockSubtitle}>Thông tin Stock</Text>
                  {renderInfoRow('Số lượng', `${stock.quantity || 0} đơn vị`)}
                  {renderInfoRow('Giá gốc (VND)', stock.price?.toString() || 'N/A')}
                  {renderInfoRow('Giá', formatPrice(stock.price), {
                    color: COLORS.SUCCESS,
                    fontWeight: 'bold',
                  })}

                  {stock.motorbike ? (
                    <>
                      <Text style={[styles.stockSubtitle, { marginTop: SIZES.PADDING.MEDIUM }]}>Thông tin Xe máy</Text>
                      {renderInfoRow('Tên xe', stock.motorbike.name || 'N/A')}
                      {renderInfoRow('Model', stock.motorbike.model || 'N/A')}
                      {renderInfoRow('Version', stock.motorbike.version || 'N/A')}
                      {renderInfoRow('Xuất xứ', stock.motorbike.makeFrom || 'N/A')}
                    </>
                  ) : (
                    <View style={{ marginTop: SIZES.PADDING.MEDIUM }}>
                      <Text style={styles.stockSubtitle}>Thông tin Xe máy</Text>
                      <Text style={styles.infoValue}>N/A</Text>
                    </View>
                  )}

                  {stock.color ? (
                    <>
                      <Text style={[styles.stockSubtitle, { marginTop: SIZES.PADDING.MEDIUM }]}>Thông tin Màu sắc</Text>
                      {renderInfoRow('Loại màu', stock.color.colorType || 'N/A')}
                      {stock.color.id && renderInfoRow('Color ID', stock.color.id?.toString() || 'N/A')}
                    </>
                  ) : (
                    <View style={{ marginTop: SIZES.PADDING.MEDIUM }}>
                      <Text style={styles.stockSubtitle}>Thông tin Màu sắc</Text>
                      <Text style={styles.infoValue}>N/A</Text>
                    </View>
                  )}
                </View>
              );
            })
          ) : (
            <View style={styles.emptyStockList}>
              <Text style={styles.emptyStockText}>Không có agency stock nào trong promotion này</Text>
            </View>
          )}
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
    paddingTop: Platform.OS === 'ios' ? 0 : 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingTop: Platform.OS === 'ios' ? 20 : 0,
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
    padding: SIZES.PADDING.MEDIUM,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
  },
  statusCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.LARGE,
    padding: SIZES.PADDING.MEDIUM,
    marginBottom: SIZES.PADDING.MEDIUM,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusTitle: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
  },
  statusBadge: {
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    borderRadius: SIZES.RADIUS.MEDIUM,
  },
  statusText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
  },
  section: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.LARGE,
    padding: SIZES.PADDING.MEDIUM,
    marginBottom: SIZES.PADDING.MEDIUM,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SIZES.PADDING.SMALL,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoLabel: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
    flex: 1,
  },
  infoValue: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  stockItem: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
    marginBottom: SIZES.PADDING.MEDIUM,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  stockHeader: {
    marginBottom: SIZES.PADDING.SMALL,
    paddingBottom: SIZES.PADDING.SMALL,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  stockTitle: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
  },
  stockSubtitle: {
    fontSize: SIZES.FONT.SMALL,
    fontWeight: 'bold',
    color: COLORS.TEXT.SECONDARY,
    marginBottom: SIZES.PADDING.SMALL,
    textTransform: 'uppercase',
  },
  emptyStockList: {
    padding: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStockText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
    fontStyle: 'italic',
  },
});

export default StockPromotionDetailScreen;

