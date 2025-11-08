import React, { useState, useEffect, useMemo } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { COLORS, SIZES } from '../../constants';
import CustomAlert from '../../components/common/CustomAlert';
import batchManagementService from '../../services/batchManagementService';
import agencyService from '../../services/agencyService';
import { ArrowLeft, Plus, Search, FileText, Pencil, Trash2 } from 'lucide-react-native';

const BatchManagementScreen = ({ navigation }) => {
  const [batches, setBatches] = useState([]);
  const [filteredBatches, setFilteredBatches] = useState([]);
  const [agencies, setAgencies] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [paginationInfo, setPaginationInfo] = useState({
    page: 1,
    limit: 10,
    total: 0
  });
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'info' });
  const [activeStatusFilter, setActiveStatusFilter] = useState('ALL');


  useEffect(() => {
    loadAgencies();
    loadBatches();

    const unsubscribe = navigation.addListener('focus', () => {
      loadBatches();
    });

    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    filterBatches();
  }, [searchQuery, batches, activeStatusFilter]);

  const loadAgencies = async () => {
    try {
      const response = await agencyService.getAgencies({ limit: 100 });
      if (response.success) {
        setAgencies(response.data || []);
      }
    } catch (error) {
      console.error('Error loading agencies:', error);
    }
  };

  const getAgencyName = (agencyId) => {
    if (!agencyId) return 'N/A';
    const agency = agencies.find(a => a.id === agencyId || a.id?.toString() === agencyId?.toString());
    return agency?.name || `Agency ${agencyId}`;
  };

  const loadBatches = async (page = 1) => {
    try {
      setLoading(page === 1);
      const params = {
        page,
        limit: paginationInfo.limit,
      };

      const response = await batchManagementService.getBatchList(params);
      
      if (response.success) {
        const batchesList = response.data || [];
        // Sort by createAt (most recent first)
        const sortedBatches = batchesList.sort((a, b) => {
          const dateA = new Date(a.createAt || a.createdAt || 0);
          const dateB = new Date(b.createAt || b.createdAt || 0);
          return dateB - dateA; // Descending order (newest first)
        });
        
        if (page === 1) {
          setBatches(sortedBatches);
        } else {
          setBatches(prev => [...prev, ...sortedBatches]);
        }
        
        setPaginationInfo(response.pagination || { page: 1, limit: 10, total: 0 });
      } else {
        setAlertConfig({
          title: 'Error',
          message: response.error || 'Cannot load batch list',
          type: 'error'
        });
        setShowAlert(true);
      }
    } catch (error) {
      console.error('Error loading batches:', error);
      setAlertConfig({
        title: 'Error',
        message: 'Cannot load batch list',
        type: 'error'
      });
      setShowAlert(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterBatches = () => {
    let filtered = [...batches];

    if (activeStatusFilter !== 'ALL') {
      filtered = filtered.filter(batch => batch.status === activeStatusFilter);
    }

    // Filter by search query (invoice number or agency name)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(batch => {
        const invoiceMatch = batch.invoiceNumber?.toString().toLowerCase().includes(query);
        const agencyName = getAgencyName(batch.agencyId).toLowerCase();
        const agencyMatch = agencyName.includes(query);
        return invoiceMatch || agencyMatch;
      });
    }

    setFilteredBatches(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadBatches(1);
  };

  const handleCreateBatch = () => {
    navigation.navigate('CreateBatch');
  };

  const handleViewDetail = (batch) => {
    navigation.navigate('BatchDetail', { batchId: batch.id });
  };

  const handleEditBatch = (batch, event) => {
    event?.stopPropagation();
    navigation.navigate('EditBatch', { batchId: batch.id, batch });
  };

  const handleDeleteBatch = (batch, event) => {
    event?.stopPropagation();
    Alert.alert(
      'Delete Batch',
      `Are you sure you want to delete batch #${batch.id}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await batchManagementService.deleteBatch(batch.id);
              if (response.success) {
                setAlertConfig({
                  title: 'Success',
                  message: 'Batch deleted successfully',
                  type: 'success'
                });
                setShowAlert(true);
                loadBatches(1);
              } else {
                setAlertConfig({
                  title: 'Error',
                  message: response.error || 'Failed to delete batch',
                  type: 'error'
                });
                setShowAlert(true);
              }
            } catch (error) {
              console.error('Error deleting batch:', error);
              setAlertConfig({
                title: 'Error',
                message: 'Failed to delete batch',
                type: 'error'
              });
              setShowAlert(true);
            }
          }
        }
      ]
    );
  };

  const formatPrice = (amount) => {
    if (!amount) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'OPEN':
        return COLORS.WARNING;
      case 'PARTIAL':
        return COLORS.PRIMARY;
      case 'CLOSED':
        return COLORS.SUCCESS;
      case 'OVERDUE':
        return COLORS.ERROR;
      default:
        return COLORS.TEXT.SECONDARY;
    }
  };

  const statusCounts = useMemo(() => {
    return batches.reduce(
      (acc, batch) => {
        acc.ALL += 1;
        if (batch.status) {
          acc[batch.status] = (acc[batch.status] || 0) + 1;
        }
        return acc;
      },
      { ALL: 0, OPEN: 0, PARTIAL: 0, CLOSED: 0, OVERDUE: 0 }
    );
  }, [batches]);

  const statusFilters = [
    { label: `All (${statusCounts.ALL})`, value: 'ALL' },
    { label: `Open (${statusCounts.OPEN})`, value: 'OPEN' },
    { label: `Partial (${statusCounts.PARTIAL})`, value: 'PARTIAL' },
    { label: `Closed (${statusCounts.CLOSED})`, value: 'CLOSED' },
    { label: `Overdue (${statusCounts.OVERDUE})`, value: 'OVERDUE' },
  ];

  const renderBatchCard = (batch) => {
    const statusColor = getStatusColor(batch.status);

    return (
      <TouchableOpacity
        key={batch.id}
        style={styles.batchCard}
        onPress={() => handleViewDetail(batch)}
        activeOpacity={0.8}
      >
        <View style={styles.batchHeader}>
          <View style={styles.batchHeaderLeft}>
            <Text style={styles.batchId}>Batch #{batch.id}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {batch.status || 'N/A'}
              </Text>
            </View>
          </View>
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[styles.iconButton, styles.editButton]}
                      onPress={(e) => handleEditBatch(batch, e)}
                    >
                      <Pencil size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.iconButton, styles.deleteButton]}
                      onPress={(e) => handleDeleteBatch(batch, e)}
                    >
                      <Trash2 size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
        </View>

                <View style={styles.batchInfo}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Invoice Number:</Text>
                    <Text style={styles.infoValue}>{batch.invoiceNumber || 'N/A'}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Agency:</Text>
                    <Text style={styles.infoValue}>{getAgencyName(batch.agencyId)}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Amount:</Text>
                    <Text style={styles.amountValue}>{formatPrice(batch.amount)}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Due Date:</Text>
                    <Text style={styles.infoValue}>{formatDate(batch.dueDate)}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Created:</Text>
                    <Text style={styles.infoValue}>{formatDate(batch.createAt)}</Text>
                  </View>
                </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
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
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={18} color={COLORS.TEXT.WHITE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AP Batches Management</Text>
        <TouchableOpacity
          style={styles.headerButtonPrimary}
          onPress={handleCreateBatch}
        >
          <Plus size={18} color={COLORS.TEXT.WHITE} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Search size={18} color={COLORS.TEXT.SECONDARY} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search batches, invoice, agency..."
          placeholderTextColor={COLORS.TEXT.SECONDARY}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Status Tabs */}
      <SafeAreaView>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.statusTabsScroll}
          contentContainerStyle={styles.statusTabsContent}
        >
          {statusFilters.map(filter => (
            <TouchableOpacity
              key={filter.value}
              style={[
                styles.statusTabButton,
                activeStatusFilter === filter.value && styles.activeStatusTabButton,
              ]}
              onPress={() => setActiveStatusFilter(filter.value)}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.statusTabText,
                  activeStatusFilter === filter.value && styles.activeStatusTabText,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>

      {/* Batch List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        </View>
      ) : (
        <ScrollView
          style={styles.listContainer}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {filteredBatches.length === 0 ? (
            <View style={styles.emptyContainer}>
              <FileText size={64} color={COLORS.TEXT.SECONDARY} />
              <Text style={styles.emptyText}>No batches found</Text>
            </View>
          ) : (
            filteredBatches.map(batch => renderBatchCard(batch))
          )}
        </ScrollView>
      )}
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
    paddingTop: SIZES.PADDING.MEDIUM,
    paddingBottom: SIZES.PADDING.MEDIUM,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: SIZES.RADIUS.ROUND,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonPrimary: {
    width: 40,
    height: 40,
    borderRadius: SIZES.RADIUS.ROUND,
    backgroundColor: "#009DFF",
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: COLORS.TEXT.WHITE,
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    paddingHorizontal: SIZES.PADDING.SMALL,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    marginHorizontal: SIZES.PADDING.LARGE,
    marginTop: SIZES.PADDING.MEDIUM,
    gap: SIZES.PADDING.SMALL,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
  },
  statusTabsScroll: {
    marginTop: SIZES.PADDING.MEDIUM,
  },
  statusTabsContent: {
    paddingHorizontal: SIZES.PADDING.LARGE,
    paddingBottom: SIZES.PADDING.SMALL,
    gap: SIZES.PADDING.SMALL,
  },
  statusTabButton: {
    paddingVertical: SIZES.PADDING.XSMALL,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: SIZES.RADIUS.SMALL,
    backgroundColor: 'rgba(255,255,255,0.12)',
    minWidth: 120,
    height: 30
  },
  activeStatusTabButton: {
    backgroundColor: "#009DFF",
  },
  statusTabText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    fontWeight: '600',
  },
  activeStatusTabText: {
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
    paddingHorizontal: SIZES.PADDING.LARGE,
    paddingBottom: SIZES.PADDING.XXXLARGE,
  },
  batchCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.LARGE,
    padding: SIZES.PADDING.MEDIUM,
    marginBottom: SIZES.PADDING.MEDIUM,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  batchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  batchHeaderLeft: {
    flex: 1,
  },
  batchId: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
  },
  statusBadge: {
    paddingHorizontal: SIZES.PADDING.SMALL,
    paddingVertical: 4,
    borderRadius: SIZES.RADIUS.SMALL,
    alignSelf: 'flex-start',
    marginTop: SIZES.PADDING.XSMALL,
  },
  statusText: {
    fontSize: SIZES.FONT.XSMALL,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SIZES.PADDING.XSMALL,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: SIZES.RADIUS.SMALL,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  editButton: {
    backgroundColor: "#000000",
  },
  deleteButton: {
    backgroundColor: "#000000",
  },
  batchInfo: {
    borderTopWidth: 1,
    borderTopColor: '#EFEFEF',
    paddingTop: SIZES.PADDING.SMALL,
    gap: SIZES.PADDING.SMALL,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
  },
  infoValue: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '600',
    marginLeft: SIZES.PADDING.SMALL,
    flex: 1,
    textAlign: 'right',
  },
  amountValue: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.SECONDARY,
    fontWeight: '700',
    marginLeft: SIZES.PADDING.SMALL,
    flex: 1,
    textAlign: 'right',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SIZES.PADDING.XXXLARGE,
  },
  emptyText: {
    marginTop: SIZES.PADDING.MEDIUM,
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
  },
});

export default BatchManagementScreen;
