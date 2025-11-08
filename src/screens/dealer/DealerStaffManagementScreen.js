import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SIZES } from '../../constants';
import { UserPlus, Users, Search, Edit, Trash2, ArrowLeft, CheckCircle, XCircle } from 'lucide-react-native';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import { useAuth } from '../../contexts/AuthContext';
import staffService from '../../services/staffService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DealerStaffManagementScreen = ({ navigation }) => {
  const {
    alertConfig,
    hideAlert,
    showAlert,
    showSuccess,
    showError,
  } = useCustomAlert();
  const { user } = useAuth();
  const [staffList, setStaffList] = useState([]);
  const [filteredStaff, setFilteredStaff] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [agencyId, setAgencyId] = useState(null);
  const [dealerStaffRole, setDealerStaffRole] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    filterStaff();
  }, [searchQuery, staffList]);

  useFocusEffect(
    useCallback(() => {
      if (agencyId) {
        loadStaffList(agencyId);
      }
    }, [agencyId])
  );

  const loadInitialData = async () => {
    try {
      // Get agencyId from AsyncStorage or user profile
      const storedAgencyId = await AsyncStorage.getItem('agencyId');
      const userAgencyId = user?.agencyId;
      const managerAgencyId = storedAgencyId || userAgencyId;
      
      console.log('Loading initial data:');
      console.log('- Stored agencyId:', storedAgencyId);
      console.log('- User agencyId:', userAgencyId);
      console.log('- Manager agencyId:', managerAgencyId);
      console.log('- User object:', user);
      
      if (!managerAgencyId) {
        console.error('No agencyId found for Dealer Manager');
        showError('Error', 'Agency information not found. Please sign in again.');
        return;
      }

      setAgencyId(managerAgencyId);

      // Load Dealer Staff role
      const roleResult = await staffService.getDealerStaffRole();
      if (roleResult?.success) {
        console.log('Dealer Staff Role:', roleResult.data);
        setDealerStaffRole(roleResult.data);
      }

      // Load staff list
      await loadStaffList(managerAgencyId);
    } catch (error) {
      console.error('Error loading initial data:', error);
      showError('Error', 'Unable to load data');
    }
  };

  const loadStaffList = async (currentAgencyId) => {
    try {
      setIsLoading(true);
      console.log('Loading staff list for agencyId:', currentAgencyId);
      
      const result = await staffService.getDealerStaffList(currentAgencyId, { page: 1, limit: 1000 });
      
      if (result?.success) {
        console.log('Staff list loaded:', result.data);
        setStaffList(result.data || []);
      } else {
        console.error('Failed to load staff:', result?.error);
        showError('Error', result?.error || 'Unable to load staff list');
        setStaffList([]);
      }
    } catch (error) {
      console.error('Error loading staff list:', error);
      showError('Error', 'Unable to load staff list');
      setStaffList([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filterStaff = () => {
    let filtered = staffList;

    // Only apply search filter locally
    if (searchQuery) {
      filtered = filtered.filter(staff =>
        (staff.fullname || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (staff.username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (staff.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (staff.phone || '').includes(searchQuery) ||
        (staff.address || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredStaff(filtered);
  };

  const getResolvedRoleId = () => dealerStaffRole?.id ?? dealerStaffRole?.data?.id;

  const handleNavigateToCreate = () => {
    if (!agencyId) {
      showError('Error', 'Agency information not found');
      return;
    }

    const roleId = getResolvedRoleId();

    if (!roleId) {
      showError('Error', 'Dealer staff role information not found');
      return;
    }

    navigation.navigate('CreateDealerStaff', {
      agencyId: Number(agencyId),
      roleId: Number(roleId),
    });
  };

  const handleNavigateToEdit = (staff) => {
    if (!agencyId) {
      showError('Error', 'Agency information not found');
      return;
    }

    navigation.navigate('EditDealerStaff', {
      staff,
      agencyId: Number(agencyId),
    });
  };

  const handleDeleteStaff = (staff) => {
    showAlert({
      title: 'Delete Staff',
      message: `Are you sure you want to delete staff ${staff.fullname}?`,
      type: 'error',
      showCancel: true,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          setIsLoading(true);
          const result = await staffService.deleteDealerStaff(staff.id);

          if (result.success) {
            showSuccess('Success', result.message || 'Staff deleted successfully');
            await loadStaffList(agencyId); // Reload staff list
          } else {
            showError('Error', result.error || 'Unable to delete staff');
          }
        } catch (error) {
          console.error('Error deleting staff:', error);
          showError('Error', error.message || 'Unable to delete staff');
        } finally {
          setIsLoading(false);
        }
      },
    });
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadStaffList(agencyId).finally(() => setRefreshing(false));
  };

  const getStatusColor = (isActive) => {
    return isActive ? COLORS.SUCCESS : COLORS.ERROR;
  };

  const renderStaffItem = ({ item }) => {
    return (
      <View style={styles.staffCard}>
        <View style={styles.cardHeader}>
          <View style={styles.staffInfo}>
            <Text style={styles.staffName}>{item.fullname}</Text>
            {item.username ? (
              <Text style={styles.staffUsername}>@{item.username}</Text>
            ) : null}
          </View>
          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.isActive) }]}>
              {item.isActive ? (
                <CheckCircle size={14} color={COLORS.TEXT.WHITE} />
              ) : (
                <XCircle size={14} color={COLORS.TEXT.WHITE} />
              )}
              <Text style={styles.statusText}>
                {item.isActive ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.contactInfo}>
            <Text style={styles.contactLabel}>Email</Text>
            <Text style={styles.contactValue}>{item.email || '—'}</Text>
          </View>
          <View style={styles.contactInfo}>
            <Text style={styles.contactLabel}>Phone Number</Text>
            <Text style={styles.contactValue}>{item.phone || '—'}</Text>
          </View>
          <View style={styles.contactInfo}>
            <Text style={styles.contactLabel}>Address</Text>
            <Text style={styles.contactValue}>{item.address || '—'}</Text>
          </View>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleNavigateToEdit(item)}
          >
            <Edit size={16} color={COLORS.TEXT.WHITE} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteStaff(item)}
          >
            <Trash2 size={16} color={COLORS.TEXT.WHITE} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={18} color={COLORS.TEXT.WHITE} />
        </TouchableOpacity>
        <View style={styles.headerTitles}>
          <Text style={styles.headerTitle}>Dealer Staff Management</Text>
          <Text style={styles.headerSubtitle}>Manage dealer staff</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleNavigateToCreate}
        >
          <UserPlus size={18} color={COLORS.TEXT.WHITE} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Search size={18} color={COLORS.TEXT.SECONDARY} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search staff, username, email..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={COLORS.TEXT.SECONDARY}
        />
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{filteredStaff.length}</Text>
          <Text style={styles.statLabel}>Total staff</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: COLORS.SUCCESS }]}>
            {filteredStaff.filter(s => s.isActive).length}
          </Text>
          <Text style={styles.statLabel}>Active staff</Text>
        </View>
      </View>

      {/* Content */}
      <FlatList
        data={filteredStaff}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        renderItem={renderStaffItem}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Users size={48} color={COLORS.TEXT.SECONDARY} />
            <Text style={styles.emptyText}>No staff members found</Text>
          </View>
        }
      />
      <CustomAlert {...alertConfig} onClose={hideAlert} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingTop: SIZES.PADDING.LARGE,
    paddingBottom: SIZES.PADDING.MEDIUM,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: SIZES.RADIUS.ROUND,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitles: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  headerTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: SIZES.FONT.XSMALL,
    color: COLORS.TEXT.SECONDARY,
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

  // Search
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

  // Stats
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    marginBottom: SIZES.PADDING.MEDIUM,
    gap: 4,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.SMALL,
    alignItems: 'center',
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

  // List
  listContainer: {
    padding: SIZES.PADDING.MEDIUM,
  },
  staffCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.LARGE,
    padding: SIZES.PADDING.MEDIUM,
    marginBottom: SIZES.PADDING.MEDIUM,
    gap: SIZES.PADDING.MEDIUM,
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
  },
  staffInfo: {
    flex: 1,
  },
  staffName: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SIZES.PADDING.XSMALL,
  },
  staffUsername: {
    fontSize: SIZES.FONT.XSMALL,
    color: COLORS.TEXT.SECONDARY,
    fontStyle: 'italic',
  },
  statusContainer: {
    marginLeft: SIZES.PADDING.SMALL,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SIZES.PADDING.SMALL,
    paddingVertical: 4,
    borderRadius: SIZES.RADIUS.SMALL,
  },
  statusText: {
    fontSize: SIZES.FONT.XSMALL,
    fontWeight: '600',
    color: COLORS.TEXT.WHITE,
  },
  cardContent: {
    gap: SIZES.PADDING.XSMALL,
  },
  contactInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contactLabel: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
  },
  contactValue: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
    marginLeft: SIZES.PADDING.SMALL,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SIZES.PADDING.SMALL,
  },
  actionButton: {
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
  emptyText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
    marginTop: SIZES.PADDING.MEDIUM,
  },
});

export default DealerStaffManagementScreen;

