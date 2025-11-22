import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import { COLORS, SIZES } from '../../constants';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react-native';
import orderRestockManagerService from '../../services/orderRestockManagerService';
import warehouseService from '../../services/warehouseService';
import motorbikeService from '../../services/motorbikeService';
import promotionService from '../../services/promotionService';
import { discountService } from '../../services/discountService';
import { useAuth } from '../../contexts/AuthContext';

const CreateOrderRestockScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [warehouses, setWarehouses] = useState([]);
  const [motorbikes, setMotorbikes] = useState([]);
  const [motorbikeColors, setMotorbikeColors] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [allDiscounts, setAllDiscounts] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  
  // List of orderItems to be created
  const [orderItemsList, setOrderItemsList] = useState([]);
  
  // Current orderItem being filled in the form
  const [orderItem, setOrderItem] = useState({
    quantity: '',
    warehouseId: '',
    motorbikeId: '',
    colorId: '',
    discountId: '',
    promotionId: '',
  });

  const { alertConfig, hideAlert, showSuccess, showError } = useCustomAlert();

  useEffect(() => {
    loadOptions();
  }, []);

  useEffect(() => {
    if (orderItem.motorbikeId) {
      fetchMotorbikeColors();
    }
  }, [orderItem.motorbikeId]);

  useEffect(() => {
    filterDiscounts();
  }, [orderItem.quantity, orderItem.motorbikeId, allDiscounts]);

  useEffect(() => {
    // Clear promotion if it becomes incompatible
    if (!orderItem.promotionId) return;
    const selectedPromo = promotions.find(p => String(p.id) === String(orderItem.promotionId));
    if (!selectedPromo) return;
    const now = new Date();
    const withinTime = (!selectedPromo.startAt || new Date(selectedPromo.startAt) <= now)
      && (!selectedPromo.endAt || new Date(selectedPromo.endAt) >= now);
    
    const hasValidMotorbikeId = orderItem.motorbikeId && String(orderItem.motorbikeId).trim() !== '';
    const motorbikeOk = !selectedPromo.motorbikeId
      || (hasValidMotorbikeId && Number(selectedPromo.motorbikeId) === Number(orderItem.motorbikeId));
    
    if (!withinTime || !motorbikeOk) {
      setOrderItem(prev => ({ ...prev, promotionId: '' }));
    }
  }, [orderItem.motorbikeId, orderItem.promotionId, promotions]);

  const loadOptions = async () => {
    try {
      setLoading(true);

      // Load warehouses
      const warehousesResponse = await warehouseService.getWarehousesList();
      if (warehousesResponse.success) {
        const warehousesList = warehousesResponse.data || [];
        setWarehouses(warehousesList);
        if (warehousesList.length > 0 && !orderItem.warehouseId) {
          setOrderItem(prev => ({
            ...prev,
            warehouseId: String(warehousesList[0].id),
          }));
        }
      }

      // Load motorbikes
      const motorbikesResponse = await motorbikeService.getAllMotorbikes({ limit: 100 });
      if (motorbikesResponse.success) {
        setMotorbikes(motorbikesResponse.data || []);
      }

      // Load promotions
      const promotionsResponse = await promotionService.getAgencyPromotions(1, 100);
      if (promotionsResponse.success) {
        const now = new Date();
        const activePromos = (promotionsResponse.data || []).filter(p => {
          const statusOk = (p.status || 'ACTIVE') === 'ACTIVE';
          const startOk = !p.startAt || new Date(p.startAt) <= now;
          const endAt = p.endAt ? new Date(p.endAt) : null;
          const endInclusive = endAt ? new Date(endAt.getTime() + 24*60*60*1000 - 1) : null;
          const endOk = !endInclusive || endInclusive >= now;
          return statusOk && startOk && endOk;
        });
        setPromotions(activePromos);
      }

      // Load discounts
      if (user?.agencyId) {
        const discountsResponse = await discountService.getAgencyDiscounts(
          parseInt(user.agencyId),
          1,
          200
        );
        if (discountsResponse.success) {
          setAllDiscounts(discountsResponse.data || []);
        }
      }
    } catch (error) {
      console.error('Error loading options:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMotorbikeColors = async () => {
    try {
      setMotorbikeColors([]);
      if (!orderItem.motorbikeId) return;
      const res = await motorbikeService.getMotorbikeById(parseInt(orderItem.motorbikeId));
      const payload = res?.data?.data || res?.data;
      const colors = Array.isArray(payload?.colors) ? payload.colors : [];
      const mapped = colors.map(item => ({
        id: item?.color?.id,
        colorType: item?.color?.colorType,
        imageUrl: item?.imageUrl,
      })).filter(c => c.id && c.colorType);
      setMotorbikeColors(mapped);
      if (mapped.length > 0) {
        setOrderItem(prev => ({ ...prev, colorId: String(mapped[0].id) }));
      } else {
        setOrderItem(prev => ({ ...prev, colorId: '' }));
      }
    } catch (e) {
      console.error('Error loading colors for motorbike:', e);
      setMotorbikeColors([]);
      setOrderItem(prev => ({ ...prev, colorId: '' }));
    }
  };

  const filterDiscounts = () => {
    if (!allDiscounts) return;
    const now = new Date();
    const qty = parseInt(orderItem.quantity) || 0;
    const selectedMotorbikeId = orderItem.motorbikeId ? Number(orderItem.motorbikeId) : null;
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
    if (orderItem.discountId && !filtered.find(d => String(d.id) === String(orderItem.discountId))) {
      setOrderItem(prev => ({ ...prev, discountId: '' }));
    }
  };

  const handleAddItem = () => {
    // Validate current item before adding
    if (!orderItem.quantity || !orderItem.motorbikeId || !orderItem.colorId) {
      showError('Error', 'Please fill in quantity, motorbike, and color');
      return;
    }

    const motorbike = motorbikes.find(mb => String(mb.id) === String(orderItem.motorbikeId));
    const color = motorbikeColors.find(c => String(c.id) === String(orderItem.colorId));
    const discount = discounts.find(d => String(d.id) === String(orderItem.discountId));
    const promotion = promotions.find(p => String(p.id) === String(orderItem.promotionId));

    // Create item object with display info
    const newItem = {
      id: Date.now(), // Temporary ID for list management
      quantity: parseInt(orderItem.quantity) || 0,
      motorbikeId: parseInt(orderItem.motorbikeId),
      colorId: parseInt(orderItem.colorId),
      discountId: orderItem.discountId ? parseInt(orderItem.discountId) : null,
      promotionId: orderItem.promotionId ? parseInt(orderItem.promotionId) : null,
      // Display info
      motorbikeName: motorbike?.name || motorbike?.model || `Motorbike ${orderItem.motorbikeId}`,
      colorName: color?.colorType || `Color ${orderItem.colorId}`,
      discountName: discount?.name || discount?.description || null,
      promotionName: promotion?.name || null,
    };

    setOrderItemsList(prev => [...prev, newItem]);

    // Reset form
    setOrderItem({
      quantity: '',
      warehouseId: orderItem.warehouseId, // Keep warehouse if was set
      motorbikeId: '',
      colorId: '',
      discountId: '',
      promotionId: '',
    });
    setMotorbikeColors([]);
  };

  const handleRemoveItem = (itemId) => {
    setOrderItemsList(prev => prev.filter(item => item.id !== itemId));
  };

  const clearForm = () => {
    setOrderItem({
      quantity: '',
      warehouseId: '',
      motorbikeId: '',
      colorId: '',
      discountId: '',
      promotionId: '',
    });
    setMotorbikeColors([]);
  };

  const handleCreateOrder = async () => {
    if (orderItemsList.length === 0) {
      showError('Error', 'Please add at least one order item');
      return;
    }

    if (!user?.agencyId) {
      showError('Error', 'Agency information not found');
      return;
    }

    setCreating(true);

    try {
      // API expects: { orderItems: [{ quantity, motorbikeId, colorId, discountId?, promotionId? }], agencyId }
      const orderRestockData = {
        agencyId: parseInt(user.agencyId),
        orderItems: orderItemsList.map(item => ({
          quantity: item.quantity,
          motorbikeId: item.motorbikeId,
          colorId: item.colorId,
          ...(item.discountId ? { discountId: item.discountId } : {}),
          ...(item.promotionId ? { promotionId: item.promotionId } : {}),
        }))
      };

      console.log('Creating order restock with data:', orderRestockData);

      const response = await orderRestockManagerService.createOrderRestock(orderRestockData);
      
      if (response.success) {
        const orderData = response.data || {};
        const orderId = response.orderId || orderData.id;
        
        if (orderId) {
          showSuccess('Success', `Order #${orderId} has been created successfully!`);
        } else {
          showSuccess('Success', response.message || 'Order has been created successfully!');
        }
        navigation.goBack();
      } else {
        showError('Error', response.error || 'Unable to create order');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      showError('Error', 'Unable to create order');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={24} color={COLORS.TEXT.WHITE} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create New Order</Text>
          <View style={styles.headerActions} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#009DFF" />
          <Text style={styles.loadingText}>Loading...</Text>
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
          <ArrowLeft size={24} color={COLORS.TEXT.WHITE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create New Order</Text>
        <View style={styles.headerActions} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
        >
          <View style={styles.formSection}>
            {/* Order Items List */}
            {orderItemsList.length > 0 && (
              <View style={styles.itemsListSection}>
                <Text style={styles.sectionTitle}>Order Items ({orderItemsList.length})</Text>
                {orderItemsList.map((item, index) => (
                  <View key={item.id} style={styles.itemCard}>
                    <View style={styles.itemCardContent}>
                      <Text style={styles.itemCardTitle}>Item #{index + 1}</Text>
                      <Text style={styles.itemCardText}>
                        <Text style={styles.itemCardLabel}>Motorbike: </Text>
                        {item.motorbikeName}
                      </Text>
                      <Text style={styles.itemCardText}>
                        <Text style={styles.itemCardLabel}>Color: </Text>
                        {item.colorName}
                      </Text>
                      <Text style={styles.itemCardText}>
                        <Text style={styles.itemCardLabel}>Quantity: </Text>
                        {item.quantity}
                      </Text>
                      {item.discountName && (
                        <Text style={styles.itemCardText}>
                          <Text style={styles.itemCardLabel}>Discount: </Text>
                          {item.discountName}
                        </Text>
                      )}
                      {item.promotionName && (
                        <Text style={styles.itemCardText}>
                          <Text style={styles.itemCardLabel}>Promotion: </Text>
                          {item.promotionName}
                        </Text>
                      )}
                    </View>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => handleRemoveItem(item.id)}
                    >
                      <Trash2 size={18} color={COLORS.ERROR} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Add New Item Form */}
            <View style={styles.addItemSection}>
              <Text style={styles.sectionTitle}>
                {orderItemsList.length > 0 ? 'Add Another Item' : 'Add Order Item'}
              </Text>
              
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Quantity *</Text>
              <TextInput
                style={styles.textInput}
                value={orderItem.quantity}
                onChangeText={(text) => setOrderItem({ ...orderItem, quantity: text })}
                placeholder="Enter quantity"
                placeholderTextColor={COLORS.TEXT.SECONDARY}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Motorbike *</Text>
              <View style={styles.vehicleSelector}>
                {motorbikes.length > 0 ? (
                  motorbikes.map((mb) => (
                    <TouchableOpacity
                      key={mb.id}
                      style={[
                        styles.vehicleOption,
                        orderItem.motorbikeId === String(mb.id) && styles.selectedVehicleOption
                      ]}
                      onPress={() => setOrderItem({ ...orderItem, motorbikeId: String(mb.id), colorId: '' })}
                    >
                      <Text style={[
                        styles.vehicleOptionText,
                        orderItem.motorbikeId === String(mb.id) && styles.selectedVehicleOptionText
                      ]}>
                        {mb.name || mb.model || `Motorbike ${mb.id}`}
                      </Text>
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
                        orderItem.colorId === String(c.id) && styles.selectedVehicleOption
                      ]}
                      onPress={() => setOrderItem({ ...orderItem, colorId: String(c.id) })}
                    >
                      <Text style={[
                        styles.vehicleOptionText,
                        orderItem.colorId === String(c.id) && styles.selectedVehicleOptionText
                      ]}>
                        {c.colorType}
                      </Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={styles.noOptionsText}>Select motorbike first to display colors</Text>
                )}
              </View>
            </View>


            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Discount (optional)</Text>
              <View style={styles.vehicleSelector}>
                <TouchableOpacity
                  style={[
                    styles.vehicleOption,
                    !orderItem.discountId && styles.selectedVehicleOption
                  ]}
                  onPress={() => setOrderItem({ ...orderItem, discountId: '' })}
                >
                  <Text style={[
                    styles.vehicleOptionText,
                    !orderItem.discountId && styles.selectedVehicleOptionText
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
                        orderItem.discountId === String(disc.id) && styles.selectedVehicleOption
                      ]}
                      onPress={() => setOrderItem({ ...orderItem, discountId: String(disc.id) })}
                    >
                      <Text style={[
                        styles.vehicleOptionText,
                        orderItem.discountId === String(disc.id) && styles.selectedVehicleOptionText
                      ]}>
                        {disc.name || disc.description || `Discount ${disc.id}`}
                      </Text>
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
                    !orderItem.promotionId && styles.selectedVehicleOption
                  ]}
                  onPress={() => setOrderItem({ ...orderItem, promotionId: '' })}
                >
                  <Text style={[
                    styles.vehicleOptionText,
                    !orderItem.promotionId && styles.selectedVehicleOptionText
                  ]}>
                    None
                  </Text>
                </TouchableOpacity>
                {promotions.length > 0 ? (
                  promotions
                    .filter(p => !p.motorbikeId || String(p.motorbikeId) === String(orderItem.motorbikeId || ''))
                    .map((promo) => (
                      <TouchableOpacity
                        key={promo.id}
                        style={[
                          styles.vehicleOption,
                          orderItem.promotionId === String(promo.id) && styles.selectedVehicleOption
                        ]}
                        onPress={() => setOrderItem({ ...orderItem, promotionId: String(promo.id) })}
                      >
                        <Text style={[
                          styles.vehicleOptionText,
                          orderItem.promotionId === String(promo.id) && styles.selectedVehicleOptionText
                        ]}>
                          {promo.name || `Promotion ${promo.id}`}
                        </Text>
                      </TouchableOpacity>
                    ))
                ) : (
                  <Text style={styles.noOptionsText}>Loading promotions...</Text>
                )}
              </View>
            </View>

            <TouchableOpacity
              style={styles.addItemButton}
              onPress={handleAddItem}
            >
              <Plus size={18} color={COLORS.TEXT.WHITE} />
              <Text style={styles.addItemButtonText}>Add Item</Text>
            </TouchableOpacity>
            </View>

            {/* Submit Button */}
            {orderItemsList.length > 0 && (
              <TouchableOpacity
                style={[styles.submitButton, creating && styles.submitButtonDisabled]}
                onPress={handleCreateOrder}
                disabled={creating}
              >
                {creating ? (
                  <ActivityIndicator size="small" color={COLORS.TEXT.WHITE} />
                ) : (
                  <Text style={styles.submitButtonText}>Create Order ({orderItemsList.length} items)</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.PADDING.LARGE,
    paddingTop: Platform.OS === 'ios' ? SIZES.PADDING.XLARGE : SIZES.PADDING.XXXLARGE + 5,
    paddingBottom: SIZES.PADDING.MEDIUM,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: SIZES.FONT.XXLARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
    flex: 1,
    textAlign: 'center',
  },
  headerActions: {
    width: 40,
    alignItems: 'flex-end',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.SURFACE,
    borderTopLeftRadius: SIZES.RADIUS.XXLARGE,
    borderTopRightRadius: SIZES.RADIUS.XXLARGE,
    paddingBottom: SIZES.PADDING.XXXLARGE,
    overflow: 'hidden',
  },
  contentContainer: {
    paddingBottom: SIZES.PADDING.XXXLARGE,
  },
  formSection: {
    padding: SIZES.PADDING.LARGE,
    paddingBottom: SIZES.PADDING.XXXLARGE,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SIZES.PADDING.MEDIUM,
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
  },
  inputGroup: {
    marginBottom: SIZES.PADDING.LARGE,
  },
  inputLabel: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SIZES.PADDING.SMALL,
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.MEDIUM,
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
    borderWidth: 1,
    borderColor: COLORS.BORDER.PRIMARY,
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
    borderColor: COLORS.BORDER.PRIMARY,
  },
  selectedVehicleOption: {
    borderColor: '#009DFF',
    backgroundColor: 'rgba(0,157,255,0.12)',
  },
  vehicleOptionText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '600',
    marginBottom: 4,
  },
  selectedVehicleOptionText: {
    color: '#009DFF',
  },
  noOptionsText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    textAlign: 'center',
    padding: SIZES.PADDING.MEDIUM,
    fontStyle: 'italic',
  },
  submitButton: {
    backgroundColor: '#009DFF',
    borderRadius: SIZES.RADIUS.LARGE,
    paddingVertical: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
    marginTop: SIZES.PADDING.LARGE,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
  itemsListSection: {
    marginBottom: SIZES.PADDING.LARGE,
  },
  sectionTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  itemCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
    marginBottom: SIZES.PADDING.SMALL,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.BORDER.PRIMARY,
  },
  itemCardContent: {
    flex: 1,
  },
  itemCardTitle: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SIZES.PADDING.XSMALL,
  },
  itemCardText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: 2,
  },
  itemCardLabel: {
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
  },
  removeButton: {
    padding: SIZES.PADDING.SMALL,
    marginLeft: SIZES.PADDING.SMALL,
  },
  addItemSection: {
    marginBottom: SIZES.PADDING.LARGE,
    paddingTop: SIZES.PADDING.MEDIUM,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER.PRIMARY,
  },
  addItemButton: {
    backgroundColor: '#009DFF',
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingVertical: SIZES.PADDING.MEDIUM,
    paddingHorizontal: SIZES.PADDING.LARGE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SIZES.PADDING.SMALL,
    marginTop: SIZES.PADDING.MEDIUM,
  },
  addItemButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
});

export default CreateOrderRestockScreen;

