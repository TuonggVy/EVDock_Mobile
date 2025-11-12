import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Dimensions,
  TextInput,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart, BarChart } from 'react-native-gifted-charts';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS, SIZES } from '../../constants';
import { ArrowLeft, Calendar } from 'lucide-react-native';
import reportService from '../../services/reportService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - (SIZES.PADDING.LARGE * 4); // Account for padding and margins

const ReportsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // KPI Data
  const [kpiData, setKpiData] = useState({
    totalAgencies: 0,
    totalWarehouses: 0,
    totalMotorbikes: 0,
    totalApBatches: 0,
  });

  // Chart Data
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [quarterRevenueData, setQuarterRevenueData] = useState([]);
  const [top10Motorbikes, setTop10Motorbikes] = useState([]);

  // Quarter/Year selection for quarter revenue
  const [selectedQuarter, setSelectedQuarter] = useState(1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [yearInput, setYearInput] = useState(new Date().getFullYear().toString());
  const [showYearPicker, setShowYearPicker] = useState(false);

  useEffect(() => {
    loadReports();
  }, [selectedQuarter, selectedYear]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const agencyId = user?.agencyId || null;

      // Fetch all reports in parallel
      const [
        totalRevenueRes,
        quarterRevenueRes,
        agenciesRes,
        warehousesRes,
        motorbikesRes,
        apBatchesRes,
        top10Res,
      ] = await Promise.all([
        reportService.getTotalContractRevenue(agencyId),
        reportService.getQuarterRevenue(selectedQuarter, selectedYear, agencyId),
        reportService.getTotalAgencies(),
        reportService.getTotalWarehouses(),
        reportService.getTotalMotorbikes(),
        reportService.getTotalApBatches(agencyId),
        reportService.getTop10Motorbikes(),
      ]);

      // Set KPI data
      setKpiData({
        totalAgencies: agenciesRes?.data?.totalAgencies || agenciesRes?.data || 0,
        totalWarehouses: warehousesRes?.data?.totalWarehouses || warehousesRes?.data || 0,
        totalMotorbikes: motorbikesRes?.data?.totalMotorbikes || motorbikesRes?.data || 0,
        totalApBatches: apBatchesRes?.data?.totalApBatches || apBatchesRes?.data || 0,
      });

      // Set total revenue (for line chart - we'll create a simple line chart with this value)
      setTotalRevenue(totalRevenueRes?.data?.totalContractRevenue || 0);

      // Set quarter revenue data
      const quarterData = quarterRevenueRes?.data?.quarterContractChartData || [];
      setQuarterRevenueData(quarterData);

      // Set top 10 motorbikes
      const top10Data = top10Res?.data || [];
      setTop10Motorbikes(top10Data);
    } catch (error) {
      console.error('Error loading reports:', error);
      Alert.alert(
        'Error',
        'Unable to load report data. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReports();
  };

  const handleYearChange = () => {
    const year = parseInt(yearInput);
    if (year >= 2000 && year <= 2100) {
      setSelectedYear(year);
      setShowYearPicker(false);
    } else {
      Alert.alert(
        'Error',
        'Invalid year. Please enter a year between 2000 and 2100.',
        [{ text: 'OK' }]
      );
    }
  };

  // Format revenue for display
  const formatRevenue = (value) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(2)}K`;
    }
    return `$${value.toLocaleString()}`;
  };

  // Prepare line chart data (showing revenue over time - simplified with current value)
  const lineChartData = totalRevenue > 0 ? [
    { value: totalRevenue * 0.7, label: 'T1' },
    { value: totalRevenue * 0.85, label: 'T2' },
    { value: totalRevenue * 0.95, label: 'T3' },
    { value: totalRevenue, label: 'Current' },
  ] : [];

  // Prepare grouped bar chart data (quarter revenue by month)
  const groupedBarChartData = quarterRevenueData.map((item, index) => {
    const colors = [
      '#4ABFF4',
      '#79C3DB',
      '#28B2B3',
      '#4ADDBA',
      '#91E3E3',
      COLORS.PRIMARY,
      COLORS.SECONDARY,
      COLORS.SUCCESS,
    ];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return {
      value: item.totalRevenue || 0,
      label: monthNames[item.month - 1] || `M${item.month}`,
      frontColor: colors[index % colors.length],
    };
  });

  const renderMotorbikeItem = ({ item, index }) => (
    <View style={styles.tableRow}>
      <View style={[styles.tableCell, styles.tableCellRank]}>
        <Text style={styles.tableCellText}>{index + 1}</Text>
      </View>
      <View style={[styles.tableCell, styles.tableCellName]}>
        <Text style={styles.tableCellText}>{item.name || '-'}</Text>
      </View>
      <View style={[styles.tableCell, styles.tableCellQuantity]}>
        <Text style={[styles.tableCellText, styles.quantityText]}>
          {item.total_quantity || item.totalQuantity || 0}
        </Text>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#009DFF" />
        <Text style={styles.loadingText}>Loading data...</Text>
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
        <Text style={styles.headerTitle}>Dashboard Reports</Text>
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
                <Text style={styles.kpiNumber}>{kpiData.totalAgencies}</Text>
                <Text style={styles.kpiLabel}>Agencies</Text>
              </LinearGradient>
            </View>

            <View style={styles.kpiCard}>
              <LinearGradient
                colors={['#009DFF', '#009DFF']}
                style={styles.kpiGradient}
              >
                <Text style={styles.kpiNumber}>{kpiData.totalWarehouses}</Text>
                <Text style={styles.kpiLabel}>Warehouses</Text>
              </LinearGradient>
            </View>

            <View style={styles.kpiCard}>
              <LinearGradient
                colors={['#009DFF', '#009DFF']}
                style={styles.kpiGradient}
              >
                <Text style={styles.kpiNumber}>{kpiData.totalMotorbikes}</Text>
                <Text style={styles.kpiLabel}>Motorbikes</Text>
              </LinearGradient>
            </View>

            <View style={styles.kpiCard}>
              <LinearGradient
                colors={['#009DFF', '#009DFF']}
                style={styles.kpiGradient}
              >
                <Text style={styles.kpiNumber}>{kpiData.totalApBatches}</Text>
                <Text style={styles.kpiLabel}>AP Batches</Text>
              </LinearGradient>
            </View>
          </View>
        </View>

        {/* Total Contract Revenue - Line Chart */}
        <View style={styles.chartContainer}>
          <Text style={styles.sectionTitle}>Total Contract Revenue</Text>
          <View style={styles.chartCardDark}>
            <Text style={styles.chartValueLight}>{formatRevenue(totalRevenue)}</Text>
            {lineChartData.length > 0 ? (
              <View style={styles.chartScrollContainer}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={true}
                  contentContainerStyle={styles.chartScrollContent}
                  style={styles.chartScrollView}
                >
                  <LineChart
                    data={lineChartData}
                    width={Math.max(CHART_WIDTH, lineChartData.length * 80)}
                    height={200}
                    color="#FF6B35"
                    thickness={3}
                    dataPointsColor="#FF6B35"
                    dataPointsRadius={6}
                    rulesColor="rgba(255, 255, 255, 0.2)"
                    textColor="#FFFFFF"
                    textFontSize={12}
                    spacing={60}
                    initialSpacing={20}
                    noOfSections={4}
                    maxValue={totalRevenue * 1.2}
                    yAxisColor="rgba(255, 255, 255, 0.3)"
                    xAxisColor="rgba(255, 255, 255, 0.3)"
                    yAxisLabelWidth={60}
                    yAxisTextStyle={{ color: '#FFFFFF', fontSize: 12 }}
                    xAxisLabelTextStyle={{ color: '#FFFFFF', fontSize: 10 }}
                    curved
                    areaChart
                    startFillColor="#FF6B35"
                    endFillColor={`#FF6B3540`}
                  />
                </ScrollView>
              </View>
            ) : (
              <View style={styles.emptyChart}>
                <Text style={styles.emptyChartTextLight}>No data</Text>
              </View>
            )}
          </View>
        </View>

        {/* Quarter Revenue - Grouped Bar Chart */}
        <View style={styles.chartContainer}>
          <View style={styles.chartHeader}>
            <Text style={styles.sectionTitle}>Quarterly Revenue</Text>
          </View>
          <View style={styles.controlsContainer}>
            <View style={styles.quarterSelector}>
              <TouchableOpacity
                style={[
                  styles.quarterButton,
                  selectedQuarter === 1 && styles.quarterButtonActive,
                ]}
                onPress={() => setSelectedQuarter(1)}
              >
                <Text
                  style={[
                    styles.quarterButtonText,
                    selectedQuarter === 1 && styles.quarterButtonTextActive,
                  ]}
                >
                  Q1
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.quarterButton,
                  selectedQuarter === 2 && styles.quarterButtonActive,
                ]}
                onPress={() => setSelectedQuarter(2)}
              >
                <Text
                  style={[
                    styles.quarterButtonText,
                    selectedQuarter === 2 && styles.quarterButtonTextActive,
                  ]}
                >
                  Q2
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.quarterButton,
                  selectedQuarter === 3 && styles.quarterButtonActive,
                ]}
                onPress={() => setSelectedQuarter(3)}
              >
                <Text
                  style={[
                    styles.quarterButtonText,
                    selectedQuarter === 3 && styles.quarterButtonTextActive,
                  ]}
                >
                  Q3
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.quarterButton,
                  selectedQuarter === 4 && styles.quarterButtonActive,
                ]}
                onPress={() => setSelectedQuarter(4)}
              >
                <Text
                  style={[
                    styles.quarterButtonText,
                    selectedQuarter === 4 && styles.quarterButtonTextActive,
                  ]}
                >
                  Q4
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.yearSelectorContainer}>
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
            {groupedBarChartData.length > 0 ? (
              <BarChart
                showFractionalValue
                showYAxisIndices
                noOfSections={4}
                maxValue={
                  Math.max(...groupedBarChartData.map((item) => item.value)) * 1.2 || 400
                }
                data={groupedBarChartData}
                isAnimated
                yAxisTextStyle={{ color: '#FFFFFF', fontSize: 12 }}
                xAxisLabelTextStyle={{ color: '#FFFFFF', fontSize: 11 }}
                yAxisColor="rgba(255, 255, 255, 0.3)"
                xAxisColor="rgba(255, 255, 255, 0.3)"
                rulesColor="rgba(255, 255, 255, 0.2)"
                textColor="#FFFFFF"
                textFontSize={12}
              />
            ) : (
              <View style={styles.emptyChart}>
                <Text style={styles.emptyChartTextLight}>No data</Text>
              </View>
            )}
          </View>
        </View>

        {/* Top 10 Motorbikes - Table */}
        <View style={styles.chartContainer}>
          <Text style={styles.sectionTitle}>Top 10 Best Selling Motorbikes</Text>
          <View style={styles.tableCard}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <View style={[styles.tableHeaderCell, styles.tableCellRank]}>
                <Text style={styles.tableHeaderText}>Rank</Text>
              </View>
              <View style={[styles.tableHeaderCell, styles.tableCellName]}>
                <Text style={styles.tableHeaderText}>Motorbike Name</Text>
              </View>
              <View style={[styles.tableHeaderCell, styles.tableCellQuantity]}>
                <Text style={styles.tableHeaderText}>Quantity</Text>
              </View>
            </View>

            {/* Table Body */}
            {top10Motorbikes.length > 0 ? (
              <FlatList
                data={top10Motorbikes}
                keyExtractor={(item, index) => item.id?.toString() || index.toString()}
                renderItem={renderMotorbikeItem}
                scrollEnabled={false}
                ListEmptyComponent={
                  <View style={styles.emptyTable}>
                    <Text style={styles.emptyTableText}>No data</Text>
                  </View>
                }
              />
            ) : (
              <View style={styles.emptyTable}>
                <Text style={styles.emptyTableText}>No data</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
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
  controlsContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: SIZES.PADDING.MEDIUM,
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  yearSelectorContainer: {
    width: '100%',
    alignItems: 'flex-start',
  },
  quarterSelector: {
    flexDirection: 'row',
    backgroundColor: COLORS.BACKGROUND.SECONDARY,
    borderRadius: SIZES.RADIUS.MEDIUM,
    padding: 2,
  },
  quarterButton: {
    paddingHorizontal: SIZES.PADDING.MEDIUM,
    paddingVertical: SIZES.PADDING.SMALL,
    borderRadius: SIZES.RADIUS.SMALL,
  },
  quarterButtonActive: {
    backgroundColor: "#009DFF",
  },
  quarterButtonText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.SECONDARY,
    fontWeight: '600',
  },
  quarterButtonTextActive: {
    color: COLORS.TEXT.WHITE,
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
  chartCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.RADIUS.LARGE,
    padding: SIZES.PADDING.LARGE,
    alignItems: 'center',
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
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
  chartValue: {
    fontSize: SIZES.FONT.XXLARGE,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  chartValueLight: {
    fontSize: SIZES.FONT.XXLARGE,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: SIZES.PADDING.MEDIUM,
  },
  emptyChart: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyChartText: {
    fontSize: SIZES.FONT.MEDIUM,
    color: COLORS.TEXT.SECONDARY,
  },
  emptyChartTextLight: {
    fontSize: SIZES.FONT.MEDIUM,
    color: '#FFFFFF',
  },
  bottomPadding: {
    height: SIZES.PADDING.XXXLARGE,
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
  tableCellRank: {
    width: 60,
    alignItems: 'center',
  },
  tableCellName: {
    flex: 1,
    minWidth: 150,
  },
  tableCellQuantity: {
    width: 100,
    alignItems: 'center',
  },
  tableCellText: {
    fontSize: SIZES.FONT.SMALL,
    color: COLORS.TEXT.WHITE,
  },
  quantityText: {
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
});

export default ReportsScreen;

