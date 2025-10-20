// Mock Authentication Service for testing without backend
import { USER_ROLES } from '../../constants';
import StorageService from '../storage/storageService';
import { STORAGE_KEYS } from '../../constants';

// Mock users database for EVDock
const MOCK_USERS = [
  {
    id: 1,
    email: 'evmadmin@evdock.com',
    password: 'evmadmin123',
    role: USER_ROLES.EVM_ADMIN,
    name: 'EVM Administrator',
    avatar: null,
    isActive: true,
    department: 'EVM Management',
  },
  {
    id: 2,
    email: 'evmstaff@evdock.com',
    password: 'evmstaff123',
    role: USER_ROLES.EVM_STAFF,
    name: 'EVM Staff',
    avatar: null,
    isActive: true,
    department: 'EVM Operations',
  },
  {
    id: 3,
    email: 'dealermanager@evdock.com',
    password: 'dealermanager123',
    role: USER_ROLES.DEALER_MANAGER,
    name: 'Dealer Manager',
    avatar: null,
    isActive: true,
    department: 'Dealer Management',
    dealerName: 'EVDock Hanoi',
  },
  {
    id: 4,
    email: 'dealerstaff@evdock.com',
    password: 'dealerstaff123',
    role: USER_ROLES.DEALER_STAFF,
    name: 'Dealer Staff',
    avatar: null,
    isActive: true,
    department: 'Sales',
    dealerName: 'EVDock Hanoi',
  },
];

class MockAuthService {
  // Simulate API delay
  delay(ms = 1000) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Login with email and password
  async login(email, password) {
    await this.delay(800); // Simulate network delay

    try {
      const user = MOCK_USERS.find(
        u => u.email === email && u.password === password && u.isActive
      );

      if (!user) {
        return {
          success: false,
          message: 'Invalid email or password',
        };
      }

      // Generate mock tokens
      const tokens = {
        accessToken: `mock_access_token_${user.id}_${Date.now()}`,
        refreshToken: `mock_refresh_token_${user.id}_${Date.now()}`,
      };

      // Store tokens and user data
      await StorageService.setTokens(tokens.accessToken, tokens.refreshToken);
      await StorageService.setUserData({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        department: user.department,
        dealerName: user.dealerName,
      });

      return {
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            avatar: user.avatar,
            department: user.department,
            dealerName: user.dealerName,
          },
          tokens,
        },
        message: 'Login successful',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Login failed. Please try again.',
      };
    }
  }

  // Register new user
  async register(userData) {
    await this.delay(1000);

    try {
      const { email, password, name, role = USER_ROLES.DEALER_STAFF } = userData;

      // Check if user already exists
      const existingUser = MOCK_USERS.find(u => u.email === email);
      if (existingUser) {
        return {
          success: false,
          message: 'User with this email already exists',
        };
      }

      // Create new user
      const newUser = {
        id: MOCK_USERS.length + 1,
        email,
        password,
        name,
        role,
        avatar: null,
        isActive: true,
      };

      MOCK_USERS.push(newUser);

      // Auto login after registration
      return await this.login(email, password);
    } catch (error) {
      return {
        success: false,
        message: 'Registration failed. Please try again.',
      };
    }
  }

  // Logout
  async logout() {
    await this.delay(500);

    try {
      await StorageService.clearTokens();
      await StorageService.clearUserData();

      return {
        success: true,
        message: 'Logged out successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Logout failed',
      };
    }
  }

  // Get current user
  async getCurrentUser() {
    await this.delay(300);

    try {
      const userData = await StorageService.getUserData();
      const tokens = await StorageService.getTokens();

      if (!userData || !tokens.accessToken) {
        return {
          success: false,
          message: 'No user logged in',
        };
      }

      return {
        success: true,
        data: userData,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to get user data',
      };
    }
  }

  // Refresh token
  async refreshToken() {
    await this.delay(500);

    try {
      const { refreshToken } = await StorageService.getTokens();
      
      if (!refreshToken) {
        return {
          success: false,
          message: 'No refresh token available',
        };
      }

      // Generate new tokens
      const newTokens = {
        accessToken: `mock_access_token_${Date.now()}`,
        refreshToken: `mock_refresh_token_${Date.now()}`,
      };

      await StorageService.setTokens(newTokens.accessToken, newTokens.refreshToken);

      return {
        success: true,
        data: newTokens,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Token refresh failed',
      };
    }
  }

  // Check if user is authenticated
  async isAuthenticated() {
    try {
      const userData = await StorageService.getUserData();
      const tokens = await StorageService.getTokens();
      
      return !!(userData && tokens.accessToken);
    } catch (error) {
      return false;
    }
  }
}

export default new MockAuthService();
