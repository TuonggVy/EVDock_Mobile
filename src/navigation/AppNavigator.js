import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../contexts/AuthContext';
import { USER_ROLES } from '../constants';
import CustomTabBar from '../components/common/CustomTabBar';

// Import screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import EVMAdminHomeScreen from '../screens/home/EVMAdminHomeScreen';
import EVMStaffHomeScreen from '../screens/home/EVMStaffHomeScreen';
import DealerManagerHomeScreen from '../screens/home/ManagerHomeScreen';
import DealerStaffHomeScreen from '../screens/home/EmployeeHomeScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import CatalogScreen from '../screens/catalog/CatalogScreen';
import VehicleDetailScreen from '../screens/vehicle/VehicleDetailScreen';
import CompareScreen from '../screens/compare/CompareScreen';
import CreateQuotationScreen from '../screens/quotation/CreateQuotationScreen';
import QuotationDetailScreen from '../screens/quotation/QuotationDetailScreen';
import QuotationManagementScreen from '../screens/quotation/QuotationManagementScreen';
import ContractScreen from '../screens/contract/ContractScreen';
import CustomerManagementScreen from '../screens/customer/CustomerManagementScreen';
import PromotionManagementScreen from '../screens/promotion/PromotionManagementScreen';
import OrderManagementScreen from '../screens/order/OrderManagementScreen';
import AllocationManagementScreen from '../screens/allocation/AllocationManagementScreen';
import InventoryManagementScreen from '../screens/inventory/InventoryManagementScreen';
import AddInventoryScreen from '../screens/inventory/AddInventoryScreen';
import EditInventoryScreen from '../screens/inventory/EditInventoryScreen';
import DealerManagementScreen from '../screens/dealer/DealerManagementScreen';
import PricingManagementScreen from '../screens/pricing/PricingManagementScreen';
import RetailPricingScreen from '../screens/pricing/RetailPricingScreen';
import AddProductScreen from '../screens/product/AddProductScreen';
import EditProductScreen from '../screens/product/EditProductScreen';
import ProductDetailScreen from '../screens/product/ProductDetailScreen';
import ProductManagementScreen from '../screens/product/ProductManagementScreen';
import AddPromotionScreen from '../screens/promotion/AddPromotionScreen';
import EditPromotionScreen from '../screens/promotion/EditPromotionScreen';
import PromotionDetailScreen from '../screens/promotion/PromotionDetailScreen';
import DealerPromotionManagementScreen from '../screens/promotion/DealerPromotionManagementScreen';
import AddDealerPromotionScreen from '../screens/promotion/AddDealerPromotionScreen';
import EditDealerPromotionScreen from '../screens/promotion/EditDealerPromotionScreen';
import DealerPromotionDetailScreen from '../screens/promotion/DealerPromotionDetailScreen';
import CustomerDebtManagementScreen from '../screens/debt/CustomerDebtManagementScreen';
import ManufacturerDebtManagementScreen from '../screens/debt/ManufacturerDebtManagementScreen';
import InstallmentManagementScreen from '../screens/installment/InstallmentManagementScreen';
import InstallmentDetailScreen from '../screens/installment/InstallmentDetailScreen';
import DepositManagementScreen from '../screens/deposit/DepositManagementScreen';
import CreateDepositAvailableScreen from '../screens/deposit/CreateDepositAvailableScreen';
import CreatePreOrderScreen from '../screens/deposit/CreatePreOrderScreen';
import DepositDetailScreen from '../screens/deposit/DepositDetailScreen';
import PreOrderTasksScreen from '../screens/evm/PreOrderTasksScreen';
import StaffManagementScreen from '../screens/staff/StaffManagementScreen';
import WarehouseManagementScreen from '../screens/warehouse/WarehouseManagementScreen';
import WarehouseDetailScreen from '../screens/warehouse/WarehouseDetailScreen';
import AddWarehouseScreen from '../screens/warehouse/AddWarehouseScreen';
import EditWarehouseScreen from '../screens/warehouse/EditWarehouseScreen';

// Import loading component
import LoadingScreen from '../components/common/LoadingScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Main Tab Navigator Component
const MainTabNavigator = () => {
  const { user } = useAuth();

  // Get the appropriate home screen component based on user role
  const getHomeScreenComponent = () => {
    switch (user?.role) {
      case USER_ROLES.EVM_ADMIN:
        return EVMAdminHomeScreen;
      case USER_ROLES.EVM_STAFF:
        return EVMStaffHomeScreen;
      case USER_ROLES.DEALER_MANAGER:
        return DealerManagerHomeScreen;
      case USER_ROLES.DEALER_STAFF:
        return DealerStaffHomeScreen;
      default:
        return DealerStaffHomeScreen; // Default to Dealer Staff screen
    }
  };

  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={getHomeScreenComponent()}
        options={{
          tabBarAccessibilityLabel: 'Home',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarAccessibilityLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Debug log
  console.log('AppNavigator - isAuthenticated:', isAuthenticated, 'user:', user);

  // Show loading screen while checking authentication
  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false, // Hide header for all screens
        }}
      >
        {!isAuthenticated ? (
          // Auth Stack - when user is not authenticated
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          // Main Stack - when user is authenticated, show tab navigator
          <>
            <Stack.Screen 
              name="Main" 
              component={MainTabNavigator} 
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Catalog" 
              component={CatalogScreen} 
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="VehicleDetail" 
              component={VehicleDetailScreen} 
              options={{ headerShown: false }}
            />
        <Stack.Screen 
          name="Compare" 
          component={CompareScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="CreateQuotation" 
          component={CreateQuotationScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="QuotationDetail" 
          component={QuotationDetailScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Contract" 
          component={ContractScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="QuotationManagement" 
          component={QuotationManagementScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="CustomerManagement" 
          component={CustomerManagementScreen} 
          options={{ headerShown: false }}
        />
            <Stack.Screen
              name="B2BPromotionManagement"
              component={PromotionManagementScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="PromotionManagement"
              component={PromotionManagementScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="OrderManagement"
              component={OrderManagementScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="AllocationManagement"
              component={AllocationManagementScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="InventoryManagement"
              component={InventoryManagementScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="AddInventory"
              component={AddInventoryScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="EditInventory"
              component={EditInventoryScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="DealerManagement"
              component={DealerManagementScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="PricingManagement"
              component={PricingManagementScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="RetailPricing"
              component={RetailPricingScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="VehicleManagement"
              component={ProductManagementScreen}
              options={{ headerShown: false }}
            />
        <Stack.Screen 
          name="PreOrderTasks" 
          component={PreOrderTasksScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="StaffManagement" 
          component={StaffManagementScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="WarehouseManagement" 
          component={WarehouseManagementScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="WarehouseDetail" 
          component={WarehouseDetailScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="AddWarehouse" 
          component={AddWarehouseScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="EditWarehouse" 
          component={EditWarehouseScreen} 
          options={{ headerShown: false }}
        />
            <Stack.Screen 
              name="AddProduct"
              component={AddProductScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="EditProduct"
              component={EditProductScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="ProductDetail"
              component={ProductDetailScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="B2CPromotionManagement"
              component={DealerPromotionManagementScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="AddB2BPromotion"
              component={AddPromotionScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="EditB2BPromotion"
              component={EditPromotionScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="B2BPromotionDetail"
              component={PromotionDetailScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="AddB2CPromotion"
              component={AddDealerPromotionScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="EditB2CPromotion"
              component={EditDealerPromotionScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="B2CPromotionDetail"
              component={DealerPromotionDetailScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="CustomerDebtManagement"
              component={CustomerDebtManagementScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="ManufacturerDebtManagement"
              component={ManufacturerDebtManagementScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="InstallmentManagement"
              component={InstallmentManagementScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="InstallmentDetail"
              component={InstallmentDetailScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="DepositManagement"
              component={DepositManagementScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="CreateDepositAvailable"
              component={CreateDepositAvailableScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="CreatePreOrder"
              component={CreatePreOrderScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="DepositDetail"
              component={DepositDetailScreen}
              options={{ headerShown: false }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
