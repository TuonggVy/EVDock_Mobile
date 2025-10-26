import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES } from '../../constants';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const DealerAssignmentModal = ({
  visible,
  onClose,
  dealers = [],
  selectedDealers = [],
  onDealersChange,
  title = "Agency Assignment"
}) => {
  const [localSelectedDealers, setLocalSelectedDealers] = useState([]);

  useEffect(() => {
    if (visible) {
      setLocalSelectedDealers([...selectedDealers]);
      console.log('DealerAssignmentModal - Dealers:', dealers);
      console.log('DealerAssignmentModal - Selected Dealers:', selectedDealers);
    }
  }, [visible, selectedDealers, dealers]);

  const handleDealerToggle = (dealerId) => {
    setLocalSelectedDealers(prev => {
      if (prev.includes(dealerId)) {
        return prev.filter(id => id !== dealerId);
      } else {
        return [...prev, dealerId];
      }
    });
  };

  const handleSelectAll = () => {
    setLocalSelectedDealers(dealers.map(dealer => dealer.id));
  };

  const handleClearAll = () => {
    setLocalSelectedDealers([]);
  };

  const handleConfirm = () => {
    onDealersChange(localSelectedDealers);
    onClose();
  };

  const handleCancel = () => {
    setLocalSelectedDealers([...selectedDealers]);
    onClose();
  };

  console.log('DealerAssignmentModal render - visible:', visible, 'dealers:', dealers);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.selectAllButton]}
              onPress={handleSelectAll}
            >
              <Text style={styles.actionButtonIcon}>✓</Text>
              <Text style={styles.actionButtonText}>Select All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.clearAllButton]}
              onPress={handleClearAll}
            >
              <Text style={styles.actionButtonIcon}>✕</Text>
              <Text style={styles.actionButtonText}>Clear All</Text>
            </TouchableOpacity>
          </View>

          {/* Dealer List */}
          <View style={styles.dealerListContainer}>
            <Text style={styles.dealerCount}>
              {localSelectedDealers.length} of {dealers?.length || 0} agencies selected
            </Text>
            <ScrollView 
              style={styles.dealerList}
              showsVerticalScrollIndicator={false}
            >
              {dealers && dealers.length > 0 ? dealers.map((dealer) => (
                <TouchableOpacity
                  key={dealer.id}
                  style={[
                    styles.dealerItem,
                    localSelectedDealers.includes(dealer.id) && styles.selectedDealerItem
                  ]}
                  onPress={() => handleDealerToggle(dealer.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.dealerInfo}>
                    <View style={styles.dealerAvatar}>
                      <Text style={styles.dealerAvatarText}>
                        {dealer.name.charAt(0)}
                      </Text>
                    </View>
                    <View style={styles.dealerDetails}>
                      <Text style={styles.dealerName}>{dealer.name}</Text>
                      <Text style={styles.dealerCity}>📍 {dealer.location || dealer.city || 'N/A'}</Text>
                    </View>
                  </View>
                  <View style={[
                    styles.checkbox,
                    localSelectedDealers.includes(dealer.id) && styles.checkedCheckbox
                  ]}>
                    {localSelectedDealers.includes(dealer.id) && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </View>
                </TouchableOpacity>
              )) : (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyIcon}>🏢</Text>
                  <Text style={styles.emptyTitle}>No dealers available</Text>
                  <Text style={styles.emptySubtitle}>
                    Please check your dealer data
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>

          {/* Footer Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirm}
            >
              <LinearGradient
                colors={COLORS.GRADIENT.GREEN || ['#4CAF50', '#66BB6A']}
                style={styles.confirmGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.confirmButtonText}>Confirm Selection</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    paddingBottom: 30, // Giảm từ 50 xuống 30 để modal lớn hơn
  },
  modalContainer: {
    backgroundColor: COLORS.SURFACE,
    borderTopLeftRadius: SIZES.RADIUS.LARGE,
    borderTopRightRadius: SIZES.RADIUS.LARGE,
    maxHeight: SCREEN_HEIGHT * 0.85, // Tăng từ 0.75 lên 0.85
    minHeight: SCREEN_HEIGHT * 0.45, // Tăng từ 0.35 lên 0.45
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.PADDING.LARGE,
    paddingVertical: SIZES.PADDING.MEDIUM,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  title: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.BACKGROUND,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.PADDING.LARGE,
    paddingVertical: SIZES.PADDING.MEDIUM,
    gap: SIZES.PADDING.MEDIUM,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.PADDING.SMALL,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    borderRadius: SIZES.RADIUS.MEDIUM,
    gap: SIZES.PADDING.XSMALL,
  },
  selectAllButton: {
    backgroundColor: COLORS.WARNING,
  },
  clearAllButton: {
    backgroundColor: COLORS.ERROR,
  },
  actionButtonIcon: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.WHITE,
    fontWeight: 'bold',
  },
  actionButtonText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
  },
  dealerListContainer: {
    flex: 1,
    paddingHorizontal: SIZES.PADDING.LARGE,
    minHeight: 250, // Tăng từ 180 lên 250
  },
  dealerCount: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: SIZES.PADDING.SMALL,
    textAlign: 'center',
  },
  dealerList: {
    flex: 1,
    minHeight: 200, // Tăng từ 120 lên 200
  },
  dealerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SIZES.PADDING.SMALL, // Giảm từ MEDIUM xuống SMALL
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    marginBottom: SIZES.PADDING.XSMALL,
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: SIZES.RADIUS.MEDIUM,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  selectedDealerItem: {
    backgroundColor: COLORS.PRIMARY + '10',
    borderColor: COLORS.PRIMARY,
  },
  dealerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dealerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.PADDING.MEDIUM,
  },
  dealerAvatarText: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
  dealerDetails: {
    flex: 1,
  },
  dealerName: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: 2,
  },
  dealerCity: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.BORDER,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.SURFACE,
  },
  checkedCheckbox: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  checkmark: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.WHITE,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.PADDING.LARGE,
    paddingTop: SIZES.PADDING.MEDIUM,
    paddingBottom: SIZES.PADDING.SMALL, // Thêm padding bottom
    gap: SIZES.PADDING.MEDIUM,
    backgroundColor: COLORS.SURFACE, // Đảm bảo footer có background
  },
  cancelButton: {
    flex: 1,
    paddingVertical: SIZES.PADDING.MEDIUM,
    borderRadius: SIZES.RADIUS.MEDIUM,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    backgroundColor: COLORS.SURFACE,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    borderRadius: SIZES.RADIUS.MEDIUM,
    overflow: 'hidden',
  },
  confirmGradient: {
    paddingVertical: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.PADDING.XLARGE,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  emptyTitle: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SIZES.PADDING.SMALL,
  },
  emptySubtitle: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    textAlign: 'center',
  },
});

export default DealerAssignmentModal;
