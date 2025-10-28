import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Modal,
  Dimensions,
  TextInput,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES } from '../../constants';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import agencyService from '../../services/agencyService';

const { width } = Dimensions.get('window');

const DealerManagementScreen = ({ navigation }) => {
  const [agencies, setAgencies] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('Active'); // 'Active' or 'Inactive'
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAgency, setEditingAgency] = useState(null);
  const [newAgency, setNewAgency] = useState({
    name: '',
    location: '',
    address: '',
    contactInfo: '',
    status: 'Active',
  });

  const { alertConfig, hideAlert, showSuccess, showError, showConfirm, showInfo } = useCustomAlert();

  // Status options
  const statusOptions = [
    { value: 'Active', label: 'Hoạt động', color: COLORS.SUCCESS },
    { value: 'Inactive', label: 'Không hoạt động', color: COLORS.ERROR },
  ];

  useEffect(() => {
    loadAgencies();
  }, []);

  const loadAgencies = async () => {
    try {
      const res = await agencyService.getAgencies();
      console.log('Load agencies response:', res);
      console.log('Agencies data:', res?.data);
      
      if (res?.success) {
        console.log('Setting agencies:', res.data);
        setAgencies(res.data || []);
      } else {
        showError('Lỗi', res?.error || 'Không thể tải danh sách đại lý');
      }
    } catch (error) {
      console.error('Error loading agencies:', error);
      showError('Lỗi', 'Không thể tải danh sách đại lý');
    }
  };

  const filteredAgencies = agencies.filter(agency => {
    const matchesSearch = agency.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agency.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agency.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agency.contactInfo?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTab = activeTab === 'Active' 
      ? agency.status === 'Active'
      : agency.status === 'Inactive';
    
    return matchesSearch && matchesTab;
  });

  const getStatusColor = (status) => {
    const statusOption = statusOptions.find(option => option.value === status);
    return statusOption ? statusOption.color : COLORS.TEXT.SECONDARY;
  };

  const getStatusText = (status) => {
    const statusOption = statusOptions.find(option => option.value === status);
    return statusOption ? statusOption.label : 'Không xác định';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Active': return '✅';
      case 'Inactive': return '❌';
      default: return '❓';
    }
  };

  const handleAddDealer = () => {
    setNewAgency({
      name: '',
      location: '',
      address: '',
      contactInfo: '',
      status: 'Active',
    });
    setShowAddModal(true);
  };

  const handleEditDealer = (agency) => {
    setEditingAgency(agency);
    setNewAgency({
      name: agency.name,
      location: agency.location,
      address: agency.address,
      contactInfo: agency.contactInfo,
      status: agency.status,
    });
    setShowEditModal(true);
  };

  const handleSaveDealer = async () => {
    if (!newAgency.name || !newAgency.location || !newAgency.address || !newAgency.contactInfo) {
      showError('Lỗi', 'Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    try {
      const agencyData = {
        name: newAgency.name,
        location: newAgency.location,
        address: newAgency.address,
        contactInfo: newAgency.contactInfo,
      };

      // If editing and status exists, include it
      if (editingAgency && newAgency.status) {
        agencyData.status = newAgency.status;
      }

      const res = editingAgency
        ? await agencyService.updateAgency(editingAgency.id, agencyData)
        : await agencyService.createAgency(agencyData);
      
      console.log('Save agency response:', res);

      if (res?.success) {
        await loadAgencies();
        if (editingAgency) {
          setShowEditModal(false);
          setEditingAgency(null);
          showSuccess('Thành công', 'Cập nhật đại lý thành công!');
        } else {
          setShowAddModal(false);
          showSuccess('Thành công', 'Thêm mới đại lý thành công!');
        }
      } else {
        showError('Lỗi', res?.error || 'Không thể lưu thông tin đại lý');
      }

      setNewAgency({
        name: '',
        location: '',
        address: '',
        contactInfo: '',
        status: 'Active',
      });
    } catch (error) {
      console.error('Error saving agency:', error);
      showError('Lỗi', 'Không thể lưu thông tin đại lý');
    }
  };

  const handleDeleteDealer = (agencyId) => {
    showConfirm(
      'Xác nhận xóa',
      'Bạn có chắc chắn muốn xóa đại lý này?',
      async () => {
        const res = await agencyService.deleteAgency(agencyId);
        if (res?.success) {
          await loadAgencies();
          showSuccess('Thành công', 'Xóa đại lý thành công!');
        } else {
          showError('Lỗi', res?.error || 'Không thể xóa đại lý');
        }
      }
    );
  };

  const handleStatusChange = (agencyId, newStatus) => {
    showConfirm(
      'Xác nhận thay đổi trạng thái',
      `Bạn có chắc chắn muốn thay đổi trạng thái đại lý thành "${getStatusText(newStatus)}"?`,
      async () => {
        const res = await agencyService.updateAgencyStatus(agencyId, newStatus);
        if (res?.success) {
          await loadAgencies();
          showSuccess('Thành công', 'Cập nhật trạng thái thành công!');
        } else {
          showError('Lỗi', res?.error || 'Không thể cập nhật trạng thái');
        }
      }
    );
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const renderDealerCard = (agency) => (
    <View key={agency.id} style={styles.dealerCard}>
      <View style={styles.cardHeader}>
        <View style={styles.dealerInfo}>
          <Text style={styles.dealerName}>{agency.name}</Text>
          <Text style={styles.dealerCity}>{agency.location}</Text>
        </View>
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(agency.status) }]}>
            <Text style={styles.statusIcon}>{getStatusIcon(agency.status)}</Text>
            <Text style={styles.statusText}>{getStatusText(agency.status)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.contactInfo}>
          <Text style={styles.contactLabel}>Địa chỉ:</Text>
          <Text style={styles.contactValue}>{agency.address}</Text>
        </View>

        <View style={styles.contactInfo}>
          <Text style={styles.contactLabel}>Thông tin liên hệ:</Text>
          <Text style={styles.contactDetail}>{agency.contactInfo}</Text>
        </View>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => handleEditDealer(agency)}
        >
          <Text style={styles.editButtonText}>Chỉnh sửa</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.statusButton}
          onPress={() => handleStatusChange(agency.id, agency.status === 'Active' ? 'Inactive' : 'Active')}
        >
          <Text style={styles.statusButtonText}>
            {agency.status === 'Active' ? 'Vô hiệu hóa' : 'Kích hoạt'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteDealer(agency.id)}
        >
          <Text style={styles.deleteButtonText}>Xóa</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderAddEditModal = () => (
    <Modal
      visible={showAddModal || showEditModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => {
              setShowAddModal(false);
              setShowEditModal(false);
              setEditingAgency(null);
              setNewAgency({
                name: '',
                location: '',
                address: '',
                contactInfo: '',
                status: 'Active',
              });
            }}
          >
            <Text style={styles.modalCloseText}>Hủy</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>
            {editingAgency ? 'Chỉnh sửa đại lý' : 'Thêm mới đại lý'}
          </Text>
          <TouchableOpacity
            style={styles.modalSaveButton}
            onPress={handleSaveDealer}
          >
            <Text style={styles.modalSaveText}>Lưu</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Tên đại lý *</Text>
            <TextInput
              style={styles.textInput}
              value={newAgency.name}
              onChangeText={(text) => setNewAgency({ ...newAgency, name: text })}
              placeholder="Nhập tên đại lý"
              placeholderTextColor={COLORS.TEXT.SECONDARY}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Khu vực *</Text>
            <TextInput
              style={styles.textInput}
              value={newAgency.location}
              onChangeText={(text) => setNewAgency({ ...newAgency, location: text })}
              placeholder="Nhập khu vực"
              placeholderTextColor={COLORS.TEXT.SECONDARY}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Địa chỉ *</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={newAgency.address}
              onChangeText={(text) => setNewAgency({ ...newAgency, address: text })}
              placeholder="Nhập địa chỉ"
              placeholderTextColor={COLORS.TEXT.SECONDARY}
              multiline
              numberOfLines={2}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Thông tin liên hệ *</Text>
            <TextInput
              style={styles.textInput}
              value={newAgency.contactInfo}
              onChangeText={(text) => setNewAgency({ ...newAgency, contactInfo: text })}
              placeholder="Nhập thông tin liên hệ"
              placeholderTextColor={COLORS.TEXT.SECONDARY}
              keyboardType="email-address"
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  // Calculate statistics
  const totalAgencies = agencies.length;
  const activeAgencies = agencies.filter(agency => agency.status === 'Active').length;
  const inactiveAgencies = agencies.filter(agency => agency.status === 'Inactive').length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quản lý Agencies</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddDealer}
        >
          <Text style={styles.addIcon}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm đại lý, mã, liên hệ..."
          placeholderTextColor={COLORS.TEXT.SECONDARY}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalAgencies}</Text>
          <Text style={styles.statLabel}>Tổng đại lý</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: COLORS.SUCCESS }]}>{activeAgencies}</Text>
          <Text style={styles.statLabel}>Hoạt động</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: COLORS.ERROR }]}>{inactiveAgencies}</Text>
          <Text style={styles.statLabel}>Không hoạt động</Text>
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
            Đang hoạt động ({activeAgencies})
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
            Không hoạt động ({inactiveAgencies})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Dealers List */}
      <ScrollView
        style={styles.dealersList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.dealersContent}
      >
        {filteredAgencies.length > 0 ? (
          filteredAgencies.map(renderDealerCard)
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>
              {activeTab === 'Active' ? '🏢' : '⚠️'}
            </Text>
            <Text style={styles.emptyTitle}>
              {activeTab === 'Active' 
                ? 'Không có đại lý đang hoạt động' 
                : 'Không có đại lý không hoạt động'
              }
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'Active'
                ? 'Tất cả đại lý đều không hoạt động hoặc chưa có đại lý nào'
                : 'Tất cả đại lý đều đang hoạt động'
              }
            </Text>
          </View>
        )}
      </ScrollView>

      {renderAddEditModal()}
      
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
  backIcon: {
    fontSize: SIZES.FONT.LARGE,
    color: COLORS.TEXT.WHITE,
    fontWeight: 'bold',
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
    backgroundColor: COLORS.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIcon: {
    fontSize: SIZES.FONT.LARGE,
    color: COLORS.TEXT.WHITE,
    fontWeight: 'bold',
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
  },
  searchIcon: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
    marginRight: SIZES.PADDING.SMALL,
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
    color: COLORS.PRIMARY,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: SIZES.FONT.XSMALL,
    color: COLORS.TEXT.SECONDARY,
    textAlign: 'center',
  },

  // Sales Card
  salesCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
    marginHorizontal: SIZES.PADDING.MEDIUM,
    marginBottom: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
  },
  salesLabel: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: SIZES.PADDING.SMALL,
  },
  salesAmount: {
    fontSize: SIZES.FONT.XXLARGE,
    fontWeight: 'bold',
    color: COLORS.SUCCESS,
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
    backgroundColor: COLORS.PRIMARY,
  },
  tabText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
    fontWeight: '600',
  },
  activeTabText: {
    color: COLORS.TEXT.WHITE,
  },

  // Dealers List
  dealersList: {
    flex: 1,
  },
  dealersContent: {
    padding: SIZES.PADDING.MEDIUM,
  },
  dealerCard: {
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
  dealerInfo: {
    flex: 1,
  },
  dealerCode: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: 4,
  },
  dealerName: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginBottom: 4,
  },
  dealerCity: {
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
  },
  statusIcon: {
    fontSize: SIZES.FONT.SMALL,
    marginRight: 4,
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
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.PADDING.SMALL,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: SIZES.FONT.XSMALL,
    color: COLORS.TEXT.SECONDARY,
  },
  contractInfo: {
    marginBottom: SIZES.PADDING.SMALL,
  },
  contractLabel: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: 4,
  },
  contractValue: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.PRIMARY,
    marginBottom: 2,
  },
  commissionRate: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.SUCCESS,
    fontWeight: '600',
  },
  notesContainer: {
    marginTop: SIZES.PADDING.SMALL,
  },
  notesLabel: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: 4,
  },
  notesValue: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.PRIMARY,
    fontStyle: 'italic',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SIZES.PADDING.SMALL,
  },
  editButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: SIZES.RADIUS.SMALL,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
  },
  editButtonText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
  },
  statusButton: {
    backgroundColor: COLORS.WARNING,
    borderRadius: SIZES.RADIUS.SMALL,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
  },
  statusButtonText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: COLORS.ERROR,
    borderRadius: SIZES.RADIUS.SMALL,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
  },
  deleteButtonText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.PADDING.XXXLARGE,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  emptyTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
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
    color: COLORS.PRIMARY,
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

  // Selectors
  citySelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.PADDING.SMALL,
  },
  cityOption: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    borderWidth: 1,
    borderColor: 'transparent',
    minWidth: '30%',
    alignItems: 'center',
  },
  selectedCityOption: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
  },
  cityOptionText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
  },
  selectedCityOptionText: {
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },

  statusSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.PADDING.SMALL,
  },
  statusOption: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    borderWidth: 1,
    borderColor: 'transparent',
    minWidth: '22%',
    alignItems: 'center',
  },
  selectedStatusOption: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
  },
  statusOptionText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
  },
  selectedStatusOptionText: {
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
});

export default DealerManagementScreen;
