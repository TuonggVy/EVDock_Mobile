# Quick Start - Vehicle Image Service

## 🚀 Current Status: API Disabled (Development Mode)

The service is currently configured to use **local images only** to avoid API timeout errors during development.

## ✅ How to Use

### 1. Current Functionality (API Disabled)
```javascript
import { getVehicleImageByColor } from './vehicleImageService';

// This will use local images (no API calls)
const response = await getVehicleImageByColor('123', 'Black');
console.log(response.data.image); // Local image from PRODUCT_1, PRODUCT_2, etc.
```

### 2. Enable API When Backend is Ready
```javascript
import { enableApiCalls, setApiConfig } from './vehicleImageService';

// Set your API URL
setApiConfig({
  BASE_URL: 'https://your-backend-api.com'
});

// Enable API calls
enableApiCalls();

// Now it will try API first, fallback to local images if API fails
const response = await getVehicleImageByColor('123', 'Black');
```

### 3. Disable API (Back to Local Mode)
```javascript
import { disableApiCalls } from './vehicleImageService';

disableApiCalls();
// Now using local images only again
```

## 🔧 Configuration Options

### Environment Variables
```bash
# .env file
REACT_NATIVE_API_URL=https://api.evdock.com
```

### Runtime Configuration
```javascript
import { setApiConfig, enableApiCalls, disableApiCalls } from './vehicleImageService';

// Full configuration
setApiConfig({
  BASE_URL: 'https://api.evdock.com',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  ENABLE_API_CALLS: false, // Set to true to enable API calls
});

// Or just enable/disable
enableApiCalls();  // Enable API calls
disableApiCalls(); // Disable API calls (current state)
```

## 🎨 Color-Image Mapping

Currently using these local images:
- **Black** → Product1.png
- **White** → Product2.png  
- **Red** → Product3.png
- **Blue** → Product4.png
- **Green** → Product5.png
- **Yellow** → Product6.png
- **Other colors** → Rotate through Product1-6

## 🐛 Troubleshooting

### Error: "API request failed (attempt 1): [AbortError: Aborted]"
**Solution**: API calls are disabled by default. This is normal in development mode.

### Error: "Network request failed"
**Solution**: 
1. Check your internet connection
2. Verify API URL is correct
3. Use `disableApiCalls()` to use local images only

### Images not changing when selecting colors
**Solution**: 
1. Check console for errors
2. Verify color names match the mapping
3. Ensure images are properly imported in `constants/images.js`

## 📱 Testing

### Test Local Mode
```javascript
import { disableApiCalls, getVehicleImageByColor } from './vehicleImageService';

disableApiCalls();
const response = await getVehicleImageByColor('test', 'Red');
console.log('Using local image:', response.data.image);
```

### Test API Mode (when backend is ready)
```javascript
import { enableApiCalls, getVehicleImageByColor } from './vehicleImageService';

enableApiCalls();
const response = await getVehicleImageByColor('test', 'Red');
console.log('API response:', response);
```

## 🔄 Migration Path

1. **Development** (Current): `ENABLE_API_CALLS: false` - Use local images
2. **Testing**: `ENABLE_API_CALLS: true` with mock API
3. **Production**: `ENABLE_API_CALLS: true` with real API

## 📞 Support

If you encounter issues:
1. Check the console logs
2. Verify configuration settings
3. Test with `disableApiCalls()` first
4. Check the full documentation in `README_VEHICLE_IMAGES.md`
