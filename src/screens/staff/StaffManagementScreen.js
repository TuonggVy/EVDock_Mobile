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

const StaffManagementScreen = ({ navigation }) => {
  const { showAlert } = useCustomAlert();
  const [staffList, setStaffList] = useState([]);
  const [filteredStaff, setFilteredStaff] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  
  // Form states for creating new staff
  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'evm_staff',
    department: '',
    position: '',
  });

  // Filter states
  const [filters, setFilters] = useState({
    role: '',
    department: '',
    status: 'active',
  });

  useEffect(() => {
    loadStaffList();
  }, []);

  useEffect(() => {
    filterStaff();
  }, [searchQuery, staffList, filters]);

  const loadStaffList = async () => {
    try {
      setIsLoading(true);
      // Mock data - replace with actual API call
      const mockStaff = [
        {
          id: '1',
          name: 'Nguyễn Văn A',
          email: 'nguyenvana@evm.com',
          phone: '0123456789',
          role: 'evm_staff',
          department: 'Sales',
          position: 'Sales Staff',
          status: 'active',
          createdAt: '2024-01-15',
        },
        {
          id: '2',
          name: 'Trần Thị B',
          email: 'tranthib@evm.com',
          phone: '0987654321',
          role: 'evm_staff',
          department: 'Marketing',
          position: 'Marketing Staff',
          status: 'active',
          createdAt: '2024-01-20',
        },
        {
          id: '3',
          name: 'Lê Văn C',
          email: 'levanc@evm.com',
          phone: '0369258147',
          role: 'evm_staff',
          department: 'IT',
          position: 'IT Staff',
          status: 'inactive',
          createdAt: '2024-02-01',
        },
      ];
      setStaffList(mockStaff);
    } catch (error) {
      showAlert('Lỗi', 'Không thể tải danh sách nhân viên');
    } finally {
      setIsLoading(false);
    }
  };

  const filterStaff = () => {
    let filtered = staffList;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(staff =>
        staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        staff.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        staff.phone.includes(searchQuery)
      );
    }

    // Role filter
    if (filters.role) {
      filtered = filtered.filter(staff => staff.role === filters.role);
    }

    // Department filter
    if (filters.department) {
      filtered = filtered.filter(staff => staff.department === filters.department);
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(staff => staff.status === filters.status);
    }

    setFilteredStaff(filtered);
  };

  const handleCreateStaff = async () => {
    try {
      if (!newStaff.name || !newStaff.email || !newStaff.phone) {
        showAlert('Lỗi', 'Vui lòng điền đầy đủ thông tin bắt buộc');
        return;
      }

      // Mock API call - replace with actual API
      const newStaffData = {
        ...newStaff,
        id: Date.now().toString(),
        status: 'active',
        createdAt: new Date().toISOString().split('T')[0],
      };

      setStaffList(prev => [newStaffData, ...prev]);
      setShowCreateModal(false);
      setNewStaff({
        name: '',
        email: '',
        phone: '',
        role: 'evm_staff',
        department: '',
        position: '',
      });
      showAlert('Thành công', 'Tạo tài khoản nhân viên thành công');
    } catch (error) {
      showAlert('Lỗi', 'Không thể tạo tài khoản nhân viên');
    }
  };

  const handleEditStaff = (staff) => {
    showAlert('Thông báo', 'Tính năng chỉnh sửa đang được phát triển');
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
    loadStaffList().finally(() => setRefreshing(false));
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

  const getStatusColor = (status) => {
    return status === 'active' ? COLORS.SUCCESS : COLORS.ERROR;
  };

  const renderStaffItem = ({ item }) => (
    <View style={styles.staffCard}>
      <View style={styles.staffInfo}>
        <Text style={styles.staffName}>{item.name}</Text>
        <Text style={styles.staffEmail}>{item.email}</Text>
        <Text style={styles.staffPhone}>{item.phone}</Text>
        <View style={styles.staffDetails}>
          <Text style={styles.staffRole}>{getRoleDisplayName(item.role)}</Text>
          <Text style={[styles.staffStatus, { color: getStatusColor(item.status) }]}>
            {item.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
          </Text>
        </View>
        {item.department && (
          <Text style={styles.staffDepartment}>{item.department} - {item.position}</Text>
        )}
      </View>
      <View style={styles.staffActions}>
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
            label="Họ và tên *"
            value={newStaff.name}
            onChangeText={(text) => setNewStaff(prev => ({ ...prev, name: text }))}
            placeholder="Nhập họ và tên"
          />
          
          <Input
            label="Email *"
            value={newStaff.email}
            onChangeText={(text) => setNewStaff(prev => ({ ...prev, email: text }))}
            placeholder="Nhập email"
            keyboardType="email-address"
          />
          
          <Input
            label="Số điện thoại *"
            value={newStaff.phone}
            onChangeText={(text) => setNewStaff(prev => ({ ...prev, phone: text }))}
            placeholder="Nhập số điện thoại"
            keyboardType="phone-pad"
          />
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Vai trò *</Text>
            <View style={styles.roleSelector}>
              {[
                { value: 'evm_staff', label: 'EVM Staff' },
                { value: 'dealer_manager', label: 'Dealer Manager' },
                { value: 'dealer_staff', label: 'Dealer Staff' },
              ].map((role) => (
                <TouchableOpacity
                  key={role.value}
                  style={[
                    styles.roleOption,
                    newStaff.role === role.value && styles.roleOptionSelected
                  ]}
                  onPress={() => setNewStaff(prev => ({ ...prev, role: role.value }))}
                >
                  <Text style={[
                    styles.roleOptionText,
                    newStaff.role === role.value && styles.roleOptionTextSelected
                  ]}>
                    {role.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <Input
            label="Phòng ban"
            value={newStaff.department}
            onChangeText={(text) => setNewStaff(prev => ({ ...prev, department: text }))}
            placeholder="Nhập phòng ban"
          />
          
          <Input
            label="Chức vụ"
            value={newStaff.position}
            onChangeText={(text) => setNewStaff(prev => ({ ...prev, position: text }))}
            placeholder="Nhập chức vụ"
          />
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
  staffEmail: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: 2,
  },
  staffPhone: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: SIZES.PADDING.SMALL,
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
  },
  roleOptionSelected: {
    backgroundColor: COLORS.PRIMARY,
  },
  roleOptionText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
  },
  roleOptionTextSelected: {
    color: COLORS.TEXT.WHITE,
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
});

export default StaffManagementScreen;
