import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES } from '../../constants';
import { UserPlus, Users, Search, Filter, Edit, Trash2, ArrowLeft } from 'lucide-react-native';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import staffService from '../../services/staffService';
import agencyService from '../../services/agencyService';

const StaffManagementScreen = ({ navigation }) => {
  const { showAlert } = useCustomAlert();
  const [staffList, setStaffList] = useState([]);
  const [filteredStaff, setFilteredStaff] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
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
  const [totalPages, setTotalPages] = useState(1);
  const pageLimit = 1000; // Load all staff at once

  // Filter states
  const [filters, setFilters] = useState({
    role: '',
    department: '',
    status: 'active',
  });

  useEffect(() => {
    loadStaffList(currentPage);
    loadAgencies();
  }, []);

  useEffect(() => {
    filterStaff();
  }, [searchQuery, staffList, filters]);

  const loadAgencies = async () => {
    try {
      const agenciesData = await agencyService.getAgencies({
        limit: 100,
        page: 1,
      });
      setAgencies(agenciesData || []);
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
        setTotalPages(1);
      } else {
        showAlert('Lỗi', result.error || 'Không thể tải danh sách nhân viên');
        // Fallback to empty array
        setStaffList([]);
      }
    } catch (error) {
      console.error('Error loading staff list:', error);
      showAlert('Lỗi', 'Không thể tải danh sách nhân viên');
      // Fallback to empty array
      setStaffList([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filterStaff = () => {
    let filtered = staffList;

    // Only apply search filter locally (other filters are handled by API)
    if (searchQuery) {
      filtered = filtered.filter(staff =>
        (staff.name || staff.fullname || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (staff.username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (staff.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (staff.phone || '').includes(searchQuery) ||
        (staff.address || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredStaff(filtered);
  };

  const handleCreateStaff = async () => {
    try {
      // Validation
      if (!newStaff.username || !newStaff.password || !newStaff.fullname || !newStaff.email || !newStaff.phone) {
        showAlert('Lỗi', 'Vui lòng điền đầy đủ thông tin bắt buộc (username, password, fullname, email, phone)');
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
        showAlert('Thành công', result.message || 'Tạo tài khoản nhân viên thành công');
        loadStaffList(); // Reload the staff list
      } else {
        showAlert('Lỗi', result.error || 'Không thể tạo tài khoản nhân viên');
      }
    } catch (error) {
      console.error('Error creating staff:', error);
      showAlert('Lỗi', 'Không thể tạo tài khoản nhân viên');
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
        showAlert('Lỗi', 'Vui lòng điền đầy đủ thông tin bắt buộc');
        return;
      }

      const result = await staffService.updateStaff(editingStaff.id, editStaffForm);
      
      if (result.success) {
        setShowEditModal(false);
        setEditingStaff(null);
        showAlert('Thành công', result.message || 'Cập nhật thông tin nhân viên thành công');
        loadStaffList(); // Reload the staff list
      } else {
        showAlert('Lỗi', result.error || 'Không thể cập nhật thông tin nhân viên');
      }
    } catch (error) {
      console.error('Error updating staff:', error);
      showAlert('Lỗi', 'Không thể cập nhật thông tin nhân viên');
    }
  };

  const handleDeleteStaff = (staff) => {
    Alert.alert(
      'Xác nhận xóa',
      `Bạn có chắc chắn muốn xóa nhân viên ${staff.name}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            setStaffList(prev => prev.filter(s => s.id !== staff.id));
            showAlert('Thành công', 'Đã xóa nhân viên');
          },
        },
      ]
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
      showAlert('Lỗi', 'Vui lòng chọn đại lý');
      return;
    }

    try {
      const result = await staffService.assignStaffToAgency(assigningStaff.id, selectedAgencyId);
      if (result.success) {
        showAlert('Thành công', result.message || 'Đã gán nhân viên vào đại lý thành công');
        setShowAssignModal(false);
        setAssigningStaff(null);
        setSelectedAgencyId(null);
        loadStaffList(currentPage);
      } else {
        showAlert('Lỗi', result.error || 'Không thể gán nhân viên vào đại lý');
      }
    } catch (error) {
      console.error('Error assigning staff:', error);
      showAlert('Lỗi', 'Không thể gán nhân viên vào đại lý');
    }
  };

  const renderStaffItem = ({ item }) => {
    const isDM = isDealerManager(item);
    
    return (
    <View style={styles.staffCard}>
      <View style={styles.staffInfo}>
        <Text style={styles.staffName}>{item.fullname || item.name}</Text>
        {item.username && (
          <Text style={styles.staffUsername}>@{item.username}</Text>
        )}
        <Text style={styles.staffEmail}>{item.email}</Text>
        <Text style={styles.staffPhone}>{item.phone}</Text>
        {item.address && (
          <Text style={styles.staffAddress}>{item.address}</Text>
        )}
        <View style={styles.staffDetails}>
          {item.roleNames && item.roleNames.length > 0 && (
            <Text style={styles.staffRole}>
              {Array.isArray(item.roleNames) ? item.roleNames.join(', ') : item.roleNames}
            </Text>
          )}
          <Text style={[styles.staffStatus, { color: getStatusColor(item.isActive) }]}>
            {item.isActive ? 'Hoạt động' : 'Không hoạt động'}
          </Text>
        </View>
      </View>
      <View style={styles.staffActions}>
        {isDM && (
          <TouchableOpacity
            style={styles.assignButton}
            onPress={() => handleAssignAgency(item)}
          >
            <Text style={styles.assignButtonText}>🏢</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleEditStaff(item)}
        >
          <Edit size={16} color={COLORS.PRIMARY} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDeleteStaff(item)}
        >
          <Trash2 size={16} color={COLORS.ERROR} />
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
          <Text style={styles.modalTitle}>
            Gán đại lý - {assigningStaff?.fullname || ''}
          </Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => {
              setShowAssignModal(false);
              setAssigningStaff(null);
              setSelectedAgencyId(null);
            }}
          >
            <Text style={styles.closeButtonText}>Đóng</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          <Text style={styles.inputLabel}>Chọn agency</Text>
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
                <Text style={styles.emptyText}>Không có agency nào</Text>
              </View>
            )}
          </ScrollView>
        </ScrollView>
        
        <View style={styles.modalFooter}>
          <Button
            title="Gán vào đại lý"
            onPress={confirmAssignAgency}
            style={styles.createButton}
          />
        </View>
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
          <Text style={styles.modalTitle}>Tạo tài khoản nhân viên</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowCreateModal(false)}
          >
            <Text style={styles.closeButtonText}>Đóng</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          <Input
            label="Username *"
            value={newStaff.username}
            onChangeText={(text) => setNewStaff(prev => ({ ...prev, username: text }))}
            placeholder="Nhập username"
            autoCapitalize="none"
          />
          
          <Input
            label="Password *"
            value={newStaff.password}
            onChangeText={(text) => setNewStaff(prev => ({ ...prev, password: text }))}
            placeholder="Nhập password"
            secureTextEntry
          />
          
          <Input
            label="Họ và tên *"
            value={newStaff.fullname}
            onChangeText={(text) => setNewStaff(prev => ({ ...prev, fullname: text }))}
            placeholder="Nhập họ và tên"
          />
          
          <Input
            label="Email *"
            value={newStaff.email}
            onChangeText={(text) => setNewStaff(prev => ({ ...prev, email: text }))}
            placeholder="Nhập email"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <Input
            label="Số điện thoại *"
            value={newStaff.phone}
            onChangeText={(text) => setNewStaff(prev => ({ ...prev, phone: text }))}
            placeholder="Nhập số điện thoại"
            keyboardType="phone-pad"
          />
          
          <Input
            label="Địa chỉ"
            value={newStaff.address}
            onChangeText={(text) => setNewStaff(prev => ({ ...prev, address: text }))}
            placeholder="Nhập địa chỉ"
          />
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Vai trò *</Text>
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
        
        <View style={styles.modalFooter}>
          <Button
            title="Tạo tài khoản"
            onPress={handleCreateStaff}
            style={styles.createButton}
          />
        </View>
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
          <Text style={styles.modalTitle}>Chỉnh sửa thông tin nhân viên</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => {
              setShowEditModal(false);
              setEditingStaff(null);
            }}
          >
            <Text style={styles.closeButtonText}>Đóng</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          <Input
            label="Username *"
            value={editStaffForm.username}
            onChangeText={(text) => setEditStaffForm(prev => ({ ...prev, username: text }))}
            placeholder="Nhập username"
            autoCapitalize="none"
            editable={false}
          />
          
          <Input
            label="Họ và tên *"
            value={editStaffForm.fullname}
            onChangeText={(text) => setEditStaffForm(prev => ({ ...prev, fullname: text }))}
            placeholder="Nhập họ và tên"
          />
          
          <Input
            label="Email *"
            value={editStaffForm.email}
            onChangeText={(text) => setEditStaffForm(prev => ({ ...prev, email: text }))}
            placeholder="Nhập email"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <Input
            label="Số điện thoại *"
            value={editStaffForm.phone}
            onChangeText={(text) => setEditStaffForm(prev => ({ ...prev, phone: text }))}
            placeholder="Nhập số điện thoại"
            keyboardType="phone-pad"
          />
          
          <Input
            label="Địa chỉ"
            value={editStaffForm.address}
            onChangeText={(text) => setEditStaffForm(prev => ({ ...prev, address: text }))}
            placeholder="Nhập địa chỉ"
          />
        </ScrollView>
        
        <View style={styles.modalFooter}>
          <Button
            title="Cập nhật thông tin"
            onPress={handleUpdateStaff}
            style={styles.createButton}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={20} color={COLORS.TEXT.WHITE} />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={styles.title}>Quản lý nhân viên</Text>
            <Text style={styles.subtitle}>Quản lý tài khoản và thông tin nhân viên</Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowCreateModal(true)}
          >
            <UserPlus size={20} color={COLORS.TEXT.WHITE} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Section */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Search size={20} color={COLORS.TEXT.SECONDARY} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm nhân viên..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={COLORS.TEXT.SECONDARY}
          />
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
        >
          <Filter size={20} color={COLORS.PRIMARY} />
        </TouchableOpacity>
      </View>

      {/* Stats Section */}
      <View style={styles.statsSection}>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{filteredStaff.length}</Text>
            <Text style={styles.statLabel}>Tổng nhân viên</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {filteredStaff.filter(s => s.status === 'active').length}
            </Text>
            <Text style={styles.statLabel}>Đang hoạt động</Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
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
            <View style={styles.emptyContainer}>
              <Users size={48} color={COLORS.TEXT.SECONDARY} />
              <Text style={styles.emptyText}>Không có nhân viên nào</Text>
            </View>
          }
        />
      </View>

      {renderCreateModal()}
      {renderEditModal()}
      {renderAssignModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
  },
  
  // Header
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
  headerTitle: {
    flex: 1,
    alignItems: 'center',
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: SIZES.RADIUS.ROUND,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Search Section
  searchSection: {
    paddingHorizontal: SIZES.PADDING.LARGE,
    paddingBottom: SIZES.PADDING.LARGE,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.LARGE,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    marginBottom: SIZES.PADDING.MEDIUM,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
    marginLeft: SIZES.PADDING.SMALL,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: SIZES.RADIUS.MEDIUM,
    backgroundColor: COLORS.SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SIZES.PADDING.SMALL,
  },

  // Stats Section
  statsSection: {
    paddingHorizontal: SIZES.PADDING.LARGE,
    paddingBottom: SIZES.PADDING.LARGE,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.LARGE,
    padding: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
    marginHorizontal: SIZES.PADDING.XSMALL,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  statNumber: {
    fontSize: SIZES.FONT.XXLARGE,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginBottom: SIZES.PADDING.XSMALL,
  },
  statLabel: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    textAlign: 'center',
  },

  // Content
  content: {
    flex: 1,
  },
  listContainer: {
    padding: SIZES.PADDING.LARGE,
  },
  staffCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.LARGE,
    padding: SIZES.PADDING.MEDIUM,
    marginBottom: SIZES.PADDING.MEDIUM,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
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
    marginBottom: 2,
  },
  staffEmail: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: 2,
  },
  staffPhone: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: 2,
  },
  staffAddress: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: SIZES.PADDING.SMALL,
    opacity: 0.8,
  },
  staffDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  staffRole: {
    fontSize: SIZES.FONT.XSMALL,
    color: COLORS.PRIMARY,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
    paddingHorizontal: SIZES.PADDING.SMALL,
    paddingVertical: SIZES.PADDING.XSMALL,
    borderRadius: SIZES.RADIUS.SMALL,
  },
  staffStatus: {
    fontSize: SIZES.FONT.XSMALL,
    fontWeight: '500',
  },
  staffDepartment: {
    fontSize: SIZES.FONT.XSMALL,
    color: COLORS.TEXT.SECONDARY,
    marginTop: SIZES.PADDING.XSMALL,
  },
  staffActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: SIZES.RADIUS.ROUND,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SIZES.PADDING.SMALL,
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
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.PADDING.LARGE,
    paddingVertical: SIZES.PADDING.MEDIUM,
    backgroundColor: COLORS.SURFACE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  modalTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
  },
  closeButton: {
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
  },
  closeButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.PRIMARY,
    fontWeight: '500',
  },
  modalContent: {
    flex: 1,
    padding: SIZES.PADDING.LARGE,
  },
  inputGroup: {
    marginBottom: SIZES.PADDING.LARGE,
  },
  inputLabel: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: '500',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  roleSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  roleOption: {
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    borderRadius: SIZES.RADIUS.XXLARGE,
    backgroundColor: COLORS.SURFACE,
    marginRight: SIZES.PADDING.SMALL,
    marginBottom: SIZES.PADDING.SMALL,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  roleOptionSelected: {
    backgroundColor: COLORS.PRIMARY,
  },
  roleOptionText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    fontWeight: '600',
  },
  roleOptionTextSelected: {
    color: COLORS.TEXT.WHITE,
  },
  roleOptionDesc: {
    fontSize: SIZES.FONT.XSMALL,
    color: COLORS.TEXT.SECONDARY,
    marginTop: 2,
    opacity: 0.7,
  },
  roleOptionDescSelected: {
    color: COLORS.TEXT.WHITE,
    opacity: 0.9,
  },
  modalFooter: {
    padding: SIZES.PADDING.LARGE,
    backgroundColor: COLORS.SURFACE,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
  },
  createButton: {
    backgroundColor: COLORS.PRIMARY,
  },
  assignButton: {
    backgroundColor: COLORS.SUCCESS,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: SIZES.RADIUS.MEDIUM,
    marginRight: SIZES.PADDING.SMALL,
    justifyContent: 'center',
    alignItems: 'center',
  },
  assignButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.WHITE,
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
    borderColor: COLORS.BORDER,
  },
  agencyOptionSelected: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  agencyOptionText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
  },
  agencyOptionTextSelected: {
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.PADDING.LARGE,
  },
  emptyText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
  },
});

export default StaffManagementScreen;
