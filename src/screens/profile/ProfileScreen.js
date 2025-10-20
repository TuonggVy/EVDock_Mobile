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

const { width } = Dimensions.get('window');

const ProfileScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { alertConfig, hideAlert, showConfirm, showInfo } = useCustomAlert();

  const handleLogout = () => {
    showConfirm(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      logout
    );
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'customer': return 'Khách hàng';
      case 'employee': return 'Nhân viên đại lý';
      case 'evm_admin': return 'Quản trị viên EVM';
      case 'evm_staff': return 'Nhân viên EVM';
      case 'manager': return 'Quản lý đại lý';
      default: return 'Người dùng';
    }
  };

  const profileSections = [
    {
      title: 'Thông tin cá nhân',
      items: [
        { label: 'Họ tên', value: user?.name || 'Chưa cập nhật', icon: '👤' },
        { label: 'Email', value: user?.email || 'Chưa cập nhật', icon: '📧' },
        { label: 'Số điện thoại', value: user?.phone || 'Chưa cập nhật', icon: '📱' },
        { label: 'Vai trò', value: getRoleDisplayName(user?.role), icon: '🎭' },
      ],
    },
    {
      title: 'Thông tin công việc',
      items: [
        { label: 'Công ty/Đại lý', value: user?.dealerName || user?.company || 'Chưa cập nhật', icon: '🏢' },
        { label: 'Phòng ban', value: user?.department || 'Chưa cập nhật', icon: '🏛️' },
        { label: 'Chức vụ', value: user?.position || 'Chưa cập nhật', icon: '💼' },
        { label: 'Ngày bắt đầu', value: user?.startDate || 'Chưa cập nhật', icon: '📅' },
      ],
    },
  ];

  const menuItems = [
    {
      title: 'Cài đặt tài khoản',
      icon: '⚙️',
      onPress: () => showInfo('Tính năng', 'Cài đặt tài khoản - Sắp ra mắt'),
    },
    {
      title: 'Thông báo',
      icon: '🔔',
      onPress: () => showInfo('Tính năng', 'Thông báo - Sắp ra mắt'),
    },
    {
      title: 'Bảo mật',
      icon: '🔒',
      onPress: () => showInfo('Tính năng', 'Bảo mật - Sắp ra mắt'),
    },
    {
      title: 'Trợ giúp & Hỗ trợ',
      icon: '❓',
      onPress: () => showInfo('Tính năng', 'Trợ giúp - Sắp ra mắt'),
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Hồ sơ cá nhân</Text>
            <Text style={styles.headerSubtitle}>Quản lý thông tin tài khoản</Text>
          </View>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>←</Text>
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
              <Text style={styles.editAvatarIcon}>📷</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{user?.name || 'Người dùng'}</Text>
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
                    <Text style={styles.infoIcon}>{item.icon}</Text>
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
          <Text style={styles.sectionTitle}>Cài đặt & Tùy chọn</Text>
          <View style={styles.sectionCard}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.menuItem}
                onPress={item.onPress}
              >
                <View style={styles.menuLeft}>
                  <Text style={styles.menuIcon}>{item.icon}</Text>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                </View>
                <Text style={styles.menuArrow}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Logout Button */}
        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutIcon}>🚪</Text>
            <Text style={styles.logoutText}>Đăng xuất</Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appName}>EVDock Mobile</Text>
          <Text style={styles.appVersion}>Phiên bản 1.0.0</Text>
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
  backIcon: {
    fontSize: SIZES.FONT.LARGE,
    color: COLORS.TEXT.WHITE,
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
  editAvatarIcon: {
    fontSize: SIZES.FONT.SMALL,
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
  infoIcon: {
    fontSize: SIZES.FONT.MEDIUM,
    marginRight: SIZES.PADDING.MEDIUM,
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
  menuIcon: {
    fontSize: SIZES.FONT.MEDIUM,
    marginRight: SIZES.PADDING.MEDIUM,
  },
  menuTitle: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
    flex: 1,
  },
  menuArrow: {
    fontSize: SIZES.FONT.LARGE,
    color: COLORS.TEXT.SECONDARY,
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
  logoutIcon: {
    fontSize: SIZES.FONT.MEDIUM,
    marginRight: SIZES.PADDING.SMALL,
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
