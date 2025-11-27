import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, SafeAreaView, ActivityIndicator } from 'react-native';
import { ArrowLeft, PlusCircle, Trash2, RefreshCw, Pencil, CheckCircle } from 'lucide-react-native';
import { COLORS, SIZES } from '../../constants';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import CustomAlert from '../../components/common/CustomAlert';
import ContractFullPaymentService from '../../services/contractFullPaymentService';

const ContractFullPaymentScreen = ({ navigation, route }) => {
  const { alertConfig, showError, showSuccess, hideAlert, showConfirm } = useCustomAlert();

  const [contractId, setContractId] = useState(
    route?.params?.customerContractId ? String(route.params.customerContractId) : ''
  );
  const [period, setPeriod] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [periods, setPeriods] = useState([]);
  const [editingPeriodId, setEditingPeriodId] = useState(null);

  const loadPeriods = async () => {
    if (!contractId) {
      showError('Validation', 'Please enter contractId to load payments');
      return;
    }
    try {
      setListLoading(true);
      const res = await ContractFullPaymentService.getListByContractId(contractId);
      setPeriods(res?.data || []);
    } catch (e) {
      showError('Error', e?.response?.data?.message || e.message || 'Failed to load payments');
    } finally {
      setListLoading(false);
    }
  };

  const handleCreateOrUpdate = async () => {
    if (!contractId || !period || !amount) {
      showError('Validation', 'Please enter contractId, period and amount');
      return;
    }
    try {
      setLoading(true);
      if (editingPeriodId) {
        // Update existing period
        const payload = {
          period: Number(period),
          amount: Number(amount),
        };
        const res = await ContractFullPaymentService.updatePeriod(editingPeriodId, payload);
        showSuccess('Success', res?.message || 'Updated successfully');
      } else {
        // Create new period
        const payload = {
          period: Number(period),
          amount: Number(amount),
          customerContractId: Number(contractId),
        };
        const res = await ContractFullPaymentService.createPeriodPayment(payload);
        showSuccess('Success', res?.message || 'Created successfully');
      }
      setPeriod('');
      setAmount('');
      setEditingPeriodId(null);
      await loadPeriods();
    } catch (e) {
      showError('Error', e?.response?.data?.message || e.message || (editingPeriodId ? 'Failed to update payment' : 'Failed to create payment'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (periodId) => {
    try {
      setLoading(true);
      const res = await ContractFullPaymentService.deletePeriod(periodId);
      showSuccess('Success', res?.message || 'Deleted successfully');
      await loadPeriods();
    } catch (e) {
      showError('Error', e?.response?.data?.message || e.message || 'Failed to delete payment');
    } finally {
      setLoading(false);
    }
  };

  // Auto-load if customerContractId provided via params
  useEffect(() => {
    if (route?.params?.customerContractId && !contractId) {
      setContractId(String(route.params.customerContractId));
    }
  }, [route?.params?.customerContractId]);

  useEffect(() => {
    if (contractId) {
      loadPeriods();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contractId]);

  const startEdit = (item) => {
    setEditingPeriodId(item.id);
    setPeriod(String(item.period ?? ''));
    setAmount(String(item.amount ?? ''));
  };

  const cancelEdit = () => {
    setEditingPeriodId(null);
    setPeriod('');
    setAmount('');
  };

  const renderItem = ({ item }) => {
    const isPaid = !!item.paidAt;
    return (
      <View style={styles.itemRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.itemTitle}>Period {item.period}</Text>
          <Text style={styles.itemSub}>Amount: {new Intl.NumberFormat('vi-VN').format(item.amount)} VNĐ</Text>
          <Text style={styles.itemSub}>Created: {new Date(item.createAt).toLocaleDateString('vi-VN')}</Text>
          <Text style={styles.itemSub}>PaidAt: {isPaid ? new Date(item.paidAt).toLocaleDateString('vi-VN') : '—'}</Text>
        </View>
        {isPaid ? (
          <View style={styles.paidBadge}>
            <CheckCircle color="#fff" size={18} />
          </View>
        ) : (
          <>
            <TouchableOpacity style={styles.editBtn} onPress={() => startEdit(item)}>
              <Pencil color="#fff" size={18} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() =>
                showConfirm(
                  'Delete Payment',
                  'Are you sure you want to delete this payment period?',
                  () => handleDelete(item.id),
                  () => {}
                )
              }
            >
              <Trash2 color="#fff" size={18} />
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft color={COLORS.TEXT.WHITE} size={22} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.title}>Contract Full Payment</Text>
          <Text style={styles.subtitle}>Create and manage full-payment periods</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.formRow}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contract ID</Text>
            <TextInput
              value={contractId}
              onChangeText={setContractId}
              style={styles.input}
              placeholder="e.g. 1"
              placeholderTextColor={COLORS.TEXT.SECONDARY}
              keyboardType="number-pad"
            />
          </View>
          <TouchableOpacity style={styles.loadBtn} onPress={loadPeriods} disabled={listLoading}>
            {listLoading ? <ActivityIndicator color="#fff" /> : <RefreshCw color="#fff" size={18} />}
          </TouchableOpacity>
        </View>

        <View style={styles.formRow}>
          <View style={styles.inputGroupHalf}>
            <Text style={styles.label}>Period</Text>
            <TextInput
              value={period}
              onChangeText={setPeriod}
              style={styles.input}
              placeholder="e.g. 1"
              placeholderTextColor={COLORS.TEXT.SECONDARY}
              keyboardType="number-pad"
            />
          </View>
          <View style={styles.inputGroupHalf}>
            <Text style={styles.label}>Amount</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              style={styles.input}
              placeholder="e.g. 150000"
              placeholderTextColor={COLORS.TEXT.SECONDARY}
              keyboardType="number-pad"
            />
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: SIZES.PADDING.SMALL }}>
          <TouchableOpacity style={[styles.createBtn, { flex: 1 }]} onPress={handleCreateOrUpdate} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <>
              <PlusCircle color="#fff" size={18} />
              <Text style={styles.createBtnText}>{editingPeriodId ? 'Update Payment Period' : 'Create Payment Period'}</Text>
            </>}
          </TouchableOpacity>
          {editingPeriodId && (
            <TouchableOpacity style={styles.cancelBtn} onPress={cancelEdit} disabled={loading}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          data={periods}
          keyExtractor={(item) => item.id?.toString()}
          renderItem={renderItem}
          style={{ marginTop: SIZES.PADDING.MEDIUM }}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No periods. Enter contract ID and load.</Text>
            </View>
          }
        />
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
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND.PRIMARY },
  header: { backgroundColor: COLORS.BACKGROUND.PRIMARY, paddingTop: SIZES.PADDING.XXXLARGE, paddingHorizontal: SIZES.PADDING.LARGE, paddingBottom: SIZES.PADDING.LARGE, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 40, height: 40, borderRadius: SIZES.RADIUS.ROUND, backgroundColor: 'rgba(255, 255, 255, 0.1)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { flex: 1, alignItems: 'center' },
  title: { color: COLORS.TEXT.WHITE, fontSize: SIZES.FONT.XLARGE, fontWeight: 'bold' },
  subtitle: { color: COLORS.TEXT.SECONDARY, marginTop: 4, fontSize: SIZES.FONT.SMALL },
  content: { flex: 1, backgroundColor: COLORS.SURFACE, borderTopLeftRadius: SIZES.RADIUS.XXLARGE, borderTopRightRadius: SIZES.RADIUS.XXLARGE, padding: SIZES.PADDING.LARGE },
  formRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: SIZES.PADDING.MEDIUM },
  inputGroup: { flex: 1, marginRight: SIZES.PADDING.MEDIUM },
  inputGroupHalf: { flex: 1, marginRight: SIZES.PADDING.MEDIUM },
  label: { color: COLORS.TEXT.PRIMARY, marginBottom: 6 },
  input: { backgroundColor: '#fff', borderRadius: SIZES.RADIUS.MEDIUM, paddingHorizontal: SIZES.PADDING.MEDIUM, paddingVertical: SIZES.PADDING.SMALL, color: COLORS.TEXT.PRIMARY, borderWidth: 1, borderColor: '#E5E7EB' },
  loadBtn: { width: 44, height: 44, borderRadius: 8, backgroundColor: "#009DFF", justifyContent: 'center', alignItems: 'center' },
  createBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: "#009DFF", paddingVertical: SIZES.PADDING.MEDIUM, borderRadius: SIZES.RADIUS.LARGE },
  createBtnText: { color: '#fff', marginLeft: 8, fontWeight: '600' },
  itemRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: SIZES.RADIUS.LARGE, padding: SIZES.PADDING.MEDIUM, marginBottom: SIZES.PADDING.SMALL, borderWidth: 1, borderColor: '#F3F4F6' },
  itemTitle: { color: COLORS.TEXT.PRIMARY, fontWeight: '700', marginBottom: 4 },
  itemSub: { color: COLORS.TEXT.SECONDARY, fontSize: SIZES.FONT.SMALL },
  deleteBtn: { width: 36, height: 36, borderRadius: 8, backgroundColor: COLORS.ERROR, justifyContent: 'center', alignItems: 'center', marginLeft: SIZES.PADDING.SMALL },
  editBtn: { width: 36, height: 36, borderRadius: 8, backgroundColor: "#009DFF", justifyContent: 'center', alignItems: 'center', marginLeft: SIZES.PADDING.SMALL },
  paidBadge: { width: 36, height: 36, borderRadius: 8, backgroundColor: COLORS.SUCCESS, justifyContent: 'center', alignItems: 'center', marginLeft: SIZES.PADDING.SMALL },
  emptyBox: { alignItems: 'center', padding: SIZES.PADDING.LARGE },
  emptyText: { color: COLORS.TEXT.SECONDARY },
  cancelBtn: { paddingHorizontal: SIZES.PADDING.MEDIUM, justifyContent: 'center', alignItems: 'center', borderRadius: SIZES.RADIUS.LARGE, backgroundColor: '#6B7280' },
  cancelBtnText: { color: '#fff', fontWeight: '600' },
});

export default ContractFullPaymentScreen;


