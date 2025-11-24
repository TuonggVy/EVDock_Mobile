import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Image,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS, SIZES, IMAGES } from '../../constants';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import { Bell, ChartColumnIncreasing, Search, UserRound, ChevronRight, Car, CarFront, Gift, Bus, CircleDollarSign, CreditCard, NotepadText, WalletCards, Building2, Users, PackageOpen } from 'lucide-react-native';
import useUserProfile from '../../hooks/useUserProfile';
import dashboardService from '../../services/dashboardService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const DealerManagerHomeScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { alertConfig, hideAlert, showConfirm, showInfo } = useCustomAlert();
  const { profile } = useUserProfile();
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dashboard stats state
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);
  
  // Auto-sliding banner state
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const bannerImages = [IMAGES.BANNER_MODELX, IMAGES.BANNER_MODELY, IMAGES.BANNER_MODELV];
  const fadeAnim = useState(new Animated.Value(1))[0];
  const slideAnim = useState(new Animated.Value(0))[0];

  // Load dashboard stats
  useEffect(() => {
    loadDashboardStats();

    // Reload when screen comes into focus
    const unsubscribe = navigation?.addListener('focus', () => {
      loadDashboardStats();
    });

    return unsubscribe;
  }, [navigation, user?.agencyId]);

  const loadDashboardStats = async () => {
    try {
      setLoadingStats(true);
      // Get agencyId from AsyncStorage or user object
      const storedAgencyId = await AsyncStorage.getItem('agencyId');
      const userAgencyId = user?.agencyId;
      const agencyId = storedAgencyId || userAgencyId;

      if (!agencyId) {
        console.warn('No agencyId found for loading dashboard stats');
        setLoadingStats(false);
        return;
      }

      const [totalCustomerRes, totalRevenueRes] = await Promise.all([
        dashboardService.getTotalCustomer(agencyId),
        dashboardService.getTotalRevenue(agencyId),
      ]);

      setTotalCustomers(totalCustomerRes?.data?.totalCustomers || 0);
      setTotalRevenue(totalRevenueRes?.data?.totalRevenue || 0);
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const formatRevenue = (value) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(2)}M VNĐ`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(2)}K VNĐ`;
    }
    return `${value.toLocaleString('vi-VN')} VNĐ`;
  };

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
    showConfirm(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      logout
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
      title: 'Catalogs',
      gradient: ['#302F32', '#302F32', '#302F32'],
      icon: <CarFront color="#A1D9FF" size={60} />,
      onPress: () => navigation.navigate('Catalog'),
    },
    {
      title: 'Customer Contracts',
      gradient: ['#302F32', '#302F32', '#302F32'],
      icon: <NotepadText color="#A1D9FF" size={60} />,
      onPress: () => navigation.navigate('CustomerContractManagement'),
    },
    {
      title: 'Stock Promotion Management',
      gradient: ['#302F32', '#302F32', '#302F32'],
      icon: <Gift color="#A1D9FF" size={50} />,
      onPress: () => navigation.navigate('StockPromotionManagement'),
    },
    {
      title: 'Orders Restock',
      gradient: ['#302F32', '#302F32', '#302F32'],
      icon: <Bus color="#A1D9FF" size={60} />,
      onPress: () => navigation.navigate('OrderManagement'),
    },
    {
      title: 'Installment Plan',
      gradient: ['#302F32', '#302F32', '#302F32'],
      icon: <NotepadText color="#A1D9FF" size={60} />,
      onPress: () => navigation.navigate('InstallmentPlanManagement'),
    },
    {
      title: 'Quotations',
      gradient: ['#302F32', '#302F32', '#302F32'],
      icon: <NotepadText color="#A1D9FF" size={60} />,
      onPress: () => navigation.navigate('DealerManagerQuotation'),
    },
    {
      title: 'Dealer Staff',
      gradient: ['#302F32', '#302F32', '#302F32'],
      icon: <Users color="#A1D9FF" size={60} />,
      onPress: () => navigation.navigate('DealerStaffManagement'),
    },
    {
      title: 'Stock Management',
      gradient: ['#302F32', '#302F32', '#302F32'],
      icon: <PackageOpen color="#A1D9FF" size={60} />,
      onPress: () => navigation.navigate('StockManagement'),
    },
    {
      title: 'Credit Line',
      gradient: ['#302F32', '#302F32', '#302F32'],
      icon: <CreditCard color="#A1D9FF" size={60} />,
      onPress: () => navigation.navigate('DealerManagerCreditLine'),
    },
    {
      title: 'Reports',
      gradient: ['#302F32', '#302F32', '#302F32'],
      icon: <ChartColumnIncreasing color="#A1D9FF" size={60} />,
      onPress: () => navigation.navigate('DealerManagerDashboard'),
    },
  ];

  // Filter category cards based on search query
  const categoryCards = allCategoryCards.filter(card => {
    if (!searchQuery.trim()) return true;
    const searchLower = searchQuery.toLowerCase();
    return card.title.toLowerCase().includes(searchLower);
  });

  // Display only first 5 cards on home screen
  const displayedCards = categoryCards.slice(0, 5);
  const hasMoreCards = categoryCards.length > 5;


  return (
    <View style={styles.container}>
      {/* Header (nền đen) */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greetingText}>{getGreeting()},</Text>
            <Text style={styles.userName}>{profile?.fullname || profile?.username || user?.name || 'Manager'}</Text>
            <Text style={styles.roleText}>Dealer Manager</Text>
          </View>
        </View>
      </View>

      {/* TOP SECTION (đen): Search + Categories */}
      <View style={styles.topSection}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}><Search /></Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search categories..."
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
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.categoriesScroll}
            contentContainerStyle={styles.categoriesScrollContent}
          >
            {displayedCards.map((category, index) => (
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
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.categoryTitle}>{category.title}</Text>
                  <Text style={styles.categoryIcon}>{category.icon}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
            {hasMoreCards && (
              <TouchableOpacity
                style={styles.seeAllCard}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('AllCategories', { categoryCards: categoryCards })}
              >
                <ChevronRight color={COLORS.TEXT.PRIMARY} size={25} />
              </TouchableOpacity>
            )}
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
                <Text style={styles.statNumber}>
                  {loadingStats ? '...' : totalCustomers.toLocaleString('vi-VN')}
                </Text>
                <Text style={styles.statLabel}>Tổng khách hàng</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>
                  {loadingStats ? '...' : formatRevenue(totalRevenue)}
                </Text>
                <Text style={styles.statLabel}>Tổng doanh thu</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
      
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        showCancel={alertConfig.showCancel}
        confirmText={alertConfig.confirmText}
        cancelText={alertConfig.cancelText}
        onConfirm={alertConfig.onConfirm}
        onCancel={alertConfig.onCancel}
        onClose={hideAlert}
      />
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

  /* ---------- search & categories (trên, nền đen) ---------- */
  content: {
    // không dùng nữa (đã thay bằng topSection + bottomWrapper)
  },
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
  categoriesScrollContent: {
    alignItems: 'center',
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
  seeAllCard: {
    width: 40,
    height: 40,
    borderRadius: SIZES.RADIUS.ROUND,
    marginRight: SIZES.PADDING.MEDIUM,
    backgroundColor: COLORS.SURFACE,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 3,
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
  // đổi sang màu tối để nổi bật trên nền trắng
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
    color: COLORS.SECONDARY,
    marginBottom: SIZES.PADDING.XSMALL,
  },
  statLabel: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    textAlign: 'center',
  },
});

export default DealerManagerHomeScreen;
