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
import creditLineService from '../../services/creditLineService';
import agencyService from '../../services/agencyService';
import CustomAlert from '../../components/common/CustomAlert';
import { CreditCard, Pencil, Search, Trash2, ArrowLeft } from 'lucide-react-native';

const EVMStaffCreditLineManagementScreen = ({ navigation }) => {
  const [creditLines, setCreditLines] = useState([]);
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'blocked'
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    message: '',
    type: 'info',
    showCancel: false,
    confirmText: 'OK',
    cancelText: 'Cancel',
    onConfirm: null,
    onCancel: null,
  });

  useEffect(() => {
    loadAgencies();
    loadCreditLines();

    // Reload credit lines when screen comes into focus (after editing)
    const unsubscribe = navigation.addListener('focus', () => {
      loadAgencies();
      loadCreditLines();
    });

    return unsubscribe;
  }, [page, navigation]);

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

  const getAgencyName = (agencyId) => {
    if (!agencyId) return 'N/A';
    const agency = agencies.find(a => a.id === agencyId || a.id?.toString() === agencyId?.toString());
    return agency?.name || 'Unknown Agency';
  };

  const loadCreditLines = async () => {
    try {
      setLoading(true);
      const response = await creditLineService.getAllCreditLines(page, 10);
      
      if (response.success) {
        // Sort credit lines by ID descending (newest first)
        const sortedData = [...response.data].sort((a, b) => (b.id || 0) - (a.id || 0));
        
        // Fetch detail for each credit line to get agency information
        const creditLinesWithAgency = await Promise.all(
          sortedData.map(async (creditLine) => {
            // If agency info already exists, use it
            if (creditLine.agency?.name) {
              return creditLine;
            }
            
            // Otherwise, fetch detail to get agency info
            try {
              const detailResponse = await creditLineService.getCreditLineDetail(creditLine.id);
              if (detailResponse.success && detailResponse.data) {
                return {
                  ...creditLine,
                  agency: detailResponse.data.agency || creditLine.agency
                };
              }
            } catch (error) {
              console.warn(`⚠️ Failed to fetch detail for credit line ${creditLine.id}:`, error);
            }
            
            return creditLine;
          })
        );
        
        setCreditLines(creditLinesWithAgency);
        if (response.pagination) {
          setTotalPages(Math.ceil(response.pagination.totalItems / response.pagination.limit));
        }
      } else {
        const errorMessage = typeof response.error === 'string' 
          ? response.error 
          : (response.error?.message || JSON.stringify(response.error) || 'Failed to load credit lines');
        setAlertConfig(prev => ({
          ...prev,
          title: 'Error',
          message: errorMessage,
          type: 'error',
          showCancel: false,
          confirmText: 'OK',
          cancelText: 'Cancel',
          onConfirm: null,
          onCancel: null,
        }));
        setShowAlert(true);
      }
    } catch (error) {
      console.error('Error loading credit lines:', error);
      setAlertConfig(prev => ({
        ...prev,
        title: 'Error',
        message: 'An unexpected error occurred',
        type: 'error',
        showCancel: false,
        confirmText: 'OK',
        cancelText: 'Cancel',
        onConfirm: null,
        onCancel: null,
      }));
      setShowAlert(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadCreditLines();
  };

  const handleEdit = (creditLine, event) => {
    event?.stopPropagation();
    navigation.navigate('EVMStaffCreditLineEdit', { creditLine });
  };

  const handleViewDetail = (creditLine) => {
    navigation.navigate('EVMStaffCreditLineDetail', { creditLineId: creditLine.id });
  };

  const handleDelete = (creditLineId, agencyName, event) => {
    event?.stopPropagation();
    setAlertConfig({
      title: 'Delete Credit Line',
      message: `Are you sure you want to delete credit line for "${agencyName}"?`,
      type: 'warning',
      showCancel: true,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          const response = await creditLineService.deleteCreditLine(creditLineId);
          if (response.success) {
            await loadCreditLines();
            setTimeout(() => {
              setAlertConfig(prev => ({
                ...prev,
                title: 'Success',
                message: 'Credit line deleted successfully',
                type: 'success',
                showCancel: false,
                confirmText: 'OK',
                cancelText: 'Cancel',
                onConfirm: null,
                onCancel: null,
              }));
              setShowAlert(true);
            }, 0);
          } else {
            const errorMessage = typeof response.error === 'string' 
              ? response.error 
              : (response.error?.message || JSON.stringify(response.error) || 'Failed to delete credit line');
            setTimeout(() => {
              setAlertConfig(prev => ({
                ...prev,
                title: 'Error',
                message: errorMessage,
                type: 'error',
                showCancel: false,
                confirmText: 'OK',
                cancelText: 'Cancel',
                onConfirm: null,
                onCancel: null,
              }));
              setShowAlert(true);
            }, 0);
          }
        } catch (error) {
          console.error('Error deleting credit line:', error);
          setTimeout(() => {
            setAlertConfig(prev => ({
              ...prev,
              title: 'Error',
              message: 'An unexpected error occurred',
              type: 'error',
              showCancel: false,
              confirmText: 'OK',
              cancelText: 'Cancel',
              onConfirm: null,
              onCancel: null,
            }));
            setShowAlert(true);
          }, 0);
        }
      },
      onCancel: null,
    });
    setShowAlert(true);
  };

  const filteredCreditLines = creditLines.filter(creditLine => {
    // Filter by search query
    const agencyName = creditLine.agency?.name || getAgencyName(creditLine.agencyId);
    const matchesSearch = agencyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      creditLine.id?.toString().includes(searchQuery);
    
    // Filter by tab status
    const matchesTab = activeTab === 'active' 
      ? !creditLine.isBlocked  // Active tab: isBlocked = false
      : creditLine.isBlocked;   // Blocked tab: isBlocked = true
    
    return matchesSearch && matchesTab;
  });

  // Calculate counts for each tab
  const activeCount = creditLines.filter(cl => !cl.isBlocked).length;
  const blockedCount = creditLines.filter(cl => cl.isBlocked).length;
  const totalCreditLines = creditLines.length;

  return (
    <SafeAreaView style={styles.container}>
      <CustomAlert
        visible={showAlert}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        showCancel={alertConfig.showCancel}
        confirmText={alertConfig.confirmText}
        cancelText={alertConfig.cancelText}
        onConfirm={alertConfig.onConfirm}
        onCancel={alertConfig.onCancel}
        onClose={() => setShowAlert(false)}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={18} color={COLORS.TEXT.WHITE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Credit Line Management</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={20} color={COLORS.TEXT.SECONDARY} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by agency name or ID..."
          placeholderTextColor={COLORS.TEXT.SECONDARY}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalCreditLines}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: COLORS.SUCCESS }]}>{activeCount}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: COLORS.ERROR }]}>{blockedCount}</Text>
          <Text style={styles.statLabel}>Blocked</Text>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'active' && styles.activeTabButton
          ]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'active' && styles.activeTabText
          ]}>
            Active ({activeCount})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'blocked' && styles.activeTabButton
          ]}
          onPress={() => setActiveTab('blocked')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'blocked' && styles.activeTabText
          ]}>
            Blocked ({blockedCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Credit Lines List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#009DFF" />
        </View>
      ) : (
        <ScrollView
          style={styles.creditLinesList}
          contentContainerStyle={styles.creditLinesContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {filteredCreditLines.length === 0 ? (
            <View style={styles.emptyContainer}>
              <CreditCard size={60} color={COLORS.TEXT.SECONDARY} />
              <Text style={styles.emptyText}>
                {activeTab === 'active' 
                  ? 'No active credit lines found' 
                  : 'No blocked credit lines found'}
              </Text>
            </View>
          ) : (
            filteredCreditLines.map((creditLine) => (
              <TouchableOpacity 
                key={creditLine.id} 
                style={styles.creditLineCard}
                onPress={() => handleViewDetail(creditLine)}
                activeOpacity={0.7}
              >
                <View style={styles.creditLineHeader}>
                  <View style={styles.creditLineHeaderLeft}>
                    <Text style={styles.agencyName}>
                      {creditLine.agency?.name || getAgencyName(creditLine.agencyId)}
                    </Text>
                    <View style={[
                      styles.statusBadge, 
                      { backgroundColor: creditLine.isBlocked ? COLORS.ERROR : COLORS.SUCCESS }
                    ]}>
                      <Text style={styles.statusText}>
                        {creditLine.isBlocked ? 'Blocked' : 'Active'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[styles.iconButton, styles.editButton]}
                      onPress={(e) => handleEdit(creditLine, e)}
                    >
                      <Pencil size={16} color={COLORS.TEXT.WHITE} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.iconButton, styles.deleteButton]}
                      onPress={(e) => handleDelete(creditLine.id, creditLine.agency?.name || getAgencyName(creditLine.agencyId), e)}
                    >
                      <Trash2 size={16} color={COLORS.TEXT.WHITE} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.creditLineDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Credit Limit:</Text>
                    <Text style={styles.detailValue}>
                      {creditLineService.formatCreditLimit(creditLine.creditLimit)}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Current Debt:</Text>
                    <Text style={styles.detailValue}>
                      {creditLineService.formatCreditLimit(creditLine.currentDebt || 0)}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Warning Threshold:</Text>
                    <Text style={styles.detailValue}>{creditLine.warningThreshold}%</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Overdue Threshold:</Text>
                    <Text style={styles.detailValue}>{creditLine.overDueThreshHoldDays} days</Text>
                  </View>
                  {creditLine.agency?.location && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Location:</Text>
                      <Text style={styles.detailValue}>{creditLine.agency.location}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))
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
  headerTitle: {
    fontSize: SIZES.FONT.HEADER,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.SURFACE,
    margin: SIZES.PADDING.MEDIUM,
    borderRadius: SIZES.RADIUS.LARGE,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    gap: SIZES.PADDING.SMALL,
  },
  searchIcon: {
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
    color: COLORS.TEXT.WHITE,
    marginBottom: 4,
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
  creditLinesList: {
    flex: 1,
  },
  creditLinesContent: {
    padding: SIZES.PADDING.MEDIUM,
  },
  creditLineCard: {
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
  creditLineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SIZES.PADDING.SMALL,
  },
  creditLineHeaderLeft: {
    flex: 1,
  },
  agencyName: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: '#009DFF',
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
    gap: SIZES.PADDING.XSMALL,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: SIZES.RADIUS.SMALL,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  editButton: {
  },
  deleteButton: {
  },
  creditLineDetails: {
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
  emptyText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: SIZES.PADDING.LARGE,
    marginBottom: SIZES.PADDING.MEDIUM,
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: SIZES.PADDING.SMALL,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    borderRadius: SIZES.RADIUS.SMALL,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTabButton: {
    backgroundColor: "#009DFF",
  },
  tabText: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: '600',
    color: COLORS.TEXT.SECONDARY,
  },
  activeTabText: {
    color: COLORS.TEXT.WHITE,
  },
});

export default EVMStaffCreditLineManagementScreen;

