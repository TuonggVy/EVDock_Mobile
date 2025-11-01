import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
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

const { width } = Dimensions.get('window');

const ProfileScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { alertConfig, hideAlert, showConfirm, showInfo } = useCustomAlert();

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

  const profileSections = [
    {
      title: 'Personal Information',
      items: [
        { label: 'Full Name', value: user?.name || 'Not updated', iconName: 'user' },
        { label: 'Email', value: user?.email || 'Not updated', iconName: 'mail' },
        { label: 'Phone', value: user?.phone || 'Not updated', iconName: 'phone' },
        { label: 'Role', value: getRoleDisplayName(user?.role), iconName: 'role' },
      ],
    },
    {
      title: 'Work Information',
      items: [
        { label: 'Company/Agency', value: user?.dealerName || user?.company || 'Not updated', iconName: 'building' },
        { label: 'Department', value: user?.department || 'Not updated', iconName: 'department' },
        { label: 'Position', value: user?.position || 'Not updated', iconName: 'briefcase' },
        { label: 'Start Date', value: user?.startDate || 'Not updated', iconName: 'calendar' },
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
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>
            <TouchableOpacity style={styles.editAvatarButton}>
              <Camera size={14} color={COLORS.TEXT.WHITE} />
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
          <Text style={styles.userRole}>{getRoleDisplayName(user?.role)}</Text>
          <Text style={styles.userEmail}>{user?.email || 'email@example.com'}</Text>
        </View>

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

        {/* Menu Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings & Options</Text>
          <View style={styles.sectionCard}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.menuItem}
                onPress={item.onPress}
              >
                <View style={styles.menuLeft}>
                  <View style={{ marginRight: SIZES.PADDING.MEDIUM }}>
                    {getInfoIcon(item.iconName)}
                  </View>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                </View>
                <ChevronRight size={20} color={COLORS.TEXT.SECONDARY} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Logout Button */}
        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut size={20} color={COLORS.TEXT.WHITE} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appName}>EVDock Mobile</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
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
    backgroundColor: COLORS.PRIMARY,
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
    borderBottomColor: COLORS.BACKGROUND.PRIMARY,
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
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SIZES.PADDING.MEDIUM,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BACKGROUND.PRIMARY,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuTitle: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
    flex: 1,
  },
  logoutSection: {
    marginBottom: SIZES.PADDING.LARGE,
  },
  logoutButton: {
    backgroundColor: COLORS.ERROR,
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
});

export default ProfileScreen;
