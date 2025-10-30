import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Image,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS, SIZES, IMAGES } from '../../constants';

const DealerStaffHomeScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  
  // Auto-sliding banner state
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const bannerImages = [IMAGES.BANNER_MODELX, IMAGES.BANNER_MODELY, IMAGES.BANNER_MODELV];
  const fadeAnim = useState(new Animated.Value(1))[0];
  const slideAnim = useState(new Animated.Value(0))[0];


  // Auto-slide effect with smooth transitions
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBannerIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % bannerImages.length;
        
        // Slide out current image to the left with smooth easing
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: -300,
            duration: 500,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 500,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          })
        ]).start(() => {
          // Reset position and slide in next image from right
          slideAnim.setValue(300);
          fadeAnim.setValue(0);
          
          Animated.parallel([
            Animated.timing(slideAnim, {
              toValue: 0,
              duration: 500,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 500,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            })
          ]).start();
        });
        
        return nextIndex;
      });
    }, 3000); // Change every 3 seconds for better viewing

    return () => clearInterval(interval);
  }, [fadeAnim, slideAnim, bannerImages.length]);

  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Đăng xuất', onPress: logout },
      ]
    );
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Mỗi card dùng mảng màu gradient từ COLORS.GRADIENT.*
  const categoryCards = [
    {
      title: 'Catalog',
      gradient: COLORS.GRADIENT.BLUE,   // ['#3B82F6', '#1D4ED8']
      icon: '🔍',
      onPress: () => navigation.navigate('Catalog'),
    },
    {
      title: 'Sales',
      gradient: COLORS.GRADIENT.PURPLE, // ['#8B5CF6', '#7C3AED']
      icon: '📋',
      onPress: () => navigation.navigate('QuotationManagement'),
    },
    {
      title: 'Customers',
      gradient: COLORS.GRADIENT.PINK_PURPLE, // ['#8B5CF6', '#7C3AED']
      icon: '👥',
      onPress: () => navigation.navigate('CustomerManagement'),
    },
    {
      title: 'Promotions',
      gradient: COLORS.GRADIENT.PINK, // ['#F59E0B', '#D97706']
      icon: '🎯',
      onPress: () => navigation.navigate('PromotionManagement'),
    },
    {
      title: 'Installments',
      gradient: COLORS.GRADIENT.GREEN,
      icon: '📅',
      onPress: () => navigation.navigate('InstallmentManagement'),
    },
    {
      title: 'Installment Plan',
      gradient: COLORS.GRADIENT.CYAN,
      icon: '📈',
      onPress: () => navigation.navigate('StaffInstallmentPlanList'),
    },
    {
      title: 'Deposits',
      gradient: COLORS.GRADIENT.ORANGE,
      icon: '💎',
      onPress: () => navigation.navigate('DepositManagement'),
    },
  ];


  return (
    <View style={styles.container}>
      {/* Header (nền đen) */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greetingText}>{getGreeting()},</Text>
            <Text style={styles.userName}>{user?.name || 'Staff'}</Text>
            <Text style={styles.roleText}>Dealer Staff</Text>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconButton}>
              <Text style={styles.iconText}>📊</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Text style={styles.iconText}>🔔</Text>
              <View style={styles.notificationDot} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => navigation.navigate('Profile')}
            >
              <Text style={styles.iconText}>👤</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* TOP SECTION (đen): Search + Categories */}
      <View style={styles.topSection}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search tasks, customers..."
            placeholderTextColor={COLORS.TEXT.SECONDARY}
          />
        </View>

        {/* Category Cards với nền gradient */}
        <View style={styles.categoriesContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
            {categoryCards.map((category, index) => (
              <TouchableOpacity
                key={index}
                style={styles.categoryCard}
                activeOpacity={0.85}
                onPress={category.onPress}
              >
                <LinearGradient
                  colors={category.gradient || ['#7CA1FF', '#A7B1FF']}
                  style={styles.categoryGradient}
                  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 0.8 }}
                >
                  <Text style={styles.categoryTitle}>{category.title}</Text>
                  <Text style={styles.categoryIcon}>{category.icon}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* BOTTOM WRAPPER (trắng) chiếm hết phần còn lại */}
      <View style={styles.bottomWrapper}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.bottomContent}
        >
          {/* Auto-sliding Promotional Banner */}
          <View style={styles.bannerContainer}>
            <Animated.View style={[
              styles.bannerWrapper, 
              { 
                opacity: fadeAnim,
                transform: [{ translateX: slideAnim }]
              }
            ]}>
              <Image 
                source={bannerImages[currentBannerIndex]} 
                style={styles.bannerImage}
                resizeMode="cover"
              />
            </Animated.View>
            
            {/* Banner indicators */}
            <View style={styles.bannerIndicators}>
              {bannerImages.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.indicator,
                    index === currentBannerIndex && styles.activeIndicator
                  ]}
                />
              ))}
            </View>
          </View>

          {/* Quick Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>5</Text>
                <Text style={styles.statLabel}>Khách hàng tư vấn</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>3</Text>
                <Text style={styles.statLabel}>Báo giá tạo</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>2</Text>
                <Text style={styles.statLabel}>Lái thử sắp xếp</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>1</Text>
                <Text style={styles.statLabel}>Hợp đồng ký</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  /* ---------- layout wrappers ---------- */
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND.PRIMARY, // nền tổng đen
  },
  topSection: {
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
    paddingHorizontal: SIZES.PADDING.LARGE,
    paddingBottom: SIZES.PADDING.LARGE,
  },
  bottomWrapper: {
    flex: 1,                               // phủ toàn bộ phần còn lại
    backgroundColor: COLORS.SURFACE,       // nền trắng
    borderTopLeftRadius: SIZES.RADIUS.XXLARGE,
    borderTopRightRadius: SIZES.RADIUS.XXLARGE,
    overflow: 'hidden',                    // giữ bo góc khi cuộn
  },
  bottomContent: {
    paddingHorizontal: SIZES.PADDING.LARGE,
    paddingTop: SIZES.PADDING.XLARGE,
    paddingBottom: SIZES.PADDING.XXXLARGE,
  },

  /* ---------- header ---------- */
  header: {
    paddingTop: SIZES.PADDING.XXXLARGE,
    paddingHorizontal: SIZES.PADDING.LARGE,
    paddingBottom: SIZES.PADDING.LARGE,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greetingText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: SIZES.PADDING.XSMALL,
  },
  userName: {
    fontSize: SIZES.FONT.HEADER,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
    marginBottom: SIZES.PADDING.XSMALL,
  },
  roleText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: SIZES.RADIUS.ROUND,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SIZES.PADDING.SMALL,
    position: 'relative',
  },
  iconText: {
    fontSize: SIZES.FONT.LARGE,
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.PRIMARY,
  },

  /* ---------- search & categories (trên, nền đen) ---------- */
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.LARGE,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    marginBottom: SIZES.PADDING.LARGE,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
    marginRight: SIZES.PADDING.SMALL,
  },
  searchInput: {
    flex: 1,
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
  },

  categoriesContainer: {
    marginBottom: SIZES.PADDING.LARGE,
  },
  categoriesScroll: {
    paddingVertical: SIZES.PADDING.SMALL,
  },
  categoryCard: {
    width: 120,
    height: 100,
    borderRadius: SIZES.RADIUS.LARGE,
    marginRight: SIZES.PADDING.MEDIUM,
    overflow: 'hidden',
    // bóng nhẹ cho card gradient
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 3,
  },
  categoryGradient: {
    flex: 1,
    borderRadius: SIZES.RADIUS.LARGE,
    padding: SIZES.PADDING.MEDIUM,
    justifyContent: 'space-between',
    position: 'relative',
  },
  categoryTitle: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
    marginBottom: SIZES.PADDING.XSMALL,
  },
  categoryIcon: {
    position: 'absolute',
    bottom: -10,
    right: -10,
    fontSize: 50,
    opacity: 0.3,
  },

  /* ---------- banner & stats (dưới, nền trắng) ---------- */
  bannerContainer: {
    marginBottom: SIZES.PADDING.LARGE,
    position: 'relative',
  },
  bannerWrapper: {
    borderRadius: SIZES.RADIUS.LARGE,
    overflow: 'hidden',
    backgroundColor: '#F8F9FA', // Light background for better image display
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  bannerImage: {
    width: '100%',
    height: 200,
  },
  bannerIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SIZES.PADDING.MEDIUM,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.TEXT.SECONDARY,
    marginHorizontal: 4,
    opacity: 0.4,
  },
  activeIndicator: {
    backgroundColor: COLORS.PRIMARY,
    opacity: 1,
    transform: [{ scale: 1.2 }],
  },

  statsContainer: {
    marginBottom: SIZES.PADDING.XXXLARGE,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.LARGE,
    padding: SIZES.PADDING.MEDIUM,
    width: '48%',
    marginBottom: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  statNumber: {
    fontSize: SIZES.FONT.XXLARGE,
    fontWeight: 'bold',
    color: COLORS.SUCCESS,
    marginBottom: SIZES.PADDING.XSMALL,
  },
  statLabel: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    textAlign: 'center',
  },
});

export default DealerStaffHomeScreen;
