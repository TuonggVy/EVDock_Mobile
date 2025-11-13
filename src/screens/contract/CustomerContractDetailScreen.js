import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Image, Modal, Dimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES } from '../../constants';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import customerContractService from '../../services/customerContractService';
import installmentContractService from '../../services/installmentContractService';
import emailService from '../../services/emailService';
import { ArrowLeft, Pencil, Trash2, NotepadText, CreditCard, FileText, Mail, X, MoreVertical, Home } from 'lucide-react-native';
import { formatPrice } from '../../utils/promotionUtils';
import LoadingScreen from '../../components/common/LoadingScreen';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CustomerContractDetailScreen = ({ navigation, route }) => {
  const { contractId, selectedInstallmentPlan } = route.params || {};
  const { alertConfig, hideAlert, showSuccess, showError, showDeleteConfirm } = useCustomAlert();
  const [loading, setLoading] = useState(true);
  const [contract, setContract] = useState(null);
  const [hasInstallmentContract, setHasInstallmentContract] = useState(false);
  const [linkedInstallmentContractId, setLinkedInstallmentContractId] = useState(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    loadContractDetail();
  }, [contractId]);

  // Handle selected installment plan when returning from ChooseInstallmentPlan screen
  useEffect(() => {
    if (selectedInstallmentPlan) {
      showSuccess(
        'Installment Plan Selected',
        `Plan "${selectedInstallmentPlan.name}" has been selected successfully.`
      );
    }
  }, [selectedInstallmentPlan]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (contractId) {
        loadContractDetail();
      }
    }, [contractId])
  );

  const loadContractDetail = async () => {
    try {
      setLoading(true);
      const response = await customerContractService.getCustomerContractDetail(contractId);
      if (response.success && response.data) {
        setContract(response.data);
        // Check if this contract has an installment contract
        await checkInstallmentContract(response.data);
      } else {
        showError('Error', response.error || 'Failed to load contract details');
        setTimeout(() => navigation.goBack(), 2000);
      }
    } catch (error) {
      console.error('Error loading contract:', error);
      showError('Error', 'Failed to load contract details');
      setTimeout(() => navigation.goBack(), 2000);
    } finally {
      setLoading(false);
    }
  };

  const checkInstallmentContract = async (contractData) => {
    setHasInstallmentContract(false);
    setLinkedInstallmentContractId(null);

    if (!contractId) {
      return;
    }

    const installmentContractIds = new Set();

    if (contractData?.installmentContractId) {
      installmentContractIds.add(contractData.installmentContractId);
    }

    if (contractData?.installmentContract?.id) {
      installmentContractIds.add(contractData.installmentContract.id);
    }

    if (Array.isArray(contractData?.installmentContracts)) {
      contractData.installmentContracts.forEach(item => {
        if (item?.id) {
          installmentContractIds.add(item.id);
        }
      });
    }

    try {
      const response = await installmentContractService.getInstallmentContractByCustomerContract(contractId);
      if (response.success && response.data) {
        const candidateContracts = Array.isArray(response.data) ? response.data : [response.data];
        candidateContracts.forEach(item => {
          if (item?.id) {
            installmentContractIds.add(item.id);
          }
        });
      }
    } catch (error) {
      console.error('Error fetching installment contracts by customer contract:', error);
    }

    if (installmentContractIds.size === 0) {
      return;
    }

    try {
      for (const installmentContractId of installmentContractIds) {
        const response = await installmentContractService.getInstallmentContractDetail(installmentContractId);

        if (response.success && response.data) {
          const detail = response.data;
          const matchesCustomerContract = Number(detail.customerContractId) === Number(contractId);
          const hasInstallmentPlan = detail.installmentPlanId !== null && detail.installmentPlanId !== undefined;

          if (matchesCustomerContract && hasInstallmentPlan) {
            setHasInstallmentContract(true);
            setLinkedInstallmentContractId(detail.id || installmentContractId);
            return;
          }
        }
      }
    } catch (error) {
      console.error('Error checking installment contract:', error);
    }
  };

  const formatDateForDisplay = (date) => {
    if (!date) return 'N/A';
    try {
      const d = new Date(date);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return 'N/A';
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'PENDING': return COLORS.WARNING;
      case 'CONFIRMED': return '#3B82F6'; // Blue
      case 'PROCESSING': return '#A855F7'; // Purple
      case 'DELIVERED': return COLORS.SUCCESS;
      case 'COMPLETED': return COLORS.SUCCESS;
      default: return COLORS.TEXT.SECONDARY;
    }
  };

  const getStatusText = (status) => {
    switch (status?.toUpperCase()) {
      case 'PENDING': return 'Pending';
      case 'CONFIRMED': return 'Confirmed';
      case 'PROCESSING': return 'Processing';
      case 'DELIVERED': return 'Delivered';
      case 'COMPLETED': return 'Completed';
      default: return status || 'Unknown';
    }
  };

  const getContractTypeLabel = (type) => {
    switch (type?.toUpperCase()) {
      case 'FULL': return 'Full Payment';
      case 'DEBT': return 'Debt';
      default: return type || 'Unknown';
    }
  };

  const handleEdit = () => {
    navigation.navigate('EditCustomerContract', { contractId });
  };

  const handleDelete = () => {
    showDeleteConfirm(
      'Delete Contract',
      'Are you sure you want to delete this contract?',
      async () => {
        try {
          const response = await customerContractService.deleteCustomerContract(contractId);
          if (response.success) {
            showSuccess('Success', 'Contract deleted successfully');
            setTimeout(() => navigation.goBack(), 1500);
          } else {
            showError('Error', response.error || 'Failed to delete contract');
          }
        } catch (error) {
          console.error('Error deleting contract:', error);
          showError('Error', 'Failed to delete contract');
        }
      }
    );
  };

  const handleChooseInstallmentPlan = () => {
    navigation.navigate('ChooseInstallmentPlan', { contractId });
  };

  const handleShowInstallmentContract = () => {
    if (linkedInstallmentContractId) {
      navigation.navigate('InstallmentContractDetail', { installmentContractId: linkedInstallmentContractId });
      return;
    }
    navigation.navigate('InstallmentContractManagement', { customerContractId: contractId });
  };

  const handleManageInstallmentPayments = () => {
    if (linkedInstallmentContractId) {
      navigation.navigate('InstallmentPayment', { installmentContractId: linkedInstallmentContractId });
      return;
    }
    navigation.navigate('InstallmentContractManagement', { customerContractId: contractId });
  };

  const handleSendContractEmail = async () => {
    if (!contractId) {
      showError('Error', 'Contract ID is missing');
      return;
    }

    try {
      setSendingEmail(true);
      const response = await emailService.sendCustomerContractEmail(contractId);
      if (response.success) {
        showSuccess('Success', response.message || 'Contract email sent successfully to customer');
      } else {
        showError('Error', response.error || 'Failed to send contract email');
      }
    } catch (error) {
      console.error('Error sending contract email:', error);
      showError('Error', 'Failed to send contract email');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleImagePress = (imageUrl, documentType) => {
    setSelectedImage({ uri: imageUrl, documentType });
    setShowImageModal(true);
  };

  const closeImageModal = () => {
    setShowImageModal(false);
    setSelectedImage(null);
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (!contract) {
    return null;
  }

  // Check if contract type is FULL
  const isFullPayment = contract.contractPaidType?.toUpperCase() === 'FULL';
  const isDebtContract = !isFullPayment;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <ArrowLeft color={COLORS.TEXT.WHITE} size={24} />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={styles.title}>Customer Contract Details</Text>
          </View>
          {isDebtContract ? (
            <TouchableOpacity style={styles.menuButton} onPress={() => setShowMenu(true)}>
              <MoreVertical color={COLORS.TEXT.WHITE} size={24} />
            </TouchableOpacity>
          ) : (
            <View style={styles.headerSpacer} />
          )}
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.contentSection}>
          <View style={styles.titleRow}>
            <NotepadText color="#009DFF" size={24} />
            <Text style={styles.contractTitle}>{contract.title || 'Untitled Contract'}</Text>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(contract.status) }]}>
            <Text style={styles.statusText}>{getStatusText(contract.status)}</Text>
          </View>

          {/* Contract Information */}
          <View style={styles.infoCard}>
            <Text style={styles.sectionTitle}>Contract Information</Text>

            {(contract.id || contractId) && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Customer Contract ID:</Text>
                <Text style={styles.infoValue}>#{contract.id || contractId}</Text>
              </View>
            )}

            {contract.contractCode && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Contract Code:</Text>
                <Text style={styles.infoValue}>{contract.contractCode}</Text>
              </View>
            )}

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Type:</Text>
              <Text style={styles.infoValue}>{getContractTypeLabel(contract.contractPaidType)}</Text>
            </View>

            {contract.finalPrice !== undefined && contract.finalPrice !== null && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Final Price:</Text>
                <Text style={[styles.infoValue, styles.priceText]}>
                  {formatPrice(contract.finalPrice || 0)}
                </Text>
              </View>
            )}

            {contract.signDate && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Sign Date:</Text>
                <Text style={styles.infoValue}>{formatDateForDisplay(contract.signDate)}</Text>
              </View>
            )}

            {contract.deliveryDate && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Delivery Date:</Text>
                <Text style={styles.infoValue}>{formatDateForDisplay(contract.deliveryDate)}</Text>
              </View>
            )}

            {contract.content && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Content:</Text>
                <Text style={styles.infoValue}>{contract.content}</Text>
              </View>
            )}
          </View>

          {/* Customer Information */}
          {contract.customer && (
            <View style={styles.infoCard}>
              <Text style={styles.sectionTitle}>Customer Information</Text>
              {contract.customer.name && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Name:</Text>
                  <Text style={styles.infoValue}>{contract.customer.name}</Text>
                </View>
              )}
              {contract.customer.phone && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Phone:</Text>
                  <Text style={styles.infoValue}>{contract.customer.phone}</Text>
                </View>
              )}
              {contract.customer.email && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Email:</Text>
                  <Text style={styles.infoValue}>{contract.customer.email}</Text>
                </View>
              )}
              {contract.customer.address && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Address:</Text>
                  <Text style={styles.infoValue}>{contract.customer.address}</Text>
                </View>
              )}
            </View>
          )}

          {/* Motorbike Information */}
          {contract.electricMotorbike && (
            <View style={styles.infoCard}>
              <Text style={styles.sectionTitle}>Motorbike Information</Text>
              {contract.electricMotorbike.name && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Name:</Text>
                  <Text style={styles.infoValue}>{contract.electricMotorbike.name}</Text>
                </View>
              )}
              {contract.electricMotorbike.model && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Model:</Text>
                  <Text style={styles.infoValue}>{contract.electricMotorbike.model}</Text>
                </View>
              )}
              {contract.electricMotorbike.version && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Version:</Text>
                  <Text style={styles.infoValue}>{contract.electricMotorbike.version}</Text>
                </View>
              )}
              {contract.electricMotorbike.makeFrom && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Made From:</Text>
                  <Text style={styles.infoValue}>{contract.electricMotorbike.makeFrom}</Text>
                </View>
              )}
            </View>
          )}

          {/* Color Information */}
          {contract.color && (
            <View style={styles.infoCard}>
              <Text style={styles.sectionTitle}>Color</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Color Type:</Text>
                <Text style={styles.infoValue}>{contract.color.colorType || 'N/A'}</Text>
              </View>
            </View>
          )}

          {/* Staff Information */}
          {contract.staff && (
            <View style={styles.infoCard}>
              <Text style={styles.sectionTitle}>Created by Staff</Text>
              {contract.staff.username && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Username:</Text>
                  <Text style={styles.infoValue}>{contract.staff.username}</Text>
                </View>
              )}
              {contract.staff.email && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Email:</Text>
                  <Text style={styles.infoValue}>{contract.staff.email}</Text>
                </View>
              )}
            </View>
          )}

          {/* Quotation Information */}
          {contract.quotationId && (
            <View style={styles.infoCard}>
              <Text style={styles.sectionTitle}>Quotation</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Quotation ID:</Text>
                <Text style={styles.infoValue}>#{contract.quotationId}</Text>
              </View>
            </View>
          )}

          {/* Contract Documents */}
          {contract.contractDocuments && contract.contractDocuments.length > 0 && (
            <View style={styles.infoCard}>
              <Text style={styles.sectionTitle}>Contract Documents</Text>
              <View style={styles.documentsContainer}>
                {contract.contractDocuments.map((doc, index) => (
                  <TouchableOpacity
                    key={doc.id || index}
                    style={styles.documentItem}
                    onPress={() => handleImagePress(doc.imageUrl, doc.documentType)}
                  >
                    <Image
                      source={{ uri: doc.imageUrl }}
                      style={styles.documentImage}
                      resizeMode="cover"
                    />
                    <Text style={styles.documentTypeText} numberOfLines={2}>
                      {doc.documentType || `Document ${index + 1}`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.sendEmailButton, sendingEmail && styles.sendEmailButtonDisabled]} 
          onPress={handleSendContractEmail}
          disabled={sendingEmail}
        >
          <LinearGradient colors={['#10B981', '#10B981']} style={styles.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Mail color={COLORS.TEXT.WHITE} size={20} />
            <Text style={styles.buttonText}>
              {sendingEmail ? 'Sending...' : 'Send Contract Email'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
            <LinearGradient colors={COLORS.GRADIENT.BLUE} style={styles.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Pencil color={COLORS.TEXT.WHITE} size={20} />
              <Text style={styles.buttonText}>Edit Contract</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <LinearGradient colors={[COLORS.ERROR, COLORS.ERROR]} style={styles.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Trash2 color={COLORS.TEXT.WHITE} size={20} />
              <Text style={styles.buttonText}>Delete Contract</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        {!hasInstallmentContract && !isFullPayment && (
          <TouchableOpacity style={styles.installmentButton} onPress={handleChooseInstallmentPlan}>
            <LinearGradient colors={['#009DFF', '#009DFF']} style={styles.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <CreditCard color={COLORS.TEXT.WHITE} size={20} />
              <Text style={styles.buttonText}>Choose Installment Plan</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>

      {/* Popup Menu */}
      <Modal
        visible={showMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={styles.menuContainer}>
            {hasInstallmentContract && (
              <>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setShowMenu(false);
                    handleShowInstallmentContract();
                  }}
                >
                  <FileText color={COLORS.TEXT.PRIMARY} size={20} />
                  <Text style={styles.menuItemText}>Show Installment Contract</Text>
                </TouchableOpacity>
                <View style={styles.menuDivider} />
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setShowMenu(false);
                    handleManageInstallmentPayments();
                  }}
                >
                  <CreditCard color={COLORS.TEXT.PRIMARY} size={20} />
                  <Text style={styles.menuItemText}>Manage Installment Payments</Text>
                </TouchableOpacity>
                <View style={styles.menuDivider} />
              </>
            )}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                navigation.navigate('CustomerContractManagement');
              }}
            >
              <FileText color={COLORS.TEXT.PRIMARY} size={20} />
              <Text style={styles.menuItemText}>Customer Contracts</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                navigation.navigate('Main', { screen: 'Home' });
              }}
            >
              <Home color={COLORS.TEXT.PRIMARY} size={20} />
              <Text style={styles.menuItemText}>Home</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Image Modal */}
      <Modal
        visible={showImageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={closeImageModal}
      >
        <View style={styles.imageModalOverlay}>
          <TouchableOpacity
            style={styles.imageModalCloseButton}
            onPress={closeImageModal}
          >
            <X color={COLORS.TEXT.WHITE} size={24} />
          </TouchableOpacity>
          {selectedImage && (
            <>
              {selectedImage.documentType && (
                <Text style={styles.imageModalTitle}>{selectedImage.documentType}</Text>
              )}
              <Image
                source={{ uri: selectedImage.uri }}
                style={styles.imageModalImage}
                resizeMode="contain"
              />
            </>
          )}
        </View>
      </Modal>

      <CustomAlert visible={alertConfig.visible} title={alertConfig.title} message={alertConfig.message} type={alertConfig.type} onClose={hideAlert} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
  },
  header: {
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
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
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: SIZES.FONT.XXLARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
  headerSpacer: {
    width: 40,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: SIZES.RADIUS.ROUND,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: SIZES.PADDING.XXXLARGE + 60,
    paddingRight: SIZES.PADDING.LARGE,
  },
  menuContainer: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.LARGE,
    paddingVertical: SIZES.PADDING.SMALL,
    minWidth: 200,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.PADDING.LARGE,
    paddingVertical: SIZES.PADDING.MEDIUM,
    gap: SIZES.PADDING.MEDIUM,
  },
  menuItemText: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: '500',
    color: COLORS.TEXT.PRIMARY,
  },
  menuDivider: {
    height: 1,
    backgroundColor: COLORS.BORDER.PRIMARY,
    marginVertical: SIZES.PADDING.XSMALL,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SIZES.PADDING.LARGE,
  },
  contentSection: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.LARGE,
    padding: SIZES.PADDING.LARGE,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  contractTitle: {
    fontSize: SIZES.FONT.XLARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginLeft: SIZES.PADDING.SMALL,
    flex: 1,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    borderRadius: SIZES.RADIUS.MEDIUM,
    marginBottom: SIZES.PADDING.LARGE,
  },
  statusText: {
    fontSize: SIZES.FONT.SMALL,
    fontWeight: '600',
    color: COLORS.TEXT.WHITE,
  },
  sectionTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  infoCard: {
    backgroundColor: '#E5E7EB',
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SIZES.PADDING.SMALL,
    paddingBottom: SIZES.PADDING.SMALL,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER.SECONDARY,
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
    flex: 2,
    textAlign: 'right',
  },
  priceText: {
    color: "#009DFF",
    fontSize: SIZES.FONT.LARGE,
  },
  footer: {
    paddingHorizontal: SIZES.PADDING.LARGE,
    paddingTop: SIZES.PADDING.SMALL,
    paddingBottom: SIZES.PADDING.SMALL,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
    borderTopWidth: 1,
    borderTopColor: COLORS.BACKGROUND.SECONDARY,
    gap: SIZES.PADDING.SMALL,
  },
  installmentButton: {
    width: '100%',
    borderRadius: SIZES.RADIUS.LARGE,
    overflow: 'hidden',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: SIZES.PADDING.SMALL,
  },
  editButton: {
    flex: 1,
    borderRadius: SIZES.RADIUS.LARGE,
    overflow: 'hidden',
  },
  deleteButton: {
    flex: 1,
    borderRadius: SIZES.RADIUS.LARGE,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.PADDING.MEDIUM,
    gap: SIZES.PADDING.SMALL,
  },
  buttonText: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
  sendEmailButton: {
    width: '100%',
    borderRadius: SIZES.RADIUS.LARGE,
    overflow: 'hidden',
    marginBottom: SIZES.PADDING.SMALL,
  },
  sendEmailButtonDisabled: {
    opacity: 0.6,
  },
  documentsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.PADDING.MEDIUM,
    marginTop: SIZES.PADDING.SMALL,
  },
  documentItem: {
    width: (SCREEN_WIDTH - SIZES.PADDING.LARGE * 2 - SIZES.PADDING.MEDIUM * 2) / 3,
    marginBottom: SIZES.PADDING.SMALL,
  },
  documentImage: {
    width: '100%',
    height: 120,
    borderRadius: SIZES.RADIUS.MEDIUM,
    backgroundColor: COLORS.BACKGROUND.SECONDARY,
  },
  documentTypeText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    marginTop: SIZES.PADDING.XSMALL,
    textAlign: 'center',
  },
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalCloseButton: {
    position: 'absolute',
    top: SIZES.PADDING.XXXLARGE,
    right: SIZES.PADDING.LARGE,
    zIndex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: SIZES.RADIUS.ROUND,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalTitle: {
    position: 'absolute',
    top: SIZES.PADDING.XXXLARGE,
    left: SIZES.PADDING.LARGE,
    right: SIZES.PADDING.LARGE,
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
    textAlign: 'center',
    zIndex: 1,
  },
  imageModalImage: {
    width: SCREEN_WIDTH,
    height: '80%',
  },
});

export default CustomerContractDetailScreen;
