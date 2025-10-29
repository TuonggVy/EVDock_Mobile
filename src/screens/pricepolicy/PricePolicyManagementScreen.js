import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { COLORS, SIZES } from '../../constants';
import pricePolicyService from '../../services/pricePolicyService';
import agencyService from '../../services/agencyService';
import motorbikeService from '../../services/motorbikeService';
import CustomAlert from '../../components/common/CustomAlert';
import { Pencil, Trash2 } from 'lucide-react-native';

const PricePolicyManagementScreen = ({ navigation }) => {
  const [pricePolicies, setPricePolicies] = useState([]);
  const [agencies, setAgencies] = useState([]);
  const [motorbikes, setMotorbikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'info' });

  useEffect(() => {
    loadPricePolicies();
    loadAgencies();
    loadMotorbikes();

    const unsubscribe = navigation.addListener('focus', () => {
      loadPricePolicies();
    });

    return unsubscribe;
  }, [navigation]);

  const loadAgencies = async () => {
    try {
      const response = await agencyService.getAgencies({ limit: 100 });
      if (response.success && Array.isArray(response.data)) {
        setAgencies(response.data);
      }
    } catch (error) {
      console.error('Error loading agencies:', error);
    }
  };

  const loadMotorbikes = async () => {
    try {
      const response = await motorbikeService.getAllMotorbikes({ limit: 100 });
      if (response.success && Array.isArray(response.data)) {
        setMotorbikes(response.data);
      }
    } catch (error) {
      console.error('Error loading motorbikes:', error);
    }
  };

  const loadPricePolicies = async () => {
    try {
      setLoading(true);
      const response = await pricePolicyService.getAllPricePolicies(1, 10);
      
      if (response.success) {
        const sortedPolicies = response.data.sort((a, b) => (b.id || 0) - (a.id || 0));
        setPricePolicies(sortedPolicies);
      } else {
        const errorMessage = typeof response.error === 'string' 
          ? response.error 
          : (response.error?.message || JSON.stringify(response.error) || 'Failed to load price policies');
        setAlertConfig({
          title: 'Error',
          message: errorMessage,
          type: 'error'
        });
        setShowAlert(true);
      }
    } catch (error) {
      console.error('Error loading price policies:', error);
      setAlertConfig({
        title: 'Error',
        message: 'An unexpected error occurred',
        type: 'error'
      });
      setShowAlert(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPricePolicies();
  };

  const handleDelete = async (policyId, policyTitle) => {
    Alert.alert(
      'Delete Price Policy',
      `Are you sure you want to delete "${policyTitle}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const response = await pricePolicyService.deletePricePolicy(policyId);
            if (response.success) {
              setAlertConfig({
                title: 'Success',
                message: 'Price policy deleted successfully',
                type: 'success'
              });
              setShowAlert(true);
              loadPricePolicies();
            } else {
              const errorMessage = typeof response.error === 'string' 
                ? response.error 
                : (response.error?.message || JSON.stringify(response.error) || 'Failed to delete price policy');
              setAlertConfig({
                title: 'Error',
                message: errorMessage,
                type: 'error'
              });
              setShowAlert(true);
            }
          }
        }
      ]
    );
  };

  const handleEdit = (policy) => {
    navigation.navigate('EditPricePolicy', { pricePolicy: policy });
  };

  const handleAdd = () => {
    navigation.navigate('AddPricePolicy');
  };

  const getAgencyName = (agencyId) => {
    const agency = agencies.find(a => a.id === agencyId);
    return agency?.name || `Agency #${agencyId}`;
  };

  const getMotorbikeName = (motorbikeId) => {
    const motorbike = motorbikes.find(m => m.id === motorbikeId);
    return motorbike?.name || `Motorbike #${motorbikeId}`;
  };

  const filteredPolicies = pricePolicies.filter(policy => {
    return policy.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      policy.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      policy.policy?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <View style={styles.container}>
      <CustomAlert
        visible={showAlert}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setShowAlert(false)}
      />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Price Policy</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAdd}
        >
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search price policies..."
          placeholderTextColor={COLORS.TEXT.SECONDARY}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        </View>
      ) : (
        <ScrollView
          style={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {filteredPolicies.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>💵</Text>
              <Text style={styles.emptyText}>No price policies found</Text>
            </View>
          ) : (
            filteredPolicies.map((policy) => (
              <View key={policy.id} style={styles.policyCard}>
                <View style={styles.policyHeader}>
                  <View style={styles.policyHeaderLeft}>
                    <Text style={styles.policyTitle}>{policy.title}</Text>
                  </View>
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[styles.iconButton, styles.editButton]}
                      onPress={() => handleEdit(policy)}
                    >
                      <Text style={styles.iconText}><Pencil size={14} /></Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.iconButton, styles.deleteButton]}
                      onPress={() => handleDelete(policy.id, policy.title)}
                    >
                      <Text style={styles.iconText}><Trash2 size={14} /></Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={styles.policyContent}>{policy.content}</Text>

                <View style={styles.policyDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Policy:</Text>
                    <Text style={styles.detailValue}>{policy.policy}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Wholesale Price:</Text>
                    <Text style={styles.detailValue}>
                      {pricePolicyService.formatPrice(policy.wholesalePrice)}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Agency:</Text>
                    <Text style={styles.detailValue}>{getAgencyName(policy.agencyId)}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Motorbike:</Text>
                    <Text style={styles.detailValue}>{getMotorbikeName(policy.motorbikeId)}</Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
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
    padding: SIZES.PADDING.LARGE,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
    paddingTop: SIZES.PADDING.XXXLARGE,
  },
  backButton: {
    padding: SIZES.PADDING.SMALL,
  },
  backButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: SIZES.FONT.HEADER,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    padding: SIZES.PADDING.SMALL,
  },
  addButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.SURFACE,
    marginHorizontal: SIZES.PADDING.LARGE,
    marginBottom: SIZES.PADDING.LARGE,
    borderRadius: SIZES.RADIUS.LARGE,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
  },
  searchIcon: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
    marginRight: SIZES.PADDING.SMALL,
  },
  searchInput: {
    flex: 1,
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.PRIMARY,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: SIZES.PADDING.LARGE,
  },
  policyCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.LARGE,
    padding: SIZES.PADDING.MEDIUM,
    marginBottom: SIZES.PADDING.MEDIUM,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  policyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SIZES.PADDING.SMALL,
  },
  policyHeaderLeft: {
    flex: 1,
  },
  policyTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SIZES.PADDING.XSMALL,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: SIZES.RADIUS.SMALL,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SIZES.PADDING.XSMALL,
  },
  editButton: {
    backgroundColor: COLORS.PRIMARY + '20',
  },
  deleteButton: {
    backgroundColor: COLORS.ERROR + '20',
  },
  iconText: {
    fontSize: SIZES.FONT.MEDIUM,
  },
  policyContent: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  policyDetails: {
    borderTopWidth: 1,
    borderTopColor: '#EFEFEF',
    paddingTop: SIZES.PADDING.SMALL,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.PADDING.XSMALL,
  },
  detailLabel: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
  },
  detailValue: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SIZES.PADDING.XXXLARGE,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  emptyText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
  },
});

export default PricePolicyManagementScreen;
