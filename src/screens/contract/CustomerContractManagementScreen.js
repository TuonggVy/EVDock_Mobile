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
  SafeAreaView,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES, USER_ROLES } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import customerContractService from '../../services/customerContractService';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import { ArrowLeft, NotepadText, Pencil, Plus, Search, Trash2, Filter, FileText } from 'lucide-react-native';
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
          // Get primary date source for each contract:
          // Prefer explicit creation date fields, then signDate. Avoid using fallbacks like 0 that create 1970-01-01.
          const rawDateA = a.createAt || a.createdAt || a.created_at || a.signDate;
          const rawDateB = b.createAt || b.createdAt || b.created_at || b.signDate;

          const dateA = rawDateA ? new Date(rawDateA) : null;
          const dateB = rawDateB ? new Date(rawDateB) : null;

          const timeA = dateA && !isNaN(dateA.getTime()) ? dateA.getTime() : 0;
          const timeB = dateB && !isNaN(dateB.getTime()) ? dateB.getTime() : 0;
          
          // If dates are valid and different, sort by date
          if (timeA > 0 && timeB > 0 && timeA !== timeB) {
            return timeB - timeA; // Descending order (newest first)
          }
          
          // If dates are same or invalid, sort by id (larger id = newer contract)
          const idA = parseInt(a.id, 10) || 0;
          const idB = parseInt(b.id, 10) || 0;
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

  // Calculate statistics
  const totalContracts = contracts.length;
  const fullPaymentContracts = contracts.filter(contract => 
    contract.contractPaidType?.toUpperCase() === 'FULL' || 
    contract.contractType?.toUpperCase() === 'FULL'
  ).length;
  const debtContracts = contracts.filter(contract => 
    contract.contractPaidType?.toUpperCase() === 'DEBT' || 
    contract.contractType?.toUpperCase() === 'DEBT'
  ).length;

  const isDealerManager = user?.role === USER_ROLES.DEALER_MANAGER;

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Main', { screen: 'Home' })}>
          <ArrowLeft color={COLORS.TEXT.WHITE} size={18} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Customer Contracts</Text>
        {!isDealerManager && (
          <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('CreateCustomerContract')}>
            <Plus color={COLORS.TEXT.WHITE} size={18} />
          </TouchableOpacity>
        )}
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={18} color={COLORS.TEXT.SECONDARY} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search contracts, code, title..."
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
            size={18}
          />
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalContracts}</Text>
          <Text style={styles.statLabel}>Total Contracts</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#009DFF' }]}>{fullPaymentContracts}</Text>
          <Text style={styles.statLabel}>Full Payment</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#009DFF' }]}>{debtContracts}</Text>
          <Text style={styles.statLabel}>Debt</Text>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            selectedTab === 'full' && styles.activeTabButton
          ]}
          onPress={() => setSelectedTab('full')}
        >
          <Text style={[
            styles.tabText,
            selectedTab === 'full' && styles.activeTabText
          ]}>
            Full Payment ({fullPaymentContracts})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            selectedTab === 'debt' && styles.activeTabButton
          ]}
          onPress={() => setSelectedTab('debt')}
        >
          <Text style={[
            styles.tabText,
            selectedTab === 'debt' && styles.activeTabText
          ]}>
            Debt ({debtContracts})
          </Text>
        </TouchableOpacity>
      </View>

      {showFilters && (
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
        <View style={styles.cardHeader}>
          <View style={styles.contractInfo}>
            <Text style={styles.contractCode}>{item.contractCode || `#${item.id}`}</Text>
            <Text style={styles.contractName} numberOfLines={1}>
              {item.title || 'Untitled Contract'}
            </Text>
            <Text style={styles.contractType}>{getContractTypeLabel(item.contractPaidType)}</Text>
          </View>
          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
              <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.contactInfo}>
            <Text style={styles.contactLabel}>Final Price:</Text>
            <Text style={[styles.contactValue, styles.priceText]}>
              {formatPrice(item.finalPrice || 0)}
            </Text>
          </View>
          {item.signDate && (
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Sign Date:</Text>
              <Text style={styles.contactDetail}>{formatDate(item.signDate)}</Text>
            </View>
          )}
          {item.deliveryDate && (
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Delivery Date:</Text>
              <Text style={styles.contactDetail}>{formatDate(item.deliveryDate)}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {!isDealerManager && (
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate('EditCustomerContract', { contractId: item.id })}
          >
            <Pencil size={16} color={COLORS.TEXT.WHITE} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteContract(item.id)}
          >
            <Trash2 size={16} color={COLORS.TEXT.WHITE} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (loading && contracts.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#009DFF" />
          <Text style={styles.loadingText}>Loading contracts...</Text>
        </View>
        <CustomAlert visible={alertConfig.visible} title={alertConfig.title} message={alertConfig.message} type={alertConfig.type} onClose={hideAlert} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      <FlatList
        data={filteredContracts}
        renderItem={renderContractCard}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        contentContainerStyle={styles.contractsContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#009DFF" />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <FileText size={64} color={COLORS.TEXT.SECONDARY} />
            <Text style={styles.emptyTitle}>
              {searchQuery.trim() || selectedFilter !== 'all'
                ? 'No contracts found'
                : 'No contracts yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery.trim() || selectedFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first customer contract'}
            </Text>
          </View>
        }
      />
      <CustomAlert visible={alertConfig.visible} title={alertConfig.title} message={alertConfig.message} type={alertConfig.type} onClose={hideAlert} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
    paddingTop: 30,
  },
  
  // Header
  header: {
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingTop: Platform.OS === 'ios' ? 20 : 0,
    paddingBottom: SIZES.PADDING.MEDIUM,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
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
    backgroundColor: "#009DFF",
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
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
  filterIconButton: {
    width: 36,
    height: 36,
    borderRadius: SIZES.RADIUS.MEDIUM,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterIconButtonActive: {
    backgroundColor: "#009DFF",
  },

  // Stats
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
    color: '#009DFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: SIZES.FONT.XSMALL,
    color: COLORS.TEXT.SECONDARY,
    textAlign: 'center',
  },

  // Tab Navigation
  tabContainer: {
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

  // Filter Container
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    marginBottom: SIZES.PADDING.SMALL,
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
    backgroundColor: "#009DFF",
    borderColor: "#009DFF",
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

  // Contracts List
  contractsContent: {
    padding: SIZES.PADDING.MEDIUM,
  },
  contractCard: {
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
  contractCardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SIZES.PADDING.SMALL,
  },
  contractInfo: {
    flex: 1,
  },
  contractCode: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: 4,
  },
  contractName: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: "#009DFF",
    marginBottom: 4,
  },
  contractType: {
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
  },
  statusText: {
    fontSize: SIZES.FONT.XSMALL,
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
  },
  cardContent: {
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  contactInfo: {
    marginBottom: SIZES.PADDING.SMALL,
  },
  contactLabel: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: 4,
  },
  contactValue: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '600',
    marginBottom: 2,
  },
  contactDetail: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
  },
  priceText: {
    color: "#009DFF",
    fontSize: SIZES.FONT.MEDIUM,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SIZES.PADDING.SMALL,
  },
  editButton: {
    backgroundColor: "#000000",
    borderRadius: SIZES.RADIUS.SMALL,
    padding: SIZES.PADDING.SMALL,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 36,
    minHeight: 36,
  },
  deleteButton: {
    backgroundColor: "#000000",
    borderRadius: SIZES.RADIUS.SMALL,
    padding: SIZES.PADDING.SMALL,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 36,
    minHeight: 36,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
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
