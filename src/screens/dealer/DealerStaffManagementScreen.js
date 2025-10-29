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
import { useAuth } from '../../contexts/AuthContext';
import staffService from '../../services/staffService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DealerStaffManagementScreen = ({ navigation }) => {
  const { showAlert } = useCustomAlert();
  const { user } = useAuth();
  const [staffList, setStaffList] = useState([]);
  const [filteredStaff, setFilteredStaff] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [agencyId, setAgencyId] = useState(null);
  const [dealerStaffRole, setDealerStaffRole] = useState(null);
  
  // Form states for creating new staff
  const [newStaff, setNewStaff] = useState({
    username: '',
    password: '',
    fullname: '',
    email: '',
    phone: '',
    address: '',
  });

  // Form states for editing staff
  const [editStaffForm, setEditStaffForm] = useState({
    username: '',
    fullname: '',
    email: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    filterStaff();
  }, [searchQuery, staffList]);

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
        showAlert('Lỗi', 'Không tìm thấy thông tin agency. Vui lòng đăng nhập lại.');
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
      showAlert('Lỗi', 'Không thể tải dữ liệu');
    }
  };

  const loadStaffList = async (currentAgencyId) => {
    try {
      setIsLoading(true);
      console.log('Loading staff list for agencyId:', currentAgencyId);
      
      const result = await staffService.getDealerStaffList(currentAgencyId);
      
      if (result?.success) {
        console.log('Staff list loaded:', result.data);
        setStaffList(result.data || []);
      } else {
        console.error('Failed to load staff:', result?.error);
        showAlert('Lỗi', result?.error || 'Không thể tải danh sách nhân viên');
        setStaffList([]);
      }
    } catch (error) {
      console.error('Error loading staff list:', error);
      showAlert('Lỗi', 'Không thể tải danh sách nhân viên');
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

  const handleCreateStaff = async () => {
    try {
      console.log('🟢 handleCreateStaff pressed', { newStaff, agencyId, dealerStaffRole });
      // Validation
      if (!newStaff.username || !newStaff.password || !newStaff.fullname || !newStaff.email || !newStaff.phone) {
        console.log('⛔ Validation failed: missing required fields', {
          username: !!newStaff.username,
          password: !!newStaff.password,
          fullname: !!newStaff.fullname,
          email: !!newStaff.email,
          phone: !!newStaff.phone,
        });
        showAlert('Lỗi', 'Vui lòng điền đầy đủ thông tin bắt buộc (username, password, fullname, email, phone)');
        return;
      }

      if (!agencyId) {
        console.log('⛔ Validation failed: missing agencyId');
        showAlert('Lỗi', 'Không tìm thấy thông tin agency');
        return;
      }

      const resolvedRoleId = dealerStaffRole?.id ?? dealerStaffRole?.data?.id;
      if (!resolvedRoleId) {
        console.log('⛔ Validation failed: missing dealerStaffRole id (checked id and data.id)', { dealerStaffRole });
        showAlert('Lỗi', 'Không tìm thấy thông tin role Dealer Staff');
        return;
      }

      setIsLoading(true);

      // Call API to create staff
      const staffData = {
        username: newStaff.username,
        password: newStaff.password,
        fullname: newStaff.fullname,
        email: newStaff.email,
        phone: newStaff.phone,
        address: newStaff.address,
        roleId: Number(resolvedRoleId),
        agencyId: Number(agencyId),
      };

      console.log('🚀 Creating dealer staff with data:', staffData);

      const result = await staffService.createDealerStaff(staffData);
      
      if (result.success) {
        console.log('✅ Create dealer staff result:', result);
        showAlert('Thành công', result.message || 'Tạo tài khoản nhân viên thành công');
        setShowCreateModal(false);
        setNewStaff({
          username: '',
          password: '',
          fullname: '',
          email: '',
          phone: '',
          address: '',
        });
        await loadStaffList(agencyId); // Reload the staff list
      } else {
        console.log('❌ Create dealer staff failed:', result);
        showAlert('Lỗi', result.error || 'Không thể tạo tài khoản nhân viên');
      }
    } catch (error) {
      console.error('Error creating staff:', error);
      showAlert('Lỗi', error.message || 'Không thể tạo tài khoản nhân viên');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditStaff = (staff) => {
    setEditingStaff(staff);
    setEditStaffForm({
      username: staff.username || '',
      fullname: staff.fullname || '',
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

      setIsLoading(true);
      
      const result = await staffService.updateDealerStaff(editingStaff.id, {
        username: editStaffForm.username,
        fullname: editStaffForm.fullname,
        email: editStaffForm.email,
        phone: editStaffForm.phone,
        address: editStaffForm.address || '',
      });
      
      if (result.success) {
        showAlert('Thành công', result.message || 'Cập nhật thông tin nhân viên thành công');
        setShowEditModal(false);
        setEditingStaff(null);
        await loadStaffList(agencyId); // Reload staff list
      } else {
        showAlert('Lỗi', result.error || 'Không thể cập nhật thông tin nhân viên');
      }
    } catch (error) {
      console.error('Error updating staff:', error);
      showAlert('Lỗi', error.message || 'Không thể cập nhật thông tin nhân viên');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteStaff = (staff) => {
    Alert.alert(
      'Xác nhận xóa',
      `Bạn có chắc chắn muốn xóa nhân viên ${staff.fullname}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              const result = await staffService.deleteDealerStaff(staff.id);
              
              if (result.success) {
                showAlert('Thành công', result.message || 'Đã xóa nhân viên');
                await loadStaffList(agencyId); // Reload staff list
              } else {
                showAlert('Lỗi', result.error || 'Không thể xóa nhân viên');
              }
            } catch (error) {
              console.error('Error deleting staff:', error);
              showAlert('Lỗi', error.message || 'Không thể xóa nhân viên');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
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
        <View style={styles.staffInfo}>
          <Text style={styles.staffName}>{item.fullname}</Text>
          {item.username && (
            <Text style={styles.staffUsername}>@{item.username}</Text>
          )}
          <Text style={styles.staffEmail}>{item.email}</Text>
          <Text style={styles.staffPhone}>{item.phone}</Text>
          {item.address && (
            <Text style={styles.staffAddress}>{item.address}</Text>
          )}
          <View style={styles.staffDetails}>
            <Text style={[styles.staffStatus, { color: getStatusColor(item.isActive) }]}>
              {item.isActive ? 'Hoạt động' : 'Không hoạt động'}
            </Text>
          </View>
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
  };

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
        </ScrollView>
        
        <View style={styles.modalFooter}>
          <Button
            title="Tạo tài khoản"
            onPress={handleCreateStaff}
            loading={isLoading}
            disabled={isLoading}
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
            <Text style={styles.title}>Quản lý Dealer Staff</Text>
            <Text style={styles.subtitle}>Quản lý nhân viên đại lý</Text>
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
              {filteredStaff.filter(s => s.isActive).length}
            </Text>
            <Text style={styles.statLabel}>Đang hoạt động</Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
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
              <Text style={styles.emptyText}>Không có nhân viên nào</Text>
            </View>
          }
        />
      </View>

      {renderCreateModal()}
      {renderEditModal()}
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
  staffStatus: {
    fontSize: SIZES.FONT.XSMALL,
    fontWeight: '500',
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

export default DealerStaffManagementScreen;

