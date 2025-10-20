import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../../constants';

class StorageService {
  // Set item
  async setItem(key, value) {
    try {
      if (value === undefined) {
        // Avoid AsyncStorage SQLite error: "bind value at index 1 is null"
        // When value is undefined, remove the key instead of writing null/undefined
        await AsyncStorage.removeItem(key);
        return true;
      }
      const jsonValue = JSON.stringify(value ?? null);
      await AsyncStorage.setItem(key, jsonValue);
      return true;
    } catch (error) {
      console.error('Error saving data:', error);
      return false;
    }
  }

  // Get item
  async getItem(key) {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error('Error reading data:', error);
      return null;
    }
  }

  // Remove item
  async removeItem(key) {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error removing data:', error);
      return false;
    }
  }

  // Clear all data
  async clear() {
    try {
      await AsyncStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing data:', error);
      return false;
    }
  }

  // Auth related methods
  async setTokens(accessToken, refreshToken) {
    const results = await Promise.all([
      this.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken),
      this.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken),
    ]);
    return results.every(result => result);
  }

  async getTokens() {
    const [accessToken, refreshToken] = await Promise.all([
      this.getItem(STORAGE_KEYS.ACCESS_TOKEN),
      this.getItem(STORAGE_KEYS.REFRESH_TOKEN),
    ]);
    return { accessToken, refreshToken };
  }

  async clearTokens() {
    const results = await Promise.all([
      this.removeItem(STORAGE_KEYS.ACCESS_TOKEN),
      this.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
    ]);
    return results.every(result => result);
  }

  // User data methods
  async setUserData(userData) {
    return this.setItem(STORAGE_KEYS.USER_DATA, userData);
  }

  async getUserData() {
    return this.getItem(STORAGE_KEYS.USER_DATA);
  }

  async clearUserData() {
    return this.removeItem(STORAGE_KEYS.USER_DATA);
  }

  // Settings methods
  async setSettings(settings) {
    return this.setItem(STORAGE_KEYS.SETTINGS, settings);
  }

  async getSettings() {
    return this.getItem(STORAGE_KEYS.SETTINGS);
  }
}

export default new StorageService();
