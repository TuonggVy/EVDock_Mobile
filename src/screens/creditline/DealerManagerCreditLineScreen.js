import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { COLORS, SIZES } from '../../constants';
import creditLineService from '../../services/creditLineService';
import CustomAlert from '../../components/common/CustomAlert';
import { ArrowLeft, CreditCard } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DealerManagerCreditLineScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [creditLine, setCreditLine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    message: '',
    type: 'info',
  });

  useEffect(() => {
    loadCreditLine();

    // Reload when screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      loadCreditLine();
    });

    return unsubscribe;
  }, [navigation]);

  const loadCreditLine = async () => {
    try {
      setLoading(true);
      
      // Get agencyId from AsyncStorage or user object
      const storedAgencyId = await AsyncStorage.getItem('agencyId');
      const userAgencyId = user?.agencyId;
      const agencyId = storedAgencyId || userAgencyId;

      if (!agencyId) {
        setAlertConfig({
          title: 'Error',
          message: 'Agency information not found. Please sign in again.',
          type: 'error',
        });
        setShowAlert(true);
        setLoading(false);
        return;
      }

      const response = await creditLineService.getCreditLineByAgency(parseInt(agencyId));

      if (response.success) {
        setCreditLine(response.data);
      } else {
        const errorMessage =
          typeof response.error === 'string'
            ? response.error
            : response.error?.message ||
              JSON.stringify(response.error) ||
              'Failed to load credit line';
        setAlertConfig({
          title: 'Error',
          message: errorMessage,
          type: 'error',
        });
        setShowAlert(true);
      }
    } catch (error) {
      console.error('Error loading credit line:', error);
      setAlertConfig({
        title: 'Error',
        message: 'An unexpected error occurred',
        type: 'error',
      });
      setShowAlert(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadCreditLine();
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
          <CreditCard size={60} color={COLORS.TEXT.SECONDARY} />
          <Text style={styles.emptyText}>No credit line found</Text>
        </View>
      );
    }

    // Check if current debt exceeds warning threshold
    const usagePercentage = creditLine.creditLimit > 0 
      ? ((creditLine.currentDebt || 0) / creditLine.creditLimit) * 100 
      : 0;
    const isWarning = usagePercentage >= creditLine.warningThreshold;

    return (
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Status Badge */}
        <View style={styles.statusContainer}>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: creditLine.isBlocked
                  ? COLORS.ERROR
                  : COLORS.SUCCESS,
              },
            ]}
          >
            <Text style={styles.statusText}>
              {creditLine.isBlocked ? 'Blocked' : 'Active'}
            </Text>
          </View>
        </View>

        {/* Credit Limit Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Credit Limit</Text>
          <Text style={styles.cardValue}>
            {creditLineService.formatCreditLimit(creditLine.creditLimit)}
          </Text>
        </View>

        {/* Current Debt Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Current Debt</Text>
          <Text
            style={[
              styles.cardValue,
              { color: isWarning ? COLORS.ERROR : COLORS.TEXT.PRIMARY },
            ]}
          >
            {creditLineService.formatCreditLimit(creditLine.currentDebt || 0)}
          </Text>
        </View>

        {/* Details Section */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Credit Line ID:</Text>
              <Text style={styles.detailValue}>#{creditLine.id}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Warning Threshold:</Text>
              <Text style={styles.detailValue}>{creditLine.warningThreshold}%</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Overdue Threshold:</Text>
              <Text style={styles.detailValue}>
                {creditLine.overDueThreshHoldDays} days
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Agency ID:</Text>
              <Text style={styles.detailValue}>#{creditLine.agencyId}</Text>
            </View>
          </View>
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

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={18} color={COLORS.TEXT.WHITE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Credit Line</Text>
        <View style={styles.placeholder} />
      </View>

      {renderContent()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
    paddingTop: 30,
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
  headerTitle: {
    fontSize: SIZES.FONT.HEADER,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.SURFACE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: COLORS.SURFACE,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SIZES.PADDING.XXXLARGE,
  },
  emptyText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
    marginTop: SIZES.PADDING.MEDIUM,
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.SURFACE,
  },
  contentInner: {
    padding: SIZES.PADDING.MEDIUM,
    paddingBottom: SIZES.PADDING.XXXLARGE,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: SIZES.PADDING.LARGE,
    marginTop: SIZES.PADDING.MEDIUM,
  },
  statusBadge: {
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    borderRadius: SIZES.RADIUS.MEDIUM,
  },
  statusText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
  },
  card: {
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
  cardTitle: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: SIZES.PADDING.XSMALL,
  },
  cardValue: {
    fontSize: SIZES.FONT.XXLARGE,
    fontWeight: 'bold',
    color: '#009DFF',
  },
  detailsSection: {
    marginTop: SIZES.PADDING.SMALL,
  },
  sectionTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  detailsCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.LARGE,
    padding: SIZES.PADDING.MEDIUM,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.PADDING.SMALL,
    paddingBottom: SIZES.PADDING.SMALL,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
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
});

export default DealerManagerCreditLineScreen;

