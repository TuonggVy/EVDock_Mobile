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
} from 'react-native';
import { COLORS, SIZES } from '../../constants';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import { discountService } from '../../services/discountService';
import motorbikeService from '../../services/motorbikeService';
import agencyService from '../../services/agencyService';

const DiscountManagementScreen = ({ navigation }) => {
  const [discounts, setDiscounts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'ACTIVE', 'INACTIVE'
  const [filterType, setFilterType] = useState('all'); // 'all', 'VOLUME', 'SPECIAL'
  const [loading, setLoading] = useState(false);
  const [agencies, setAgencies] = useState([]);
  const [motorbikes, setMotorbikes] = useState([]);

  const { alertConfig, hideAlert, showSuccess, showError, showConfirm } = useCustomAlert();

  useEffect(() => {
    loadDiscounts();
    loadAgencies();
    loadMotorbikes();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadDiscounts();
    });
    return unsubscribe;
  }, [navigation]);

  const loadDiscounts = async () => {
    setLoading(true);
    try {
      const response = await discountService.getDiscounts(1, 100);
      if (response.success) {
        // Sort by ID descending (newest first)
        const sortedDiscounts = response.data.sort((a, b) => b.id - a.id);
        setDiscounts(sortedDiscounts);
      } else {
        showError('Lỗi', response.error || 'Không thể tải danh sách discount');
      }
    } catch (error) {
      console.error('Error loading discounts:', error);
      showError('Lỗi', 'Không thể tải danh sách discount');
    } finally {
      setLoading(false);
    }
  };

  const loadAgencies = async () => {
    try {
      const result = await agencyService.getAgencies({ limit: 100 });
      setAgencies(result?.data || []);
    } catch (error) {
      console.error('Error loading agencies:', error);
    }
  };

  const loadMotorbikes = async () => {
    try {
      const response = await motorbikeService.getAllMotorbikes({ limit: 100 });
      if (response.success && Array.isArray(response.data)) {
        setMotorbikes(response.data);
      }
    } catch (error) {
      console.error('Error loading motorbikes:', error);
    }
  };

  const handleAddDiscount = () => {
    navigation.navigate('AddDiscount');
  };

  const handleEditDiscount = (discount) => {
    navigation.navigate('EditDiscount', { discount });
  };

  const handleDeleteDiscount = (discount) => {
    showConfirm(
      'Xác nhận xóa',
      'Bạn có chắc chắn muốn xóa discount này?',
      async () => {
        try {
          const response = await discountService.deleteDiscount(discount.id);
          if (response.success) {
            await loadDiscounts();
            showSuccess('Thành công', 'Xóa discount thành công!');
          } else {
            showError('Lỗi', response.error || 'Không thể xóa discount');
          }
        } catch (error) {
          console.error('Error deleting discount:', error);
          showError('Lỗi', 'Không thể xóa discount');
        }
      }
    );
  };

  const filteredDiscounts = discounts.filter((discount) => {
    const matchesSearch = discount.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      discount.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || discount.status === filterStatus;
    const matchesType = filterType === 'all' || discount.type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  const renderDiscountCard = (discount) => (
    <View key={discount.id} style={styles.discountCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.discountName}>{discount.name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: discount.status === 'ACTIVE' ? COLORS.SUCCESS : COLORS.ERROR }]}>
          <Text style={styles.statusText}>{discount.status === 'ACTIVE' ? 'Hoạt động' : 'Ngừng hoạt động'}</Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Loại:</Text>
          <Text style={styles.detailValue}>{discount.type === 'VOLUME' ? 'Khối lượng' : 'Đặc biệt'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Giá trị:</Text>
          <Text style={styles.detailValue}>
            {discount.valueType === 'PERCENT' ? `${discount.value}%` : `${discount.value} VND`}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Số lượng tối thiểu:</Text>
          <Text style={styles.detailValue}>{discount.min_quantity} xe</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Từ ngày:</Text>
          <Text style={styles.detailValue}>{formatDate(discount.startAt)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Đến ngày:</Text>
          <Text style={styles.detailValue}>{formatDate(discount.endAt)}</Text>
        </View>
        {discount.agencyId && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Đại lý:</Text>
            <Text style={styles.detailValue}>
              {agencies.find(a => a.id === discount.agencyId)?.name || `ID: ${discount.agencyId}`}
            </Text>
          </View>
        )}
        {discount.motorbikeId && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Xe máy:</Text>
            <Text style={styles.detailValue}>
              {motorbikes.find(b => b.id === discount.motorbikeId)?.name || `ID: ${discount.motorbikeId}`}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => handleEditDiscount(discount)}
        >
          <Text style={styles.editButtonText}>Sửa</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteDiscount(discount)}
        >
          <Text style={styles.deleteButtonText}>Xóa</Text>
        </TouchableOpacity>
      </View>
    </View>
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
        <Text style={styles.headerTitle}>Quản lý Discount</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddDiscount}
        >
          <Text style={styles.addIcon}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm tên discount..."
          placeholderTextColor={COLORS.TEXT.SECONDARY}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Trạng thái:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {['all', 'ACTIVE', 'INACTIVE'].map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.filterChip,
                  filterStatus === status && styles.filterChipActive
                ]}
                onPress={() => setFilterStatus(status)}
              >
                <Text style={[
                  styles.filterChipText,
                  filterStatus === status && styles.filterChipTextActive
                ]}>
                  {status === 'all' ? 'Tất cả' : status === 'ACTIVE' ? 'Hoạt động' : 'Ngừng hoạt động'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Loại:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {['all', 'VOLUME', 'SPECIAL'].map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.filterChip,
                  filterType === type && styles.filterChipActive
                ]}
                onPress={() => setFilterType(type)}
              >
                <Text style={[
                  styles.filterChipText,
                  filterType === type && styles.filterChipTextActive
                ]}>
                  {type === 'all' ? 'Tất cả' : type === 'VOLUME' ? 'Khối lượng' : 'Đặc biệt'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Discounts List */}
      <ScrollView
        style={styles.discountsList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.discountsContent}
      >
        {filteredDiscounts.length > 0 ? (
          filteredDiscounts.map(renderDiscountCard)
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🎁</Text>
            <Text style={styles.emptyTitle}>Không có discounts</Text>
            <Text style={styles.emptySubtitle}>Hãy tạo discount mới để bắt đầu</Text>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
    paddingTop: 30,
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: SIZES.RADIUS.ROUND,
    backgroundColor: COLORS.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIcon: {
    fontSize: SIZES.FONT.LARGE,
    color: COLORS.TEXT.WHITE,
    fontWeight: 'bold',
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
  filtersContainer: {
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingBottom: SIZES.PADDING.SMALL,
  },
  filterGroup: {
    marginBottom: SIZES.PADDING.SMALL,
  },
  filterLabel: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: SIZES.PADDING.XSMALL,
  },
  filterChip: {
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    borderRadius: SIZES.RADIUS.MEDIUM,
    backgroundColor: COLORS.SURFACE,
    marginRight: SIZES.PADDING.SMALL,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterChipActive: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
  },
  filterChipText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.PRIMARY,
  },
  filterChipTextActive: {
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  discountsList: {
    flex: 1,
  },
  discountsContent: {
    padding: SIZES.PADDING.MEDIUM,
  },
  discountCard: {
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
  discountName: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    flex: 1,
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
  cardContent: {
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
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SIZES.PADDING.SMALL,
  },
  editButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: SIZES.RADIUS.SMALL,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
  },
  editButtonText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: COLORS.ERROR,
    borderRadius: SIZES.RADIUS.SMALL,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
  },
  deleteButtonText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
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
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingTop: Platform.OS === 'ios' ? 20 : 0,
    paddingBottom: SIZES.PADDING.MEDIUM,
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
    padding: SIZES.PADDING.SMALL,
  },
  modalSaveText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.PRIMARY,
    fontWeight: '600',
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
    color: COLORS.TEXT.WHITE,
    marginBottom: SIZES.PADDING.SMALL,
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: SIZES.PADDING.SMALL,
  },
  typeOption: {
    flex: 1,
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedTypeOption: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
  },
  typeOptionText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
  },
  selectedTypeOptionText: {
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  valueTypeSelector: {
    flexDirection: 'row',
    gap: SIZES.PADDING.SMALL,
    marginBottom: SIZES.PADDING.SMALL,
  },
  valueTypeOption: {
    flex: 1,
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedValueTypeOption: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
  },
  valueTypeOptionText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.PRIMARY,
  },
  selectedValueTypeOptionText: {
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  selector: {
    maxHeight: 200,
  },
  selectorOption: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
    marginBottom: SIZES.PADDING.SMALL,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedSelectorOption: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
  },
  selectorOptionText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
  },
  selectedSelectorOptionText: {
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  statusSelector: {
    flexDirection: 'row',
    gap: SIZES.PADDING.SMALL,
  },
  statusOption: {
    flex: 1,
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedStatusOption: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
  },
  statusOptionText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
  },
  selectedStatusOptionText: {
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
});

export default DiscountManagementScreen;

