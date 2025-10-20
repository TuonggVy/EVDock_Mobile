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

const { width, height } = Dimensions.get('window');

const VehicleDetailScreen = ({ route, navigation }) => {
  const { vehicle } = route.params;
  const { user } = useAuth();
  const [selectedColor, setSelectedColor] = useState(vehicle.colors?.[0] || '');
  const [currentVehicleImage, setCurrentVehicleImage] = useState(vehicle.image);
  const [isChangingColor, setIsChangingColor] = useState(false);
  const [colorStockMap, setColorStockMap] = useState(null);
  const [loadingColorStocks, setLoadingColorStocks] = useState(false);

  const stockStatus = getStockStatus(vehicle);
  const isSelectedColorOut = React.useMemo(() => {
    if (!colorStockMap || !selectedColor) return false;
    const val = colorStockMap[selectedColor];
    return typeof val === 'number' && val <= 0;
  }, [colorStockMap, selectedColor]);

  // Load per-color stocks
  React.useEffect(() => {
    let isMounted = true;
    const loadColorStocks = async () => {
      try {
        setLoadingColorStocks(true);
        // If vehicle defines colors, fetch each color stock; otherwise fetch default bucket
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
      } catch (e) {
        if (isMounted) {
          setColorStockMap(null);
        }
      } finally {
        if (isMounted) setLoadingColorStocks(false);
      }
    };
    loadColorStocks();
    return () => { isMounted = false; };
  }, [vehicle?.id]);

  // Function to handle color selection and image change
  const handleColorChange = async (color) => {
    if (color === selectedColor) return; // Don't change if same color
    
    setSelectedColor(color);
    setIsChangingColor(true);
    
    try {
      // Use the vehicle image service to get color-specific image
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

  const renderSpecItem = (icon, title, value, color = COLORS.TEXT.PRIMARY) => (
    <View style={styles.specItem}>
      <Text style={styles.specIcon}>{icon}</Text>
      <View style={styles.specContent}>
        <Text style={styles.specTitle}>{title}</Text>
        <Text style={[styles.specValue, { color }]}>{value}</Text>
      </View>
    </View>
  );

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
          <Text style={styles.backIcon}>←</Text>
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
              {vehicle.colors?.map((color, index) => 
                renderColorOption(color, color === selectedColor)
              )}
            </View>
        </View>

        {/* Vehicle Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.vehicleTitle}>{vehicle.name}</Text>
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
          {Array.isArray(vehicle.colors) && vehicle.colors.length > 0 && (
            <View style={styles.colorStocksContainer}>
              <Text style={styles.sectionTitle}>Stock by Color</Text>
              {loadingColorStocks ? (
                <View style={styles.colorStocksRow}> 
                  <ActivityIndicator size="small" color={COLORS.PRIMARY} />
                  <Text style={styles.colorStocksLoading}> Loading...</Text>
                </View>
              ) : (
                <View style={styles.colorStocksGrid}>
                  {vehicle.colors.map((c) => (
                    <View key={`${vehicle.id}-${c}`} style={styles.colorStockChip}>
                      <Text style={styles.colorStockChipText}>{c}</Text>
                      <Text style={styles.colorStockChipCount}>{colorStockMap?.[c] ?? 0}</Text>
                    </View>
                  ))}
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
          <View style={styles.specsContainer}>
            <Text style={styles.sectionTitle}>Specifications</Text>
            
            <View style={styles.specsGrid}>
              {renderSpecItem(
                '🔋',
                'Battery Capacity',
                vehicle.specifications?.battery || 'N/A',
                COLORS.TEXT.WHITE
              )}
              {renderSpecItem(
                '⚡',
                'Maximum Speed',
                vehicle.specifications?.motor ? 
                  `${vehicle.specifications.motor.split(' ')[0]} max` : 'N/A',
                COLORS.TEXT.WHITE
              )}
              {renderSpecItem(
                '🛣️',
                'Distance (WLTP)',
                vehicle.features?.find(f => f.includes('km range')) || 'N/A',
                COLORS.TEXT.WHITE
              )}
              {renderSpecItem(
                '⚖️',
                'Weight',
                vehicle.specifications?.weight || 'N/A',
                COLORS.TEXT.WHITE
              )}
              {renderSpecItem(
                '👤',
                'Max Load',
                vehicle.specifications?.maxLoad || 'N/A',
                COLORS.TEXT.WHITE
              )}
              {renderSpecItem(
                '⏱️',
                'Charging Time',
                vehicle.specifications?.chargingTime || 'N/A',
                COLORS.TEXT.WHITE
              )}
            </View>
          </View>

          {/* Features */}
          <View style={styles.featuresContainer}>
            <Text style={styles.sectionTitle}>Key Features</Text>
            <View style={styles.featuresList}>
              {vehicle.features?.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Text style={styles.featureBullet}>•</Text>
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          </View>
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

  // Vehicle Title
  vehicleTitle: {
    fontSize: SIZES.FONT.XXLARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
    textAlign: 'center',
    marginBottom: SIZES.PADDING.MEDIUM,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: SIZES.PADDING.SMALL,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    borderRadius: SIZES.RADIUS.MEDIUM,
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
  specIcon: {
    fontSize: SIZES.FONT.LARGE,
    marginRight: SIZES.PADDING.SMALL,
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
