import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { COLORS, SIZES } from '../../constants';
import creditLineService from '../../services/creditLineService';
import CustomAlert from '../../components/common/CustomAlert';
import { Pencil, Trash2, ArrowLeft } from 'lucide-react-native';

const CreditLineDetailScreen = ({ navigation, route }) => {
  const { creditLineId } = route.params;
  const [creditLine, setCreditLine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'info' });

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
    
    Alert.alert(
      'Delete Credit Line',
      `Are you sure you want to delete credit line for "${creditLine.agency?.name || `Agency #${creditLine.agencyId}`}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
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
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={20} color={COLORS.PRIMARY} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Credit Line Detail</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        </View>
      </View>
    );
  }

  if (!creditLine) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={20} color={COLORS.PRIMARY} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Credit Line Detail</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Credit line not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CustomAlert
        visible={showAlert}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setShowAlert(false)}
      />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={20} color={COLORS.PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Credit Line Detail</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleEdit}
          >
            <Pencil size={16} color={COLORS.PRIMARY} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteActionButton]}
            onPress={handleDelete}
          >
            <Trash2 size={16} color={COLORS.ERROR} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Agency Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Agency Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Agency Name:</Text>
              <Text style={styles.infoValue}>
                {creditLine.agency?.name || `Agency #${creditLine.agencyId}`}
              </Text>
            </View>
            {creditLine.agency?.location && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Location:</Text>
                <Text style={styles.infoValue}>{creditLine.agency.location}</Text>
              </View>
            )}
            {creditLine.agency?.address && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Address:</Text>
                <Text style={styles.infoValue}>{creditLine.agency.address}</Text>
              </View>
            )}
            {creditLine.agency?.contactInfo && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Contact:</Text>
                <Text style={styles.infoValue}>{creditLine.agency.contactInfo}</Text>
              </View>
            )}
            {creditLine.agency?.status && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Status:</Text>
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
              <Text style={styles.infoLabel}>Credit Line ID:</Text>
              <Text style={styles.infoValue}>#{creditLine.id}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Credit Limit:</Text>
              <Text style={[styles.infoValue, styles.highlightValue]}>
                {creditLineService.formatCreditLimit(creditLine.creditLimit)}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Warning Threshold:</Text>
              <Text style={styles.infoValue}>{creditLine.warningThreshold}%</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Overdue Threshold:</Text>
              <Text style={styles.infoValue}>{creditLine.overDueThreshHoldDays} days</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Status:</Text>
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
      </ScrollView>
    </View>
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
    padding: SIZES.PADDING.LARGE,
    paddingTop: SIZES.PADDING.XXXLARGE,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
  },
  backButton: {
    padding: SIZES.PADDING.SMALL,
  },
  headerTitle: {
    fontSize: SIZES.FONT.HEADER,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 60,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: SIZES.RADIUS.SMALL,
    backgroundColor: COLORS.PRIMARY + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SIZES.PADDING.XSMALL,
  },
  deleteActionButton: {
    backgroundColor: COLORS.ERROR + '20',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SIZES.PADDING.XXXLARGE,
  },
  emptyText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
  },
  content: {
    flex: 1,
    padding: SIZES.PADDING.LARGE,
  },
  section: {
    marginBottom: SIZES.PADDING.LARGE,
  },
  sectionTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
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
    borderBottomColor: '#EFEFEF',
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
  highlightValue: {
    fontSize: SIZES.FONT.LARGE,
    color: COLORS.PRIMARY,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: SIZES.PADDING.SMALL,
    paddingVertical: 4,
    borderRadius: SIZES.RADIUS.SMALL,
    alignSelf: 'flex-end',
  },
  statusText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
  },
});

export default CreditLineDetailScreen;

