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
import { Bell, ChartColumnIncreasing, UserRound } from 'lucide-react-native';

const EVMAdminHomeScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  
  // Auto-sliding banner state
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const bannerImages = [IMAGES.BANNER_MODELX, IMAGES.BANNER_MODELY, IMAGES.BANNER_MODELV];
  const fadeAnim = useState(new Animated.Value(1))[0];
  const slideAnim = useState(new Animated.Value(0))[0];

  // Auto-slide effect with smooth transitions
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBannerIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % (bannerImages?.length || 1);
        
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
  }, [fadeAnim, slideAnim, bannerImages?.length]);

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

  const allCategoryCards = [
    {
      title: 'Pricing',
      gradient: COLORS.GRADIENT.BLUE,
      icon: '💰',
      onPress: () => navigation.navigate('PricingManagement'),
    },
    {
      title: 'Agencies',
      gradient: COLORS.GRADIENT.PINK,
      icon: '🏢',
      onPress: () => navigation.navigate('DealerManagement'),
    },
    {
      title: 'Vehicles',
      gradient: COLORS.GRADIENT.GREEN,
      icon: '🚗',
      onPress: () => navigation.navigate('VehicleManagement'),
    },
    {
      title: 'Warehouse',
      gradient: COLORS.GRADIENT.PURPLE,
      icon: '🏭',
      onPress: () => navigation.navigate('WarehouseManagement'),
    },
    {
      title: 'Staff',
      gradient: COLORS.GRADIENT.ORANGE,
      icon: '👥',
      onPress: () => navigation.navigate('StaffManagement'),
    },
    {
      title: 'Discount',
      gradient: ['#FF6B6B', '#FF8E8E', '#FFB3B3'],
      icon: '🏷️',
      onPress: () => navigation.navigate('DiscountManagement'),
    },
    {
      title: 'Promotions',
      gradient: COLORS.GRADIENT.PINK_PURPLE,
      icon: '🎁',
      onPress: () => navigation.navigate('PromotionManagement'),
    },
    {
      title: 'Inventory',
      gradient: COLORS.GRADIENT.CYAN,
      icon: '📦',
      onPress: () => navigation.navigate('InventoryManagement'),
    },
    {
      title: 'Order Restock',
      gradient: ['#9B59B6', '#8E44AD', '#7D3C98'],
      icon: '🔄',
      onPress: () => navigation.navigate('OrderRestockManagement'),
    },
    {
      title: 'Reports',
      gradient: COLORS.GRADIENT.PURPLE,
      icon: '📊',
      onPress: () => Alert.alert('Tính năng', 'Báo cáo toàn diện - Sắp ra mắt'),
    },
    {
      title: 'Price Policy',
      gradient: ['#4CAF50', '#66BB6A', '#81C784'],
      icon: '💰',
      onPress: () => navigation.navigate('PricePolicyManagement'),
    },
  ];

  // Filter category cards based on search query
  const categoryCards = allCategoryCards.filter(card => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return card.title.toLowerCase().includes(query);
  });


  return (
    <View style={styles.container}>
      {/* Header (nền đen) */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greetingText}>{getGreeting()},</Text>
            <Text style={styles.userName}>{user?.name || 'Admin'}</Text>
            <Text style={styles.roleText}>EVM Administrator</Text>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconButton}>
              <Text style={styles.iconText}><ChartColumnIncreasing color="#FFFFFF" size={16}  /></Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Text style={styles.iconText}><Bell color="#FFFFFF" size={16} /></Text>
              <View style={styles.notificationDot} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => navigation.navigate('Profile')}
            >
              <Text style={styles.iconText}><UserRound color="#FFFFFF" size={16} /></Text>
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
            placeholder="Search system, dealers..."
            placeholderTextColor={COLORS.TEXT.SECONDARY}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
            >
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Category Cards */}
        <View style={styles.categoriesContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
            {categoryCards.map((category, index) => (
              <TouchableOpacity
                key={index}
                style={styles.categoryCard}
                onPress={category.onPress}
              >
                <LinearGradient
                  colors={category.gradient || ['#7CA1FF', '#A7B1FF']}
                  style={styles.categoryGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
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
                source={bannerImages?.[currentBannerIndex] || IMAGES.LOGO_BLACK} 
                style={styles.bannerImage}
                resizeMode="cover"
              />
            </Animated.View>
            
            {/* Banner indicators */}
            <View style={styles.bannerIndicators}>
              {bannerImages && bannerImages.length > 0 && bannerImages.map((_, index) => (
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
                <Text style={styles.statNumber}>15</Text>
                <Text style={styles.statLabel}>Đại lý</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>1,234</Text>
                <Text style={styles.statLabel}>Xe trong kho</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>$2.5M</Text>
                <Text style={styles.statLabel}>Doanh thu tháng</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>98.5%</Text>
                <Text style={styles.statLabel}>Tỷ lệ hoàn thành</Text>
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
  clearButton: {
    padding: SIZES.PADDING.XSMALL,
    marginLeft: SIZES.PADDING.SMALL,
  },
  clearButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
    fontWeight: 'bold',
  },
  logoutText: {
    marginLeft: SIZES.PADDING.SMALL,
    color: COLORS.ERROR,
    fontWeight: '600',
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

  /* ---------- banner & activities & stats (dưới, nền trắng) ---------- */
  bannerContainer: {
    marginBottom: SIZES.PADDING.LARGE,
    position: 'relative',
  },
  bannerWrapper: {
    borderRadius: SIZES.RADIUS.LARGE,
    overflow: 'hidden',
    backgroundColor: '#F8F9FA',
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
  recentContainer: {
    marginBottom: SIZES.PADDING.LARGE,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  // đổi sang màu tối vì nền trắng
  recentTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
  },
  seeAllText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  recentList: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.LARGE,
    padding: SIZES.PADDING.MEDIUM,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.PADDING.MEDIUM,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  itemThumbnail: {
    width: 40,
    height: 40,
    borderRadius: SIZES.RADIUS.SMALL,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.PADDING.MEDIUM,
  },
  thumbnailIcon: {
    fontSize: SIZES.FONT.LARGE,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SIZES.PADDING.XSMALL,
  },
  itemSize: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
  },
  moreButton: {
    padding: SIZES.PADDING.SMALL,
  },
  moreIcon: {
    fontSize: SIZES.FONT.LARGE,
    color: COLORS.TEXT.SECONDARY,
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
    color: COLORS.PRIMARY,
    marginBottom: SIZES.PADDING.XSMALL,
  },
  statLabel: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    textAlign: 'center',
  },
});

export default EVMAdminHomeScreen;
