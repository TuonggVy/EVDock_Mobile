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
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES } from '../../constants';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import { ArrowLeft, Plus, Search, Package, Clock } from 'lucide-react-native';
import { orderService } from '../../services/orderService';
import orderRestockManagerService from '../../services/orderRestockManagerService';
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
  const [colors, setColors] = useState([]); // legacy, not used for selection
  const [motorbikeColors, setMotorbikeColors] = useState([]);
  const [agencies, setAgencies] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [allDiscounts, setAllDiscounts] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [motorbikes, setMotorbikes] = useState([]);
  const [creating, setCreating] = useState(false);
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

        // Load promotions from agency promotion API (do not use stock promotions here)
        const promotionsResponse = await promotionService.getAgencyPromotions(1, 100);
        if (promotionsResponse.success) {
          const now = new Date();
          const activePromos = (promotionsResponse.data || []).filter(p => {
            const statusOk = (p.status || 'ACTIVE') === 'ACTIVE';
            const startOk = !p.startAt || new Date(p.startAt) <= now;
            // Treat endAt as inclusive end-of-day to avoid timezone truncation
            const endAt = p.endAt ? new Date(p.endAt) : null;
            const endInclusive = endAt ? new Date(endAt.getTime() + 24*60*60*1000 - 1) : null;
            const endOk = !endInclusive || endInclusive >= now;
            return statusOk && startOk && endOk;
          });
          setPromotions(activePromos);
        } else {
          setPromotions([]);
        }

        // Load discounts for current agency
        if (user?.agencyId) {
          const discountsResponse = await discountService.getAgencyDiscounts(
            parseInt(user.agencyId),
            1,
            200
          );
          if (discountsResponse.success) {
            const now = new Date();
            const qty = parseInt(newOrder.quantity) || 0;
            const selectedMotorbikeId = newOrder.motorbikeId ? Number(newOrder.motorbikeId) : null;
            const raw = discountsResponse.data || [];
            setAllDiscounts(raw);
            const filtered = raw.filter(d => {
              const statusOk = (d.status || 'ACTIVE') === 'ACTIVE';
              const startOk = !d.startAt || new Date(d.startAt) <= now;
              const dEnd = d.endAt ? new Date(d.endAt) : null;
              const endInclusive = dEnd ? new Date(dEnd.getTime() + 24*60*60*1000 - 1) : null;
              const endOk = !endInclusive || endInclusive >= now;
              const qtyOk = !d.min_quantity || qty === 0 || qty >= Number(d.min_quantity);
              const motorbikeOk = !d.motorbikeId || (selectedMotorbikeId && Number(d.motorbikeId) === selectedMotorbikeId);
              return statusOk && startOk && endOk && motorbikeOk && qtyOk;
            });
            setDiscounts(filtered);
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

        // Không load màu tổng quát; màu sẽ lấy theo motorbike đã chọn
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

  // Re-filter discounts when quantity or selected motorbike changes
  useEffect(() => {
    if (!allDiscounts) return;
    const now = new Date();
    const qty = parseInt(newOrder.quantity) || 0;
    const selectedMotorbikeId = newOrder.motorbikeId ? Number(newOrder.motorbikeId) : null;
    const filtered = (allDiscounts || []).filter(d => {
      const statusOk = (d.status || 'ACTIVE') === 'ACTIVE';
      const startOk = !d.startAt || new Date(d.startAt) <= now;
      const dEnd = d.endAt ? new Date(d.endAt) : null;
      const endInclusive = dEnd ? new Date(dEnd.getTime() + 24*60*60*1000 - 1) : null;
      const endOk = !endInclusive || endInclusive >= now;
      const qtyOk = !d.min_quantity || qty === 0 || qty >= Number(d.min_quantity);
      const motorbikeOk = !d.motorbikeId || (selectedMotorbikeId && Number(d.motorbikeId) === selectedMotorbikeId);
      return statusOk && startOk && endOk && motorbikeOk && qtyOk;
    });
    setDiscounts(filtered);
    if (newOrder.discountId && !filtered.find(d => String(d.id) === String(newOrder.discountId))) {
      setNewOrder(prev => ({ ...prev, discountId: '' }));
    }
  }, [newOrder.quantity, newOrder.motorbikeId, allDiscounts]);

  // Fetch colors for selected motorbike
  useEffect(() => {
    const fetchMotorbikeColors = async () => {
      try {
        setMotorbikeColors([]);
        if (!newOrder.motorbikeId) return;
        const res = await motorbikeService.getMotorbikeById(parseInt(newOrder.motorbikeId));
        // Support both shapes: { data: { data: {...} } } or { data: {...} }
        const payload = res?.data?.data || res?.data;
        const colors = Array.isArray(payload?.colors) ? payload.colors : [];
        const mapped = colors.map(item => ({
          id: item?.color?.id,
          colorType: item?.color?.colorType,
          imageUrl: item?.imageUrl,
        })).filter(c => c.id && c.colorType);
        setMotorbikeColors(mapped);
        // Auto-select first available color for order creation
        if (mapped.length > 0) {
          setNewOrder(prev => ({ ...prev, colorId: String(mapped[0].id) }));
        } else {
          setNewOrder(prev => ({ ...prev, colorId: '' }));
        }
      } catch (e) {
        console.error('Error loading colors for motorbike:', e);
        setMotorbikeColors([]);
        setNewOrder(prev => ({ ...prev, colorId: '' }));
      }
    };
    fetchMotorbikeColors();
  }, [newOrder.motorbikeId]);

  // Clear promotion if it becomes incompatible (expired or wrong motorbike)
  useEffect(() => {
    if (!newOrder.promotionId) return;
    const selectedPromo = promotions.find(p => String(p.id) === String(newOrder.promotionId));
    if (!selectedPromo) return;
    const now = new Date();
    const withinTime = (!selectedPromo.startAt || new Date(selectedPromo.startAt) <= now)
      && (!selectedPromo.endAt || new Date(selectedPromo.endAt) >= now);
    
    // Check if motorbike matches - handle empty string case
    const hasValidMotorbikeId = newOrder.motorbikeId && String(newOrder.motorbikeId).trim() !== '';
    const motorbikeOk = !selectedPromo.motorbikeId
      || (hasValidMotorbikeId && Number(selectedPromo.motorbikeId) === Number(newOrder.motorbikeId));
    
    if (!withinTime || !motorbikeOk) {
      console.warn('⚠️ [OrderManagement] Clearing invalid promotion selection', {
        promotionId: newOrder.promotionId,
        promoMotorbikeId: selectedPromo.motorbikeId,
        selectedMotorbikeId: newOrder.motorbikeId,
        hasValidMotorbikeId,
        withinTime,
        motorbikeOk,
      });
      setNewOrder(prev => ({ ...prev, promotionId: '' }));
    }
  }, [newOrder.motorbikeId, newOrder.promotionId, promotions]);

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
        showError('Error', 'Agency information not found');
        return;
      }

      const agencyId = parseInt(user.agencyId);
      console.log('🔄 [OrderManagement] Call API với agencyId:', agencyId);
      const response = await orderRestockManagerService.getOrderRestockListByAgency(agencyId, { page: 1, limit: 1000 });
      
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
        showError('Error', response.error || 'Unable to load order list');
      }
    } catch (error) {
      console.error('❌ [OrderManagement] Exception loading orders:', error);
      console.error('❌ [OrderManagement] Error details:', error.message, error.stack);
      showError('Error', 'Unable to load order list');
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
    console.log('👉 [OrderManagement] Bấm Tạo đơn');
    setCreating(true);
    showInfo('Processing', 'Creating order, please wait...');
    if (!newOrder.quantity || !newOrder.colorId) {
      console.warn('⚠️ [OrderManagement] Thiếu thông tin bắt buộc: quantity/colorId', {
        quantity: newOrder.quantity,
        colorId: newOrder.colorId,
      });
      showError('Error', 'Please enter quantity and select color');
      setCreating(false);
      return;
    }

    if (!newOrder.warehouseId || !newOrder.motorbikeId) {
      console.warn('⚠️ [OrderManagement] Thiếu thông tin bắt buộc: warehouseId/motorbikeId', {
        warehouseId: newOrder.warehouseId,
        motorbikeId: newOrder.motorbikeId,
      });
      showError('Error', 'Please select Warehouse and Motorbike');
      setCreating(false);
      return;
    }

    // Ensure agency is available either from form or user context
    if (!newOrder.agencyId && !user?.agencyId) {
      console.warn('⚠️ [OrderManagement] Thiếu thông tin bắt buộc: agencyId (không có từ user context)');
      showError('Error', 'Please select Agency');
      setCreating(false);
      return;
    }

    // Ensure agencyId is set from user context
    if (!newOrder.agencyId && user?.agencyId) {
      newOrder.agencyId = String(user.agencyId);
    }

    try {
      console.log('🚀 [OrderManagement] Bắt đầu gọi API tạo đơn...');
      const orderRestockData = {
        quantity: parseInt(newOrder.quantity) || 0,
        warehouseId: parseInt(newOrder.warehouseId) || 0,
        motorbikeId: parseInt(newOrder.motorbikeId) || 0,
        colorId: parseInt(newOrder.colorId) || 1,
        agencyId: parseInt(newOrder.agencyId || user?.agencyId) || 0,
      };
      if (newOrder.discountId) {
        orderRestockData.discountId = parseInt(newOrder.discountId);
      }
      if (newOrder.promotionId) {
        orderRestockData.promotionId = parseInt(newOrder.promotionId);
      }

      console.log('Creating order restock with data:', orderRestockData);

      // Call the order-restock API
      const response = await orderService.createOrderRestock(orderRestockData);
      
      console.log('📦 [OrderManagement] Create order response:', {
        success: response.success,
        orderId: response.orderId,
        orderData: response.data
      });
      
      if (response.success) {
        console.log('✅ [OrderManagement] API trả về success');
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
            navigation.navigate('OrderRestockDetailManager', {
              orderId: orderId,
              onStatusUpdate: () => {
                loadOrders();
              }
            });
          }, 100);
          
          // Reload orders in background (but navigate first)
          loadOrders();
          
          const successMessage = `Order #${orderId} has been created successfully!`;
          showSuccess('Success', successMessage);
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
        
        showSuccess('Success', response.message || 'Order has been created successfully!');
      } else {
        console.error('❌ [OrderManagement] API tạo đơn thất bại:', response);
        const serverMessage = response.message || response.error || 'Unable to create order';
        showError('Error', serverMessage);
      }
    } catch (error) {
      console.error('Error creating order:', error);
      const serverMessage = (error?.response?.data?.message)
        || (typeof error?.message === 'string' ? error.message : '')
        || 'Unable to create order';
      console.error('Error details:', error?.response?.data || {});
      showError('Error', serverMessage);
    } finally {
      console.log('🔚 [OrderManagement] Kết thúc quy trình tạo đơn');
      setCreating(false);
    }
  };

  const handleCancelOrder = (orderId) => {
    showConfirm(
      'Confirm Cancel',
      'Are you sure you want to cancel this order?',
      async () => {
        try {
          const response = await orderRestockManagerService.deleteOrderRestock(orderId);
          if (response.success) {
            showSuccess('Success', 'Order has been canceled successfully!');
            loadOrders();
          } else {
            showError('Error', response.error || 'Unable to cancel order');
          }
        } catch (error) {
          console.error('Error canceling order:', error);
          showError('Error', 'Unable to cancel order');
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
      case 'CANCELED': return COLORS.ERROR;
      default: return COLORS.TEXT.SECONDARY;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'DRAFT': return 'Draft';
      case 'PENDING': return 'Pending';
      case 'APPROVED': return 'Approved';
      case 'DELIVERED': return 'Delivered';
      case 'CANCELED': return 'Canceled';
      default: return status || 'Unknown';
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
    
    // Get orderId and orderItemId from order
    const orderId = order.id;
    
    if (!orderId) {
      console.error('❌ [OrderManagement] Không có orderId trong order object:', order);
      showError('Error', 'Order ID not found. Please refresh the list.');
      return;
    }
    
    // Get orderItemId from first orderItem
    const orderItemId = order.orderItems?.[0]?.id;
    
    console.log('✅ [OrderManagement] Navigating to OrderRestockDetail with orderId:', orderId, 'orderItemId:', orderItemId);
    
    navigation.navigate('OrderRestockDetailManager', {
      orderId: orderId,
      orderItemId: orderItemId,
      orderInfo: order, // Pass full order info from list
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
          <Text style={styles.detailLabel}>Quantity:</Text>
          <Text style={styles.detailValue}>{order.itemQuantity || order.orderItems?.[0]?.quantity || 0} units</Text>
        </View>
        {order.orderItems?.[0] && (
          <>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Base Price:</Text>
              <Text style={styles.detailValue}>{formatPrice(order.orderItems[0].basePrice || 0)}</Text>
            </View>
            {order.orderItems[0].discountTotal > 0 && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Discount:</Text>
                <Text style={[styles.detailValue, { color: COLORS.ERROR }]}>
                  -{formatPrice(order.orderItems[0].discountTotal || 0)}
                </Text>
              </View>
            )}
            {order.orderItems[0].promotionTotal > 0 && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Promotion:</Text>
                <Text style={[styles.detailValue, { color: COLORS.SUCCESS }]}>
                  -{formatPrice(order.orderItems[0].promotionTotal || 0)}
                </Text>
              </View>
            )}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Final Price:</Text>
              <Text style={[styles.detailValue, { fontWeight: 'bold' }]}>
                {formatPrice(order.orderItems[0].finalPrice || 0)}
              </Text>
            </View>
          </>
        )}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Total:</Text>
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
            <Text style={styles.cancelButtonText}>Delete Order</Text>
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
            <Text style={styles.modalCloseText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Create New Order</Text>
          <TouchableOpacity
            style={styles.modalSaveButton}
            onPress={handleCreateOrder}
            disabled={creating}
          >
            {creating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.modalSaveText}>Create Order</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {/* Mẫu xe: không cần hiển thị */}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Quantity *</Text>
            <TextInput
              style={styles.textInput}
              value={newOrder.quantity}
              onChangeText={(text) => setNewOrder({ ...newOrder, quantity: text })}
              placeholder="Enter quantity"
              placeholderTextColor={COLORS.TEXT.SECONDARY}
              keyboardType="numeric"
            />
          </View>

          {/* Selector màu theo mẫu xe: bỏ vì không dùng mẫu xe */}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Motorbike *</Text>
            <View style={styles.vehicleSelector}>
              {motorbikes.length > 0 ? (
                motorbikes.map((mb) => (
                  <TouchableOpacity
                    key={mb.id}
                    style={[
                      styles.vehicleOption,
                      newOrder.motorbikeId === String(mb.id) && styles.selectedVehicleOption
                    ]}
                    onPress={() => setNewOrder({ ...newOrder, motorbikeId: String(mb.id), colorId: '' })}
                  >
                    <Text style={[
                      styles.vehicleOptionText,
                      newOrder.motorbikeId === String(mb.id) && styles.selectedVehicleOptionText
                    ]}>
                      {mb.name || mb.model || `Motorbike ${mb.id}`}
                    </Text>
                    {/* ID hidden per requirement */}
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.noOptionsText}>Loading motorbikes...</Text>
              )}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Color *</Text>
            <View style={styles.vehicleSelector}>
              {motorbikeColors.length > 0 ? (
                motorbikeColors.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={[
                      styles.vehicleOption,
                      newOrder.colorId === String(c.id) && styles.selectedVehicleOption
                    ]}
                    onPress={() => setNewOrder({ ...newOrder, colorId: String(c.id) })}
                  >
                    <Text style={[
                      styles.vehicleOptionText,
                      newOrder.colorId === String(c.id) && styles.selectedVehicleOptionText
                    ]}>
                      {c.colorType}
                    </Text>
                    {/* Không hiển thị ID màu */}
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.noOptionsText}>Select motorbike first to display colors</Text>
              )}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Warehouse *</Text>
            <View style={styles.vehicleSelector}>
              {warehouses.length > 0 ? (
                warehouses.map((wh) => (
                  <TouchableOpacity
                    key={wh.id}
                    style={[
                      styles.vehicleOption,
                      newOrder.warehouseId === String(wh.id) && styles.selectedVehicleOption
                    ]}
                    onPress={() => setNewOrder({ ...newOrder, warehouseId: String(wh.id) })}
                  >
                    <Text style={[
                      styles.vehicleOptionText,
                      newOrder.warehouseId === String(wh.id) && styles.selectedVehicleOptionText
                    ]}>
                      {wh.name || wh.location || `Warehouse`}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.noOptionsText}>Loading warehouses...</Text>
              )}
            </View>
          </View>

          {/* Đại lý: không cần hiển thị vì tự lấy từ user.agencyId */}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Discount (optional)</Text>
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
                  None
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
                      {disc.name || disc.description || `Discount ${disc.id}`}
                    </Text>
                    {/* ID hidden per requirement */}
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.noOptionsText}>No discount codes available</Text>
              )}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Promotion (optional)</Text>
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
                  None
                </Text>
              </TouchableOpacity>
              {promotions.length > 0 ? (
                promotions
                  .filter(p => !p.motorbikeId || String(p.motorbikeId) === String(newOrder.motorbikeId || ''))
                  .map((promo) => (
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
                      {promo.name || `Promotion ${promo.id}`}
                    </Text>
                    {/* ID hidden per requirement */}
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.noOptionsText}>Loading promotions...</Text>
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
          <ArrowLeft size={20} color={COLORS.TEXT.WHITE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Management</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('CreateOrderRestock')}
        >
          <Plus size={20} color={COLORS.TEXT.WHITE} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={20} color={COLORS.TEXT.SECONDARY} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search orders..."
          placeholderTextColor={COLORS.TEXT.SECONDARY}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{orders.length}</Text>
          <Text style={styles.statLabel}>Total Orders</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: COLORS.WARNING }]}>
            {orders.filter(o => o.status === 'PENDING').length}
          </Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: COLORS.SUCCESS }]}>
            {orders.filter(o => o.status === 'APPROVED').length}
          </Text>
          <Text style={styles.statLabel}>Approved</Text>
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
                <Clock size={64} color={COLORS.TEXT.SECONDARY} />
                <Text style={styles.emptyTitle}>Loading...</Text>
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
                <Package size={64} color={COLORS.TEXT.SECONDARY} />
                <Text style={styles.emptyTitle}>No Orders</Text>
                <Text style={styles.emptySubtitle}>
                  Create your first order from EVM
                </Text>
              </View>
            );
          }
        })()}
      </ScrollView>

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
    marginRight: SIZES.PADDING.SMALL,
  },
  searchInput: {
    flex: 1,
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
    marginLeft: SIZES.PADDING.SMALL,
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

