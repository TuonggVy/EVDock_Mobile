// User Roles and Permissions for EVDock
export const USER_ROLES = {
  EVM_ADMIN: 'evm_admin',
  EVM_STAFF: 'evm_staff', 
  DEALER_MANAGER: 'dealer_manager',
  DEALER_STAFF: 'dealer_staff',
};

// Role-based permissions
export const PERMISSIONS = {
  // EVM Admin permissions - Toàn quyền quản lý hệ thống
  EVM_ADMIN: [
    'full_access',
    'manage_wholesale_prices',
    'manage_discounts_promotions',
    'manage_contracts',
    'manage_sales_targets',
    'manage_dealers',
    'view_comprehensive_reports',
    'view_sales_reports',
    'view_inventory_reports',
    'view_ai_forecast',
    'manage_ev_catalog',
    'manage_inventory',
    'coordinate_vehicles',
  ],
  // EVM Staff permissions - Quản lý danh mục và tồn kho
  EVM_STAFF: [
    'manage_total_inventory',
    'coordinate_vehicles_dealers',
    'view_inventory_reports',
    'manage_preorder_tasks',
  ],
  // Dealer Manager permissions - Quản lý đại lý
  DEALER_MANAGER: [
    'dealer_staff_permissions',
    'manage_ev_catalog_dealer',
    'manage_promotions_dealer',
    'order_vehicles_manufacturer',
    'track_vehicle_delivery',
    'manage_payments',
    'view_sales_reports_employee',
    'manage_customer_debts',
    'manage_manufacturer_debts',
  ],
  // Dealer Staff permissions - Nhân viên đại lý
  DEALER_STAFF: [
    'query_vehicles',
    'compare_models',
    'view_prices',
    'create_quotes',
    'create_contracts',
    'create_orders',
    'manage_individual_customers',
    'manage_customer_info',
    'manage_test_drives',
    'manage_customer_feedback',
  ],
};

// Role display names
export const ROLE_DISPLAY_NAMES = {
  [USER_ROLES.EVM_ADMIN]: 'EVM Admin',
  [USER_ROLES.EVM_STAFF]: 'EVM Staff',
  [USER_ROLES.DEALER_MANAGER]: 'Dealer Manager',
  [USER_ROLES.DEALER_STAFF]: 'Dealer Staff',
};

// Check if user has specific permission
export const hasPermission = (userRole, permission) => {
  const rolePermissions = PERMISSIONS[userRole];
  return rolePermissions && rolePermissions.includes(permission);
};

// Get all permissions for a role
export const getRolePermissions = (userRole) => {
  return PERMISSIONS[userRole] || [];
};
