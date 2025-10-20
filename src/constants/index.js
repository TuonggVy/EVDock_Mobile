// App Constants
export const APP_CONFIG = {
  APP_NAME: 'EVDock Mobile',
  VERSION: '1.0.0',
  ENVIRONMENT: __DEV__ ? 'development' : 'production',
};

// Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  SETTINGS: 'app_settings',
  // App data
  MANUFACTURER_VEHICLES: '@EVDock:ManufacturerVehicles',
  INVENTORY: '@EVDock:Inventory',
  DEALER_CATALOG: '@EVDock:DealerCatalog',
  DEALER_RETAIL_PRICES: '@EVDock:DealerRetailPrices',
};

// Screen Names
export const SCREEN_NAMES = {
  AUTH: {
    LOGIN: 'Login',
    REGISTER: 'Register',
    FORGOT_PASSWORD: 'ForgotPassword',
  },
  MAIN: {
    HOME: 'Home',
    PROFILE: 'Profile',
    SETTINGS: 'Settings',
  },
};

// Colors - Modern Dark Theme
export const COLORS = {
  PRIMARY: '#FF6B35', // Orange accent
  SECONDARY: '#4A90E2', // Blue
  SUCCESS: '#4CAF50',
  WARNING: '#FF9800',
  ERROR: '#F44336',
  BACKGROUND: {
    PRIMARY: '#1A1A1A', // Dark background
    SECONDARY: '#2D2D2D', // Lighter dark
    CARD: '#FFFFFF',
  },
  SURFACE: '#FFFFFF',
  CARD_BACKGROUND: '#FFFFFF',
  BORDER: {
    PRIMARY: '#E5E7EB',
    SECONDARY: '#D1D5DB',
  },
  SHADOW: '#000000',
  TEXT: {
    PRIMARY: '#1A1A1A',
    SECONDARY: '#6B7280',
    DISABLED: '#9CA3AF',
    WHITE: '#FFFFFF',
  },
  ACCENT: {
    BLUE: '#3B82F6',
    PINK: '#EC4899',
    PURPLE: '#8B5CF6',
    ORANGE: '#FF6B35',
  },
  GRADIENT: {
    BLUE: ['#9878DD', '#8E8FF0', '#7CA1FF'],
    PINK: ['#3E6BFF', '#7CA1FF', '#BFD2FF'],
    PURPLE: ['#7CA1FF', '#A7B1FF', '#FF7DA0'],
    PINK_PURPLE: ['#7CA1FF', '#9878DD', '#FF7DA0'],
    GREEN: ['#4CAF50', '#66BB6A', '#81C784'],
    SUCCESS: ['#4CAF50', '#66BB6A', '#81C784'],
    ERROR: ['#F44336', '#EF5350', '#E57373'],
    WARNING: ['#FF9800', '#FFB74D', '#FFCC02'],
    INFO: ['#2196F3', '#42A5F5', '#64B5F6'],
  },
};

// Sizes
export const SIZES = {
  // Font sizes
  FONT: {
    XSMALL: 10,
    SMALL: 12,
    MEDIUM: 14,
    LARGE: 16,
    XLARGE: 18,
    XXLARGE: 20,
    TITLE: 24,
    HEADER: 28,
  },
  // Spacing
  PADDING: {
    XSMALL: 4,
    SMALL: 8,
    MEDIUM: 12,
    LARGE: 16,
    XLARGE: 20,
    XXLARGE: 24,
    XXXLARGE: 32,
  },
  // Border radius
  RADIUS: {
    XSMALL: 4,
    SMALL: 6,
    MEDIUM: 8,
    LARGE: 12,
    XLARGE: 16,
    XXLARGE: 20,
    ROUND: 50,
  },
  // Card dimensions
  CARD: {
    HEIGHT: 120,
    FEATURE_HEIGHT: 100,
  },
};

// Animation Durations
export const ANIMATION = {
  FAST: 200,
  MEDIUM: 300,
  SLOW: 500,
};

// Re-export roles and permissions
export { USER_ROLES, ROLE_DISPLAY_NAMES, hasPermission, getRolePermissions } from './roles';

// Re-export images
export { IMAGES, PLACEHOLDER_IMAGES, IMAGE_SIZES } from './images';
