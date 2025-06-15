// src/services/storage/CacheManager.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_CONFIG } from '@/utils/constants';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry?: number;
}

class CacheManager {
  private static readonly PREFIX = 'beacon_cache_';

  static async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    try {
      const cacheItem: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        expiry: ttl ? Date.now() + ttl : undefined,
      };

      await AsyncStorage.setItem(
        `${this.PREFIX}${key}`,
        JSON.stringify(cacheItem)
      );
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  static async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await AsyncStorage.getItem(`${this.PREFIX}${key}`);
      if (!cached) return null;

      const cacheItem: CacheItem<T> = JSON.parse(cached);

      // Check if expired
      if (cacheItem.expiry && Date.now() > cacheItem.expiry) {
        await this.delete(key);
        return null;
      }

      return cacheItem.data;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  static async delete(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`${this.PREFIX}${key}`);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  static async clear(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  static async getSize(): Promise<number> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.PREFIX));
      
      let totalSize = 0;
      for (const key of cacheKeys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          totalSize += new Blob([value]).size;
        }
      }
      
      return totalSize;
    } catch (error) {
      console.error('Cache size calculation error:', error);
      return 0;
    }
  }

  static async cleanup(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.PREFIX));
      
      for (const key of cacheKeys) {
        const cached = await AsyncStorage.getItem(key);
        if (cached) {
          const cacheItem: CacheItem<any> = JSON.parse(cached);
          
          // Remove expired items
          if (cacheItem.expiry && Date.now() > cacheItem.expiry) {
            await AsyncStorage.removeItem(key);
          }
          // Remove items older than max age
          else if (Date.now() - cacheItem.timestamp > APP_CONFIG.storage.cacheTimeout) {
            await AsyncStorage.removeItem(key);
          }
        }
      }
    } catch (error) {
      console.error('Cache cleanup error:', error);
    }
  }

  static async isExpired(key: string): Promise<boolean> {
    try {
      const cached = await AsyncStorage.getItem(`${this.PREFIX}${key}`);
      if (!cached) return true;

      const cacheItem: CacheItem<any> = JSON.parse(cached);
      return cacheItem.expiry ? Date.now() > cacheItem.expiry : false;
    } catch (error) {
      return true;
    }
  }
}

export default CacheManager;