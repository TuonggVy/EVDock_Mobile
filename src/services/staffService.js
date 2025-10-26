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

      const token = await this.getAuthTokenAsync();
      const url = `${API_BASE_URL}/admin/staff/list?${queryParams}`;
      
      console.log('Staff API Request:', {
        url,
        page,
        limit,
        hasToken: !!token,
      });

      // Use the admin/staff/list endpoint for getting staff list
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('Staff API Response:', response.status, response.statusText);

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
      
      const response = await fetch(`${this.baseURL}/${staffId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(staffData),
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
}

// Create and export a singleton instance
const staffService = new StaffService();
export default staffService;
