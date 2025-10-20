import React from 'react';
import { Image as RNImage, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../../constants';

const Image = ({
  source,
  style,
  size = 'medium',
  variant = 'default',
  ...props
}) => {
  const getImageStyle = () => {
    const baseStyle = [styles.image];
    
    // Size variants
    switch (size) {
      case 'small':
        baseStyle.push(styles.small);
        break;
      case 'medium':
        baseStyle.push(styles.medium);
        break;
      case 'large':
        baseStyle.push(styles.large);
        break;
      case 'xlarge':
        baseStyle.push(styles.xlarge);
        break;
      default:
        baseStyle.push(styles.medium);
    }
    
    // Style variants
    switch (variant) {
      case 'avatar':
        baseStyle.push(styles.avatar);
        break;
      case 'logo':
        baseStyle.push(styles.logo);
        break;
      case 'product':
        baseStyle.push(styles.product);
        break;
      case 'background':
        baseStyle.push(styles.background);
        break;
      default:
        baseStyle.push(styles.default);
    }
    
    if (style) {
      baseStyle.push(style);
    }
    
    return baseStyle;
  };

  return (
    <RNImage
      source={source}
      style={getImageStyle()}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  image: {
    // Base image styles
  },
  
  // Size variants
  small: {
    width: 24,
    height: 24,
  },
  medium: {
    width: 48,
    height: 48,
  },
  large: {
    width: 96,
    height: 96,
  },
  xlarge: {
    width: 150,
    height: 150,
  },
  
  // Style variants
  default: {
    // Default image style
  },
  avatar: {
    borderRadius: 25,
    borderWidth: 2,
    borderColor: COLORS.PRIMARY,
  },
  logo: {
    resizeMode: 'contain',
  },
  product: {
    borderRadius: SIZES.RADIUS.MEDIUM,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
  },
  background: {
    resizeMode: 'cover',
  },
});

export default Image;
