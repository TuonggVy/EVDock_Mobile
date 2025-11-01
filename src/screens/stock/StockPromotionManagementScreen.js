import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  TextInput,
  RefreshControl,
  Modal,
  ActivityIndicator,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS, SIZES } from '../../constants';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import stockPromotionService from '../../services/stockPromotionService';
import { useAuth } from '../../contexts/AuthContext';
import { Search, Plus, Calendar } from 'lucide-react-native';

const StockPromotionManagementScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [stockPromotions, setStockPromotions] = useState([]);
  const [filteredStockPromotions, setFilteredStockPromotions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [paginationInfo, setPaginationInfo] = useState({
    page: 1,
    limit: 100,
    total: 0
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

  const [newPromotion, setNewPromotion] = useState({
    name: '',
    description: '',
    valueType: 'PERCENT',
    value: '',
    startAt: '',
    endAt: '',
    status: 'ACTIVE',
    agencyId: user?.agencyId || null,
  });

  const { alertConfig, hideAlert, showSuccess, showError } = useCustomAlert();

  useEffect(() => {
    loadStockPromotions();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadStockPromotions();
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    filterStockPromotions();
  }, [searchQuery, stockPromotions]);

  useEffect(() => {
    if (user?.agencyId) {
      setNewPromotion(prev => ({ ...prev, agencyId: user.agencyId }));
    }
  }, [user]);

  const loadStockPromotions = async () => {
    try {
      setLoading(true);
      const agencyId = user?.agencyId;
      console.log('🔄 [StockPromotionManagement] Loading stock promotions for agencyId:', agencyId);
      
      if (!agencyId) {
        showError('Lỗi', 'Không tìm thấy thông tin đại lý');
        return;
      }

      const response = await stockPromotionService.getStockPromotionList(
        parseInt(agencyId),
        { page: 1, limit: 100 }
      );

      console.log('📦 [StockPromotionManagement] API Response:', {
        success: response.success,
        dataLength: response.data?.length || 0,
        error: response.error || null,
        sampleData: response.data?.[0] || null
      });

      if (response.success) {
        const data = response.data || [];
        console.log('✅ [StockPromotionManagement] Loaded', data.length, 'items');
        setStockPromotions(data);
        setPaginationInfo(response.pagination || { page: 1, limit: 100, total: data.length });
      } else {
        console.error('❌ [StockPromotionManagement] API Error:', response.error);
        showError('Lỗi', response.error || 'Không thể tải danh sách stock promotion');
      }
    } catch (error) {
      console.error('❌ [StockPromotionManagement] Exception:', error);
      showError('Lỗi', 'Không thể tải danh sách stock promotion');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStockPromotions();
  };

  const filterStockPromotions = () => {
    let filtered = [...stockPromotions];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => {
        return (
          item.id?.toString().toLowerCase().includes(query) ||
          item.name?.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query) ||
          item.status?.toLowerCase().includes(query) ||
          item.valueType?.toLowerCase().includes(query)
        );
      });
    }

    setFilteredStockPromotions(filtered);
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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return COLORS.SUCCESS;
      case 'INACTIVE': return COLORS.TEXT.SECONDARY;
      default: return COLORS.TEXT.SECONDARY;
    }
  };

  // Date formatting functions
  const formatDateForAPI = (date) => {
    if (!date) return '';
    const d = new Date(date);
    // Format as ISO string: YYYY-MM-DDTHH:mm:ss.sssZ
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
      setNewPromotion(prev => ({ ...prev, startAt: formattedDate }));
      
      // If end date is before start date, update end date
      if (selectedDate > endDate) {
        setEndDate(selectedDate);
        setNewPromotion(prev => ({ ...prev, endAt: formatDateForAPI(selectedDate) }));
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
      setNewPromotion(prev => ({ ...prev, endAt: formattedDate }));
    }
  };

  const handleCreatePromotion = async () => {
    console.log('🔄 [StockPromotionManagement] Starting create promotion...');
    
    // Validation
    if (!newPromotion.name || !newPromotion.description || !newPromotion.value || !newPromotion.startAt || !newPromotion.endAt) {
      showError('Lỗi', 'Vui lòng điền đầy đủ các trường bắt buộc');
      return;
    }

    if (!newPromotion.agencyId) {
      showError('Lỗi', 'Không tìm thấy thông tin đại lý');
      return;
    }

    setCreating(true);
    try {
      const dataToSubmit = {
        name: newPromotion.name,
        description: newPromotion.description,
        valueType: newPromotion.valueType,
        value: parseFloat(newPromotion.value),
        startAt: newPromotion.startAt,
        endAt: newPromotion.endAt,
        status: newPromotion.status,
        agencyId: parseInt(newPromotion.agencyId),
      };

      console.log('📤 [StockPromotionManagement] Submitting data:', dataToSubmit);

      const response = await stockPromotionService.createStockPromotion(dataToSubmit);

      console.log('📥 [StockPromotionManagement] API Response:', response);

      if (response.success) {
        showSuccess('Thành công', 'Tạo stock promotion thành công!');
        setShowCreateModal(false);
        resetCreateForm();
        await loadStockPromotions();
      } else {
        showError('Lỗi', response.error || 'Không thể tạo stock promotion');
      }
    } catch (error) {
      console.error('❌ [StockPromotionManagement] Exception:', error);
      showError('Lỗi', 'Không thể tạo stock promotion');
    } finally {
      setCreating(false);
    }
  };

  const resetCreateForm = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    setStartDate(today);
    setEndDate(tomorrow);
    setNewPromotion({
      name: '',
      description: '',
      valueType: 'PERCENT',
      value: '',
      startAt: '',
      endAt: '',
      status: 'ACTIVE',
      agencyId: user?.agencyId || null,
    });
  };

  const handleViewDetail = (item) => {
    navigation.navigate('StockPromotionDetail', {
      stockPromotionId: item.id
    });
  };

  const renderCreateModal = () => (
    <Modal
      visible={showCreateModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => {
              setShowCreateModal(false);
              resetCreateForm();
            }}
          >
            <Text style={styles.modalCloseText}>Hủy</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Tạo Stock Promotion</Text>
          <TouchableOpacity
            style={styles.modalSaveButton}
            onPress={handleCreatePromotion}
            disabled={creating}
          >
            {creating ? (
              <ActivityIndicator color={COLORS.TEXT.WHITE} />
            ) : (
              <Text style={styles.modalSaveText}>Tạo</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Tên promotion *</Text>
            <TextInput
              style={styles.textInput}
              value={newPromotion.name}
              onChangeText={(text) => setNewPromotion(prev => ({ ...prev, name: text }))}
              placeholder="Nhập tên promotion"
              placeholderTextColor={COLORS.TEXT.SECONDARY}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Mô tả *</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={newPromotion.description}
              onChangeText={(text) => setNewPromotion(prev => ({ ...prev, description: text }))}
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
                  newPromotion.valueType === 'PERCENT' && styles.selectedOption
                ]}
                onPress={() => setNewPromotion(prev => ({ ...prev, valueType: 'PERCENT' }))}
              >
                <Text style={[
                  styles.selectorOptionText,
                  newPromotion.valueType === 'PERCENT' && styles.selectedOptionText
                ]}>
                  PERCENT (%)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.selectorOption,
                  { marginLeft: SIZES.PADDING.SMALL },
                  newPromotion.valueType === 'FIXED' && styles.selectedOption
                ]}
                onPress={() => setNewPromotion(prev => ({ ...prev, valueType: 'FIXED' }))}
              >
                <Text style={[
                  styles.selectorOptionText,
                  newPromotion.valueType === 'FIXED' && styles.selectedOptionText
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
              value={newPromotion.value}
              onChangeText={(text) => setNewPromotion(prev => ({ ...prev, value: text }))}
              placeholder={newPromotion.valueType === 'PERCENT' ? "Nhập phần trăm (ví dụ: 10)" : "Nhập số tiền (ví dụ: 50000)"}
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
                !newPromotion.startAt && styles.dateInputTextPlaceholder
              ]}>
                {newPromotion.startAt ? formatDateForDisplay(newPromotion.startAt) : 'Chọn ngày bắt đầu'}
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
                !newPromotion.endAt && styles.dateInputTextPlaceholder
              ]}>
                {newPromotion.endAt ? formatDateForDisplay(newPromotion.endAt) : 'Chọn ngày kết thúc'}
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
                  newPromotion.status === 'ACTIVE' && styles.selectedOption
                ]}
                onPress={() => setNewPromotion(prev => ({ ...prev, status: 'ACTIVE' }))}
              >
                <Text style={[
                  styles.selectorOptionText,
                  newPromotion.status === 'ACTIVE' && styles.selectedOptionText
                ]}>
                  ACTIVE
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.selectorOption,
                  { marginLeft: SIZES.PADDING.SMALL },
                  newPromotion.status === 'INACTIVE' && styles.selectedOption
                ]}
                onPress={() => setNewPromotion(prev => ({ ...prev, status: 'INACTIVE' }))}
              >
                <Text style={[
                  styles.selectorOptionText,
                  newPromotion.status === 'INACTIVE' && styles.selectedOptionText
                ]}>
                  INACTIVE
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  const renderStockPromotionCard = (item) => (
    <TouchableOpacity
      key={item.id}
      style={styles.card}
      onPress={() => handleViewDetail(item)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardInfo}>
          <Text style={styles.cardId}>{item.name || `Promotion #${item.id}`}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status || 'N/A'}</Text>
        </View>
      </View>

      <View style={styles.cardDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Mô tả:</Text>
          <Text style={styles.detailValue}>
            {item.description || 'N/A'}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Loại giảm giá:</Text>
          <Text style={styles.detailValue}>
            {item.valueType || 'N/A'}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Giá trị:</Text>
          <Text style={[styles.detailValue, styles.priceValue]}>
            {formatValue(item.value, item.valueType)}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Bắt đầu:</Text>
          <Text style={styles.detailValue}>{formatDate(item.startAt)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Kết thúc:</Text>
          <Text style={styles.detailValue}>{formatDate(item.endAt)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

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
        <Text style={styles.headerTitle}>Stock Promotion Management</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => {
            resetCreateForm();
            setShowCreateModal(true);
          }}
        >
          <Plus size={20} color={COLORS.TEXT.WHITE} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}><Search /></Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm theo ID, tên, mô tả..."
          placeholderTextColor={COLORS.TEXT.SECONDARY}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stockPromotions.length}</Text>
          <Text style={styles.statLabel}>Tổng số</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: COLORS.SUCCESS }]}>
            {stockPromotions.filter(item => item.status === 'ACTIVE').length}
          </Text>
          <Text style={styles.statLabel}>Đang hoạt động</Text>
        </View>
      </View>

      {/* Stock Promotions List */}
      <ScrollView
        style={styles.list}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.PRIMARY}
          />
        }
      >
        {loading && filteredStockPromotions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>⏳</Text>
            <Text style={styles.emptyTitle}>Đang tải...</Text>
          </View>
        ) : filteredStockPromotions.length > 0 ? (
          filteredStockPromotions.map(renderStockPromotionCard)
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyTitle}>Không có dữ liệu</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery.trim()
                ? 'Không tìm thấy kết quả phù hợp'
                : 'Chưa có stock promotion nào'}
            </Text>
          </View>
        )}
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

      {renderCreateModal()}
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
  createButton: {
    width: 40,
    height: 40,
    borderRadius: SIZES.RADIUS.ROUND,
    backgroundColor: COLORS.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    margin: SIZES.PADDING.MEDIUM,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
    marginRight: SIZES.PADDING.SMALL,
  },
  searchInput: {
    flex: 1,
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.SMALL,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  statNumber: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: SIZES.FONT.XSMALL,
    color: COLORS.TEXT.SECONDARY,
    textAlign: 'center',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: SIZES.PADDING.MEDIUM,
  },
  card: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SIZES.PADDING.SMALL,
  },
  statusBadge: {
    paddingHorizontal: SIZES.PADDING.SMALL,
    paddingVertical: 4,
    borderRadius: SIZES.RADIUS.SMALL,
  },
  statusText: {
    fontSize: SIZES.FONT.XSMALL,
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
  },
  cardInfo: {
    flex: 1,
  },
  cardId: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginBottom: 4,
  },
  cardDate: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
  },
  cardDetails: {
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
  },
  detailValue: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '600',
  },
  priceValue: {
    color: COLORS.SUCCESS,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.PADDING.XXXLARGE,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  emptyTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SIZES.PADDING.SMALL,
  },
  emptySubtitle: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
    textAlign: 'center',
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
});

export default StockPromotionManagementScreen;

