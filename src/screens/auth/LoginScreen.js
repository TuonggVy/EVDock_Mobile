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
} from 'react-native';
import { Button, Input, Image } from '../../components/common';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS, SIZES, USER_ROLES, ROLE_DISPLAY_NAMES, IMAGES } from '../../constants';
import { validateEmail } from '../../utils/validators';

const LoginScreen = ({ navigation }) => {
  const { login, isLoading, error, clearError } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [formErrors, setFormErrors] = useState({});

  // Predefined test accounts for easy testing
  const testAccounts = [
    { email: 'evmadmin@evdock.com', password: 'evmadmin123', role: USER_ROLES.EVM_ADMIN },
    { email: 'evmstaff@evdock.com', password: 'evmstaff123', role: USER_ROLES.EVM_STAFF },
    { email: 'dealermanager@evdock.com', password: 'dealermanager123', role: USER_ROLES.DEALER_MANAGER },
    { email: 'dealerstaff@evdock.com', password: 'dealerstaff123', role: USER_ROLES.DEALER_STAFF },
  ];

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
        <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.header}>
              <Image 
                source={IMAGES.LOGO_BLACK} 
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.subtitle}>Đăng nhập vào tài khoản của bạn</Text>
            </View>

          <View style={styles.form}>
            <Input
              label="Email"
              placeholder="Nhập email của bạn"
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
              error={formErrors.email}
            />

            <Input
              label="Mật khẩu"
              placeholder="Nhập mật khẩu của bạn"
              value={formData.password}
              onChangeText={(value) => handleInputChange('password', value)}
              secureTextEntry
              error={formErrors.password}
            />

            {error && (
              <Text style={styles.errorText}>{error}</Text>
            )}

          <Button
            title="Đăng nhập"
            onPress={handleLogin}
            loading={isLoading}
            style={styles.loginButton}
            textStyle={styles.loginButtonText}
          />
          </View>

          <View style={styles.testAccounts}>
            <Text style={styles.testAccountsTitle}>Tài khoản test (Nhấn để điền)</Text>
            {testAccounts.map((account, index) => (
              <Button
                key={index}
                title={`${ROLE_DISPLAY_NAMES[account.role]} - ${account.email}`}
                onPress={() => handleTestAccount(account)}
                variant="outline"
                size="small"
                style={styles.testAccountButton}
                textStyle={styles.testAccountButtonText}
              />
            ))}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Chưa có tài khoản?{' '}
              <Text 
                style={styles.linkText}
                onPress={() => navigation.navigate('Register')}
              >
                Đăng ký
              </Text>
            </Text>
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
    padding: SIZES.PADDING.LARGE,
  },
  header: {
    alignItems: 'center',
    marginBottom: SIZES.PADDING.XLARGE,
    marginTop: SIZES.PADDING.XLARGE,
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
    marginBottom: SIZES.PADDING.XLARGE,
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
