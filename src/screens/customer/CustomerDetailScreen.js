import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES } from '../../constants';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import customerManagementService from '../../services/customerManagementService';
import agencyService from '../../services/agencyService';
import LoadingScreen from '../../components/common/LoadingScreen';
import { ArrowLeft, Building2, Calendar1, IdCard, Mail, MapPinHouse, Pencil, Trash } from 'lucide-react-native';

const CustomerDetailScreen = ({ navigation, route }) => {
  const { customerId } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState(null);
  const [agencyName, setAgencyName] = useState(null);
  const { alertConfig, hideAlert, showError, showInfo, showConfirm } = useCustomAlert();

  useEffect(() => {
    loadCustomerDetail();
  }, [customerId]);

  // Refresh when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadCustomerDetail();
    });
    return unsubscribe;
  }, [navigation]);

  const loadAgencyName = async (agencyId) => {
    if (!agencyId) {
      setAgencyName(null);
      return;
    }

    try {
      const response = await agencyService.getAgenciesForCustomer({ limit: 100 });
      if (response.success && Array.isArray(response.data)) {
        const agency = response.data.find(a => a.id === agencyId);
        if (agency) {
          setAgencyName(agency.name);
        } else {
          setAgencyName(null);
        }
      }
    } catch (error) {
      console.error('Error loading agency name:', error);
      setAgencyName(null);
    }
  };

  const loadCustomerDetail = async () => {
    try {
      setLoading(true);
      const data = await customerManagementService.getCustomerDetail(customerId);
      if (data) {
        setCustomer(data);
        // Load agency name after customer data is loaded
        if (data.agencyId) {
          await loadAgencyName(data.agencyId);
        } else {
          setAgencyName(null);
        }
      } else {
        showError('Error', 'Failed to load customer information');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading customer detail:', error);
      showError('Error', 'Failed to load customer information');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigation.navigate('EditCustomer', { customerId });
  };

  const handleDelete = () => {
      showConfirm(
      'Delete Customer',
      `Are you sure you want to delete customer "${customer?.name}"? This action cannot be undone.`,
      () => deleteCustomer()
    );
  };

  const deleteCustomer = async () => {
    try {
      setLoading(true);
      await customerManagementService.deleteCustomer(customerId);
      showInfo('Success', 'Customer deleted successfully');
      
      // Navigate back after a short delay
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (error) {
      console.error('Error deleting customer:', error);
      showError('Error', error.message || 'Failed to delete customer');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  if (loading && !customer) {
    return <LoadingScreen />;
  }

  if (!customer) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft color="#FFFFFF" size={18} />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={styles.title}>Customer Details</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Customer Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {customer.name?.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
            <View style={styles.cardHeaderInfo}>
              <Text style={styles.customerName}>{customer.name}</Text>
              <Text style={styles.customerPhone}>{customer.phone}</Text>
            </View>
          </View>

          {/* Display Mode */}
          <View style={styles.infoSection}>
              <View style={styles.infoRow}>
                <View style={styles.infoLabelContainer}>
                  <Mail size={14} color={COLORS.TEXT.SECONDARY} />
                  <Text style={styles.infoLabel}> Email</Text>
                </View>
                <Text style={styles.infoValue}>{customer.email || 'N/A'}</Text>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoLabelContainer}>
                  <MapPinHouse size={14} color={COLORS.TEXT.SECONDARY} />
                  <Text style={styles.infoLabel}> Address</Text>
                </View>
                <Text style={styles.infoValue}>{customer.address || 'N/A'}</Text>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoLabelContainer}>
                  <IdCard size={14} color={COLORS.TEXT.SECONDARY} />
                  <Text style={styles.infoLabel}> ID Card</Text>
                </View>
                <Text style={styles.infoValue}>{customer.credentialId || 'N/A'}</Text>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoLabelContainer}>
                  <Calendar1 size={14} color={COLORS.TEXT.SECONDARY} />
                  <Text style={styles.infoLabel}> Date of Birth</Text>
                </View>
                <Text style={styles.infoValue}>{formatDate(customer.dob)}</Text>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoLabelContainer}>
                  <Building2 size={14} color={COLORS.TEXT.SECONDARY} />
                  <Text style={styles.infoLabel}> Agency</Text>
                </View>
                <Text style={styles.infoValue}>
                  {agencyName || (customer.agencyId ? `#${customer.agencyId}` : 'N/A')}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

      {/* Action Buttons at Bottom */}
      <View style={styles.bottomActions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEdit}
          >
            <LinearGradient
              colors={COLORS.GRADIENT.BLUE}
              style={styles.buttonGradient}
            >
              <View style={styles.editButtonContent}>
                <Pencil size={14} color="#FFFFFF" />
                <Text style={styles.editButtonText}> Edit</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            disabled={loading}
          >
            <View style={styles.deleteButtonContent}>
              {loading ? (
                <Text style={styles.deleteButtonText}>Deleting...</Text>
              ) : (
                <>
                  <Trash size={14} color={COLORS.TEXT.WHITE} />
                  <Text style={styles.deleteButtonText}> Delete</Text>
                </>
              )}
            </View>
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
  infoLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SIZES.PADDING.LARGE,
    paddingBottom: SIZES.PADDING.XXXLARGE,
  },
  infoCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.LARGE,
    padding: SIZES.PADDING.LARGE,
    marginTop: SIZES.PADDING.MEDIUM,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.PADDING.LARGE,
    paddingBottom: SIZES.PADDING.LARGE,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.PADDING.MEDIUM,
  },
  avatarText: {
    fontSize: SIZES.FONT.XXLARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
  cardHeaderInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: SIZES.FONT.XXLARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: 4,
  },
  customerPhone: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
  },
  infoSection: {
    marginTop: SIZES.PADDING.SMALL,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: SIZES.PADDING.MEDIUM,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
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
    flex: 2,
    textAlign: 'right',
  },
  bottomActions: {
    flexDirection: 'row',
    padding: SIZES.PADDING.LARGE,
    backgroundColor: COLORS.SURFACE,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: SIZES.PADDING.MEDIUM,
  },
  editButton: {
    flex: 1,
    borderRadius: SIZES.RADIUS.MEDIUM,
    overflow: 'hidden',
  },
  buttonGradient: {
    paddingVertical: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.WHITE,
    fontWeight: 'bold',
  },
  deleteButton: {
    flex: 1,
    paddingVertical: SIZES.PADDING.MEDIUM,
    borderRadius: SIZES.RADIUS.MEDIUM,
    backgroundColor: COLORS.ERROR,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.WHITE,
    fontWeight: 'bold',
  },
});

export default CustomerDetailScreen;

