import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import CustomAlert from './CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import { COLORS, SIZES } from '../../constants';

const AlertExample = () => {
  const { alertConfig, hideAlert, showSuccess, showError, showWarning, showInfo, showConfirm, showDeleteConfirm } = useCustomAlert();

  return (
    <View style={styles.container}>
      <TouchableOpacity style={[styles.button, styles.successButton]} onPress={() => showSuccess('Thành công!', 'Dữ liệu đã được lưu thành công')}>
        <Text style={styles.buttonText}>✅ Success Alert</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.errorButton]} onPress={() => showError('Lỗi!', 'Có lỗi xảy ra, vui lòng thử lại')}>
        <Text style={styles.buttonText}>❌ Error Alert</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.warningButton]} onPress={() => showWarning('Cảnh báo!', 'Dữ liệu có thể bị mất')}>
        <Text style={styles.buttonText}>⚠️ Warning Alert</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.infoButton]} onPress={() => showInfo('Thông tin', 'Đây là thông báo thông tin')}>
        <Text style={styles.buttonText}>ℹ️ Info Alert</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.confirmButton]} onPress={() => showConfirm('Xác nhận', 'Bạn có chắc chắn muốn tiếp tục?', () => console.log('Confirmed!'))}>
        <Text style={styles.buttonText}>Confirm Alert</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.deleteButton]} onPress={() => showDeleteConfirm('Xóa dữ liệu', 'Bạn có chắc chắn muốn xóa?', () => console.log('Deleted!'))}>
        <Text style={styles.buttonText}>Delete Confirm</Text>
      </TouchableOpacity>

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
  container: {
    flex: 1,
    padding: SIZES.PADDING.LARGE,
    justifyContent: 'center',
  },
  button: {
    padding: SIZES.PADDING.MEDIUM,
    borderRadius: SIZES.RADIUS.MEDIUM,
    marginVertical: SIZES.PADDING.SMALL,
    alignItems: 'center',
  },
  buttonText: {
    color: COLORS.TEXT.WHITE,
    fontWeight: 'bold',
    fontSize: SIZES.FONT.MEDIUM,
  },
  successButton: {
    backgroundColor: COLORS.SUCCESS,
  },
  errorButton: {
    backgroundColor: COLORS.ERROR,
  },
  warningButton: {
    backgroundColor: COLORS.WARNING,
  },
  infoButton: {
    backgroundColor: COLORS.PRIMARY,
  },
  confirmButton: {
    backgroundColor: COLORS.SECONDARY,
  },
  deleteButton: {
    backgroundColor: COLORS.ERROR,
  },
});

export default AlertExample;
