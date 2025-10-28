import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { COLORS, SIZES } from '../../constants';
import promotionService from '../../services/promotionService';
import motorbikeService from '../../services/motorbikeService';
import CustomAlert from '../../components/common/CustomAlert';
import { Gift, Pencil, Search, Trash2 } from 'lucide-react-native';

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
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'info' });

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
        setAlertConfig({
          title: 'Error',
          message: errorMessage,
          type: 'error'
        });
        setShowAlert(true);
      }
    } catch (error) {
      console.error('Error loading promotions:', error);
      setAlertConfig({
        title: 'Error',
        message: 'An unexpected error occurred',
        type: 'error'
      });
      setShowAlert(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPromotions();
  };

  const handleDelete = async (promotionId, promotionName) => {
    Alert.alert(
      'Delete Promotion',
      `Are you sure you want to delete "${promotionName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const response = await promotionService.deletePromotion(promotionId);
            if (response.success) {
              setAlertConfig({
                title: 'Success',
                message: 'Promotion deleted successfully',
                type: 'success'
              });
              setShowAlert(true);
              loadPromotions();
            } else {
              const errorMessage = typeof response.error === 'string' 
                ? response.error 
                : (response.error?.message || JSON.stringify(response.error) || 'Failed to delete promotion');
              setAlertConfig({
                title: 'Error',
                message: errorMessage,
                type: 'error'
              });
              setShowAlert(true);
            }
          }
        }
      ]
    );
  };

  const handleEdit = (promotion) => {
    navigation.navigate('AddPromotion', { promotion });
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
    return status === 'ACTIVE' ? COLORS.SUCCESS : COLORS.TEXT.SECONDARY;
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

  return (
    <View style={styles.container}>
      <CustomAlert
        visible={showAlert}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setShowAlert(false)}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Promotion Management</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAdd}
        >
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}><Search /></Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search promotions..."
          placeholderTextColor={COLORS.TEXT.SECONDARY}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'ACTIVE' && styles.tabActive]}
          onPress={() => setActiveTab('ACTIVE')}
        >
          <Text style={[styles.tabText, activeTab === 'ACTIVE' && styles.tabTextActive]}>
            Active
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'INACTIVE' && styles.tabActive]}
          onPress={() => setActiveTab('INACTIVE')}
        >
          <Text style={[styles.tabText, activeTab === 'INACTIVE' && styles.tabTextActive]}>
            Inactive
          </Text>
        </TouchableOpacity>
      </View>

      {/* Promotions List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        </View>
      ) : (
        <ScrollView
          style={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {filteredPromotions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}><Gift size={60} color="#FFFFFF" /></Text>
              <Text style={styles.emptyText}>No promotions found</Text>
            </View>
          ) : (
            filteredPromotions.map((promotion) => (
              <View key={promotion.id} style={styles.promotionCard}>
                <View style={styles.promotionHeader}>
                  <View style={styles.promotionHeaderLeft}>
                    <Text style={styles.promotionName}>{promotion.name}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(promotion.status) }]}>
                      <Text style={styles.statusText}>{promotion.status}</Text>
                    </View>
                  </View>
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[styles.iconButton, styles.editButton]}
                      onPress={() => handleEdit(promotion)}
                    >
                      <Text style={styles.iconText}><Pencil size={14} /></Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.iconButton, styles.deleteButton]}
                      onPress={() => handleDelete(promotion.id, promotion.name)}
                    >
                      <Text style={styles.iconText}><Trash2 size={14} /></Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={styles.promotionDescription}>{promotion.description}</Text>

                <View style={styles.promotionDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Value:</Text>
                    <Text style={styles.detailValue}>
                      {promotionService.formatValue(promotion.value, promotion.valueType)}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Period:</Text>
                    <Text style={styles.detailValue}>
                      {formatDate(promotion.startAt)} - {formatDate(promotion.endAt)}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Scope:</Text>
                    <Text style={styles.detailValue}>
                      {promotion.motorbikeId 
                        ? (promotion.motorbikeName || `Motorbike #${promotion.motorbikeId}`)
                        : 'System-wide'}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
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
    padding: SIZES.PADDING.LARGE,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
    paddingTop: SIZES.PADDING.XXXLARGE,
  },
  backButton: {
    padding: SIZES.PADDING.SMALL,
  },
  backButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: SIZES.FONT.HEADER,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    padding: SIZES.PADDING.SMALL,
  },
  addButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.SURFACE,
    marginHorizontal: SIZES.PADDING.LARGE,
    marginBottom: SIZES.PADDING.LARGE,
    borderRadius: SIZES.RADIUS.LARGE,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: SIZES.PADDING.LARGE,
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
  promotionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SIZES.PADDING.SMALL,
  },
  promotionHeaderLeft: {
    flex: 1,
  },
  promotionName: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SIZES.PADDING.XSMALL,
  },
  statusBadge: {
    paddingHorizontal: SIZES.PADDING.SMALL,
    paddingVertical: 4,
    borderRadius: SIZES.RADIUS.SMALL,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: SIZES.FONT.XSMALL,
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: SIZES.RADIUS.SMALL,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SIZES.PADDING.XSMALL,
  },
  editButton: {
    backgroundColor: COLORS.PRIMARY + '20',
  },
  deleteButton: {
    backgroundColor: COLORS.ERROR + '20',
  },
  iconText: {
    fontSize: SIZES.FONT.MEDIUM,
  },
  promotionDescription: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  promotionDetails: {
    borderTopWidth: 1,
    borderTopColor: '#EFEFEF',
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
    flex: 1,
    textAlign: 'right',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SIZES.PADDING.XXXLARGE,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  emptyText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: SIZES.PADDING.LARGE,
    marginBottom: SIZES.PADDING.MEDIUM,
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: SIZES.PADDING.SMALL,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
    borderRadius: SIZES.RADIUS.SMALL,
  },
  tabActive: {
    backgroundColor: COLORS.PRIMARY,
  },
  tabText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
    fontWeight: '600',
  },
  tabTextActive: {
    color: COLORS.TEXT.WHITE,
  },
});

export default PromotionManagementScreen;

