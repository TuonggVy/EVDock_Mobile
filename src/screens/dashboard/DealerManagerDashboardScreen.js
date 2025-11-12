import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  TextInput,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BarChart } from 'react-native-gifted-charts';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS, SIZES } from '../../constants';
import { ArrowLeft, Users, DollarSign, Calendar } from 'lucide-react-native';
import dashboardService from '../../services/dashboardService';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import CustomAlert from '../../components/common/CustomAlert';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - (SIZES.PADDING.LARGE * 4);

const DealerManagerDashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { alertConfig, hideAlert, showError } = useCustomAlert();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Card data
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);

  // Chart data
  const [chartData, setChartData] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [yearInput, setYearInput] = useState(new Date().getFullYear().toString());
  const [showYearPicker, setShowYearPicker] = useState(false);

  // Staff revenue table data
  const [staffRevenueList, setStaffRevenueList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageLimit = 10;

  const agencyId = user?.agencyId;

  useEffect(() => {
    if (agencyId) {
      loadDashboardData();
    }
  }, [agencyId, selectedYear, currentPage]);

  const loadDashboardData = async () => {
    if (!agencyId) {
      showError('Error', 'Agency information not found');
      return;
    }

    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [
        totalCustomerRes,
        totalRevenueRes,
        chartRes,
        staffRevenueRes,
      ] = await Promise.all([
        dashboardService.getTotalCustomer(agencyId),
        dashboardService.getTotalRevenue(agencyId),
        dashboardService.getCustomerContractChart(agencyId, selectedYear),
        dashboardService.getStaffRevenueList(agencyId, currentPage, pageLimit),
      ]);

      // Set card data
      setTotalCustomers(totalCustomerRes?.data?.totalCustomers || 0);
      setTotalRevenue(totalRevenueRes?.data?.totalRevenue || 0);

      // Set chart data
      const chartDataArray = chartRes?.data || [];
      setChartData(chartDataArray);

      // Set staff revenue list
      const staffData = staffRevenueRes?.data || [];
      setStaffRevenueList(staffData);
      
      // Set pagination info
      const pagination = staffRevenueRes?.paginationInfo || {};
      setTotalPages(Math.ceil((pagination.total || 0) / pageLimit));
      setTotalItems(pagination.total || 0);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      showError('Error', 'Unable to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
  };

  const handleYearChange = () => {
    const year = parseInt(yearInput);
    if (year >= 2000 && year <= 2100) {
      setSelectedYear(year);
      setShowYearPicker(false);
    } else {
      showError('Error', 'Invalid year. Please enter a year between 2000 and 2100.');
    }
  };

  const formatRevenue = (value) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(2)}M VNĐ`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(2)}K VNĐ`;
    }
    return `${value.toLocaleString('vi-VN')} VNĐ`;
  };

  // Prepare grouped bar chart data for react-native-gifted-charts
  // We'll create 3 separate bar charts or use stacked approach
  const prepareGroupedChartData = () => {
    if (!chartData || chartData.length === 0) return [];

    const monthNames = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
    
    // Find max value for scaling
    const maxValue = Math.max(
      ...chartData.flatMap(item => [
        item.totalContractCompleted || 0,
        item.totalContractDelivered || 0,
        item.totalContractPending || 0,
      ]),
      1 // Ensure at least 1 to avoid division by zero
    );

    // Create data arrays for each series
    const completedData = chartData.map((item) => ({
      value: item.totalContractCompleted || 0,
      label: monthNames[item.month - 1] || `T${item.month}`,
      frontColor: '#4ABFF4',
      spacing: 2,
    }));

    const deliveredData = chartData.map((item) => ({
      value: item.totalContractDelivered || 0,
      label: monthNames[item.month - 1] || `T${item.month}`,
      frontColor: '#4CAF50',
      spacing: 2,
    }));

    const pendingData = chartData.map((item) => ({
      value: item.totalContractPending || 0,
      label: monthNames[item.month - 1] || `T${item.month}`,
      frontColor: '#FF9800',
      spacing: 2,
    }));

    return {
      completed: completedData,
      delivered: deliveredData,
      pending: pendingData,
      maxValue: maxValue,
    };
  };

  const groupedChartData = prepareGroupedChartData();

  const renderStaffRevenueItem = ({ item }) => (
    <View style={styles.tableRow}>
      <View style={[styles.tableCell, styles.tableCellId]}>
        <Text style={styles.tableCellText}>{item.id || '-'}</Text>
      </View>
      <View style={[styles.tableCell, styles.tableCellName]}>
        <Text style={styles.tableCellText}>{item.username || '-'}</Text>
      </View>
      <View style={[styles.tableCell, styles.tableCellEmail]}>
        <Text style={styles.tableCellText} numberOfLines={1}>
          {item.email || '-'}
        </Text>
      </View>
      <View style={[styles.tableCell, styles.tableCellRevenue]}>
        <Text style={[styles.tableCellText, styles.revenueText]}>
          {formatRevenue(item.total_contract_revenue || 0)}
        </Text>
      </View>
    </View>
  );

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <View style={styles.paginationContainer}>
        <TouchableOpacity
          style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
          onPress={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <Text style={[styles.paginationButtonText, currentPage === 1 && styles.paginationButtonTextDisabled]}>
            Previous
          </Text>
        </TouchableOpacity>
        
        <Text style={styles.paginationText}>
          Page {currentPage} / {totalPages}
        </Text>
        
        <TouchableOpacity
          style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
          onPress={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <Text style={[styles.paginationButtonText, currentPage === totalPages && styles.paginationButtonTextDisabled]}>
            Next
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={20} color="#009DFF" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#009DFF" />
          <Text style={styles.loadingText}>Loading data...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={20} color="#009DFF" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.PRIMARY}
            colors={[COLORS.PRIMARY]}
          />
        }
      >
        {/* KPI Cards */}
        <View style={styles.kpiContainer}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.kpiGrid}>
            <View style={styles.kpiCard}>
              <LinearGradient
                colors={['#009DFF', '#009DFF']}
                style={styles.kpiGradient}
              >
                <Users size={32} color={COLORS.TEXT.WHITE} style={styles.kpiIcon} />
                <Text style={styles.kpiNumber}>{totalCustomers}</Text>
                <Text style={styles.kpiLabel}>Total Customers</Text>
              </LinearGradient>
            </View>

            <View style={styles.kpiCard}>
              <LinearGradient
                colors={['#009DFF', '#009DFF']}
                style={styles.kpiGradient}
              >
                <DollarSign size={32} color={COLORS.TEXT.WHITE} style={styles.kpiIcon} />
                <Text style={styles.kpiNumber}>{formatRevenue(totalRevenue)}</Text>
                <Text style={styles.kpiLabel}>Total Revenue</Text>
              </LinearGradient>
            </View>
          </View>
        </View>

        {/* Customer Contract Chart Section */}
        <View style={styles.chartContainer}>
          <View style={styles.chartHeader}>
            <Text style={styles.sectionTitle}>Customer Contract Chart</Text>
            <View style={styles.yearSelector}>
              <TouchableOpacity
                style={styles.yearButton}
                onPress={() => setShowYearPicker(!showYearPicker)}
              >
                <Calendar size={16} color={COLORS.TEXT.WHITE} />
                <Text style={styles.yearButtonText}>{selectedYear}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {showYearPicker && (
            <View style={styles.yearPickerContainer}>
              <TextInput
                style={styles.yearInput}
                value={yearInput}
                onChangeText={setYearInput}
                keyboardType="numeric"
                placeholder="Enter year"
                placeholderTextColor={COLORS.TEXT.SECONDARY}
              />
              <TouchableOpacity
                style={styles.yearConfirmButton}
                onPress={handleYearChange}
              >
                <Text style={styles.yearConfirmButtonText}>Confirm</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.yearCancelButton}
                onPress={() => {
                  setShowYearPicker(false);
                  setYearInput(selectedYear.toString());
                }}
              >
                <Text style={styles.yearCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.chartCardDark}>
            {groupedChartData.completed && groupedChartData.completed.length > 0 ? (
              <>
                <View style={styles.chartLegend}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: '#4ABFF4' }]} />
                    <Text style={styles.legendText}>Completed</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: '#4CAF50' }]} />
                    <Text style={styles.legendText}>Delivered</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: '#FF9800' }]} />
                    <Text style={styles.legendText}>Pending</Text>
                  </View>
                </View>
                <View style={styles.chartScrollContainer}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={true}
                    contentContainerStyle={styles.chartScrollContent}
                    style={styles.chartScrollView}
                  >
                    <BarChart
                      data={groupedChartData.completed}
                      width={Math.max(CHART_WIDTH, groupedChartData.completed.length * 60)}
                      height={200}
                      showFractionalValue
                      showYAxisIndices
                      noOfSections={4}
                      maxValue={groupedChartData.maxValue * 1.2 || 10}
                      isAnimated
                      yAxisTextStyle={{ color: '#FFFFFF', fontSize: 12 }}
                      xAxisLabelTextStyle={{ color: '#FFFFFF', fontSize: 10 }}
                      yAxisColor="rgba(255, 255, 255, 0.3)"
                      xAxisColor="rgba(255, 255, 255, 0.3)"
                      rulesColor="rgba(255, 255, 255, 0.2)"
                      textColor="#FFFFFF"
                      textFontSize={12}
                      spacing={20}
                      initialSpacing={10}
                    />
                  </ScrollView>
                </View>
                <View style={styles.chartNote}>
                  <Text style={styles.chartNoteText}>
                    * Chart shows Completed contracts. Use legend to understand all series.
                  </Text>
                </View>
              </>
            ) : (
              <View style={styles.emptyChart}>
                <Text style={styles.emptyChartTextLight}>No data</Text>
              </View>
            )}
          </View>
        </View>

        {/* Staff Revenue Table Section */}
        <View style={styles.chartContainer}>
          <Text style={styles.sectionTitle}>Staff Revenue</Text>
          <View style={styles.tableCard}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <View style={[styles.tableHeaderCell, styles.tableCellId]}>
                <Text style={styles.tableHeaderText}>ID</Text>
              </View>
              <View style={[styles.tableHeaderCell, styles.tableCellName]}>
                <Text style={styles.tableHeaderText}>Name</Text>
              </View>
              <View style={[styles.tableHeaderCell, styles.tableCellEmail]}>
                <Text style={styles.tableHeaderText}>Email</Text>
              </View>
              <View style={[styles.tableHeaderCell, styles.tableCellRevenue]}>
                <Text style={styles.tableHeaderText}>Revenue</Text>
              </View>
            </View>

            {/* Table Body */}
            {staffRevenueList.length > 0 ? (
              <>
                <FlatList
                  data={staffRevenueList}
                  keyExtractor={(item, index) => item.id?.toString() || index.toString()}
                  renderItem={renderStaffRevenueItem}
                  scrollEnabled={false}
                  ListEmptyComponent={
                    <View style={styles.emptyTable}>
                      <Text style={styles.emptyTableText}>No data</Text>
                    </View>
                  }
                />
                {renderPagination()}
              </>
            ) : (
              <View style={styles.emptyTable}>
                <Text style={styles.emptyTableText}>No data</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
      <CustomAlert {...alertConfig} onClose={hideAlert} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
  },
  loadingText: {
    marginTop: SIZES.PADDING.MEDIUM,
    color: COLORS.TEXT.WHITE,
    fontSize: SIZES.FONT.MEDIUM,
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.PADDING.SMALL,
    gap: 4,
  },
  backButtonText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: "#009DFF",
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: SIZES.FONT.XXLARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 80,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SIZES.PADDING.LARGE,
    paddingTop: SIZES.PADDING.MEDIUM,
    paddingBottom: SIZES.PADDING.XXXLARGE,
  },
  kpiContainer: {
    marginBottom: SIZES.PADDING.XLARGE,
  },
  sectionTitle: {
    fontSize: SIZES.FONT.LARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  kpiCard: {
    width: '48%',
    marginBottom: SIZES.PADDING.MEDIUM,
    borderRadius: SIZES.RADIUS.LARGE,
    overflow: 'hidden',
  },
  kpiGradient: {
    padding: SIZES.PADDING.LARGE,
    alignItems: 'center',
    borderRadius: SIZES.RADIUS.LARGE,
    minHeight: 100,
    justifyContent: 'center',
  },
  kpiIcon: {
    marginBottom: SIZES.PADDING.SMALL,
  },
  kpiNumber: {
    fontSize: SIZES.FONT.XXLARGE,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
    marginBottom: SIZES.PADDING.XSMALL,
  },
  kpiLabel: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.WHITE,
    opacity: 0.9,
  },
  chartContainer: {
    marginBottom: SIZES.PADDING.XLARGE,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  yearSelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  yearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.BACKGROUND.SECONDARY,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    borderRadius: SIZES.RADIUS.MEDIUM,
    gap: SIZES.PADDING.XSMALL,
    borderWidth: 1,
    borderColor: COLORS.BORDER.PRIMARY,
  },
  yearButtonText: {
    color: COLORS.TEXT.WHITE,
    fontSize: SIZES.FONT.MEDIUM,
  },
  yearPickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.PADDING.MEDIUM,
    gap: SIZES.PADDING.SMALL,
  },
  yearInput: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND.SECONDARY,
    borderWidth: 1,
    borderColor: COLORS.BORDER.PRIMARY,
    borderRadius: SIZES.RADIUS.MEDIUM,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    color: COLORS.TEXT.WHITE,
    fontSize: SIZES.FONT.MEDIUM,
  },
  yearConfirmButton: {
    backgroundColor: "#009DFF",
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    borderRadius: SIZES.RADIUS.MEDIUM,
  },
  yearConfirmButtonText: {
    color: COLORS.TEXT.WHITE,
    fontSize: SIZES.FONT.MEDIUM,
    fontWeight: '600',
  },
  yearCancelButton: {
    backgroundColor: COLORS.BACKGROUND.SECONDARY,
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    borderRadius: SIZES.RADIUS.MEDIUM,
    borderWidth: 1,
    borderColor: COLORS.BORDER.PRIMARY,
  },
  yearCancelButtonText: {
    color: COLORS.TEXT.WHITE,
    fontSize: SIZES.FONT.MEDIUM,
  },
  chartCardDark: {
    backgroundColor: COLORS.BACKGROUND.SECONDARY,
    borderRadius: SIZES.RADIUS.LARGE,
    padding: SIZES.PADDING.LARGE,
    alignItems: 'center',
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  chartScrollContainer: {
    width: '100%',
    maxWidth: CHART_WIDTH,
    overflow: 'hidden',
  },
  chartScrollView: {
    width: '100%',
  },
  chartScrollContent: {
    paddingRight: SIZES.PADDING.MEDIUM,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: SIZES.PADDING.MEDIUM,
    gap: SIZES.PADDING.LARGE,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.PADDING.XSMALL,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendText: {
    color: COLORS.TEXT.WHITE,
    fontSize: SIZES.FONT.SMALL,
  },
  chartNote: {
    marginTop: SIZES.PADDING.MEDIUM,
    paddingTop: SIZES.PADDING.MEDIUM,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER.PRIMARY,
  },
  chartNoteText: {
    color: COLORS.TEXT.SECONDARY,
    fontSize: SIZES.FONT.XSMALL,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  emptyChart: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyChartTextLight: {
    fontSize: SIZES.FONT.MEDIUM,
    color: '#FFFFFF',
  },
  tableCard: {
    backgroundColor: COLORS.BACKGROUND.SECONDARY,
    borderRadius: SIZES.RADIUS.LARGE,
    borderWidth: 1,
    borderColor: COLORS.BORDER.PRIMARY,
    overflow: 'hidden',
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER.PRIMARY,
  },
  tableHeaderCell: {
    padding: SIZES.PADDING.MEDIUM,
    borderRightWidth: 1,
    borderRightColor: COLORS.BORDER.PRIMARY,
  },
  tableHeaderText: {
    fontSize: SIZES.FONT.SMALL,
    fontWeight: 'bold',
    color: COLORS.TEXT.WHITE,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER.PRIMARY,
  },
  tableCell: {
    padding: SIZES.PADDING.MEDIUM,
    borderRightWidth: 1,
    borderRightColor: COLORS.BORDER.PRIMARY,
    justifyContent: 'center',
  },
  tableCellId: {
    width: 60,
  },
  tableCellName: {
    flex: 1,
    minWidth: 80,
  },
  tableCellEmail: {
    flex: 1.5,
    minWidth: 120,
  },
  tableCellRevenue: {
    flex: 1,
    minWidth: 100,
    alignItems: 'flex-start',
  },
  tableCellText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.WHITE,
  },
  revenueText: {
    fontWeight: '600',
    color: COLORS.SUCCESS,
  },
  emptyTable: {
    padding: SIZES.PADDING.XLARGE,
    alignItems: 'center',
  },
  emptyTableText: {
    color: COLORS.TEXT.SECONDARY,
    fontSize: SIZES.FONT.MEDIUM,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.PADDING.MEDIUM,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER.PRIMARY,
  },
  paginationButton: {
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: SIZES.RADIUS.MEDIUM,
  },
  paginationButtonDisabled: {
    backgroundColor: COLORS.BACKGROUND.SECONDARY,
    opacity: 0.5,
  },
  paginationButtonText: {
    color: COLORS.TEXT.WHITE,
    fontSize: SIZES.FONT.SMALL,
    fontWeight: '600',
  },
  paginationButtonTextDisabled: {
    color: COLORS.TEXT.SECONDARY,
  },
  paginationText: {
    color: COLORS.TEXT.WHITE,
    fontSize: SIZES.FONT.SMALL,
  },
  bottomPadding: {
    height: SIZES.PADDING.XXXLARGE,
  },
});

export default DealerManagerDashboardScreen;

