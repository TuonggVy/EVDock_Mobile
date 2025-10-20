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
import dealerService from '../../services/dealerService';

const { width } = Dimensions.get('window');

const DealerManagementScreen = ({ navigation }) => {
  const [dealers, setDealers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'suspended'
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDealer, setEditingDealer] = useState(null);
  const [newDealer, setNewDealer] = useState({
    name: '',
    code: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    status: 'active',
    contractStartDate: '',
    contractEndDate: '',
    commissionRate: '',
    notes: '',
  });

  const { alertConfig, hideAlert, showSuccess, showError, showConfirm, showInfo } = useCustomAlert();

  // No hardcoded dealers; load from service/storage

  // Derived cities from dealer data
  const cities = Array.from(new Set((dealers || []).map(d => d.city).filter(Boolean)));

  // Mock status options
  const statusOptions = [
    { value: 'active', label: 'Hoạt động', color: COLORS.SUCCESS },
    { value: 'suspended', label: 'Tạm dừng', color: COLORS.WARNING },
    { value: 'inactive', label: 'Không hoạt động', color: COLORS.ERROR },
    { value: 'pending', label: 'Chờ duyệt', color: COLORS.INFO },
  ];

  useEffect(() => {
    loadDealers();
  }, []);

  const loadDealers = async () => {
    try {
      const res = await dealerService.getDealers();
      if (res?.success) setDealers(res.data || []);
      else showError('Lỗi', res?.error || 'Không thể tải danh sách đại lý');
    } catch (error) {
      showError('Lỗi', 'Không thể tải danh sách đại lý');
    }
  };

  const filteredDealers = dealers.filter(dealer => {
    const matchesSearch = dealer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dealer.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dealer.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dealer.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dealer.phone.includes(searchQuery);
    
    const matchesTab = activeTab === 'active' 
      ? dealer.status === 'active'
      : dealer.status === 'suspended';
    
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
      case 'active': return '✅';
      case 'suspended': return '⚠️';
      case 'inactive': return '❌';
      case 'pending': return '⏳';
      default: return '❓';
    }
  };

  const handleAddDealer = () => {
    setNewDealer({
      name: '',
      code: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      status: 'active',
      contractStartDate: '',
      contractEndDate: '',
      commissionRate: '',
      notes: '',
    });
    setShowAddModal(true);
  };

  const handleEditDealer = (dealer) => {
    setEditingDealer(dealer);
    setNewDealer({
      name: dealer.name,
      code: dealer.code,
      contactPerson: dealer.contactPerson,
      phone: dealer.phone,
      email: dealer.email,
      address: dealer.address,
      city: dealer.city,
      status: dealer.status,
      contractStartDate: dealer.contractStartDate,
      contractEndDate: dealer.contractEndDate,
      commissionRate: dealer.commissionRate.toString(),
      notes: dealer.notes,
    });
    setShowEditModal(true);
  };

  const handleSaveDealer = async () => {
    if (!newDealer.name || !newDealer.code || !newDealer.contactPerson || !newDealer.phone || !newDealer.email) {
      showError('Lỗi', 'Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    try {
      const dealerData = {
        ...newDealer,
        id: editingDealer ? editingDealer.id : `DLR${Date.now()}${Math.random().toString(36).substr(2, 5)}`,
        commissionRate: parseFloat(newDealer.commissionRate) || 0,
        totalSales: editingDealer ? editingDealer.totalSales : 0,
        totalVehicles: editingDealer ? editingDealer.totalVehicles : 0,
        lastOrderDate: editingDealer ? editingDealer.lastOrderDate : null,
        rating: editingDealer ? editingDealer.rating : 0,
      };

      const res = editingDealer
        ? await dealerService.updateDealer(editingDealer.id, dealerData)
        : await dealerService.createDealer(dealerData);

      if (res?.success) {
        await loadDealers();
        if (editingDealer) {
          setShowEditModal(false);
          setEditingDealer(null);
          showSuccess('Thành công', 'Cập nhật đại lý thành công!');
        } else {
          setShowAddModal(false);
          showSuccess('Thành công', 'Thêm mới đại lý thành công!');
        }
      } else {
        showError('Lỗi', res?.error || 'Không thể lưu thông tin đại lý');
      }

      setNewDealer({
        name: '',
        code: '',
        contactPerson: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        status: 'active',
        contractStartDate: '',
        contractEndDate: '',
        commissionRate: '',
        notes: '',
      });
    } catch (error) {
      console.error('Error saving dealer:', error);
      showError('Lỗi', 'Không thể lưu thông tin đại lý');
    }
  };

  const handleDeleteDealer = (dealerId) => {
    showConfirm(
      'Xác nhận xóa',
      'Bạn có chắc chắn muốn xóa đại lý này?',
      async () => {
        const res = await dealerService.deleteDealer(dealerId);
        if (res?.success) {
          await loadDealers();
          showSuccess('Thành công', 'Xóa đại lý thành công!');
        } else {
          showError('Lỗi', res?.error || 'Không thể xóa đại lý');
        }
      }
    );
  };

  const handleStatusChange = (dealerId, newStatus) => {
    showConfirm(
      'Xác nhận thay đổi trạng thái',
      `Bạn có chắc chắn muốn thay đổi trạng thái đại lý thành "${getStatusText(newStatus)}"?`,
      async () => {
        const res = await dealerService.updateDealerStatus(dealerId, newStatus);
        if (res?.success) {
          await loadDealers();
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

  const renderDealerCard = (dealer) => (
    <View key={dealer.id} style={styles.dealerCard}>
      <View style={styles.cardHeader}>
        <View style={styles.dealerInfo}>
          <Text style={styles.dealerCode}>{dealer.code}</Text>
          <Text style={styles.dealerName}>{dealer.name}</Text>
          <Text style={styles.dealerCity}>{dealer.city}</Text>
        </View>
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(dealer.status) }]}>
            <Text style={styles.statusIcon}>{getStatusIcon(dealer.status)}</Text>
            <Text style={styles.statusText}>{getStatusText(dealer.status)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.contactInfo}>
          <Text style={styles.contactLabel}>Liên hệ:</Text>
          <Text style={styles.contactValue}>{dealer.contactPerson}</Text>
          <Text style={styles.contactDetail}>{dealer.phone}</Text>
          <Text style={styles.contactDetail}>{dealer.email}</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatPrice(dealer.totalSales)}</Text>
            <Text style={styles.statLabel}>Doanh thu</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{dealer.totalVehicles}</Text>
            <Text style={styles.statLabel}>Xe bán</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{dealer.rating}⭐</Text>
            <Text style={styles.statLabel}>Đánh giá</Text>
          </View>
        </View>

        <View style={styles.contractInfo}>
          <Text style={styles.contractLabel}>Hợp đồng:</Text>
          <Text style={styles.contractValue}>
            {dealer.contractStartDate} - {dealer.contractEndDate}
          </Text>
          <Text style={styles.commissionRate}>
            Hoa hồng: {dealer.commissionRate}%
          </Text>
        </View>

        {dealer.notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesLabel}>Ghi chú:</Text>
            <Text style={styles.notesValue}>{dealer.notes}</Text>
          </View>
        )}
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => handleEditDealer(dealer)}
        >
          <Text style={styles.editButtonText}>Chỉnh sửa</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.statusButton}
          onPress={() => handleStatusChange(dealer.id, dealer.status === 'active' ? 'suspended' : 'active')}
        >
          <Text style={styles.statusButtonText}>
            {dealer.status === 'active' ? 'Tạm dừng' : 'Kích hoạt'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteDealer(dealer.id)}
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
              setEditingDealer(null);
              setNewDealer({
                name: '',
                code: '',
                contactPerson: '',
                phone: '',
                email: '',
                address: '',
                city: '',
                status: 'active',
                contractStartDate: '',
                contractEndDate: '',
                commissionRate: '',
                notes: '',
              });
            }}
          >
            <Text style={styles.modalCloseText}>Hủy</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>
            {editingDealer ? 'Chỉnh sửa đại lý' : 'Thêm mới đại lý'}
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
              value={newDealer.name}
              onChangeText={(text) => setNewDealer({ ...newDealer, name: text })}
              placeholder="Nhập tên đại lý"
              placeholderTextColor={COLORS.TEXT.SECONDARY}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Mã đại lý *</Text>
            <TextInput
              style={styles.textInput}
              value={newDealer.code}
              onChangeText={(text) => setNewDealer({ ...newDealer, code: text.toUpperCase() })}
              placeholder="Nhập mã đại lý"
              placeholderTextColor={COLORS.TEXT.SECONDARY}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Người liên hệ *</Text>
            <TextInput
              style={styles.textInput}
              value={newDealer.contactPerson}
              onChangeText={(text) => setNewDealer({ ...newDealer, contactPerson: text })}
              placeholder="Nhập tên người liên hệ"
              placeholderTextColor={COLORS.TEXT.SECONDARY}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Số điện thoại *</Text>
            <TextInput
              style={styles.textInput}
              value={newDealer.phone}
              onChangeText={(text) => setNewDealer({ ...newDealer, phone: text })}
              placeholder="Nhập số điện thoại"
              placeholderTextColor={COLORS.TEXT.SECONDARY}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email *</Text>
            <TextInput
              style={styles.textInput}
              value={newDealer.email}
              onChangeText={(text) => setNewDealer({ ...newDealer, email: text })}
              placeholder="Nhập email"
              placeholderTextColor={COLORS.TEXT.SECONDARY}
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Địa chỉ</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={newDealer.address}
              onChangeText={(text) => setNewDealer({ ...newDealer, address: text })}
              placeholder="Nhập địa chỉ"
              placeholderTextColor={COLORS.TEXT.SECONDARY}
              multiline
              numberOfLines={2}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Thành phố</Text>
            <View style={styles.citySelector}>
              {cities.map((city) => (
                <TouchableOpacity
                  key={city}
                  style={[
                    styles.cityOption,
                    newDealer.city === city && styles.selectedCityOption
                  ]}
                  onPress={() => setNewDealer({ ...newDealer, city: city })}
                >
                  <Text style={[
                    styles.cityOptionText,
                    newDealer.city === city && styles.selectedCityOptionText
                  ]}>
                    {city}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Trạng thái</Text>
            <View style={styles.statusSelector}>
              {statusOptions.map((status) => (
                <TouchableOpacity
                  key={status.value}
                  style={[
                    styles.statusOption,
                    newDealer.status === status.value && styles.selectedStatusOption
                  ]}
                  onPress={() => setNewDealer({ ...newDealer, status: status.value })}
                >
                  <Text style={[
                    styles.statusOptionText,
                    newDealer.status === status.value && styles.selectedStatusOptionText
                  ]}>
                    {status.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Ngày bắt đầu hợp đồng</Text>
            <TextInput
              style={styles.textInput}
              value={newDealer.contractStartDate}
              onChangeText={(text) => setNewDealer({ ...newDealer, contractStartDate: text })}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={COLORS.TEXT.SECONDARY}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Ngày kết thúc hợp đồng</Text>
            <TextInput
              style={styles.textInput}
              value={newDealer.contractEndDate}
              onChangeText={(text) => setNewDealer({ ...newDealer, contractEndDate: text })}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={COLORS.TEXT.SECONDARY}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Tỷ lệ hoa hồng (%)</Text>
            <TextInput
              style={styles.textInput}
              value={newDealer.commissionRate}
              onChangeText={(text) => setNewDealer({ ...newDealer, commissionRate: text })}
              placeholder="Nhập tỷ lệ hoa hồng"
              placeholderTextColor={COLORS.TEXT.SECONDARY}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Ghi chú</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={newDealer.notes}
              onChangeText={(text) => setNewDealer({ ...newDealer, notes: text })}
              placeholder="Nhập ghi chú (nếu có)"
              placeholderTextColor={COLORS.TEXT.SECONDARY}
              multiline
              numberOfLines={3}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  // Calculate statistics
  const totalDealers = dealers.length;
  const activeDealers = dealers.filter(dealer => dealer.status === 'active').length;
  const suspendedDealers = dealers.filter(dealer => dealer.status === 'suspended').length;
  const totalSales = dealers.reduce((sum, dealer) => sum + dealer.totalSales, 0);
  const totalVehicles = dealers.reduce((sum, dealer) => sum + dealer.totalVehicles, 0);

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
        <Text style={styles.headerTitle}>Quản lý đại lý</Text>
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
          <Text style={styles.statNumber}>{totalDealers}</Text>
          <Text style={styles.statLabel}>Tổng đại lý</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: COLORS.SUCCESS }]}>{activeDealers}</Text>
          <Text style={styles.statLabel}>Hoạt động</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: COLORS.WARNING }]}>{suspendedDealers}</Text>
          <Text style={styles.statLabel}>Tạm dừng</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: COLORS.PRIMARY }]}>{totalVehicles}</Text>
          <Text style={styles.statLabel}>Xe bán</Text>
        </View>
      </View>

      {/* Total Sales Card */}
      <View style={styles.salesCard}>
        <Text style={styles.salesLabel}>Tổng doanh thu từ đại lý</Text>
        <Text style={styles.salesAmount}>{formatPrice(totalSales)}</Text>
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
            Đang hoạt động ({activeDealers})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'suspended' && styles.activeTabButton
          ]}
          onPress={() => setActiveTab('suspended')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'suspended' && styles.activeTabText
          ]}>
            Tạm dừng ({suspendedDealers})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Dealers List */}
      <ScrollView
        style={styles.dealersList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.dealersContent}
      >
        {filteredDealers.length > 0 ? (
          filteredDealers.map(renderDealerCard)
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>
              {activeTab === 'active' ? '🏢' : '⚠️'}
            </Text>
            <Text style={styles.emptyTitle}>
              {activeTab === 'active' 
                ? 'Không có đại lý đang hoạt động' 
                : 'Không có đại lý tạm dừng'
              }
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'active'
                ? 'Tất cả đại lý đều đang tạm dừng hoặc chưa có đại lý nào'
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
