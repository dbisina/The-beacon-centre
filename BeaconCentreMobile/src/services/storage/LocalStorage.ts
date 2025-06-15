// src/services/storage/LocalStorage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocalUserData, DownloadedAudio, AppSettings } from '@/types/storage';
import { v4 as uuidv4 } from 'uuid';

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
        data.favoriteDevotionals = data.favoriteDevotionals.filter(i => i !== id);
        break;
      case 'video':
        data.favoriteVideoSermons = data.favoriteVideoSermons.filter(i => i !== id);
        break;
      case 'audio':
        data.favoriteAudioSermons = data.favoriteAudioSermons.filter(i => i !== id);
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

  static async addDownloadedAudio(audioData: DownloadedAudio): Promise<void> {
    const data = await this.getUserData();
    
    // Remove existing download if any
    data.downloadedAudio = data.downloadedAudio.filter(
      item => item.sermonId !== audioData.sermonId
    );
    
    // Add new download
    data.downloadedAudio.push(audioData);
    await this.saveUserData(data);
  }

  static async removeDownloadedAudio(sermonId: number): Promise<void> {
    const data = await this.getUserData();
    data.downloadedAudio = data.downloadedAudio.filter(
      item => item.sermonId !== sermonId
    );
    await this.saveUserData(data);
  }

  static async updateSettings(settings: Partial<AppSettings>): Promise<void> {
    const data = await this.getUserData();
    data.appSettings = { ...data.appSettings, ...settings };
    await this.saveUserData(data);
  }

  static async isFavorite(
    type: 'devotional' | 'video' | 'audio', 
    id: number
  ): Promise<boolean> {
    const data = await this.getUserData();
    
    switch(type) {
      case 'devotional':
        return data.favoriteDevotionals.includes(id);
      case 'video':
        return data.favoriteVideoSermons.includes(id);
      case 'audio':
        return data.favoriteAudioSermons.includes(id);
      default:
        return false;
    }
  }

  static async isDevotionalRead(devotionalId: number): Promise<boolean> {
    const data = await this.getUserData();
    return data.readDevotionals.includes(devotionalId);
  }

  static async isAudioDownloaded(sermonId: number): Promise<boolean> {
    const data = await this.getUserData();
    return data.downloadedAudio.some(item => item.sermonId === sermonId);
  }

  static async getDownloadedAudio(sermonId: number): Promise<DownloadedAudio | null> {
    const data = await this.getUserData();
    return data.downloadedAudio.find(item => item.sermonId === sermonId) || null;
  }

  // Cache management for offline data
  static async cacheData<T>(key: string, data: T): Promise<void> {
    try {
      await AsyncStorage.setItem(
        `${this.CACHE_PREFIX}${key}`, 
        JSON.stringify({
          data,
          timestamp: Date.now(),
        })
      );
    } catch (error) {
      console.error('Failed to cache data:', error);
    }
  }

  static async getCachedData<T>(key: string, maxAge: number = 24 * 60 * 60 * 1000): Promise<T | null> {
    try {
      const cached = await AsyncStorage.getItem(`${this.CACHE_PREFIX}${key}`);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < maxAge) {
          return data;
        }
      }
      return null;
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

  private static createDefaultUserData(): LocalUserData {
    return {
      deviceId: uuidv4(),
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
      // Already read today
      return;
    }
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (lastRead === yesterday.toDateString()) {
      // Consecutive day
      data.readingStreak.currentStreak += 1;
    } else {
      // Streak broken, start new
      data.readingStreak.currentStreak = 1;
    }
    
    data.readingStreak.lastReadDate = new Date().toISOString();
    
    if (data.readingStreak.currentStreak > data.readingStreak.longestStreak) {
      data.readingStreak.longestStreak = data.readingStreak.currentStreak;
    }
  }
}

export default LocalStorageService;