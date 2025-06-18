// src/services/api/analytics.ts - Analytics API Service
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

interface DeviceInfo {
  deviceId: string;
  platform: string;
  appVersion: string;
  country?: string;
}

interface InteractionData {
  deviceId: string;
  contentType: 'devotional' | 'video' | 'audio' | 'announcement';
  contentId: number;
  interactionType: 'viewed' | 'completed' | 'downloaded' | 'favorited' | 'play' | 'pause' | 'resume' | 'seek' | 'queue_play';
  timestamp: string;
  metadata?: Record<string, any>;
}

interface SessionData {
  deviceId: string;
  platform: string;
  appVersion: string;
  country?: string;
  sessionStart: string;
  sessionEnd?: string;
  totalSessions: number;
}

class AnalyticsService {
  private static instance: AnalyticsService;
  private deviceId: string | null = null;
  private baseUrl: string;
  private pendingEvents: InteractionData[] = [];
  private isOnline: boolean = true;
  private syncInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
    this.initializeDevice();
    this.startPeriodicSync();
    this.setupNetworkListener();
  }

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  private async initializeDevice() {
    try {
      // Get or create device ID
      let deviceId = await AsyncStorage.getItem('beacon_device_id');
      if (!deviceId) {
        deviceId = this.generateDeviceId();
        await AsyncStorage.setItem('beacon_device_id', deviceId);
      }
      this.deviceId = deviceId;

      // Load pending events
      const pendingStr = await AsyncStorage.getItem('beacon_pending_analytics');
      if (pendingStr) {
        this.pendingEvents = JSON.parse(pendingStr);
      }

      // Track session start
      this.trackSessionStart();
    } catch (error) {
      console.error('Failed to initialize analytics device:', error);
    }
  }

  private generateDeviceId(): string {
    return `${Platform.OS}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupNetworkListener() {
    NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;
      
      // If we just came back online and have pending events, sync them
      if (wasOffline && this.isOnline && this.pendingEvents.length > 0) {
        this.syncPendingEvents();
      }
    });
  }

  private startPeriodicSync() {
    // Sync every 5 minutes when online
    this.syncInterval = setInterval(() => {
      if (this.isOnline && this.pendingEvents.length > 0) {
        this.syncPendingEvents();
      }
    }, 5 * 60 * 1000);
  }

  private async savePendingEvents() {
    try {
      await AsyncStorage.setItem('beacon_pending_analytics', JSON.stringify(this.pendingEvents));
    } catch (error) {
      console.error('Failed to save pending analytics:', error);
    }
  }

  private async syncPendingEvents() {
    if (this.pendingEvents.length === 0 || !this.isOnline) {
      return;
    }

    try {
      // Send events in batches of 50
      const batchSize = 50;
      const batches = [];
      
      for (let i = 0; i < this.pendingEvents.length; i += batchSize) {
        batches.push(this.pendingEvents.slice(i, i + batchSize));
      }

      for (const batch of batches) {
        const response = await fetch(`${this.baseUrl}/api/analytics/batch`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ events: batch }),
        });

        if (response.ok) {
          // Remove successfully sent events
          this.pendingEvents = this.pendingEvents.filter(event => !batch.includes(event));
        } else {
          console.warn('Failed to sync analytics batch:', response.status);
          break; // Stop trying other batches if one fails
        }
      }

      // Update stored pending events
      await this.savePendingEvents();
      
      if (this.pendingEvents.length === 0) {
        console.log('All analytics events synced successfully');
      }
    } catch (error) {
      console.error('Failed to sync analytics events:', error);
    }
  }

  async trackInteraction(
    contentType: InteractionData['contentType'],
    contentId: number,
    interactionType: InteractionData['interactionType'],
    metadata?: Record<string, any>
  ): Promise<void> {
    if (!this.deviceId) {
      console.warn('Device ID not initialized, skipping analytics');
      return;
    }

    const event: InteractionData = {
      deviceId: this.deviceId,
      contentType,
      contentId,
      interactionType,
      timestamp: new Date().toISOString(),
      metadata,
    };

    // Add to pending events
    this.pendingEvents.push(event);
    await this.savePendingEvents();

    // Try to sync immediately if online
    if (this.isOnline) {
      this.syncPendingEvents().catch(error => {
        console.log('Immediate sync failed (non-critical):', error);
      });
    }
  }

  async trackSessionStart(): Promise<void> {
    if (!this.deviceId) return;

    try {
      // Get existing session data
      const sessionDataStr = await AsyncStorage.getItem('beacon_session_data');
      let sessionData: SessionData;

      if (sessionDataStr) {
        sessionData = JSON.parse(sessionDataStr);
        sessionData.totalSessions += 1;
        sessionData.sessionStart = new Date().toISOString();
        sessionData.sessionEnd = undefined;
      } else {
        sessionData = {
          deviceId: this.deviceId,
          platform: Platform.OS,
          appVersion: '1.0.0', // Get from app config
          sessionStart: new Date().toISOString(),
          totalSessions: 1,
        };
      }

      await AsyncStorage.setItem('beacon_session_data', JSON.stringify(sessionData));

      // Send session data to server
      if (this.isOnline) {
        fetch(`${this.baseUrl}/api/analytics/session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(sessionData),
        }).catch(error => {
          console.log('Session tracking failed (non-critical):', error);
        });
      }
    } catch (error) {
      console.error('Failed to track session start:', error);
    }
  }

  async trackSessionEnd(): Promise<void> {
    if (!this.deviceId) return;

    try {
      const sessionDataStr = await AsyncStorage.getItem('beacon_session_data');
      if (sessionDataStr) {
        const sessionData: SessionData = JSON.parse(sessionDataStr);
        sessionData.sessionEnd = new Date().toISOString();
        
        await AsyncStorage.setItem('beacon_session_data', JSON.stringify(sessionData));

        // Send updated session data
        if (this.isOnline) {
          fetch(`${this.baseUrl}/api/analytics/session`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(sessionData),
          }).catch(error => {
            console.log('Session end tracking failed (non-critical):', error);
          });
        }
      }
    } catch (error) {
      console.error('Failed to track session end:', error);
    }
  }

  // Helper methods for common interactions
  async trackDevotionalRead(devotionalId: number, readPercentage?: number): Promise<void> {
    await this.trackInteraction('devotional', devotionalId, 'viewed', {
      readPercentage,
      timestamp: new Date().toISOString(),
    });
  }

  async trackAudioPlay(sermonId: number, position?: number): Promise<void> {
    await this.trackInteraction('audio', sermonId, 'play', {
      position,
      timestamp: new Date().toISOString(),
    });
  }

  async trackAudioComplete(sermonId: number, totalDuration?: number): Promise<void> {
    await this.trackInteraction('audio', sermonId, 'completed', {
      totalDuration,
      timestamp: new Date().toISOString(),
    });
  }

  async trackVideoWatch(videoId: number, watchDuration?: number): Promise<void> {
    await this.trackInteraction('video', videoId, 'viewed', {
      watchDuration,
      timestamp: new Date().toISOString(),
    });
  }

  async trackContentFavorite(contentType: InteractionData['contentType'], contentId: number): Promise<void> {
    await this.trackInteraction(contentType, contentId, 'favorited');
  }

  async trackContentDownload(contentType: InteractionData['contentType'], contentId: number, fileSize?: number): Promise<void> {
    await this.trackInteraction(contentType, contentId, 'downloaded', {
      fileSize,
      timestamp: new Date().toISOString(),
    });
  }

  // Get analytics data for debugging
  async getAnalyticsData(): Promise<{
    deviceId: string | null;
    pendingEvents: number;
    isOnline: boolean;
  }> {
    return {
      deviceId: this.deviceId,
      pendingEvents: this.pendingEvents.length,
      isOnline: this.isOnline,
    };
  }

  // Clean up
  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
}

// Export singleton instance
export const analyticsApi = AnalyticsService.getInstance();