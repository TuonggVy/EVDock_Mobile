import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Platform,
} from 'react-native';
import { COLORS, SIZES } from '../../constants';
import creditLineService from '../../services/creditLineService';
import CustomAlert from '../../components/common/CustomAlert';
import { Pencil, Trash2, ArrowLeft, CreditCard } from 'lucide-react-native';

const CreditLineDetailScreen = ({ navigation, route }) => {
  const { creditLineId } = route.params;
  const [creditLine, setCreditLine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'info' });
  const [confirmVisible, setConfirmVisible] = useState(false);

  useEffect(() => {
    loadCreditLineDetail();

    // Reload when screen comes into focus (after editing)
    const unsubscribe = navigation.addListener('focus', () => {
      loadCreditLineDetail();
    });

    return unsubscribe;
  }, [creditLineId, navigation]);

  const loadCreditLineDetail = async () => {
    try {
      setLoading(true);
      const response = await creditLineService.getCreditLineDetail(creditLineId);
      
      if (response.success) {
        setCreditLine(response.data);
      } else {
        const errorMessage = typeof response.error === 'string' 
          ? response.error 
          : (response.error?.message || JSON.stringify(response.error) || 'Failed to load credit line detail');
        setAlertConfig({
          title: 'Error',
          message: errorMessage,
          type: 'error'
        });
        setShowAlert(true);
      }
    } catch (error) {
      console.error('Error loading credit line detail:', error);
      setAlertConfig({
        title: 'Error',
        message: 'An unexpected error occurred',
        type: 'error'
      });
      setShowAlert(true);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (creditLine) {
      navigation.navigate('CreateCreditLine', { creditLine });
    }
  };

  const handleDelete = () => {
    if (!creditLine) return;
    setConfirmVisible(true);
  };

  const confirmDelete = async () => {
    if (!creditLine) return;
  try {
    const response = await creditLineService.deleteCreditLine(creditLineId);
    if (response.success) {
      setAlertConfig({
        title: 'Success',
        message: 'Credit line deleted successfully',
        type: 'success'
      });
      setShowAlert(true);
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } else {
      const errorMessage = typeof response.error === 'string' 
        ? response.error 
        : (response.error?.message || JSON.stringify(response.error) || 'Failed to delete credit line');
      setAlertConfig({
        title: 'Error',
        message: errorMessage,
        type: 'error'
      });
      setShowAlert(true);
    }
  } catch (error) {
    console.error('Error deleting credit line:', error);
    setAlertConfig({
      title: 'Error',
      message: 'An unexpected error occurred while deleting the credit line',
      type: 'error'
    });
    setShowAlert(true);
  }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#009DFF" />
        </View>
      );
    }

    if (!creditLine) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Credit line not found</Text>
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.iconContainer}>
          <CreditCard size={80} color="#009DFF" />
        </View>

        {/* Agency Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Agency Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Agency Name</Text>
              <Text style={styles.infoValue}>
                {creditLine.agency?.name || `Agency #${creditLine.agencyId}`}
              </Text>
            </View>
            {creditLine.agency?.location && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Location</Text>
                <Text style={styles.infoValue}>{creditLine.agency.location}</Text>
              </View>
            )}
            {creditLine.agency?.address && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Address</Text>
                <Text style={styles.infoValue}>{creditLine.agency.address}</Text>
              </View>
            )}
            {creditLine.agency?.contactInfo && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Contact</Text>
                <Text style={styles.infoValue}>{creditLine.agency.contactInfo}</Text>
              </View>
            )}
            {creditLine.agency?.status && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Status</Text>
                <Text style={styles.infoValue}>{creditLine.agency.status}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Credit Line Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Credit Line Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Credit Line ID</Text>
              <Text style={styles.infoValue}>#{creditLine.id}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Credit Limit</Text>
              <Text style={[styles.infoValue, styles.highlightValue]}>
                {creditLineService.formatCreditLimit(creditLine.creditLimit)}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Current Debt</Text>
              <Text style={[styles.infoValue, styles.highlightValue]}>
                {creditLineService.formatCreditLimit(creditLine.currentDebt || 0)}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Warning Threshold</Text>
              <Text style={styles.infoValue}>{creditLine.warningThreshold}%</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Overdue Threshold</Text>
              <Text style={styles.infoValue}>{creditLine.overDueThreshHoldDays} days</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Status</Text>
              <View style={[
                styles.statusBadge,
                { backgroundColor: creditLine.isBlocked ? COLORS.ERROR : COLORS.SUCCESS }
              ]}>
                <Text style={styles.statusText}>
                  {creditLine.isBlocked ? 'Blocked' : 'Active'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={handleEdit}
          >
            <Pencil size={18} color={COLORS.TEXT.WHITE} />
            <Text style={styles.actionButtonText}>Edit Credit Line</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleDelete}
          >
            <Trash2 size={18} color={COLORS.TEXT.WHITE} />
            <Text style={styles.actionButtonText}>Delete Credit Line</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <CustomAlert
        visible={showAlert}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setShowAlert(false)}
      />
      <CustomAlert
        visible={confirmVisible}
        title="Delete Credit Line"
        message={`Are you sure you want to delete credit line for "${creditLine?.agency?.name || `Agency #${creditLineId}`}"?`}
        type="warning"
        showCancel
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={() => {
          setConfirmVisible(false);
          confirmDelete();
        }}
        onCancel={() => setConfirmVisible(false)}
        onClose={() => setConfirmVisible(false)}
      />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={20} color={COLORS.TEXT.WHITE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Credit Line Detail</Text>
        <View style={styles.headerActions} />
      </View>

      {renderContent()}
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
    borderRadius: SIZES.RADIUS.ROUND,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
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
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.SURFACE,
    borderTopLeftRadius: SIZES.RADIUS.XXLARGE,
    borderTopRightRadius: SIZES.RADIUS.XXLARGE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: COLORS.SURFACE,
    borderTopLeftRadius: SIZES.RADIUS.XXLARGE,
    borderTopRightRadius: SIZES.RADIUS.XXLARGE,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SIZES.PADDING.LARGE,
  },
  emptyText: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.SECONDARY,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.SURFACE,
    borderTopLeftRadius: SIZES.RADIUS.XXLARGE,
    borderTopRightRadius: SIZES.RADIUS.XXLARGE,
  },
  contentInner: {
    padding: SIZES.PADDING.LARGE,
    paddingBottom: SIZES.PADDING.XXXLARGE,
  },
  iconContainer: {
    alignItems: 'center',
    paddingVertical: SIZES.PADDING.XXXLARGE,
  },
  section: {
    marginBottom: SIZES.PADDING.LARGE,
  },
  sectionTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  infoCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.LARGE,
    padding: SIZES.PADDING.MEDIUM,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: SIZES.PADDING.SMALL,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER.PRIMARY,
  },
  infoLabel: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
    fontWeight: '500',
    flex: 1,
  },
  infoValue: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  highlightValue: {
    fontSize: SIZES.FONT.LARGE,
    color: COLORS.PRIMARY,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: SIZES.PADDING.SMALL,
    paddingVertical: SIZES.PADDING.XSMALL,
    borderRadius: SIZES.RADIUS.SMALL,
    alignSelf: 'flex-end',
  },
  statusText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
  },
  actionsSection: {
    marginTop: SIZES.PADDING.LARGE,
    paddingBottom: SIZES.PADDING.XXXLARGE,
  },
  actionButton: {
    borderRadius: SIZES.RADIUS.LARGE,
    paddingVertical: SIZES.PADDING.MEDIUM,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SIZES.PADDING.SMALL,
    marginBottom: SIZES.PADDING.MEDIUM,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  editButton: {
    backgroundColor: '#009DFF',
  },
  deleteButton: {
    backgroundColor: '#000000',
  },
  actionButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
});

export default CreditLineDetailScreen;

