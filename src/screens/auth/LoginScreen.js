import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
  TouchableOpacity,
} from 'react-native';
import { Button, Input, Image } from '../../components/common';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS, SIZES, IMAGES, SCREEN_NAMES } from '../../constants';
import { validateEmail } from '../../utils/validators';

const LoginScreen = ({ navigation }) => {
  const { login, isLoading, error, clearError } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [formErrors, setFormErrors] = useState({});

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: null }));
    }
    
    // Clear auth error
    if (error) {
      clearError();
    }
  };

  const validateForm = () => {
    const errors = {};
    
    // Email validation
    const emailError = validateEmail(formData.email);
    if (emailError) {
      errors.email = emailError;
    }
    
    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    const result = await login(formData.email, formData.password);
    
    if (result.success) {
      // Navigation will be handled by the main App component
      // based on user role
    } else {
      Alert.alert('Login Failed', result.message);
    }
  };

  const handleTestAccount = (account) => {
    setFormData({
      email: account.email,
      password: account.password,
    });
    setFormErrors({});
    clearError();
  };

  const handleNavigateForgetPassword = () => {
    navigation.navigate(SCREEN_NAMES.AUTH.FORGOT_PASSWORD, {
      prefilledEmail: formData.email,
    });
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
            <View style={styles.header}>
              <Image 
                source={IMAGES.LOGO_BLACK} 
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.subtitle}>Sign in to your account</Text>
            </View>

            <View style={styles.form}>
            <Input
              label="Email"
              placeholder="Enter your email"
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
              error={formErrors.email}
            />

            <Input
              label="Password"
              placeholder="Enter your password"
              value={formData.password}
              onChangeText={(value) => handleInputChange('password', value)}
              secureTextEntry
              error={formErrors.password}
            />

            <TouchableOpacity 
              onPress={handleNavigateForgetPassword}
              style={styles.forgetPasswordLink}
            >
              <Text style={styles.forgetPasswordText}>Forgot password?</Text>
            </TouchableOpacity>

            {error && (
              <Text style={styles.errorText}>{error}</Text>
            )}

          <Button
            title="Sign in"
            onPress={handleLogin}
            loading={isLoading}
            style={styles.loginButton}
            textStyle={styles.loginButtonText}
          />
          </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // Dark overlay for better text readability
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
    alignItems: 'center',
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: SIZES.PADDING.LARGE,
  },
  logo: {
    width: 200,
    height: 80,
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  subtitle: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.SURFACE,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  form: {
    width: '100%',
  },
  loginButton: {
    marginTop: SIZES.PADDING.MEDIUM,
    backgroundColor: COLORS.SURFACE,
    borderColor: COLORS.SURFACE,
  },
  loginButtonText: {
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '600',
  },
  errorText: {
    color: COLORS.ERROR,
    fontSize: SIZES.FONT.SMALL,
    textAlign: 'center',
    marginTop: SIZES.PADDING.SMALL,
  },
  forgetPasswordLink: {
    alignSelf: 'flex-end',
    marginTop: SIZES.PADDING.SMALL,
    marginBottom: SIZES.PADDING.SMALL,
  },
  forgetPasswordText: {
    color: COLORS.SURFACE,
    fontSize: SIZES.FONT.SMALL,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  testAccounts: {
    marginBottom: SIZES.PADDING.XLARGE,
  },
  testAccountsTitle: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: '600',
    color: COLORS.SURFACE,
    marginBottom: SIZES.PADDING.MEDIUM,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  testAccountButton: {
    marginBottom: SIZES.PADDING.SMALL,
    backgroundColor: COLORS.SURFACE,
    borderColor: COLORS.SURFACE,
  },
  testAccountButtonText: {
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.SURFACE,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  linkText: {
    color: COLORS.SURFACE,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});

export default LoginScreen;
