import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES } from '../../constants';
import { CircleCheck, XCircle, AlertTriangle, Info } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const CustomAlert = ({
  visible,
  title,
  message,
  type = 'info', // 'success', 'error', 'warning', 'info'
  showCancel = false,
  confirmText = 'OK',
  cancelText = 'Hủy',
  onConfirm,
  onCancel,
  onClose,
}) => {
  const scaleValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(scaleValue, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      Animated.timing(scaleValue, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const getTypeConfig = () => {
    switch (type) {
        case 'success':
          return {
            icon: <CircleCheck size={32} color="white" />,
            gradient: COLORS.GRADIENT.SUCCESS,
            iconBg: 'rgba(76, 175, 80, 0.1)',
          };
      case 'error':
        return {
          icon: <XCircle size={32} color="white" />,
          gradient: COLORS.GRADIENT.ERROR,
          iconBg: 'rgba(244, 67, 54, 0.1)',
        };
      case 'warning':
        return {
          icon: <AlertTriangle size={32} color="white" />,
          gradient: COLORS.GRADIENT.WARNING,
          iconBg: 'rgba(255, 152, 0, 0.1)',
        };
      default:
        return {
          icon: <Info size={32} color="white" />,
          gradient: COLORS.GRADIENT.INFO,
          iconBg: 'rgba(33, 150, 243, 0.1)',
        };
    }
  };

  const typeConfig = getTypeConfig();

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    if (onClose) onClose();
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    if (onClose) onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ scale: scaleValue }],
            },
          ]}
        >
          <LinearGradient
            colors={typeConfig.gradient}
            style={styles.alertContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Icon */}
            <View style={[styles.iconContainer, { backgroundColor: typeConfig.iconBg }]}>
              {typeConfig.icon}
            </View>

            {/* Title */}
            <Text style={styles.title}>{title}</Text>

            {/* Message */}
            <Text style={styles.message}>{message}</Text>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              {showCancel && (
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancel}
                >
                  <Text style={styles.cancelButtonText}>{cancelText}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  showCancel ? styles.confirmButtonWithCancel : styles.confirmButtonFull,
                ]}
                onPress={handleConfirm}
              >
                <Text style={styles.confirmButtonText}>{confirmText}</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.PADDING.LARGE,
  },
  container: {
    width: width * 0.85,
    maxWidth: 400,
  },
  alertContainer: {
    borderRadius: SIZES.RADIUS.LARGE,
    padding: SIZES.PADDING.LARGE,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  title: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
    textAlign: 'center',
    marginBottom: SIZES.PADDING.SMALL,
  },
  message: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.WHITE,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SIZES.PADDING.LARGE,
    opacity: 0.9,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingVertical: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
    marginRight: SIZES.PADDING.SMALL,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  cancelButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingVertical: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
  },
  confirmButtonWithCancel: {
    flex: 1,
    marginLeft: SIZES.PADDING.SMALL,
  },
  confirmButtonFull: {
    width: '100%',
  },
  confirmButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
    fontWeight: 'bold',
  },
});

export default CustomAlert;
