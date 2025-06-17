// src/types/navigation.ts - UPDATED WITH NEW SCREENS
import { NavigatorScreenParams } from '@react-navigation/native';
import { Devotional, VideoSermon, AudioSermon, Announcement } from './api';

export type RootStackParamList = {
  Main: NavigatorScreenParams<MainTabParamList>;
  DevotionalDetail: { devotional: Devotional };
  SermonDetail: { sermon: VideoSermon | AudioSermon; type: 'video' | 'audio' };
  AnnouncementDetail: { announcement: Announcement };
  AudioPlayer: { sermon: AudioSermon };
  ScriptureBooks: { category: string };
  ScriptureChapter: { book: string; chapter: number };
};

export type MainTabParamList = {
  DevotionalStack: NavigatorScreenParams<DevotionalStackParamList>;
  SermonsStack: NavigatorScreenParams<SermonsStackParamList>;
  AnnouncementsStack: NavigatorScreenParams<ScripturesStackParamList>; // Now Scriptures
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

export type ScripturesStackParamList = {
  ScripturesHome: undefined;
  ScriptureBooks: { category: string };
  ScriptureChapter: { book: string; chapter: number };
  ScriptureReader: { book: string; chapter: number; verse?: number };
};

export type FavoritesStackParamList = {
  FavoritesHome: undefined;
};

export type SettingsStackParamList = {
  SettingsHome: undefined;
  NotificationSettings: undefined;
  DisplaySettings: undefined;
  AboutApp: undefined;
};