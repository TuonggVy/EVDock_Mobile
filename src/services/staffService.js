import { API_BASE_URL } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Staff Management Service
class StaffService {
  constructor() {
    this.baseURL = `${API_BASE_URL}/staff`;
  }

  // Async method to get auth token
  async getAuthTokenAsync() {
    try {
      const token = await AsyncStorage.getItem('token');
      return token;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  // Get all staff members
  async getStaffList(filters = {}, page = 1, limit = 10) {
    try {
      const queryParams = new URLSearchParams();
      
      // Add pagination parameters
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());
      
      // Only add role filter if specified (by default, don't filter to get all staff)
      if (filters.role) queryParams.append('role', filters.role);
      
      // Other optional filters
      if (filters.department) queryParams.append('department', filters.department);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.search) queryParams.append('search', filters.search);

      let token = await this.getAuthTokenAsync();
      const url = `${API_BASE_URL}/admin/staff/list?${queryParams}`;
      
      console.log('Staff API Request:', {
        url,
        page,
        limit,
        hasToken: !!token,
      });

      // Use the admin/staff/list endpoint for getting staff list
      let response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('Staff API Response:', response.status, response.statusText);

      // Handle token expiration - try to refresh token and retry
      if (response.status === 401) {
        console.log('Token expired, attempting to refresh...');
        const refreshedToken = await this.refreshToken();
        if (refreshedToken) {
          console.log('Token refreshed successfully, retrying request...');
          response = await fetch(url, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${refreshedToken}`,
            },
          });
          console.log('Staff API Response (after refresh):', response.status, response.statusText);
        }
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Staff API Error:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Staff API Data:', data);
      
      // Parse staff list with proper field mapping
      const staffList = (data.staff || data.data || []).map(staff => ({
        id: staff.id,
        username: staff.username,
        fullname: staff.fullname,
        email: staff.email || '',
        phone: staff.phone || '',
        address: staff.address || '',
        isActive: staff.isActive !== undefined ? staff.isActive : true,
        isDeleted: staff.isDeleted || false,
        roleNames: staff.roleNames || staff.roles || [],
        role: staff.role || [], // Role IDs
        agencyId: staff.agencyId || staff.agency_id || staff.AgencyId || null, // Agency ID (check multiple possible field names)
        status: staff.isActive ? 'active' : 'inactive',
        createdAt: staff.createdAt || staff.created_at,
        updatedAt: staff.updatedAt || staff.updated_at,
      }));
      
      return {
        success: true,
        data: staffList,
        total: data.total || staffList.length,
        page: data.page || page,
        limit: data.limit || limit,
      };
    } catch (error) {
      console.error('Error fetching staff list:', error);
      console.error('Full error details:', {
        message: error.message,
        stack: error.stack,
        url: `${API_BASE_URL}/admin/staff/list`,
        API_BASE_URL,
      });
      return {
        success: false,
        error: error.message,
        data: [],
      };
    }
  }

  // Get staff by ID
  async getStaffById(staffId) {
    try {
      const token = await this.getAuthTokenAsync();
      
      const response = await fetch(`${API_BASE_URL}/admin/staff/${staffId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.staff,
      };
    } catch (error) {
      console.error('Error fetching staff:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Create new staff account
  async createStaff(staffData) {
    try {
      const token = await this.getAuthTokenAsync();

      // Use the admin/staff endpoint for creating staff
      const response = await fetch(`${API_BASE_URL}/admin/staff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: staffData.username,
          password: staffData.password || this.generateDefaultPassword(),
          fullname: staffData.fullname,
          email: staffData.email,
          phone: staffData.phone,
          address: staffData.address || '',
          role: staffData.role, // Should be an array of role IDs
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.staff,
        message: 'Tài khoản nhân viên đã được tạo thành công',
      };
    } catch (error) {
      console.error('Error creating staff:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Update staff information
  async updateStaff(staffId, staffData) {
    try {
      const token = await this.getAuthTokenAsync();
      
      // Use the correct endpoint according to the API documentation: PATCH /admin/staff/{staffId}
      const response = await fetch(`${API_BASE_URL}/admin/staff/${staffId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: staffData.username,
          fullname: staffData.fullname,
          email: staffData.email,
          phone: staffData.phone,
          address: staffData.address,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.staff,
        message: 'Thông tin nhân viên đã được cập nhật',
      };
    } catch (error) {
      console.error('Error updating staff:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Delete staff account
  async deleteStaff(staffId) {
    try {
      const token = await this.getAuthTokenAsync();
      
      const response = await fetch(`${this.baseURL}/${staffId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return {
        success: true,
        message: 'Tài khoản nhân viên đã được xóa',
      };
    } catch (error) {
      console.error('Error deleting staff:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Activate/Deactivate staff account
  async toggleStaffStatus(staffId, status) {
    try {
      const token = await this.getAuthTokenAsync();
      
      const response = await fetch(`${this.baseURL}/${staffId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.staff,
        message: `Tài khoản nhân viên đã được ${status === 'active' ? 'kích hoạt' : 'vô hiệu hóa'}`,
      };
    } catch (error) {
      console.error('Error toggling staff status:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Reset staff password
  async resetStaffPassword(staffId) {
    try {
      const token = await this.getAuthTokenAsync();
      
      const response = await fetch(`${this.baseURL}/${staffId}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.temporaryPassword,
        message: 'Mật khẩu đã được đặt lại',
      };
    } catch (error) {
      console.error('Error resetting password:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Assign staff to agency
  async assignStaffToAgency(staffId, agencyId) {
    try {
      const token = await this.getAuthTokenAsync();

      const response = await fetch(`${API_BASE_URL}/admin/staff/${staffId}/assign/${agencyId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data,
        message: 'Đã gán nhân viên vào đại lý thành công',
      };
    } catch (error) {
      console.error('Error assigning staff to agency:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Get staff statistics
  async getStaffStatistics() {
    try {
      const token = await this.getAuthTokenAsync();
      
      const response = await fetch(`${this.baseURL}/statistics`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.statistics,
      };
    } catch (error) {
      console.error('Error fetching staff statistics:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Get departments list
  async getDepartments() {
    try {
      const token = await this.getAuthTokenAsync();
      
      const response = await fetch(`${this.baseURL}/departments`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.departments || [],
      };
    } catch (error) {
      console.error('Error fetching departments:', error);
      return {
        success: false,
        error: error.message,
        data: [],
      };
    }
  }

  // Get roles list
  async getRoles() {
    try {
      const token = await this.getAuthTokenAsync();
      
      const response = await fetch(`${this.baseURL}/roles`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.roles || [],
      };
    } catch (error) {
      console.error('Error fetching roles:', error);
      return {
        success: false,
        error: error.message,
        data: [],
      };
    }
  }

  // Refresh token when expired
  async refreshToken() {
    try {
      const refreshTokenValue = await AsyncStorage.getItem('refreshToken');
      if (!refreshTokenValue) {
        console.error('No refresh token found');
        return null;
      }

      const response = await fetch(`${API_BASE_URL}/auth/token`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${refreshTokenValue}`,
        },
      });

      if (!response.ok) {
        console.error('Failed to refresh token');
        return null;
      }

      const data = await response.json();
      const newAccessToken = data.accessToken;
      
      if (newAccessToken) {
        await AsyncStorage.setItem('token', newAccessToken);
        console.log('Token refreshed and saved to storage');
        return newAccessToken;
      }
      
      return null;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return null;
    }
  }

  // Helper methods
  generateDefaultPassword() {
    // Generate a random password
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  // Validate staff data
  validateStaffData(staffData) {
    const errors = [];

    if (!staffData.name || staffData.name.trim().length < 2) {
      errors.push('Tên phải có ít nhất 2 ký tự');
    }

    if (!staffData.email || !this.isValidEmail(staffData.email)) {
      errors.push('Email không hợp lệ');
    }

    if (!staffData.phone || !this.isValidPhone(staffData.phone)) {
      errors.push('Số điện thoại không hợp lệ');
    }

    if (!staffData.role) {
      errors.push('Vai trò là bắt buộc');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  isValidPhone(phone) {
    const phoneRegex = /^[0-9]{10,11}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  // ============ Dealer Staff APIs ============

  // Create Dealer Staff account (for Dealer Manager)
  async createDealerStaff(staffData) {
    try {
      const token = await this.getAuthTokenAsync();

      const payload = {
        username: staffData.username,
        password: staffData.password,
        fullname: staffData.fullname,
        email: staffData.email,
        phone: staffData.phone,
        address: staffData.address || '',
        avatar: staffData.avatar || '',
        roleId: staffData.roleId,
        agencyId: staffData.agencyId,
      };

      console.log('🔧 Create Dealer Staff Request:', {
        url: `${API_BASE_URL}/manager/staff`,
        payload,
        hasToken: !!token,
      });

      const response = await fetch(`${API_BASE_URL}/manager/staff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      console.log('📥 Create Dealer Staff Response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Create Dealer Staff Error:', errorText);
        let errorData = {};
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { message: errorText || `HTTP error! status: ${response.status}` };
        }
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Create Dealer Staff Success:', data);
      return {
        success: true,
        data: data,
        message: 'Tài khoản Dealer Staff đã được tạo thành công',
      };
    } catch (error) {
      console.error('Error creating dealer staff:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Update Dealer Staff information (PATCH /manager/staff/{staffId})
  async updateDealerStaff(staffId, staffData) {
    try {
      const token = await this.getAuthTokenAsync();

      // Build payload with only defined fields
      const rawPayload = {
        username: staffData.username,
        fullname: staffData.fullname,
        email: staffData.email,
        phone: staffData.phone,
        address: staffData.address,
        avatar: staffData.avatar,
        roleId: staffData.roleId,
        agencyId: staffData.agencyId,
      };

      const payload = Object.keys(rawPayload).reduce((acc, key) => {
        const value = rawPayload[key];
        if (value !== undefined && value !== null && value !== '') {
          acc[key] = value;
        }
        return acc;
      }, {});

      console.log('🔧 Update Dealer Staff Request:', {
        staffId,
        payload,
        url: `${API_BASE_URL}/manager/staff/${staffId}`,
        hasToken: !!token,
      });

      const isAvatarFile =
        payload.avatar &&
        (typeof payload.avatar === 'object' ||
          (typeof payload.avatar === 'string' && payload.avatar.startsWith('file')));

      let fetchOptions = {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      };

      if (isAvatarFile) {
        const form = new FormData();
        Object.entries(payload).forEach(([k, v]) => {
          if (k === 'avatar') {
            if (typeof v === 'object') {
              form.append('avatar', v);
            } else {
              form.append('avatar', { uri: v, name: 'avatar.jpg', type: 'image/jpeg' });
            }
          } else {
            form.append(k, String(v));
          }
        });
        fetchOptions.body = form;
        // Do NOT set Content-Type for FormData; let fetch add boundary
      } else {
        fetchOptions.headers['Content-Type'] = 'application/json';
        fetchOptions.body = JSON.stringify(payload);
      }

      const response = await fetch(`${API_BASE_URL}/manager/staff/${staffId}`, fetchOptions);

      console.log('📥 Update Dealer Staff Response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Update Dealer Staff Error:', errorText);
        let errorData = {};
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { message: errorText || `HTTP error! status: ${response.status}` };
        }
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.text().then(t => (t ? JSON.parse(t) : {})).catch(() => ({}));
      console.log('✅ Update Dealer Staff Success:', data);
      return {
        success: true,
        data,
        message: 'Thông tin Dealer Staff đã được cập nhật',
      };
    } catch (error) {
      console.error('Error updating dealer staff:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Delete Dealer Staff (DELETE /manager/staff/{staffId})
  async deleteDealerStaff(staffId) {
    try {
      const token = await this.getAuthTokenAsync();

      console.log('🔧 Delete Dealer Staff Request:', {
        url: `${API_BASE_URL}/manager/staff/${staffId}`,
        staffId,
        hasToken: !!token,
      });

      const response = await fetch(`${API_BASE_URL}/manager/staff/${staffId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('📥 Delete Dealer Staff Response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Delete Dealer Staff Error:', errorText);
        let errorData = {};
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { message: errorText || `HTTP error! status: ${response.status}` };
        }
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      // Some DELETE endpoints return 204 No Content
      const data = await response.text().then(t => (t ? JSON.parse(t) : {})).catch(() => ({}));
      console.log('✅ Delete Dealer Staff Success:', data);
      return {
        success: true,
        data,
        message: 'Tài khoản Dealer Staff đã được xóa',
      };
    } catch (error) {
      console.error('Error deleting dealer staff:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Get Dealer Staff role information
  async getDealerStaffRole() {
    try {
      const token = await this.getAuthTokenAsync();

      const response = await fetch(`${API_BASE_URL}/manager/staff/role`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data,
      };
    } catch (error) {
      console.error('Error fetching dealer staff role:', error);
      return {
        success: false,
        error: error.message,
        data: null,
      };
    }
  }

  // Get Dealer Staff list for specific agency
  async getDealerStaffList(agencyId) {
    try {
      const token = await this.getAuthTokenAsync();

      const response = await fetch(`${API_BASE_URL}/manager/staff/list/${agencyId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Dealer Staff API response:', data);
      
      // Parse staff list - ensure we always have an array to map
      let staffArray = [];
      
      if (Array.isArray(data)) {
        // If data is already an array
        staffArray = data;
      } else if (data.staff && Array.isArray(data.staff)) {
        // If data.staff exists and is an array
        staffArray = data.staff;
      } else if (data.data && Array.isArray(data.data)) {
        // If data.data exists and is an array
        staffArray = data.data;
      } else if (Array.isArray(data.staffList)) {
        // If data.staffList exists and is an array
        staffArray = data.staffList;
      }
      
      console.log('Extracted staff array length:', staffArray.length);
      
      // Map staff array to desired format
      const mapped = staffArray.map(staff => ({
        id: staff.id,
        username: staff.username,
        fullname: staff.fullname,
        email: staff.email || '',
        phone: staff.phone || '',
        address: staff.address || '',
        avatar: staff.avatar || '',
        agencyId: staff.agencyId,
        isActive: staff.isActive !== undefined ? staff.isActive : true,
        isDeleted: staff.isDeleted || false,
        createAt: staff.createAt || staff.createdAt,
      }));

      // Exclude soft-deleted records to reflect actual visible data
      const staffList = mapped.filter(s => !s.isDeleted);

      return {
        success: true,
        data: staffList,
      };
    } catch (error) {
      console.error('Error fetching dealer staff list:', error);
      return {
        success: false,
        error: error.message,
        data: [],
      };
    }
  }
}

// Create and export a singleton instance
const staffService = new StaffService();
export default staffService;
