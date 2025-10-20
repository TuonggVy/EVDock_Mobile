import React from 'react';
import { Image as RNImage, View, Text, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../../constants';

const SimpleImage = ({
  source,
  style,
  size = 'medium',
  fallbackText = 'Image',
  ...props
}) => {
  const getImageSize = () => {
    switch (size) {
      case 'small':
        return { width: 32, height: 32 };
      case 'medium':
        return { width: 64, height: 64 };
      case 'large':
        return { width: 96, height: 96 };
      case 'xlarge':
        return { width: 128, height: 128 };
      default:
        return { width: 64, height: 64 };
    }
  };

  const imageSize = getImageSize();

  // If source is a string (URI), use it directly
  if (typeof source === 'string') {
    return (
      <RNImage
        source={{ uri: source }}
        style={[styles.image, imageSize, style]}
        {...props}
      />
    );
  }

  // If source is an object with uri
  if (source && source.uri) {
    return (
      <RNImage
        source={source}
        style={[styles.image, imageSize, style]}
        {...props}
      />
    );
  }

  // If source is a require() object
  if (source) {
    return (
      <RNImage
        source={source}
        style={[styles.image, imageSize, style]}
        {...props}
      />
    );
  }

  // Fallback - show text placeholder
  return (
    <View style={[styles.placeholder, imageSize, style]}>
      <Text style={[styles.placeholderText, { fontSize: imageSize.width * 0.3 }]}>
        {fallbackText}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    borderRadius: SIZES.RADIUS.SMALL,
  },
  placeholder: {
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
    borderWidth: 1,
    borderColor: COLORS.TEXT.DISABLED,
    borderRadius: SIZES.RADIUS.SMALL,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: COLORS.TEXT.SECONDARY,
    fontWeight: '500',
  },
});

export default SimpleImage;
