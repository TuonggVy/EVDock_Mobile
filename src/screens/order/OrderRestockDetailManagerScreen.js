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
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES } from '../../constants';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import orderRestockManagerService from '../../services/orderRestockManagerService';
import agencyService from '../../services/agencyService';

const OrderRestockDetailManagerScreen = ({ navigation, route }) => {
  const { orderId, onStatusUpdate } = route.params || {};
  const [order, setOrder] = useState(null);
  const [agencies, setAgencies] = useState([]);
  const [agencyDetail, setAgencyDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showBillModal, setShowBillModal] = useState(false);
  const [selectedPaymentType, setSelectedPaymentType] = useState('FULL');

  const { alertConfig, hideAlert, showSuccess, showError, showConfirm } = useCustomAlert();

  const orderStatuses = [
    { key: 'DRAFT', label: 'Draft', color: COLORS.TEXT.SECONDARY },
    { key: 'PENDING', label: 'Pending', color: COLORS.WARNING },
    { key: 'APPROVED', label: 'Approved', color: COLORS.SUCCESS },
    { key: 'DELIVERED', label: 'Delivered', color: COLORS.PRIMARY },
    { key: 'PAID', label: 'Paid', color: COLORS.SUCCESS },
    { key: 'CANCELED', label: 'Canceled', color: COLORS.ERROR },
  ];

  useEffect(() => {
    loadAgencies();
    loadOrderDetail();
  }, [orderId]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadAgencies();
      loadOrderDetail();
    });

    return unsubscribe;
  }, [navigation]);

  const loadAgencies = async () => {
    try {
      const response = await agencyService.getAgencies();
      if (response.success) {
        setAgencies(response.data || []);
      }
    } catch (error) {
      // silent
    }
  };

  const loadOrderDetail = async () => {
    try {
      setLoading(true);
      const response = await orderRestockManagerService.getOrderRestockDetail(orderId);
      if (response.success) {
        const detail = response.data;
        setOrder(detail);
        
        // Auto-update order status to PAID if bill is completed
        if (detail.agencyBill && detail.agencyBill.isCompleted && detail.status !== 'PAID') {
          try {
            const updateResponse = await orderRestockManagerService.updateOrderRestockStatus(orderId, 'PAID');
            if (updateResponse.success) {
              // Reload order detail to get updated status
              const reloadResponse = await orderRestockManagerService.getOrderRestockDetail(orderId);
              if (reloadResponse.success) {
                const updatedDetail = reloadResponse.data;
                setOrder(updatedDetail);
                if (onStatusUpdate) onStatusUpdate();
                
                // Update agency detail after reload
                const agencyId = updatedDetail?.agencyId;
                if (agencyId) {
                  const existsInList = agencies.find(a => a.id === agencyId || a.id?.toString() === agencyId?.toString());
                  const hasBill = !!updatedDetail.agencyBill;
                  if (!existsInList && !hasBill) {
                    const agencyResp = await agencyService.getAgencyById(agencyId);
                    if (agencyResp?.success) {
                      const detailAgency = agencyResp?.data?.data || agencyResp?.data || null;
                      setAgencyDetail(detailAgency);
                    } else {
                      setAgencyDetail(null);
                    }
                  } else if (existsInList) {
                    setAgencyDetail(existsInList);
                  } else if (hasBill) {
                    setAgencyDetail(updatedDetail.agencyBill);
                  }
                } else {
                  setAgencyDetail(null);
                }
                return; // Exit early after successful update
              }
            }
          } catch (updateError) {
            console.error('Error auto-updating order status to PAID:', updateError);
            // Don't show error to user, just log it and continue with normal flow
          }
        }
        
        const agencyId = detail?.agencyId;
        if (agencyId) {
          const existsInList = agencies.find(a => a.id === agencyId || a.id?.toString() === agencyId?.toString());
          const hasBill = !!detail.agencyBill;
          if (!existsInList && !hasBill) {
            const agencyResp = await agencyService.getAgencyById(agencyId);
            if (agencyResp?.success) {
              const detailAgency = agencyResp?.data?.data || agencyResp?.data || null;
              setAgencyDetail(detailAgency);
            } else {
              setAgencyDetail(null);
            }
          } else if (existsInList) {
            setAgencyDetail(existsInList);
          } else if (hasBill) {
            setAgencyDetail(detail.agencyBill);
          }
        } else {
          setAgencyDetail(null);
        }
      } else {
        showError('Lỗi', response.error || 'Không thể tải chi tiết đơn hàng');
        navigation.goBack();
      }
    } catch (error) {
      showError('Lỗi', 'Không thể tải chi tiết đơn hàng');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const statusOption = orderStatuses.find(s => s.key === status);
    return statusOption ? statusOption.color : COLORS.TEXT.SECONDARY;
  };

  const getStatusLabel = (status) => {
    const statusOption = orderStatuses.find(s => s.key === status);
    return statusOption ? statusOption.label : status;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderInfoRow = (label, value, valueStyle = {}) => (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, valueStyle]}>{value}</Text>
    </View>
  );

  const renderStatusModal = () => null;

  const handleCreateBill = async (paymentType) => {
    try {
      const response = await orderRestockManagerService.createOrderRestockBill(order.id, paymentType);
      if (response.success) {
        showSuccess('Thành công', response.message || 'Tạo hóa đơn thành công!');
        setShowBillModal(false);
        // Reload order detail to get updated bill information
        await loadOrderDetail();
        if (onStatusUpdate) onStatusUpdate();
      } else {
        showError('Lỗi', response.error || 'Không thể tạo hóa đơn');
      }
    } catch (error) {
      console.error('Error creating bill:', error);
      showError('Lỗi', 'Không thể tạo hóa đơn');
    }
  };

  const handlePayment = async () => {
    if (!order.agencyBill || !order.agencyBill.id) {
      showError('Lỗi', 'Không tìm thấy thông tin hóa đơn');
      return;
    }

    if (order.agencyBill.isCompleted) {
      showError('Thông báo', 'Hóa đơn đã được thanh toán');
      return;
    }

    try {
      showConfirm(
        'Xác nhận thanh toán',
        `Bạn có chắc chắn muốn thanh toán hóa đơn #${order.agencyBill.id}?\nSố tiền: ${formatPrice(order.agencyBill.amount)}`,
        async () => {
          try {
            const response = await orderRestockManagerService.getVNPayPaymentUrl(order.agencyBill.id);
            if (response.success && response.paymentUrl) {
              // Check if URL can be opened
              const canOpen = await Linking.canOpenURL(response.paymentUrl);
               if (canOpen) {
                 await Linking.openURL(response.paymentUrl);
                 // Reload order detail after payment attempt to check if payment completed
                 // Check multiple times as payment might take a few seconds
                 setTimeout(() => {
                   loadOrderDetail();
                 }, 2000);
                 setTimeout(() => {
                   loadOrderDetail();
                 }, 5000);
                 setTimeout(() => {
                   loadOrderDetail();
                 }, 10000);
               } else {
                showError('Lỗi', 'Không thể mở URL thanh toán');
              }
            } else {
              showError('Lỗi', response.error || 'Không thể lấy URL thanh toán');
            }
          } catch (error) {
            console.error('Error getting payment URL:', error);
            showError('Lỗi', 'Không thể xử lý thanh toán');
          }
        }
      );
    } catch (error) {
      console.error('Error in payment flow:', error);
      showError('Lỗi', 'Không thể xử lý thanh toán');
    }
  };

  const renderBillModal = () => {
    if (!showBillModal) return null;

    return (
      <Modal
        visible={showBillModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowBillModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Chọn hình thức thanh toán</Text>
            <Text style={styles.modalSubtitle}>Đơn hàng #{order.id} đã được giao</Text>

            <View style={styles.paymentTypeContainer}>
              <TouchableOpacity
                style={[
                  styles.paymentTypeCard,
                  selectedPaymentType === 'FULL' && styles.paymentTypeCardSelected
                ]}
                onPress={() => setSelectedPaymentType('FULL')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={selectedPaymentType === 'FULL' 
                    ? ['#4A90E2', '#357ABD'] 
                    : ['#FFFFFF', '#F8F9FA']
                  }
                  style={styles.paymentTypeCardGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.paymentTypeHeader}>
                    <View style={styles.paymentTypeIconContainer}>
                      <Text style={styles.paymentTypeIcon}>💰</Text>
                    </View>
                    <View style={styles.paymentTypeTitleContainer}>
                      <Text style={[
                        styles.paymentTypeTitle,
                        selectedPaymentType === 'FULL' && styles.paymentTypeTitleSelected
                      ]}>
                        Thanh toán đầy đủ
                      </Text>
                      <Text style={[
                        styles.paymentTypeSubtitle,
                        selectedPaymentType === 'FULL' && styles.paymentTypeSubtitleSelected
                      ]}>
                        Thanh toán một lần (FULL)
                      </Text>
                    </View>
                    {selectedPaymentType === 'FULL' && (
                      <View style={styles.selectedBadge}>
                        <Text style={styles.selectedBadgeText}>✓</Text>
                      </View>
                    )}
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.paymentTypeCard,
                  selectedPaymentType === 'DEFERRED' && styles.paymentTypeCardSelected
                ]}
                onPress={() => setSelectedPaymentType('DEFERRED')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={selectedPaymentType === 'DEFERRED' 
                    ? ['#9B59B6', '#8E44AD'] 
                    : ['#FFFFFF', '#F8F9FA']
                  }
                  style={styles.paymentTypeCardGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.paymentTypeHeader}>
                    <View style={styles.paymentTypeIconContainer}>
                      <Text style={styles.paymentTypeIcon}>📅</Text>
                    </View>
                    <View style={styles.paymentTypeTitleContainer}>
                      <Text style={[
                        styles.paymentTypeTitle,
                        selectedPaymentType === 'DEFERRED' && styles.paymentTypeTitleSelected
                      ]}>
                        Thanh toán trả chậm
                      </Text>
                      <Text style={[
                        styles.paymentTypeSubtitle,
                        selectedPaymentType === 'DEFERRED' && styles.paymentTypeSubtitleSelected
                      ]}>
                        Thanh toán sau (DEFERRED)
                      </Text>
                    </View>
                    {selectedPaymentType === 'DEFERRED' && (
                      <View style={styles.selectedBadge}>
                        <Text style={styles.selectedBadgeText}>✓</Text>
                      </View>
                    )}
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowBillModal(false)}
              >
                <Text style={styles.modalButtonCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={() => handleCreateBill(selectedPaymentType)}
              >
                <Text style={styles.modalButtonConfirmText}>Xác nhận</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Không tìm thấy đơn hàng</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết đơn hàng</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={styles.statusTitle}>Trạng thái đơn hàng</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
              <Text style={styles.statusText}>{getStatusLabel(order.status)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin đơn hàng</Text>
          {renderInfoRow('Mã đơn hàng', `#${order.id}`)}
          {renderInfoRow('Ngày đặt hàng', formatDate(order.orderAt))}
          {renderInfoRow('Số lượng', `${order.quantity} xe`)}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin xe</Text>
          {renderInfoRow('Tên xe', order.electricMotorbike?.name || 'N/A')}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin kho</Text>
          {renderInfoRow('Tên kho', order.warehouse?.name || 'N/A')}
          {renderInfoRow('Địa điểm', order.warehouse?.location || 'N/A')}
          {renderInfoRow('Địa chỉ', order.warehouse?.address || 'N/A')}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin giá</Text>
          {renderInfoRow('Giá cơ bản', formatPrice(order.basePrice))}
          {renderInfoRow('Giá bán buôn', formatPrice(order.wholesalePrice))}
          {renderInfoRow('Giá cuối cùng', formatPrice(order.finalPrice))}
          {renderInfoRow('Giảm giá', formatPrice(order.discountTotal))}
          {renderInfoRow('Khuyến mãi', formatPrice(order.promotionTotal))}
          {renderInfoRow('Tổng tiền', formatPrice(order.subtotal), { 
            color: COLORS.SUCCESS, 
            fontWeight: 'bold',
            fontSize: SIZES.FONT.MEDIUM 
          })}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin chính sách</Text>
          {renderInfoRow('Chính sách giá', order.pricePolicyId?.toString() || 'N/A')}
          {renderInfoRow('Giảm giá', order.discountId?.toString() || 'N/A')}
          {renderInfoRow('Khuyến mãi', order.promotionId?.toString() || 'N/A')}
          {renderInfoRow('Màu sắc', order.colorId?.toString() || 'N/A')}
        </View>

        {order.agencyBill && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông tin hóa đơn</Text>
            {renderInfoRow('Mã hóa đơn', `#${order.agencyBill.id || 'N/A'}`)}
            {renderInfoRow('Số tiền', formatPrice(order.agencyBill.amount))}
            {renderInfoRow('Loại thanh toán', order.agencyBill.type === 'FULL' ? 'Thanh toán đầy đủ' : 'Thanh toán trả chậm')}
            {renderInfoRow('Ngày tạo', formatDate(order.agencyBill.createAt))}
            {order.agencyBill.paidAt && renderInfoRow('Ngày thanh toán', formatDate(order.agencyBill.paidAt))}
            {renderInfoRow('Trạng thái', order.agencyBill.isCompleted ? 'Đã hoàn thành' : 'Chưa hoàn thành', {
              color: order.agencyBill.isCompleted ? COLORS.SUCCESS : COLORS.WARNING
            })}
          </View>
        )}
      </ScrollView>

      <View style={styles.fixedActionsContainer}>
        {order.status === 'DRAFT' ? (
          <>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={async () => {
                try {
                  const resp = await orderRestockManagerService.acceptOrderRestock(order.id);
                  if (resp.success) {
                    setOrder(resp.data);
                    showSuccess('Thành công', 'Đã xác nhận đơn hàng!');
                    if (onStatusUpdate) onStatusUpdate();
                  } else {
                    showError('Lỗi', resp.error || 'Không thể xác nhận đơn hàng');
                  }
                } catch (e) {
                  showError('Lỗi', 'Không thể xác nhận đơn hàng');
                }
              }}
            >
              <Text style={styles.actionButtonText}>Accept</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.deleteActionButton]}
              onPress={async () => {
                try {
                  const resp = await orderRestockManagerService.deleteOrderRestock(order.id);
                  if (resp.success) {
                    showSuccess('Thành công', 'Đã xóa đơn hàng!');
                    if (onStatusUpdate) onStatusUpdate();
                    navigation.goBack();
                  } else {
                    showError('Lỗi', resp.error || 'Không thể xóa đơn hàng');
                  }
                } catch (e) {
                  showError('Lỗi', 'Không thể xóa đơn hàng');
                }
              }}
            >
              <Text style={[styles.actionButtonText, styles.deleteActionButtonText]}>Delete</Text>
            </TouchableOpacity>
          </>
        ) : order.status === 'DELIVERED' && !order.agencyBill ? (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              setSelectedPaymentType('FULL');
              setShowBillModal(true);
            }}
          >
            <Text style={styles.actionButtonText}>Tạo hóa đơn</Text>
          </TouchableOpacity>
        ) : order.agencyBill && !order.agencyBill.isCompleted ? (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handlePayment}
          >
            <Text style={styles.actionButtonText}>Thanh toán</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {renderBillModal()}

      {renderStatusModal()}

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
    paddingTop: Platform.OS === 'ios' ? 0 : 30,
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
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SIZES.PADDING.MEDIUM,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
  },
  statusCard: {
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
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  statusTitle: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
  },
  statusBadge: {
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    borderRadius: SIZES.RADIUS.MEDIUM,
  },
  statusText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
  },
  section: {
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
  sectionTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SIZES.PADDING.SMALL,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoLabel: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
    flex: 1,
  },
  infoValue: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  fixedActionsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
    padding: SIZES.PADDING.MEDIUM,
    paddingBottom: Platform.OS === 'ios' ? SIZES.PADDING.LARGE : SIZES.PADDING.MEDIUM,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    gap: SIZES.PADDING.MEDIUM,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  actionButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
  },
  deleteActionButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.ERROR,
  },
  deleteActionButtonText: {
    color: COLORS.ERROR,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.PADDING.MEDIUM,
  },
  modalContent: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.LARGE,
    padding: SIZES.PADDING.LARGE,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SIZES.PADDING.SMALL,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: SIZES.PADDING.LARGE,
    textAlign: 'center',
  },
  paymentTypeContainer: {
    marginBottom: SIZES.PADDING.LARGE,
    gap: SIZES.PADDING.MEDIUM,
  },
  paymentTypeCard: {
    borderRadius: SIZES.RADIUS.LARGE,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  paymentTypeCardSelected: {
    borderWidth: 2,
    borderColor: COLORS.PRIMARY,
  },
  paymentTypeCardGradient: {
    padding: SIZES.PADDING.LARGE,
    borderRadius: SIZES.RADIUS.LARGE,
  },
  paymentTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentTypeIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.PADDING.MEDIUM,
  },
  paymentTypeIcon: {
    fontSize: 28,
  },
  paymentTypeTitleContainer: {
    flex: 1,
  },
  paymentTypeTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: 4,
  },
  paymentTypeTitleSelected: {
    color: COLORS.TEXT.WHITE,
  },
  paymentTypeSubtitle: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
  },
  paymentTypeSubtitleSelected: {
    color: COLORS.TEXT.WHITE,
    opacity: 0.9,
  },
  selectedBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.SUCCESS,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SIZES.PADDING.SMALL,
  },
  selectedBadgeText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.WHITE,
    fontWeight: 'bold',
  },
  modalActions: {
    flexDirection: 'row',
    gap: SIZES.PADDING.MEDIUM,
  },
  modalButton: {
    flex: 1,
    padding: SIZES.PADDING.MEDIUM,
    borderRadius: SIZES.RADIUS.MEDIUM,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.TEXT.SECONDARY,
  },
  modalButtonCancelText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
    fontWeight: '600',
  },
  modalButtonConfirm: {
    backgroundColor: COLORS.PRIMARY,
  },
  modalButtonConfirmText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
  },
});

export default OrderRestockDetailManagerScreen;


