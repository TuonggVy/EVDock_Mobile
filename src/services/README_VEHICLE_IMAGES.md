# Vehicle Image Service - Backend Integration Guide

## Overview
This service handles vehicle images by color with full backend integration support. It includes fallback mechanisms for offline functionality and comprehensive error handling.

## API Endpoints

### Required Backend Endpoints

#### 1. Get Vehicle Image by Color
```
GET /api/vehicles/{vehicleId}/images/{color}
```

**Response Format:**
```json
{
  "success": true,
  "data": {
    "image": "https://api.evdock.com/images/vehicles/123/black.jpg",
    "color": "Black",
    "vehicleId": "123",
    "imageId": "img_123_black_001",
    "metadata": {
      "alt": "Electric scooter in black color",
      "caption": "Premium electric scooter in sleek black finish",
      "photographer": "EVDock Photography Team",
      "resolution": "1920x1080",
      "fileSize": "2.5MB",
      "uploadDate": "2024-01-15T10:30:00Z"
    }
  }
}
```

#### 2. Get Vehicle Colors with Images
```
GET /api/vehicles/{vehicleId}/colors
```

**Response Format:**
```json
{
  "success": true,
  "data": [
    {
      "name": "Black",
      "image": "https://api.evdock.com/images/vehicles/123/black.jpg",
      "hex": "#000000",
      "available": true,
      "imageId": "img_123_black_001",
      "metadata": {
        "alt": "Electric scooter in black color",
        "caption": "Premium electric scooter in sleek black finish"
      }
    },
    {
      "name": "White",
      "image": "https://api.evdock.com/images/vehicles/123/white.jpg",
      "hex": "#FFFFFF",
      "available": true,
      "imageId": "img_123_white_001",
      "metadata": {
        "alt": "Electric scooter in white color",
        "caption": "Clean white electric scooter design"
      }
    }
  ]
}
```

#### 3. Get All Vehicle Images
```
GET /api/vehicles/{vehicleId}/images
```

**Response Format:**
```json
{
  "success": true,
  "data": [
    {
      "image": "https://api.evdock.com/images/vehicles/123/black.jpg",
      "color": "Black",
      "imageId": "img_123_black_001",
      "metadata": {
        "alt": "Electric scooter in black color",
        "caption": "Premium electric scooter in sleek black finish"
      }
    }
  ]
}
```

#### 4. Upload Vehicle Image (Admin)
```
POST /api/vehicles/{vehicleId}/images/{color}
Content-Type: multipart/form-data
```

**Request Body:**
- `image`: Image file (FormData)
- `metadata`: Optional JSON string with image metadata

#### 5. Delete Vehicle Image (Admin)
```
DELETE /api/vehicles/{vehicleId}/images/{imageId}
```

## Configuration

### Environment Variables
```bash
# .env file
REACT_NATIVE_API_URL=https://api.evdock.com
REACT_NATIVE_API_TIMEOUT=10000
REACT_NATIVE_API_RETRY_ATTEMPTS=3
```

### API Configuration
```javascript
import { setApiConfig } from './vehicleImageService';

// Set custom configuration
setApiConfig({
  BASE_URL: 'https://staging-api.evdock.com',
  TIMEOUT: 15000,
  RETRY_ATTEMPTS: 5,
  ENDPOINTS: {
    VEHICLE_IMAGE_BY_COLOR: '/api/v2/vehicles/{vehicleId}/images/{color}',
    VEHICLE_COLORS: '/api/v2/vehicles/{vehicleId}/colors',
    VEHICLE_IMAGES: '/api/v2/vehicles/{vehicleId}/images',
  }
});
```

## Authentication

### Adding Authentication Headers
```javascript
// In getAuthToken function
const getAuthToken = () => {
  // Example implementations:
  
  // 1. AsyncStorage (React Native)
  // return AsyncStorage.getItem('auth_token');
  
  // 2. SecureStore (Expo)
  // return SecureStore.getItemAsync('auth_token');
  
  // 3. Redux store
  // return store.getState().auth.token;
  
  // 4. Context API
  // return useContext(AuthContext).token;
  
  return null; // Implement based on your auth system
};
```

## Error Handling

### HTTP Status Codes
- `200`: Success
- `400`: Bad Request (invalid vehicleId or color)
- `401`: Unauthorized (invalid or missing auth token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found (vehicle or image not found)
- `429`: Too Many Requests (rate limiting)
- `500`: Internal Server Error

### Error Response Format
```json
{
  "success": false,
  "error": "Vehicle not found",
  "code": "VEHICLE_NOT_FOUND",
  "details": {
    "vehicleId": "123",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

## Fallback Strategy

The service implements a three-tier fallback strategy:

1. **Primary**: Backend API call
2. **Secondary**: Local vehicle data with color mapping
3. **Tertiary**: Hardcoded color-to-image mapping

## Usage Examples

### Basic Usage
```javascript
import { getVehicleImageByColor } from './vehicleImageService';

// Get image for specific color
const response = await getVehicleImageByColor('123', 'Black');
if (response.success) {
  console.log('Image URL:', response.data.image);
  console.log('Metadata:', response.data.metadata);
}
```

### Advanced Usage
```javascript
import { 
  getVehicleColorsWithImages, 
  preloadVehicleImages,
  uploadVehicleImage 
} from './vehicleImageService';

// Get all colors with images
const colorsResponse = await getVehicleColorsWithImages('123');

// Preload images for better performance
const preloadResponse = await preloadVehicleImages('123');

// Upload new image (admin functionality)
const formData = new FormData();
formData.append('image', imageFile);
formData.append('metadata', JSON.stringify({
  alt: 'Custom vehicle image',
  caption: 'Special edition color'
}));

const uploadResponse = await uploadVehicleImage('123', 'Custom', formData);
```

## Testing

### Mock API for Development
```javascript
// For development/testing without backend
import { setApiConfig } from './vehicleImageService';

setApiConfig({
  BASE_URL: 'http://localhost:3001', // Mock server
  TIMEOUT: 5000,
  RETRY_ATTEMPTS: 1
});
```

### Unit Testing
```javascript
// Example test
import { getVehicleImageByColor } from './vehicleImageService';

describe('VehicleImageService', () => {
  it('should return fallback image when API fails', async () => {
    const response = await getVehicleImageByColor('123', 'Black');
    expect(response.success).toBe(true);
    expect(response.data.image).toBeDefined();
  });
});
```

## Performance Considerations

1. **Image Caching**: Implement image caching for better performance
2. **Lazy Loading**: Load images only when needed
3. **Compression**: Use appropriate image compression
4. **CDN**: Serve images through CDN for faster delivery
5. **Preloading**: Use `preloadVehicleImages` for critical images

## Security Considerations

1. **Authentication**: Always validate auth tokens
2. **Authorization**: Check user permissions for admin operations
3. **Input Validation**: Validate vehicleId and color parameters
4. **File Upload**: Validate image file types and sizes
5. **Rate Limiting**: Implement rate limiting on API endpoints

## Migration Guide

### From Mock to Real API
1. Update `API_CONFIG.BASE_URL` to your production URL
2. Implement `getAuthToken()` function
3. Test all endpoints with real data
4. Update error handling based on your API responses
5. Configure proper timeout and retry settings

### Version Updates
When updating API versions, update the `ENDPOINTS` configuration:
```javascript
setApiConfig({
  ENDPOINTS: {
    VEHICLE_IMAGE_BY_COLOR: '/api/v2/vehicles/{vehicleId}/images/{color}',
    // ... other endpoints
  }
});
```
