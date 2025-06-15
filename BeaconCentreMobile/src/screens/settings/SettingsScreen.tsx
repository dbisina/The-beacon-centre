// src/screens/settings/SettingsScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  useColorScheme,
  Alert,
  Share,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useApp } from '@/context/AppContext';
import LocalStorageService from '@/services/storage/LocalStorage';
import { colors, typography } from '@/constants';
import { AppSettings } from '@/types/storage';

const SettingsScreen = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { state, refreshUserData } = useApp();
  
  const [settings, setSettings] = useState<AppSettings>({
    notifications: true,
    autoDownloadWifi: false,
    fontSize: 'medium',
    theme: 'system',
  });

  const [stats, setStats] = useState({
    totalDevotionalsRead: 0,
    currentStreak: 0,
    longestStreak: 0,
    downloadedAudio: 0,
    favoriteContent: 0,
  });

  useEffect(() => {
    if (state.userData) {
      setSettings(state.userData.appSettings);
      setStats({
        totalDevotionalsRead: state.userData.readDevotionals.length,
        currentStreak: state.userData.readingStreak.currentStreak,
        longestStreak: state.userData.readingStreak.longestStreak,
        downloadedAudio: state.userData.downloadedAudio.length,
        favoriteContent: state.userData.favoriteDevotionals.length + 
                        state.userData.favoriteVideoSermons.length + 
                        state.userData.favoriteAudioSermons.length,
      });
    }
  }, [state.userData]);

  const updateSetting = async (key: keyof AppSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    await LocalStorageService.updateSettings(newSettings);
    await refreshUserData();
  };

  const clearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'This will remove all your favorites, reading history, and downloaded content. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All', 
          style: 'destructive',
          onPress: async () => {
            await LocalStorageService.clearCache();
            await refreshUserData();
            Alert.alert('Success', 'All data has been cleared.');
          }
        },
      ]
    );
  };

  const shareApp = async () => {
    try {
      await Share.share({
        message: 'Check out The Beacon Centre app for daily devotionals and sermons!',
        url: 'https://thebeaconcentre.app', // Your app store URL
      });
    } catch (error) {
      console.error('Error sharing app:', error);
    }
  };

  const openWebsite = () => {
    Linking.openURL('https://thebeaconcentre.org'); // Your church website
  };

  const contactSupport = () => {
    Linking.openURL('mailto:support@thebeaconcentre.org?subject=Mobile App Support');
  };

  const SettingItem = ({ 
    title, 
    subtitle, 
    icon, 
    rightComponent, 
    onPress,
    showArrow = false 
  }: {
    title: string;
    subtitle: string;
    icon: string;
    rightComponent?: React.ReactNode;
    onPress?: () => void;
    showArrow?: boolean;
  }) => (
    <TouchableOpacity
      style={[
        styles.settingItem,
        { backgroundColor: isDark ? colors.dark.card : colors.light.card }
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingLeft}>
        <Icon name={icon} size={24} color={colors.primary} />
        <View style={styles.settingText}>
          <Text style={[
            styles.settingTitle,
            { color: isDark ? colors.dark.text : colors.light.text }
          ]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.settingSubtitle, { color: colors.textGrey }]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      
      <View style={styles.settingRight}>
        {rightComponent}
        {showArrow && (
          <Icon name="chevron-right" size={24} color={colors.textGrey} />
        )}
      </View>
    </TouchableOpacity>
  );

  const StatCard = ({ title, value, icon }: { title: string; value: string | number; icon: string }) => (
    <View style={[
      styles.statCard,
      { backgroundColor: isDark ? colors.dark.card : colors.light.card }
    ]}>
      <Icon name={icon} size={24} color={colors.primary} />
      <Text style={[
        styles.statValue,
        { color: isDark ? colors.dark.text : colors.light.text }
      ]}>
        {value}
      </Text>
      <Text style={[styles.statTitle, { color: colors.textGrey }]}>
        {title}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[
      styles.container,
      { backgroundColor: isDark ? colors.dark.background : colors.light.background }
    ]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* User Stats */}
        <View style={styles.section}>
          <Text style={[
            styles.sectionTitle,
            { color: isDark ? colors.dark.text : colors.light.text }
          ]}>
            Your Journey
          </Text>
          
          <View style={styles.statsContainer}>
            <StatCard
              title="Devotionals Read"
              value={stats.totalDevotionalsRead}
              icon="book"
            />
            <StatCard
              title="Current Streak"
              value={`${stats.currentStreak} days`}
              icon="local-fire-department"
            />
            <StatCard
              title="Longest Streak"
              value={`${stats.longestStreak} days`}
              icon="emoji-events"
            />
            <StatCard
              title="Downloaded Audio"
              value={stats.downloadedAudio}
              icon="download"
            />
            <StatCard
              title="Favorite Content"
              value={stats.favoriteContent}
              icon="favorite"
            />
          </View>
        </View>

        {/* App Preferences */}
        <View style={styles.section}>
          <Text style={[
            styles.sectionTitle,
            { color: isDark ? colors.dark.text : colors.light.text }
          ]}>
            Preferences
          </Text>

          <SettingItem
            title="Push Notifications"
            subtitle="Get notified about new content"
            icon="notifications"
            rightComponent={
              <Switch
                value={settings.notifications}
                onValueChange={(value) => updateSetting('notifications', value)}
                trackColor={{ false: colors.textGrey, true: colors.primary }}
                thumbColor="#fff"
              />
            }
          />

          <SettingItem
            title="Auto-download on WiFi"
            subtitle="Automatically download audio sermons"
            icon="wifi"
            rightComponent={
              <Switch
                value={settings.autoDownloadWifi}
                onValueChange={(value) => updateSetting('autoDownloadWifi', value)}
                trackColor={{ false: colors.textGrey, true: colors.primary }}
                thumbColor="#fff"
              />
            }
          />

          <SettingItem
            title="Text Size"
            subtitle={`Currently: ${settings.fontSize}`}
            icon="text-fields"
            onPress={() => {
              Alert.alert(
                'Text Size',
                'Choose your preferred text size',
                [
                  { text: 'Small', onPress: () => updateSetting('fontSize', 'small') },
                  { text: 'Medium', onPress: () => updateSetting('fontSize', 'medium') },
                  { text: 'Large', onPress: () => updateSetting('fontSize', 'large') },
                  { text: 'Cancel', style: 'cancel' },
                ]
              );
            }}
            showArrow
            rightComponent={null}
          />

          <SettingItem
            title="Theme"
            subtitle={`Currently: ${settings.theme}`}
            icon="palette"
            onPress={() => {
              Alert.alert(
                'Theme',
                'Choose your preferred theme',
                [
                  { text: 'Light', onPress: () => updateSetting('theme', 'light') },
                  { text: 'Dark', onPress: () => updateSetting('theme', 'dark') },
                  { text: 'System', onPress: () => updateSetting('theme', 'system') },
                  { text: 'Cancel', style: 'cancel' },
                ]
              );
            }}
            showArrow
            rightComponent={null}
          />
        </View>

        {/* Content Management */}
        <View style={styles.section}>
          <Text style={[
            styles.sectionTitle,
            { color: isDark ? colors.dark.text : colors.light.text }
          ]}>
            Content & Storage
          </Text>

          <SettingItem
            title="Downloaded Content"
            subtitle="Manage offline audio downloads"
            icon="storage"
            onPress={() => {/* Navigate to download manager */}}
            showArrow
            rightComponent={null}
          />

          <SettingItem
            title="Clear Cache"
            subtitle="Free up storage space"
            icon="delete-sweep"
            onPress={clearAllData}
            showArrow
            rightComponent={null}
          />
        </View>

        {/* Support & Information */}
        <View style={styles.section}>
          <Text style={[
            styles.sectionTitle,
            { color: isDark ? colors.dark.text : colors.light.text }
          ]}>
            Support & Information
          </Text>

          <SettingItem
            title="Share App"
            subtitle="Tell others about The Beacon Centre"
            icon="share"
            onPress={shareApp}
            showArrow
            rightComponent={null}
          />

          <SettingItem
            title="Visit Website"
            subtitle="thebeaconcentre.org"
            icon="language"
            onPress={openWebsite}
            showArrow
            rightComponent={null}
          />

          <SettingItem
            title="Contact Support"
            subtitle="Get help or report issues"
            icon="help"
            onPress={contactSupport}
            showArrow
            rightComponent={null}
          />

          <SettingItem
            title="App Version"
            subtitle="1.0.0"
            icon="info"
            rightComponent={null}
            onPress={() => {}}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontFamily: typography.fonts.poppins.bold,
    fontSize: typography.sizes.large,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
  },
  statCard: {
    width: '48%',
    margin: '1%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontFamily: typography.fonts.poppins.bold,
    fontSize: typography.sizes.title,
    marginVertical: 4,
  },
  statTitle: {
    fontFamily: typography.fonts.poppins.regular,
    fontSize: typography.sizes.small,
    textAlign: 'center',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginHorizontal: 16,
    marginVertical: 2,
    borderRadius: 8,
  },
  settingLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    marginLeft: 16,
    flex: 1,
  },
  settingTitle: {
    fontFamily: typography.fonts.poppins.medium,
    fontSize: typography.sizes.medium,
  },
  settingSubtitle: {
    fontFamily: typography.fonts.poppins.regular,
    fontSize: typography.sizes.small,
    marginTop: 2,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default SettingsScreen;