import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { COLORS, SIZES } from '../../constants';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import stockPromotionService from '../../services/stockPromotionService';
import agencyStockService from '../../services/agencyStockService';
import motorbikeService from '../../services/motorbikeService';
import { useAuth } from '../../contexts/AuthContext';
import { Edit, Trash2, CheckSquare, Square, ArrowLeft, Package } from 'lucide-react-native';

const StockPromotionDetailScreen = ({ navigation, route }) => {
  const { stockPromotionId } = route.params || {};
  const { user } = useAuth();
  const [stockPromotion, setStockPromotion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Assignment modal states
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [stocks, setStocks] = useState([]);
  const [selectedStockIds, setSelectedStockIds] = useState([]);
  const [loadingStocks, setLoadingStocks] = useState(false);
  const [applying, setApplying] = useState(false);
  const [motorbikes, setMotorbikes] = useState([]);
  const [motorbikeColors, setMotorbikeColors] = useState({}); // { motorbikeId: { colorId: colorType } }

  const { alertConfig, hideAlert, showSuccess, showError, showDeleteConfirm } = useCustomAlert();

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
        showError('Error', response.error || 'Failed to load stock promotion detail');
        navigation.goBack();
      }
    } catch (error) {
      console.error('❌ [StockPromotionDetail] Exception:', error);
      showError('Error', 'Failed to load stock promotion detail');
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

  const handleNavigateToEdit = () => {
    if (!stockPromotion) return;
    navigation.navigate('EditStockPromotion', {
      stockPromotionId: stockPromotion.id,
    });
  };

  const handleDeletePromotion = async () => {
    hideAlert();
    console.log('🔄 [StockPromotionDetail] Starting delete promotion...');

    setUpdating(true);
    try {
      const response = await stockPromotionService.deleteStockPromotion(stockPromotionId);

      console.log('📥 [StockPromotionDetail] Delete Response:', response);

      if (response.success) {
        showSuccess('Success', 'Stock promotion deleted successfully!', () => {
          navigation.goBack();
        });
      } else {
        showError('Error', response.error || 'Failed to delete stock promotion');
        setUpdating(false);
      }
    } catch (error) {
      console.error('❌ [StockPromotionDetail] Exception:', error);
      showError('Error', 'Failed to delete stock promotion');
      setUpdating(false);
    }
  };

  const confirmDelete = () => {
    showDeleteConfirm(
      'Confirm Delete',
      `Are you sure you want to delete promotion "${stockPromotion?.name || ''}"? This action cannot be undone.`,
      handleDeletePromotion,
      () => {
        setUpdating(false);
      }
    );
  };

  // Load motorbikes
  const loadMotorbikes = async () => {
    try {
      const response = await motorbikeService.getAllMotorbikes({ limit: 1000 });
      if (response.success) {
        setMotorbikes(response.data || []);
      }
    } catch (error) {
      console.error('❌ [StockPromotionDetail] Error loading motorbikes:', error);
    }
  };

  // Load colors for motorbikes
  const loadMotorbikeColors = async (stockList) => {
    try {
      // Get unique motorbike IDs
      const uniqueMotorbikeIds = [...new Set(stockList.map(s => s.motorbikeId).filter(Boolean))];
      
      const colorMap = {};
      
      // Load colors for each unique motorbike
      for (const motorbikeId of uniqueMotorbikeIds) {
        try {
          const response = await motorbikeService.getMotorbikeById(motorbikeId);
          if (response.success) {
            const motorbikeData = response.data?.data || response.data;
            const colors = Array.isArray(motorbikeData?.colors)
              ? motorbikeData.colors.map(item => ({
                  id: item?.color?.id || item?.id,
                  colorType: item?.color?.colorType || item?.colorType,
                })).filter(c => c.id && c.colorType)
              : [];
            
            colors.forEach(color => {
              if (!colorMap[motorbikeId]) {
                colorMap[motorbikeId] = {};
              }
              colorMap[motorbikeId][color.id] = color.colorType;
            });
          }
        } catch (error) {
          console.error(`❌ [StockPromotionDetail] Error loading colors for motorbike ${motorbikeId}:`, error);
        }
      }
      
      setMotorbikeColors(colorMap);
    } catch (error) {
      console.error('❌ [StockPromotionDetail] Error loading motorbike colors:', error);
    }
  };

  // Load stocks for assignment
  const loadStocks = async () => {
    try {
      setLoadingStocks(true);
      if (!user?.agencyId) {
        showError('Error', 'Agency information not found');
        return;
      }

      // Load motorbikes first
      await loadMotorbikes();

      const response = await agencyStockService.getAgencyStocks(
        parseInt(user.agencyId),
        { page: 1, limit: 1000 }
      );

      if (response.success) {
        const stocksData = response.data || [];
        setStocks(stocksData);
        
        // Load colors for the stocks
        await loadMotorbikeColors(stocksData);
      } else {
        showError('Error', response.error || 'Failed to load stock list');
      }
    } catch (error) {
      console.error('❌ [StockPromotionDetail] Error loading stocks:', error);
      showError('Error', 'Failed to load stock list');
    } finally {
      setLoadingStocks(false);
    }
  };

  // Helper functions to get motorbike and color info
  const getMotorbikeName = (motorbikeId) => {
    const motorbike = motorbikes.find(m => m.id === motorbikeId);
    return motorbike?.name || `Motorbike #${motorbikeId}`;
  };

  const getColorType = (motorbikeId, colorId) => {
    return motorbikeColors[motorbikeId]?.[colorId] || `Color #${colorId}`;
  };

  const handleOpenAssignmentModal = () => {
    setSelectedStockIds([]);
    loadStocks();
    setShowAssignmentModal(true);
  };

  const toggleStockSelection = (stockId) => {
    setSelectedStockIds(prev => {
      if (prev.includes(stockId)) {
        return prev.filter(id => id !== stockId);
      } else {
        return [...prev, stockId];
      }
    });
  };

  const handleApplyPromotion = async () => {
    if (selectedStockIds.length === 0) {
      showError('Error', 'Please select at least one stock');
      return;
    }

    setApplying(true);
    try {
      const response = await stockPromotionService.applyPromotionToStocks(
        stockPromotionId,
        selectedStockIds
      );

      if (response.success) {
        // Close modal first
        setShowAssignmentModal(false);
        // Show success message and reload detail
        showSuccess('Success', 'Promotion applied to stocks successfully!', async () => {
          await loadStockPromotionDetail();
        });
      } else {
        showError('Error', response.error || 'Failed to apply promotion to stocks');
      }
    } catch (error) {
      console.error('❌ [StockPromotionDetail] Exception:', error);
      showError('Error', 'Failed to apply promotion to stocks');
    } finally {
      setApplying(false);
    }
  };

  // Get list of stock IDs that are already assigned to this promotion
  const getAssignedStockIds = () => {
    if (!stockPromotion?.agencyStockPromotion || !Array.isArray(stockPromotion.agencyStockPromotion)) {
      return [];
    }
    return stockPromotion.agencyStockPromotion
      .map(item => item?.agencyStock?.id)
      .filter(id => id !== undefined && id !== null);
  };

  // Filter out stocks that are already assigned
  const getAvailableStocks = () => {
    const assignedStockIds = getAssignedStockIds();
    return stocks.filter(stock => !assignedStockIds.includes(stock.id));
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
          <ActivityIndicator size="large" color="#009DFF" style={{ marginBottom: SIZES.PADDING.MEDIUM }} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!stockPromotion) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Package size={48} color={COLORS.TEXT.SECONDARY} style={{ marginBottom: SIZES.PADDING.MEDIUM }} />
          <Text style={styles.loadingText}>Stock promotion not found</Text>
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
          <ArrowLeft color={COLORS.TEXT.WHITE} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Stock Promotion Detail</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.editButton, styles.headerActionButton]}
            onPress={handleNavigateToEdit}
          >
            <Edit size={20} color={COLORS.TEXT.WHITE} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.deleteButton, styles.headerActionButton]}
            onPress={confirmDelete}
            disabled={updating}
          >
            <Trash2 size={20} color={COLORS.TEXT.WHITE} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.section}>
          <View style={[styles.card, styles.statusCard]}>
            <Text style={styles.statusTitle}>Status</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(stockPromotion.status) }]}>
              <Text style={styles.statusText}>{stockPromotion.status || 'N/A'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>General Information</Text>
          <View style={styles.card}>
            {renderInfoRow('Name', stockPromotion.name || 'N/A')}
            {renderInfoRow('Description', stockPromotion.description || 'N/A')}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Value Information</Text>
          <View style={styles.card}>
            {renderInfoRow('Discount Type', stockPromotion.valueType || 'N/A')}
            {renderInfoRow('Original Value', stockPromotion.value?.toString() || 'N/A')}
            {renderInfoRow('Value', formatValue(stockPromotion.value, stockPromotion.valueType), {
              color: COLORS.SUCCESS,
              fontWeight: 'bold',
            })}
            {renderInfoRow('Start Date', formatDate(stockPromotion.startAt))}
            {renderInfoRow('End Date', formatDate(stockPromotion.endAt))}
          </View>
        </View>

        <View style={[styles.section, styles.actionsSection]}>
          <TouchableOpacity
            style={styles.applyButton}
            onPress={handleOpenAssignmentModal}
          >
            <Text style={styles.applyButtonText}>Apply to Stocks</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Agency Stock Promotion List
            {stockPromotion.agencyStockPromotion ? ` (${stockPromotion.agencyStockPromotion.length})` : ' (0)'}
          </Text>

          <View style={[styles.card, styles.stockCard]}>
            {stockPromotion.agencyStockPromotion && stockPromotion.agencyStockPromotion.length > 0 ? (
              stockPromotion.agencyStockPromotion.map((item, index) => {
                const stock = item?.agencyStock;
                if (!stock) return null;

                return (
                  <View key={index} style={styles.stockItem}>
                    <View style={styles.stockHeader}>
                      <Text style={styles.stockTitle}>Agency Stock #{stock.id}</Text>
                    </View>

                    <Text style={styles.stockSubtitle}>Stock Information</Text>
                    {renderInfoRow('Quantity', `${stock.quantity || 0} units`)}
                    {renderInfoRow('Original Price (VND)', stock.price?.toString() || 'N/A')}
                    {renderInfoRow('Price', formatPrice(stock.price), {
                      color: COLORS.SUCCESS,
                      fontWeight: 'bold',
                    })}

                    {stock.motorbike ? (
                      <>
                        <Text style={[styles.stockSubtitle, { marginTop: SIZES.PADDING.MEDIUM }]}>Motorbike Information</Text>
                        {renderInfoRow('Name', stock.motorbike.name || 'N/A')}
                        {renderInfoRow('Model', stock.motorbike.model || 'N/A')}
                        {renderInfoRow('Version', stock.motorbike.version || 'N/A')}
                        {renderInfoRow('Origin', stock.motorbike.makeFrom || 'N/A')}
                      </>
                    ) : (
                      <View style={{ marginTop: SIZES.PADDING.MEDIUM }}>
                        <Text style={styles.stockSubtitle}>Motorbike Information</Text>
                        <Text style={styles.infoValue}>N/A</Text>
                      </View>
                    )}

                    {stock.color ? (
                      <>
                        <Text style={[styles.stockSubtitle, { marginTop: SIZES.PADDING.MEDIUM }]}>Color Information</Text>
                        {renderInfoRow('Color Type', stock.color.colorType || 'N/A')}
                        {stock.color.id && renderInfoRow('Color ID', stock.color.id?.toString() || 'N/A')}
                      </>
                    ) : (
                      <View style={{ marginTop: SIZES.PADDING.MEDIUM }}>
                        <Text style={styles.stockSubtitle}>Color Information</Text>
                        <Text style={styles.infoValue}>N/A</Text>
                      </View>
                    )}
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyStockList}>
                <Text style={styles.emptyStockText}>No agency stocks in this promotion</Text>
              </View>
            )}
          </View>
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

      {/* Assignment Modal */}
      <Modal
        visible={showAssignmentModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowAssignmentModal(false)}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Stocks</Text>
            <TouchableOpacity
              style={styles.modalSaveButton}
              onPress={handleApplyPromotion}
              disabled={applying || selectedStockIds.length === 0}
            >
              {applying ? (
                <ActivityIndicator color="#009DFF" />
              ) : (
                <Text style={[
                  styles.modalSaveText,
                  selectedStockIds.length === 0 && styles.modalSaveTextDisabled
                ]}>
                  Apply ({selectedStockIds.length})
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.modalContentInner}>
            {loadingStocks ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#009DFF" style={{ marginBottom: SIZES.PADDING.MEDIUM }} />
                <Text style={styles.loadingText}>Loading stock list...</Text>
              </View>
            ) : (() => {
              const availableStocks = getAvailableStocks();
              if (availableStocks.length === 0) {
                return (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>
                      {stocks.length === 0 
                        ? 'No stocks available' 
                        : 'All stocks have been applied to this promotion'}
                    </Text>
                  </View>
                );
              }
              
              return availableStocks.map((stock) => {
                const isSelected = selectedStockIds.includes(stock.id);
                const motorbikeName = getMotorbikeName(stock.motorbikeId);
                const colorType = getColorType(stock.motorbikeId, stock.colorId);
                
                return (
                  <TouchableOpacity
                    key={stock.id}
                    style={[
                      styles.stockSelectItem,
                      isSelected && styles.stockSelectItemSelected
                    ]}
                    onPress={() => toggleStockSelection(stock.id)}
                  >
                    <View style={styles.stockSelectCheckbox}>
                      {isSelected ? (
                        <CheckSquare size={24} color={COLORS.PRIMARY} />
                      ) : (
                        <Square size={24} color={COLORS.TEXT.SECONDARY} />
                      )}
                    </View>
                    <View style={styles.stockSelectInfo}>
                      <Text style={styles.stockSelectTitle}>
                        Stock #{stock.id}
                      </Text>
                      <Text style={styles.stockSelectDetail}>
                        {motorbikeName} - {colorType}
                      </Text>
                      <View style={styles.stockSelectRow}>
                        <Text style={styles.stockSelectLabel}>Quantity: </Text>
                        <Text style={styles.stockSelectValue}>{stock.quantity || 0}</Text>
                        <Text style={[styles.stockSelectLabel, { marginLeft: SIZES.PADDING.MEDIUM }]}>Price: </Text>
                        <Text style={[styles.stockSelectValue, styles.priceValue]}>
                          {new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND',
                          }).format(stock.price || 0)}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              });
            })()}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
    flex: 1,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: SIZES.PADDING.SMALL,
    minWidth: 84,
  },
  headerActionButton: {
    width: 40,
    height: 40,
    borderRadius: SIZES.RADIUS.ROUND,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    backgroundColor: "#009DFF",
  },
  deleteButton: {
    backgroundColor: COLORS.ERROR || '#f44336',
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.SURFACE,
    borderTopLeftRadius: SIZES.RADIUS.XXLARGE,
    borderTopRightRadius: SIZES.RADIUS.XXLARGE,
  },
  contentContainer: {
    padding: SIZES.PADDING.LARGE,
    paddingBottom: SIZES.PADDING.XXXLARGE,
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
  card: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.LARGE,
    padding: SIZES.PADDING.MEDIUM,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusCard: {
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
    marginBottom: SIZES.PADDING.LARGE,
  },
  sectionTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SIZES.PADDING.SMALL,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER?.PRIMARY || '#F0F0F0',
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
  stockCard: {
    padding: SIZES.PADDING.MEDIUM,
  },
  stockItem: {
    backgroundColor: '#F5F5F5',
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
    marginBottom: SIZES.PADDING.MEDIUM,
    borderWidth: 1,
    borderColor: COLORS.BORDER?.PRIMARY || 'rgba(0,0,0,0.05)',
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
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.PADDING.LARGE,
    paddingTop: Platform.OS === 'ios' ? SIZES.PADDING.XLARGE : SIZES.PADDING.XXXLARGE + 5,
    paddingBottom: SIZES.PADDING.MEDIUM,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
  },
  modalCloseButton: {
    padding: SIZES.PADDING.SMALL,
  },
  modalCloseText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
  },
  modalTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
    flex: 1,
    textAlign: 'center',
  },
  modalSaveButton: {
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    backgroundColor: '#009DFF',
    borderRadius: SIZES.RADIUS.MEDIUM,
    minWidth: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveText: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
  modalContent: {
    flex: 1,
    backgroundColor: COLORS.SURFACE,
    borderTopLeftRadius: SIZES.RADIUS.XXLARGE,
    borderTopRightRadius: SIZES.RADIUS.XXLARGE,
  },
  modalContentInner: {
    padding: SIZES.PADDING.LARGE,
  },
  actionsSection: {
    marginBottom: SIZES.PADDING.LARGE,
  },
  applyButton: {
    backgroundColor: '#009DFF',
    borderRadius: SIZES.RADIUS.LARGE,
    paddingVertical: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  applyButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
  stockSelectItem: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
    marginBottom: SIZES.PADDING.MEDIUM,
    borderWidth: 1,
    borderColor: COLORS.BORDER?.PRIMARY || 'rgba(0,0,0,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  stockSelectItemSelected: {
    borderColor: '#009DFF',
    backgroundColor: 'rgba(0, 157, 255, 0.12)',
  },
  stockSelectCheckbox: {
    marginRight: SIZES.PADDING.MEDIUM,
    justifyContent: 'center',
  },
  stockSelectInfo: {
    flex: 1,
  },
  stockSelectTitle: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SIZES.PADDING.XSMALL,
  },
  stockSelectDetail: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: SIZES.PADDING.SMALL,
  },
  stockSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  stockSelectLabel: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
  },
  stockSelectValue: {
    fontSize: SIZES.FONT.SMALL,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
  },
  priceValue: {
    color: COLORS.SUCCESS,
  },
  modalSaveTextDisabled: {
    opacity: 0.5,
  },
});

export default StockPromotionDetailScreen;

