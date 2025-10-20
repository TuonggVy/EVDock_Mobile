# Vehicle Service - Backend Integration Guide

## Tổng quan
File `vehicleService.js` được thiết kế để dễ dàng thay thế bằng các API calls thực tế khi Backend sẵn sàng.

## Cấu trúc hiện tại
- **Mock Data**: Dữ liệu giả lập trong `MOCK_VEHICLES` array
- **Service Functions**: Các hàm async giả lập API calls
- **Helper Functions**: Các hàm tiện ích để format dữ liệu

## Cách tích hợp với Backend

### 1. Thay thế Mock Data
```javascript
// Thay vì sử dụng MOCK_VEHICLES
const MOCK_VEHICLES = [...];

// Sử dụng API calls
const API_BASE_URL = 'https://your-api.com/api';

const fetchVehicles = async () => {
  const response = await fetch(`${API_BASE_URL}/vehicles`);
  return await response.json();
};
```

### 2. Cập nhật Service Functions

#### getAllVehicles()
```javascript
async getAllVehicles() {
  try {
    const response = await fetch(`${API_BASE_URL}/vehicles`);
    const data = await response.json();
    
    return {
      success: true,
      data: data.vehicles,
      total: data.total,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}
```

#### getVehiclesByVersion()
```javascript
async getVehiclesByVersion(versionId) {
  try {
    const url = versionId === 'all' 
      ? `${API_BASE_URL}/vehicles`
      : `${API_BASE_URL}/vehicles?version=${versionId}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    return {
      success: true,
      data: data.vehicles,
      total: data.total,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}
```

#### searchVehicles()
```javascript
async searchVehicles(query) {
  try {
    const response = await fetch(`${API_BASE_URL}/vehicles/search?q=${encodeURIComponent(query)}`);
    const data = await response.json();
    
    return {
      success: true,
      data: data.vehicles,
      total: data.total,
      query,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}
```

#### filterVehicles()
```javascript
async filterVehicles(filters) {
  try {
    const params = new URLSearchParams();
    
    if (filters.version && filters.version !== 'all') {
      params.append('version', filters.version);
    }
    if (filters.search) {
      params.append('search', filters.search);
    }
    if (filters.minPrice !== undefined) {
      params.append('min_price', filters.minPrice);
    }
    if (filters.maxPrice !== undefined) {
      params.append('max_price', filters.maxPrice);
    }
    if (filters.inStock !== undefined) {
      params.append('in_stock', filters.inStock);
    }
    if (filters.sortBy) {
      params.append('sort_by', filters.sortBy);
    }
    
    const response = await fetch(`${API_BASE_URL}/vehicles/filter?${params}`);
    const data = await response.json();
    
    return {
      success: true,
      data: data.vehicles,
      total: data.total,
      filters,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}
```

#### getVehicleById()
```javascript
async getVehicleById(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/vehicles/${id}`);
    const data = await response.json();
    
    return {
      success: true,
      data: data.vehicle,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}
```

#### updateVehicleStock()
```javascript
async updateVehicleStock(vehicleId, newStockCount) {
  try {
    const response = await fetch(`${API_BASE_URL}/vehicles/${vehicleId}/stock`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify({ stock_count: newStockCount }),
    });
    
    const data = await response.json();
    
    return {
      success: true,
      data: data.vehicle,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}
```

### 3. Cấu trúc dữ liệu Backend

#### Vehicle Object
```json
{
  "id": "string",
  "name": "string",
  "model": "string",
  "price": "number",
  "currency": "string",
  "image_url": "string",
  "version": "string",
  "features": ["string"],
  "in_stock": "boolean",
  "stock_count": "number",
  "description": "string",
  "specifications": {
    "battery": "string",
    "motor": "string",
    "weight": "string",
    "max_load": "string",
    "charging_time": "string"
  },
  "colors": ["string"],
  "created_at": "string",
  "updated_at": "string"
}
```

#### API Endpoints
```
GET /api/vehicles - Lấy tất cả xe
GET /api/vehicles?version={version} - Lấy xe theo phiên bản
GET /api/vehicles/search?q={query} - Tìm kiếm xe
GET /api/vehicles/filter?{params} - Lọc xe với nhiều tiêu chí
GET /api/vehicles/{id} - Lấy chi tiết xe
PUT /api/vehicles/{id}/stock - Cập nhật tồn kho
GET /api/versions - Lấy danh sách phiên bản
```

### 4. Error Handling
```javascript
const handleApiError = (error) => {
  console.error('API Error:', error);
  
  if (error.status === 401) {
    // Redirect to login
    navigation.navigate('Login');
  } else if (error.status === 403) {
    // Show permission denied message
    Alert.alert('Error', 'You do not have permission to perform this action');
  } else if (error.status >= 500) {
    // Show server error message
    Alert.alert('Error', 'Server error. Please try again later.');
  } else {
    // Show generic error message
    Alert.alert('Error', 'Something went wrong. Please try again.');
  }
};
```

### 5. Caching và Performance
```javascript
// Thêm caching cho dữ liệu
const cache = new Map();

const getCachedData = (key) => {
  return cache.get(key);
};

const setCachedData = (key, data, ttl = 300000) => { // 5 minutes
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl,
  });
};

const isCacheValid = (cachedData) => {
  return Date.now() - cachedData.timestamp < cachedData.ttl;
};
```

### 6. Testing
```javascript
// Unit tests cho service functions
describe('vehicleService', () => {
  it('should fetch all vehicles', async () => {
    const result = await vehicleService.getAllVehicles();
    expect(result.success).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);
  });
  
  it('should handle API errors', async () => {
    // Mock fetch to return error
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
    
    const result = await vehicleService.getAllVehicles();
    expect(result.success).toBe(false);
    expect(result.error).toBe('Network error');
  });
});
```

## Lưu ý quan trọng
1. **Authentication**: Thêm token vào headers khi cần
2. **Loading States**: Giữ nguyên loading states trong UI
3. **Error Handling**: Xử lý lỗi một cách graceful
4. **Offline Support**: Cân nhắc thêm offline caching
5. **Pagination**: Thêm pagination cho danh sách dài
6. **Real-time Updates**: Cân nhắc WebSocket cho cập nhật real-time

## Migration Steps
1. Tạo file `apiConfig.js` để quản lý API endpoints
2. Thay thế từng function một cách từ từ
3. Test kỹ lưỡng với Backend
4. Thêm error boundaries cho error handling
5. Cập nhật documentation
