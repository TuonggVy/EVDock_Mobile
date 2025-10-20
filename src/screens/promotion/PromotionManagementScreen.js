import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  SafeAreaView,
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES } from '../../constants';
import useDealerPromotions from '../../hooks/useDealerPromotions';
import {
  formatPrice,
  formatDate,
  getDaysUntilExpiry,
  getPromotionStatusColor,
  getPromotionStatusText,
  getPromotionPriorityColor,
  getPromotionPriorityText,
  getPromotionPriorityIcon,
  formatDiscount,
  isExpiringSoon,
  getUsagePercentage,
  getUsageStatusColor,
  getUsageStatusText,
  getPromotionBadgeColor,
  getPromotionBadgeText,
  getModelColor,
} from '../../utils/promotionUtils';

const PromotionManagementScreen = ({ navigation }) => {
  // Local UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPromotion, setSelectedPromotion] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Custom hook for data management
  const {
    filteredPromotions,
    loading,
    errors,
    filters,
    searchPromotions,
    updateFilter,
    clearFilters,
    refresh,
    getFilterOptions,
    getPromotionTimeStatus,
  } = useDealerPromotions();

  // Auto refresh when screen comes into focus (e.g., when Manager creates new promotion)
  useFocusEffect(
    React.useCallback(() => {
      refresh();
    }, [refresh])
  );

  // Handle search
  const handleSearch = (query) => {
    setSearchQuery(query);
    searchPromotions(query);
  };

  // Handle promotion selection
  const handlePromotionSelect = (promotion) => {
    setSelectedPromotion(promotion);
    setShowDetailModal(true);
  };

  // Render promotion card
  const renderPromotionCard = ({ item }) => (
    <TouchableOpacity
      style={styles.promotionCard}
      onPress={() => handlePromotionSelect(item)}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={['#FFFFFF', '#F8F9FA']}
        style={styles.cardGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Header */}
        <View style={styles.cardHeader}>
        <View style={styles.promotionInfo}>
            <Text style={styles.promotionName}>{item.name}</Text>
          <Text style={styles.promotionCode}>{item.code}</Text>
        </View>
          <View style={styles.headerBadges}>
            <View style={[styles.timeStatusBadge, { 
              backgroundColor: getPromotionTimeStatus(item) === 'active' ? COLORS.SUCCESS : 
                              getPromotionTimeStatus(item) === 'upcoming' ? COLORS.WARNING : COLORS.ERROR 
            }]}>
              <Text style={styles.timeStatusText}>
                {getPromotionTimeStatus(item) === 'active' ? 'Đang diễn ra' : 
                 getPromotionTimeStatus(item) === 'upcoming' ? 'Sắp diễn ra' : 'Đã hết hạn'}
              </Text>
            </View>
            <View style={[styles.priorityBadge, { backgroundColor: getPromotionPriorityColor(item.priority) }]}>
              <Text style={styles.priorityIcon}>{getPromotionPriorityIcon(item.priority)}</Text>
            </View>
        </View>
      </View>

        {/* Description */}
      <Text style={styles.promotionDescription} numberOfLines={2}>
        {item.description}
      </Text>

        {/* Discount Info */}
        <View style={styles.discountContainer}>
          <View style={styles.discountInfo}>
            <Text style={styles.discountLabel}>Giảm giá:</Text>
            <Text style={styles.discountValue}>{formatDiscount(item)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getPromotionBadgeColor(item) }]}>
            <Text style={styles.statusBadgeText}>{getPromotionBadgeText(item)}</Text>
          </View>
        </View>

        {/* Models */}
        <View style={styles.modelsContainer}>
          <Text style={styles.modelsLabel}>Áp dụng cho:</Text>
          <View style={styles.modelsList}>
            {(item.vehicleModels || item.applicableModels || []).map((model, index) => (
              <View key={index} style={[styles.modelTag, { backgroundColor: getModelColor(model) }]}>
                <Text style={styles.modelTagText}>{model}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Usage Info */}
        <View style={styles.usageContainer}>
          <View style={styles.usageInfo}>
            <Text style={styles.usageLabel}>Sử dụng:</Text>
            <Text style={styles.usageText}>
              {item.usedCount}/{item.usageLimit} ({getUsagePercentage(item.usedCount, item.usageLimit)}%)
          </Text>
          </View>
          <View style={styles.usageBar}>
            <View style={[styles.usageProgress, { 
              width: `${getUsagePercentage(item.usedCount, item.usageLimit)}%`,
              backgroundColor: getUsageStatusColor(getUsagePercentage(item.usedCount, item.usageLimit))
            }]} />
          </View>
        </View>

        {/* Expiry Info */}
        <View style={styles.expiryContainer}>
          <Text style={styles.expiryLabel}>Hết hạn:</Text>
          <Text style={[styles.expiryText, { 
            color: isExpiringSoon(item.endDate) ? COLORS.WARNING : COLORS.TEXT.SECONDARY 
          }]}>
            {formatDate(item.endDate)}
            {isExpiringSoon(item.endDate) && (
              <Text style={styles.expiryWarning}> (Còn {getDaysUntilExpiry(item.endDate)} ngày)</Text>
            )}
          </Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );


  // Render filter modal
  const renderFilterModal = () => {
    const filterOptions = getFilterOptions();

    return (
      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilterModal(false)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.filterModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Bộ lọc</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowFilterModal(false)}
              >
                <Text style={styles.closeIcon}>×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Status Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Trạng thái</Text>
                {filterOptions.status.map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={[styles.filterOption, filters.status === option.key && styles.filterOptionSelected]}
                    onPress={() => updateFilter('status', option.key)}
                  >
                    <Text style={[styles.filterOptionText, filters.status === option.key && styles.filterOptionTextSelected]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Time Status Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Thời gian</Text>
                {filterOptions.timeStatus.map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={[styles.filterOption, filters.timeStatus === option.key && styles.filterOptionSelected]}
                    onPress={() => updateFilter('timeStatus', option.key)}
                  >
                    <Text style={[styles.filterOptionText, filters.timeStatus === option.key && styles.filterOptionTextSelected]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Priority Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Mức độ ưu tiên</Text>
                {filterOptions.priority.map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={[styles.filterOption, filters.priority === option.key && styles.filterOptionSelected]}
                    onPress={() => updateFilter('priority', option.key)}
                  >
                    <Text style={[styles.filterOptionText, filters.priority === option.key && styles.filterOptionTextSelected]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Model Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Model xe</Text>
                {filterOptions.model.map((option) => (
          <TouchableOpacity
                    key={option.key}
                    style={[styles.filterOption, filters.model === option.key && styles.filterOptionSelected]}
                    onPress={() => updateFilter('model', option.key)}
                  >
                    <Text style={[styles.filterOptionText, filters.model === option.key && styles.filterOptionTextSelected]}>
                      {option.label}
          </Text>
                  </TouchableOpacity>
      ))}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.clearFiltersButton}
                onPress={clearFilters}
              >
                <Text style={styles.clearFiltersText}>Xóa bộ lọc</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyFiltersButton}
                onPress={() => setShowFilterModal(false)}
              >
                <LinearGradient
                  colors={COLORS.GRADIENT.BLUE}
                  style={styles.applyFiltersGradient}
                >
                  <Text style={styles.applyFiltersText}>Áp dụng</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    );
  };

  // Render detail modal
  const renderDetailModal = () => {
    if (!selectedPromotion) return null;

    return (
      <Modal
        visible={showDetailModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDetailModal(false)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.detailModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chi tiết khuyến mãi</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowDetailModal(false)}
              >
                <Text style={styles.closeIcon}>×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.detailSection}>
                <Text style={styles.detailTitle}>{selectedPromotion.name}</Text>
                <Text style={styles.detailCode}>Mã: {selectedPromotion.code}</Text>
                <Text style={styles.detailDescription}>{selectedPromotion.description}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Thông tin giảm giá</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Loại giảm giá:</Text>
                  <Text style={styles.detailValue}>{selectedPromotion.discountType === 'percentage' ? 'Phần trăm' : 'Số tiền cố định'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Giá trị giảm:</Text>
                  <Text style={styles.detailValue}>{formatDiscount(selectedPromotion)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Đơn hàng tối thiểu:</Text>
                  <Text style={styles.detailValue}>{formatPrice(selectedPromotion.minOrderValue)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Giảm tối đa:</Text>
                  <Text style={styles.detailValue}>{formatPrice(selectedPromotion.maxDiscount)}</Text>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Thời gian áp dụng</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Bắt đầu:</Text>
                  <Text style={styles.detailValue}>{formatDate(selectedPromotion.startDate)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Kết thúc:</Text>
                  <Text style={styles.detailValue}>{formatDate(selectedPromotion.endDate)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Trạng thái:</Text>
                  <Text style={[styles.detailValue, { color: getPromotionStatusColor(selectedPromotion.status) }]}>
                    {getPromotionStatusText(selectedPromotion.status)}
                  </Text>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Điều khoản</Text>
                {selectedPromotion.terms.map((term, index) => (
                  <Text key={index} style={styles.termText}>• {term}</Text>
                ))}
              </View>
        </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.closeModalButton}
                onPress={() => setShowDetailModal(false)}
              >
                <Text style={styles.closeModalText}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    );
  };

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
            <Text style={styles.title}>Khuyến mãi</Text>
            <Text style={styles.subtitle}>Các mã giảm giá từ Dealer Manager</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
            placeholder="Tìm kiếm khuyến mãi..."
          placeholderTextColor={COLORS.TEXT.SECONDARY}
          value={searchQuery}
            onChangeText={handleSearch}
        />
      </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
        >
          <Text style={styles.filterIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>


      {/* Promotions List */}
          <FlatList
        data={filteredPromotions}
            renderItem={renderPromotionCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
        refreshing={loading.promotions}
        onRefresh={refresh}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🎯</Text>
            <Text style={styles.emptyTitle}>Không có khuyến mãi</Text>
                <Text style={styles.emptySubtitle}>
              {searchQuery ? 'Không tìm thấy khuyến mãi phù hợp' : 'Chưa có khuyến mãi nào'}
                </Text>
              </View>
            }
          />

      {/* Modals */}
      {renderFilterModal()}
      {renderDetailModal()}
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
  backIcon: {
    fontSize: SIZES.FONT.LARGE,
    color: COLORS.TEXT.WHITE,
    fontWeight: 'bold',
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  headerSpacer: {
    width: 40,
    height: 40,
  },
  title: {
    fontSize: SIZES.FONT.HEADER,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.PADDING.LARGE,
    marginBottom: SIZES.PADDING.LARGE,
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.LARGE,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    marginRight: SIZES.PADDING.SMALL,
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
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: SIZES.RADIUS.LARGE,
    backgroundColor: COLORS.SURFACE,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterIcon: {
    fontSize: SIZES.FONT.MEDIUM,
  },
  listContainer: {
    paddingHorizontal: SIZES.PADDING.LARGE,
    paddingBottom: SIZES.PADDING.XXXLARGE,
  },
  promotionCard: {
    marginBottom: SIZES.PADDING.MEDIUM,
    borderRadius: SIZES.RADIUS.LARGE,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardGradient: {
    borderRadius: SIZES.RADIUS.LARGE,
    padding: SIZES.PADDING.LARGE,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SIZES.PADDING.SMALL,
  },
  promotionInfo: {
    flex: 1,
  },
  headerBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.PADDING.XSMALL,
  },
  timeStatusBadge: {
    paddingHorizontal: SIZES.PADDING.SMALL,
    paddingVertical: SIZES.PADDING.XSMALL,
    borderRadius: SIZES.RADIUS.SMALL,
    marginRight: SIZES.PADDING.XSMALL,
  },
  timeStatusText: {
    fontSize: SIZES.FONT.XSMALL,
    color: COLORS.TEXT.WHITE,
    fontWeight: 'bold',
  },
  promotionName: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: 2,
  },
  promotionCode: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  priorityBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  priorityIcon: {
    fontSize: SIZES.FONT.MEDIUM,
  },
  promotionDescription: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: SIZES.PADDING.MEDIUM,
    lineHeight: 20,
  },
  discountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  discountInfo: {
    flex: 1,
  },
  discountLabel: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
  },
  discountValue: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.SUCCESS,
  },
  statusBadge: {
    paddingHorizontal: SIZES.PADDING.SMALL,
    paddingVertical: SIZES.PADDING.XSMALL,
    borderRadius: SIZES.RADIUS.SMALL,
  },
  statusBadgeText: {
    fontSize: SIZES.FONT.XSMALL,
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
  },
  modelsContainer: {
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  modelsLabel: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: SIZES.PADDING.XSMALL,
  },
  modelsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  modelTag: {
    paddingHorizontal: SIZES.PADDING.SMALL,
    paddingVertical: SIZES.PADDING.XSMALL,
    borderRadius: SIZES.RADIUS.SMALL,
    marginRight: SIZES.PADDING.XSMALL,
    marginBottom: SIZES.PADDING.XSMALL,
  },
  modelTagText: {
    fontSize: SIZES.FONT.XSMALL,
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
  },
  usageContainer: {
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  usageInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.PADDING.XSMALL,
  },
  usageLabel: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
  },
  usageText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '600',
  },
  usageBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  usageProgress: {
    height: '100%',
    borderRadius: 2,
  },
  expiryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expiryLabel: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
  },
  expiryText: {
    fontSize: SIZES.FONT.SMALL,
    fontWeight: '600',
  },
  expiryWarning: {
    color: COLORS.WARNING,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SIZES.PADDING.XXXLARGE,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: SIZES.PADDING.LARGE,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  filterModalContent: {
    backgroundColor: COLORS.SURFACE,
    borderTopLeftRadius: SIZES.RADIUS.XXLARGE,
    borderTopRightRadius: SIZES.RADIUS.XXLARGE,
    maxHeight: '80%',
    paddingBottom: 0,
  },
  detailModalContent: {
    backgroundColor: COLORS.SURFACE,
    borderTopLeftRadius: SIZES.RADIUS.XXLARGE,
    borderTopRightRadius: SIZES.RADIUS.XXLARGE,
    maxHeight: '90%',
    paddingBottom: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.PADDING.LARGE,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: SIZES.RADIUS.ROUND,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    fontSize: SIZES.FONT.LARGE,
    color: COLORS.TEXT.SECONDARY,
  },
  modalBody: {
    padding: SIZES.PADDING.LARGE,
  },
  filterSection: {
    marginBottom: SIZES.PADDING.LARGE,
  },
  filterSectionTitle: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  filterOption: {
    paddingVertical: SIZES.PADDING.MEDIUM,
    paddingHorizontal: SIZES.PADDING.LARGE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    marginBottom: SIZES.PADDING.SMALL,
    backgroundColor: '#F8F9FA',
  },
  filterOptionSelected: {
    backgroundColor: COLORS.PRIMARY,
  },
  filterOptionText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
  },
  filterOptionTextSelected: {
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: SIZES.PADDING.LARGE,
    paddingBottom: SIZES.PADDING.XXXLARGE,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  clearFiltersButton: {
    flex: 1,
    paddingVertical: SIZES.PADDING.MEDIUM,
    marginRight: SIZES.PADDING.SMALL,
    borderRadius: SIZES.RADIUS.MEDIUM,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  clearFiltersText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
    fontWeight: '600',
  },
  applyFiltersButton: {
    flex: 1,
    marginLeft: SIZES.PADDING.SMALL,
    borderRadius: SIZES.RADIUS.MEDIUM,
    overflow: 'hidden',
  },
  applyFiltersGradient: {
    paddingVertical: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
  },
  applyFiltersText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.WHITE,
    fontWeight: 'bold',
  },
  detailSection: {
    marginBottom: SIZES.PADDING.LARGE,
  },
  detailTitle: {
    fontSize: SIZES.FONT.XLARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SIZES.PADDING.XSMALL,
  },
  detailCode: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.PRIMARY,
    fontWeight: '600',
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  detailDescription: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
    lineHeight: 22,
  },
  detailSectionTitle: {
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
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
    flex: 1,
  },
  detailValue: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  termText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: SIZES.PADDING.SMALL,
    lineHeight: 20,
  },
  closeModalButton: {
    flex: 1,
    paddingVertical: SIZES.PADDING.MEDIUM,
    borderRadius: SIZES.RADIUS.MEDIUM,
    backgroundColor: COLORS.PRIMARY,
    alignItems: 'center',
  },
  closeModalText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.WHITE,
    fontWeight: 'bold',
  },
});

export default PromotionManagementScreen;