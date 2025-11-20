import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS, SIZES } from '../../constants';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import { 
  User, 
  Mail, 
  Phone, 
  UserCircle, 
  Building, 
  Building2, 
  Briefcase, 
  Calendar,
  Settings,
  Bell,
  Lock,
  HelpCircle,
  Camera,
  ArrowLeft,
  ChevronRight,
  LogOut
} from 'lucide-react-native';
import { getProfile } from '../../services/api/authApi';

const { width } = Dimensions.get('window');

const ProfileScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { alertConfig, hideAlert, showConfirm, showInfo } = useCustomAlert();
  const [profileData, setProfileData] = useState(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const showInfoRef = useRef(showInfo);

  useEffect(() => {
    showInfoRef.current = showInfo;
  }, [showInfo]);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    let isActive = true;

    const fetchProfile = async () => {
      setIsProfileLoading(true);
      try {
        const response = await getProfile(user.id);
        const profile = response?.data ?? response;
        if (isActive) {
          setProfileData(profile || null);
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error.response?.data || error.message);
        if (isActive) {
          const message =
            error.response?.data?.message || "Unable to load profile information.";
          showInfoRef.current("Error", message);
        }
      } finally {
        if (isActive) {
          setIsProfileLoading(false);
        }
      }
    };

    fetchProfile();

    return () => {
      isActive = false;
    };
  }, [user?.id]);

  const handleLogout = () => {
    showConfirm(
      'Logout',
      'Are you sure you want to logout?',
      logout
    );
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'customer': return 'Customer';
      case 'employee': return 'Dealer Staff';
      case 'evm_admin': return 'EVM Admin';
      case 'evm_staff': return 'EVM Staff';
      case 'manager': return 'Dealer Manager';
      default: return 'User';
    }
  };

  const getInfoIcon = (iconName) => {
    const iconProps = { size: 20, color: COLORS.TEXT.PRIMARY };
    switch (iconName) {
      case 'user': return <User {...iconProps} />;
      case 'mail': return <Mail {...iconProps} />;
      case 'phone': return <Phone {...iconProps} />;
      case 'role': return <UserCircle {...iconProps} />;
      case 'building': return <Building {...iconProps} />;
      case 'department': return <Building2 {...iconProps} />;
      case 'briefcase': return <Briefcase {...iconProps} />;
      case 'calendar': return <Calendar {...iconProps} />;
      case 'settings': return <Settings {...iconProps} />;
      case 'bell': return <Bell {...iconProps} />;
      case 'lock': return <Lock {...iconProps} />;
      case 'help': return <HelpCircle {...iconProps} />;
      default: return null;
    }
  };

  const formatDate = (value) => {
    if (!value) return 'Not updated';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
  };

  const displayName = profileData?.fullname || user?.name || user?.username || 'User';
  const displayUsername = profileData?.username || user?.username || 'Not updated';
  const displayEmail = profileData?.email || user?.email || 'email@example.com';
  const displayPhone = profileData?.phone || user?.phone || 'Not updated';
  const displayRole = getRoleDisplayName(user?.role);
  const displayAgency = profileData?.agencyId != null
    ? String(profileData.agencyId)
    : user?.dealerName || user?.company || (user?.agencyId != null ? String(user.agencyId) : 'Not updated');
  const displayAddress = profileData?.address || 'Not updated';
  const displayStartDate = formatDate(profileData?.createAt || user?.startDate);
  const avatarLetter = displayName ? displayName.charAt(0).toUpperCase() : 'U';

  const profileSections = [
    {
      title: 'Personal Information',
      items: [
        { label: 'Full Name', value: displayName || 'Not updated', iconName: 'user' },
        { label: 'Username', value: displayUsername, iconName: 'user' },
        { label: 'Email', value: displayEmail || 'Not updated', iconName: 'mail' },
        { label: 'Phone', value: displayPhone, iconName: 'phone' },
        { label: 'Role', value: displayRole || 'User', iconName: 'role' },
      ],
    },
    {
      title: 'Work Information',
      items: [
        { label: 'Agency ID', value: displayAgency || 'Not updated', iconName: 'building' },
        { label: 'Address', value: displayAddress, iconName: 'department' },
        { label: 'Account Created', value: displayStartDate, iconName: 'calendar' },
      ],
    },
  ];

  const menuItems = [
    {
      title: 'Account Settings',
      iconName: 'settings',
      onPress: () => showInfo('Feature', 'Account Settings - Coming Soon'),
    },
    {
      title: 'Notifications',
      iconName: 'bell',
      onPress: () => showInfo('Feature', 'Notifications - Coming Soon'),
    },
    {
      title: 'Security',
      iconName: 'lock',
      onPress: () => showInfo('Feature', 'Security - Coming Soon'),
    },
    {
      title: 'Help & Support',
      iconName: 'help',
      onPress: () => showInfo('Feature', 'Help - Coming Soon'),
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Profile</Text>
            <Text style={styles.headerSubtitle}>Manage your account information</Text>
          </View>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <ArrowLeft size={24} color={COLORS.TEXT.WHITE} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {avatarLetter}
              </Text>
            </View>
            <TouchableOpacity style={styles.editAvatarButton}>
              <Camera size={14} color={COLORS.TEXT.WHITE} />
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{displayName}</Text>
          <Text style={styles.userRole}>{displayRole}</Text>
          <Text style={styles.userEmail}>{displayEmail}</Text>
        </View>

        {isProfileLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={COLORS.PRIMARY} />
            <Text style={styles.loadingText}>Loading profile...</Text>
          </View>
        )}

        {/* Profile Sections */}
        {profileSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionCard}>
              {section.items.map((item, itemIndex) => (
                <View key={itemIndex} style={styles.infoItem}>
                  <View style={styles.infoLeft}>
                    <View style={{ marginRight: SIZES.PADDING.MEDIUM }}>
                      {getInfoIcon(item.iconName)}
                    </View>
                    <Text style={styles.infoLabel}>{item.label}</Text>
                  </View>
                  <Text style={styles.infoValue}>{item.value}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Logout Button */}
        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut size={20} color={COLORS.TEXT.WHITE} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

       
      </ScrollView>

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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: SIZES.FONT.HEADER,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
    marginBottom: SIZES.PADDING.XSMALL,
  },
  headerSubtitle: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: SIZES.RADIUS.ROUND,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: SIZES.PADDING.LARGE,
  },
  profileCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.LARGE,
    padding: SIZES.PADDING.LARGE,
    alignItems: 'center',
    marginBottom: SIZES.PADDING.LARGE,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#009DFF",
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: SIZES.FONT.XXLARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.ACCENT.BLUE,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.SURFACE,
  },
  userName: {
    fontSize: SIZES.FONT.XXLARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SIZES.PADDING.XSMALL,
  },
  userRole: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.PRIMARY,
    fontWeight: '600',
    marginBottom: SIZES.PADDING.XSMALL,
  },
  userEmail: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
  },
  section: {
    marginBottom: SIZES.PADDING.LARGE,
  },
  sectionTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  sectionCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.LARGE,
    padding: SIZES.PADDING.MEDIUM,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SIZES.PADDING.MEDIUM,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER.PRIMARY,
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoLabel: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
    flex: 1,
  },
  infoValue: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
    textAlign: 'right',
    flex: 1,
  },
  logoutSection: {
    marginBottom: SIZES.PADDING.LARGE,
  },
  logoutButton: {
    backgroundColor: "#009DFF",
    borderRadius: SIZES.RADIUS.LARGE,
    padding: SIZES.PADDING.MEDIUM,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutText: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: '600',
    color: COLORS.TEXT.WHITE,
  },
  appInfo: {
    alignItems: 'center',
    marginBottom: SIZES.PADDING.XXXLARGE,
  },
  appName: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: '600',
    color: COLORS.TEXT.SECONDARY,
    marginBottom: SIZES.PADDING.XSMALL,
  },
  appVersion: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  loadingText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    marginLeft: SIZES.PADDING.XSMALL,
  },
});

export default ProfileScreen;
