import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
  ScrollView,
} from 'react-native';
import { Button, Input, Image } from '../../components/common';
import { COLORS, SIZES, IMAGES, SCREEN_NAMES } from '../../constants';
import { verifyResetCode } from '../../services/api/authApi';
import CustomAlert from '../../components/common/CustomAlert';

const VerifyCodeScreen = ({ navigation, route }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info',
    confirmText: 'OK',
    onConfirm: null,
  });

  const email = route?.params?.email || '';

  const closeAlert = () => {
    setAlertConfig(prev => ({ ...prev, visible: false, onConfirm: null }));
  };

  const showAlert = ({ title, message, type = 'info', confirmText = 'OK', onConfirm = null }) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      type,
      confirmText,
      onConfirm,
    });
  };

  const validate = () => {
    if (!email) {
      showAlert({
        title: 'Error',
        message: 'Email not found. Please go back to the previous step.',
        type: 'error',
      });
      return false;
    }

    if (!code) {
      setError('Please enter the verification code');
      return false;
    }

    if (!/^[0-9]{4,6}$/.test(`${code}`)) {
      setError('Invalid verification code');
      return false;
    }

    setError('');
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }

    // Điều hướng ngay khi người dùng xác nhận mã
    navigation.navigate(SCREEN_NAMES.AUTH.RESET_PASSWORD, { email });

    setIsSubmitting(true);

    try {
      const response = await verifyResetCode({
        code: Number(code),
        email,
      });
      if (response.statusCode !== 201) {
        showAlert({
          title: 'Error',
          message: response.message || 'Invalid verification code',
          type: 'error',
        });
      }
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'An error occurred, please try again';
      showAlert({
        title: 'Error',
        message,
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ImageBackground source={IMAGES.BG_LOGIN} style={styles.backgroundImage} resizeMode="cover">
      <View style={styles.overlay} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <View style={styles.contentContainer}>
            <Image source={IMAGES.LOGO_BLACK} style={styles.logo} resizeMode="contain" />
            <Text style={styles.title}>Enter Verification Code</Text>
            <Text style={styles.subtitle}>Type the code you received in your email. It is valid for a limited time.</Text>

            <View style={styles.form}>
              <View style={styles.emailInfo}>
                <Text style={styles.emailInfoLabel}>Email</Text>
                <Text style={styles.emailInfoValue}>{email || 'Unknown'}</Text>
              </View>

              <Input
                label="Verification code"
                placeholder="Example: 123456"
                value={code}
                onChangeText={(value) => {
                  setCode(value);
                  if (error) {
                    setError('');
                  }
                }}
                keyboardType="numeric"
                maxLength={6}
                error={error}
              />

              <Button
                title="Verify code"
                onPress={handleSubmit}
                loading={isSubmitting}
                style={styles.submitButton}
                textStyle={styles.submitButtonText}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        confirmText={alertConfig.confirmText}
        onConfirm={() => {
          if (alertConfig.onConfirm) {
            alertConfig.onConfirm();
          }
          closeAlert();
        }}
        onClose={closeAlert}
      />
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.PADDING.LARGE,
  },
  contentContainer: {
    width: '100%',
    alignItems: 'center',
  },
  logo: {
    width: 180,
    height: 70,
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  title: {
    fontSize: SIZES.FONT.HEADER,
    color: COLORS.SURFACE,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    marginBottom: SIZES.PADDING.SMALL,
  },
  subtitle: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.SURFACE,
    textAlign: 'center',
    marginBottom: SIZES.PADDING.XLARGE,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  form: {
    width: '100%',
  },
  submitButton: {
    marginTop: SIZES.PADDING.LARGE,
    backgroundColor: COLORS.SURFACE,
    borderColor: COLORS.SURFACE,
  },
  submitButtonText: {
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '600',
  },
  emailInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  emailInfoLabel: {
    color: COLORS.SURFACE,
    fontSize: SIZES.FONT.SMALL,
    marginBottom: 4,
  },
  emailInfoValue: {
    color: COLORS.SURFACE,
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: '600',
  },
});

export default VerifyCodeScreen;

