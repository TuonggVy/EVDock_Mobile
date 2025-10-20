# EVDock Mobile

A React Native mobile application built with Expo.

## Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── common/          # Common components (Button, Input, etc.)
│   └── forms/           # Form-specific components
├── screens/             # Screen components
│   ├── auth/            # Authentication screens
│   ├── home/            # Home screens
│   └── profile/         # Profile screens
├── services/            # Business logic and API services
│   ├── api/             # API service classes
│   ├── auth/            # Authentication services
│   └── storage/         # Local storage services
├── utils/               # Utility functions
│   ├── helpers/         # Helper functions
│   └── validators/      # Validation functions
├── constants/           # App constants and configuration
├── config/              # App configuration files
├── assets/              # Images, fonts, and other assets
├── App.js               # Main App component
└── index.js             # App entry point
```

## Key Features

### 🏗️ Architecture
- **Modular Structure**: Organized folders for easy maintenance
- **Service Layer**: Separated API calls and business logic
- **Component Library**: Reusable UI components
- **Constants Management**: Centralized configuration

### 🔧 Configuration
- **API Configuration**: Easy backend integration
- **Environment Support**: Development and production configs
- **Token Management**: Automatic token refresh
- **Error Handling**: Centralized error management

### 📱 Components
- **Button**: Customizable button with variants
- **Input**: Form input with validation
- **Common Components**: Reusable UI elements

### 🛠️ Services
- **AuthService**: Authentication API calls
- **StorageService**: Local storage management
- **API Client**: Axios configuration with interceptors

### 📦 Utilities
- **Helpers**: Date formatting, currency, debounce, etc.
- **Validators**: Form validation functions
- **Constants**: App-wide constants and themes

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Install additional packages:
```bash
npm install @react-native-async-storage/async-storage axios
```

3. Start the development server:
```bash
npm start
```

## Backend Integration

The project is structured to easily integrate with a backend:

1. **API Configuration**: Update `src/constants/api.js` with your backend URLs
2. **Services**: Add new API services in `src/services/api/`
3. **Authentication**: Token management is already configured
4. **Error Handling**: Centralized error handling for API responses

## Environment Setup

- Development: Uses localhost API
- Production: Configure production API URL in `src/constants/api.js`

## Contributing

1. Follow the established folder structure
2. Add new components to appropriate folders
3. Use the existing service patterns for API calls
4. Follow the naming conventions used in the project
