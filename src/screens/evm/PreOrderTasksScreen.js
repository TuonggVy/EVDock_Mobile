import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES } from '../../constants';
import preOrderService from '../../services/storage/preOrderService';
import { useAuth } from '../../contexts/AuthContext';

const PreOrderTasksScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const list = await preOrderService.getTasks();
    // newest first by updatedAt/createdAt
    const sorted = [...list].sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
    setTasks(sorted);
  };

  useEffect(() => { load(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const updateStatus = async (task, next) => {
    await preOrderService.updateTaskStatus(task.id, next, { userName: user?.name });
    await load();
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <LinearGradient colors={['#FFFFFF', '#F8F9FA']} style={styles.cardGradient}>
        <View style={styles.headerRow}>
          <Text style={styles.idText}>#{item.id}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor(item.status) }]}>
            <Text style={styles.statusText}>{statusText(item.status)}</Text>
          </View>
        </View>
        <View style={styles.row}><Text style={styles.label}>Deposit:</Text><Text style={styles.value}>#{item.depositId}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Model:</Text><Text style={styles.value}>{item.vehicleModel}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Color:</Text><Text style={styles.value}>{item.vehicleColor}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Qty:</Text><Text style={styles.value}>{item.quantity}</Text></View>

        <View style={styles.actionsRow}>
          {item.status === 'requested' && (
            <TouchableOpacity style={styles.actionBtn} onPress={() => updateStatus(item, 'accepted')}>
              <LinearGradient colors={COLORS.GRADIENT.BLUE} style={styles.actionGradient}>
                <Text style={styles.actionText}>Nhận đơn</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
          {item.status === 'accepted' && (
            <TouchableOpacity style={styles.actionBtn} onPress={() => updateStatus(item, 'in_transit')}>
              <LinearGradient colors={COLORS.GRADIENT.PURPLE} style={styles.actionGradient}>
                <Text style={styles.actionText}>Xuất kho/Giao</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
          {item.status === 'in_transit' && (
            <TouchableOpacity style={styles.actionBtn} onPress={() => updateStatus(item, 'delivered')}>
              <LinearGradient colors={COLORS.GRADIENT.GREEN} style={styles.actionGradient}>
                <Text style={styles.actionText}>Đã giao</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.headerTitleText}>Pre-order Tasks</Text>
          <Text style={styles.headerSubtitle}>Nhận và giao xe từ Dealer Manager</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={tasks}
        keyExtractor={(it) => it.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={(<View style={styles.empty}><Text style={styles.emptyText}>Chưa có yêu cầu</Text></View>)}
      />
    </View>
  );
};

const statusText = (s) => ({ requested: 'Requested', accepted: 'Accepted', in_transit: 'In transit', delivered: 'Delivered', cancelled: 'Cancelled' }[s] || s);
const statusColor = (s) => ({ requested: COLORS.WARNING, accepted: COLORS.PRIMARY, in_transit: COLORS.SECONDARY, delivered: COLORS.SUCCESS, cancelled: COLORS.ERROR }[s] || COLORS.TEXT.SECONDARY);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND.PRIMARY },
  header: { paddingTop: SIZES.PADDING.XXXLARGE, paddingHorizontal: SIZES.PADDING.LARGE, paddingBottom: SIZES.PADDING.LARGE, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { width: 40, height: 40, borderRadius: SIZES.RADIUS.ROUND, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  backIcon: { fontSize: SIZES.FONT.LARGE, color: COLORS.TEXT.WHITE, fontWeight: 'bold' },
  headerTitle: { flex: 1, alignItems: 'center' },
  headerTitleText: { fontSize: SIZES.FONT.HEADER, fontWeight: 'bold', color: COLORS.TEXT.WHITE },
  headerSubtitle: { fontSize: SIZES.FONT.SMALL, color: COLORS.TEXT.SECONDARY, marginTop: 2 },
  listContent: { paddingHorizontal: SIZES.PADDING.LARGE, paddingBottom: SIZES.PADDING.XXXLARGE },
  card: { borderRadius: SIZES.RADIUS.LARGE, overflow: 'hidden', marginBottom: SIZES.PADDING.MEDIUM, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  cardGradient: { padding: SIZES.PADDING.MEDIUM },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SIZES.PADDING.SMALL },
  idText: { fontSize: SIZES.FONT.SMALL, color: COLORS.PRIMARY, fontWeight: 'bold' },
  statusBadge: { paddingHorizontal: SIZES.PADDING.SMALL, paddingVertical: SIZES.PADDING.XSMALL, borderRadius: SIZES.RADIUS.SMALL },
  statusText: { fontSize: SIZES.FONT.XSMALL, color: COLORS.TEXT.WHITE, fontWeight: 'bold' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SIZES.PADDING.XSMALL },
  label: { fontSize: SIZES.FONT.SMALL, color: COLORS.TEXT.SECONDARY, fontWeight: '500' },
  value: { fontSize: SIZES.FONT.MEDIUM, color: COLORS.TEXT.PRIMARY, fontWeight: '600' },
  actionsRow: { flexDirection: 'row', gap: SIZES.PADDING.SMALL, marginTop: SIZES.PADDING.SMALL },
  actionBtn: { flex: 1, borderRadius: SIZES.RADIUS.MEDIUM, overflow: 'hidden' },
  actionGradient: { paddingVertical: SIZES.PADDING.MEDIUM, alignItems: 'center' },
  actionText: { fontSize: SIZES.FONT.MEDIUM, color: COLORS.TEXT.WHITE, fontWeight: 'bold' },
  empty: { alignItems: 'center', paddingTop: SIZES.PADDING.XXXLARGE },
  emptyText: { color: COLORS.TEXT.SECONDARY },
});

export default PreOrderTasksScreen;


