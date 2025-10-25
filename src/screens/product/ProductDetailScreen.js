import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES, IMAGES } from '../../constants';
import CustomAlert from '../../components/common/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import motorbikeService from '../../services/motorbikeService';

const ProductDetailScreen = ({ navigation, route }) => {
  const { product } = route.params;
  const { alertConfig, hideAlert, showConfirm, showInfo } = useCustomAlert();
  
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [configurations, setConfigurations] = useState({
    appearance: null,
    battery: null,
    configuration: null,
    safeFeature: null,
  });
  const [loadingConfigs, setLoadingConfigs] = useState(false);

  // Load configurations when component mounts
  useEffect(() => {
    loadConfigurations();
  }, []);

  const loadConfigurations = async () => {
    if (!product.id) return;
    
    setLoadingConfigs(true);
    try {
      const [batteryResult, configResult, safeFeatureResult, appearanceResult] = await Promise.all([
        motorbikeService.getBattery(product.id),
        motorbikeService.getConfiguration(product.id),
        motorbikeService.getSafeFeature(product.id),
        motorbikeService.getAppearance(product.id),
      ]);

      console.log('API Results:', {
        battery: batteryResult,
        config: configResult,
        safeFeature: safeFeatureResult,
        appearance: appearanceResult
      });

      setConfigurations({
        appearance: appearanceResult.success ? appearanceResult.data : null,
        battery: batteryResult.success ? batteryResult.data : null,
        configuration: configResult.success ? configResult.data : null,
        safeFeature: safeFeatureResult.success ? safeFeatureResult.data : null,
      });
    } catch (error) {
      console.error('Error loading configurations:', error);
    } finally {
      setLoadingConfigs(false);
    }
  };

  const handleEdit = () => {
    navigation.navigate('EditProduct', { product });
  };

  const handleDelete = () => {
    showConfirm(
      'Delete Product',
      `Are you sure you want to delete "${product.name}"? This action cannot be undone.`,
      () => deleteProduct()
    );
  };

  const deleteProduct = async () => {
    try {
      setLoading(true);
      const response = await motorbikeService.deleteMotorbike(product.id);
      
      if (response.success) {
        showInfo('Success', 'Motorbike deleted successfully');
        
        // Navigate back after a short delay
        setTimeout(() => {
          navigation.goBack();
        }, 1500);
      } else {
        showInfo('Error', response.message || 'Failed to delete motorbike');
      }
      
    } catch (error) {
      console.error('Error deleting motorbike:', error);
      showInfo('Error', 'Failed to delete motorbike. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this amazing ${product.name}! ${product.description}`,
        title: product.name,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return COLORS.SUCCESS;
      case 'low_stock': return COLORS.WARNING;
      case 'out_of_stock': return COLORS.ERROR;
      default: return COLORS.TEXT.SECONDARY;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'available': return 'Available';
      case 'low_stock': return 'Low Stock';
      case 'out_of_stock': return 'Out of Stock';
      default: return 'Unknown';
    }
  };

  const getSafeBgColor = (colorName) => {
    if (!colorName) return '#CCCCCC';
    const c = String(colorName).toLowerCase();
    // React Native supports many named colors; fallback to gray if invalid
    const supported = [
      'black','white','red','blue','green','yellow','pink','silver','gray','orange','purple','brown','gold','navy','maroon','teal','lime','cyan'
    ];
    return supported.includes(c) ? c : '#CCCCCC';
  };

  const renderSpecTile = (icon, label, value) => (
    <View style={styles.specTile}>
      <View style={styles.specIconContainer}>
        <Text style={styles.specIcon}>{icon}</Text>
      </View>
      <View style={styles.specContent}>
        <Text style={styles.specLabel}>{label}</Text>
        <Text style={styles.specValue}>{value}</Text>
      </View>
    </View>
  );

  const renderSpecificationItem = (label, value, icon) => (
    <View style={styles.specItem}>
      <View style={styles.specIconContainer}>
        <Text style={styles.specIcon}>{icon}</Text>
      </View>
      <View style={styles.specContent}>
        <Text style={styles.specLabel}>{label}</Text>
        <Text style={styles.specValue}>{value}</Text>
      </View>
    </View>
  );

  // Configuration render functions
  const renderAppearanceTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>Appearance</Text>
      <Text style={styles.tabSubtitle}>Physical dimensions and specifications</Text>
      
      {configurations.appearance ? (
        <View style={styles.configContainer}>
          {Object.entries(configurations.appearance).map(([key, value]) => {
            if (key === 'electricMotorbikeId' || key === 'id') return null; // Skip internal IDs
            const displayLabel = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            const displayValue = key.includes('Distance') || key.includes('Limit') ? `${value} mm` : 
                                key.includes('Weight') ? `${value} kg` : 
                                key.includes('Storage') ? `${value} L` : 
                                `${value}`;
            return (
              <View key={key} style={styles.configItem}>
                <Text style={styles.configLabel}>{displayLabel}</Text>
                <Text style={styles.configValue}>{displayValue}</Text>
              </View>
            );
          })}
        </View>
      ) : (
        <Text style={styles.noDataText}>No appearance data available</Text>
      )}
    </View>
  );

  const renderBatteryTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>Battery</Text>
      <Text style={styles.tabSubtitle}>Battery specifications and performance</Text>
      
      {configurations.battery ? (
        <View style={styles.configContainer}>
          {Object.entries(configurations.battery).map(([key, value]) => {
            if (key === 'electricMotorbikeId' || key === 'id') return null; // Skip internal IDs
            const displayLabel = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            const displayValue = key.includes('Capacity') ? `${value}` : 
                                key.includes('Time') ? `${value}` : 
                                key.includes('Consumption') ? `${value}` : 
                                key.includes('Limit') ? `${value}` : 
                                `${value}`;
            return (
              <View key={key} style={styles.configItem}>
                <Text style={styles.configLabel}>{displayLabel}</Text>
                <Text style={styles.configValue}>{displayValue}</Text>
              </View>
            );
          })}
        </View>
      ) : (
        <Text style={styles.noDataText}>No battery data available</Text>
      )}
    </View>
  );

  const renderConfigurationTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>Configuration</Text>
      <Text style={styles.tabSubtitle}>Technical configuration and settings</Text>
      
      {configurations.configuration ? (
        <View style={styles.configContainer}>
          {Object.entries(configurations.configuration).map(([key, value]) => {
            if (key === 'electricMotorbikeId' || key === 'id') return null; // Skip internal IDs
            const displayLabel = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            const displayValue = key.includes('Speed') ? `${value}` : 
                                key.includes('Capacity') ? `${value} people` : 
                                `${value}`;
            return (
              <View key={key} style={styles.configItem}>
                <Text style={styles.configLabel}>{displayLabel}</Text>
                <Text style={styles.configValue}>{displayValue}</Text>
              </View>
            );
          })}
        </View>
      ) : (
        <Text style={styles.noDataText}>No configuration data available</Text>
      )}
    </View>
  );

  const renderSafeFeatureTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>Safe Features</Text>
      <Text style={styles.tabSubtitle}>Safety features and security systems</Text>
      
      {configurations.safeFeature ? (
        <View style={styles.configContainer}>
          {Object.entries(configurations.safeFeature).map(([key, value]) => {
            if (key === 'electricMotorbikeId' || key === 'id') return null; // Skip internal IDs
            const displayLabel = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            return (
              <View key={key} style={styles.configItem}>
                <Text style={styles.configLabel}>{displayLabel}</Text>
                <Text style={styles.configValue}>{String(value)}</Text>
              </View>
            );
          })}
        </View>
      ) : (
        <Text style={styles.noDataText}>No safety feature data available</Text>
      )}
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'appearance':
        return renderAppearanceTab();
      case 'battery':
        return renderBatteryTab();
      case 'configuration':
        return renderConfigurationTab();
      case 'safeFeature':
        return renderSafeFeatureTab();
      default:
        return renderOverviewTab();
    }
  };

  const renderOverviewTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>Overview</Text>
      <Text style={styles.tabSubtitle}>Basic information and specifications</Text>
      
      <View style={styles.specsContainer}>
        {renderSpecificationItem('Model', product.model || product.category, '🚗')}
        {renderSpecificationItem('Version', product.version, '⚡')}
        {renderSpecificationItem('Make From', product.makeFrom, '🌍')}
        {renderSpecificationItem('Price', `$${product.price?.toLocaleString()}`, '💰')}
        {renderSpecificationItem('Status', product.isDeleted ? 'Out of Stock' : 'Available', product.isDeleted ? '❌' : '✅')}
      </View>

      {/* Quick summary of configurations */}
      <View style={styles.quickSummaryContainer}>
        <Text style={styles.quickSummaryTitle}>Quick Summary</Text>
        <View style={styles.quickSummaryGrid}>
          {configurations.appearance && (
            <View style={styles.quickSummaryItem}>
              <Text style={styles.quickSummaryLabel}>Dimensions</Text>
              <Text style={styles.quickSummaryValue}>
                {configurations.appearance.length && configurations.appearance.width && configurations.appearance.height 
                  ? `${configurations.appearance.length}×${configurations.appearance.width}×${configurations.appearance.height}mm`
                  : 'N/A'
                }
              </Text>
            </View>
          )}
          {configurations.battery && (
            <View style={styles.quickSummaryItem}>
              <Text style={styles.quickSummaryLabel}>Battery</Text>
              <Text style={styles.quickSummaryValue}>
                {configurations.battery.capacity || 'N/A'}
              </Text>
            </View>
          )}
          {configurations.configuration && (
            <View style={styles.quickSummaryItem}>
              <Text style={styles.quickSummaryLabel}>Motor</Text>
              <Text style={styles.quickSummaryValue}>
                {configurations.configuration.motorType || 'N/A'}
              </Text>
            </View>
          )}
          {configurations.safeFeature && (
            <View style={styles.quickSummaryItem}>
              <Text style={styles.quickSummaryLabel}>Brake</Text>
              <Text style={styles.quickSummaryValue}>
                {configurations.safeFeature.brake || 'N/A'}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={styles.headerTitleText}>Product Details</Text>
          </View>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShare}
          >
            <Text style={styles.shareIcon}>📤</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Product Image */}
        <View style={styles.imageContainer}>
          <Image source={product.image} style={styles.productImage} resizeMode="cover" />
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(product.status) }]}>
            <Text style={styles.statusText}>{getStatusText(product.status)}</Text>
          </View>
        </View>

        {/* Product Info */}
        <View style={styles.infoSection}>
          <View style={styles.titleRow}>
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.productPrice}>${product.price.toLocaleString()}</Text>
          </View>
          
          <View style={styles.categoryRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{product.category}</Text>
            </View>
            <Text style={styles.stockText}>Stock: {product.stock} units</Text>
          </View>

          <Text style={styles.description}>{product.description}</Text>
        </View>

        {/* Colors (from product.colors) */}
        {Array.isArray(product?.colors) && product.colors.length > 0 && (
          <View style={styles.colorsSection}>
            <Text style={styles.sectionTitle}>Available Colors</Text>
            <View style={styles.colorsRow}>
              {product.colors.map((c) => (
                <View key={c} style={styles.colorChip}>
                  <View style={[styles.colorDot, { backgroundColor: getSafeBgColor(c) }]} />
                  <Text style={styles.colorChipText}>{c}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Configuration Tabs */}
        <View style={styles.tabsSection}>
          <Text style={styles.sectionTitle}>Configuration Details</Text>
          
          {/* Tab Navigation */}
          <View style={styles.tabNavigation}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'overview' && styles.activeTabButton]}
              onPress={() => setActiveTab('overview')}
            >
              <Text style={[styles.tabButtonText, activeTab === 'overview' && styles.activeTabButtonText]}>
                Overview
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'appearance' && styles.activeTabButton]}
              onPress={() => setActiveTab('appearance')}
            >
              <Text style={[styles.tabButtonText, activeTab === 'appearance' && styles.activeTabButtonText]}>
                Appearance
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'battery' && styles.activeTabButton]}
              onPress={() => setActiveTab('battery')}
            >
              <Text style={[styles.tabButtonText, activeTab === 'battery' && styles.activeTabButtonText]}>
                Battery
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'configuration' && styles.activeTabButton]}
              onPress={() => setActiveTab('configuration')}
            >
              <Text style={[styles.tabButtonText, activeTab === 'configuration' && styles.activeTabButtonText]}>
                Config
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'safeFeature' && styles.activeTabButton]}
              onPress={() => setActiveTab('safeFeature')}
            >
              <Text style={[styles.tabButtonText, activeTab === 'safeFeature' && styles.activeTabButtonText]}>
                Safety
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          {loadingConfigs ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading configurations...</Text>
            </View>
          ) : (
            renderTabContent()
          )}
        </View>

        {/* Additional Info */}
        <View style={styles.additionalInfoSection}>
          <Text style={styles.sectionTitle}>Additional Information</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Product ID</Text>
              <Text style={styles.infoValue}>{product.id}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Created</Text>
              <Text style={styles.infoValue}>{new Date(product.createdAt).toLocaleDateString()}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Status</Text>
              <Text style={[styles.infoValue, { color: getStatusColor(product.status) }]}>
                {getStatusText(product.status)}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Category</Text>
              <Text style={styles.infoValue}>{product.category}</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEdit}
          >
            <LinearGradient
              colors={COLORS.GRADIENT.BLUE}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.editButtonText}>✏️ Edit Product</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.deleteButton, loading && styles.deleteButtonDisabled]}
            onPress={handleDelete}
            disabled={loading}
          >
            <Text style={styles.deleteButtonText}>
              {loading ? 'Deleting...' : '🗑️ Delete Product'}
            </Text>
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
  
  // Header styles
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
  backIcon: {
    fontSize: SIZES.FONT.LARGE,
    color: COLORS.TEXT.WHITE,
    fontWeight: 'bold',
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitleText: {
    fontSize: SIZES.FONT.HEADER,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: SIZES.RADIUS.ROUND,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareIcon: {
    fontSize: SIZES.FONT.MEDIUM,
  },

  // Content
  content: {
    flex: 1,
    backgroundColor: COLORS.SURFACE,
    borderTopLeftRadius: SIZES.RADIUS.XXLARGE,
    borderTopRightRadius: SIZES.RADIUS.XXLARGE,
  },
  scrollContent: {
    paddingBottom: SIZES.PADDING.XXXLARGE,
  },

  // Product image
  imageContainer: {
    position: 'relative',
    height: 250,
    marginBottom: SIZES.PADDING.LARGE,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  statusBadge: {
    position: 'absolute',
    top: SIZES.PADDING.MEDIUM,
    right: SIZES.PADDING.MEDIUM,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    borderRadius: SIZES.RADIUS.MEDIUM,
  },
  statusText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.WHITE,
    fontWeight: 'bold',
  },

  // Product info
  infoSection: {
    paddingHorizontal: SIZES.PADDING.LARGE,
    marginBottom: SIZES.PADDING.XLARGE,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  productName: {
    fontSize: SIZES.FONT.XXLARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    flex: 1,
    marginRight: SIZES.PADDING.MEDIUM,
  },
  productPrice: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.SECONDARY,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  categoryBadge: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    borderRadius: SIZES.RADIUS.MEDIUM,
  },
  categoryText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
  },
  stockText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    fontWeight: '500',
  },
  description: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
    lineHeight: 22,
  },

  // Specifications
  specsSection: {
    paddingHorizontal: SIZES.PADDING.LARGE,
    marginBottom: SIZES.PADDING.XLARGE,
  },
  colorsSection: {
    paddingHorizontal: SIZES.PADDING.LARGE,
    marginBottom: SIZES.PADDING.XLARGE,
  },
  sectionTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SIZES.PADDING.LARGE,
  },
  colorsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ECECEC',
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  colorChipText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '600',
  },
  specsContainer: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.LARGE,
    padding: SIZES.PADDING.MEDIUM,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  specTile: {
    width: '50%',
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.PADDING.MEDIUM,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  specIconContainer: {
    width: 40,
    height: 40,
    borderRadius: SIZES.RADIUS.MEDIUM,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.PADDING.MEDIUM,
  },
  specIcon: {
    fontSize: SIZES.FONT.MEDIUM,
  },
  specContent: {
    flex: 1,
  },
  specLabel: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: 2,
  },
  specValue: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
  },

  // Additional info
  additionalInfoSection: {
    paddingHorizontal: SIZES.PADDING.LARGE,
    marginBottom: SIZES.PADDING.XLARGE,
  },
  infoGrid: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.LARGE,
    padding: SIZES.PADDING.MEDIUM,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SIZES.PADDING.SMALL,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoLabel: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '600',
  },

  // Action buttons
  actionSection: {
    paddingHorizontal: SIZES.PADDING.LARGE,
    gap: SIZES.PADDING.MEDIUM,
  },
  editButton: {
    borderRadius: SIZES.RADIUS.LARGE,
    overflow: 'hidden',
  },
  buttonGradient: {
    paddingVertical: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
  deleteButton: {
    backgroundColor: COLORS.ERROR,
    borderRadius: SIZES.RADIUS.LARGE,
    paddingVertical: SIZES.PADDING.MEDIUM,
    alignItems: 'center',
  },
  deleteButtonDisabled: {
    opacity: 0.6,
  },
  deleteButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },

  // Tab styles
  tabsSection: {
    paddingHorizontal: SIZES.PADDING.LARGE,
    paddingVertical: SIZES.PADDING.LARGE,
  },
  tabNavigation: {
    flexDirection: 'row',
    backgroundColor: COLORS.BACKGROUND.SECONDARY,
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.XSMALL,
    marginBottom: SIZES.PADDING.LARGE,
  },
  tabButton: {
    flex: 1,
    paddingVertical: SIZES.PADDING.SMALL,
    paddingHorizontal: SIZES.PADDING.XSMALL,
    borderRadius: SIZES.RADIUS.SMALL,
    alignItems: 'center',
  },
  activeTabButton: {
    backgroundColor: COLORS.PRIMARY,
  },
  tabButtonText: {
    fontSize: SIZES.FONT.SMALL,
    fontWeight: '600',
    color: COLORS.TEXT.SECONDARY,
  },
  activeTabButtonText: {
    color: COLORS.TEXT.WHITE,
  },
  tabContent: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.LARGE,
    padding: SIZES.PADDING.LARGE,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SIZES.PADDING.SMALL,
  },
  tabSubtitle: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: SIZES.PADDING.LARGE,
  },
  loadingContainer: {
    padding: SIZES.PADDING.XXXLARGE,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
  },
  noDataText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
    textAlign: 'center',
    fontStyle: 'italic',
    padding: SIZES.PADDING.LARGE,
  },
  configContainer: {
    gap: SIZES.PADDING.MEDIUM,
  },
  configItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SIZES.PADDING.SMALL,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER.PRIMARY,
  },
  configLabel: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
    flex: 1,
  },
  configValue: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
    flex: 1,
    textAlign: 'right',
  },
  colorsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.PADDING.MEDIUM,
  },
  colorItem: {
    alignItems: 'center',
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  colorSwatch: {
    width: 40,
    height: 40,
    borderRadius: SIZES.RADIUS.ROUND,
    marginBottom: SIZES.PADDING.SMALL,
    borderWidth: 2,
    borderColor: COLORS.BORDER.PRIMARY,
  },
  colorName: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.PRIMARY,
    textAlign: 'center',
  },
  specsContainer: {
    gap: SIZES.PADDING.SMALL,
  },
  quickSummaryContainer: {
    marginTop: SIZES.PADDING.LARGE,
    paddingTop: SIZES.PADDING.LARGE,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER.PRIMARY,
  },
  quickSummaryTitle: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  quickSummaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.PADDING.MEDIUM,
  },
  quickSummaryItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F8F9FA',
    padding: SIZES.PADDING.MEDIUM,
    borderRadius: SIZES.RADIUS.MEDIUM,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  quickSummaryLabel: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: SIZES.PADDING.XSMALL,
    fontWeight: '500',
  },
  quickSummaryValue: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '600',
  },
});

export default ProductDetailScreen;
