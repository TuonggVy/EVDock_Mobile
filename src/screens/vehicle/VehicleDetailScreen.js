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

  const colorOptions = React.useMemo(() => {
    if (motorbikeDetails?.colors && Array.isArray(motorbikeDetails.colors)) {
      return motorbikeDetails.colors
        .map((colorItem) => colorItem?.color?.colorType || colorItem?.colorType)
        .filter(Boolean);
    }

    if (Array.isArray(vehicle.colors)) {
      return vehicle.colors.filter(Boolean);
    }

    return [];
  }, [motorbikeDetails?.colors, vehicle.colors]);

  const getSafeColorValue = React.useCallback((colorName) => {
    if (!colorName) return '#CCCCCC';
    const normalized = String(colorName).toLowerCase();
    const supportedColors = [
      'black',
      'white',
      'red',
      'blue',
      'green',
      'yellow',
      'pink',
      'silver',
      'gray',
      'orange',
      'purple',
      'brown',
      'gold',
      'navy',
      'maroon',
      'teal',
      'lime',
      'cyan',
      'beige',
      'ivory',
      'coral',
      'magenta',
      'olive',
    ];
    return supportedColors.includes(normalized) ? normalized : '#CCCCCC';
  }, []);

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

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => navigation.goBack()}
            >
              <ArrowLeft size={18} color={COLORS.TEXT.WHITE} />
            </TouchableOpacity>
            <View style={styles.headerTitle}>
              <Text style={styles.headerTitleText}>Vehicle Details</Text>
            </View>
            <View style={styles.headerSpacer} />
          </View>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.heroSection}>
            <View style={styles.imageContainer}>
              <Image
                source={
                  typeof currentVehicleImage === 'string'
                    ? { uri: currentVehicleImage }
                    : currentVehicleImage
                }
                style={styles.vehicleImage}
                resizeMode="cover"
              />
              {isChangingColor && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="#009DFF" />
                  <Text style={styles.loadingText}>Changing color...</Text>
                </View>
              )}
              {(!vehicle.inStock || isSelectedColorOut) && (
                <View style={styles.outOfStockOverlay}>
                  <Text style={styles.outOfStockText}>Out of Stock</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.titleRow}>
              <View style={styles.titleContent}>
                <Text style={styles.vehicleName}>{vehicle.name}</Text>
                <Text style={styles.vehicleModel}>
                  {vehicle.model} - {vehicle.version}
                </Text>
              </View>
              <View style={styles.statusBadge}>
                <Text
                  style={[
                    styles.statusBadgeText,
                    { color: stockStatus.color || COLORS.TEXT.PRIMARY },
                  ]}
                >
                  {stockStatus.text}
                </Text>
              </View>
            </View>

            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Price</Text>
              <Text style={styles.priceValue}>
                {formatPrice(vehicle.price, vehicle.currency)}
              </Text>
            </View>

            {!!vehicle.description && (
              <Text style={styles.description}>{vehicle.description}</Text>
            )}
          </View>

          {colorOptions.length > 0 && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Available Colors</Text>
              <View style={styles.colorDotsContainer}>
                {colorOptions.map((colorName, index) => (
                  <TouchableOpacity
                    key={`${colorName}-${index}`}
                    style={[
                      styles.colorDotButton,
                      selectedColor === colorName && styles.colorDotButtonActive,
                    ]}
                    onPress={() => handleColorChange(colorName)}
                    activeOpacity={0.85}
                  >
                    <View
                      style={[
                        styles.colorDotLarge,
                        { backgroundColor: getSafeColorValue(colorName) },
                      ]}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {colorOptions.length > 0 && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Stock by Color</Text>
                {loadingColorStocks && (
                  <ActivityIndicator size="small" color="#009DFF" />
                )}
              </View>
              {!loadingColorStocks && (
                <View style={styles.colorStocksGrid}>
                  {colorOptions.map((colorName) => (
                    <View
                      key={`${vehicle.id}-${colorName}`}
                      style={styles.colorStockChip}
                    >
                      <Text style={styles.colorStockChipText}>{colorName}</Text>
                      <Text style={styles.colorStockChipCount}>
                        {colorStockMap?.[colorName] ?? 0}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {(configurations.appearance ||
            configurations.configuration ||
            configurations.battery ||
            configurations.safeFeature) && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Specifications</Text>

              {configurations.appearance && (
                <View style={styles.specCategory}>
                  <View style={styles.specCategoryHeader}>
                    <Ruler size={18} color="#009DFF" />
                    <Text style={styles.specCategoryTitle}>Appearance</Text>
                  </View>
                  <View style={styles.specsGrid}>
                    {Object.entries(configurations.appearance).map(
                      ([key, value]) => {
                        if (key === 'electricMotorbikeId' || key === 'id')
                          return null;
                        const displayLabel = key
                          .replace(/([A-Z])/g, ' $1')
                          .replace(/^./, (str) => str.toUpperCase());
                        const displayValue =
                          key.includes('Distance') || key.includes('Limit')
                            ? `${value} mm`
                            : key.includes('Weight')
                            ? `${value} kg`
                            : key.includes('Storage')
                            ? `${value} L`
                            : `${value}`;
                        return (
                          <View key={key} style={styles.specItem}>
                            <Text style={styles.specTitle}>{displayLabel}</Text>
                            <Text style={styles.specValue}>{displayValue}</Text>
                          </View>
                        );
                      }
                    )}
                  </View>
                </View>
              )}

              {configurations.configuration && (
                <View style={styles.specCategory}>
                  <View style={styles.specCategoryHeader}>
                    <Settings size={18} color="#009DFF" />
                    <Text style={styles.specCategoryTitle}>Configuration</Text>
                  </View>
                  <View style={styles.specsGrid}>
                    {Object.entries(configurations.configuration).map(
                      ([key, value]) => {
                        if (key === 'electricMotorbikeId' || key === 'id')
                          return null;
                        const displayLabel = key
                          .replace(/([A-Z])/g, ' $1')
                          .replace(/^./, (str) => str.toUpperCase());
                        const displayValue = key.includes('Speed')
                          ? `${value}`
                          : key.includes('Capacity')
                          ? `${value} people`
                          : `${value}`;
                        return (
                          <View key={key} style={styles.specItem}>
                            <Text style={styles.specTitle}>{displayLabel}</Text>
                            <Text style={styles.specValue}>{displayValue}</Text>
                          </View>
                        );
                      }
                    )}
                  </View>
                </View>
              )}

              {configurations.battery && (
                <View style={styles.specCategory}>
                  <View style={styles.specCategoryHeader}>
                    <Battery size={18} color="#009DFF" />
                    <Text style={styles.specCategoryTitle}>Battery</Text>
                  </View>
                  <View style={styles.specsGrid}>
                    {Object.entries(configurations.battery).map(
                      ([key, value]) => {
                        if (key === 'electricMotorbikeId' || key === 'id')
                          return null;
                        const displayLabel = key
                          .replace(/([A-Z])/g, ' $1')
                          .replace(/^./, (str) => str.toUpperCase());
                        return (
                          <View key={key} style={styles.specItem}>
                            <Text style={styles.specTitle}>{displayLabel}</Text>
                            <Text style={styles.specValue}>{value}</Text>
                          </View>
                        );
                      }
                    )}
                  </View>
                </View>
              )}

              {configurations.safeFeature && (
                <View style={styles.specCategory}>
                  <View style={styles.specCategoryHeader}>
                    <Shield size={18} color="#009DFF" />
                    <Text style={styles.specCategoryTitle}>Safe Features</Text>
                  </View>
                  <View style={styles.specsGrid}>
                    {Object.entries(configurations.safeFeature).map(
                      ([key, value]) => {
                        if (key === 'electricMotorbikeId' || key === 'id')
                          return null;
                        const displayLabel = key
                          .replace(/([A-Z])/g, ' $1')
                          .replace(/^./, (str) => str.toUpperCase());
                        return (
                          <View key={key} style={styles.specItem}>
                            <Text style={styles.specTitle}>{displayLabel}</Text>
                            <Text style={styles.specValue}>
                              {String(value)}
                            </Text>
                          </View>
                        );
                      }
                    )}
                  </View>
                </View>
              )}
            </View>
          )}

          <View style={styles.scrollBottomSpacer} />
        </ScrollView>

        <SafeAreaView style={styles.bottomSafeArea}>
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.secondaryButton,
                !vehicle.inStock && styles.disabledButton,
              ]}
              disabled={!vehicle.inStock}
              onPress={() =>
                navigation.navigate('Compare', { selectedVehicle: vehicle })
              }
            >
              <Text
                style={[
                  styles.actionButtonText,
                  styles.secondaryButtonText,
                  !vehicle.inStock && styles.disabledButtonText,
                ]}
              >
                Compare
              </Text>
            </TouchableOpacity>

            {user?.role !== USER_ROLES.DEALER_MANAGER && (
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.primaryButton,
                ]}
                onPress={() =>
                  navigation.navigate('CreateQuotation', { vehicle })
                }
              >
                <Text
                  style={[
                    styles.actionButtonText,
                    styles.primaryButtonText,
                  ]}
                >
                  Create Quotation
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
  },
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
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: SIZES.RADIUS.ROUND,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
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
  headerSpacer: {
    width: 40,
    height: 40,
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.SURFACE,
    borderTopLeftRadius: SIZES.RADIUS.XXLARGE,
    borderTopRightRadius: SIZES.RADIUS.XXLARGE,
  },
  scrollContent: {
    paddingBottom: SIZES.PADDING.XXXLARGE,
  },
  scrollBottomSpacer: {
    height: SIZES.PADDING.XXXLARGE + 96,
  },
  heroSection: {
    marginHorizontal: SIZES.PADDING.LARGE,
    marginBottom: SIZES.PADDING.LARGE,
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.LARGE,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  imageContainer: {
    height: height * 0.35,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  vehicleImage: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: COLORS.TEXT.WHITE,
    fontSize: SIZES.FONT.MEDIUM,
    marginTop: SIZES.PADDING.SMALL,
    fontWeight: '600',
  },
  outOfStockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outOfStockText: {
    color: COLORS.TEXT.WHITE,
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
  },
  sectionCard: {
    marginHorizontal: SIZES.PADDING.LARGE,
    marginBottom: SIZES.PADDING.LARGE,
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.LARGE,
    padding: SIZES.PADDING.LARGE,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  titleContent: {
    flex: 1,
    marginRight: SIZES.PADDING.MEDIUM,
  },
  vehicleName: {
    fontSize: SIZES.FONT.XXLARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: 4,
  },
  vehicleModel: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
  },
  statusBadge: {
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.XSMALL,
    borderRadius: SIZES.RADIUS.MEDIUM,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    fontSize: SIZES.FONT.SMALL,
    fontWeight: '600',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.PADDING.SMALL,
  },
  priceLabel: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    fontWeight: '500',
  },
  priceValue: {
    fontSize: SIZES.FONT.XXLARGE,
    fontWeight: 'bold',
    color: COLORS.SECONDARY,
  },
  description: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  colorDotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.PADDING.MEDIUM,
  },
  colorDotButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.SURFACE,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  colorDotButtonActive: {
    borderColor: '#009DFF',
    shadowColor: '#009DFF',
    shadowOpacity: 0.3,
    elevation: 4,
  },
  colorDotLarge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  colorStocksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.PADDING.SMALL,
  },
  colorStockChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: SIZES.PADDING.SMALL,
  },
  colorStockChipText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '600',
  },
  colorStockChipCount: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    fontWeight: '600',
  },
  specCategory: {
    marginBottom: SIZES.PADDING.LARGE,
  },
  specCategoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.PADDING.SMALL,
    gap: SIZES.PADDING.SMALL,
  },
  specCategoryTitle: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.PADDING.SMALL,
  },
  specItem: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.MEDIUM,
  },
  specTitle: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: 4,
  },
  specValue: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
  },
  bottomSafeArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  bottomBar: {
    flexDirection: 'row',
    gap: SIZES.PADDING.MEDIUM,
    paddingHorizontal: SIZES.PADDING.LARGE,
    paddingTop: SIZES.PADDING.SMALL,
    paddingBottom:
      Platform.OS === 'ios' ? SIZES.PADDING.XLARGE : SIZES.PADDING.LARGE,
    backgroundColor: COLORS.SURFACE,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  actionButton: {
    flex: 1,
    paddingVertical: SIZES.PADDING.MEDIUM,
    borderRadius: SIZES.RADIUS.LARGE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#009DFF',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#009DFF',
    backgroundColor: 'transparent',
  },
  disabledButton: {
    opacity: 0.6,
  },
  actionButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
  },
  primaryButtonText: {
    color: COLORS.TEXT.WHITE,
  },
  secondaryButtonText: {
    color: '#009DFF',
  },
  disabledButtonText: {
    color: COLORS.TEXT.SECONDARY,
  },
});

export default VehicleDetailScreen;
