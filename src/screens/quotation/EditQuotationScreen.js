import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Platform,
  TextInput,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS, SIZES } from '../../constants';
import { quotationService } from '../../services/quotationService';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import { ArrowLeft, Calendar } from 'lucide-react-native';

const EditQuotationScreen = ({ navigation, route }) => {
  const { quotation, quotationId } = route.params || {};
  const { alertConfig, hideAlert, showSuccess, showError } = useCustomAlert();
  
  const [loading, setLoading] = useState(false);
  const [quotationType, setQuotationType] = useState('AT_STORE');
  const [status, setStatus] = useState('DRAFT');
  const [validUntil, setValidUntil] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [quotationData, setQuotationData] = useState(null);
  const [basePrice, setBasePrice] = useState('');
  const [promotionPrice, setPromotionPrice] = useState('');
  const [finalPrice, setFinalPrice] = useState('');

  useEffect(() => {
    loadQuotationDetail();
  }, []);

  const loadQuotationDetail = async () => {
    if (!quotationId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await quotationService.getQuotationById(parseInt(quotationId));
      if (response.success && response.data) {
        const detail = response.data;
        setQuotationData(detail);
        
        // Set initial values
        setQuotationType(detail.type || 'AT_STORE');
        setStatus(detail.status?.toUpperCase() || 'DRAFT');
        if (detail.validUntil) {
          setValidUntil(new Date(detail.validUntil));
        }
        if (detail.basePrice !== undefined && detail.basePrice !== null) {
          setBasePrice(String(detail.basePrice));
        }
        if (detail.promotionPrice !== undefined && detail.promotionPrice !== null) {
          setPromotionPrice(String(detail.promotionPrice));
        }
        if (detail.finalPrice !== undefined && detail.finalPrice !== null) {
          setFinalPrice(String(detail.finalPrice));
        }
      } else {
        showError('Error', 'Failed to load quotation details');
      }
    } catch (error) {
      console.error('Error loading quotation detail:', error);
      showError('Error', 'Failed to load quotation details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-calculate finalPrice = basePrice - promotionPrice
  useEffect(() => {
    const base = basePrice === '' ? 0 : Number(basePrice);
    const promo = promotionPrice === '' ? 0 : Number(promotionPrice);
    if (!Number.isNaN(base) && !Number.isNaN(promo)) {
      const computed = Math.max(0, base - promo);
      setFinalPrice(String(computed));
    }
  }, [basePrice, promotionPrice]);

  const formatDateForDisplay = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleDateChange = (event, selectedDate) => {
    // Keep picker open on iOS (close via tapping outside modal), auto-close on Android
    setShowDatePicker(Platform.OS === 'ios');

    if (event?.type === 'dismissed') {
      return;
    }

    if (selectedDate) {
      setValidUntil(selectedDate);
    }
  };

  const handleUpdateQuotation = async () => {
    if (!quotationId) {
      showError('Error', 'Quotation ID not found');
      return;
    }

    setLoading(true);
    try {
      const validUntilDate = new Date(validUntil);
      validUntilDate.setHours(23, 59, 59, 0);
      
      // parse numeric fields safely
      const parsedBasePrice = basePrice === '' ? undefined : Number(basePrice);
      const parsedPromotionPrice = promotionPrice === '' ? undefined : Number(promotionPrice);
      const parsedFinalPrice = finalPrice === '' ? undefined : Number(finalPrice);
      
      if (
        (parsedBasePrice !== undefined && Number.isNaN(parsedBasePrice)) ||
        (parsedPromotionPrice !== undefined && Number.isNaN(parsedPromotionPrice)) ||
        (parsedFinalPrice !== undefined && Number.isNaN(parsedFinalPrice))
      ) {
        throw new Error('Price fields must be numbers');
      }

      const updateData = {
        type: quotationType,
        status: status,
        basePrice: parsedBasePrice,
        promotionPrice: parsedPromotionPrice,
        finalPrice: parsedFinalPrice,
        validUntil: validUntilDate.toISOString(),
      };

      const response = await quotationService.updateQuotation(parseInt(quotationId), updateData);

      if (response.success) {
        showSuccess(
          'Update Successful',
          'Quotation has been updated successfully',
          () => {
            navigation.goBack();
          }
        );
      } else {
        throw new Error(response.error || 'Failed to update quotation');
      }
    } catch (error) {
      console.error('Error updating quotation:', error);
      showError('Error', error.message || 'Failed to update quotation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getTypeText = (type) => {
    switch (type) {
      case 'AT_STORE': return 'At Store';
      case 'ORDER': return 'Order';
      case 'PRE_ORDER': return 'Pre-Order';
      default: return type || 'N/A';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'DRAFT': return 'Draft';
      case 'ACCEPTED': return 'Accepted';
      case 'REJECTED': return 'Rejected';
      case 'EXPIRED': return 'Expired';
      case 'REVERSED': return 'Reversed';
      default: return 'Unknown';
    }
  };

  if (loading && !quotationData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#009DFF" />
          <Text style={styles.loadingText}>Loading...</Text>
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
          <ArrowLeft color="#FFFFFF" size={20} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Quotation</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Loại Báo Giá */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quotation Type</Text>
          <View style={styles.optionsRow}>
            {['AT_STORE', 'ORDER', 'PRE_ORDER'].map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.optionButton,
                  quotationType === type && styles.optionButtonActive
                ]}
                onPress={() => setQuotationType(type)}
              >
                <Text style={[
                  styles.optionText,
                  quotationType === type && styles.optionTextActive
                ]}>
                  {getTypeText(type)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Trạng Thái */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Status</Text>
          <View style={styles.optionsRow}>
            {['DRAFT', 'ACCEPTED', 'REJECTED'].map((s) => (
              <TouchableOpacity
                key={s}
                style={[
                  styles.optionButton,
                  status === s && styles.optionButtonActive
                ]}
                onPress={() => setStatus(s)}
              >
                <Text style={[
                  styles.optionText,
                  status === s && styles.optionTextActive
                ]}>
                  {getStatusText(s)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.optionsRowSecond}>
            {['EXPIRED', 'REVERSED'].map((s) => (
              <TouchableOpacity
                key={s}
                style={[
                  styles.optionButton,
                  status === s && styles.optionButtonActive
                ]}
                onPress={() => setStatus(s)}
              >
                <Text style={[
                  styles.optionText,
                  status === s && styles.optionTextActive
                ]}>
                  {getStatusText(s)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Ngày Hết Hạn */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Valid Until</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateText}>
              {formatDateForDisplay(validUntil) || 'Select expiry date'}
            </Text>
            <Calendar color="#FFFFFF" size={18} />
          </TouchableOpacity>
        </View>

        {/* Giá */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Pricing</Text>
          <View style={styles.priceRow}>
            <View style={styles.priceField}>
              <Text style={styles.priceLabel}>Base Price</Text>
              <TextInput
                value={basePrice}
                onChangeText={setBasePrice}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={COLORS.TEXT.SECONDARY}
                style={styles.priceInput}
              />
            </View>
            <View style={styles.priceField}>
              <Text style={styles.priceLabel}>Promotion Price</Text>
              <TextInput
                value={promotionPrice}
                onChangeText={setPromotionPrice}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={COLORS.TEXT.SECONDARY}
                style={styles.priceInput}
              />
            </View>
          </View>
          <View style={styles.priceRow}>
            <View style={styles.priceFieldFull}>
              <Text style={styles.priceLabel}>Final Price</Text>
              <TextInput
                value={finalPrice}
                editable={false}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={COLORS.TEXT.SECONDARY}
                style={styles.priceInput}
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <Modal
          visible={showDatePicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowDatePicker(false)}>
            <View style={styles.datePickerOverlay}>
              <TouchableWithoutFeedback onPress={() => {}}>
                <View style={styles.datePickerContainer}>
                  <DateTimePicker
                    value={validUntil || new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleDateChange}
                    minimumDate={new Date()}
                    locale="vi-VN"
                    textColor="#000"
                  />
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}

      {/* Action Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.disabledButton]}
          onPress={handleUpdateQuotation}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#009DFF" />
          ) : (
            <Text style={styles.saveText}>Update</Text>
          )}
        </TouchableOpacity>
      </View>
      
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
    paddingTop: SIZES.PADDING.LARGE,
    paddingBottom: SIZES.PADDING.MEDIUM,
    backgroundColor: COLORS.BACKGROUND.SECONDARY,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: SIZES.FONT.XLARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SIZES.PADDING.LARGE,
  },
  card: {
    backgroundColor: COLORS.BACKGROUND.SECONDARY,
    borderRadius: SIZES.RADIUS.LARGE,
    padding: SIZES.PADDING.LARGE,
    marginBottom: SIZES.PADDING.LARGE,
  },
  cardTitle: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
    marginBottom: SIZES.PADDING.LARGE,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: SIZES.PADDING.SMALL,
    marginBottom: SIZES.PADDING.SMALL,
  },
  optionsRowSecond: {
    flexDirection: 'row',
    gap: SIZES.PADDING.SMALL,
  },
  optionButton: {
    flex: 1,
    paddingVertical: SIZES.PADDING.MEDIUM,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
    borderWidth: 1,
    borderColor: COLORS.BORDER.PRIMARY,
    borderRadius: SIZES.RADIUS.MEDIUM,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionButtonActive: {
    backgroundColor: "#009DFF",
    borderColor: "#009DFF",
  },
  optionText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    fontWeight: '600',
  },
  optionTextActive: {
    color: COLORS.TEXT.WHITE,
    fontWeight: 'bold',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SIZES.PADDING.MEDIUM,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
    borderWidth: 1,
    borderColor: COLORS.BORDER.PRIMARY,
    borderRadius: SIZES.RADIUS.MEDIUM,
  },
  dateText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.WHITE,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    padding: SIZES.PADDING.LARGE,
    backgroundColor: COLORS.BACKGROUND.SECONDARY,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER.PRIMARY,
    gap: SIZES.PADDING.MEDIUM,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: SIZES.PADDING.MEDIUM,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
    borderWidth: 1,
    borderColor: COLORS.BORDER.PRIMARY,
    borderRadius: SIZES.RADIUS.MEDIUM,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: '600',
    color: COLORS.TEXT.WHITE,
  },
  saveButton: {
    flex: 2,
    paddingVertical: SIZES.PADDING.MEDIUM,
    backgroundColor: "#009DFF",
    borderRadius: SIZES.RADIUS.MEDIUM,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
  disabledButton: {
    opacity: 0.6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SIZES.PADDING.MEDIUM,
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.WHITE,
  },
  priceRow: {
    flexDirection: 'row',
    gap: SIZES.PADDING.SMALL,
    marginBottom: SIZES.PADDING.SMALL,
  },
  priceField: {
    flex: 1,
  },
  priceFieldFull: {
    flex: 1,
  },
  priceLabel: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.WHITE,
    marginBottom: SIZES.PADDING.XSMALL,
    fontWeight: '600',
  },
  priceInput: {
    paddingVertical: SIZES.PADDING.MEDIUM,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
    borderWidth: 1,
    borderColor: COLORS.BORDER.PRIMARY,
    borderRadius: SIZES.RADIUS.MEDIUM,
    color: COLORS.TEXT.WHITE,
  },
  datePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerContainer: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.LARGE,
    padding: SIZES.PADDING.LARGE,
    width: '90%',
  },
});

export default EditQuotationScreen;
