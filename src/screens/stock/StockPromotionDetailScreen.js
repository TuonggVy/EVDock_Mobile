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
  TextInput,
  ActivityIndicator,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS, SIZES } from '../../constants';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import stockPromotionService from '../../services/stockPromotionService';
import agencyStockService from '../../services/agencyStockService';
import motorbikeService from '../../services/motorbikeService';
import { useAuth } from '../../contexts/AuthContext';
import { Edit, Calendar, Trash2, CheckSquare, Square } from 'lucide-react-native';

const StockPromotionDetailScreen = ({ navigation, route }) => {
  const { stockPromotionId } = route.params || {};
  const { user } = useAuth();
  const [stockPromotion, setStockPromotion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

  // Assignment modal states
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [stocks, setStocks] = useState([]);
  const [selectedStockIds, setSelectedStockIds] = useState([]);
  const [loadingStocks, setLoadingStocks] = useState(false);
  const [applying, setApplying] = useState(false);
  const [motorbikes, setMotorbikes] = useState([]);
  const [motorbikeColors, setMotorbikeColors] = useState({}); // { motorbikeId: { colorId: colorType } }

  const [editPromotion, setEditPromotion] = useState({
    name: '',
    description: '',
    valueType: 'PERCENT',
    value: '',
    startAt: '',
    endAt: '',
    status: 'ACTIVE',
  });

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

  // Date formatting functions for edit modal
  const formatDateForAPI = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString();
  };

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  // Date picker handlers
  const handleStartDateChange = (event, selectedDate) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);
      const formattedDate = formatDateForAPI(selectedDate);
      setEditPromotion(prev => ({ ...prev, startAt: formattedDate }));
      
      // If end date is before start date, update end date
      if (selectedDate > endDate) {
        setEndDate(selectedDate);
        setEditPromotion(prev => ({ ...prev, endAt: formatDateForAPI(selectedDate) }));
      }
    }
  };

  const handleEndDateChange = (event, selectedDate) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      // Ensure end date is not before start date
      if (selectedDate < startDate) {
        showError('Lỗi', 'Ngày kết thúc phải sau ngày bắt đầu');
        return;
      }
      setEndDate(selectedDate);
      const formattedDate = formatDateForAPI(selectedDate);
      setEditPromotion(prev => ({ ...prev, endAt: formattedDate }));
    }
  };

  const handleOpenEditModal = () => {
    if (!stockPromotion) return;
    
    // Pre-fill form data
    const start = stockPromotion.startAt ? new Date(stockPromotion.startAt) : new Date();
    const end = stockPromotion.endAt ? new Date(stockPromotion.endAt) : new Date();
    
    setStartDate(start);
    setEndDate(end);
    setEditPromotion({
      name: stockPromotion.name || '',
      description: stockPromotion.description || '',
      valueType: stockPromotion.valueType || 'PERCENT',
      value: stockPromotion.value?.toString() || '',
      startAt: stockPromotion.startAt || '',
      endAt: stockPromotion.endAt || '',
      status: stockPromotion.status || 'ACTIVE',
    });
    setShowEditModal(true);
  };

  const handleUpdatePromotion = async () => {
    console.log('🔄 [StockPromotionDetail] Starting update promotion...');
    
    // Validation
    if (!editPromotion.name || !editPromotion.description || !editPromotion.value || !editPromotion.startAt || !editPromotion.endAt) {
      showError('Lỗi', 'Vui lòng điền đầy đủ các trường bắt buộc');
      return;
    }

    setUpdating(true);
    try {
      const dataToSubmit = {
        name: editPromotion.name,
        description: editPromotion.description,
        valueType: editPromotion.valueType,
        value: parseFloat(editPromotion.value),
        startAt: editPromotion.startAt,
        endAt: editPromotion.endAt,
        status: editPromotion.status,
      };

      console.log('📤 [StockPromotionDetail] Submitting update data:', dataToSubmit);

      const response = await stockPromotionService.updateStockPromotion(stockPromotionId, dataToSubmit);

      console.log('📥 [StockPromotionDetail] API Response:', response);

      if (response.success) {
        showSuccess('Thành công', 'Cập nhật stock promotion thành công!');
        setShowEditModal(false);
        await loadStockPromotionDetail();
      } else {
        showError('Lỗi', response.error || 'Không thể cập nhật stock promotion');
      }
    } catch (error) {
      console.error('❌ [StockPromotionDetail] Exception:', error);
      showError('Lỗi', 'Không thể cập nhật stock promotion');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeletePromotion = async () => {
    hideAlert();
    console.log('🔄 [StockPromotionDetail] Starting delete promotion...');

    setUpdating(true);
    try {
      const response = await stockPromotionService.deleteStockPromotion(stockPromotionId);

      console.log('📥 [StockPromotionDetail] Delete Response:', response);

      if (response.success) {
        showSuccess('Thành công', 'Xóa stock promotion thành công!', () => {
          navigation.goBack();
        });
      } else {
        showError('Lỗi', response.error || 'Không thể xóa stock promotion');
        setUpdating(false);
      }
    } catch (error) {
      console.error('❌ [StockPromotionDetail] Exception:', error);
      showError('Lỗi', 'Không thể xóa stock promotion');
      setUpdating(false);
    }
  };

  const confirmDelete = () => {
    showDeleteConfirm(
      'Xác nhận xóa',
      `Bạn có chắc chắn muốn xóa promotion "${stockPromotion?.name || ''}"? Hành động này không thể hoàn tác.`,
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
        showError('Lỗi', 'Không tìm thấy thông tin đại lý');
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
        showError('Lỗi', response.error || 'Không thể tải danh sách stocks');
      }
    } catch (error) {
      console.error('❌ [StockPromotionDetail] Error loading stocks:', error);
      showError('Lỗi', 'Không thể tải danh sách stocks');
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
      showError('Lỗi', 'Vui lòng chọn ít nhất một stock');
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
        showSuccess('Thành công', 'Áp dụng promotion cho stocks thành công!', async () => {
          await loadStockPromotionDetail();
        });
      } else {
        showError('Lỗi', response.error || 'Không thể áp dụng promotion cho stocks');
      }
    } catch (error) {
      console.error('❌ [StockPromotionDetail] Exception:', error);
      showError('Lỗi', 'Không thể áp dụng promotion cho stocks');
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
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.editButton, styles.headerActionButton, { marginLeft: 0 }]}
            onPress={handleOpenEditModal}
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

        <TouchableOpacity
          style={styles.applyButton}
          onPress={handleOpenAssignmentModal}
        >
          <Text style={styles.applyButtonText}>Áp dụng cho Stocks</Text>
        </TouchableOpacity>

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

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowEditModal(false)}
            >
              <Text style={styles.modalCloseText}>Hủy</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Chỉnh sửa Stock Promotion</Text>
            <TouchableOpacity
              style={styles.modalSaveButton}
              onPress={handleUpdatePromotion}
              disabled={updating}
            >
              {updating ? (
                <ActivityIndicator color={COLORS.TEXT.WHITE} />
              ) : (
                <Text style={styles.modalSaveText}>Lưu</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Tên promotion *</Text>
              <TextInput
                style={styles.textInput}
                value={editPromotion.name}
                onChangeText={(text) => setEditPromotion(prev => ({ ...prev, name: text }))}
                placeholder="Nhập tên promotion"
                placeholderTextColor={COLORS.TEXT.SECONDARY}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Mô tả *</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={editPromotion.description}
                onChangeText={(text) => setEditPromotion(prev => ({ ...prev, description: text }))}
                placeholder="Nhập mô tả"
                placeholderTextColor={COLORS.TEXT.SECONDARY}
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Loại giảm giá *</Text>
              <View style={styles.selectorRow}>
                <TouchableOpacity
                  style={[
                    styles.selectorOption,
                    editPromotion.valueType === 'PERCENT' && styles.selectedOption
                  ]}
                  onPress={() => setEditPromotion(prev => ({ ...prev, valueType: 'PERCENT' }))}
                >
                  <Text style={[
                    styles.selectorOptionText,
                    editPromotion.valueType === 'PERCENT' && styles.selectedOptionText
                  ]}>
                    PERCENT (%)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.selectorOption,
                    { marginLeft: SIZES.PADDING.SMALL },
                    editPromotion.valueType === 'FIXED' && styles.selectedOption
                  ]}
                  onPress={() => setEditPromotion(prev => ({ ...prev, valueType: 'FIXED' }))}
                >
                  <Text style={[
                    styles.selectorOptionText,
                    editPromotion.valueType === 'FIXED' && styles.selectedOptionText
                  ]}>
                    FIXED (VND)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Giá trị *</Text>
              <TextInput
                style={styles.textInput}
                value={editPromotion.value}
                onChangeText={(text) => setEditPromotion(prev => ({ ...prev, value: text }))}
                placeholder={editPromotion.valueType === 'PERCENT' ? "Nhập phần trăm (ví dụ: 10)" : "Nhập số tiền (ví dụ: 50000)"}
                placeholderTextColor={COLORS.TEXT.SECONDARY}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Ngày bắt đầu *</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowStartDatePicker(true)}
              >
                <Text style={[
                  styles.dateInputText,
                  !editPromotion.startAt && styles.dateInputTextPlaceholder
                ]}>
                  {editPromotion.startAt ? formatDateForDisplay(editPromotion.startAt) : 'Chọn ngày bắt đầu'}
                </Text>
                <Calendar size={20} color={COLORS.TEXT.SECONDARY} />
              </TouchableOpacity>
            </View>

            {showStartDatePicker && (
              <DateTimePicker
                value={startDate}
                mode="datetime"
                is24Hour={true}
                display="default"
                onChange={handleStartDateChange}
              />
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Ngày kết thúc *</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowEndDatePicker(true)}
              >
                <Text style={[
                  styles.dateInputText,
                  !editPromotion.endAt && styles.dateInputTextPlaceholder
                ]}>
                  {editPromotion.endAt ? formatDateForDisplay(editPromotion.endAt) : 'Chọn ngày kết thúc'}
                </Text>
                <Calendar size={20} color={COLORS.TEXT.SECONDARY} />
              </TouchableOpacity>
            </View>

            {showEndDatePicker && (
              <DateTimePicker
                value={endDate}
                mode="datetime"
                is24Hour={true}
                display="default"
                onChange={handleEndDateChange}
                minimumDate={startDate}
              />
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Trạng thái *</Text>
              <View style={styles.selectorRow}>
                <TouchableOpacity
                  style={[
                    styles.selectorOption,
                    editPromotion.status === 'ACTIVE' && styles.selectedOption
                  ]}
                  onPress={() => setEditPromotion(prev => ({ ...prev, status: 'ACTIVE' }))}
                >
                  <Text style={[
                    styles.selectorOptionText,
                    editPromotion.status === 'ACTIVE' && styles.selectedOptionText
                  ]}>
                    ACTIVE
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.selectorOption,
                    { marginLeft: SIZES.PADDING.SMALL },
                    editPromotion.status === 'INACTIVE' && styles.selectedOption
                  ]}
                  onPress={() => setEditPromotion(prev => ({ ...prev, status: 'INACTIVE' }))}
                >
                  <Text style={[
                    styles.selectorOptionText,
                    editPromotion.status === 'INACTIVE' && styles.selectedOptionText
                  ]}>
                    INACTIVE
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

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
              <Text style={styles.modalCloseText}>Hủy</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Chọn Stocks</Text>
            <TouchableOpacity
              style={styles.modalSaveButton}
              onPress={handleApplyPromotion}
              disabled={applying || selectedStockIds.length === 0}
            >
              {applying ? (
                <ActivityIndicator color={COLORS.TEXT.WHITE} />
              ) : (
                <Text style={[
                  styles.modalSaveText,
                  selectedStockIds.length === 0 && styles.modalSaveTextDisabled
                ]}>
                  Áp dụng ({selectedStockIds.length})
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {loadingStocks ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.PRIMARY} />
                <Text style={styles.loadingText}>Đang tải danh sách stocks...</Text>
              </View>
            ) : (() => {
              const availableStocks = getAvailableStocks();
              if (availableStocks.length === 0) {
                return (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>
                      {stocks.length === 0 
                        ? 'Không có stock nào' 
                        : 'Tất cả stocks đã được áp dụng promotion này'}
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
                        <Text style={styles.stockSelectLabel}>Số lượng: </Text>
                        <Text style={styles.stockSelectValue}>{stock.quantity || 0}</Text>
                        <Text style={[styles.stockSelectLabel, { marginLeft: SIZES.PADDING.MEDIUM }]}>Giá: </Text>
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
  headerActions: {
    flexDirection: 'row',
  },
  headerActionButton: {
    width: 40,
    height: 40,
    borderRadius: SIZES.RADIUS.ROUND,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SIZES.PADDING.SMALL,
  },
  editButton: {
    backgroundColor: COLORS.PRIMARY,
  },
  deleteButton: {
    backgroundColor: COLORS.ERROR || '#f44336',
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
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.MEDIUM,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
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
    backgroundColor: COLORS.PRIMARY,
    borderRadius: SIZES.RADIUS.MEDIUM,
    minWidth: 60,
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
    padding: SIZES.PADDING.MEDIUM,
  },
  inputGroup: {
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  inputLabel: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: '600',
    color: COLORS.TEXT.WHITE,
    marginBottom: SIZES.PADDING.SMALL,
  },
  textInput: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  dateInput: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  dateInputText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
    flex: 1,
  },
  dateInputTextPlaceholder: {
    color: COLORS.TEXT.SECONDARY,
  },
  selectorRow: {
    flexDirection: 'row',
  },
  selectorOption: {
    flex: 1,
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  selectedOption: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  selectorOptionText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '600',
  },
  selectedOptionText: {
    color: COLORS.TEXT.WHITE,
  },
  applyButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
    margin: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
  stockSelectItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
    marginBottom: SIZES.PADDING.SMALL,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  stockSelectItemSelected: {
    borderColor: COLORS.PRIMARY,
    borderWidth: 2,
    backgroundColor: 'rgba(0,122,255,0.1)',
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
    marginBottom: 4,
  },
  stockSelectDetail: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: 4,
  },
  stockSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
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

