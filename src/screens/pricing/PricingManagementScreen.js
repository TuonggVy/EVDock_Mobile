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

const { width } = Dimensions.get('window');

const PricingManagementScreen = ({ navigation }) => {
  const [pricingRules, setPricingRules] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [vehicleModels, setVehicleModels] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('active'); // 'active', 'suspended', 'expired'
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [newRule, setNewRule] = useState({
    dealerId: '',
    vehicleModel: '',
    wholesalePrice: '',
    discountRate: '',
    minQuantity: '',
    maxQuantity: '',
    validFrom: '',
    validTo: '',
    status: 'active',
    notes: '',
  });

  const { alertConfig, hideAlert, showSuccess, showError, showConfirm, showInfo } = useCustomAlert();

  // Mock data for dealers
  const mockDealers = [
    { id: 'DLR001', name: 'AutoWorld Hanoi', code: 'AWH', city: 'Hà Nội' },
    { id: 'DLR002', name: 'EcoCar HCMC', code: 'ECH', city: 'TP. Hồ Chí Minh' },
    { id: 'DLR003', name: 'Green Motors Da Nang', code: 'GMD', city: 'Đà Nẵng' },
    { id: 'DLR004', name: 'Future Auto Can Tho', code: 'FAC', city: 'Cần Thơ' },
    { id: 'DLR005', name: 'Smart Cars Hai Phong', code: 'SCH', city: 'Hải Phòng' },
  ];

  // Mock data for vehicle models
  const mockVehicleModels = [
    { id: 'MODEL_X', name: 'Model X', basePrice: 120000000 },
    { id: 'MODEL_Y', name: 'Model Y', basePrice: 95000000 },
    { id: 'MODEL_V', name: 'Model V', basePrice: 85000000 },
    { id: 'MODEL_Z', name: 'Model Z', basePrice: 150000000 },
    { id: 'MODEL_S', name: 'Model S', basePrice: 110000000 },
    { id: 'MODEL_3', name: 'Model 3', basePrice: 75000000 },
  ];

  // Mock data for pricing rules
  const mockPricingRules = [
    {
      id: 'PRC001',
      dealerId: 'DLR001',
      dealerName: 'AutoWorld Hanoi',
      dealerCode: 'AWH',
      vehicleModel: 'Model X',
      wholesalePrice: 100000000,
      discountRate: 5.5,
      minQuantity: 1,
      maxQuantity: 10,
      validFrom: '2024-01-01',
      validTo: '2024-12-31',
      status: 'active',
      notes: 'Giá sỉ cho đại lý chính thức',
      basePrice: 120000000,
      savings: 20000000,
      createdAt: '2024-01-15',
    },
    {
      id: 'PRC002',
      dealerId: 'DLR001',
      dealerName: 'AutoWorld Hanoi',
      dealerCode: 'AWH',
      vehicleModel: 'Model Y',
      wholesalePrice: 80000000,
      discountRate: 6.0,
      minQuantity: 1,
      maxQuantity: 15,
      validFrom: '2024-01-01',
      validTo: '2024-12-31',
      status: 'active',
      notes: 'Giá sỉ cho đại lý chính thức',
      basePrice: 95000000,
      savings: 15000000,
      createdAt: '2024-01-15',
    },
    {
      id: 'PRC003',
      dealerId: 'DLR002',
      dealerName: 'EcoCar HCMC',
      dealerCode: 'ECH',
      vehicleModel: 'Model X',
      wholesalePrice: 105000000,
      discountRate: 4.5,
      minQuantity: 5,
      maxQuantity: 20,
      validFrom: '2024-02-01',
      validTo: '2024-12-31',
      status: 'active',
      notes: 'Giá sỉ cho đại lý lớn',
      basePrice: 120000000,
      savings: 15000000,
      createdAt: '2024-02-01',
    },
    {
      id: 'PRC004',
      dealerId: 'DLR003',
      dealerName: 'Green Motors Da Nang',
      dealerCode: 'GMD',
      vehicleModel: 'Model V',
      wholesalePrice: 70000000,
      discountRate: 7.0,
      minQuantity: 1,
      maxQuantity: 5,
      validFrom: '2024-01-01',
      validTo: '2024-06-30',
      status: 'expired',
      notes: 'Giá sỉ đặc biệt cho đại lý mới',
      basePrice: 85000000,
      savings: 15000000,
      createdAt: '2024-01-01',
    },
    {
      id: 'PRC005',
      dealerId: 'DLR004',
      dealerName: 'Future Auto Can Tho',
      dealerCode: 'FAC',
      vehicleModel: 'Model Z',
      wholesalePrice: 130000000,
      discountRate: 3.0,
      minQuantity: 2,
      maxQuantity: 8,
      validFrom: '2024-03-01',
      validTo: '2024-12-31',
      status: 'suspended',
      notes: 'Giá sỉ tạm dừng do vi phạm',
      basePrice: 150000000,
      savings: 20000000,
      createdAt: '2024-03-01',
    },
  ];

  // Mock status options
  const statusOptions = [
    { value: 'active', label: 'Hoạt động', color: COLORS.SUCCESS },
    { value: 'suspended', label: 'Tạm dừng', color: COLORS.WARNING },
    { value: 'expired', label: 'Hết hạn', color: COLORS.ERROR },
    { value: 'pending', label: 'Chờ duyệt', color: COLORS.INFO },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Simulate API calls
      await new Promise(resolve => setTimeout(resolve, 500));
      setPricingRules(mockPricingRules);
      setDealers(mockDealers);
      setVehicleModels(mockVehicleModels);
    } catch (error) {
      showError('Lỗi', 'Không thể tải dữ liệu');
    }
  };

  const filteredPricingRules = pricingRules.filter(rule => {
    const matchesSearch = rule.dealerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.dealerCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.vehicleModel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTab = activeTab === 'active' 
      ? rule.status === 'active'
      : activeTab === 'suspended'
      ? rule.status === 'suspended'
      : rule.status === 'expired';
    
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
      case 'expired': return '❌';
      case 'pending': return '⏳';
      default: return '❓';
    }
  };

  const handleAddRule = () => {
    setNewRule({
      dealerId: '',
      vehicleModel: '',
      wholesalePrice: '',
      discountRate: '',
      minQuantity: '',
      maxQuantity: '',
      validFrom: '',
      validTo: '',
      status: 'active',
      notes: '',
    });
    setShowAddModal(true);
  };

  const handleEditRule = (rule) => {
    setEditingRule(rule);
    setNewRule({
      dealerId: rule.dealerId,
      vehicleModel: rule.vehicleModel,
      wholesalePrice: rule.wholesalePrice.toString(),
      discountRate: rule.discountRate.toString(),
      minQuantity: rule.minQuantity.toString(),
      maxQuantity: rule.maxQuantity.toString(),
      validFrom: rule.validFrom,
      validTo: rule.validTo,
      status: rule.status,
      notes: rule.notes,
    });
    setShowEditModal(true);
  };

  const handleSaveRule = async () => {
    if (!newRule.dealerId || !newRule.vehicleModel || !newRule.wholesalePrice || !newRule.discountRate) {
      showError('Lỗi', 'Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    try {
      const selectedDealer = dealers.find(d => d.id === newRule.dealerId);
      const selectedModel = vehicleModels.find(m => m.id === newRule.vehicleModel);
      
      const ruleData = {
        ...newRule,
        id: editingRule ? editingRule.id : `PRC${Date.now()}${Math.random().toString(36).substr(2, 5)}`,
        dealerName: selectedDealer?.name || '',
        dealerCode: selectedDealer?.code || '',
        wholesalePrice: parseInt(newRule.wholesalePrice),
        discountRate: parseFloat(newRule.discountRate),
        minQuantity: parseInt(newRule.minQuantity) || 1,
        maxQuantity: parseInt(newRule.maxQuantity) || 999,
        basePrice: selectedModel?.basePrice || 0,
        savings: (selectedModel?.basePrice || 0) - parseInt(newRule.wholesalePrice),
        createdAt: editingRule ? editingRule.createdAt : new Date().toISOString().split('T')[0],
      };

      if (editingRule) {
        setPricingRules(pricingRules.map(rule => rule.id === editingRule.id ? ruleData : rule));
        setShowEditModal(false);
        setEditingRule(null);
        showSuccess('Thành công', 'Cập nhật quy tắc giá thành công!');
      } else {
        setPricingRules([ruleData, ...pricingRules]);
        setShowAddModal(false);
        showSuccess('Thành công', 'Thêm mới quy tắc giá thành công!');
      }

      setNewRule({
        dealerId: '',
        vehicleModel: '',
        wholesalePrice: '',
        discountRate: '',
        minQuantity: '',
        maxQuantity: '',
        validFrom: '',
        validTo: '',
        status: 'active',
        notes: '',
      });
    } catch (error) {
      console.error('Error saving rule:', error);
      showError('Lỗi', 'Không thể lưu quy tắc giá');
    }
  };

  const handleDeleteRule = (ruleId) => {
    showConfirm(
      'Xác nhận xóa',
      'Bạn có chắc chắn muốn xóa quy tắc giá này?',
      () => {
        setPricingRules(pricingRules.filter(rule => rule.id !== ruleId));
        showSuccess('Thành công', 'Xóa quy tắc giá thành công!');
      }
    );
  };

  const handleStatusChange = (ruleId, newStatus) => {
    showConfirm(
      'Xác nhận thay đổi trạng thái',
      `Bạn có chắc chắn muốn thay đổi trạng thái quy tắc giá thành "${getStatusText(newStatus)}"?`,
      () => {
        setPricingRules(pricingRules.map(rule => 
          rule.id === ruleId ? { ...rule, status: newStatus } : rule
        ));
        showSuccess('Thành công', 'Cập nhật trạng thái thành công!');
      }
    );
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const renderPricingRuleCard = (rule) => (
    <View key={rule.id} style={styles.ruleCard}>
      <View style={styles.cardHeader}>
        <View style={styles.ruleInfo}>
          <Text style={styles.ruleId}>{rule.id}</Text>
          <Text style={styles.dealerName}>{rule.dealerName} ({rule.dealerCode})</Text>
          <Text style={styles.vehicleModel}>{rule.vehicleModel}</Text>
        </View>
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(rule.status) }]}>
            <Text style={styles.statusIcon}>{getStatusIcon(rule.status)}</Text>
            <Text style={styles.statusText}>{getStatusText(rule.status)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.priceSection}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Giá gốc:</Text>
            <Text style={styles.basePrice}>{formatPrice(rule.basePrice)}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Giá sỉ:</Text>
            <Text style={styles.wholesalePrice}>{formatPrice(rule.wholesalePrice)}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Tiết kiệm:</Text>
            <Text style={styles.savingsPrice}>{formatPrice(rule.savings)}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Chiết khấu:</Text>
            <Text style={styles.discountRate}>{rule.discountRate}%</Text>
          </View>
        </View>

        <View style={styles.quantitySection}>
          <Text style={styles.sectionTitle}>Số lượng áp dụng:</Text>
          <Text style={styles.quantityRange}>
            Từ {rule.minQuantity} đến {rule.maxQuantity} xe
          </Text>
        </View>

        <View style={styles.validitySection}>
          <Text style={styles.sectionTitle}>Thời gian áp dụng:</Text>
          <Text style={styles.validityRange}>
            {rule.validFrom} - {rule.validTo}
          </Text>
        </View>

        {rule.notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesLabel}>Ghi chú:</Text>
            <Text style={styles.notesValue}>{rule.notes}</Text>
          </View>
        )}
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => handleEditRule(rule)}
        >
          <Text style={styles.editButtonText}>Chỉnh sửa</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.statusButton}
          onPress={() => handleStatusChange(rule.id, rule.status === 'active' ? 'suspended' : 'active')}
        >
          <Text style={styles.statusButtonText}>
            {rule.status === 'active' ? 'Tạm dừng' : 'Kích hoạt'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteRule(rule.id)}
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
              setEditingRule(null);
              setNewRule({
                dealerId: '',
                vehicleModel: '',
                wholesalePrice: '',
                discountRate: '',
                minQuantity: '',
                maxQuantity: '',
                validFrom: '',
                validTo: '',
                status: 'active',
                notes: '',
              });
            }}
          >
            <Text style={styles.modalCloseText}>Hủy</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>
            {editingRule ? 'Chỉnh sửa quy tắc giá' : 'Thêm mới quy tắc giá'}
          </Text>
          <TouchableOpacity
            style={styles.modalSaveButton}
            onPress={handleSaveRule}
          >
            <Text style={styles.modalSaveText}>Lưu</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Đại lý *</Text>
            <View style={styles.dealerSelector}>
              {dealers.map((dealer) => (
                <TouchableOpacity
                  key={dealer.id}
                  style={[
                    styles.dealerOption,
                    newRule.dealerId === dealer.id && styles.selectedDealerOption
                  ]}
                  onPress={() => setNewRule({ ...newRule, dealerId: dealer.id })}
                >
                  <Text style={[
                    styles.dealerOptionText,
                    newRule.dealerId === dealer.id && styles.selectedDealerOptionText
                  ]}>
                    {dealer.name} ({dealer.code})
                  </Text>
                  <Text style={styles.dealerCityText}>{dealer.city}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Mẫu xe *</Text>
            <View style={styles.modelSelector}>
              {vehicleModels.map((model) => (
                <TouchableOpacity
                  key={model.id}
                  style={[
                    styles.modelOption,
                    newRule.vehicleModel === model.id && styles.selectedModelOption
                  ]}
                  onPress={() => setNewRule({ ...newRule, vehicleModel: model.id })}
                >
                  <Text style={[
                    styles.modelOptionText,
                    newRule.vehicleModel === model.id && styles.selectedModelOptionText
                  ]}>
                    {model.name}
                  </Text>
                  <Text style={styles.modelPriceText}>
                    Giá gốc: {formatPrice(model.basePrice)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Giá sỉ (VND) *</Text>
            <TextInput
              style={styles.textInput}
              value={newRule.wholesalePrice}
              onChangeText={(text) => setNewRule({ ...newRule, wholesalePrice: text })}
              placeholder="Nhập giá sỉ"
              placeholderTextColor={COLORS.TEXT.SECONDARY}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Tỷ lệ chiết khấu (%) *</Text>
            <TextInput
              style={styles.textInput}
              value={newRule.discountRate}
              onChangeText={(text) => setNewRule({ ...newRule, discountRate: text })}
              placeholder="Nhập tỷ lệ chiết khấu"
              placeholderTextColor={COLORS.TEXT.SECONDARY}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Số lượng tối thiểu</Text>
            <TextInput
              style={styles.textInput}
              value={newRule.minQuantity}
              onChangeText={(text) => setNewRule({ ...newRule, minQuantity: text })}
              placeholder="Nhập số lượng tối thiểu"
              placeholderTextColor={COLORS.TEXT.SECONDARY}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Số lượng tối đa</Text>
            <TextInput
              style={styles.textInput}
              value={newRule.maxQuantity}
              onChangeText={(text) => setNewRule({ ...newRule, maxQuantity: text })}
              placeholder="Nhập số lượng tối đa"
              placeholderTextColor={COLORS.TEXT.SECONDARY}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Ngày bắt đầu</Text>
            <TextInput
              style={styles.textInput}
              value={newRule.validFrom}
              onChangeText={(text) => setNewRule({ ...newRule, validFrom: text })}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={COLORS.TEXT.SECONDARY}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Ngày kết thúc</Text>
            <TextInput
              style={styles.textInput}
              value={newRule.validTo}
              onChangeText={(text) => setNewRule({ ...newRule, validTo: text })}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={COLORS.TEXT.SECONDARY}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Trạng thái</Text>
            <View style={styles.statusSelector}>
              {statusOptions.map((status) => (
                <TouchableOpacity
                  key={status.value}
                  style={[
                    styles.statusOption,
                    newRule.status === status.value && styles.selectedStatusOption
                  ]}
                  onPress={() => setNewRule({ ...newRule, status: status.value })}
                >
                  <Text style={[
                    styles.statusOptionText,
                    newRule.status === status.value && styles.selectedStatusOptionText
                  ]}>
                    {status.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Ghi chú</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={newRule.notes}
              onChangeText={(text) => setNewRule({ ...newRule, notes: text })}
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
  const totalRules = pricingRules.length;
  const activeRules = pricingRules.filter(rule => rule.status === 'active').length;
  const suspendedRules = pricingRules.filter(rule => rule.status === 'suspended').length;
  const expiredRules = pricingRules.filter(rule => rule.status === 'expired').length;
  const totalSavings = pricingRules.reduce((sum, rule) => sum + rule.savings, 0);

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
        <Text style={styles.headerTitle}>Quản lý giá sỉ</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddRule}
        >
          <Text style={styles.addIcon}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm đại lý, mẫu xe, mã quy tắc..."
          placeholderTextColor={COLORS.TEXT.SECONDARY}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalRules}</Text>
          <Text style={styles.statLabel}>Tổng quy tắc</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: COLORS.SUCCESS }]}>{activeRules}</Text>
          <Text style={styles.statLabel}>Hoạt động</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: COLORS.WARNING }]}>{suspendedRules}</Text>
          <Text style={styles.statLabel}>Tạm dừng</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: COLORS.ERROR }]}>{expiredRules}</Text>
          <Text style={styles.statLabel}>Hết hạn</Text>
        </View>
      </View>

      {/* Total Savings Card */}
      <View style={styles.savingsCard}>
        <Text style={styles.savingsLabel}>Tổng tiết kiệm cho đại lý</Text>
        <Text style={styles.savingsAmount}>{formatPrice(totalSavings)}</Text>
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
            Hoạt động ({activeRules})
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
            Tạm dừng ({suspendedRules})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'expired' && styles.activeTabButton
          ]}
          onPress={() => setActiveTab('expired')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'expired' && styles.activeTabText
          ]}>
            Hết hạn ({expiredRules})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Pricing Rules List */}
      <ScrollView
        style={styles.rulesList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.rulesContent}
      >
        {filteredPricingRules.length > 0 ? (
          filteredPricingRules.map(renderPricingRuleCard)
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>
              {activeTab === 'active' ? '💰' : activeTab === 'suspended' ? '⚠️' : '❌'}
            </Text>
            <Text style={styles.emptyTitle}>
              {activeTab === 'active' 
                ? 'Không có quy tắc giá hoạt động' 
                : activeTab === 'suspended'
                ? 'Không có quy tắc giá tạm dừng'
                : 'Không có quy tắc giá hết hạn'
              }
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'active'
                ? 'Tất cả quy tắc giá đều đang tạm dừng hoặc hết hạn'
                : activeTab === 'suspended'
                ? 'Tất cả quy tắc giá đều đang hoạt động hoặc hết hạn'
                : 'Tất cả quy tắc giá đều đang hoạt động hoặc tạm dừng'
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

  // Savings Card
  savingsCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
    marginHorizontal: SIZES.PADDING.MEDIUM,
    marginBottom: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
  },
  savingsLabel: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: SIZES.PADDING.SMALL,
  },
  savingsAmount: {
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
    paddingHorizontal: SIZES.PADDING.SMALL,
    borderRadius: SIZES.RADIUS.SMALL,
    alignItems: 'center',
  },
  activeTabButton: {
    backgroundColor: COLORS.PRIMARY,
  },
  tabText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    fontWeight: '600',
  },
  activeTabText: {
    color: COLORS.TEXT.WHITE,
  },

  // Rules List
  rulesList: {
    flex: 1,
  },
  rulesContent: {
    padding: SIZES.PADDING.MEDIUM,
  },
  ruleCard: {
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
  ruleInfo: {
    flex: 1,
  },
  ruleId: {
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
  vehicleModel: {
    fontSize: SIZES.FONT.MEDIUM,
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
  priceSection: {
    marginBottom: SIZES.PADDING.SMALL,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  priceLabel: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
  },
  basePrice: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    textDecorationLine: 'line-through',
  },
  wholesalePrice: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
  },
  savingsPrice: {
    fontSize: SIZES.FONT.SMALL,
    fontWeight: 'bold',
    color: COLORS.SUCCESS,
  },
  discountRate: {
    fontSize: SIZES.FONT.SMALL,
    fontWeight: 'bold',
    color: COLORS.WARNING,
  },
  quantitySection: {
    marginBottom: SIZES.PADDING.SMALL,
  },
  sectionTitle: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: 4,
  },
  quantityRange: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.PRIMARY,
  },
  validitySection: {
    marginBottom: SIZES.PADDING.SMALL,
  },
  validityRange: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.PRIMARY,
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
  dealerSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.PADDING.SMALL,
  },
  dealerOption: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    borderWidth: 1,
    borderColor: 'transparent',
    minWidth: '45%',
    alignItems: 'center',
  },
  selectedDealerOption: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
  },
  dealerOptionText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '600',
  },
  selectedDealerOptionText: {
    color: COLORS.PRIMARY,
  },
  dealerCityText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    marginTop: 2,
  },

  modelSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.PADDING.SMALL,
  },
  modelOption: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    borderWidth: 1,
    borderColor: 'transparent',
    minWidth: '30%',
    alignItems: 'center',
  },
  selectedModelOption: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
  },
  modelOptionText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '600',
  },
  selectedModelOptionText: {
    color: COLORS.PRIMARY,
  },
  modelPriceText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    marginTop: 2,
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

export default PricingManagementScreen;
