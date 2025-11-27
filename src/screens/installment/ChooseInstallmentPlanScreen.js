import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, SafeAreaView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import installmentPlanService from '../../services/installmentPlanService';
import { ArrowLeft, Circle, CheckCircle } from 'lucide-react-native';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import LoadingScreen from '../../components/common/LoadingScreen';

const ChooseInstallmentPlanScreen = ({ navigation, route }) => {
  const { contractId } = route.params || {};
  const { user } = useAuth();
  const { alertConfig, hideAlert, showError, showSuccess } = useCustomAlert();
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const agencyId = user?.agencyId;
      if (!agencyId) {
        setPlans([]);
        setLoading(false);
        return;
      }
      const res = await installmentPlanService.getInstallmentPlansByAgency(agencyId, { page: 1, limit: 100 });
      const list = Array.isArray(res?.data) ? [...res.data] : [];
      // Filter only ACTIVE plans
      const activePlans = list.filter(plan => plan.status === 'ACTIVE');
      // Sort by created date (newest first)
      activePlans.sort((a, b) => {
        const aTime = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (bTime !== aTime) return bTime - aTime;
        const aId = Number(a?.id) || 0;
        const bId = Number(b?.id) || 0;
        return bId - aId;
      });
      setPlans(activePlans);
    } catch (e) {
      console.error('Failed to load installment plans', e);
      showError('Error', 'Failed to load installment plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPlans();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPlans();
    setRefreshing(false);
  };

  const handleSelectPlan = (planId) => {
    setSelectedPlanId(planId);
  };

  const handleConfirm = () => {
    if (!selectedPlanId) {
      showError('Error', 'Please select an installment plan');
      return;
    }

    const selectedPlan = plans.find(p => p.id === selectedPlanId);
    if (!selectedPlan) {
      showError('Error', 'Selected plan not found');
      return;
    }

    // Navigate to Create Installment Contract screen
    navigation.navigate('CreateInstallmentContract', {
      contractId,
      installmentPlanId: selectedPlan.id,
    });
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <ArrowLeft color={COLORS.TEXT.WHITE} size={24} />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={styles.headerTitleText}>Choose Installment Plan</Text>
            <Text style={styles.headerSubtitle}>{plans.length} active plans</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {plans.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No active installment plans</Text>
            <Text style={styles.emptySubtitle}>Please create an installment plan first</Text>
          </View>
        ) : (
          plans.map((plan) => {
            const isSelected = selectedPlanId === plan.id;
            return (
              <TouchableOpacity
                key={plan.id}
                style={[styles.planCard, isSelected && styles.planCardSelected]}
                onPress={() => handleSelectPlan(plan.id)}
              >
                <View style={styles.planContent}>
                  <View style={styles.planHeader}>
                    <Text style={styles.planName}>{plan.name}</Text>
                    <View style={styles.radioButton}>
                      {isSelected ? (
                        <Circle color="#009DFF" size={24} fill="#009DFF" />
                      ) : (
                        <Circle color={COLORS.TEXT.SECONDARY} size={24} />
                      )}
                    </View>
                  </View>
                  
                  <View style={styles.planDetails}>
                    <View style={styles.planDetailRow}>
                      <Text style={styles.planDetailLabel}>Interest Rate:</Text>
                      <Text style={styles.planDetailValue}>{plan.interestRate}%</Text>
                    </View>
                    <View style={styles.planDetailRow}>
                      <Text style={styles.planDetailLabel}>Interest Type:</Text>
                      <Text style={styles.planDetailValue}>{plan.interestPaidType || 'N/A'}</Text>
                    </View>
                    <View style={styles.planDetailRow}>
                      <Text style={styles.planDetailLabel}>Total Months:</Text>
                      <Text style={styles.planDetailValue}>{plan.interestRateTotalMonth} months</Text>
                    </View>
                    <View style={styles.planDetailRow}>
                      <Text style={styles.planDetailLabel}>Payment Period:</Text>
                      <Text style={styles.planDetailValue}>{plan.totalPaidMonth} months</Text>
                    </View>
                    {plan.prePaidPercent !== undefined && plan.prePaidPercent !== null && (
                      <View style={styles.planDetailRow}>
                        <Text style={styles.planDetailLabel}>Prepaid Percent:</Text>
                        <Text style={styles.planDetailValue}>{plan.prePaidPercent}%</Text>
                      </View>
                    )}
                    {plan.processFee !== undefined && plan.processFee !== null && (
                      <View style={styles.planDetailRow}>
                        <Text style={styles.planDetailLabel}>Process Fee:</Text>
                        <Text style={styles.planDetailValue}>{plan.processFee}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {plans.length > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.confirmButton, !selectedPlanId && styles.confirmButtonDisabled]}
            onPress={handleConfirm}
            disabled={!selectedPlanId}
          >
            <LinearGradient
              colors={selectedPlanId ? COLORS.GRADIENT.GREEN : [COLORS.TEXT.DISABLED, COLORS.TEXT.DISABLED]}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.confirmButtonText}>Confirm Selection</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
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
  headerTitleText: {
    fontSize: SIZES.FONT.XXLARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
  headerSubtitle: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    marginTop: 4,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.SURFACE,
    borderTopLeftRadius: SIZES.RADIUS.XXLARGE,
    borderTopRightRadius: SIZES.RADIUS.XXLARGE,
  },
  contentContainer: {
    padding: SIZES.PADDING.LARGE,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.PADDING.XXXLARGE,
  },
  emptyTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: '700',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SIZES.PADDING.SMALL,
  },
  emptySubtitle: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
  },
  planCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.LARGE,
    padding: SIZES.PADDING.LARGE,
    marginBottom: SIZES.PADDING.MEDIUM,
    borderWidth: 2,
    borderColor: COLORS.BORDER.PRIMARY,
  },
  planCardSelected: {
    borderColor: "#009DFF",
    backgroundColor: 'rgba(106, 163, 255, 0.05)',
  },
  planContent: {
    flex: 1,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  planName: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: '700',
    color: COLORS.TEXT.PRIMARY,
    flex: 1,
  },
  radioButton: {
    marginLeft: SIZES.PADDING.MEDIUM,
  },
  planDetails: {
    gap: SIZES.PADDING.SMALL,
  },
  planDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planDetailLabel: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
    fontWeight: '500',
  },
  planDetailValue: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '600',
  },
  footer: {
    padding: SIZES.PADDING.LARGE,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
    borderTopWidth: 1,
    borderTopColor: COLORS.BACKGROUND.SECONDARY,
  },
  confirmButton: {
    borderRadius: SIZES.RADIUS.LARGE,
    overflow: 'hidden',
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  buttonGradient: {
    padding: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
});

export default ChooseInstallmentPlanScreen;
