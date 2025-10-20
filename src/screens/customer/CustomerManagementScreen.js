import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES } from '../../constants';
import { CalendarCheck, Check, Phone, Car } from 'lucide-react-native';
import useCustomerManagement from '../../hooks/useCustomerManagement';
import {
  formatPrice,
  formatDate,
  getRequestStatusColor,
  getRequestStatusText,
  getViewingStatusColor,
  getViewingStatusText,
} from '../../utils/customerManagementUtils';

const CustomerManagementScreen = ({ navigation }) => {
  // Local UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showTestDriveModal, setShowTestDriveModal] = useState(false);
  const [showViewingModal, setShowViewingModal] = useState(false);
  const [activeTab, setActiveTab] = useState('customers'); // 'customers', 'requests', or 'viewing'

  // Custom hook for data management
  const {
    customers,
    testDriveRequests,
    viewingRequests,
    loading,
    errors,
    addCustomer,
    scheduleTestDrive,
    completeTestDrive,
    scheduleViewing,
    completeViewing,
    cancelViewing,
    refresh,
    getFilteredData,
  } = useCustomerManagement();


  // Schedule form data
  const [scheduleForm, setScheduleForm] = useState({
    requestId: null,
    scheduledDate: '',
    scheduledTime: '',
    notes: '',
  });

  // Viewing schedule form data
  const [viewingForm, setViewingForm] = useState({
    requestId: null,
    scheduledDate: '',
    scheduledTime: '',
    location: '',
    notes: '',
  });



  const handleScheduleTestDrive = (request) => {
    setSelectedCustomer(request);
    setScheduleForm({
      ...scheduleForm,
      requestId: request.id,
    });
    setShowTestDriveModal(true);
  };

  const handleSubmitSchedule = async () => {
    if (!scheduleForm.scheduledDate || !scheduleForm.scheduledTime) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      await scheduleTestDrive({
        requestId: scheduleForm.requestId,
        scheduledDate: scheduleForm.scheduledDate,
        scheduledTime: scheduleForm.scheduledTime,
        notes: scheduleForm.notes,
      });

      Alert.alert(
        'Thành công',
        `Đã hẹn lịch lái thử cho ${selectedCustomer.customerName}\nMẫu xe: ${selectedCustomer.model}\nNgày: ${scheduleForm.scheduledDate}\nGiờ: ${scheduleForm.scheduledTime}`,
        [
          {
            text: 'OK',
            onPress: () => {
              setShowTestDriveModal(false);
              setScheduleForm({
                requestId: null,
                scheduledDate: '',
                scheduledTime: '',
                notes: '',
              });
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể hẹn lịch lái thử. Vui lòng thử lại.');
    }
  };

  const handleCompleteTestDrive = async (requestId) => {
    try {
      await completeTestDrive(requestId);
      Alert.alert('Thành công', 'Đã đánh dấu hoàn thành lái thử');
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể hoàn thành lái thử. Vui lòng thử lại.');
    }
  };

  const handleScheduleViewing = (request) => {
    setSelectedCustomer(request);
    setViewingForm({
      ...viewingForm,
      requestId: request.id,
      location: request.location || '',
    });
    setShowViewingModal(true);
  };

  const handleCompleteViewing = async (requestId) => {
    try {
      await completeViewing(requestId);
      Alert.alert('Thành công', 'Đã đánh dấu hoàn thành xem xe');
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể hoàn thành xem xe. Vui lòng thử lại.');
    }
  };

  const handleCancelViewing = (requestId) => {
    Alert.alert(
      'Xác nhận hủy',
      'Bạn có chắc chắn muốn hủy yêu cầu xem xe này?',
      [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Có',
          onPress: async () => {
            try {
              await cancelViewing(requestId, 'Hủy bởi nhân viên');
              Alert.alert('Thành công', 'Đã hủy yêu cầu xem xe');
            } catch (error) {
              Alert.alert('Lỗi', 'Không thể hủy yêu cầu xem xe. Vui lòng thử lại.');
            }
          }
        }
      ]
    );
  };

  const handleSubmitViewingSchedule = async () => {
    if (!viewingForm.scheduledDate || !viewingForm.scheduledTime || !viewingForm.location) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      await scheduleViewing({
        requestId: viewingForm.requestId,
        scheduledDate: viewingForm.scheduledDate,
        scheduledTime: viewingForm.scheduledTime,
        location: viewingForm.location,
        notes: viewingForm.notes,
      });

      Alert.alert(
        'Thành công',
        `Đã hẹn lịch xem xe cho ${selectedCustomer.customerName}\nMẫu xe: ${selectedCustomer.model}\nNgày: ${viewingForm.scheduledDate}\nGiờ: ${viewingForm.scheduledTime}\nĐịa điểm: ${viewingForm.location}`,
        [
          {
            text: 'OK',
            onPress: () => {
              setShowViewingModal(false);
              setViewingForm({
                requestId: null,
                scheduledDate: '',
                scheduledTime: '',
                location: '',
                notes: '',
              });
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể hẹn lịch xem xe. Vui lòng thử lại.');
    }
  };


  const renderCustomerCard = ({ item }) => (
    <View style={styles.customerCard}>
      {/* Header with gray background */}
      <LinearGradient
        colors={['#D9D9D9', '#D9D9D9']}
        style={styles.customerCardHeader}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.customerHeaderContent}>
          <View style={styles.customerAvatar}>
            <Text style={styles.customerAvatarText}>
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.customerBasicInfo}>
            <Text style={styles.customerCardName}>{item.name}</Text>
            <Text style={styles.customerPhoneHeader}>{item.phone}</Text>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>Đã mua</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Content */}
      <View style={styles.customerCardContent}>
        <View style={styles.vehicleInfoSection}>
          <View style={styles.vehicleInfoItem}>
            <Text style={styles.vehicleIcon}>🚗</Text>
            <View style={styles.vehicleDetails}>
              <Text style={styles.vehicleModel}>{item.vehicleModel}</Text>
              <Text style={styles.vehicleColor}>Màu: {item.vehicleColor}</Text>
            </View>
          </View>
        </View>

        <View style={styles.purchaseInfoSection}>
          <View style={styles.purchaseInfoItem}>
            <Text style={styles.purchaseIcon}>📅</Text>
            <View style={styles.purchaseDetails}>
              <Text style={styles.purchaseLabel}>Ngày mua</Text>
              <Text style={styles.purchaseDate}>{formatDate(item.purchaseDate)}</Text>
            </View>
          </View>
          
          <View style={styles.priceSection}>
            <Text style={styles.priceLabel}>Giá trị đơn</Text>
            <Text style={styles.priceValue}>{formatPrice(item.orderValue)}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderTestDriveRequestCard = ({ item }) => (
    <View style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <View style={styles.requestInfo}>
          <Text style={styles.customerName}>{item.customerName}</Text>
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, { backgroundColor: getRequestStatusColor(item.status) }]} />
            <Text style={[styles.statusText, { color: getRequestStatusColor(item.status) }]}>
              {getRequestStatusText(item.status)}
            </Text>
          </View>
        </View>
        <View style={styles.requestActions}>
          {item.status === 'pending' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.scheduleButton]}
              onPress={() => handleScheduleTestDrive(item)}
            >
              <CalendarCheck size={20} color="white" />
            </TouchableOpacity>
          )}
          {item.status === 'scheduled' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.completeButton]}
              onPress={() => handleCompleteTestDrive(item.id)}
            >
              <Check size={20} color="white" />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.actionButton}>
            <Phone size={20} color={COLORS.TEXT.SECONDARY} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.requestDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>🚗</Text>
          <Text style={styles.detailText}>{item.model}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>📱</Text>
          <Text style={styles.detailText}>{item.customerPhone}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>📅</Text>
          <Text style={styles.detailText}>
            Yêu cầu: {item.requestedDate}
            {item.scheduledDate && ` | Hẹn: ${item.scheduledDate} ${item.scheduledTime}`}
          </Text>
        </View>
        {item.notes && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>📝</Text>
            <Text style={styles.detailText}>{item.notes}</Text>
          </View>
        )}
      </View>

      <View style={styles.requestFooter}>
        <Text style={styles.createdAt}>Tạo lúc: {item.createdAt}</Text>
        {item.status === 'completed' && (
          <Text style={styles.completedText}>✅ Đã hoàn thành</Text>
        )}
      </View>
    </View>
  );

  const renderViewingRequestCard = ({ item }) => (
    <View style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <View style={styles.requestInfo}>
          <Text style={styles.customerName}>{item.customerName}</Text>
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, { backgroundColor: getViewingStatusColor(item.status) }]} />
            <Text style={[styles.statusText, { color: getViewingStatusColor(item.status) }]}>
              {getViewingStatusText(item.status)}
            </Text>
          </View>
        </View>
        <View style={styles.requestActions}>
          {item.status === 'pending' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.scheduleButton]}
              onPress={() => handleScheduleViewing(item)}
            >
              <CalendarCheck size={20} color="white" />
            </TouchableOpacity>
          )}
          {item.status === 'scheduled' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.completeButton]}
              onPress={() => handleCompleteViewing(item.id)}
            >
              <Check size={20} color="white" />
            </TouchableOpacity>
          )}
          {item.status === 'pending' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelActionButton]}
              onPress={() => handleCancelViewing(item.id)}
            >
              <Text style={styles.cancelIcon}>✕</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.actionButton}>
            <Phone size={20} color={COLORS.TEXT.SECONDARY} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.requestDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>🚗</Text>
          <Text style={styles.detailText}>{item.model}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>📱</Text>
          <Text style={styles.detailText}>{item.customerPhone}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>📧</Text>
          <Text style={styles.detailText}>{item.customerEmail}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>📍</Text>
          <Text style={styles.detailText}>{item.location}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>📅</Text>
          <Text style={styles.detailText}>
            Yêu cầu: {item.requestedDate} ({item.preferredTime})
            {item.scheduledDate && ` | Hẹn: ${item.scheduledDate} ${item.scheduledTime}`}
          </Text>
        </View>
        {item.notes && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>📝</Text>
            <Text style={styles.detailText}>{item.notes}</Text>
          </View>
        )}
        {item.feedback && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>💬</Text>
            <Text style={styles.detailText}>{item.feedback}</Text>
          </View>
        )}
      </View>

      <View style={styles.requestFooter}>
        <Text style={styles.createdAt}>Tạo lúc: {item.createdAt}</Text>
        {item.status === 'completed' && (
          <Text style={styles.completedText}>✅ Đã xem xe</Text>
        )}
        {item.status === 'cancelled' && (
          <Text style={styles.cancelledText}>❌ Đã hủy</Text>
        )}
      </View>
    </View>
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
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={styles.title}>Quản lý khách hàng</Text>
            <Text style={styles.subtitle}>
              {activeTab === 'customers' 
                ? `${customers.length} khách hàng đã mua` 
                : activeTab === 'requests' 
                ? `${testDriveRequests.length} yêu cầu lái thử`
                : `${viewingRequests.length} yêu cầu xem xe`
              }
            </Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'customers' && styles.activeTab]}
          onPress={() => setActiveTab('customers')}
        >
          <Text style={[styles.tabText, activeTab === 'customers' && styles.activeTabText]}>
            Khách hàng
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
          onPress={() => setActiveTab('requests')}
        >
          <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
            Lái thử
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'viewing' && styles.activeTab]}
          onPress={() => setActiveTab('viewing')}
        >
          <Text style={[styles.tabText, activeTab === 'viewing' && styles.activeTabText]}>
            Xem xe
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder={
            activeTab === 'customers' 
              ? "Tìm kiếm khách hàng đã mua..." 
              : activeTab === 'requests'
              ? "Tìm kiếm yêu cầu lái thử..."
              : "Tìm kiếm yêu cầu xem xe..."
          }
          placeholderTextColor={COLORS.TEXT.SECONDARY}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Content List */}
      <FlatList
        data={
          activeTab === 'customers' 
            ? getFilteredData(customers, searchQuery)
            : activeTab === 'requests'
            ? getFilteredData(testDriveRequests, searchQuery)
            : getFilteredData(viewingRequests, searchQuery)
        }
        renderItem={
          activeTab === 'customers' 
            ? renderCustomerCard 
            : activeTab === 'requests'
            ? renderTestDriveRequestCard
            : renderViewingRequestCard
        }
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshing={loading.customers || loading.testDriveRequests || loading.viewingRequests}
        onRefresh={refresh}
      />

      {/* Test Drive Registration Modal */}
      <Modal
        visible={showTestDriveModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTestDriveModal(false)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Hẹn lịch lái thử</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowTestDriveModal(false)}
              >
                <Text style={styles.closeIcon}>×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.customerInfo}>
                <Text style={styles.customerName}>{selectedCustomer?.customerName}</Text>
                <Text style={styles.customerPhone}>{selectedCustomer?.customerPhone}</Text>
                <Text style={styles.modelInfo}>Mẫu xe: {selectedCustomer?.model}</Text>
                <Text style={styles.requestInfo}>Yêu cầu ngày: {selectedCustomer?.requestedDate}</Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Ngày hẹn lái thử *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="DD/MM/YYYY"
                  value={scheduleForm.scheduledDate}
                  onChangeText={(text) => setScheduleForm({ ...scheduleForm, scheduledDate: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Giờ hẹn lái thử *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="HH:MM"
                  value={scheduleForm.scheduledTime}
                  onChangeText={(text) => setScheduleForm({ ...scheduleForm, scheduledTime: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Ghi chú thêm</Text>
                <TextInput
                  style={[styles.formInput, styles.textArea]}
                  placeholder="Ghi chú cho khách hàng..."
                  value={scheduleForm.notes}
                  onChangeText={(text) => setScheduleForm({ ...scheduleForm, notes: text })}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowTestDriveModal(false)}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmitSchedule}
              >
                <LinearGradient
                  colors={COLORS.GRADIENT.BLUE}
                  style={styles.submitGradient}
                >
                  <Text style={styles.submitButtonText}>Hẹn lịch</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Vehicle Viewing Schedule Modal */}
      <Modal
        visible={showViewingModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowViewingModal(false)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Hẹn lịch xem xe</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowViewingModal(false)}
              >
                <Text style={styles.closeIcon}>×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.customerInfo}>
                <Text style={styles.customerName}>{selectedCustomer?.customerName}</Text>
                <Text style={styles.customerPhone}>{selectedCustomer?.customerPhone}</Text>
                <Text style={styles.modelInfo}>Mẫu xe: {selectedCustomer?.model}</Text>
                <Text style={styles.requestInfo}>Yêu cầu ngày: {selectedCustomer?.requestedDate}</Text>
                <Text style={styles.requestInfo}>Thời gian ưa thích: {selectedCustomer?.preferredTime}</Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Ngày hẹn xem xe *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="DD/MM/YYYY"
                  value={viewingForm.scheduledDate}
                  onChangeText={(text) => setViewingForm({ ...viewingForm, scheduledDate: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Giờ hẹn xem xe *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="HH:MM"
                  value={viewingForm.scheduledTime}
                  onChangeText={(text) => setViewingForm({ ...viewingForm, scheduledTime: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Địa điểm xem xe *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Ví dụ: Showroom EVDock"
                  value={viewingForm.location}
                  onChangeText={(text) => setViewingForm({ ...viewingForm, location: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Ghi chú thêm</Text>
                <TextInput
                  style={[styles.formInput, styles.textArea]}
                  placeholder="Ghi chú cho khách hàng về việc xem xe..."
                  value={viewingForm.notes}
                  onChangeText={(text) => setViewingForm({ ...viewingForm, notes: text })}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowViewingModal(false)}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmitViewingSchedule}
              >
                <LinearGradient
                  colors={COLORS.GRADIENT.BLUE}
                  style={styles.submitGradient}
                >
                  <Text style={styles.submitButtonText}>Hẹn lịch xem xe</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
  },
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
  backIcon: {
    fontSize: SIZES.FONT.LARGE,
    color: COLORS.TEXT.WHITE,
    fontWeight: 'bold',
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  headerSpacer: {
    width: 40,
    height: 40,
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.SURFACE,
    marginHorizontal: SIZES.PADDING.LARGE,
    marginBottom: SIZES.PADDING.MEDIUM,
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.XSMALL,
  },
  tab: {
    flex: 1,
    paddingVertical: SIZES.PADDING.SMALL,
    alignItems: 'center',
    borderRadius: SIZES.RADIUS.SMALL,
  },
  activeTab: {
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.SURFACE,
    marginHorizontal: SIZES.PADDING.LARGE,
    marginBottom: SIZES.PADDING.LARGE,
    borderRadius: SIZES.RADIUS.LARGE,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
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
  listContainer: {
    paddingHorizontal: SIZES.PADDING.LARGE,
    paddingBottom: SIZES.PADDING.XXXLARGE,
  },
  customerCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.LARGE,
    marginBottom: SIZES.PADDING.MEDIUM,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  customerCardHeader: {
    padding: SIZES.PADDING.LARGE,
  },
  customerHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.PADDING.MEDIUM,
  },
  customerAvatarText: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
  },
  customerBasicInfo: {
    flex: 1,
  },
  customerCardName: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: 4,
  },
  customerPhoneHeader: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
  },
  statusBadge: {
    backgroundColor: COLORS.SUCCESS,
    paddingHorizontal: SIZES.PADDING.SMALL,
    paddingVertical: 4,
    borderRadius: SIZES.RADIUS.SMALL,
  },
  statusBadgeText: {
    fontSize: SIZES.FONT.XSMALL,
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
  },
  customerCardContent: {
    padding: SIZES.PADDING.LARGE,
  },
  vehicleInfoSection: {
    marginBottom: SIZES.PADDING.LARGE,
    paddingBottom: SIZES.PADDING.MEDIUM,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  vehicleInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleIcon: {
    fontSize: 20,
    marginRight: SIZES.PADDING.MEDIUM,
  },
  vehicleDetails: {
    flex: 1,
  },
  vehicleModel: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: 2,
  },
  vehicleColor: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
  },
  purchaseInfoSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  purchaseInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  purchaseIcon: {
    fontSize: 16,
    marginRight: SIZES.PADDING.SMALL,
  },
  purchaseDetails: {
    flex: 1,
  },
  purchaseLabel: {
    fontSize: SIZES.FONT.XSMALL,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: 2,
  },
  purchaseDate: {
    fontSize: SIZES.FONT.SMALL,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
  },
  priceSection: {
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontSize: SIZES.FONT.XSMALL,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: 2,
  },
  priceValue: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.SUCCESS,
  },
  requestCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.LARGE,
    padding: SIZES.PADDING.LARGE,
    marginBottom: SIZES.PADDING.MEDIUM,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  requestInfo: {
    flex: 1,
  },
  requestActions: {
    flexDirection: 'row',
  },
  requestDetails: {
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  requestFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SIZES.PADDING.SMALL,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  createdAt: {
    fontSize: SIZES.FONT.XSMALL,
    color: COLORS.TEXT.SECONDARY,
  },
  completedText: {
    fontSize: SIZES.FONT.XSMALL,
    color: COLORS.SUCCESS,
    fontWeight: '600',
  },
  cancelledText: {
    fontSize: SIZES.FONT.XSMALL,
    color: COLORS.ERROR,
    fontWeight: '600',
  },
  urgencyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SIZES.PADDING.XSMALL,
  },
  urgencyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: SIZES.PADDING.XSMALL,
  },
  urgencyText: {
    fontSize: SIZES.FONT.XSMALL,
    fontWeight: '600',
  },
  cancelActionButton: {
    backgroundColor: COLORS.ERROR,
  },
  cancelIcon: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.WHITE,
    fontWeight: 'bold',
  },
  scheduleButton: {
    backgroundColor: COLORS.PRIMARY,
  },
  completeButton: {
    backgroundColor: COLORS.SUCCESS,
  },
  modelInfo: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.PRIMARY,
    fontWeight: '600',
    marginTop: SIZES.PADDING.XSMALL,
  },
  requestInfo: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    marginTop: SIZES.PADDING.XSMALL,
  },
  customerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: 2,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SIZES.PADDING.XSMALL,
  },
  statusText: {
    fontSize: SIZES.FONT.SMALL,
    fontWeight: '600',
  },
  customerActions: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: SIZES.RADIUS.SMALL,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SIZES.PADDING.SMALL,
  },
  actionButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
  },
  customerDetails: {
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  detailLabel: {
    fontSize: SIZES.FONT.SMALL,
    marginRight: SIZES.PADDING.SMALL,
    width: 20,
  },
  detailText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    flex: 1,
  },
  customerStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.MEDIUM,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: SIZES.FONT.XSMALL,
    color: COLORS.TEXT.SECONDARY,
  },
  interestedModels: {
    marginTop: SIZES.PADDING.SMALL,
  },
  interestedLabel: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: 2,
  },
  modelsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  modelTag: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: SIZES.PADDING.SMALL,
    paddingVertical: SIZES.PADDING.XSMALL,
    borderRadius: SIZES.RADIUS.SMALL,
    marginRight: SIZES.PADDING.XSMALL,
    marginBottom: 2,
  },
  modelText: {
    fontSize: SIZES.FONT.XSMALL,
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
  },
  customerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: 2,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SIZES.PADDING.XSMALL,
  },
  statusText: {
    fontSize: SIZES.FONT.SMALL,
    fontWeight: '600',
  },
  customerActions: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: SIZES.RADIUS.SMALL,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SIZES.PADDING.SMALL,
  },
  actionButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
  },
  customerDetails: {
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  detailLabel: {
    fontSize: SIZES.FONT.SMALL,
    marginRight: SIZES.PADDING.SMALL,
    width: 20,
  },
  detailText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    flex: 1,
  },
  customerStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.MEDIUM,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: SIZES.FONT.XSMALL,
    color: COLORS.TEXT.SECONDARY,
  },
  interestedModels: {
    marginTop: SIZES.PADDING.SMALL,
  },
  interestedLabel: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: 2,
  },
  modelsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  modelTag: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: SIZES.PADDING.SMALL,
    paddingVertical: SIZES.PADDING.XSMALL,
    borderRadius: SIZES.RADIUS.SMALL,
    marginRight: SIZES.PADDING.XSMALL,
    marginBottom: 2,
  },
  modelText: {
    fontSize: SIZES.FONT.XSMALL,
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.SURFACE,
    borderTopLeftRadius: SIZES.RADIUS.XXLARGE,
    borderTopRightRadius: SIZES.RADIUS.XXLARGE,
    maxHeight: '90%',
    minHeight: '60%',
    paddingBottom: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.PADDING.LARGE,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: SIZES.RADIUS.ROUND,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    fontSize: SIZES.FONT.LARGE,
    color: COLORS.TEXT.SECONDARY,
  },
  modalBody: {
    padding: SIZES.PADDING.LARGE,
  },
  customerInfo: {
    backgroundColor: '#F8F9FA',
    padding: SIZES.PADDING.MEDIUM,
    borderRadius: SIZES.RADIUS.MEDIUM,
    marginBottom: SIZES.PADDING.LARGE,
  },
  customerPhone: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    marginTop: SIZES.PADDING.XSMALL,
  },
  formGroup: {
    marginBottom: SIZES.PADDING.LARGE,
  },
  formLabel: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SIZES.PADDING.SMALL,
  },
  modelSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  modelOption: {
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    borderRadius: SIZES.RADIUS.MEDIUM,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginRight: SIZES.PADDING.SMALL,
    marginBottom: SIZES.PADDING.SMALL,
  },
  modelOptionSelected: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  modelOptionText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.PRIMARY,
  },
  modelOptionTextSelected: {
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
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
  modalFooter: {
    flexDirection: 'row',
    padding: SIZES.PADDING.LARGE,
    paddingBottom: SIZES.PADDING.XXXLARGE,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: SIZES.PADDING.MEDIUM,
    marginRight: SIZES.PADDING.SMALL,
    borderRadius: SIZES.RADIUS.MEDIUM,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    marginLeft: SIZES.PADDING.SMALL,
    borderRadius: SIZES.RADIUS.MEDIUM,
    overflow: 'hidden',
  },
  submitGradient: {
    paddingVertical: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.WHITE,
    fontWeight: 'bold',
  },
});

export default CustomerManagementScreen;
