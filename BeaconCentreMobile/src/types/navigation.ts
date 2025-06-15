// src/types/navigation.ts
import { NavigatorScreenParams } from '@react-navigation/native';
import { Devotional, VideoSermon, AudioSermon, Announcement } from './api';

export type RootStackParamList = {
  Main: NavigatorScreenParams<MainTabParamList>;
  DevotionalDetail: { devotional: Devotional };
  SermonDetail: { sermon: VideoSermon | AudioSermon; type: 'video' | 'audio' };
  AnnouncementDetail: { announcement: Announcement };
  AudioPlayer: { sermon: AudioSermon };
};

export type MainTabParamList = {
  DevotionalStack: NavigatorScreenParams<DevotionalStackParamList>;
  SermonsStack: NavigatorScreenParams<SermonsStackParamList>;
  AnnouncementsStack: NavigatorScreenParams<AnnouncementsStackParamList>;
  FavoritesStack: NavigatorScreenParams<FavoritesStackParamList>;
  SettingsStack: NavigatorScreenParams<SettingsStackParamList>;
};

export type DevotionalStackParamList = {
  DevotionalHome: undefined;
  DevotionalDetail: { devotional: Devotional };
  DevotionalArchive: undefined;
};

export type SermonsStackParamList = {
  SermonsHome: undefined;
  VideoSermons: undefined;
  AudioSermons: undefined;
  SermonDetail: { sermon: VideoSermon | AudioSermon; type: 'video' | 'audio' };
};

export type AnnouncementsStackParamList = {
  AnnouncementsHome: undefined;
  AnnouncementDetail: { announcement: Announcement };
};

export type FavoritesStackParamList = {
  FavoritesHome: undefined;
};

export type SettingsStackParamList = {
  SettingsHome: undefined;
};

// src/types/content.ts
export interface ContentFilter {
  category?: string;
  speaker?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  featured?: boolean;
}

export interface ContentSort {
  field: 'date' | 'title' | 'speaker' | 'created_at';
  direction: 'asc' | 'desc';
}

export interface SearchResult<T> {
  items: T[];
  totalCount: number;
  hasMore: boolean;
}

export interface PlaylistItem {
  id: number;
  type: 'audio' | 'video';
  title: string;
  speaker: string;
  duration?: string;
  url: string;
  thumbnail?: string;
}

export interface ReadingProgress {
  devotionalId: number;
  progress: number; // 0-100
  timeSpent: number; // seconds
  lastPosition?: number;
  completed: boolean;
  readDate: string;
}