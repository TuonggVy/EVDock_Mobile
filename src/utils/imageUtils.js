// Image utility functions
import { PLACEHOLDER_IMAGES } from '../constants/images';

// Get placeholder image based on type
export const getPlaceholderImage = (type = 'avatar', text = '') => {
  switch (type) {
    case 'avatar':
      return { uri: PLACEHOLDER_IMAGES.AVATAR };
    case 'product':
      return { uri: PLACEHOLDER_IMAGES.PRODUCT };
    case 'logo':
      return { uri: PLACEHOLDER_IMAGES.LOGO };
    default:
      return { uri: PLACEHOLDER_IMAGES.AVATAR };
  }
};

// Get role-based avatar placeholder
export const getRoleAvatar = (role) => {
  const roleColors = {
    evm_admin: 'FF3B30', // Red
    evm_staff: '5856D6', // Purple
    dealer_manager: '34C759', // Green
    dealer_staff: 'FF9500', // Orange
    customer: '007AFF', // Blue
  };
  
  const color = roleColors[role] || '007AFF';
  const text = role ? role.charAt(0).toUpperCase() : 'U';
  
  return {
    uri: `https://via.placeholder.com/100x100/${color}/FFFFFF?text=${text}`
  };
};

// Get product placeholder with custom text
export const getProductPlaceholder = (productName = 'Product') => {
  const text = productName.charAt(0).toUpperCase();
  return {
    uri: `https://via.placeholder.com/200x150/F2F2F7/8E8E93?text=${text}`
  };
};

// Check if image source is valid
export const isValidImageSource = (source) => {
  if (!source) return false;
  
  if (typeof source === 'string') {
    return source.startsWith('http') || source.startsWith('file://');
  }
  
  if (typeof source === 'object' && source.uri) {
    return source.uri.startsWith('http') || source.uri.startsWith('file://');
  }
  
  return true; // For require() sources
};
