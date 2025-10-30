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
import { orderService } from '../../services/orderService';
import orderRestockService from '../../services/orderRestockService';
import { vehicleService } from '../../services/vehicleService';
import warehouseService from '../../services/warehouseService';
import agencyService from '../../services/agencyService';
import promotionService from '../../services/promotionService';
import { discountService } from '../../services/discountService';
import motorbikeService from '../../services/motorbikeService';
import { useAuth } from '../../contexts/AuthContext';

const { width } = Dimensions.get('window');

const OrderManagementScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  // Map a lightweight signature of an order (from list/create response) to its real orderId
  const [createdOrderIdMap, setCreatedOrderIdMap] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [availableVehicles, setAvailableVehicles] = useState([]); // Synced names from Catalog
  const [editingOrder, setEditingOrder] = useState(null);
  const [warehouses, setWarehouses] = useState([]);
  const [agencies, setAgencies] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [motorbikes, setMotorbikes] = useState([]);
  const [newOrder, setNewOrder] = useState({
    vehicleModel: '',
    quantity: '',
    color: '',
    discountId: '',
    promotionId: '',
    warehouseId: '',
    motorbikeId: '',
    colorId: '',
    agencyId: '',
  });
  
  // Track permission errors
  const [permissionErrors, setPermissionErrors] = useState({
    warehouses: null,
    agencies: null,
    promotions: null,
    discounts: null,
    motorbikes: null,
  });

  const { alertConfig, hideAlert, showSuccess, showError, showConfirm, showInfo } = useCustomAlert();

  // Utility function to ensure unique keys
  const getUniqueKey = (item, index) => {
    return `${item.id || 'item'}_${index}`;
  };

  // Build a deterministic key from available list fields to help resolve id-less items
  const buildOrderKey = (orderLike) => {
    if (!orderLike) return 'null';
    const qty = orderLike.quantity ?? '';
    const basePrice = orderLike.basePrice ?? '';
    const wholesalePrice = orderLike.wholesalePrice ?? '';
    const subtotal = orderLike.subtotal ?? '';
    const finalPrice = orderLike.finalPrice ?? '';
    const status = orderLike.status ?? '';
    const orderAt = orderLike.orderAt ? new Date(orderLike.orderAt).toISOString() : '';
    return `q=${qty}|bp=${basePrice}|wp=${wholesalePrice}|fp=${finalPrice}|sub=${subtotal}|st=${status}|at=${orderAt}`;
  };

  // Load vehicle names from Catalog and aggregate per name
  useEffect(() => {
    const loadAvailableFromCatalog = async () => {
      try {
        const response = await vehicleService.getAllVehicles();
        if (response?.success) {
          const list = response.data || [];
          const nameToItems = {};
          list.forEach((v) => {
            const name = v.name || v.model || 'Unknown';
            if (!nameToItems[name]) nameToItems[name] = [];
            nameToItems[name].push(v);
          });
          const aggregated = Object.entries(nameToItems).map(([name, items]) => {
            const price = Math.min(...items.map((i) => Number(i.price) || 0));
            const colorsSet = new Set();
            items.forEach((i) => (i.colors || []).forEach((c) => colorsSet.add(c)));
            const stock = items.reduce((sum, i) => sum + (Number(i.stockCount) || 0), 0);
            return {
              id: name,
              name,
              price,
              stock,
              colors: Array.from(colorsSet),
            };
          });
          setAvailableVehicles(aggregated);
        }
      } catch (e) {
        console.error('Error loading vehicles for order modal:', e);
      }
    };
    loadAvailableFromCatalog();
  }, []);

  // Load options for dropdowns
  useEffect(() => {
    const loadOptions = async () => {
      try {
        // Load warehouses
        const warehousesResponse = await warehouseService.getWarehousesList();
        if (warehousesResponse.success) {
          const warehousesList = warehousesResponse.data || [];
          setWarehouses(warehousesList);
          
          // Auto-select first warehouse if user has access and no warehouse selected yet
          if (warehousesList.length > 0 && !newOrder.warehouseId) {
            const firstWarehouse = warehousesList[0];
            setNewOrder(prev => ({
              ...prev,
              warehouseId: String(firstWarehouse.id),
            }));
            console.log('🔄 [OrderManagement] Auto-selected warehouse:', firstWarehouse.id, firstWarehouse.name);
          }
        }

        // Load agencies
        const agenciesResponse = await agencyService.getAgencies({ limit: 100 });
        if (agenciesResponse.success) {
          setAgencies(agenciesResponse.data || []);
        }

        // Load promotions
        const promotionsResponse = await promotionService.getAllPromotions(1, 100);
        if (promotionsResponse.success) {
          setPromotions(promotionsResponse.data || []);
        }

        // Load discounts for current agency
        if (user?.agencyId) {
          const discountsResponse = await discountService.getAgencyDiscounts(
            parseInt(user.agencyId),
            1,
            100
          );
          if (discountsResponse.success) {
            setDiscounts(discountsResponse.data || []);
          } else {
            console.warn('⚠️ [OrderManagement] Cannot load discounts:', discountsResponse.error);
            // Still allow creating order without discounts
            setDiscounts([]);
          }
        } else {
          console.warn('⚠️ [OrderManagement] No agencyId, skipping discount load');
          setDiscounts([]);
        }

        // Load motorbikes
        const motorbikesResponse = await motorbikeService.getAllMotorbikes({ limit: 100 });
        if (motorbikesResponse.success) {
          setMotorbikes(motorbikesResponse.data || []);
        }
      } catch (error) {
        console.error('Error loading options:', error);
      }
    };

    if (showCreateModal) {
      loadOptions();
      // Set agencyId from current user when opening modal
      if (user?.agencyId) {
        setNewOrder(prev => ({
          ...prev,
          agencyId: String(user.agencyId),
        }));
      }
      // Warehouse will be auto-selected in loadOptions after warehouses load
    }
  }, [showCreateModal, user]);

  useEffect(() => {
    console.log('📱 [OrderManagement] Component mounted, gọi loadOrders()');
    loadOrders();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('📱 [OrderManagement] Screen focused, refresh orders');
      loadOrders();
    });
    return unsubscribe;
  }, [navigation]);

  const loadOrders = async () => {
    try {
      console.log('🔄 [OrderManagement] Bắt đầu load orders...');
      console.log('🔄 [OrderManagement] Loading state:', true);
      setLoading(true);
      
      // Use new API endpoint /order-restock/list/{agencyId}
      if (!user?.agencyId) {
        console.error('❌ [OrderManagement] Không có agencyId, không thể load orders');
        showError('Lỗi', 'Không tìm thấy thông tin đại lý');
        return;
      }

      const agencyId = parseInt(user.agencyId);
      console.log('🔄 [OrderManagement] Call API với agencyId:', agencyId);
      const response = await orderRestockService.getOrderRestockListByAgency(agencyId);
      
      console.log('✅ [OrderManagement] API Response:', {
        success: response.success,
        dataLength: response.data?.length || 0,
        error: response.error || null,
        sampleData: response.data?.[0] || null
      });
      
      if (response.success) {
        const ordersList = response.data || [];
        
        // Log detailed info about orders structure
        if (ordersList.length > 0) {
          const firstOrder = ordersList[0];
          console.log('📋 [OrderManagement] Sample order from list:', {
            hasId: 'id' in firstOrder,
            id: firstOrder?.id,
            idType: typeof firstOrder?.id,
            keys: Object.keys(firstOrder || {}),
            fullOrder: firstOrder
          });
          
          // Check all orders for id
          const ordersWithoutId = ordersList.filter(o => !o.id);
          if (ordersWithoutId.length > 0) {
            console.warn('⚠️ [OrderManagement] Có', ordersWithoutId.length, 'orders không có id:', ordersWithoutId);
          }
        }
        
        setOrders(ordersList);
        console.log('✅ [OrderManagement] Đã set orders:', ordersList.length, 'items');
      } else {
        console.error('❌ [OrderManagement] API Error:', response.error);
        showError('Lỗi', response.error || 'Không thể tải danh sách đơn hàng');
      }
    } catch (error) {
      console.error('❌ [OrderManagement] Exception loading orders:', error);
      console.error('❌ [OrderManagement] Error details:', error.message, error.stack);
      showError('Lỗi', 'Không thể tải danh sách đơn hàng');
    } finally {
      console.log('🔄 [OrderManagement] Kết thúc load, set loading = false');
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    if (!searchQuery.trim()) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      order.id?.toString().toLowerCase().includes(searchLower) ||
      order.status?.toLowerCase().includes(searchLower)
    );
  });
  
  // Newest first by orderAt or createdAt
  const sortedFilteredOrders = [...filteredOrders].sort((a, b) => {
    const aTime = new Date(a.orderAt || a.createdAt || 0).getTime();
    const bTime = new Date(b.orderAt || b.createdAt || 0).getTime();
    return bTime - aTime;
  });

  const handleCreateOrder = async () => {
    if (!newOrder.vehicleModel || !newOrder.quantity || !newOrder.color) {
      showError('Lỗi', 'Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    if (!newOrder.warehouseId || !newOrder.motorbikeId) {
      showError('Lỗi', 'Vui lòng điền đầy đủ thông tin bắt buộc (Xe máy)');
      return;
    }

    // Ensure agencyId is set from user context
    if (!newOrder.agencyId && user?.agencyId) {
      newOrder.agencyId = String(user.agencyId);
    }

    try {
      const orderRestockData = {
        quantity: parseInt(newOrder.quantity) || 0,
        pricePolicyId: 1, // Default price policy
        discountId: newOrder.discountId ? parseInt(newOrder.discountId) : 1,
        promotionId: newOrder.promotionId ? parseInt(newOrder.promotionId) : 1,
        warehouseId: parseInt(newOrder.warehouseId) || 0,
        motorbikeId: parseInt(newOrder.motorbikeId) || 0,
        colorId: parseInt(newOrder.colorId) || 1,
        agencyId: parseInt(newOrder.agencyId || user?.agencyId) || 0,
      };

      console.log('Creating order restock with data:', orderRestockData);

      // Call the order-restock API
      const response = await orderService.createOrderRestock(orderRestockData);
      
      console.log('📦 [OrderManagement] Create order response:', {
        success: response.success,
        orderId: response.orderId,
        orderData: response.data
      });
      
      if (response.success) {
        const orderData = response.data || {};
        // Get orderId from multiple possible sources
        const orderId = response.orderId || orderData.id || response.data?.id;
        
        console.log('📦 [OrderManagement] Order created:', {
          orderId,
          status: orderData.status,
          quantity: orderData.quantity,
          subtotal: orderData.subtotal,
          orderDataKeys: Object.keys(orderData),
          responseOrderId: response.orderId,
          orderDataId: orderData.id,
          responseDataId: response.data?.id
        });

        // Store a mapping so id-less list items can still navigate to detail
        if (orderId) {
          const key = buildOrderKey(orderData);
          setCreatedOrderIdMap(prev => ({ ...prev, [key]: orderId }));
          console.log('🔗 [OrderManagement] Mapped key to orderId:', { key, orderId });
        }
        
        // Log ID confirmation
        if (orderId) {
          console.log('🆔 [OrderManagement] ✅ Order ID nhận được:', orderId, '(type:', typeof orderId, ')');
        } else {
          console.error('❌ [OrderManagement] KHÔNG CÓ orderId trong response!');
          console.error('❌ [OrderManagement] Full response:', JSON.stringify(response, null, 2));
        }
        
        // Navigate to detail screen with the newly created order ID
        if (orderId) {
          console.log('🧭 [OrderManagement] Navigating to detail với orderId từ create:', orderId);
          setShowCreateModal(false);
          
          // Small delay to ensure modal is closed before navigation
          setTimeout(() => {
            navigation.navigate('OrderRestockDetail', {
              orderId: orderId,
              onStatusUpdate: () => {
                loadOrders();
              }
            });
          }, 100);
          
          // Reload orders in background (but navigate first)
          loadOrders();
          
          const successMessage = `Đơn hàng #${orderId} đã được tạo thành công!`;
          showSuccess('Thành công', successMessage);
          return; // Exit early after navigation
        }
        
        // If no orderId, just reload list normally (fallback case)
        await loadOrders();
        setNewOrder({
          vehicleModel: '',
          quantity: '',
          color: '',
          discountId: '',
          promotionId: '',
          warehouseId: '',
          motorbikeId: '',
          colorId: '',
          agencyId: '',
        });
        setShowCreateModal(false);
        
        showSuccess('Thành công', response.message || 'Đơn hàng đã được tạo thành công!');
      } else {
        showError('Lỗi', response.error || 'Không thể tạo đơn hàng');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      showError('Lỗi', 'Không thể tạo đơn đặt xe');
    }
  };

  const handleCancelOrder = (orderId) => {
    showConfirm(
      'Xác nhận hủy',
      'Bạn có chắc chắn muốn hủy đơn hàng này?',
      async () => {
        try {
          const response = await orderRestockService.deleteOrderRestock(orderId);
          if (response.success) {
            showSuccess('Thành công', 'Đã hủy đơn hàng thành công!');
            loadOrders();
          } else {
            showError('Lỗi', response.error || 'Không thể hủy đơn hàng');
          }
        } catch (error) {
          console.error('Error canceling order:', error);
          showError('Lỗi', 'Không thể hủy đơn hàng');
        }
      }
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'DRAFT': return COLORS.TEXT.SECONDARY;
      case 'PENDING': return COLORS.WARNING;
      case 'APPROVED': return COLORS.SUCCESS;
      case 'DELIVERED': return COLORS.PRIMARY;
      case 'PAID': return COLORS.SUCCESS;
      case 'CANCELED': return COLORS.ERROR;
      default: return COLORS.TEXT.SECONDARY;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'DRAFT': return 'Draft';
      case 'PENDING': return 'Chờ xác nhận';
      case 'APPROVED': return 'Đã xác nhận';
      case 'DELIVERED': return 'Đã giao hàng';
      case 'PAID': return 'Đã thanh toán';
      case 'CANCELED': return 'Đã hủy';
      default: return status || 'Không xác định';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return COLORS.ERROR;
      case 'normal': return COLORS.PRIMARY;
      case 'low': return COLORS.TEXT.SECONDARY;
      default: return COLORS.TEXT.SECONDARY;
    }
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case 'high': return 'Cao';
      case 'normal': return 'Bình thường';
      case 'low': return 'Thấp';
      default: return 'Bình thường';
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const handleViewOrder = (order) => {
    console.log('👆 [OrderManagement] handleViewOrder called with:', {
      orderId: order.id,
      orderKeys: Object.keys(order),
      fullOrder: order
    });
    
    // Try direct id first
    let orderId = order.id || order.orderId;
    
    // If missing, try resolve from our local mapping built at creation time
    if (!orderId) {
      const key = buildOrderKey(order);
      const mappedId = createdOrderIdMap[key];
      if (mappedId) {
        console.log('🔎 [OrderManagement] Resolved orderId from local map:', { key, mappedId });
        orderId = mappedId;
      }
    }
    
    if (!orderId) {
      console.error('❌ [OrderManagement] Không có orderId trong order object:', order);
      showError('Lỗi', 'Không tìm thấy ID đơn hàng. Vui lòng refresh lại danh sách.');
      return;
    }
    
    console.log('✅ [OrderManagement] Navigating to OrderRestockDetail with orderId:', orderId);
    
    navigation.navigate('OrderRestockDetail', {
      orderId: orderId,
      onStatusUpdate: () => {
        loadOrders();
      }
    });
  };

  const renderOrderCard = (order) => (
    <TouchableOpacity 
      style={styles.orderCard}
      onPress={() => handleViewOrder(order)}
      activeOpacity={0.7}
    >
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderId}>#{order.id ?? '—'}</Text>
          <Text style={styles.orderDate}>{formatDate(order.orderAt)}</Text>
        </View>
        <View style={styles.orderStatus}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
            <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.orderDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Đại lý:</Text>
          <Text style={styles.detailValue}>
            {agencies.find(ag => ag.id === Number(order.agencyId ?? user?.agencyId))?.name ||
             agencies.find(ag => ag.id === Number(order.agencyId ?? user?.agencyId))?.location ||
             `Đại lý ID: ${order.agencyId ?? user?.agencyId}`}
          </Text>
        </View>
        {(() => {
          const agency = agencies.find(ag => ag.id === Number(order.agencyId ?? user?.agencyId));
          const address = agency?.address || agency?.location;
          if (!address) return null;
          return (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Địa chỉ:</Text>
              <Text style={styles.detailValue}>{address}</Text>
            </View>
          );
        })()}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Số lượng:</Text>
          <Text style={styles.detailValue}>{order.quantity || 0} xe</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Giá cơ bản:</Text>
          <Text style={styles.detailValue}>{formatPrice(order.basePrice || 0)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Giá bán buôn:</Text>
          <Text style={styles.detailValue}>{formatPrice(order.wholesalePrice || 0)}</Text>
        </View>
        {order.discountTotal > 0 && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Giảm giá:</Text>
            <Text style={[styles.detailValue, { color: COLORS.ERROR }]}>
              -{formatPrice(order.discountTotal || 0)}
            </Text>
          </View>
        )}
        {order.promotionTotal > 0 && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Khuyến mãi:</Text>
            <Text style={[styles.detailValue, { color: COLORS.SUCCESS }]}>
              -{formatPrice(order.promotionTotal || 0)}
            </Text>
          </View>
        )}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Giá cuối cùng:</Text>
          <Text style={[styles.detailValue, { fontWeight: 'bold' }]}>
            {formatPrice(order.finalPrice || 0)}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Tổng tiền:</Text>
          <Text style={[styles.detailValue, styles.priceValue]}>
            {formatPrice(order.subtotal || 0)}
          </Text>
        </View>
      </View>

      {order.status === 'DRAFT' && (
        <View style={styles.orderActions}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => handleCancelOrder(order.id)}
          >
            <Text style={styles.cancelButtonText}>Hủy đơn</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
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
            onPress={() => {
              setShowCreateModal(false);
              setEditingOrder(null);
              setNewOrder({
                vehicleModel: '',
                quantity: '',
                color: '',
                discountId: '',
                promotionId: '',
                warehouseId: '',
                motorbikeId: '',
                colorId: '',
                agencyId: '',
              });
            }}
          >
            <Text style={styles.modalCloseText}>Hủy</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Tạo đơn đặt xe mới</Text>
          <TouchableOpacity
            style={styles.modalSaveButton}
            onPress={handleCreateOrder}
          >
            <Text style={styles.modalSaveText}>Tạo đơn</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Mẫu xe *</Text>
            <View style={styles.vehicleSelector}>
              {availableVehicles.map((vehicle) => (
                <TouchableOpacity
                  key={vehicle.id}
                  style={[
                    styles.vehicleOption,
                    newOrder.vehicleModel === vehicle.name && styles.selectedVehicleOption
                  ]}
                  onPress={() => setNewOrder({ ...newOrder, vehicleModel: vehicle.name })}
                >
                  <Text style={[
                    styles.vehicleOptionText,
                    newOrder.vehicleModel === vehicle.name && styles.selectedVehicleOptionText
                  ]}>
                    {vehicle.name}
                  </Text>
                  <Text style={styles.vehiclePrice}>{formatPrice(vehicle.price)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Số lượng *</Text>
            <TextInput
              style={styles.textInput}
              value={newOrder.quantity}
              onChangeText={(text) => setNewOrder({ ...newOrder, quantity: text })}
              placeholder="Nhập số lượng xe"
              placeholderTextColor={COLORS.TEXT.SECONDARY}
              keyboardType="numeric"
            />
          </View>

          {newOrder.vehicleModel && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Màu sắc *</Text>
              <View style={styles.colorSelector}>
                {availableVehicles.find(v => v.name === newOrder.vehicleModel)?.colors.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      newOrder.color === color && styles.selectedColorOption
                    ]}
                    onPress={() => setNewOrder({ ...newOrder, color })}
                  >
                    <Text style={[
                      styles.colorOptionText,
                      newOrder.color === color && styles.selectedColorOptionText
                    ]}>
                      {color}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Xe máy *</Text>
            <View style={styles.vehicleSelector}>
              {motorbikes.length > 0 ? (
                motorbikes.map((mb) => (
                  <TouchableOpacity
                    key={mb.id}
                    style={[
                      styles.vehicleOption,
                      newOrder.motorbikeId === String(mb.id) && styles.selectedVehicleOption
                    ]}
                    onPress={() => setNewOrder({ ...newOrder, motorbikeId: String(mb.id) })}
                  >
                    <Text style={[
                      styles.vehicleOptionText,
                      newOrder.motorbikeId === String(mb.id) && styles.selectedVehicleOptionText
                    ]}>
                      {mb.name || mb.model || `Xe máy ${mb.id}`}
                    </Text>
                    <Text style={styles.vehiclePrice}>ID: {mb.id}</Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.noOptionsText}>Đang tải danh sách xe máy...</Text>
              )}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>ID Màu (colorId) *</Text>
            <TextInput
              style={styles.textInput}
              value={newOrder.colorId}
              onChangeText={(text) => setNewOrder({ ...newOrder, colorId: text })}
              placeholder="Nhập ID màu sắc"
              placeholderTextColor={COLORS.TEXT.SECONDARY}
              keyboardType="numeric"
            />
            <Text style={styles.inputHint}>Nhập ID màu tương ứng với màu đã chọn ở trên</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Kho *</Text>
            {newOrder.warehouseId ? (
              <View style={styles.selectedAgencyContainer}>
                <Text style={styles.selectedAgencyText}>
                  {warehouses.find(wh => wh.id === Number(newOrder.warehouseId))?.name || 
                   warehouses.find(wh => wh.id === Number(newOrder.warehouseId))?.location || 
                   `Kho ID: ${newOrder.warehouseId}`}
                </Text>
                <Text style={styles.selectedAgencyId}>ID: {newOrder.warehouseId}</Text>
              </View>
            ) : (
              <Text style={styles.noAgencyText}>Đang tải thông tin kho...</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Đại lý *</Text>
            {user?.agencyId ? (
              <View style={styles.selectedAgencyContainer}>
                <Text style={styles.selectedAgencyText}>
                  {agencies.find(ag => ag.id === Number(user.agencyId))?.name || 
                   agencies.find(ag => ag.id === Number(user.agencyId))?.location || 
                   `Đại lý ID: ${user.agencyId}`}
                </Text>
                <Text style={styles.selectedAgencyId}>ID: {user.agencyId}</Text>
              </View>
            ) : (
              <Text style={styles.noAgencyText}>Không tìm thấy thông tin đại lý</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Giảm giá (tùy chọn)</Text>
            <View style={styles.vehicleSelector}>
              <TouchableOpacity
                style={[
                  styles.vehicleOption,
                  !newOrder.discountId && styles.selectedVehicleOption
                ]}
                onPress={() => setNewOrder({ ...newOrder, discountId: '' })}
              >
                <Text style={[
                  styles.vehicleOptionText,
                  !newOrder.discountId && styles.selectedVehicleOptionText
                ]}>
                  Không chọn
                </Text>
              </TouchableOpacity>
              {discounts.length > 0 ? (
                discounts.map((disc) => (
                  <TouchableOpacity
                    key={disc.id}
                    style={[
                      styles.vehicleOption,
                      newOrder.discountId === String(disc.id) && styles.selectedVehicleOption
                    ]}
                    onPress={() => setNewOrder({ ...newOrder, discountId: String(disc.id) })}
                  >
                    <Text style={[
                      styles.vehicleOptionText,
                      newOrder.discountId === String(disc.id) && styles.selectedVehicleOptionText
                    ]}>
                      {disc.name || disc.description || `Giảm giá ${disc.id}`}
                    </Text>
                    <Text style={styles.vehiclePrice}>ID: {disc.id}</Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.noOptionsText}>Đang tải danh sách giảm giá...</Text>
              )}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Khuyến mãi (tùy chọn)</Text>
            <View style={styles.vehicleSelector}>
              <TouchableOpacity
                style={[
                  styles.vehicleOption,
                  !newOrder.promotionId && styles.selectedVehicleOption
                ]}
                onPress={() => setNewOrder({ ...newOrder, promotionId: '' })}
              >
                <Text style={[
                  styles.vehicleOptionText,
                  !newOrder.promotionId && styles.selectedVehicleOptionText
                ]}>
                  Không chọn
                </Text>
              </TouchableOpacity>
              {promotions.length > 0 ? (
                promotions.map((promo) => (
                  <TouchableOpacity
                    key={promo.id}
                    style={[
                      styles.vehicleOption,
                      newOrder.promotionId === String(promo.id) && styles.selectedVehicleOption
                    ]}
                    onPress={() => setNewOrder({ ...newOrder, promotionId: String(promo.id) })}
                  >
                    <Text style={[
                      styles.vehicleOptionText,
                      newOrder.promotionId === String(promo.id) && styles.selectedVehicleOptionText
                    ]}>
                      {promo.name || `Khuyến mãi ${promo.id}`}
                    </Text>
                    <Text style={styles.vehiclePrice}>ID: {promo.id}</Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.noOptionsText}>Đang tải danh sách khuyến mãi...</Text>
              )}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

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
        <Text style={styles.headerTitle}>Quản lý đơn hàng</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Text style={styles.addIcon}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm đơn hàng..."
          placeholderTextColor={COLORS.TEXT.SECONDARY}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{orders.length}</Text>
          <Text style={styles.statLabel}>Tổng đơn</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: COLORS.WARNING }]}>
            {orders.filter(o => o.status === 'PENDING').length}
          </Text>
          <Text style={styles.statLabel}>Chờ xác nhận</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: COLORS.SUCCESS }]}>
            {orders.filter(o => o.status === 'APPROVED').length}
          </Text>
          <Text style={styles.statLabel}>Đã xác nhận</Text>
        </View>
      </View>

      {/* Orders List */}
      <ScrollView
        style={styles.ordersList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.ordersContent}
      >
        {(() => {
          console.log('🖥️ [OrderManagement] Render list:', {
            loading,
            ordersCount: orders.length,
            filteredCount: sortedFilteredOrders.length
          });
          
          if (loading && orders.length === 0) {
            return (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>⏳</Text>
                <Text style={styles.emptyTitle}>Đang tải...</Text>
              </View>
            );
          } else if (sortedFilteredOrders.length > 0) {
            return sortedFilteredOrders.map((order, index) => (
              <View key={getUniqueKey(order, index)}>
                {renderOrderCard(order)}
              </View>
            ));
          } else {
            return (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📦</Text>
                <Text style={styles.emptyTitle}>Chưa có đơn hàng</Text>
                <Text style={styles.emptySubtitle}>
                  Tạo đơn đặt xe đầu tiên từ EVM
                </Text>
              </View>
            );
          }
        })()}
      </ScrollView>

      {renderCreateModal()}
      
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
    padding: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statNumber: {
    fontSize: SIZES.FONT.XXLARGE,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    textAlign: 'center',
  },

  // Orders List
  ordersList: {
    flex: 1,
  },
  ordersContent: {
    padding: SIZES.PADDING.MEDIUM,
  },
  orderCard: {
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
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SIZES.PADDING.SMALL,
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginBottom: 4,
  },
  vehicleModel: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '600',
    marginTop: 4,
  },
  orderDate: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    marginTop: 4,
  },
  orderStatus: {
    marginLeft: SIZES.PADDING.SMALL,
  },
  statusBadge: {
    paddingHorizontal: SIZES.PADDING.SMALL,
    paddingVertical: 4,
    borderRadius: SIZES.RADIUS.SMALL,
  },
  statusText: {
    fontSize: SIZES.FONT.XSMALL,
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
  },
  orderDetails: {
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
  },
  detailValue: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '600',
  },
  priceValue: {
    color: COLORS.SUCCESS,
    fontWeight: 'bold',
  },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.ERROR,
    borderRadius: SIZES.RADIUS.SMALL,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
  },
  cancelButtonText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.ERROR,
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
  vehicleSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.PADDING.SMALL,
  },
  vehicleOption: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
    minWidth: '45%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedVehicleOption: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
  },
  vehicleOptionText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '600',
    marginBottom: 4,
  },
  selectedVehicleOptionText: {
    color: COLORS.PRIMARY,
  },
  vehiclePrice: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
  },
  colorSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.PADDING.SMALL,
  },
  colorOption: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedColorOption: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
  },
  colorOptionText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
  },
  selectedColorOptionText: {
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  prioritySelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  priorityOption: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    borderWidth: 1,
    borderColor: 'transparent',
    minWidth: '30%',
    alignItems: 'center',
  },
  selectedPriorityOption: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
  },
  priorityOptionText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
  },
  selectedPriorityOptionText: {
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },

  // Option lists for dropdown suggestions
  optionList: {
    marginTop: SIZES.PADDING.SMALL,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: SIZES.RADIUS.MEDIUM,
    backgroundColor: 'rgba(255,255,255,0.05)',
    maxHeight: 150,
  },
  optionItem: {
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  optionText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.PRIMARY,
  },
  
  // Agency display
  selectedAgencyContainer: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY,
  },
  selectedAgencyText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
    marginBottom: 4,
  },
  selectedAgencyId: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
  },
  noAgencyText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.ERROR,
    fontStyle: 'italic',
  },
  
  // Input hints
  inputHint: {
    fontSize: SIZES.FONT.XSMALL,
    color: COLORS.TEXT.SECONDARY,
    marginTop: SIZES.PADDING.XSMALL,
    fontStyle: 'italic',
  },
  
  // No options text
  noOptionsText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    textAlign: 'center',
    padding: SIZES.PADDING.MEDIUM,
    fontStyle: 'italic',
  },
});

export default OrderManagementScreen;

