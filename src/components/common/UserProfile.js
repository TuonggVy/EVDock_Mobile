import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Avatar } from './';
import { COLORS, SIZES } from '../../constants';

const UserProfile = ({ user, showDetails = true }) => {
  if (!user) return null;

  return (
    <View style={styles.container}>
      <Avatar
        name={user.name}
        role={user.role}
        size="large"
        showName={showDetails}
      />
      
      {showDetails && (
        <View style={styles.details}>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.role}>{user.role?.replace('_', ' ').toUpperCase()}</Text>
          {user.department && (
            <Text style={styles.department}>{user.department}</Text>
          )}
          {user.dealerName && (
            <Text style={styles.dealer}>{user.dealerName}</Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: SIZES.PADDING.MEDIUM,
  },
  details: {
    alignItems: 'center',
    marginTop: SIZES.PADDING.MEDIUM,
  },
  name: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SIZES.PADDING.SMALL,
  },
  role: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.PRIMARY,
    fontWeight: '600',
    marginBottom: SIZES.PADDING.SMALL / 2,
  },
  department: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: SIZES.PADDING.SMALL / 2,
  },
  dealer: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    fontStyle: 'italic',
  },
});

export default UserProfile;
