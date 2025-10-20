import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import SimpleImage from './SimpleImage';
import { COLORS, SIZES } from '../../constants';
import { getRoleAvatar } from '../../utils/imageUtils';

const Avatar = ({
  source,
  name,
  role,
  size = 'medium',
  showName = false,
  style,
  ...props
}) => {
  const getAvatarSize = () => {
    switch (size) {
      case 'small':
        return 32;
      case 'medium':
        return 48;
      case 'large':
        return 64;
      case 'xlarge':
        return 96;
      default:
        return 48;
    }
  };

  const getInitials = () => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const avatarSize = getAvatarSize();

  // Get avatar source - prioritize provided source, then role-based, then initials
  const getAvatarSource = () => {
    if (source) return source;
    if (role) return getRoleAvatar(role);
    return null;
  };

  const avatarSource = getAvatarSource();

  return (
    <View style={[styles.container, style]}>
      {avatarSource ? (
        <SimpleImage
          source={avatarSource}
          style={[
            styles.avatar,
            {
              width: avatarSize,
              height: avatarSize,
              borderRadius: avatarSize / 2,
            }
          ]}
          fallbackText={getInitials()}
          {...props}
        />
      ) : (
        <View
          style={[
            styles.placeholder,
            {
              width: avatarSize,
              height: avatarSize,
              borderRadius: avatarSize / 2,
            }
          ]}
        >
          <Text
            style={[
              styles.initials,
              { fontSize: avatarSize * 0.4 }
            ]}
          >
            {getInitials()}
          </Text>
        </View>
      )}
      
      {showName && name && (
        <Text style={styles.name}>{name}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  avatar: {
    borderWidth: 2,
    borderColor: COLORS.PRIMARY,
  },
  placeholder: {
    backgroundColor: COLORS.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: COLORS.SURFACE,
    fontWeight: 'bold',
  },
  name: {
    marginTop: SIZES.PADDING.SMALL,
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.PRIMARY,
    textAlign: 'center',
  },
});

export default Avatar;
