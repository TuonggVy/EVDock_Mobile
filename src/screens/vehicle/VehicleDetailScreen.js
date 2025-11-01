import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { COLORS, SIZES, USER_ROLES } from '../../constants';
import { formatPrice, getStockStatus, vehicleService } from '../../services/vehicleService';
import { getVehicleImageByColor } from '../../services/vehicleImageService';
import { useAuth } from '../../contexts/AuthContext';
import motorbikeService from '../../services/motorbikeService';
import agencyStockService from '../../services/agencyStockService';
import { Ruler, Settings, Battery, Shield, Sparkles, ArrowLeft } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

const VehicleDetailScreen = ({ route, navigation }) => {
  const { vehicle } = route.params;
  const { user } = useAuth();
  const [selectedColor, setSelectedColor] = useState(vehicle.colors?.[0] || '');
  const [currentVehicleImage, setCurrentVehicleImage] = useState(vehicle.image);
  const [isChangingColor, setIsChangingColor] = useState(false);
  const [colorStockMap, setColorStockMap] = useState(null);
  const [loadingColorStocks, setLoadingColorStocks] = useState(false);
  const [motorbikeDetails, setMotorbikeDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [configurations, setConfigurations] = useState({
    appearance: null,
    configuration: null,
    battery: null,
    safeFeature: null,
  });

  const stockStatus = getStockStatus(vehicle);

  // Load motorbike details and Colors
  React.useEffect(() => {
    let isMounted = true;
    const loadMotorbikeDetails = async () => {
      try {
        setLoadingDetails(true);
        
        // Fetch motorbike details by ID
        const response = await motorbikeService.getMotorbikeById(vehicle.id);
        
        if (!isMounted) return;
        
        if (response.success) {
          const data = response.data?.data || response.data;
          setMotorbikeDetails(data);
          
          // Extract configurations from motorbike details
          setConfigurations({
            appearance: data.appearance || null,
            configuration: data.configuration || null,
            battery: data.battery || null,
            safeFeature: data.safeFeature || null,
          });
          
          // If motorbike has colors data, update selectedColor and image
          if (data.colors && Array.isArray(data.colors) && data.colors.length > 0) {
            // Extract color info from colors array
            const firstColor = data.colors[0];
            const colorType = firstColor.color?.colorType || firstColor.colorType;
            
            if (colorType && colorType !== selectedColor) {
              setSelectedColor(colorType);
            }
            
            // Update image if available
            if (firstColor.imageUrl) {
              setCurrentVehicleImage(firstColor.imageUrl);
            } else if (data.images && data.images.length > 0) {
              setCurrentVehicleImage(data.images[0].imageUrl);
            }
          }
        }
      } catch (e) {
        console.error('Error loading motorbike details:', e);
      } finally {
        if (isMounted) setLoadingDetails(false);
      }
    };
    
    loadMotorbikeDetails();
    return () => { isMounted = false; };
  }, [vehicle?.id]);

  const isSelectedColorOut = React.useMemo(() => {
    if (!colorStockMap || !selectedColor) return false;
    const val = colorStockMap[selectedColor];
    return typeof val === 'number' && val <= 0;
  }, [colorStockMap, selectedColor]);

  // Load per-color stocks based on user role
  React.useEffect(() => {
    let isMounted = true;
    const loadColorStocks = async () => {
      try {
        setLoadingColorStocks(true);
        
        // Check if user is Dealer Staff
        if (user?.role === USER_ROLES.DEALER_STAFF && user?.agencyId) {
          // For Dealer Staff, load colors from motorbike details and fetch agency stocks
          if (!motorbikeDetails?.colors || !Array.isArray(motorbikeDetails.colors)) {
            if (isMounted) setLoadingColorStocks(false);
            return;
          }
          
          const agencyId = parseInt(user.agencyId);
          const responses = await Promise.all(
            motorbikeDetails.colors.map(async (colorItem) => {
              const colorId = colorItem.color?.id || colorItem.id;
              const stocksResponse = await agencyStockService.getAgencyStocks(agencyId, {
                motorbikeId: vehicle.id,
                colorId: colorId,
                limit: 1000
              });
              
              const totalQuantity = stocksResponse.success 
                ? stocksResponse.data.reduce((sum, stock) => sum + (stock.quantity || 0), 0)
                : 0;
              
              const colorName = colorItem.color?.colorType || colorItem.colorType;
              return { colorName, quantity: totalQuantity };
            })
          );
          
          if (!isMounted) return;
          
          const map = {};
          responses.forEach(res => {
            map[res.colorName] = res.quantity;
          });
          setColorStockMap(map);
        } else {
          // For other roles, use vehicleService
          if (Array.isArray(vehicle.colors) && vehicle.colors.length > 0) {
            const responses = await Promise.all(
              vehicle.colors.map((c) => vehicleService.getVehicleColorStock(vehicle.id, c))
            );
            if (!isMounted) return;
            const map = {};
            responses.forEach((res, idx) => {
              const colorName = vehicle.colors[idx];
              map[colorName] = res?.success ? (res.data?.stock ?? 0) : 0;
            });
            setColorStockMap(map);
          } else {
            const res = await vehicleService.getVehicleColorStock(vehicle.id, null);
            if (!isMounted) return;
            setColorStockMap({ All: res?.success ? (res.data?.stock ?? 0) : 0 });
          }
        }
      } catch (e) {
        console.error('Error loading color stocks:', e);
        if (isMounted) {
          setColorStockMap(null);
        }
      } finally {
        if (isMounted) setLoadingColorStocks(false);
      }
    };
    
    // Only load color stocks if motorbikeDetails is loaded for Dealer Staff
    if (user?.role === USER_ROLES.DEALER_STAFF && !motorbikeDetails) {
      setLoadingColorStocks(false);
    } else {
      loadColorStocks();
    }
    
    return () => { isMounted = false; };
  }, [vehicle?.id, user?.role, user?.agencyId, motorbikeDetails]);

  // Function to handle color selection and image change
  const handleColorChange = async (color) => {
    if (color === selectedColor) return; // Don't change if same color
    
    setSelectedColor(color);
    setIsChangingColor(true);
    
    try {
      // Try to get image from motorbike details first
      if (motorbikeDetails?.colors) {
        const colorItem = motorbikeDetails.colors.find(
          c => (c.color?.colorType || c.colorType) === color
        );
        
        if (colorItem?.imageUrl) {
          setCurrentVehicleImage(colorItem.imageUrl);
          setIsChangingColor(false);
          return;
        }
      }
      
      // Fallback to vehicle image service
      const imageResponse = await getVehicleImageByColor(vehicle.id, color);
      
      if (imageResponse.success) {
        setCurrentVehicleImage(imageResponse.data.image);
      } else {
        console.warn('Failed to fetch color-specific image:', imageResponse.error);
        // Keep current image on error
      }
    } catch (error) {
      console.error('Error fetching vehicle image for color:', error);
      // Keep current image on error
    } finally {
      setIsChangingColor(false);
    }
  };

  const renderColorOption = (color, isSelected = false) => (
    <TouchableOpacity
      key={color}
      style={[
        styles.colorOption,
        { backgroundColor: color.toLowerCase() },
        isSelected && styles.colorOptionSelected,
      ]}
      activeOpacity={0.8}
      onPress={() => handleColorChange(color)}
    >
      {isSelected && <Text style={styles.colorCheckmark}>✓</Text>}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            // Always go back normally to preserve navigation stack
            navigation.goBack();
          }}
        >
          <Text style={styles.backIcon}><ArrowLeft color="#FFFFFF" size={18} /></Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vehicle Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Vehicle Image */}
        <View style={styles.imageContainer}>
          <Image
            source={typeof currentVehicleImage === 'string' ? { uri: currentVehicleImage } : currentVehicleImage}
            style={styles.vehicleImage}
            resizeMode="contain"
          />
          {isChangingColor && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={COLORS.PRIMARY} />
              <Text style={styles.loadingText}>Changing color...</Text>
            </View>
          )}
          {(!vehicle.inStock || isSelectedColorOut) && (
            <View style={styles.outOfStockOverlay}>
              <Text style={styles.outOfStockText}>Out of Stock</Text>
            </View>
          )}
        </View>

        {/* Colors */}
        <View style={styles.colorsContainer}>
          <Text style={styles.colorsTitle}>Available Colors</Text>
            <View style={styles.colorsGrid}>
              {(motorbikeDetails?.colors || vehicle.colors || []).map((colorItem, index) => {
                const colorName = typeof colorItem === 'string' 
                  ? colorItem 
                  : (colorItem.color?.colorType || colorItem.colorType);
                return renderColorOption(colorName, colorName === selectedColor);
              })}
            </View>
        </View>

        {/* Vehicle Info */}
        <View style={styles.infoContainer}>
          <View style={styles.titleRow}>
            <View style={styles.titleContent}>
              <Text style={styles.vehicleName}>{vehicle.name}</Text>
              <Text style={styles.vehicleModel}>{vehicle.model} - {vehicle.version}</Text>
            </View>
            <View style={styles.stockBadge}>
              <View style={[styles.stockDot, { backgroundColor: stockStatus.color }]} />
              <Text style={styles.stockText}>{stockStatus.text}</Text>
            </View>
          </View>

          <Text style={styles.description}>{vehicle.description}</Text>

          {/* Stock by Color (detail view only) */}
          {((motorbikeDetails?.colors || vehicle.colors) && Array.isArray(motorbikeDetails?.colors || vehicle.colors) && (motorbikeDetails?.colors || vehicle.colors).length > 0) && (
            <View style={styles.colorStocksContainer}>
              <Text style={styles.sectionTitle}>Stock by Color</Text>
              {loadingColorStocks ? (
                <View style={styles.colorStocksRow}> 
                  <ActivityIndicator size="small" color={COLORS.PRIMARY} />
                  <Text style={styles.colorStocksLoading}> Loading...</Text>
                </View>
              ) : (
                <View style={styles.colorStocksGrid}>
                  {(motorbikeDetails?.colors || vehicle.colors).map((c) => {
                    const colorName = typeof c === 'string' 
                      ? c 
                      : (c.color?.colorType || c.colorType);
                    return (
                      <View key={`${vehicle.id}-${colorName}`} style={styles.colorStockChip}>
                        <Text style={styles.colorStockChipText}>{colorName}</Text>
                        <Text style={styles.colorStockChipCount}>{colorStockMap?.[colorName] ?? 0}</Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          )}

          {/* Price */}
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Price</Text>
            <Text style={styles.priceValue}>
              {formatPrice(vehicle.price, vehicle.currency)}
            </Text>
          </View>

          {/* Specifications */}
          {(configurations.appearance || configurations.configuration || configurations.battery || configurations.safeFeature) && (
            <View style={styles.specsContainer}>
              <Text style={styles.sectionTitle}>Specifications</Text>
              
              {/* Appearance */}
              {configurations.appearance && (
                <View style={styles.specCategory}>
                  <View style={styles.specCategoryHeader}>
                    <Ruler size={18} color={COLORS.TEXT.WHITE} />
                    <Text style={styles.specCategoryTitle}>Appearance</Text>
                  </View>
                  <View style={styles.specsGrid}>
                    {Object.entries(configurations.appearance).map(([key, value]) => {
                      if (key === 'electricMotorbikeId' || key === 'id') return null;
                      const displayLabel = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                      const displayValue = key.includes('Distance') || key.includes('Limit') ? `${value} mm` : 
                                          key.includes('Weight') ? `${value} kg` : 
                                          key.includes('Storage') ? `${value} L` : 
                                          `${value}`;
                      return (
                        <View key={key} style={styles.specItem}>
                          <View style={styles.specContent}>
                            <Text style={styles.specTitle}>{displayLabel}</Text>
                            <Text style={styles.specValue}>{displayValue}</Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Configuration */}
              {configurations.configuration && (
                <View style={styles.specCategory}>
                  <View style={styles.specCategoryHeader}>
                    <Settings size={18} color={COLORS.TEXT.WHITE} />
                    <Text style={styles.specCategoryTitle}>Configuration</Text>
                  </View>
                  <View style={styles.specsGrid}>
                    {Object.entries(configurations.configuration).map(([key, value]) => {
                      if (key === 'electricMotorbikeId' || key === 'id') return null;
                      const displayLabel = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                      const displayValue = key.includes('Speed') ? `${value}` : 
                                          key.includes('Capacity') ? `${value} people` : 
                                          `${value}`;
                      return (
                        <View key={key} style={styles.specItem}>
                          <View style={styles.specContent}>
                            <Text style={styles.specTitle}>{displayLabel}</Text>
                            <Text style={styles.specValue}>{displayValue}</Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Battery */}
              {configurations.battery && (
                <View style={styles.specCategory}>
                  <View style={styles.specCategoryHeader}>
                    <Battery size={18} color={COLORS.TEXT.WHITE} />
                    <Text style={styles.specCategoryTitle}>Battery</Text>
                  </View>
                  <View style={styles.specsGrid}>
                    {Object.entries(configurations.battery).map(([key, value]) => {
                      if (key === 'electricMotorbikeId' || key === 'id') return null;
                      const displayLabel = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                      return (
                        <View key={key} style={styles.specItem}>
                          <View style={styles.specContent}>
                            <Text style={styles.specTitle}>{displayLabel}</Text>
                            <Text style={styles.specValue}>{value}</Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Safe Feature */}
              {configurations.safeFeature && (
                <View style={styles.specCategory}>
                  <View style={styles.specCategoryHeader}>
                    <Shield size={18} color={COLORS.TEXT.WHITE} />
                    <Text style={styles.specCategoryTitle}>Safe Features</Text>
                  </View>
                  <View style={styles.specsGrid}>
                    {Object.entries(configurations.safeFeature).map(([key, value]) => {
                      if (key === 'electricMotorbikeId' || key === 'id') return null;
                      const displayLabel = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                      return (
                        <View key={key} style={styles.specItem}>
                          <View style={styles.specContent}>
                            <Text style={styles.specTitle}>{displayLabel}</Text>
                            <Text style={styles.specValue}>{String(value)}</Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[
            user?.role === USER_ROLES.DEALER_MANAGER ? styles.singleActionButton : styles.actionButton,
            styles.secondaryButton,
            !vehicle.inStock && styles.disabledButton
          ]}
          disabled={!vehicle.inStock}
          onPress={() => navigation.navigate('Compare', { selectedVehicle: vehicle })}
        >
          <Text style={[
            styles.actionButtonText,
            styles.secondaryButtonText,
            !vehicle.inStock && styles.disabledButtonText
          ]}>
            Compare
          </Text>
        </TouchableOpacity>
        
        {/* Only show Create Quotation button for non-Manager roles */}
        {user?.role !== USER_ROLES.DEALER_MANAGER && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.primaryButton,
              !vehicle.inStock && styles.disabledButton
            ]}
            disabled={!vehicle.inStock}
            onPress={() => navigation.navigate('CreateQuotation', { vehicle })}
          >
            <Text style={[
              styles.actionButtonText,
              styles.primaryButtonText,
              !vehicle.inStock && styles.disabledButtonText
            ]}>
              {vehicle.inStock ? 'Create Quotation' : 'Out of Stock'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
    paddingTop: 30,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingTop: Platform.OS === 'ios' ? 20 : 0,
    paddingBottom: SIZES.PADDING.MEDIUM,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: SIZES.RADIUS.ROUND,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: SIZES.FONT.LARGE,
    color: COLORS.TEXT.WHITE,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },

  // Scroll View
  scrollView: {
    flex: 1,
  },

  // Image
  imageContainer: {
    height: height * 0.35,
    backgroundColor: '#F8F9FA',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleImage: {
    width: width * 0.8,
    height: '100%',
  },
  outOfStockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outOfStockText: {
    color: COLORS.TEXT.WHITE,
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: COLORS.TEXT.WHITE,
    fontSize: SIZES.FONT.MEDIUM,
    marginTop: SIZES.PADDING.SMALL,
    fontWeight: '600',
  },

  // Info Container
  infoContainer: {
    padding: SIZES.PADDING.MEDIUM,
  },

  // Title Row
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SIZES.PADDING.SMALL,
  },
  titleContent: {
    flex: 1,
  },
  vehicleName: {
    fontSize: SIZES.FONT.XLARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: 4,
  },
  vehicleModel: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: SIZES.PADDING.SMALL,
    paddingVertical: 4,
    borderRadius: SIZES.RADIUS.SMALL,
  },
  stockDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  stockText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
  },

  // Description
  description: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
    lineHeight: 22,
    marginBottom: SIZES.PADDING.MEDIUM,
  },

  // Price
  priceContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: SIZES.PADDING.MEDIUM,
    borderRadius: SIZES.RADIUS.MEDIUM,
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  priceLabel: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: 4,
  },
  priceValue: {
    fontSize: SIZES.FONT.XXLARGE,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
  },

  // Sections
  sectionTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
    marginBottom: SIZES.PADDING.MEDIUM,
  },

  // Specifications
  specsContainer: {
    marginBottom: SIZES.PADDING.LARGE,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.PADDING.MEDIUM,
  },
  specCategory: {
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  specCategoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.PADDING.SMALL,
  },
  specCategoryTitle: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: '600',
    color: COLORS.TEXT.WHITE,
    marginLeft: SIZES.PADDING.SMALL,
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  specItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: SIZES.PADDING.MEDIUM,
    borderRadius: SIZES.RADIUS.MEDIUM,
    marginBottom: SIZES.PADDING.SMALL,
  },
  specContent: {
    flex: 1,
  },
  specTitle: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: 2,
  },
  specValue: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: '600',
    color: COLORS.TEXT.WHITE,
  },

  // Colors
  colorsContainer: {
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  colorsTitle: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: '600',
    color: COLORS.TEXT.WHITE,
    textAlign: 'center',
    marginBottom: SIZES.PADDING.SMALL,
  },
  colorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  colorOption: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    marginRight: SIZES.PADDING.SMALL,
    marginBottom: SIZES.PADDING.SMALL,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: COLORS.PRIMARY,
  },
  colorCheckmark: {
    color: COLORS.TEXT.WHITE,
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
  },

  // Features
  featuresContainer: {
    marginBottom: SIZES.PADDING.LARGE,
  },
  featuresList: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SIZES.PADDING.SMALL,
  },
  featureBullet: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.PRIMARY,
    marginRight: SIZES.PADDING.SMALL,
    marginTop: 2,
  },
  featureText: {
    flex: 1,
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.WHITE,
    lineHeight: 20,
  },

  // Color stock detail section
  colorStocksContainer: {
    marginBottom: SIZES.PADDING.LARGE,
  },
  colorStocksRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorStocksLoading: {
    marginLeft: 8,
    color: COLORS.TEXT.SECONDARY,
    fontSize: SIZES.FONT.SMALL,
  },
  colorStocksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorStockChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: COLORS.BORDER.PRIMARY,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 8,
  },
  colorStockChipText: {
    color: COLORS.TEXT.WHITE,
    fontSize: SIZES.FONT.XSMALL,
    marginRight: 6,
  },
  colorStockChipCount: {
    color: COLORS.TEXT.WHITE,
    fontSize: SIZES.FONT.XSMALL,
    fontWeight: '700',
  },

  // Bottom Spacing
  bottomSpacing: {
    height: 100, // Space for action buttons
  },

  // Action Buttons
  actionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: SIZES.PADDING.MEDIUM,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  actionButton: {
    flex: 1,
    paddingVertical: SIZES.PADDING.MEDIUM,
    borderRadius: SIZES.RADIUS.MEDIUM,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  singleActionButton: {
    flex: 1,
    paddingVertical: SIZES.PADDING.MEDIUM,
    borderRadius: SIZES.RADIUS.MEDIUM,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 0,
  },
  primaryButton: {
    backgroundColor: COLORS.PRIMARY,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.PRIMARY,
  },
  disabledButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: 'rgba(255,255,255,0.1)',
  },
  actionButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
  },
  primaryButtonText: {
    color: COLORS.TEXT.WHITE,
  },
  secondaryButtonText: {
    color: COLORS.PRIMARY,
  },
  disabledButtonText: {
    color: COLORS.TEXT.SECONDARY,
  },
});

export default VehicleDetailScreen;
