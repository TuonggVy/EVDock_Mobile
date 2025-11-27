import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  Platform,
} from 'react-native';
import { COLORS, SIZES } from '../../constants';
import promotionService from '../../services/promotionService';
import motorbikeService from '../../services/motorbikeService';
import CustomAlert from '../../components/common/CustomAlert';
import { Gift, Pencil, Search, Trash2, ArrowLeft, Plus } from 'lucide-react-native';

const PromotionManagementScreen = ({ navigation }) => {
  const [promotions, setPromotions] = useState([]);
  const [motorbikes, setMotorbikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('ACTIVE'); // 'ACTIVE' or 'INACTIVE'
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    message: '',
    type: 'info',
    showCancel: false,
    confirmText: 'OK',
    cancelText: 'Cancel',
    onConfirm: undefined,
    onCancel: undefined,
  });

  const hideAlert = () => {
    setShowAlert(false);
  };

  const openAlert = (config) => {
    setAlertConfig({
      title: '',
      message: '',
      type: 'info',
      showCancel: false,
      confirmText: 'OK',
      cancelText: 'Cancel',
      onConfirm: undefined,
      onCancel: undefined,
      ...config,
    });
    setShowAlert(true);
  };

  useEffect(() => {
    loadPromotions();
    loadMotorbikes();

    // Reload promotions when screen comes into focus (after adding/editing)
    const unsubscribe = navigation.addListener('focus', () => {
      loadPromotions();
    });

    return unsubscribe;
  }, [page, navigation]);

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

  const loadPromotions = async () => {
    try {
      setLoading(true);
      const response = await promotionService.getAllPromotions(page, 10);
      
      if (response.success) {
        // Fetch detailed info for promotions that have motorbikeId
        const promotionsWithDetails = await Promise.all(
          response.data.map(async (promotion) => {
            if (promotion.motorbikeId) {
              try {
                const detailResponse = await promotionService.getPromotionDetail(promotion.id);
                if (detailResponse.success && detailResponse.data?.motorbike) {
                  return {
                    ...promotion,
                    motorbikeName: detailResponse.data.motorbike.name
                  };
                }
              } catch (error) {
                console.error('Error fetching promotion detail:', error);
              }
            }
            return promotion;
          })
        );
        
        // Sort promotions by ID descending (newest first)
        promotionsWithDetails.sort((a, b) => (b.id || 0) - (a.id || 0));
        
        setPromotions(promotionsWithDetails);
        if (response.pagination) {
          setTotalPages(Math.ceil(response.pagination.total / response.pagination.limit));
        }
      } else {
        const errorMessage = typeof response.error === 'string' 
          ? response.error 
          : (response.error?.message || JSON.stringify(response.error) || 'Failed to load promotions');
        openAlert({
          title: 'Error',
          message: errorMessage,
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Error loading promotions:', error);
      openAlert({
        title: 'Error',
        message: 'An unexpected error occurred',
        type: 'error',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPromotions();
  };

  const handleDelete = (promotionId, promotionName) => {
    openAlert({
      title: 'Delete Promotion',
      message: `Are you sure you want to delete "${promotionName}"?`,
      type: 'warning',
      showCancel: true,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onCancel: hideAlert,
      onConfirm: async () => {
        try {
          const response = await promotionService.deletePromotion(promotionId);
          if (response.success) {
            openAlert({
              title: 'Success',
              message: 'Promotion deleted successfully',
              type: 'success',
            });
            loadPromotions();
          } else {
            const errorMessage = typeof response.error === 'string' 
              ? response.error 
              : (response.error?.message || JSON.stringify(response.error) || 'Failed to delete promotion');
            openAlert({
              title: 'Error',
              message: errorMessage,
              type: 'error',
            });
          }
        } catch (error) {
          console.error('Error deleting promotion:', error);
          openAlert({
            title: 'Error',
            message: 'An unexpected error occurred',
            type: 'error',
          });
        }
      },
    });
  };

  const handleEdit = (promotion) => {
    navigation.navigate('EditPromotion', { promotion });
  };

  const handleAdd = () => {
    navigation.navigate('AddPromotion');
  };

  const filteredPromotions = promotions.filter(promo => {
    // Filter by search query
    const matchesSearch = promo.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      promo.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by tab status
    const matchesStatus = promo.status === activeTab;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    return status === 'ACTIVE' ? COLORS.SUCCESS : COLORS.ERROR;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const totalPromotions = promotions.length;
  const activePromotions = promotions.filter(promo => promo.status === 'ACTIVE').length;
  const inactivePromotions = promotions.filter(promo => promo.status === 'INACTIVE').length;

  const renderPromotionCard = (promotion) => (
    <View key={promotion.id} style={styles.promotionCard}>
      <View style={styles.cardHeader}>
        <View style={styles.cardInfo}>
          <Text style={styles.promotionName}>{promotion.name}</Text>
          <Text style={styles.promotionDescription} numberOfLines={2}>
            {promotion.description}
          </Text>
        </View>
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(promotion.status) }]}>
            <Text style={styles.statusText}>{promotion.status}</Text>
          </View>
        </View>
      </View>

      <View style={styles.promotionDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Value</Text>
          <Text style={styles.detailValue}>
            {promotionService.formatValue(promotion.value, promotion.valueType)}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Period</Text>
          <Text style={styles.detailValue}>
            {formatDate(promotion.startAt)} - {formatDate(promotion.endAt)}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Scope</Text>
          <Text style={styles.detailValue}>
            {promotion.motorbikeId
              ? (promotion.motorbikeName || `Motorbike #${promotion.motorbikeId}`)
              : 'System-wide'}
          </Text>
        </View>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => handleEdit(promotion)}
        >
          <Pencil size={16} color={COLORS.TEXT.WHITE} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(promotion.id, promotion.name)}
        >
          <Trash2 size={16} color={COLORS.TEXT.WHITE} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft color={COLORS.TEXT.WHITE} size={18} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Promotion Management</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <Plus color={COLORS.TEXT.WHITE} size={18} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Search size={18} color={COLORS.TEXT.SECONDARY} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search promotions..."
          placeholderTextColor={COLORS.TEXT.SECONDARY}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalPromotions}</Text>
          <Text style={styles.statLabel}>Total Promotions</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: COLORS.SUCCESS }]}>{activePromotions}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: COLORS.SUCCESS }]}>{inactivePromotions}</Text>
          <Text style={styles.statLabel}>Inactive</Text>
        </View>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'ACTIVE' && styles.activeTabButton]}
          onPress={() => setActiveTab('ACTIVE')}
        >
          <Text style={[styles.tabText, activeTab === 'ACTIVE' && styles.activeTabText]}>
            Active ({activePromotions})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'INACTIVE' && styles.activeTabButton]}
          onPress={() => setActiveTab('INACTIVE')}
        >
          <Text style={[styles.tabText, activeTab === 'INACTIVE' && styles.activeTabText]}>
            Inactive ({inactivePromotions})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#009DFF" />
        </View>
      ) : (
        <ScrollView
          style={styles.listContainer}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
        >
          {filteredPromotions.length > 0 ? (
            filteredPromotions.map(renderPromotionCard)
          ) : (
            <View style={styles.emptyContainer}>
              <Gift size={64} color={COLORS.TEXT.SECONDARY} />
              <Text style={styles.emptyTitle}>No Promotions Found</Text>
              <Text style={styles.emptySubtitle}>
                Try adjusting your search or create a new promotion.
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      <CustomAlert
        visible={showAlert}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        showCancel={alertConfig.showCancel}
        confirmText={alertConfig.confirmText}
        cancelText={alertConfig.cancelText}
        onConfirm={alertConfig.onConfirm}
        onCancel={alertConfig.onCancel || hideAlert}
        onClose={hideAlert}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
    paddingTop: Platform.OS === 'ios' ? 30 : 0,
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
    backgroundColor: '#009DFF',
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
    marginHorizontal: SIZES.PADDING.MEDIUM,
    marginTop: SIZES.PADDING.MEDIUM,
    marginBottom: SIZES.PADDING.MEDIUM,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    gap: SIZES.PADDING.SMALL,
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
    color: COLORS.SUCCESS,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: SIZES.FONT.XSMALL,
    color: COLORS.TEXT.SECONDARY,
    textAlign: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: SIZES.RADIUS.MEDIUM,
    marginHorizontal: SIZES.PADDING.MEDIUM,
    marginBottom: SIZES.PADDING.MEDIUM,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: SIZES.PADDING.SMALL,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    borderRadius: SIZES.RADIUS.SMALL,
    alignItems: 'center',
  },
  activeTabButton: {
    backgroundColor: "#009DFF",
  },
  tabText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
    fontWeight: '600',
  },
  activeTabText: {
    color: COLORS.TEXT.WHITE,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: SIZES.PADDING.MEDIUM,
  },
  promotionCard: {
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
  cardInfo: {
    flex: 1,
    marginRight: SIZES.PADDING.SMALL,
  },
  promotionName: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: '#009DFF',
    marginBottom: 4,
  },
  promotionDescription: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
  },
  statusContainer: {
    marginLeft: SIZES.PADDING.SMALL,
  },
  statusBadge: {
    paddingHorizontal: SIZES.PADDING.SMALL,
    paddingVertical: 4,
    borderRadius: SIZES.RADIUS.SMALL,
    alignItems: 'center',
  },
  statusText: {
    fontSize: SIZES.FONT.XSMALL,
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
  },
  promotionDetails: {
    marginBottom: SIZES.PADDING.MEDIUM,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: SIZES.PADDING.SMALL,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.PADDING.XSMALL,
  },
  detailLabel: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
  },
  detailValue: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: SIZES.PADDING.SMALL,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SIZES.PADDING.SMALL,
  },
  editButton: {
    backgroundColor: '#000000',
    borderRadius: SIZES.RADIUS.SMALL,
    padding: SIZES.PADDING.SMALL,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 36,
    minHeight: 36,
  },
  deleteButton: {
    backgroundColor: '#000000',
    borderRadius: SIZES.RADIUS.SMALL,
    padding: SIZES.PADDING.SMALL,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 36,
    minHeight: 36,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.PADDING.XXXLARGE,
  },
  emptyTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginTop: SIZES.PADDING.MEDIUM,
    marginBottom: SIZES.PADDING.XSMALL,
  },
  emptySubtitle: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
    textAlign: 'center',
  },
});

export default PromotionManagementScreen;

