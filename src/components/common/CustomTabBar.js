import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { House, UserRound } from 'lucide-react-native';
import { COLORS, SIZES } from '../../constants';

const CustomTabBar = ({ state, descriptors, navigation }) => {
  const animatedValues = useRef(
    state.routes.map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    state.routes.forEach((_, index) => {
      Animated.timing(animatedValues[index], {
        toValue: state.index === index ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    });
  }, [state.index]);

  return (
    <View style={styles.tabBarWrapper}>
      <View style={styles.tabBar}>
        {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const IconComponent = route.name === 'Home' ? House : UserRound;

        const scale = animatedValues[index].interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.15],
        });

        const backgroundColor = animatedValues[index].interpolate({
          inputRange: [0, 1],
          outputRange: ['transparent', "#009DFF"],
        });

        const iconColor = animatedValues[index].interpolate({
          inputRange: [0, 1],
          outputRange: [COLORS.TEXT.SECONDARY, COLORS.TEXT.WHITE],
        });

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            style={styles.tabItem}
            activeOpacity={0.7}
          >
            <View style={styles.iconWrapper}>
              <Animated.View
                style={[
                  styles.iconContainer,
                  {
                    backgroundColor,
                    transform: [{ scale }],
                  },
                ]}
              >
                <IconComponent
                  size={20}
                  color={isFocused ? COLORS.TEXT.WHITE : COLORS.TEXT.SECONDARY}
                  strokeWidth={isFocused ? 2.5 : 2}
                />
              </Animated.View>
            </View>
          </TouchableOpacity>
        );
      })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  tabBarWrapper: {
    backgroundColor: '#FFFFFF',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#000000',
    paddingVertical: 10,
    paddingHorizontal: 24,
    // borderTopLeftRadius: 24,
    // borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 4,
    height: 80,
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    height: 60,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    // Tạo một container cố định để icon scale từ giữa
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
});

export default CustomTabBar;
