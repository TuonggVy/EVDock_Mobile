# Promotion Management System - Implementation Summary

## Overview
This document summarizes the implementation of a promotion management system for the EVDock Mobile app, allowing EVM Admin to create and manage special promotions that can be applied system-wide or to specific motorbikes.

## Features Implemented

### 1. API Service Integration (`src/services/promotionService.js`)
- **GET `/promotion/list`** - Fetch all promotions with pagination
- **GET `/promotion/detail/{promotionId}`** - Get promotion details
- **POST `/promotion`** - Create new promotion
- **PATCH `/promotion/{promotionId}`** - Update existing promotion
- **DELETE `/promotion/{promotionId}`** - Delete promotion
- **GET `/promotion/agency/list`** - Get promotions for agency/dealer view

### 2. Promotion Management Screen (`src/screens/promotion/PromotionManagementScreen.js`)
- List all promotions with search functionality
- Display promotion details:
  - Name, description
  - Status (ACTIVE/INACTIVE)
  - Value type (PERCENT/FIXED)
  - Discount value
  - Start and end dates
  - Scope (System-wide or Specific Motorbike)
- Edit and delete operations
- Pull-to-refresh support
- Loading states and error handling

### 3. Add/Edit Promotion Screen (`src/screens/promotion/AddPromotionScreen.js`)
- Form for creating/editing promotions with the following fields:
  - **Name** (required)
  - **Description** (required)
  - **Value Type**:
    - PERCENT (percentage discount, 0-100%)
    - FIXED (fixed amount discount in VND)
  - **Value** (required, numeric)
  - **Start Date** (required, date picker)
  - **End Date** (required, date picker)
  - **Scope**:
    - System-wide (applies to all motorbikes)
    - Specific Motorbike (select from motorbike list)
  - **Status**:
    - ACTIVE
    - INACTIVE
- Form validation
- Motorbike selection modal
- Success/error alerts
- Pre-filled data when editing

### 4. Navigation Integration
- Added routes in `AppNavigator.js`:
  - `PromotionManagement` - Main promotion list screen
  - `AddPromotion` - Create/Edit promotion screen
- Updated `EVMAdminHomeScreen.js` to navigate to promotion management

## Promotion Model

### Fields
- `id` - Promotion ID
- `name` - Promotion name
- `description` - Promotion description
- `valueType` - PERCENT or FIXED
- `value` - Discount value (percentage or amount)
- `startAt` - Start date (ISO string)
- `endAt` - End date (ISO string)
- `status` - ACTIVE or INACTIVE
- `motorbikeId` - Motorbike ID (null for system-wide promotions)

### API Request/Response Formats

#### POST /promotion
```json
{
  "name": "Summer Sale",
  "description": "10% off on all bikes",
  "value_type": "PERCENT",
  "value": 10,
  "startAt": "2025-06-01T00:00:00.000Z",
  "endAt": "2025-08-31T00:00:00.000Z",
  "status": "ACTIVE",
  "motorbikeId": null
}
```

#### GET /promotion/list Response
```json
{
  "statusCode": 200,
  "message": "Get promotion list successfully!",
  "data": [
    {
      "id": 1,
      "name": "Celebrate",
      "description": "Sales at 7%",
      "valueType": "PERCENT",
      "value": 7,
      "startAt": "2025-10-12T00:00:00.000Z",
      "endAt": "2025-10-25T00:00:00.000Z",
      "status": "ACTIVE",
      "motorbikeId": 1
    }
  ],
  "paginationInfo": {
    "page": 1,
    "limit": 5,
    "total": 5
  }
}
```

## Key Features

### Validation
- Promotion name is required
- Description is required
- Value must be greater than 0
- Percentage values cannot exceed 100%
- End date must be after start date
- Status must be ACTIVE or INACTIVE

### User Experience
- Clean, modern UI consistent with the app design
- Loading indicators during API calls
- Success/error alerts for user feedback
- Pull-to-refresh for data updates
- Search functionality to filter promotions
- Easy navigation between list and form screens

## Files Created/Modified

### New Files
1. `src/services/promotionService.js` - API service for promotion operations
2. `src/screens/promotion/PromotionManagementScreen.js` - Promotion list screen
3. `src/screens/promotion/AddPromotionScreen.js` - Create/edit promotion screen

### Modified Files
1. `src/navigation/AppNavigator.js` - Added promotion screen routes
2. `src/screens/home/EVMAdminHomeScreen.js` - Updated navigation to promotion management

## Usage

1. Navigate to **Promotions** from the EVM Admin home screen
2. View all promotions in the list
3. Search for specific promotions
4. Click **+ Add** to create a new promotion
5. Fill in the form fields
6. Choose system-wide or motorbike-specific promotion
7. Set status to ACTIVE or INACTIVE
8. Save the promotion
9. Edit existing promotions by clicking the edit icon
10. Delete promotions by clicking the delete icon

## Dependencies
- `@react-native-community/datetimepicker` - For date selection
- Existing app dependencies (axios, expo-linear-gradient, etc.)

## Notes
- The promotion service uses the axiosInstance from `src/services/api/axiosInstance.js` for authenticated API calls
- All API endpoints require authentication (Bearer token)
- Motorbikes are fetched from the existing `motorbikeService`
- The system supports both percentage-based and fixed-amount discounts
- Promotions can be targeted at the entire system or specific motorbike models

