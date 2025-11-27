import AsyncStorage from '@react-native-async-storage/async-storage';

export const checkAuthStatus = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    
    console.log('Auth Status Check:');
    console.log('- Access Token:', token ? 'Present' : 'Missing');
    console.log('- Refresh Token:', refreshToken ? 'Present' : 'Missing');
    
    return {
      hasAccessToken: !!token,
      hasRefreshToken: !!refreshToken,
      isAuthenticated: !!(token && refreshToken)
    };
  } catch (error) {
    console.error('Error checking auth status:', error);
    return {
      hasAccessToken: false,
      hasRefreshToken: false,
      isAuthenticated: false
    };
  }
};

export const clearAuthTokens = async () => {
  try {
    await AsyncStorage.multiRemove(['token', 'refreshToken', 'user']);
    console.log('Auth tokens cleared');
  } catch (error) {
    console.error('Error clearing auth tokens:', error);
  }
};
