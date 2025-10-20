import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { COLORS, SIZES } from '../../constants';

const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  ...props
}) => {
  const getButtonStyle = () => {
    const baseStyle = [styles.button, styles[`button_${size}`]];
    
    if (disabled || loading) {
      baseStyle.push(styles.button_disabled);
    } else {
      baseStyle.push(styles[`button_${variant}`]);
    }
    
    if (style) {
      baseStyle.push(style);
    }
    
    return baseStyle;
  };

  const getTextStyle = () => {
    const baseStyle = [styles.text, styles[`text_${size}`]];
    
    if (disabled || loading) {
      baseStyle.push(styles.text_disabled);
    } else {
      baseStyle.push(styles[`text_${variant}`]);
    }
    
    if (textStyle) {
      baseStyle.push(textStyle);
    }
    
    return baseStyle;
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? COLORS.SURFACE : COLORS.PRIMARY}
          size="small"
        />
      ) : (
        <Text style={getTextStyle()}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: SIZES.RADIUS.MEDIUM,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  button_small: {
    paddingVertical: SIZES.PADDING.SMALL,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    minHeight: 36,
  },
  button_medium: {
    paddingVertical: SIZES.PADDING.MEDIUM,
    paddingHorizontal: SIZES.PADDING.LARGE,
    minHeight: 48,
  },
  button_large: {
    paddingVertical: SIZES.PADDING.LARGE,
    paddingHorizontal: SIZES.PADDING.XLARGE,
    minHeight: 56,
  },
  button_primary: {
    backgroundColor: COLORS.PRIMARY,
  },
  button_secondary: {
    backgroundColor: COLORS.SECONDARY,
  },
  button_outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.PRIMARY,
  },
  button_disabled: {
    backgroundColor: COLORS.TEXT.DISABLED,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  text_small: {
    fontSize: SIZES.FONT.SMALL,
  },
  text_medium: {
    fontSize: SIZES.FONT.MEDIUM,
  },
  text_large: {
    fontSize: SIZES.FONT.LARGE,
  },
  text_primary: {
    color: COLORS.SURFACE,
  },
  text_secondary: {
    color: COLORS.SURFACE,
  },
  text_outline: {
    color: COLORS.PRIMARY,
  },
  text_disabled: {
    color: COLORS.SURFACE,
  },
});

export default Button;
