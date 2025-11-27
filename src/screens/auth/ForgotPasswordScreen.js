import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Button, Input, Image } from '../../components/common';
import { COLORS, SIZES, IMAGES, SCREEN_NAMES } from '../../constants';
import { validateEmail } from '../../utils/validators';
import { forgetPassword } from '../../services/api/authApi';
import CustomAlert from '../../components/common/CustomAlert';

const ForgotPasswordScreen = ({ navigation, route }) => {
  const [email, setEmail] = useState('');
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

  useEffect(() => {
    if (route?.params?.prefilledEmail) {
      setEmail(route.params.prefilledEmail);
    }
  }, [route?.params?.prefilledEmail]);

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

  const handleSubmit = async () => {
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }

    setError('');

    // Điều hướng ngay khi người dùng nhấn nút
    navigation.navigate(SCREEN_NAMES.AUTH.VERIFY_CODE, {
      email,
    });

    setIsSubmitting(true);

    try {
      await forgetPassword(email);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'An error occurred, please try again';
      showAlert({
        title: 'Error',
        message: errorMessage,
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ImageBackground
      source={IMAGES.BG_LOGIN}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <View style={styles.contentContainer}>
            <Image
              source={IMAGES.LOGO_BLACK}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Forgot Password</Text>
            <Text style={styles.subtitle}>Enter your email to receive a verification code</Text>

            <View style={styles.form}>
              <Input
                label="Email"
                placeholder="Enter your email"
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  if (error) {
                    setError('');
                  }
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                error={error}
              />

              <Button
                title="Send verification code"
                onPress={handleSubmit}
                loading={isSubmitting}
                style={styles.submitButton}
                textStyle={styles.submitButtonText}
              />

              <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()}>
                <Text style={styles.backLinkText}>Back to login</Text>
              </TouchableOpacity>
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
    marginTop: SIZES.PADDING.MEDIUM,
    backgroundColor: COLORS.SURFACE,
    borderColor: COLORS.SURFACE,
  },
  submitButtonText: {
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '600',
  },
  backLink: {
    marginTop: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
  },
  backLinkText: {
    color: COLORS.SURFACE,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});

export default ForgotPasswordScreen;

