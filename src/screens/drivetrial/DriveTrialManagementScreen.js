import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
} from 'react-native';
import { COLORS, SIZES } from '../../constants';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Calendar, Clock, Mail, Phone, Plus, Search } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import driveTrialService from '../../services/driveTrialService';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import CustomAlert from '../../components/common/CustomAlert';
import LoadingScreen from '../../components/common/LoadingScreen';

const DriveTrialManagementScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { alertConfig, hideAlert, showError } = useCustomAlert();
  
  const [bookings, setBookings] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all'); // all, PENDING, CONFIRMED, COMPLETED, CANCELLED

  useEffect(() => {
    loadBookings();
  }, [statusFilter]);

  // Refresh when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadBookings();
    });
    return unsubscribe;
  }, [navigation]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      if (!user?.agencyId) {
        showError('Error', 'Agency ID not found');
        return;
      }

      const response = await driveTrialService.getDriveTrials(user.agencyId, {
        page: 1,
        limit: 100,
      });

      if (response.success) {
        setBookings(response.data || []);
      } else {
        showError('Error', response.error || 'Failed to load drive trial bookings');
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
      showError('Error', 'Failed to load drive trial bookings');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBookings();
    setRefreshing(false);
  };

  const handleBookingPress = (booking) => {
    navigation.navigate('DriveTrialDetail', { bookingId: booking.id });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return timeString;
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return '#FF9800';
      case 'CONFIRMED':
        return '#4CAF50';
      case 'COMPLETED':
        return '#2196F3';
      case 'CANCELLED':
        return '#F44336';
      default:
        return COLORS.TEXT.SECONDARY;
    }
  };

  const getStatusText = (status) => {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return 'Pending';
      case 'CONFIRMED':
        return 'Confirmed';
      case 'COMPLETED':
        return 'Completed';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status || 'Unknown';
    }
  };

  // Filter bookings based on search and status
  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      searchQuery === '' ||
      booking.fullname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.phone?.includes(searchQuery);
    
    const matchesStatus = 
      statusFilter === 'all' || 
      booking.status?.toUpperCase() === statusFilter.toUpperCase();
    
    return matchesSearch && matchesStatus;
  });

  const renderBookingCard = ({ item }) => (
    <TouchableOpacity
      style={styles.bookingCard}
      onPress={() => handleBookingPress(item)}
      activeOpacity={0.7}
    >
      {/* Header with gradient background */}
      <LinearGradient
        colors={['#3B82F6', '#1D4ED8']}
        style={styles.bookingCardHeader}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.bookingHeaderContent}>
          <View style={styles.bookingAvatar}>
            <Text style={styles.bookingAvatarText}>
              {item.fullname?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
          <View style={styles.bookingBasicInfo}>
            <Text style={styles.bookingCardName}>{item.fullname || 'N/A'}</Text>
            <Text style={styles.bookingStatus}>
              Status: 
              <Text style={{ color: getStatusColor(item.status), fontWeight: 'bold' }}>
                {' '}{getStatusText(item.status)}
              </Text>
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Content */}
      <View style={styles.bookingCardContent}>
        <View style={styles.infoRow}>
          <View style={styles.infoLabelContainer}>
            <Mail size={14} color={COLORS.TEXT.SECONDARY} />
            <Text style={styles.infoLabel}> Email</Text>
          </View>
          <Text style={styles.infoValue}>{item.email || 'N/A'}</Text>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoLabelContainer}>
            <Phone size={14} color={COLORS.TEXT.SECONDARY} />
            <Text style={styles.infoLabel}> Phone</Text>
          </View>
          <Text style={styles.infoValue}>{item.phone || 'N/A'}</Text>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoLabelContainer}>
            <Calendar size={14} color={COLORS.TEXT.SECONDARY} />
            <Text style={styles.infoLabel}> Drive Date</Text>
          </View>
          <Text style={styles.infoValue}>{formatDate(item.driveDate)}</Text>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoLabelContainer}>
            <Clock size={14} color={COLORS.TEXT.SECONDARY} />
            <Text style={styles.infoLabel}> Drive Time</Text>
          </View>
          <Text style={styles.infoValue}>{formatTime(item.driveTime)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderStatusFilterButtons = () => (
    <View style={styles.filterContainer}>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={[
          { key: 'all', label: 'All' },
          { key: 'PENDING', label: 'Pending' },
          { key: 'CONFIRMED', label: 'Confirmed' },
          { key: 'COMPLETED', label: 'Completed' },
          { key: 'CANCELLED', label: 'Cancelled' },
        ]}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.filterButton,
              statusFilter === item.key && styles.filterButtonActive,
            ]}
            onPress={() => setStatusFilter(item.key)}
          >
            <Text
              style={[
                styles.filterButtonText,
                statusFilter === item.key && styles.filterButtonTextActive,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.filterList}
      />
    </View>
  );

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft color="#FFFFFF" size={18} />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={styles.title}>Drive Trial Booking</Text>
            <Text style={styles.subtitle}>
              {filteredBookings.length} bookings
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('CreateDriveTrial')}
          >
            <Plus color="#FFFFFF" size={18} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchIconContainer}>
          <Search size={18} color={COLORS.TEXT.SECONDARY} />
        </View>
        <TextInput
          style={styles.searchInput}
          placeholder="Search bookings..."
          placeholderTextColor={COLORS.TEXT.SECONDARY}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Status Filter */}
      {renderStatusFilterButtons()}

      {/* Content List */}
      <FlatList
        data={filteredBookings}
        renderItem={renderBookingCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No bookings found</Text>
          </View>
        }
      />

      <CustomAlert config={alertConfig} onDismiss={hideAlert} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
  },
  header: {
    paddingTop: SIZES.PADDING.XXXLARGE,
    paddingHorizontal: SIZES.PADDING.LARGE,
    paddingBottom: SIZES.PADDING.LARGE,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: SIZES.RADIUS.ROUND,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: SIZES.RADIUS.ROUND,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.SURFACE,
    marginHorizontal: SIZES.PADDING.LARGE,
    marginBottom: SIZES.PADDING.MEDIUM,
    borderRadius: SIZES.RADIUS.LARGE,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIconContainer: {
    marginRight: SIZES.PADDING.SMALL,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
  },
  filterContainer: {
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  filterList: {
    paddingHorizontal: SIZES.PADDING.LARGE,
  },
  filterButton: {
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    borderRadius: SIZES.RADIUS.LARGE,
    backgroundColor: COLORS.SURFACE,
    marginRight: SIZES.PADDING.SMALL,
  },
  filterButtonActive: {
    backgroundColor: COLORS.PRIMARY,
  },
  filterButtonText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: COLORS.TEXT.WHITE,
  },
  listContainer: {
    paddingHorizontal: SIZES.PADDING.LARGE,
    paddingBottom: SIZES.PADDING.XXXLARGE,
  },
  bookingCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.LARGE,
    marginBottom: SIZES.PADDING.MEDIUM,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  bookingCardHeader: {
    padding: SIZES.PADDING.LARGE,
  },
  bookingHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookingAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.PADDING.MEDIUM,
  },
  bookingAvatarText: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
  },
  bookingBasicInfo: {
    flex: 1,
  },
  bookingCardName: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
    marginBottom: 4,
  },
  bookingStatus: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.WHITE,
  },
  bookingCardContent: {
    padding: SIZES.PADDING.LARGE,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  infoLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoLabel: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
    marginLeft: 6,
  },
  infoValue: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },
  emptyContainer: {
    paddingVertical: SIZES.PADDING.XXXLARGE,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
  },
});

export default DriveTrialManagementScreen;

