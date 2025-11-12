import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  TextInput,
  Dimensions,
  ActivityIndicator,
  SafeAreaView,
  FlatList,
  RefreshControl,
  Platform,
  ScrollView,
  BackHandler,
} from 'react-native';
import { COLORS, SIZES, USER_ROLES } from '../../constants';
import { formatPrice, getStockStatus } from '../../services/vehicleService';
import { dealerCatalogStorageService } from '../../services/storage/dealerCatalogStorageService';
import { useAuth } from '../../contexts/AuthContext';
import agencyStockService from '../../services/agencyStockService';
import motorbikeService from '../../services/motorbikeService';
import { ArrowLeft, Search, Sparkles, Car } from 'lucide-react-native';
import { CommonActions, useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const GAP = 12;
const H_PADDING = SIZES.PADDING.LARGE;
const NUM_COLS = 2;
const CARD_WIDTH = (width - H_PADDING * 2 - GAP) / NUM_COLS;
const PLACEHOLDER_IMAGE_URL = 'https://static.vecteezy.com/system/resources/previews/048/092/168/non_2x/gallery-icon-sign-isolated-on-white-free-vector.jpg';

// Icon mapping for version chips
const getVersionIcon = (iconName) => {
  let IconComponent = null;
  if (iconName === 'car') IconComponent = Car;
  else if (iconName === 'sparkles') IconComponent = Sparkles;
  
  if (IconComponent) {
    return (
      <View style={{ marginRight: 6 }}>
        <IconComponent size={12} color={COLORS.TEXT.WHITE} />
      </View>
    );
  }
  return null;
};

/** ===== Helpers to avoid duplicate keys ===== */
const safeKey = (id, fallbackIndex) => {
  if (id === null || id === undefined) return String(fallbackIndex);
  return String(id).toLowerCase();
};

const uniqueById = (arr = []) =>
  Array.from(new Map(arr.map(v => [safeKey(v.id, Math.random()), v])).values());

const normalizeVersions = (arr = []) => {
  const seen = new Set();
  const cleaned = [];
  for (const v of arr) {
    const id = safeKey(v.id, cleaned.length);
    if (id === 'all') continue;        // bỏ 'all' từ backend nếu có
    if (!seen.has(id)) {
      seen.add(id);
      cleaned.push({ ...v, id });
    }
  }
  return [{ id: 'all', name: 'All Versions', icon: 'car' }, ...cleaned];
};
/** ========================================= */

const CatalogScreen = ({ navigation, route }) => {
  const { mode, currentCompareVehicles = [] } = route.params || {};
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('available'); // 'available' or 'preorder'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVersion, setSelectedVersion] = useState('all');
  const [vehicles, setVehicles] = useState([]);
  const [availableVehicles, setAvailableVehicles] = useState([]); // Vehicles with stock
  const [preorderVehicles, setPreorderVehicles] = useState([]); // Vehicles without stock
  const [versions, setVersions] = useState([
    { id: 'all', name: 'All Versions', icon: 'car' }, // fallback ban đầu
  ]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
    if (!loading) loadVehicles();
  }, [searchQuery, selectedVersion, loading, activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Check if user is Dealer Staff and has agencyId
      if (user?.role === USER_ROLES.DEALER_STAFF && user?.agencyId) {
        await loadCatalogFromStockAPI();
      } else {
        // Fallback to dealer catalog storage for other roles
        const [catalog, versionsFromCatalog] = await Promise.all([
          dealerCatalogStorageService.filterVehicles({ version: 'all', search: '' }),
          dealerCatalogStorageService.getVersions(),
        ]);

        const catalogVehicles = uniqueById((catalog?.data) || []);
        setAvailableVehicles(catalogVehicles);
        setPreorderVehicles([]); // For non-Dealer Staff, no pre-order tab
        setVehicles(catalogVehicles);
        setVersions(normalizeVersions(versionsFromCatalog));
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to load vehicle data');
    } finally {
      setLoading(false);
    }
  };

  const loadCatalogFromStockAPI = async () => {
    try {
      if (!user?.agencyId) {
        console.log('No agencyId available');
        return;
      }

      const agencyId = parseInt(user.agencyId);
      
      // Fetch stocks and motorbikes
      const [stocksResponse, motorbikesResponse] = await Promise.all([
        agencyStockService.getAgencyStocks(agencyId, { page: 1, limit: 1000 }),
        motorbikeService.getAllMotorbikes({ limit: 1000 })
      ]);

      if (!stocksResponse.success || !motorbikesResponse.success) {
        console.error('Failed to load data');
        return;
      }

      const stocks = stocksResponse.data || [];
      const motorbikes = motorbikesResponse.data || [];

      // Get set of motorbike IDs that have stock
      const motorbikesWithStock = new Set();
      stocks.forEach(stock => {
        if (stock.motorbikeId) {
          motorbikesWithStock.add(stock.motorbikeId);
        }
      });

      // Group stocks by motorbike and aggregate quantities (for Available tab)
      const motorbikeMap = new Map();
      
      stocks.forEach(stock => {
        const motorbikeId = stock.motorbikeId;
        if (!motorbikeId) return;

        const motorbike = motorbikes.find(m => m.id === motorbikeId);
        if (!motorbike) return;

        if (!motorbikeMap.has(motorbikeId)) {
          motorbikeMap.set(motorbikeId, {
            id: motorbike.id,
            name: motorbike.name,
            model: motorbike.model || motorbike.name,
            version: motorbike.version || 'N/A',
            price: stock.price || motorbike.price || 0, // Prioritize stock price over motorbike price
            currency: 'VND',
            image: motorbike.images?.[0]?.imageUrl || null,
            stockCount: 0,
            quantity: 0, // total quantity across all colors
            colorStocks: {},
            inStock: false,
          });
        }

        const vehicle = motorbikeMap.get(motorbikeId);
        const quantity = stock.quantity || 0;
        vehicle.quantity += quantity;
        vehicle.stockCount += quantity;
        
        // Track color stocks if color info is available
        if (stock.colorId) {
          // We'll fetch color details if needed, for now just track by colorId
          vehicle.colorStocks[stock.colorId] = (vehicle.colorStocks[stock.colorId] || 0) + quantity;
        }
      });

      // Convert map to array and set inStock flag (Available vehicles)
      const availableCatalogVehicles = Array.from(motorbikeMap.values()).map(vehicle => ({
        ...vehicle,
        inStock: vehicle.quantity > 0,
      }));

      // Create Pre-order vehicles (motorbikes without stock)
      const preorderCatalogVehicles = motorbikes
        .filter(motorbike => !motorbikesWithStock.has(motorbike.id))
        .map(motorbike => ({
          id: motorbike.id,
          name: motorbike.name,
          model: motorbike.model || motorbike.name,
          version: motorbike.version || 'N/A',
          price: motorbike.price || 0,
          currency: 'VND',
          image: motorbike.images?.[0]?.imageUrl || null,
          stockCount: 0,
          quantity: 0,
          colorStocks: {},
          inStock: false,
        }));

      // Combine versions from both available and preorder vehicles
      const versionSet = new Set();
      [...availableCatalogVehicles, ...preorderCatalogVehicles].forEach(v => {
        if (v.version && v.version !== 'N/A') {
          versionSet.add(String(v.version));
        }
      });
      
      const versionsList = Array.from(versionSet).map(ver => ({ 
        id: ver, 
        name: ver, 
        icon: 'sparkles' 
      }));

      const uniqueAvailable = uniqueById(availableCatalogVehicles);
      const uniquePreorder = uniqueById(preorderCatalogVehicles);
      
      setAvailableVehicles(uniqueAvailable);
      setPreorderVehicles(uniquePreorder);
      
      // Set current vehicles based on active tab
      setVehicles(activeTab === 'available' ? uniqueAvailable : uniquePreorder);
      
      setVersions(normalizeVersions(versionsList));
    } catch (error) {
      console.error('Error loading catalog from stock API:', error);
      Alert.alert('Error', 'Failed to load catalog data');
    }
  };

  const loadVehicles = async () => {
    try {
      setRefreshing(true);
      
      // Check if user is Dealer Staff and has agencyId
      if (user?.role === USER_ROLES.DEALER_STAFF && user?.agencyId) {
        // For Dealer Staff, vehicles are already loaded from stock API
        // Just update the current vehicles based on active tab
        if (activeTab === 'available') {
          setVehicles(availableVehicles);
        } else {
          setVehicles(preorderVehicles);
        }
      } else {
        // Fallback to dealer catalog storage for other roles
        const res = await dealerCatalogStorageService.filterVehicles({
          version: selectedVersion,
          search: searchQuery,
        });
        if (res?.success) {
          const catalogVehicles = uniqueById(res.data);
          setAvailableVehicles(catalogVehicles);
          setVehicles(catalogVehicles);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    loadData();
  }, []);

  // Update vehicles when tab changes
  useEffect(() => {
    if (user?.role === USER_ROLES.DEALER_STAFF && user?.agencyId) {
      if (activeTab === 'available') {
        setVehicles(availableVehicles);
      } else {
        setVehicles(preorderVehicles);
      }
    }
  }, [activeTab, availableVehicles, preorderVehicles, user]);

  const filteredVehicles = useMemo(() => {
    const q = (searchQuery || '').toLowerCase();
    return vehicles.filter((v) => {
      const matchesSearch =
        v.name?.toLowerCase().includes(q) ||
        v.model?.toLowerCase().includes(q);
      const matchesVersion = selectedVersion === 'all' || v.version === selectedVersion;
      return matchesSearch && matchesVersion;
    });
  }, [vehicles, searchQuery, selectedVersion]);

  const handleVehiclePress = (vehicle) => {
    if (mode === 'compare') {
      // Add vehicle to compare list and go back to Compare screen
      const updatedCompareVehicles = [...currentCompareVehicles, vehicle];
      navigation.navigate('Compare', { 
        selectedVehicle: null,
        compareVehicles: updatedCompareVehicles
      });
    } else {
      navigation.navigate('VehicleDetail', { vehicle });
    }
  };

  const renderVehicleCard = ({ item: vehicle }) => {
    const stockStatus = getStockStatus(vehicle);
    const isAlreadySelected = mode === 'compare' && currentCompareVehicles.some(v => v.id === vehicle.id);
    const isPreorder = activeTab === 'preorder';
    
    // Determine image source: use placeholder for preorder vehicles without image
    const getImageSource = () => {
      if (isPreorder && (!vehicle.image || vehicle.image === null || vehicle.image === '')) {
        return { uri: PLACEHOLDER_IMAGE_URL };
      }
      return typeof vehicle.image === 'string' ? { uri: vehicle.image } : vehicle.image;
    };
    
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => !isAlreadySelected && handleVehiclePress(vehicle)}
        style={[
          styles.card,
          isAlreadySelected && styles.disabledCard
        ]}
        disabled={isAlreadySelected}
      >
        <View style={styles.imageWrap}>
          <Image
            source={getImageSource()}
            style={styles.cardImage}
            resizeMode="cover"
          />
          {!vehicle.inStock && !isPreorder && (
            <View style={styles.outOfStockOverlay}>
              <Text style={styles.outOfStockText}>Out of Stock</Text>
            </View>
          )}
          {!vehicle.inStock && isPreorder && (
            <View style={styles.preorderOverlay}>
              <Text style={styles.preorderText}>Pre-order</Text>
            </View>
          )}
          {isAlreadySelected && (
            <View style={styles.selectedOverlay}>
              <Text style={styles.selectedText}>Already Selected</Text>
            </View>
          )}
        </View>
        <View style={styles.cardBody}>
          <Text numberOfLines={1} style={styles.cardTitle}>{vehicle.name}</Text>
          <Text style={styles.cardSubtitle}>{vehicle.model} - {vehicle.version}</Text>
          <Text style={styles.cardPrice}>{formatPrice(vehicle.price, vehicle.currency)}</Text>
          <View style={styles.stockRow}>
            <View style={[styles.stockDot, { backgroundColor: stockStatus.color }]} />
            <Text style={styles.stockText}>{stockStatus.text}</Text>
          </View>
          {/* Per-color stock hidden in Catalog; only total shown */}
        </View>
      </TouchableOpacity>
    );
  };

  // Key extractors an toàn
  const keyExtractorVehicle = useCallback((item, index) => `veh-${safeKey(item.id, index)}`, []);
  const keyExtractorVersion = useCallback((v, index) => `ver-${safeKey(v.id, index)}`, []);

  const handleBackToHome = useCallback(() => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Main', params: { screen: 'Home' } }],
      })
    );
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        handleBackToHome();
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [handleBackToHome])
  );


  const ListEmpty = (
    <View style={styles.emptyWrap}>
      {loading ? (
        <>
          <ActivityIndicator size="large" color="#009DFF" />
          <Text style={styles.loadingText}>Loading vehicles...</Text>
        </>
      ) : (
        <>
          <Car size={64} color={COLORS.TEXT.SECONDARY} />
          <Text style={styles.emptyTitle}>No vehicles found</Text>
          <Text style={styles.emptySubtitle}>
            Try adjusting your search or filter criteria
          </Text>
        </>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={handleBackToHome}>
          <ArrowLeft size={18} color={COLORS.TEXT.WHITE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vehicle Catalog</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <View style={styles.searchContainer}>
        <Search size={18} color={COLORS.TEXT.SECONDARY} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search vehicles..."
          placeholderTextColor={COLORS.TEXT.SECONDARY}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
      </View>

      {/* Tab Navigation - Only show for Dealer Staff */}
      {user?.role === USER_ROLES.DEALER_STAFF && user?.agencyId && (
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'available' && styles.activeTabButton
            ]}
            onPress={() => setActiveTab('available')}
          >
            <Text style={[
              styles.tabText,
              activeTab === 'available' && styles.activeTabText
            ]}>
              Available ({availableVehicles.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'preorder' && styles.activeTabButton
            ]}
            onPress={() => setActiveTab('preorder')}
          >
            <Text style={[
              styles.tabText,
              activeTab === 'preorder' && styles.activeTabText
            ]}>
              Pre-order ({preorderVehicles.length})
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.versionWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.versionContent}
        >
          {versions.map((version, index) => (
            <TouchableOpacity
              key={keyExtractorVersion(version, index)}
              onPress={() => setSelectedVersion(version.id)}
              activeOpacity={0.9}
              style={[
                styles.versionChip,
                selectedVersion === version.id && styles.versionChipActive,
              ]}
            >
              {!!version.icon && getVersionIcon(version.icon)}
              <Text
                numberOfLines={1}
                style={[
                  styles.versionChipText,
                  selectedVersion === version.id && styles.versionChipTextActive,
                ]}
              >
                {version.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.resultsContainer}>
        <Text style={styles.resultsText}>
          {filteredVehicles.length} vehicle{filteredVehicles.length !== 1 ? 's' : ''} found
        </Text>
      </View>

      <FlatList
        data={filteredVehicles}
        keyExtractor={keyExtractorVehicle}
        numColumns={NUM_COLS}
        columnWrapperStyle={styles.columnWrapper}
        ListEmptyComponent={ListEmpty}
        renderItem={renderVehicleCard}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.PRIMARY} />
        }
        initialNumToRender={6}
        windowSize={10}
        removeClippedSubviews={Platform.OS === 'android'}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.PADDING.LARGE,
    paddingTop: SIZES.PADDING.MEDIUM,
    paddingBottom: SIZES.PADDING.MEDIUM,
    marginTop: SIZES.PADDING.MEDIUM,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: SIZES.RADIUS.ROUND,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: COLORS.TEXT.WHITE,
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    paddingHorizontal: SIZES.PADDING.SMALL,
  },
  headerPlaceholder: {
    width: 40,
    height: 40,
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    marginHorizontal: SIZES.PADDING.LARGE,
    marginTop: SIZES.PADDING.MEDIUM,
    gap: SIZES.PADDING.SMALL,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
  },

  // Tab styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: SIZES.PADDING.XSMALL,
    marginHorizontal: SIZES.PADDING.LARGE,
    marginTop: SIZES.PADDING.MEDIUM,
    gap: SIZES.PADDING.XSMALL,
  },
  tabButton: {
    flex: 1,
    paddingVertical: SIZES.PADDING.SMALL,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    borderRadius: SIZES.RADIUS.SMALL,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  activeTabButton: {
    backgroundColor: '#009DFF',
  },
  tabText: {
    fontSize: SIZES.FONT.SMALL,
    fontWeight: '600',
    color: COLORS.TEXT.SECONDARY,
  },
  activeTabText: {
    color: COLORS.TEXT.WHITE,
  },

  versionWrapper: {
    marginTop: SIZES.PADDING.MEDIUM,
  },
  versionContent: {
    paddingHorizontal: SIZES.PADDING.LARGE,
    paddingBottom: SIZES.PADDING.SMALL,
    gap: SIZES.PADDING.SMALL,
  },
  versionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.PADDING.XSMALL,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    borderRadius: SIZES.RADIUS.SMALL,
    backgroundColor: 'rgba(255,255,255,0.12)',
    minWidth: 120,
    height: 36,
  },
  versionChipActive: {
    backgroundColor: '#009DFF',
  },
  versionChipText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    fontWeight: '600',
    maxWidth: 140,
  },
  versionChipTextActive: {
    color: COLORS.TEXT.WHITE,
  },

  resultsContainer: {
    marginTop: SIZES.PADDING.SMALL,
    marginBottom: SIZES.PADDING.MEDIUM,
    paddingHorizontal: SIZES.PADDING.LARGE,
  },
  resultsText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
  },

  listContent: {
    paddingHorizontal: SIZES.PADDING.LARGE,
    paddingTop: SIZES.PADDING.SMALL,
    paddingBottom: SIZES.PADDING.XXXLARGE,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: GAP,
  },

  // ======= Card =======
  card: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.LARGE,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  disabledCard: {
    opacity: 0.6,
  },
  imageWrap: {
    height: 120,
    backgroundColor: 'rgba(255,255,255,0.08)',
    position: 'relative',
  },
  cardImage: {
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
    fontWeight: '700',
  },
  
  preorderText: {
    color: COLORS.TEXT.WHITE,
    fontSize: SIZES.FONT.SMALL,
    fontWeight: '700',
  },
  selectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedText: {
    color: COLORS.TEXT.WHITE,
    fontSize: SIZES.FONT.SMALL,
    fontWeight: '700',
  },
  cardBody: {
    padding: SIZES.PADDING.MEDIUM,
  },
  cardTitle: {
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: 6,
  },
  cardPrice: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.SECONDARY,
    marginBottom: 6,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  stockText: {
    fontSize: SIZES.FONT.XSMALL,
    color: COLORS.TEXT.SECONDARY,
  },

  // Color stock chips
  colorStockRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
    gap: 6,
  },
  colorChip: {
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderWidth: 1,
    borderColor: COLORS.BORDER.PRIMARY,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  colorChipText: {
    fontSize: 10,
    color: COLORS.TEXT.SECONDARY,
    maxWidth: 100,
  },

  // ======= Empty / Loading =======
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.PADDING.XXXLARGE,
  },
  loadingText: {
    marginTop: 12,
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
    textAlign: 'center',
  },
});

export default CatalogScreen;
