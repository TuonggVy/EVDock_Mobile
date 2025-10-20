import { useState } from 'react';

export const useCustomAlert = () => {
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info',
    showCancel: false,
    confirmText: 'OK',
    cancelText: 'Hủy',
    onConfirm: null,
    onCancel: null,
  });

  const showAlert = (config) => {
    setAlertConfig({
      visible: true,
      title: config.title || '',
      message: config.message || '',
      type: config.type || 'info',
      showCancel: config.showCancel || false,
      confirmText: config.confirmText || 'OK',
      cancelText: config.cancelText || 'Hủy',
      onConfirm: config.onConfirm || null,
      onCancel: config.onCancel || null,
    });
  };

  const hideAlert = () => {
    setAlertConfig(prev => ({ ...prev, visible: false }));
  };

  const showSuccess = (title, message, onConfirm) => {
    showAlert({
      title,
      message,
      type: 'success',
      onConfirm,
    });
  };

  const showError = (title, message, onConfirm) => {
    showAlert({
      title,
      message,
      type: 'error',
      onConfirm,
    });
  };

  const showWarning = (title, message, onConfirm) => {
    showAlert({
      title,
      message,
      type: 'warning',
      onConfirm,
    });
  };

  const showInfo = (title, message, onConfirm) => {
    showAlert({
      title,
      message,
      type: 'info',
      onConfirm,
    });
  };

  const showConfirm = (title, message, onConfirm, onCancel) => {
    showAlert({
      title,
      message,
      type: 'warning',
      showCancel: true,
      confirmText: 'Xác nhận',
      cancelText: 'Hủy',
      onConfirm,
      onCancel,
    });
  };

  const showDeleteConfirm = (title, message, onConfirm, onCancel) => {
    showAlert({
      title,
      message,
      type: 'error',
      showCancel: true,
      confirmText: 'Xóa',
      cancelText: 'Hủy',
      onConfirm,
      onCancel,
    });
  };

  return {
    alertConfig,
    showAlert,
    hideAlert,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm,
    showDeleteConfirm,
  };
};
