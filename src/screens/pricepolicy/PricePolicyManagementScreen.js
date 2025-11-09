import React, { useState, useEffect, useMemo } from 'react';
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
import pricePolicyService from '../../services/pricePolicyService';
import agencyService from '../../services/agencyService';
import motorbikeService from '../../services/motorbikeService';
import CustomAlert from '../../components/common/CustomAlert';
import { Pencil, Trash2, ArrowLeft, Plus, Search, DollarSign } from 'lucide-react-native';
import { useCustomAlert } from '../../hooks/useCustomAlert';

const PricePolicyManagementScreen = ({ navigation }) => {
  const [pricePolicies, setPricePolicies] = useState([]);
  const [agencies, setAgencies] = useState([]);
  const [motorbikes, setMotorbikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { alertConfig, hideAlert, showError, showSuccess, showDeleteConfirm } = useCustomAlert();

  useEffect(() => {
    loadPricePolicies();
    loadAgencies();
    loadMotorbikes();

    const unsubscribe = navigation.addListener('focus', () => {
      loadPricePolicies();
    });

    return unsubscribe;
  }, [navigation]);

  const loadAgencies = async () => {
    try {
      const response = await agencyService.getAgencies({ limit: 100 });
      if (response.success && Array.isArray(response.data)) {
        setAgencies(response.data);
      }
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

  const loadPricePolicies = async () => {
    try {
      setLoading(true);
      const response = await pricePolicyService.getAllPricePolicies(1, 10);
      
      if (response.success) {
        const sortedPolicies = response.data.sort((a, b) => (b.id || 0) - (a.id || 0));
        setPricePolicies(sortedPolicies);
      } else {
        const errorMessage = typeof response.error === 'string' 
          ? response.error 
          : (response.error?.message || JSON.stringify(response.error) || 'Failed to load price policies');
        showError('Error', errorMessage);
      }
    } catch (error) {
      console.error('Error loading price policies:', error);
      showError('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPricePolicies();
  };

  const handleDelete = async (policyId, policyTitle) => {
    showDeleteConfirm(
      'Delete Price Policy',
      `Are you sure you want to delete "${policyTitle}"?`,
      async () => {
        const response = await pricePolicyService.deletePricePolicy(policyId);
        if (response.success) {
          showSuccess('Success', 'Price policy deleted successfully');
          await loadPricePolicies();
        } else {
          const errorMessage = typeof response.error === 'string' 
            ? response.error 
            : (response.error?.message || JSON.stringify(response.error) || 'Failed to delete price policy');
          showError('Error', errorMessage);
        }
      }
    );
  };

  const handleEdit = (policy) => {
    navigation.navigate('EditPricePolicy', { pricePolicy: policy });
  };

  const handleAdd = () => {
    navigation.navigate('AddPricePolicy');
  };

  const getAgencyName = (agencyId) => {
    const agency = agencies.find(a => a.id === agencyId);
    return agency?.name || `Agency #${agencyId}`;
  };

  const getMotorbikeName = (motorbikeId) => {
    const motorbike = motorbikes.find(m => m.id === motorbikeId);
    return motorbike?.name || `Motorbike #${motorbikeId}`;
  };

  const filteredPolicies = pricePolicies.filter(policy => {
    return policy.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      policy.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      policy.policy?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const stats = useMemo(() => {
    const total = pricePolicies.length;
    const uniqueAgencies = new Set(pricePolicies.map(policy => policy.agencyId).filter(Boolean)).size;
    const uniqueMotorbikes = new Set(pricePolicies.map(policy => policy.motorbikeId).filter(Boolean)).size;

    return {
      total,
      agencies: uniqueAgencies,
      motorbikes: uniqueMotorbikes,
    };
  }, [pricePolicies]);

  return (
    <SafeAreaView style={styles.safeArea}>
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

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft color={COLORS.TEXT.WHITE} size={18} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Price Policy</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAdd}
        >
          <Plus color={COLORS.TEXT.WHITE} size={18} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Search size={18} color={COLORS.TEXT.SECONDARY} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search price policies..."
          placeholderTextColor={COLORS.TEXT.SECONDARY}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total Policies</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, styles.statAccent]}>{stats.agencies}</Text>
          <Text style={styles.statLabel}>Agencies</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, styles.statAccent]}>{stats.motorbikes}</Text>
          <Text style={styles.statLabel}>Motorbikes</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#009DFF" />
        </View>
      ) : (
        <ScrollView
          style={styles.listContainer}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {filteredPolicies.length === 0 ? (
            <View style={styles.emptyState}>
              <DollarSign size={64} color={COLORS.TEXT.SECONDARY} />
              <Text style={styles.emptyTitle}>No Price Policies</Text>
              <Text style={styles.emptySubtitle}>
                Try adjusting your search or add a new price policy.
              </Text>
            </View>
          ) : (
            filteredPolicies.map((policy) => (
              <View key={policy.id} style={styles.policyCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderInfo}>
                    <Text style={styles.policyTitle}>{policy.title || 'Untitled Policy'}</Text>
                    <Text style={styles.policyMeta}>
                      {getAgencyName(policy.agencyId)} • {getMotorbikeName(policy.motorbikeId)}
                    </Text>
                  </View>
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleEdit(policy)}
                    >
                      <Pencil size={16} color={COLORS.TEXT.WHITE} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleDelete(policy.id, policy.title)}
                    >
                      <Trash2 size={16} color={COLORS.TEXT.WHITE} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.priceBadge}>
                  <Text style={styles.priceLabel}>Wholesale Price</Text>
                  <Text style={styles.priceValue}>
                    {pricePolicyService.formatPrice(policy.wholesalePrice)}
                  </Text>
                </View>

                {!!policy.content && (
                  <Text style={styles.policyContent}>{policy.content}</Text>
                )}

                <View style={styles.policyDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Policy Code</Text>
                    <Text style={styles.detailValue}>{policy.policy || 'N/A'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Agency</Text>
                    <Text style={styles.detailValue}>{getAgencyName(policy.agencyId)}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Motorbike</Text>
                    <Text style={styles.detailValue}>{getMotorbikeName(policy.motorbikeId)}</Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
    paddingTop: Platform.OS === 'ios' ? 30 : 20,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
    paddingBottom: SIZES.PADDING.MEDIUM,
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
    fontSize: SIZES.FONT.HEADER,
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
    margin: SIZES.PADDING.MEDIUM,
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
    color: COLORS.TEXT.WHITE,
    marginBottom: 4,
  },
  statAccent: {
    color: COLORS.SUCCESS,
  },
  statLabel: {
    fontSize: SIZES.FONT.XSMALL,
    color: COLORS.TEXT.SECONDARY,
    textAlign: 'center',
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
    paddingBottom: SIZES.PADDING.XXXLARGE,
  },
  policyCard: {
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
  cardHeaderInfo: {
    flex: 1,
  },
  policyTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: "#009DFF",
    marginBottom: 4,
  },
  policyMeta: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
  },
  cardActions: {
    flexDirection: 'row',
    gap: SIZES.PADDING.XSMALL,
  },
  actionButton: {
    backgroundColor: '#000000',
    borderRadius: SIZES.RADIUS.SMALL,
    padding: SIZES.PADDING.SMALL,
    justifyContent: 'center',
    alignItems: 'center',
  },
  priceBadge: {
    backgroundColor: 'rgba(0, 157, 255, 0.08)',
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.SMALL,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.PADDING.SMALL,
  },
  priceLabel: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    fontWeight: '600',
  },
  priceValue: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.PRIMARY,
    fontWeight: '700',
  },
  policyContent: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: SIZES.PADDING.SMALL,
    lineHeight: 22,
  },
  policyDetails: {
    borderTopWidth: 1,
    borderTopColor: '#EFEFEF',
    paddingTop: SIZES.PADDING.SMALL,
    gap: SIZES.PADDING.XSMALL,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SIZES.PADDING.XXXLARGE,
  },
  emptyTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginTop: SIZES.PADDING.MEDIUM,
    marginBottom: SIZES.PADDING.SMALL,
  },
  emptySubtitle: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
    textAlign: 'center',
    paddingHorizontal: SIZES.PADDING.LARGE,
  },
});

export default PricePolicyManagementScreen;
