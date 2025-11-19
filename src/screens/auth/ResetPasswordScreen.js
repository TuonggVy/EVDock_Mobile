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
import { updatePassword } from '../../services/api/authApi';
import CustomAlert from '../../components/common/CustomAlert';

const ResetPasswordScreen = ({ navigation, route }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
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
    const validationErrors = {};

    if (!email) {
      validationErrors.email = 'Email not found. Please go back to the previous step.';
    }

    if (!newPassword) {
      validationErrors.newPassword = 'Please enter a new password';
    } else if (newPassword.length < 8) {
      validationErrors.newPassword = 'Password must be at least 8 characters';
    }

    if (!confirmPassword) {
      validationErrors.confirmPassword = 'Please confirm your password';
    } else if (confirmPassword !== newPassword) {
      validationErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const updateResponse = await updatePassword({ email, newPassword });

      const isSuccess = updateResponse.statusCode
        ? updateResponse.statusCode === 200 || updateResponse.statusCode === 201
        : true;

      if (isSuccess) {
        showAlert({
          title: 'Success',
          message: 'Your password has been updated. Please sign in again.',
          type: 'success',
          confirmText: 'Sign in',
          onConfirm: () => navigation.navigate(SCREEN_NAMES.AUTH.LOGIN, { email }),
        });
      } else {
        showAlert({
          title: 'Error',
          message: updateResponse.message || 'Unable to update password',
          type: 'error',
        });
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'An error occurred, please try again';
      showAlert({
        title: 'Error',
        message,
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderEmailInfo = () => (
    <View style={styles.emailInfo}>
      <Text style={styles.emailInfoLabel}>Email</Text>
      <Text style={styles.emailInfoValue}>{email || 'Unknown'}</Text>
    </View>
  );

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
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              Enter your new password after verifying the code sent to your email
            </Text>

            <View style={styles.form}>
              {renderEmailInfo()}

              <Input
                label="New password"
                placeholder="Enter your new password"
                value={newPassword}
                onChangeText={(value) => {
                  setNewPassword(value);
                  if (errors.newPassword) {
                    setErrors((prev) => ({ ...prev, newPassword: null }));
                  }
                }}
                secureTextEntry
                error={errors.newPassword}
              />

              <Input
                label="Confirm password"
                placeholder="Re-enter your new password"
                value={confirmPassword}
                onChangeText={(value) => {
                  setConfirmPassword(value);
                  if (errors.confirmPassword) {
                    setErrors((prev) => ({ ...prev, confirmPassword: null }));
                  }
                }}
                secureTextEntry
                error={errors.confirmPassword}
              />

              <Button
                title="Confirm"
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

export default ResetPasswordScreen;

