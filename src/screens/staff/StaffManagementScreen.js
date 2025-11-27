import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES } from '../../constants';
import { Users, Search, Trash2, ArrowLeft, Plus, CheckCircle, XCircle, Building2, AlertTriangle, Pencil } from 'lucide-react-native';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import staffService from '../../services/staffService';
import agencyService from '../../services/agencyService';

const StaffManagementScreen = ({ navigation }) => {
  const { alertConfig, hideAlert, showSuccess, showError, showConfirm, showInfo } = useCustomAlert();
  const [staffList, setStaffList] = useState([]);
  const [filteredStaff, setFilteredStaff] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('Active'); // 'Active' or 'Inactive'
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningStaff, setAssigningStaff] = useState(null);
  const [agencies, setAgencies] = useState([]);
  const [editingStaff, setEditingStaff] = useState(null);
  
  // Form states for creating new staff
  const [newStaff, setNewStaff] = useState({
    username: '',
    password: '',
    fullname: '',
    email: '',
    phone: '',
    address: '',
    role: [5], // Array of role IDs: 3=Dealer Manager (có thể assign), 5=Evm Staff
  });

  // Form states for editing staff
  const [editStaffForm, setEditStaffForm] = useState({
    username: '',
    fullname: '',
    email: '',
    phone: '',
    address: '',
  });

  // Selected agency for assignment
  const [selectedAgencyId, setSelectedAgencyId] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageLimit = 1000; // Load all staff at once

  useEffect(() => {
    loadStaffList(currentPage);
    loadAgencies();
  }, []);

  useEffect(() => {
    filterStaff();
  }, [searchQuery, staffList, activeTab]);

  const loadAgencies = async () => {
    try {
      const result = await agencyService.getAgencies({
        limit: 100,
        page: 1,
      });
      console.log('Loaded agencies:', result?.data?.length || 0, 'agencies');
      console.log('Agencies data:', result?.data);
      setAgencies(result?.data || []);
    } catch (error) {
      console.error('Error loading agencies:', error);
      // Set empty array as fallback
      setAgencies([]);
    }
  };

  const loadStaffList = async (page = 1) => {
    try {
      setIsLoading(true);
      
      // Call API to get staff list - load all staff at once
      const result = await staffService.getStaffList({}, page, pageLimit);
      
      if (result.success) {
        setStaffList(result.data || []);
        setCurrentPage(result.page || page);
      } else {
        showError('Lỗi', result.error || 'Không thể tải danh sách nhân viên');
        // Fallback to empty array
        setStaffList([]);
      }
    } catch (error) {
      console.error('Error loading staff list:', error);
      showError('Lỗi', 'Không thể tải danh sách nhân viên');
      // Fallback to empty array
      setStaffList([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filterStaff = () => {
    // Hide soft-deleted by default
    let filtered = staffList.filter(s => !s.isDeleted);

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(staff =>
        (staff.name || staff.fullname || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (staff.username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (staff.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (staff.phone || '').includes(searchQuery) ||
        (staff.address || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply tab filter - only use isActive field from API (same as Swagger)
    const matchesTab = activeTab === 'Active' 
      ? filtered.filter(s => s.isActive === true)
      : filtered.filter(s => s.isActive === false);

    setFilteredStaff(matchesTab);
  };

  const handleCreateStaff = async () => {
    try {
      // Validation
      if (!newStaff.username || !newStaff.password || !newStaff.fullname || !newStaff.email || !newStaff.phone) {
        showError('Lỗi', 'Vui lòng điền đầy đủ thông tin bắt buộc (username, password, fullname, email, phone)');
        return;
      }

      // Call API to create staff
      const result = await staffService.createStaff(newStaff);
      
      if (result.success) {
        setShowCreateModal(false);
        setNewStaff({
          username: '',
          password: '',
          fullname: '',
          email: '',
          phone: '',
          address: '',
          role: [5],
        });
        showSuccess('Thành công', result.message || 'Tạo tài khoản nhân viên thành công');
        loadStaffList(); // Reload the staff list
      } else {
        showError('Lỗi', result.error || 'Không thể tạo tài khoản nhân viên');
      }
    } catch (error) {
      console.error('Error creating staff:', error);
      showError('Lỗi', 'Không thể tạo tài khoản nhân viên');
    }
  };

  const handleEditStaff = (staff) => {
    setEditingStaff(staff);
    setEditStaffForm({
      username: staff.username || '',
      fullname: staff.fullname || staff.name || '',
      email: staff.email || '',
      phone: staff.phone || '',
      address: staff.address || '',
    });
    setShowEditModal(true);
  };

  const handleUpdateStaff = async () => {
    try {
      if (!editStaffForm.username || !editStaffForm.fullname || !editStaffForm.email || !editStaffForm.phone) {
        showError('Lỗi', 'Vui lòng điền đầy đủ thông tin bắt buộc');
        return;
      }

      const result = await staffService.updateStaff(editingStaff.id, editStaffForm);
      
      if (result.success) {
        setShowEditModal(false);
        setEditingStaff(null);
        showSuccess('Thành công', result.message || 'Cập nhật thông tin nhân viên thành công');
        loadStaffList(); // Reload the staff list
      } else {
        showError('Lỗi', result.error || 'Không thể cập nhật thông tin nhân viên');
      }
    } catch (error) {
      console.error('Error updating staff:', error);
      showError('Lỗi', 'Không thể cập nhật thông tin nhân viên');
    }
  };

  const handleDeleteStaff = (staff) => {
    showConfirm(
      'Xác nhận xóa',
      `Bạn có chắc chắn muốn xóa nhân viên ${staff.fullname || staff.name}?`,
      async () => {
        setStaffList(prev => prev.filter(s => s.id !== staff.id));
        showSuccess('Thành công', 'Đã xóa nhân viên');
      }
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadStaffList(currentPage).finally(() => setRefreshing(false));
  };

  const getRoleDisplayName = (role) => {
    const roleNames = {
      'evm_admin': 'EVM Admin',
      'evm_staff': 'EVM Staff',
      'dealer_manager': 'Dealer Manager',
      'dealer_staff': 'Dealer Staff',
    };
    return roleNames[role] || role;
  };

  const getStatusColor = (isActive) => {
    return isActive ? COLORS.SUCCESS : COLORS.ERROR;
  };

  const getStatusText = (isActive) => {
    return isActive ? 'Active' : 'Inactive';
  };

  const getStatusIcon = (isActive) => {
    return isActive 
      ? <CheckCircle size={14} color={COLORS.TEXT.WHITE} />
      : <XCircle size={14} color={COLORS.TEXT.WHITE} />;
  };

  const isDealerManager = (staff) => {
    return staff.roleNames && Array.isArray(staff.roleNames) && 
           staff.roleNames.some(name => name && name.includes('Dealer Manager'));
  };

  const isEvmStaff = (staff) => {
    return staff.roleNames && Array.isArray(staff.roleNames) && 
           staff.roleNames.some(name => name && (name.includes('Evm Staff') || name.includes('EVM Staff')));
  };

  const handleAssignAgency = (staff) => {
    setAssigningStaff(staff);
    setSelectedAgencyId(null);
    setShowAssignModal(true);
  };

  const confirmAssignAgency = async () => {
    if (!assigningStaff || !selectedAgencyId) {
      showError('Lỗi', 'Vui lòng chọn đại lý');
      return;
    }

    try {
      const result = await staffService.assignStaffToAgency(assigningStaff.id, selectedAgencyId);
      if (result.success) {
        showSuccess('Thành công', result.message || 'Đã gán nhân viên vào đại lý thành công');
        setShowAssignModal(false);
        setAssigningStaff(null);
        setSelectedAgencyId(null);
        loadStaffList(currentPage);
      } else {
        showError('Lỗi', result.error || 'Không thể gán nhân viên vào đại lý');
      }
    } catch (error) {
      console.error('Error assigning staff:', error);
      showError('Lỗi', 'Không thể gán nhân viên vào đại lý');
    }
  };

  const renderStaffItem = ({ item }) => {
    const isDM = isDealerManager(item);
    
    // Find agency by agencyId
    const staffAgency = item.agencyId ? agencies.find(a => a.id === item.agencyId) : null;
    
    return (
      <View style={styles.staffCard}>
        <View style={styles.cardHeader}>
          <View style={styles.staffInfo}>
            <Text style={styles.staffName}>{item.fullname || item.name}</Text>
            {item.username && (
              <Text style={styles.staffUsername}>@{item.username}</Text>
            )}
          </View>
          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.isActive) }]}>
              {getStatusIcon(item.isActive)}
              <Text style={styles.statusText}>{getStatusText(item.isActive)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.contactInfo}>
            <Text style={styles.contactLabel}>Email:</Text>
            <Text style={styles.contactValue}>{item.email}</Text>
          </View>

          <View style={styles.contactInfo}>
            <Text style={styles.contactLabel}>Phone:</Text>
            <Text style={styles.contactDetail}>{item.phone}</Text>
          </View>

          {item.address && (
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Address:</Text>
              <Text style={styles.contactDetail}>{item.address}</Text>
            </View>
          )}

          {staffAgency && (
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Agency:</Text>
              <Text style={styles.contactValue}>
                {staffAgency.name}{staffAgency.location ? ` - ${staffAgency.location}` : ''}
              </Text>
            </View>
          )}

          {item.roleNames && item.roleNames.length > 0 && (
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Role:</Text>
              <Text style={styles.contactDetail}>
                {Array.isArray(item.roleNames) ? item.roleNames.join(', ') : item.roleNames}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.cardActions}>
          {isDM && (
            <TouchableOpacity
              style={styles.assignButton}
              onPress={() => handleAssignAgency(item)}
            >
              <Building2 size={16} color={COLORS.TEXT.WHITE} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => handleEditStaff(item)}
          >
            <Pencil size={16} color={COLORS.TEXT.WHITE} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteStaff(item)}
          >
            <Trash2 size={16} color={COLORS.TEXT.WHITE} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderAssignModal = () => (
    <Modal
      visible={showAssignModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => {
              setShowAssignModal(false);
              setAssigningStaff(null);
              setSelectedAgencyId(null);
            }}
          >
            <Text style={styles.modalCloseText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>
            Assign Agency - {assigningStaff?.fullname || ''}
          </Text>
          <TouchableOpacity
            style={styles.modalSaveButton}
            onPress={confirmAssignAgency}
          >
            <Text style={styles.modalSaveText}>Save</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Select Agency</Text>
            <ScrollView style={styles.agencySelector}>
              {agencies.length > 0 ? agencies.map((agency) => (
                <TouchableOpacity
                  key={agency.id}
                  style={[
                    styles.agencyOption,
                    selectedAgencyId === agency.id && styles.agencyOptionSelected
                  ]}
                  onPress={() => setSelectedAgencyId(agency.id)}
                >
                  <Text style={[
                    styles.agencyOptionText,
                    selectedAgencyId === agency.id && styles.agencyOptionTextSelected
                  ]}>
                    {agency.name} - {agency.location}
                  </Text>
                </TouchableOpacity>
              )) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No agencies available</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  const renderCreateModal = () => (
    <Modal
      visible={showCreateModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setShowCreateModal(false)}
          >
            <Text style={styles.modalCloseText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Add New Staff</Text>
          <TouchableOpacity
            style={styles.modalSaveButton}
            onPress={handleCreateStaff}
          >
            <Text style={styles.modalSaveText}>Save</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Username *</Text>
            <TextInput
              style={styles.textInput}
              value={newStaff.username}
              onChangeText={(text) => setNewStaff(prev => ({ ...prev, username: text }))}
              placeholder="Enter username"
              placeholderTextColor={COLORS.TEXT.SECONDARY}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password *</Text>
            <TextInput
              style={styles.textInput}
              value={newStaff.password}
              onChangeText={(text) => setNewStaff(prev => ({ ...prev, password: text }))}
              placeholder="Enter password"
              placeholderTextColor={COLORS.TEXT.SECONDARY}
              secureTextEntry
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name *</Text>
            <TextInput
              style={styles.textInput}
              value={newStaff.fullname}
              onChangeText={(text) => setNewStaff(prev => ({ ...prev, fullname: text }))}
              placeholder="Enter full name"
              placeholderTextColor={COLORS.TEXT.SECONDARY}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email *</Text>
            <TextInput
              style={styles.textInput}
              value={newStaff.email}
              onChangeText={(text) => setNewStaff(prev => ({ ...prev, email: text }))}
              placeholder="Enter email"
              placeholderTextColor={COLORS.TEXT.SECONDARY}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone *</Text>
            <TextInput
              style={styles.textInput}
              value={newStaff.phone}
              onChangeText={(text) => setNewStaff(prev => ({ ...prev, phone: text }))}
              placeholder="Enter phone number"
              placeholderTextColor={COLORS.TEXT.SECONDARY}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Address</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={newStaff.address}
              onChangeText={(text) => setNewStaff(prev => ({ ...prev, address: text }))}
              placeholder="Enter address"
              placeholderTextColor={COLORS.TEXT.SECONDARY}
              multiline
              numberOfLines={2}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Role *</Text>
            <View style={styles.roleSelector}>
              {[
                { id: [3], label: 'Dealer Manager' },
                { id: [5], label: 'Evm Staff' },
              ].map((role, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.roleOption,
                    JSON.stringify(newStaff.role) === JSON.stringify(role.id) && styles.roleOptionSelected
                  ]}
                  onPress={() => setNewStaff(prev => ({ ...prev, role: role.id }))}
                >
                  <Text style={[
                    styles.roleOptionText,
                    JSON.stringify(newStaff.role) === JSON.stringify(role.id) && styles.roleOptionTextSelected
                  ]}>
                    {role.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  const renderEditModal = () => (
    <Modal
      visible={showEditModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => {
              setShowEditModal(false);
              setEditingStaff(null);
            }}
          >
            <Text style={styles.modalCloseText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Edit Staff</Text>
          <TouchableOpacity
            style={styles.modalSaveButton}
            onPress={handleUpdateStaff}
          >
            <Text style={styles.modalSaveText}>Save</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Username *</Text>
            <TextInput
              style={[styles.textInput, { opacity: 0.6 }]}
              value={editStaffForm.username}
              placeholder="Enter username"
              placeholderTextColor={COLORS.TEXT.SECONDARY}
              autoCapitalize="none"
              editable={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name *</Text>
            <TextInput
              style={styles.textInput}
              value={editStaffForm.fullname}
              onChangeText={(text) => setEditStaffForm(prev => ({ ...prev, fullname: text }))}
              placeholder="Enter full name"
              placeholderTextColor={COLORS.TEXT.SECONDARY}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email *</Text>
            <TextInput
              style={styles.textInput}
              value={editStaffForm.email}
              onChangeText={(text) => setEditStaffForm(prev => ({ ...prev, email: text }))}
              placeholder="Enter email"
              placeholderTextColor={COLORS.TEXT.SECONDARY}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone *</Text>
            <TextInput
              style={styles.textInput}
              value={editStaffForm.phone}
              onChangeText={(text) => setEditStaffForm(prev => ({ ...prev, phone: text }))}
              placeholder="Enter phone number"
              placeholderTextColor={COLORS.TEXT.SECONDARY}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Address</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={editStaffForm.address}
              onChangeText={(text) => setEditStaffForm(prev => ({ ...prev, address: text }))}
              placeholder="Enter address"
              placeholderTextColor={COLORS.TEXT.SECONDARY}
              multiline
              numberOfLines={2}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  // Calculate statistics - only use isActive field from API (same as Swagger)
  const totalStaff = staffList.filter(s => !s.isDeleted).length;
  const activeStaff = staffList.filter(s => !s.isDeleted && s.isActive === true).length;
  const inactiveStaff = staffList.filter(s => !s.isDeleted && s.isActive === false).length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft color={COLORS.TEXT.WHITE} size={18} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Staff Management</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Plus color={COLORS.TEXT.WHITE} size={18} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={18} color={COLORS.TEXT.SECONDARY} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search staff, email, phone..."
          placeholderTextColor={COLORS.TEXT.SECONDARY}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalStaff}</Text>
          <Text style={styles.statLabel}>Total Staff</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: COLORS.SUCCESS }]}>{activeStaff}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: COLORS.SUCCESS }]}>{inactiveStaff}</Text>
          <Text style={styles.statLabel}>Inactive</Text>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'Active' && styles.activeTabButton
          ]}
          onPress={() => setActiveTab('Active')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'Active' && styles.activeTabText
          ]}>
            Active ({activeStaff})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'Inactive' && styles.activeTabButton
          ]}
          onPress={() => setActiveTab('Inactive')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'Inactive' && styles.activeTabText
          ]}>
            Inactive ({inactiveStaff})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Staff List */}
      <FlatList
        data={filteredStaff}
        keyExtractor={(item) => item.id}
        renderItem={renderStaffItem}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            {activeTab === 'Active' ? (
              <Users size={64} color={COLORS.TEXT.SECONDARY} />
            ) : (
              <AlertTriangle size={64} color={COLORS.TEXT.SECONDARY} />
            )}
            <Text style={styles.emptyTitle}>
              {activeTab === 'Active' 
                ? 'No Active Staff' 
                : 'No Inactive Staff'
              }
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'Active'
                ? 'All staff are inactive or no staff exist yet'
                : 'All staff are currently active'
              }
            </Text>
          </View>
        }
      />

      {renderCreateModal()}
      {renderEditModal()}
      {renderAssignModal()}

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
  
  // Header
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

  // Staff List
  listContainer: {
    padding: SIZES.PADDING.MEDIUM,
  },
  staffCard: {
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
  staffInfo: {
    flex: 1,
  },
  staffName: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: "#009DFF",
    marginBottom: 4,
  },
  staffUsername: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
  },
  statusContainer: {
    marginLeft: SIZES.PADDING.SMALL,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.PADDING.SMALL,
    paddingVertical: 4,
    borderRadius: SIZES.RADIUS.SMALL,
    gap: 4,
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
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SIZES.PADDING.SMALL,
  },
  assignButton: {
    backgroundColor: "#000000",
    borderRadius: SIZES.RADIUS.SMALL,
    padding: SIZES.PADDING.SMALL,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 36,
    minHeight: 36,
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
  // Modal
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
    color: "#009DFF",
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  roleSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.PADDING.SMALL,
  },
  roleOption: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    borderWidth: 1,
    borderColor: 'transparent',
    minWidth: '30%',
    alignItems: 'center',
  },
  roleOptionSelected: {
    borderColor: "#009DFF",
    backgroundColor: 'rgba(0, 157, 255, 0.1)',
  },
  roleOptionText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
  },
  roleOptionTextSelected: {
    color: "#009DFF",
    fontWeight: '600',
  },
  agencySelector: {
    maxHeight: 150,
  },
  agencyOption: {
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    borderRadius: SIZES.RADIUS.MEDIUM,
    backgroundColor: COLORS.SURFACE,
    marginBottom: SIZES.PADDING.SMALL,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  agencyOptionSelected: {
    backgroundColor: "#009DFF",
    borderColor: "#009DFF",
  },
  agencyOptionText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
  },
  agencyOptionTextSelected: {
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
  },
});

export default StaffManagementScreen;
