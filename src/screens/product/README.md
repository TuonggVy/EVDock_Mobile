# Product Management Module

This module provides comprehensive product management functionality for EVM Staff, allowing them to manage vehicle models in the system.

## Features

### 1. Product Management Screen (`ProductManagementScreen.js`)
- **Product List**: Display all products in a beautiful card layout
- **Search & Filter**: Search by name/description and filter by category
- **Real-time Updates**: Pull-to-refresh functionality
- **Quick Actions**: Edit and delete products directly from the list
- **Status Indicators**: Visual status badges (Available, Low Stock, Out of Stock)

### 2. Add Product Screen (`AddProductScreen.js`)
- **Form Validation**: Comprehensive client-side validation
- **Category Selection**: Visual category picker with icons
- **Specifications**: Detailed vehicle specifications input
- **Image Upload**: Placeholder for image upload functionality
- **Responsive Design**: Keyboard-aware layout for mobile

### 3. Edit Product Screen (`EditProductScreen.js`)
- **Pre-filled Forms**: Auto-populate with existing product data
- **Same Validation**: Consistent validation rules as Add Product
- **Update Functionality**: Modify existing products
- **Image Management**: Update product images

### 4. Product Detail Screen (`ProductDetailScreen.js`)
- **Detailed View**: Complete product information display
- **Specifications Grid**: Organized specification display with icons
- **Action Buttons**: Edit and delete actions
- **Share Functionality**: Share product information
- **Status Information**: Comprehensive product status and metadata

## API Integration

### Product Service (`productService.js`)
The service layer is designed for easy backend integration:

```javascript
// Example usage
import productService from '../services/productService';

// Get all products
const products = await productService.getProducts();

// Create new product
const newProduct = await productService.createProduct(productData);

// Update product
const updatedProduct = await productService.updateProduct(productId, productData);

// Delete product
await productService.deleteProduct(productId);
```

### API Endpoints
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `POST /api/products/:id/image` - Upload product image
- `GET /api/categories` - Get product categories
- `GET /api/products/stats` - Get product statistics

## Data Structure

### Product Object
```javascript
{
  id: 'string',
  name: 'string',
  category: 'string', // SUV, Sedan, Truck, Hatchback
  price: 'number',
  status: 'string', // available, low_stock, out_of_stock
  image: 'ImageSource',
  description: 'string',
  specifications: {
    range: 'string',
    acceleration: 'string',
    topSpeed: 'string',
    seating: 'string'
  },
  stock: 'number',
  createdAt: 'string' // ISO date
}
```

## Navigation

The module integrates with the main app navigation:

- **EVMStaffHomeScreen** → **ProductManagement** (via Products card)
- **ProductManagement** → **AddProduct** (via + button)
- **ProductManagement** → **ProductDetail** (via product card tap)
- **ProductDetail** → **EditProduct** (via Edit button)

## Styling

The module uses the app's design system:
- **Colors**: Consistent with `COLORS` constants
- **Sizes**: Uses `SIZES` constants for spacing and typography
- **Gradients**: Beautiful gradient backgrounds for buttons and cards
- **Shadows**: Subtle shadows for depth and hierarchy
- **Responsive**: Mobile-first design approach

## Future Enhancements

1. **Image Upload**: Implement actual image selection and upload
2. **Bulk Operations**: Select multiple products for bulk actions
3. **Advanced Filters**: More filtering options (price range, date, etc.)
4. **Sorting**: Sort products by various criteria
5. **Export**: Export product data to CSV/PDF
6. **Analytics**: Product performance metrics
7. **Offline Support**: Cache products for offline viewing

## Usage

1. Navigate to the EVM Staff home screen
2. Tap on the "Products" card
3. Use the search bar to find specific products
4. Filter by category using the category chips
5. Tap on a product card to view details
6. Use the + button to add new products
7. Use edit/delete buttons for product management

## Error Handling

The module includes comprehensive error handling:
- **Network Errors**: Graceful handling of API failures
- **Validation Errors**: Clear error messages for form validation
- **Loading States**: Visual feedback during API calls
- **Empty States**: User-friendly messages when no data is available

## Testing

The module is designed to be easily testable:
- **Mock Data**: Includes mock data for development and testing
- **Service Layer**: Separated business logic for unit testing
- **Component Structure**: Modular components for component testing
- **Error Scenarios**: Handles various error conditions gracefully
