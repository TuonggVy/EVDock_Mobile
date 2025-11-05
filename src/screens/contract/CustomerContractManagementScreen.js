import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import customerContractService from '../../services/customerContractService';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import { ArrowLeft, NotepadText, Pencil, Plus, Search, Trash2, Filter } from 'lucide-react-native';
import { formatPrice } from '../../utils/promotionUtils';

const CustomerContractManagementScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { alertConfig, hideAlert, showSuccess, showError, showDeleteConfirm } = useCustomAlert();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all'); // Status filter
  const [selectedTab, setSelectedTab] = useState('full'); // Tab selection: 'full' or 'debt'
  const [contracts, setContracts] = useState([]);
  const [filteredContracts, setFilteredContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadContracts();
  }, []);

  useEffect(() => {
    loadContracts();
  }, [selectedFilter]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadContracts();
    }, [])
  );

  // Filter contracts based on search query and selected tab (client-side filtering)
  useEffect(() => {
    filterContracts();
  }, [searchQuery, contracts, selectedTab]);

  const loadContracts = async () => {
    try {
      setLoading(true);
      const agencyId = user?.agencyId;
      if (!agencyId) {
        console.error('No agencyId found for Dealer Staff');
        setContracts([]);
        setLoading(false);
        return;
      }

      const params = {
        limit: 1000,
        page: 1,
      };

      // Add filters to API call (only status filter, contract type will be filtered client-side by tab)
      if (selectedFilter !== 'all') {
        params.status = selectedFilter.toUpperCase();
      }

      const response = await customerContractService.getCustomerContracts(parseInt(agencyId), params);
      
      if (response.success) {
        const sortedContracts = (response.data || []).sort((a, b) => {
          // Sort by creation date first (createAt, createdAt, created_at), then by id (larger id = newer), then by signDate
          const dateA = new Date(a.createAt || a.createdAt || a.created_at || a.signDate || 0);
          const dateB = new Date(b.createAt || b.createdAt || b.created_at || b.signDate || 0);
          
          // If dates are valid and different, sort by date
          if (dateA.getTime() > 0 && dateB.getTime() > 0 && dateA.getTime() !== dateB.getTime()) {
            return dateB.getTime() - dateA.getTime(); // Descending order (newest first)
          }
          
          // If dates are same or invalid, sort by id (larger id = newer contract)
          const idA = parseInt(a.id) || 0;
          const idB = parseInt(b.id) || 0;
          return idB - idA; // Descending order (larger id = newer)
        });
        setContracts(sortedContracts);
      } else {
        console.error('Error loading contracts:', response.error);
        showError('Error', response.error || 'Failed to load customer contracts');
        setContracts([]);
      }
    } catch (error) {
      console.error('Error loading contracts:', error);
      showError('Error', 'Failed to load customer contracts');
      setContracts([]);
    } finally {
      setLoading(false);
    }
  };

  const filterContracts = () => {
    let filtered = contracts;

    // Filter by selected tab (contract type)
    if (selectedTab === 'full') {
      filtered = filtered.filter(contract => 
        contract.contractPaidType?.toUpperCase() === 'FULL' || 
        contract.contractType?.toUpperCase() === 'FULL'
      );
    } else if (selectedTab === 'debt') {
      filtered = filtered.filter(contract => 
        contract.contractPaidType?.toUpperCase() === 'DEBT' || 
        contract.contractType?.toUpperCase() === 'DEBT'
      );
    }

    // Client-side search filtering
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(contract =>
        contract.title?.toLowerCase().includes(query) ||
        contract.contractCode?.toLowerCase().includes(query) ||
        contract.id?.toString().includes(query)
      );
    }

    setFilteredContracts(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadContracts();
    setRefreshing(false);
  };

  const handleDeleteContract = async (contractId) => {
    showDeleteConfirm(
      'Delete Contract',
      'Are you sure you want to delete this contract?',
      async () => {
        try {
          const response = await customerContractService.deleteCustomerContract(contractId);
          if (response.success) {
            showSuccess('Success', 'Contract deleted successfully');
            loadContracts();
          } else {
            showError('Error', response.error || 'Failed to delete contract');
          }
        } catch (error) {
          console.error('Error deleting contract:', error);
          showError('Error', 'Failed to delete contract');
        }
      }
    );
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'PENDING': return COLORS.WARNING;
      case 'CONFIRMED': return '#3B82F6'; // Blue
      case 'PROCESSING': return '#A855F7'; // Purple
      case 'DELIVERED': return COLORS.SUCCESS;
      case 'COMPLETED': return COLORS.SUCCESS;
      default: return COLORS.TEXT.SECONDARY;
    }
  };

  const getStatusText = (status) => {
    switch (status?.toUpperCase()) {
      case 'PENDING': return 'Pending';
      case 'CONFIRMED': return 'Confirmed';
      case 'PROCESSING': return 'Processing';
      case 'DELIVERED': return 'Delivered';
      case 'COMPLETED': return 'Completed';
      default: return status || 'Unknown';
    }
  };

  const getContractTypeLabel = (type) => {
    switch (type?.toUpperCase()) {
      case 'FULL': return 'Full Payment';
      case 'DEBT': return 'Debt';
      default: return type || 'Unknown';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Main', { screen: 'Home' })}>
          <ArrowLeft color={COLORS.TEXT.WHITE} size={24} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.title}>Customer Contracts</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('CreateCustomerContract')}>
          <Plus color={COLORS.TEXT.WHITE} size={24} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Search color={COLORS.TEXT.SECONDARY} size={20} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search contracts..."
          placeholderTextColor={COLORS.TEXT.SECONDARY}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity
          style={[styles.filterIconButton, selectedFilter !== 'all' && styles.filterIconButtonActive]}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Filter
            color={selectedFilter !== 'all' ? COLORS.TEXT.WHITE : COLORS.TEXT.SECONDARY}
            size={20}
          />
        </TouchableOpacity>
      </View>

      {/* Tabs for Full Payment and Debt */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'full' && styles.tabActive]}
          onPress={() => setSelectedTab('full')}
        >
          <Text style={[styles.tabText, selectedTab === 'full' && styles.tabTextActive]}>
            Full Payment
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'debt' && styles.tabActive]}
          onPress={() => setSelectedTab('debt')}
        >
          <Text style={[styles.tabText, selectedTab === 'debt' && styles.tabTextActive]}>
            Debt
          </Text>
        </TouchableOpacity>
      </View>

      {showFilters && (
        <>
          {/* Filter Tabs - Status */}
          <View style={styles.filterContainer}>
            <Text style={styles.filterLabel}>Status:</Text>
            {['all', 'pending', 'confirmed', 'processing', 'delivered', 'completed'].map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterTab,
                  selectedFilter === filter && styles.filterTabActive,
                ]}
                onPress={() => setSelectedFilter(filter)}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    selectedFilter === filter && styles.filterTabTextActive,
                  ]}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>


        </>
      )}
    </View>
  );

  const renderContractCard = ({ item }) => (
    <View style={styles.contractCard}>
      <TouchableOpacity
        style={styles.contractCardContent}
        onPress={() => navigation.navigate('CustomerContractDetail', { contractId: item.id })}
        activeOpacity={0.7}
      >
        <View style={styles.contractCardHeader}>
          <View style={styles.contractCardTitleRow}>
            <NotepadText color={COLORS.PRIMARY} size={20} />
            <Text style={styles.contractTitle} numberOfLines={1}>
              {item.title || 'Untitled Contract'}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>

        <View style={styles.contractCardBody}>
          <View style={styles.contractInfoRow}>
            <Text style={styles.contractInfoLabel}>Contract Code:</Text>
            <Text style={styles.contractInfoValue}>{item.contractCode || `#${item.id}`}</Text>
          </View>
          <View style={styles.contractInfoRow}>
            <Text style={styles.contractInfoLabel}>Type:</Text>
            <Text style={styles.contractInfoValue}>{getContractTypeLabel(item.contractPaidType)}</Text>
          </View>
          <View style={styles.contractInfoRow}>
            <Text style={styles.contractInfoLabel}>Final Price:</Text>
            <Text style={[styles.contractInfoValue, styles.priceText]}>
              {formatPrice(item.finalPrice || 0)}
            </Text>
          </View>
          {item.signDate && (
            <View style={styles.contractInfoRow}>
              <Text style={styles.contractInfoLabel}>Sign Date:</Text>
              <Text style={styles.contractInfoValue}>{formatDate(item.signDate)}</Text>
            </View>
          )}
          {item.deliveryDate && (
            <View style={styles.contractInfoRow}>
              <Text style={styles.contractInfoLabel}>Delivery Date:</Text>
              <Text style={styles.contractInfoValue}>{formatDate(item.deliveryDate)}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      <View style={styles.contractCardFooter}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.navigate('EditCustomerContract', { contractId: item.id })}
        >
          <Pencil color={COLORS.PRIMARY} size={16} />
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteContract(item.id)}
        >
          <Trash2 color={COLORS.ERROR} size={16} />
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading && contracts.length === 0) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.loadingText}>Loading contracts...</Text>
        </View>
        <CustomAlert visible={alertConfig.visible} title={alertConfig.title} message={alertConfig.message} type={alertConfig.type} onClose={hideAlert} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      <FlatList
        data={filteredContracts}
        renderItem={renderContractCard}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.PRIMARY} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <NotepadText color={COLORS.TEXT.SECONDARY} size={64} />
            <Text style={styles.emptyText}>No contracts found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery.trim() || selectedFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first customer contract'}
            </Text>
          </View>
        }
      />
      <CustomAlert visible={alertConfig.visible} title={alertConfig.title} message={alertConfig.message} type={alertConfig.type} onClose={hideAlert} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
  },
  header: {
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
    paddingTop: SIZES.PADDING.XXXLARGE,
    paddingHorizontal: SIZES.PADDING.LARGE,
    paddingBottom: SIZES.PADDING.MEDIUM,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: SIZES.RADIUS.ROUND,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: SIZES.FONT.HEADER,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: SIZES.RADIUS.ROUND,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.BACKGROUND.SECONDARY,
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: 4,
    marginBottom: SIZES.PADDING.MEDIUM,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: SIZES.PADDING.SMALL,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    borderRadius: SIZES.RADIUS.SMALL,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  tabActive: {
    backgroundColor: COLORS.PRIMARY,
  },
  tabText: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: '500',
    color: COLORS.TEXT.SECONDARY,
  },
  tabTextActive: {
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.BACKGROUND.SECONDARY,
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    marginBottom: SIZES.PADDING.SMALL,
  },
  searchInput: {
    flex: 1,
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
    marginLeft: SIZES.PADDING.SMALL,
    marginRight: SIZES.PADDING.SMALL,
  },
  filterIconButton: {
    width: 36,
    height: 36,
    borderRadius: SIZES.RADIUS.MEDIUM,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterIconButtonActive: {
    backgroundColor: COLORS.PRIMARY,
  },
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: SIZES.PADDING.SMALL,
    gap: SIZES.PADDING.SMALL,
  },
  filterLabel: {
    fontSize: SIZES.FONT.SMALL,
    fontWeight: '600',
    color: COLORS.TEXT.WHITE,
    marginRight: SIZES.PADDING.SMALL,
  },
  filterTab: {
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    borderRadius: SIZES.RADIUS.MEDIUM,
    backgroundColor: COLORS.BACKGROUND.SECONDARY,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterTabActive: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  filterTabText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
  },
  listContainer: {
    padding: SIZES.PADDING.LARGE,
    paddingTop: SIZES.PADDING.MEDIUM,
  },
  contractCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.LARGE,
    padding: SIZES.PADDING.LARGE,
    marginBottom: SIZES.PADDING.MEDIUM,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contractCardContent: {
    flex: 1,
  },
  contractCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  contractCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: SIZES.PADDING.SMALL,
  },
  contractTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginLeft: SIZES.PADDING.SMALL,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.XSMALL,
    borderRadius: SIZES.RADIUS.MEDIUM,
  },
  statusText: {
    fontSize: SIZES.FONT.SMALL,
    fontWeight: '600',
    color: COLORS.TEXT.WHITE,
  },
  contractCardBody: {
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  contractInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.PADDING.SMALL,
  },
  contractInfoLabel: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    fontWeight: '500',
  },
  contractInfoValue: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '600',
  },
  priceText: {
    color: COLORS.PRIMARY,
    fontSize: SIZES.FONT.MEDIUM,
  },
  contractCardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SIZES.PADDING.MEDIUM,
    paddingTop: SIZES.PADDING.MEDIUM,
    borderTopWidth: 1,
    borderTopColor: COLORS.BACKGROUND.SECONDARY,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    borderRadius: SIZES.RADIUS.MEDIUM,
    backgroundColor: COLORS.PRIMARY + '20',
    gap: SIZES.PADDING.XSMALL,
  },
  editButtonText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    borderRadius: SIZES.RADIUS.MEDIUM,
    backgroundColor: COLORS.ERROR + '20',
    gap: SIZES.PADDING.XSMALL,
  },
  deleteButtonText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.ERROR,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SIZES.PADDING.XXXLARGE * 2,
  },
  emptyText: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: '600',
    color: COLORS.TEXT.SECONDARY,
    marginTop: SIZES.PADDING.LARGE,
  },
  emptySubtext: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
    marginTop: SIZES.PADDING.SMALL,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SIZES.PADDING.MEDIUM,
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
  },
});

export default CustomerContractManagementScreen;
