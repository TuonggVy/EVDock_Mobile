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
} from 'react-native';
import { COLORS, SIZES, USER_ROLES } from '../../constants';
import { vehicleService, formatPrice, getStockStatus } from '../../services/vehicleService';
import { dealerCatalogStorageService } from '../../services/storage/dealerCatalogStorageService';
import { useAuth } from '../../contexts/AuthContext';
import agencyStockService from '../../services/agencyStockService';
import motorbikeService from '../../services/motorbikeService';
import { ArrowLeft, Search, Sparkles, Car } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const GAP = 12;
const H_PADDING = 20;           // ← chỉ dùng chỗ này để căn 2 bên cho toàn bộ list
const NUM_COLS = 2;
const CARD_WIDTH = (width - H_PADDING * 2 - GAP) / NUM_COLS;

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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVersion, setSelectedVersion] = useState('all');
  const [vehicles, setVehicles] = useState([]);
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
  }, [searchQuery, selectedVersion, loading]);

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

        setVehicles(uniqueById((catalog?.data) || []));
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

      // Group stocks by motorbike and aggregate quantities
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
            price: motorbike.price || stock.price || 0,
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

      // Convert map to array and set inStock flag
      const catalogVehicles = Array.from(motorbikeMap.values()).map(vehicle => ({
        ...vehicle,
        inStock: vehicle.quantity > 0,
      }));

      // Extract unique versions
      const versionSet = new Set();
      catalogVehicles.forEach(v => {
        if (v.version && v.version !== 'N/A') {
          versionSet.add(String(v.version));
        }
      });
      
      const versionsList = Array.from(versionSet).map(ver => ({ 
        id: ver, 
        name: ver, 
        icon: 'sparkles' 
      }));

      setVehicles(uniqueById(catalogVehicles));
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
        // For Dealer Staff, we already have all vehicles loaded from stock API
        // Just apply client-side filtering
        const filtered = vehicles.filter(v => {
          const q = (searchQuery || '').toLowerCase();
          const matchesSearch = 
            v.name?.toLowerCase().includes(q) || 
            v.model?.toLowerCase().includes(q);
          const matchesVersion = selectedVersion === 'all' || v.version === selectedVersion;
          return matchesSearch && matchesVersion;
        });
        // Note: The filteredVehicles useMemo will handle the actual filtering
      } else {
        // Fallback to dealer catalog storage for other roles
        const res = await dealerCatalogStorageService.filterVehicles({
          version: selectedVersion,
          search: searchQuery,
        });
        if (res?.success) setVehicles(uniqueById(res.data));
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
            source={typeof vehicle.image === 'string' ? { uri: vehicle.image } : vehicle.image}
            style={styles.cardImage}
            resizeMode="contain"
          />
          {!vehicle.inStock && (
            <View style={styles.outOfStockOverlay}>
              <Text style={styles.outOfStockText}>Out of Stock</Text>
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


  const ListEmpty = (
    <View style={styles.emptyWrap}>
      {loading ? (
        <>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
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
      {/* Fixed Header Section */}
      <View style={styles.fixedHeader}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}><ArrowLeft color="#FFFFFF" size={18} /></Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Vehicle Catalog</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}><Search /></Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search vehicles..."
            placeholderTextColor={COLORS.TEXT.SECONDARY}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
        </View>

        {/* Filter chips */}
        <FlatList
          horizontal
          data={versions}
          keyExtractor={keyExtractorVersion}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.versionContent}
          style={styles.versionContainer}
          renderItem={({ item: version }) => (
            <TouchableOpacity
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
          )}
        />

        {/* Results count */}
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsText}>
            {filteredVehicles.length} vehicle{filteredVehicles.length !== 1 ? 's' : ''} found
          </Text>
        </View>
      </View>

      {/* Scrollable Content */}
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
    paddingTop: 20
  },

  // Fixed Header Section
  fixedHeader: {
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
    paddingHorizontal: H_PADDING,
    paddingBottom: SIZES.PADDING.SMALL,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },

  // ======= Header =======
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: SIZES.PADDING.MEDIUM,
    // KHÔNG paddingHorizontal ở đây
    paddingBottom: SIZES.PADDING.MEDIUM,
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

  // ======= Search =======
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 0,
  },
  searchIcon: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
  },

  // ======= Versions (compact chips) =======
  versionContainer: {
    maxHeight: 44, // KHÔNG padding/margin ngang
    marginTop: 6,
  },
  versionContent: {
    paddingHorizontal: 0, // ăn theo listContent
  },
  versionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
    paddingHorizontal: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginRight: 6,
  },
  versionChipActive: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: 'transparent',
  },
  versionChipIcon: {
    fontSize: 12,
    marginRight: 6,
  },
  versionChipText: {
    fontSize: 12,
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
    maxWidth: 120,
  },
  versionChipTextActive: {
    color: COLORS.TEXT.WHITE,
  },

  // ======= Results =======
  resultsContainer: {
    marginTop: 6,
    marginBottom: 10,
  },
  resultsText: {
    fontSize: 12,
    color: COLORS.TEXT.SECONDARY,
  },

  // ======= List/Grid =======
  listContent: {
    paddingHorizontal: H_PADDING,
    paddingTop: SIZES.PADDING.MEDIUM,
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
    backgroundColor: '#F8F9FA',
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
    color: COLORS.PRIMARY,
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
