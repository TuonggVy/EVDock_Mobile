import React, { useState, useEffect } from 'react';
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
  Alert,
  ActivityIndicator,
} from 'react-native';
import { COLORS, SIZES } from '../../constants';
import { formatPrice, getStockStatus } from '../../services/vehicleService';
import motorbikeService from '../../services/motorbikeService';
import { Ruler, Settings, Battery, Shield, ArrowLeft, Plus, Search } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

const CompareScreen = ({ navigation, route }) => {
  const { selectedVehicle, compareVehicles: initialCompareVehicles = [] } = route.params || {};
  const [compareVehicles, setCompareVehicles] = useState(
    selectedVehicle ? [selectedVehicle] : initialCompareVehicles
  );
  const [vehicleDetails, setVehicleDetails] = useState({});
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Update compareVehicles when new vehicles are added from catalog
  useEffect(() => {
    if (initialCompareVehicles.length > 0) {
      setCompareVehicles(initialCompareVehicles);
    }
  }, [initialCompareVehicles]);

  // Load motorbike details for all vehicles
  useEffect(() => {
    const loadVehicleDetails = async () => {
      if (compareVehicles.length === 0) return;
      
      setLoadingDetails(true);
      try {
        const detailsPromises = compareVehicles.map(async (vehicle) => {
          const response = await motorbikeService.getMotorbikeById(vehicle.id);
          if (response.success) {
            const data = response.data?.data || response.data;
            return { vehicleId: vehicle.id, details: data };
          }
          return { vehicleId: vehicle.id, details: null };
        });
        
        const results = await Promise.all(detailsPromises);
        const detailsMap = {};
        results.forEach(({ vehicleId, details }) => {
          detailsMap[vehicleId] = details;
        });
        setVehicleDetails(detailsMap);
      } catch (error) {
        console.error('Error loading vehicle details:', error);
      } finally {
        setLoadingDetails(false);
      }
    };
    
    loadVehicleDetails();
  }, [compareVehicles]);

  const handleBack = () => {
    // Go back to the previous screen in the navigation stack
    navigation.goBack();
  };

  const handleAddVehicle = () => {
    // Navigate to catalog to select another vehicle
    navigation.navigate('Catalog', { 
      mode: 'compare',
      currentCompareVehicles: compareVehicles 
    });
  };

  const handleRemoveVehicle = (vehicleId) => {
    setCompareVehicles(prev => prev.filter(v => v.id !== vehicleId));
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear Comparison',
      'Are you sure you want to clear all vehicles from comparison?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All', 
          style: 'destructive',
          onPress: () => setCompareVehicles([])
        },
      ]
    );
  };

  const renderVehicleCard = (vehicle, index) => {
    const stockStatus = getStockStatus(vehicle);
    
    return (
      <View key={`compare-${index}-${vehicle.id}`} style={styles.vehicleCard}>
        {/* Remove Button */}
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveVehicle(vehicle.id)}
        >
          <Text style={styles.removeIcon}>×</Text>
        </TouchableOpacity>

        {/* Vehicle Image */}
        <View style={styles.imageContainer}>
          <Image
            source={typeof vehicle.image === 'string' ? { uri: vehicle.image } : vehicle.image}
            style={styles.vehicleImage}
            resizeMode="contain"
          />
          {!vehicle.inStock && (
            <View style={styles.outOfStockOverlay}>
              <Text style={styles.outOfStockText}>Out of Stock</Text>
            </View>
          )}
        </View>

        {/* Vehicle Info */}
        <View style={styles.vehicleInfo}>
          <Text style={styles.vehicleName} numberOfLines={2}>{vehicle.name}</Text>
          <Text style={styles.vehicleModel}>{vehicle.model} - {vehicle.version}</Text>
          
          {/* Price */}
          <Text style={styles.vehiclePrice}>
            {formatPrice(vehicle.price, vehicle.currency)}
          </Text>

          {/* Stock Status */}
          <View style={styles.stockRow}>
            <View style={[styles.stockDot, { backgroundColor: stockStatus.color }]} />
            <Text style={styles.stockText}>{stockStatus.text}</Text>
          </View>

          
        </View>
      </View>
    );
  };

  const renderAddVehicleCard = () => (
    <TouchableOpacity style={styles.addVehicleCard} onPress={handleAddVehicle}>
      <View style={styles.addIconContainer}>
        <Text style={styles.addIcon}><Plus color="#FFFFFF" size={18} /></Text>
      </View>
      <Text style={styles.addText}>Choose a vehicle</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
        >
          <Text style={styles.backIcon}><ArrowLeft color="#FFFFFF" size={18} /></Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Compare Vehicles</Text>
        {compareVehicles.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClearAll}
          >
            <Text style={styles.clearText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {compareVehicles.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}><Search size={60} color="#FFFFFF" /></Text>
            <Text style={styles.emptyTitle}>No vehicles to compare</Text>
            <Text style={styles.emptySubtitle}>
              Add vehicles from the catalog to start comparing
            </Text>
            <TouchableOpacity style={styles.browseButton} onPress={handleAddVehicle}>
              <Text style={styles.browseButtonText}>Browse Vehicles</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.comparisonContainer}>
            {/* Vehicle Cards */}
            <View style={styles.vehiclesRow}>
              {compareVehicles.map((vehicle, index) => renderVehicleCard(vehicle, index))}
              {compareVehicles.length < 3 && renderAddVehicleCard()}
            </View>

            {/* Comparison Table */}
            {compareVehicles.length > 1 && (
              <View style={styles.comparisonTable}>
                {loadingDetails ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.PRIMARY} />
                    <Text style={styles.loadingText}>Loading specifications...</Text>
                  </View>
                ) : (
                  <>
                    <Text style={styles.tableTitle}>Detailed Comparison</Text>
                    
                    {/* Specifications Table */}
                    <View style={styles.table}>
                      <View style={styles.tableRow}>
                        <Text style={styles.tableHeader}>Specification</Text>
                        {compareVehicles.map((vehicle, index) => (
                          <Text key={`header-${index}`} style={styles.tableHeader}>
                            {vehicle.name}
                          </Text>
                        ))}
                      </View>
                      
                      <View style={styles.tableRow}>
                        <Text style={styles.tableLabel}>Price</Text>
                        {compareVehicles.map((vehicle, index) => (
                          <Text key={`price-${index}`} style={styles.tableValue}>
                            {formatPrice(vehicle.price, vehicle.currency)}
                          </Text>
                        ))}
                      </View>
                    </View>

                    {/* Appearance Section */}
                    {compareVehicles.some(v => vehicleDetails[v.id]?.appearance) && (
                      <View style={styles.sectionContainer}>
                        <View style={styles.sectionHeader}>
                          <Ruler size={18} color={COLORS.TEXT.WHITE} />
                          <Text style={styles.sectionTitle}>Appearance</Text>
                        </View>
                        <View style={styles.table}>
                          {['length', 'width', 'height', 'weight', 'undercarriageDistance', 'storageLimit'].map((key) => (
                            <View key={key} style={styles.tableRow}>
                              <Text style={styles.tableLabel}>
                                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                              </Text>
                              {compareVehicles.map((vehicle) => {
                                const value = vehicleDetails[vehicle.id]?.appearance?.[key];
                                const displayValue = key.includes('Distance') || key.includes('Limit') ? `${value} mm` : 
                                                    key === 'weight' ? `${value} kg` : 
                                                    key === 'storageLimit' ? `${value} L` : 
                                                    `${value}`;
                                return (
                                  <Text key={`appearance-${key}-${vehicle.id}`} style={styles.tableValue}>
                                    {value !== undefined ? displayValue : 'N/A'}
                                  </Text>
                                );
                              })}
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    {/* Configuration Section */}
                    {compareVehicles.some(v => vehicleDetails[v.id]?.configuration) && (
                      <View style={styles.sectionContainer}>
                        <View style={styles.sectionHeader}>
                          <Settings size={18} color={COLORS.TEXT.WHITE} />
                          <Text style={styles.sectionTitle}>Configuration</Text>
                        </View>
                        <View style={styles.table}>
                          {['motorType', 'speedLimit', 'maximumCapacity'].map((key) => (
                            <View key={key} style={styles.tableRow}>
                              <Text style={styles.tableLabel}>
                                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                              </Text>
                              {compareVehicles.map((vehicle) => {
                                const value = vehicleDetails[vehicle.id]?.configuration?.[key];
                                const displayValue = key.includes('Capacity') ? `${value} people` : `${value}`;
                                return (
                                  <Text key={`config-${key}-${vehicle.id}`} style={styles.tableValue}>
                                    {value !== undefined ? displayValue : 'N/A'}
                                  </Text>
                                );
                              })}
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    {/* Battery Section */}
                    {compareVehicles.some(v => vehicleDetails[v.id]?.battery) && (
                      <View style={styles.sectionContainer}>
                        <View style={styles.sectionHeader}>
                          <Battery size={18} color={COLORS.TEXT.WHITE} />
                          <Text style={styles.sectionTitle}>Battery</Text>
                        </View>
                        <View style={styles.table}>
                          {['type', 'capacity', 'chargeTime', 'chargeType', 'energyConsumption', 'limit'].map((key) => (
                            <View key={key} style={styles.tableRow}>
                              <Text style={styles.tableLabel}>
                                {key === 'limit' ? 'Range Limit' : key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                              </Text>
                              {compareVehicles.map((vehicle) => {
                                const value = vehicleDetails[vehicle.id]?.battery?.[key];
                                return (
                                  <Text key={`battery-${key}-${vehicle.id}`} style={styles.tableValue}>
                                    {value !== undefined ? value : 'N/A'}
                                  </Text>
                                );
                              })}
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    {/* Safe Feature Section */}
                    {compareVehicles.some(v => vehicleDetails[v.id]?.safeFeature) && (
                      <View style={styles.sectionContainer}>
                        <View style={styles.sectionHeader}>
                          <Shield size={18} color={COLORS.TEXT.WHITE} />
                          <Text style={styles.sectionTitle}>Safe Features</Text>
                        </View>
                        <View style={styles.table}>
                          {['brake', 'lock'].map((key) => (
                            <View key={key} style={styles.tableRow}>
                              <Text style={styles.tableLabel}>
                                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                              </Text>
                              {compareVehicles.map((vehicle) => {
                                const value = vehicleDetails[vehicle.id]?.safeFeature?.[key];
                                return (
                                  <Text key={`safe-${key}-${vehicle.id}`} style={styles.tableValue}>
                                    {value !== undefined ? value : 'N/A'}
                                  </Text>
                                );
                              })}
                            </View>
                          ))}
                        </View>
                      </View>
                    )}
                  </>
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
    paddingTop: 20,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.MEDIUM,
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
  clearButton: {
    paddingHorizontal: SIZES.PADDING.SMALL,
    paddingVertical: 4,
  },
  clearText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.ERROR,
    fontWeight: '600',
  },

  // Scroll View
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SIZES.PADDING.MEDIUM,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.PADDING.XXXLARGE,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  emptyTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
    marginBottom: SIZES.PADDING.SMALL,
  },
  emptySubtitle: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
    textAlign: 'center',
    marginBottom: SIZES.PADDING.LARGE,
  },
  browseButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: SIZES.PADDING.LARGE,
    paddingVertical: SIZES.PADDING.MEDIUM,
    borderRadius: SIZES.RADIUS.MEDIUM,
  },
  browseButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },

  // Comparison Container
  comparisonContainer: {
    flex: 1,
  },

  // Vehicles Row
  vehiclesRow: {
    flexDirection: 'row',
    marginBottom: SIZES.PADDING.LARGE,
  },

  // Vehicle Card
  vehicleCard: {
    width: (width - SIZES.PADDING.MEDIUM * 2 - 20) / 3,
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    marginRight: 10,
    position: 'relative',
    overflow: 'hidden',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  removeIcon: {
    color: COLORS.TEXT.WHITE,
    fontSize: 16,
    fontWeight: 'bold',
  },
  imageContainer: {
    height: 120,
    backgroundColor: '#F8F9FA',
    position: 'relative',
  },
  vehicleImage: {
    width: '100%',
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
    fontSize: SIZES.FONT.SMALL,
    fontWeight: 'bold',
  },
  vehicleInfo: {
    padding: SIZES.PADDING.SMALL,
  },
  vehicleName: {
    fontSize: SIZES.FONT.SMALL,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: 4,
  },
  vehicleModel: {
    fontSize: SIZES.FONT.XSMALL,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: 4,
  },
  vehiclePrice: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginBottom: 4,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.PADDING.SMALL,
  },
  stockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  stockText: {
    fontSize: SIZES.FONT.XSMALL,
    color: COLORS.TEXT.SECONDARY,
  },
  specsContainer: {
    marginTop: 4,
  },
  specItem: {
    marginBottom: 2,
  },
  specLabel: {
    fontSize: SIZES.FONT.XSMALL,
    color: COLORS.TEXT.SECONDARY,
    fontWeight: '600',
  },
  specValue: {
    fontSize: SIZES.FONT.XSMALL,
    color: COLORS.TEXT.PRIMARY,
  },

  // Add Vehicle Card
  addVehicleCard: {
    width: (width - SIZES.PADDING.MEDIUM * 2 - 20) / 3,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: SIZES.RADIUS.MEDIUM,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.PADDING.MEDIUM,
  },
  addIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.PADDING.SMALL,
  },
  addIcon: {
    fontSize: 24,
    color: COLORS.TEXT.WHITE,
    fontWeight: 'bold',
  },
  addText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.WHITE,
    textAlign: 'center',
    fontWeight: '600',
  },

  // Comparison Table
  comparisonTable: {
    marginTop: SIZES.PADDING.LARGE,
  },
  tableTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  table: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: SIZES.RADIUS.MEDIUM,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  tableHeader: {
    flex: 1,
    padding: SIZES.PADDING.SMALL,
    fontSize: SIZES.FONT.SMALL,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
    textAlign: 'center',
  },
  tableLabel: {
    flex: 1,
    padding: SIZES.PADDING.SMALL,
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    fontWeight: '600',
  },
  tableValue: {
    flex: 1,
    padding: SIZES.PADDING.SMALL,
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.WHITE,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.PADDING.LARGE,
  },
  loadingText: {
    marginTop: SIZES.PADDING.MEDIUM,
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
  },
  sectionContainer: {
    marginTop: SIZES.PADDING.LARGE,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  sectionTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
    marginLeft: SIZES.PADDING.SMALL,
  },
});

export default CompareScreen;
