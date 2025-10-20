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
import { validateEmail, validatePassword, validateConfirmPassword } from '../../utils/validators';

const RegisterScreen = ({ navigation }) => {
  const { register, isLoading, error, clearError } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: USER_ROLES.DEALER_STAFF, // Default role
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
    
    // Name validation
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    // Email validation
    const emailError = validateEmail(formData.email);
    if (emailError) {
      errors.email = emailError;
    }
    
    // Password validation
    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      errors.password = passwordError;
    }
    
    // Confirm password validation
    const confirmPasswordError = validateConfirmPassword(formData.password, formData.confirmPassword);
    if (confirmPasswordError) {
      errors.confirmPassword = confirmPasswordError;
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    const result = await register(formData);
    
    if (result.success) {
      Alert.alert(
        'Registration Successful',
        'Your account has been created successfully!',
        [{ text: 'OK' }]
      );
      // Navigation will be handled by the main App component
    } else {
      Alert.alert('Registration Failed', result.message);
    }
  };

  const roleOptions = [
    { value: USER_ROLES.DEALER_STAFF, label: ROLE_DISPLAY_NAMES[USER_ROLES.DEALER_STAFF] },
    { value: USER_ROLES.DEALER_MANAGER, label: ROLE_DISPLAY_NAMES[USER_ROLES.DEALER_MANAGER] },
    { value: USER_ROLES.EVM_STAFF, label: ROLE_DISPLAY_NAMES[USER_ROLES.EVM_STAFF] },
    { value: USER_ROLES.EVM_ADMIN, label: ROLE_DISPLAY_NAMES[USER_ROLES.EVM_ADMIN] },
  ];

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
              <Text style={styles.title}>Tạo tài khoản</Text>
              <Text style={styles.subtitle}>Đăng ký EVDock Mobile</Text>
            </View>

          <View style={styles.form}>
            <Input
              label="Họ và tên"
              placeholder="Nhập họ và tên của bạn"
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
              error={formErrors.name}
            />

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

            <Input
              label="Xác nhận mật khẩu"
              placeholder="Xác nhận mật khẩu của bạn"
              value={formData.confirmPassword}
              onChangeText={(value) => handleInputChange('confirmPassword', value)}
              secureTextEntry
              error={formErrors.confirmPassword}
            />

            {error && (
              <Text style={styles.errorText}>{error}</Text>
            )}

            <Button
              title="Tạo tài khoản"
              onPress={handleRegister}
              loading={isLoading}
              style={styles.registerButton}
              textStyle={styles.registerButtonText}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Đã có tài khoản?{' '}
              <Text 
                style={styles.linkText}
                onPress={() => navigation.navigate('Login')}
              >
                Đăng nhập
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
  title: {
    fontSize: SIZES.FONT.XLARGE,
    fontWeight: 'bold',
    color: COLORS.SURFACE,
    marginBottom: SIZES.PADDING.SMALL,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
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
  registerButton: {
    marginTop: SIZES.PADDING.MEDIUM,
    backgroundColor: COLORS.SURFACE,
    borderColor: COLORS.SURFACE,
  },
  registerButtonText: {
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '600',
  },
  errorText: {
    color: COLORS.ERROR,
    fontSize: SIZES.FONT.SMALL,
    textAlign: 'center',
    marginTop: SIZES.PADDING.SMALL,
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

export default RegisterScreen;
