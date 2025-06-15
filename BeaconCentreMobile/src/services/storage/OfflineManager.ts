// src/services/storage/OfflineManager.ts
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import CacheManager from './CacheManager';
import { devotionalsApi } from '@/services/api/devotionals';
import { sermonsApi } from '@/services/api/sermons';
import { announcementsApi } from '@/services/api/announcements';

interface SyncStatus {
  isOnline: boolean;
  lastSyncTime: Date | null;
  isSyncing: boolean;
  syncProgress: number;
  error: string | null;
}

class OfflineManager {
  private static instance: OfflineManager;
  private syncStatus: SyncStatus = {
    isOnline: false,
    lastSyncTime: null,
    isSyncing: false,
    syncProgress: 0,
    error: null,
  };
  private listeners: Array<(status: SyncStatus) => void> = [];

  static getInstance(): OfflineManager {
    if (!OfflineManager.instance) {
      OfflineManager.instance = new OfflineManager();
    }
    return OfflineManager.instance;
  }

  constructor() {
    this.setupNetworkListener();
  }

  private setupNetworkListener() {
    NetInfo.addEventListener((state: NetInfoState) => {
      const wasOnline = this.syncStatus.isOnline;
      this.syncStatus.isOnline = !!state.isConnected;
      
      if (!wasOnline && this.syncStatus.isOnline) {
        // Just came online - sync
        this.syncWhenOnline();
      }
      
      this.notifyListeners();
    });
  }

  addListener(listener: (status: SyncStatus) => void) {
    this.listeners.push(listener);
  }

  removeListener(listener: (status: SyncStatus) => void) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener({ ...this.syncStatus }));
  }

  async syncWhenOnline(): Promise<void> {
    if (!this.syncStatus.isOnline || this.syncStatus.isSyncing) {
      return;
    }

    this.syncStatus.isSyncing = true;
    this.syncStatus.syncProgress = 0;
    this.syncStatus.error = null;
    this.notifyListeners();

    try {
      // Sync devotionals
      this.syncStatus.syncProgress = 20;
      this.notifyListeners();
      
      const devotionals = await devotionalsApi.getAll();
      await CacheManager.set('devotionals', devotionals, 24 * 60 * 60 * 1000);
      
      const todaysDevotional = await devotionalsApi.getToday();
      await CacheManager.set('todays_devotional', todaysDevotional, 12 * 60 * 60 * 1000);

      // Sync video sermons
      this.syncStatus.syncProgress = 40;
      this.notifyListeners();
      
      const videoSermons = await sermonsApi.video.getAll();
      await CacheManager.set('video_sermons', videoSermons, 24 * 60 * 60 * 1000);

      // Sync audio sermons
      this.syncStatus.syncProgress = 60;
      this.notifyListeners();
      
      const audioSermons = await sermonsApi.audio.getAll();
      await CacheManager.set('audio_sermons', audioSermons, 24 * 60 * 60 * 1000);

      // Sync announcements
      this.syncStatus.syncProgress = 80;
      this.notifyListeners();
      
      const announcements = await announcementsApi.getAll();
      await CacheManager.set('announcements', announcements, 6 * 60 * 60 * 1000);

      // Sync featured content
      this.syncStatus.syncProgress = 100;
      this.notifyListeners();
      
      const [featuredVideos, featuredAudio] = await Promise.all([
        sermonsApi.video.getFeatured(),
        sermonsApi.audio.getFeatured(),
      ]);
      
      await CacheManager.set('featured_content', {
        videos: featuredVideos,
        audio: featuredAudio,
      }, 12 * 60 * 60 * 1000);

      this.syncStatus.lastSyncTime = new Date();
      
    } catch (error) {
      console.error('Sync error:', error);
      this.syncStatus.error = error instanceof Error ? error.message : 'Sync failed';
    } finally {
      this.syncStatus.isSyncing = false;
      this.syncStatus.syncProgress = 0;
      this.notifyListeners();
    }
  }

  async forceSyncNow(): Promise<void> {
    await this.syncWhenOnline();
  }

  getStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  async getCachedData<T>(key: string): Promise<T | null> {
    return await CacheManager.get<T>(key);
  }

  async clearCache(): Promise<void> {
    await CacheManager.clear();
  }

  async getCacheSize(): Promise<number> {
    return await CacheManager.getSize();
  }

  async isDataFresh(key: string): Promise<boolean> {
    return !(await CacheManager.isExpired(key));
  }
}

export default OfflineManager;