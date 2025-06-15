// src/types/storage.ts
export interface LocalUserData {
    deviceId: string;
    favoriteDevotionals: number[];
    favoriteVideoSermons: number[];
    favoriteAudioSermons: number[];
    readDevotionals: number[];
    downloadedAudio: DownloadedAudio[];
    bookmarkedAnnouncements: number[];
    readingStreak: ReadingStreak;
    appSettings: AppSettings;
    lastSyncDate: string;
  }
  
  export interface DownloadedAudio {
    sermonId: number;
    localPath: string;
    downloadDate: string;
    title: string;
    speaker: string;
    duration?: string;
  }
  
  export interface ReadingStreak {
    currentStreak: number;
    lastReadDate: string;
    longestStreak: number;
  }
  
  export interface AppSettings {
    notifications: boolean;
    autoDownloadWifi: boolean;
    fontSize: 'small' | 'medium' | 'large';
    theme: 'light' | 'dark' | 'system';
  }