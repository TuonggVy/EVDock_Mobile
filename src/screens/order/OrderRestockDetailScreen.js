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
} from 'react-native';
import { COLORS, SIZES } from '../../constants';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import orderRestockService from '../../services/orderRestockService';
import agencyService from '../../services/agencyService';

const OrderRestockDetailScreen = ({ navigation, route }) => {
  const { orderId, onStatusUpdate } = route.params || {};
  const [order, setOrder] = useState(null);
  const [agencies, setAgencies] = useState([]);
  const [agencyDetail, setAgencyDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');

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
      console.error('Error loading agencies:', error);
      // Don't show error, just fail silently
    }
  };

  const loadOrderDetail = async () => {
    try {
      setLoading(true);
      const response = await orderRestockService.getOrderRestockDetail(orderId);
      
      if (response.success) {
        const detail = response.data;
        setOrder(detail);
        // Proactively fetch agency detail for full address/location if missing from list
        const agencyId = detail?.agencyId;
        if (agencyId) {
          const existsInList = agencies.find(a => a.id === agencyId || a.id?.toString() === agencyId?.toString());
          const hasBill = !!detail.agencyBill;
          if (!existsInList && !hasBill) {
            try {
              const agencyResp = await agencyService.getAgencyById(agencyId);
              if (agencyResp?.success) {
                const detailAgency = agencyResp?.data?.data || agencyResp?.data || null;
                setAgencyDetail(detailAgency);
              } else {
                setAgencyDetail(null);
              }
            } catch (e) {
              // silent fail
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
      console.error('Error loading order detail:', error);
      showError('Lỗi', 'Không thể tải chi tiết đơn hàng');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const getAgencyInfo = () => {
    if (!order?.agencyId) return null;
    if (agencyDetail) return agencyDetail;
    // First try to get from agencies list
    const agency = agencies.find(a => 
      a.id === order.agencyId || 
      a.id?.toString() === order.agencyId?.toString()
    );
    // If found, return it
    if (agency) return agency;
    // Otherwise, check if agencyBill is in order response
    if (order.agencyBill) return order.agencyBill;
    // Return null if nothing found
    return null;
  };

  const handleUpdateStatus = () => {
    if (!selectedStatus) {
      showError('Lỗi', 'Vui lòng chọn trạng thái mới');
      return;
    }

    if (selectedStatus === order.status) {
      showError('Lỗi', 'Trạng thái đã được chọn');
      setShowStatusModal(false);
      return;
    }

    showConfirm(
      'Xác nhận cập nhật',
      `Bạn có chắc chắn muốn đổi trạng thái từ "${getStatusLabel(order.status)}" sang "${getStatusLabel(selectedStatus)}"?`,
      async () => {
        try {
          const response = await orderRestockService.updateOrderRestockStatus(orderId, selectedStatus);
          if (response.success) {
            setOrder(response.data);
            setShowStatusModal(false);
            setSelectedStatus('');
            showSuccess('Thành công', 'Cập nhật trạng thái thành công!');
            // Trigger refresh on parent screen immediately
            if (onStatusUpdate) {
              onStatusUpdate();
            }
          } else {
            showError('Lỗi', response.error || 'Không thể cập nhật trạng thái');
          }
        } catch (error) {
          console.error('Error updating status:', error);
          showError('Lỗi', 'Không thể cập nhật trạng thái');
        }
      }
    );
  };

  const handleDeleteOrder = () => {
    showConfirm(
      'Xác nhận xóa',
      `Bạn có chắc chắn muốn xóa đơn hàng #${order.id}?`,
      async () => {
        try {
          const response = await orderRestockService.deleteOrderRestock(order.id);
          if (response.success) {
            showSuccess('Thành công', 'Xóa đơn hàng thành công!');
            // Trigger refresh on parent screen immediately
            if (onStatusUpdate) {
              onStatusUpdate();
            }
            navigation.goBack();
          } else {
            showError('Lỗi', response.error || 'Không thể xóa đơn hàng');
          }
        } catch (error) {
          console.error('Error deleting order:', error);
          showError('Lỗi', 'Không thể xóa đơn hàng');
        }
      }
    );
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

  const renderStatusModal = () => null; // Modal removed to restrict manual status changes

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
      {/* Header */}
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
        {/* Order Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={styles.statusTitle}>Trạng thái đơn hàng</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
              <Text style={styles.statusText}>{getStatusLabel(order.status)}</Text>
            </View>
          </View>
        </View>

        {/* Order Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin đơn hàng</Text>
          {renderInfoRow('Mã đơn hàng', `#${order.id}`)}
          {renderInfoRow('Ngày đặt hàng', formatDate(order.orderAt))}
          {renderInfoRow('Số lượng', `${order.quantity} xe`)}
        </View>

        {/* Agency Info removed as requested */}

        {/* Vehicle Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin xe</Text>
          {renderInfoRow('Tên xe', order.electricMotorbike?.name || 'N/A')}
        </View>

        {/* Warehouse Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin kho</Text>
          {renderInfoRow('Tên kho', order.warehouse?.name || 'N/A')}
          {renderInfoRow('Địa điểm', order.warehouse?.location || 'N/A')}
          {renderInfoRow('Địa chỉ', order.warehouse?.address || 'N/A')}
        </View>

        {/* Pricing Info */}
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

        {/* Policy Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin chính sách</Text>
          {renderInfoRow('Chính sách giá', order.pricePolicyId?.toString() || 'N/A')}
          {renderInfoRow('Giảm giá', order.discountId?.toString() || 'N/A')}
          {renderInfoRow('Khuyến mãi', order.promotionId?.toString() || 'N/A')}
          {renderInfoRow('Màu sắc', order.colorId?.toString() || 'N/A')}
        </View>
      </ScrollView>

      {/* Fixed Actions Bar */}
      <View style={styles.fixedActionsContainer}>
        {order.status === 'DRAFT' ? (
          <>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={async () => {
                try {
                  const resp = await orderRestockService.acceptOrderRestock(order.id);
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
                  const resp = await orderRestockService.updateOrderRestockStatus(order.id, 'CANCELED');
                  if (resp.success) {
                    setOrder(resp.data);
                    showSuccess('Thành công', 'Đã hủy đơn hàng!');
                    if (onStatusUpdate) onStatusUpdate();
                  } else {
                    showError('Lỗi', resp.error || 'Không thể hủy đơn hàng');
                  }
                } catch (e) {
                  showError('Lỗi', 'Không thể hủy đơn hàng');
                }
              }}
            >
              <Text style={[styles.actionButtonText, styles.deleteActionButtonText]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.deleteActionButton]}
              onPress={handleDeleteOrder}
            >
              <Text style={[styles.actionButtonText, styles.deleteActionButtonText]}>Delete</Text>
            </TouchableOpacity>
          </>
        ) : null}
      </View>

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
    paddingBottom: 100, // Space for fixed action buttons
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
  actionsContainer: {
    marginTop: SIZES.PADDING.LARGE,
    marginBottom: SIZES.PADDING.XXXLARGE,
    gap: SIZES.PADDING.MEDIUM,
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.SURFACE,
    borderTopLeftRadius: SIZES.RADIUS.XXLARGE,
    borderTopRightRadius: SIZES.RADIUS.XXLARGE,
    padding: SIZES.PADDING.LARGE,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SIZES.PADDING.LARGE,
    textAlign: 'center',
  },
  statusList: {
    maxHeight: 400,
    marginBottom: SIZES.PADDING.LARGE,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.PADDING.MEDIUM,
    borderRadius: SIZES.RADIUS.MEDIUM,
    marginBottom: SIZES.PADDING.SMALL,
    backgroundColor: '#F5F5F5',
  },
  selectedStatusOption: {
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    borderWidth: 2,
    borderColor: COLORS.PRIMARY,
  },
  statusIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: SIZES.PADDING.MEDIUM,
  },
  statusOptionText: {
    flex: 1,
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '600',
  },
  selectedStatusOptionText: {
    color: COLORS.PRIMARY,
  },
  checkIcon: {
    fontSize: SIZES.FONT.LARGE,
    color: COLORS.PRIMARY,
    fontWeight: 'bold',
  },
  modalActions: {
    flexDirection: 'row',
    gap: SIZES.PADDING.MEDIUM,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '600',
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
  },
});

export default OrderRestockDetailScreen;

