// src/services/storage/LocalStorage.ts - FIXED VERSION
import AsyncStorage from '@react-native-async-storage/async-storage';
import { randomUUID } from 'expo-crypto';
import { LocalUserData, DownloadedAudio, AppSettings } from '@/types/storage';

class LocalStorageService {
  private static readonly USER_DATA_KEY = 'beacon_user_data';
  private static readonly CACHE_PREFIX = 'beacon_cache_';

  static async getUserData(): Promise<LocalUserData> {
    try {
      const stored = await AsyncStorage.getItem(this.USER_DATA_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      return this.createDefaultUserData();
    } catch (error) {
      console.error('Failed to get user data:', error);
      return this.createDefaultUserData();
    }
  }

  static async saveUserData(data: LocalUserData): Promise<void> {
    try {
      await AsyncStorage.setItem(this.USER_DATA_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save user data:', error);
    }
  }

  static async addFavorite(
    type: 'devotional' | 'video' | 'audio', 
    id: number
  ): Promise<void> {
    const data = await this.getUserData();
    
    switch(type) {
      case 'devotional':
        if (!data.favoriteDevotionals.includes(id)) {
          data.favoriteDevotionals.push(id);
        }
        break;
      case 'video':
        if (!data.favoriteVideoSermons.includes(id)) {
          data.favoriteVideoSermons.push(id);
        }
        break;
      case 'audio':
        if (!data.favoriteAudioSermons.includes(id)) {
          data.favoriteAudioSermons.push(id);
        }
        break;
    }
    
    await this.saveUserData(data);
  }

  static async removeFavorite(
    type: 'devotional' | 'video' | 'audio', 
    id: number
  ): Promise<void> {
    const data = await this.getUserData();
    
    switch(type) {
      case 'devotional':
        data.favoriteDevotionals = data.favoriteDevotionals.filter(fId => fId !== id);
        break;
      case 'video':
        data.favoriteVideoSermons = data.favoriteVideoSermons.filter(fId => fId !== id);
        break;
      case 'audio':
        data.favoriteAudioSermons = data.favoriteAudioSermons.filter(fId => fId !== id);
        break;
    }
    
    await this.saveUserData(data);
  }

  static async markDevotionalRead(devotionalId: number): Promise<void> {
    const data = await this.getUserData();
    if (!data.readDevotionals.includes(devotionalId)) {
      data.readDevotionals.push(devotionalId);
      this.updateReadingStreak(data);
      await this.saveUserData(data);
    }
  }

  static async updateSettings(settings: Partial<AppSettings>): Promise<void> {
    const data = await this.getUserData();
    data.appSettings = { ...data.appSettings, ...settings };
    await this.saveUserData(data);
  }

  static async addDownloadedAudio(audio: DownloadedAudio): Promise<void> {
    const data = await this.getUserData();
    data.downloadedAudio.push(audio);
    await this.saveUserData(data);
  }

  static async removeDownloadedAudio(sermonId: number): Promise<void> {
    const data = await this.getUserData();
    data.downloadedAudio = data.downloadedAudio.filter(audio => audio.sermonId !== sermonId);
    await this.saveUserData(data);
  }

  static async cacheData(key: string, data: any): Promise<void> {
    try {
      await AsyncStorage.setItem(`${this.CACHE_PREFIX}${key}`, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to cache data:', error);
    }
  }

  static async getCachedData<T>(key: string): Promise<T | null> {
    try {
      const cached = await AsyncStorage.getItem(`${this.CACHE_PREFIX}${key}`);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Failed to get cached data:', error);
      return null;
    }
  }

  static async clearCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  static async toggleFavorite(
    type: 'devotional' | 'video' | 'audio', 
    id: number
  ): Promise<boolean> {
    try {
      const data = await this.getUserData();
      let favoritesList: number[];
      
      switch(type) {
        case 'devotional':
          favoritesList = data.favoriteDevotionals || [];
          if (favoritesList.includes(id)) {
            data.favoriteDevotionals = favoritesList.filter(fId => fId !== id);
          } else {
            data.favoriteDevotionals = [...favoritesList, id];
          }
          break;
        case 'video':
          favoritesList = data.favoriteVideoSermons || [];
          if (favoritesList.includes(id)) {
            data.favoriteVideoSermons = favoritesList.filter(fId => fId !== id);
          } else {
            data.favoriteVideoSermons = [...favoritesList, id];
          }
          break;
        case 'audio':
          favoritesList = data.favoriteAudioSermons || [];
          if (favoritesList.includes(id)) {
            data.favoriteAudioSermons = favoritesList.filter(fId => fId !== id);
          } else {
            data.favoriteAudioSermons = [...favoritesList, id];
          }
          break;
      }
      
      await this.saveUserData(data);
      return true;
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      return false;
    }
  }
  
  static async isFavorite(
    type: 'devotional' | 'video' | 'audio', 
    id: number
  ): Promise<boolean> {
    try {
      const data = await this.getUserData();
      
      switch(type) {
        case 'devotional':
          return data.favoriteDevotionals?.includes(id) || false;
        case 'video':
          return data.favoriteVideoSermons?.includes(id) || false;
        case 'audio':
          return data.favoriteAudioSermons?.includes(id) || false;
        default:
          return false;
      }
    } catch (error) {
      console.error('Failed to check favorite status:', error);
      return false;
    }
  }

  private static createDefaultUserData(): LocalUserData {
    return {
      deviceId: randomUUID(), // FIXED: Use expo-crypto instead of uuid
      favoriteDevotionals: [],
      favoriteVideoSermons: [],
      favoriteAudioSermons: [],
      readDevotionals: [],
      downloadedAudio: [],
      bookmarkedAnnouncements: [],
      readingStreak: {
        currentStreak: 0,
        lastReadDate: '',
        longestStreak: 0,
      },
      appSettings: {
        notifications: true,
        autoDownloadWifi: false,
        fontSize: 'medium',
        theme: 'system',
      },
      lastSyncDate: new Date().toISOString(),
    };
  }

  private static updateReadingStreak(data: LocalUserData): void {
    const today = new Date().toDateString();
    const lastRead = new Date(data.readingStreak.lastReadDate).toDateString();
    
    if (lastRead === today) {
      return;
    }
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (lastRead === yesterday.toDateString()) {
      data.readingStreak.currentStreak += 1;
    } else {
      data.readingStreak.currentStreak = 1;
    }
    
    data.readingStreak.lastReadDate = new Date().toISOString();
    
    if (data.readingStreak.currentStreak > data.readingStreak.longestStreak) {
      data.readingStreak.longestStreak = data.readingStreak.currentStreak;
    }
  }
}

export default LocalStorageService;