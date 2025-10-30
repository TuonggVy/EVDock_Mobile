import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES } from '../../constants';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import installmentPlanService from '../../services/installmentPlanService';
import { ArrowLeft, Calendar } from 'lucide-react-native';

const emptyForm = {
  name: '',
  interestRate: '',
  interestRateTotalMonth: '',
  totalPaidMonth: '',
  interestPaidType: 'FLAT',
  prePaidPercent: '',
  processFee: '',
  startAt: '',
  endAt: '',
  status: 'ACTIVE',
};


const InstallmentPlanDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { user } = useAuth();
  const installmentId = route.params?.installmentId;
  const { alertConfig, hideAlert, showSuccess, showDeleteConfirm } = useCustomAlert();
  const viewOnly = !!route.params?.viewOnly;

  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!installmentId);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!installmentId) return;
      try {
        setLoading(true);
        const res = await installmentPlanService.getInstallmentPlanDetail(installmentId);
        const d = res?.data || {};
        setForm({
          name: d.name || '',
          interestRate: String(d.interestRate ?? ''),
          interestRateTotalMonth: String(d.interestRateTotalMonth ?? ''),
          totalPaidMonth: String(d.totalPaidMonth ?? ''),
          interestPaidType: d.interestPaidType || 'FLAT',
          prePaidPercent: String(d.prePaidPercent ?? ''),
          processFee: String(d.processFee ?? ''),
          startAt: (d.startAt || '').slice(0, 19),
          endAt: (d.endAt || '').slice(0, 19),
          status: d.status || 'ACTIVE',
        });
      } catch (e) {
        console.error('Failed to load installment plan', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [installmentId]);

  const updateField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const formatDateDisplay = (value) => {
    if (!value) return '';
    try {
      const d = new Date(value);
      if (isNaN(d.getTime())) return value;
      return d.toISOString().slice(0, 19);
    } catch {
      return value;
    }
  };

  const openNativeDatePicker = async (fieldKey) => {
    try {
      const { DateTimePickerAndroid } = require('@react-native-community/datetimepicker');
      const current = form[fieldKey] ? new Date(form[fieldKey]) : new Date();
      DateTimePickerAndroid.open({
        value: current,
        mode: 'date',
        onChange: (event, selectedDate) => {
          if (event.type === 'set' && selectedDate) {
            // Ask time after selecting date
            DateTimePickerAndroid.open({
              value: selectedDate,
              mode: 'time',
              onChange: (_e2, selectedTime) => {
                const finalDate = selectedTime || selectedDate;
                updateField(fieldKey, new Date(finalDate).toISOString());
              },
            });
          }
        },
      });
    } catch (e) {
      Alert.alert('Picker unavailable', 'Please enter ISO date-time manually (YYYY-MM-DDTHH:mm:ss)');
    }
  };

  const onSave = async () => {
    try {
      setSaving(true);
      const payload = {
        ...form,
        interestRate: Number(form.interestRate),
        interestRateTotalMonth: Number(form.interestRateTotalMonth),
        totalPaidMonth: Number(form.totalPaidMonth),
        prePaidPercent: Number(form.prePaidPercent),
        processFee: Number(form.processFee),
        startAt: new Date(form.startAt).toISOString(),
        endAt: new Date(form.endAt).toISOString(),
        agencyId: Number(user?.agencyId),
      };

      if (installmentId) {
        await installmentPlanService.updateInstallmentPlan(installmentId, payload);
      } else {
        await installmentPlanService.createInstallmentPlan(payload);
      }

      showSuccess('Thành công', 'Saved successfully', () => navigation.goBack());
    } catch (e) {
      console.error('Save failed', e);
      Alert.alert('Error', 'Could not save installment plan');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!installmentId) return;
    showDeleteConfirm('Xóa', 'Delete this installment plan?', async () => {
      try {
        await installmentPlanService.deleteInstallmentPlan(installmentId);
        navigation.goBack();
      } catch (e) {
        showSuccess('Lỗi', 'Delete failed');
      }
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}><ArrowLeft color="#FFFFFF" size={16} /></Text>
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={styles.headerTitleText}>{installmentId ? 'Edit' : 'Create'} Installment Plan</Text>
            {loading ? <Text style={styles.headerSubtitle}>Loading…</Text> : null}
          </View>
          <View style={{ width: 40 }} />
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.form}>
        {/* Basic fields */}
        {[
          ['name', 'Name'],
          ['interestRate', 'Interest rate (%)'],
          ['interestRateTotalMonth', 'Interest total months'],
          ['totalPaidMonth', 'Total paid months'],
          ['prePaidPercent', 'Prepaid percent'],
          ['processFee', 'Process fee'],
        ].map(([key, label]) => (
          <View key={key} style={styles.field}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
              style={styles.input}
              value={String(form[key] ?? '')}
              onChangeText={(t) => updateField(key, t)}
              placeholder={label}
              placeholderTextColor={COLORS.TEXT.SECONDARY}
              keyboardType={(key.includes('Rate') || key.includes('Month') || key.includes('Percent') || key === 'processFee') ? 'numeric' : 'default'}
              editable={!viewOnly}
            />
          </View>
        ))}

        {/* Type dropdown */}
        <View style={styles.field}>
          <Text style={styles.label}>Type (FLAT/DECLINING)</Text>
          <TouchableOpacity style={styles.selector} disabled={viewOnly} onPress={() => setShowTypeDropdown(true)}>
            <Text style={styles.selectorText}>{form.interestPaidType || 'Select type'}</Text>
          </TouchableOpacity>
        </View>

        {/* Start date picker */}
        <View style={styles.field}>
          <TouchableOpacity activeOpacity={0.9} disabled={viewOnly} onPress={() => openNativeDatePicker('startAt')}>
            <Text style={styles.label}>Start Date</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, styles.inputWithIcon]}
                value={formatDateDisplay(form.startAt)}
                onChangeText={(t) => updateField('startAt', t)}
                placeholder={'YYYY-MM-DDTHH:mm:ss'}
                placeholderTextColor={COLORS.TEXT.SECONDARY}
                editable={false}
                showSoftInputOnFocus={false}
                onFocus={() => { if (!viewOnly) openNativeDatePicker('startAt'); }}
                onPressIn={() => { if (!viewOnly) openNativeDatePicker('startAt'); }}
              />
              <TouchableOpacity style={styles.calendarButton} disabled={viewOnly} onPress={() => openNativeDatePicker('startAt')}>
                <Calendar size={18} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>

        {/* End date picker */}
        <View style={styles.field}>
          <TouchableOpacity activeOpacity={0.9} disabled={viewOnly} onPress={() => openNativeDatePicker('endAt')}>
            <Text style={styles.label}>End Date</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, styles.inputWithIcon]}
                value={formatDateDisplay(form.endAt)}
                onChangeText={(t) => updateField('endAt', t)}
                placeholder={'YYYY-MM-DDTHH:mm:ss'}
                placeholderTextColor={COLORS.TEXT.SECONDARY}
                editable={false}
                showSoftInputOnFocus={false}
                onFocus={() => { if (!viewOnly) openNativeDatePicker('endAt'); }}
                onPressIn={() => { if (!viewOnly) openNativeDatePicker('endAt'); }}
              />
              <TouchableOpacity style={styles.calendarButton} disabled={viewOnly} onPress={() => openNativeDatePicker('endAt')}>
                <Calendar size={18} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>

        {/* Status dropdown */}
        <View style={styles.field}>
          <Text style={styles.label}>Status (ACTIVE/INACTIVE)</Text>
          <TouchableOpacity style={styles.selector} disabled={viewOnly} onPress={() => setShowStatusDropdown(true)}>
            <Text style={styles.selectorText}>{form.status || 'Select status'}</Text>
          </TouchableOpacity>
        </View>

        {!viewOnly && (
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionWrapper} disabled={saving} onPress={onSave}>
            <LinearGradient colors={COLORS.GRADIENT.BLUE} style={styles.saveButton}>
              <Text style={styles.saveText}>{saving ? 'Saving…' : 'Save'}</Text>
            </LinearGradient>
          </TouchableOpacity>
          {installmentId ? (
            <TouchableOpacity style={styles.actionWrapper} disabled={saving} onPress={onDelete}>
              <LinearGradient colors={COLORS.GRADIENT.ERROR} style={styles.deleteButtonRow}>
                <Text style={styles.deleteTextRow}>Delete</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : null}
        </View>
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

      {/* Type Dropdown */}
      <Modal transparent visible={showTypeDropdown} animationType="fade" onRequestClose={() => setShowTypeDropdown(false)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setShowTypeDropdown(false)}>
          <View style={styles.modalSheet}>
            {['FLAT', 'DECLINING'].map((opt) => (
              <TouchableOpacity key={opt} style={styles.optionItem} onPress={() => { updateField('interestPaidType', opt); setShowTypeDropdown(false); }}>
                <Text style={styles.optionText}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Status Dropdown */}
      <Modal transparent visible={showStatusDropdown} animationType="fade" onRequestClose={() => setShowStatusDropdown(false)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setShowStatusDropdown(false)}>
          <View style={styles.modalSheet}>
            {['ACTIVE', 'INACTIVE'].map((opt) => (
              <TouchableOpacity key={opt} style={styles.optionItem} onPress={() => { updateField('status', opt); setShowStatusDropdown(false); }}>
                <Text style={styles.optionText}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
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
  deleteButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  deleteText: { fontSize: SIZES.FONT.LARGE, color: COLORS.ERROR },
  content: { backgroundColor: COLORS.SURFACE, borderTopLeftRadius: SIZES.RADIUS.XXLARGE, borderTopRightRadius: SIZES.RADIUS.XXLARGE },
  form: { padding: SIZES.PADDING.LARGE },
  field: { marginBottom: SIZES.PADDING.MEDIUM },
  label: { color: COLORS.TEXT.PRIMARY, marginBottom: 6, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: SIZES.RADIUS.MEDIUM, paddingHorizontal: 12, paddingVertical: 10, color: COLORS.TEXT.PRIMARY },
  row: { flexDirection: 'row', alignItems: 'center' },
  inputWrapper: { position: 'relative' },
  inputWithIcon: { paddingRight: 44 },
  calendarButton: { position: 'absolute', right: 10, top: 8, height: 28, width: 28, alignItems: 'center', justifyContent: 'center' },
  calendarIcon: { fontSize: 18, color: COLORS.TEXT.PRIMARY },
  selector: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: SIZES.RADIUS.MEDIUM, paddingHorizontal: 12, paddingVertical: 12, backgroundColor: '#FAFAFA' },
  selectorText: { color: COLORS.TEXT.PRIMARY, fontWeight: '600' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 },
  modalSheet: { backgroundColor: COLORS.SURFACE, borderRadius: SIZES.RADIUS.LARGE, overflow: 'hidden' },
  optionItem: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#EFEFEF' },
  optionText: { color: COLORS.TEXT.PRIMARY, fontWeight: '600' },
  actionsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  actionWrapper: { flex: 1, marginHorizontal: 4 },
  saveButton: { paddingVertical: 12, borderRadius: SIZES.RADIUS.LARGE, alignItems: 'center' },
  deleteButtonRow: { paddingVertical: 12, borderRadius: SIZES.RADIUS.LARGE, alignItems: 'center' },
  saveText: { color: COLORS.TEXT.WHITE, fontWeight: '700' },
  deleteTextRow: { color: COLORS.TEXT.WHITE, fontWeight: '700' },
});

export default InstallmentPlanDetailScreen;

// Type selector modal
// Status selector modal
const TypeStatusModals = () => null; // placeholder to keep file end clean


