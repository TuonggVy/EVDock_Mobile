import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, FlatList } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import installmentPlanService from '../../services/installmentPlanService';
import { ArrowLeft, SquareChartGantt } from 'lucide-react-native';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';

const StaffInstallmentPlanListScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { alertConfig, hideAlert, showError } = useCustomAlert();
  const [plans, setPlans] = useState([]);
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
      const res = await installmentPlanService.getInstallmentPlansByAgency(agencyId, { page: 1, limit: 20 });
      const list = Array.isArray(res?.data) ? [...res.data] : [];
      list.sort((a, b) => {
        const aTime = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (bTime !== aTime) return bTime - aTime;
        const aId = Number(a?.id) || 0; const bId = Number(b?.id) || 0; return bId - aId;
      });
      setPlans(list);
    } catch (e) {
      console.error('Failed to load installment plans', e);
      showError('Lỗi', 'Không thể tải danh sách kế hoạch');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPlans(); }, []);
  useFocusEffect(useCallback(() => { loadPlans(); }, []));

  const onRefresh = async () => { setRefreshing(true); await loadPlans(); setRefreshing(false); };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.planCard}
      onPress={() => navigation.navigate('InstallmentPlanDetail', { installmentId: item.id, viewOnly: true })}
    >
      <View style={styles.planHeader}>
        <Text style={styles.planName}>{item.name}</Text>
        <Text style={[styles.status, item.status === 'ACTIVE' ? styles.active : styles.inactive]}>{item.status}</Text>
      </View>
      <Text style={styles.planMeta}>Interest: {item.interestRate}% • {item.interestPaidType}</Text>
      <Text style={styles.planMeta}>Months: {item.interestRateTotalMonth} total • Paid over {item.totalPaidMonth}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}><ArrowLeft color="#FFFFFF" size={16} /></Text>
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={styles.headerTitleText}>Installment Plans</Text>
            <Text style={styles.headerSubtitle}>{plans.length} plans</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}><Text style={styles.loadingText}>Loading…</Text></View>
        ) : plans.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}><SquareChartGantt color="#000000" size={18} /></Text>
            <Text style={styles.emptyTitle}>No installment plans</Text>
            <Text style={styles.emptySubtitle}>Please pull to refresh later</Text>
          </View>
        ) : (
          <FlatList
            data={plans}
            renderItem={renderItem}
            keyExtractor={(item) => String(item.id)}
            scrollEnabled={false}
            contentContainerStyle={styles.listContent}
          />
        )}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND.PRIMARY },
  header: { paddingTop: SIZES.PADDING.XXXLARGE, paddingHorizontal: SIZES.PADDING.LARGE, paddingBottom: SIZES.PADDING.LARGE },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backButton: { width: 40, height: 40, borderRadius: SIZES.RADIUS.ROUND, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  backIcon: { color: COLORS.TEXT.WHITE, fontSize: SIZES.FONT.LARGE },
  headerTitle: { flex: 1, marginLeft: SIZES.PADDING.MEDIUM },
  headerTitleText: { color: COLORS.TEXT.WHITE, fontSize: SIZES.FONT.HEADER, fontWeight: 'bold' },
  headerSubtitle: { color: COLORS.TEXT.SECONDARY, marginTop: 4 },
  content: { backgroundColor: COLORS.SURFACE, borderTopLeftRadius: SIZES.RADIUS.XXLARGE, borderTopRightRadius: SIZES.RADIUS.XXLARGE },
  loadingContainer: { padding: 24, alignItems: 'center' },
  loadingText: { color: COLORS.TEXT.SECONDARY },
  emptyContainer: { alignItems: 'center', padding: 40 },
  emptyIcon: { marginBottom: 8 },
  emptyTitle: { fontSize: SIZES.FONT.LARGE, fontWeight: '700', color: COLORS.TEXT.PRIMARY },
  emptySubtitle: { color: COLORS.TEXT.SECONDARY, marginTop: 4 },
  listContent: { padding: SIZES.PADDING.LARGE },
  planCard: { backgroundColor: COLORS.SURFACE, borderRadius: SIZES.RADIUS.LARGE, padding: SIZES.PADDING.MEDIUM, borderColor: '#EFEFEF', borderWidth: 1, marginBottom: SIZES.PADDING.MEDIUM },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planName: { fontSize: SIZES.FONT.LARGE, fontWeight: '600', color: COLORS.TEXT.PRIMARY },
  planMeta: { color: COLORS.TEXT.SECONDARY, marginTop: 6 },
  status: { fontSize: SIZES.FONT.SMALL, fontWeight: '700' },
  active: { color: COLORS.SUCCESS },
  inactive: { color: COLORS.ERROR },
});

export default StaffInstallmentPlanListScreen;


