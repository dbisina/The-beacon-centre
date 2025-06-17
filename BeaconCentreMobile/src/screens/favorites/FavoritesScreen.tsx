// src/screens/favorites/FavoritesScreen.tsx - NO MATERIAL TOP TABS
import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  useColorScheme,
  Text,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Octicons from '@expo/vector-icons/Octicons';

import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { useDevotionals, useVideoSermons, useAudioSermons } from '@/hooks/api';
import { useApp } from '@/context/AppContext';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Devotional, VideoSermon, AudioSermon } from '@/types/api';

// Tab type
type FavoriteTabType = 'devotionals' | 'videos' | 'audio';

// Favorite Devotional Card
const FavoriteDevotionalCard = ({ 
  devotional, 
  onPress, 
  isRead 
}: { 
  devotional: Devotional; 
  onPress: () => void;
  isRead?: boolean;
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <TouchableOpacity 
      style={[
        styles.favoriteCard,
        { backgroundColor: isDark ? colors.dark.card : colors.light.card }
      ]}
      onPress={onPress}
    >
      <View style={styles.cardContent}>
        <View style={styles.cardLeft}>
          <View style={[styles.devotionalIcon, { backgroundColor: `${colors.primary}20` }]}>
            <Icon name="menu-book" size={24} color={colors.primary} />
          </View>
        </View>
        <View style={styles.cardMain}>
          <Text style={[
            styles.cardTitle,
            { color: isDark ? colors.dark.text : colors.light.text }
          ]}>
            {devotional.title}
          </Text>
          <Text style={styles.cardSubtitle}>
            {devotional.verse_reference}
          </Text>
          <Text style={styles.cardDate}>
            {new Date(devotional.date).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.cardRight}>
          {isRead && (
            <View style={styles.readBadge}>
              <Icon name="check-circle" size={16} color={colors.green} />
            </View>
          )}
          <Icon name="favorite" size={20} color={colors.red} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Favorite Video Card
const FavoriteVideoCard = ({ 
  video, 
  onPress 
}: { 
  video: VideoSermon; 
  onPress: () => void;
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <TouchableOpacity 
      style={[
        styles.favoriteCard,
        { backgroundColor: isDark ? colors.dark.card : colors.light.card }
      ]}
      onPress={onPress}
    >
      <View style={styles.cardContent}>
        <View style={styles.cardLeft}>
          <Image
            source={{ 
              uri: video.thumbnail_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop'
            }}
            style={styles.videoThumbnail}
          />
        </View>
        <View style={styles.cardMain}>
          <Text style={[
            styles.cardTitle,
            { color: isDark ? colors.dark.text : colors.light.text }
          ]}>
            {video.title}
          </Text>
          <Text style={styles.cardSubtitle}>
            {video.speaker}
          </Text>
          <Text style={styles.cardDuration}>
            {video.duration}
          </Text>
        </View>
        <View style={styles.cardRight}>
          <Icon name="play-circle-outline" size={24} color={colors.primary} />
          <Icon name="favorite" size={20} color={colors.red} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Favorite Audio Card
const FavoriteAudioCard = ({ 
  audio, 
  onPress 
}: { 
  audio: AudioSermon; 
  onPress: () => void;
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <TouchableOpacity 
      style={[
        styles.favoriteCard,
        { backgroundColor: isDark ? colors.dark.card : colors.light.card }
      ]}
      onPress={onPress}
    >
      <View style={styles.cardContent}>
        <View style={styles.cardLeft}>
          <View style={[styles.audioIcon, { backgroundColor: `${colors.blue}20` }]}>
            <Icon name="headphones" size={24} color={colors.blue} />
          </View>
        </View>
        <View style={styles.cardMain}>
          <Text style={[
            styles.cardTitle,
            { color: isDark ? colors.dark.text : colors.light.text }
          ]}>
            {audio.title}
          </Text>
          <Text style={styles.cardSubtitle}>
            {audio.speaker}
          </Text>
          <Text style={styles.cardDuration}>
            {audio.duration}
          </Text>
        </View>
        <View style={styles.cardRight}>
          <Icon name="headphones" size={24} color={colors.blue} />
          <Icon name="favorite" size={20} color={colors.red} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Custom Tab Header
const CustomFavoriteTabHeader = ({ 
  activeTab, 
  onTabPress, 
  isDark,
  counts
}: { 
  activeTab: FavoriteTabType; 
  onTabPress: (tab: FavoriteTabType) => void;
  isDark: boolean;
  counts: { devotionals: number; videos: number; audio: number; };
}) => {
  const tabs = [
    { key: 'devotionals', label: 'Devotionals', count: counts.devotionals },
    { key: 'videos', label: 'Videos', count: counts.videos },
    { key: 'audio', label: 'Audio', count: counts.audio },
  ];

  return (
    <View style={[
      styles.customTabHeader,
      { backgroundColor: isDark ? colors.dark.background : colors.light.background }
    ]}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[
            styles.customTab,
            activeTab === tab.key && {
              borderBottomColor: isDark ? colors.dark.text : colors.light.text,
            },
          ]}
          onPress={() => onTabPress(tab.key as FavoriteTabType)}
        >
          <Text
            style={[
              styles.customTabText,
              {
                color: activeTab === tab.key 
                  ? isDark ? colors.dark.text : colors.light.text
                  : colors.textGrey,
                fontFamily: activeTab === tab.key 
                  ? typography.fonts.poppins.semiBold 
                  : typography.fonts.poppins.medium,
              }
            ]}
          >
            {tab.label} ({tab.count})
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// Empty State Component
const EmptyFavorites = ({ type, isDark }: { type: string; isDark: boolean; }) => (
  <View style={styles.emptyState}>
    <Icon name="favorite-border" size={64} color={colors.textGrey} />
    <Text style={[
      styles.emptyStateTitle,
      { color: isDark ? colors.dark.text : colors.light.text }
    ]}>
      No Favorite {type} Yet
    </Text>
    <Text style={styles.emptyStateText}>
      Items you favorite will appear here
    </Text>
  </View>
);

// Tab Content Components
const DevotionalsTab = ({ navigation }: any) => {
  const { data: allDevotionals } = useDevotionals();
  const { state } = useApp();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const favoriteDevotionals = allDevotionals?.filter(
    devotional => state.userData?.favoriteDevotionals?.includes(devotional.id)
  ) || [];

  if (favoriteDevotionals.length === 0) {
    return <EmptyFavorites type="Devotionals" isDark={isDark} />;
  }

  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.contentList}>
        {favoriteDevotionals.map((devotional) => (
          <FavoriteDevotionalCard
            key={devotional.id}
            devotional={devotional}
            isRead={state.userData?.readDevotionals?.includes(devotional.id)}
            onPress={() => navigation.navigate('DevotionalDetail', { devotional })}
          />
        ))}
      </View>
    </ScrollView>
  );
};

const VideosTab = ({ navigation }: any) => {
  const { data: allVideos } = useVideoSermons();
  const { state } = useApp();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const favoriteVideos = allVideos?.filter(
    video => state.userData?.favoriteVideoSermons?.includes(video.id)
  ) || [];

  if (favoriteVideos.length === 0) {
    return <EmptyFavorites type="Videos" isDark={isDark} />;
  }

  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.contentList}>
        {favoriteVideos.map((video) => (
          <FavoriteVideoCard
            key={video.id}
            video={video}
            onPress={() => navigation.navigate('SermonDetail', { 
              sermon: video, 
              type: 'video' 
            })}
          />
        ))}
      </View>
    </ScrollView>
  );
};

const AudioTab = ({ navigation }: any) => {
  const { data: allAudio } = useAudioSermons();
  const { state } = useApp();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const favoriteAudio = allAudio?.filter(
    audio => state.userData?.favoriteAudioSermons?.includes(audio.id)
  ) || [];

  if (favoriteAudio.length === 0) {
    return <EmptyFavorites type="Audio" isDark={isDark} />;
  }

  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.contentList}>
        {favoriteAudio.map((audio) => (
          <FavoriteAudioCard
            key={audio.id}
            audio={audio}
            onPress={() => navigation.navigate('SermonDetail', { 
              sermon: audio, 
              type: 'audio' 
            })}
          />
        ))}
      </View>
    </ScrollView>
  );
};

// Main Favorites Screen
const FavoritesScreen = ({ navigation }: any) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [activeTab, setActiveTab] = useState<FavoriteTabType>('devotionals');

  const { data: allDevotionals } = useDevotionals();
  const { data: allVideos } = useVideoSermons();
  const { data: allAudio } = useAudioSermons();
  const { state } = useApp();

  // Calculate counts
  const favoriteDevotionals = allDevotionals?.filter(
    d => state.userData?.favoriteDevotionals?.includes(d.id)
  ) || [];
  const favoriteVideos = allVideos?.filter(
    v => state.userData?.favoriteVideoSermons?.includes(v.id)
  ) || [];
  const favoriteAudioSermons = allAudio?.filter(
    a => state.userData?.favoriteAudioSermons?.includes(a.id)
  ) || [];

  const counts = {
    devotionals: favoriteDevotionals.length,
    videos: favoriteVideos.length,
    audio: favoriteAudioSermons.length,
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'devotionals':
        return <DevotionalsTab navigation={navigation} />;
      case 'videos':
        return <VideosTab navigation={navigation} />;
      case 'audio':
        return <AudioTab navigation={navigation} />;
      default:
        return <DevotionalsTab navigation={navigation} />;
    }
  };

  return (
    <SafeAreaView style={[
      styles.container,
      { backgroundColor: isDark ? colors.dark.background : colors.light.background }
    ]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[
          styles.headerTitle,
          { color: isDark ? colors.dark.text : colors.light.text }
        ]}>
          Favorites
        </Text>
      </View>

      {/* Custom Tab Header */}
      <CustomFavoriteTabHeader 
        activeTab={activeTab}
        onTabPress={setActiveTab}
        isDark={isDark}
        counts={counts}
      />

      {/* Tab Content */}
      <View style={styles.contentContainer}>
        {renderContent()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.styles.h4,
  },
  
  // Custom Tab Styles
  customTabHeader: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.light.border,
  },
  customTab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },

  customTabText: {
    fontSize: 14,
  },
  
  // Content Styles
  contentContainer: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
  },
  contentList: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
  },
  
  // Favorite Card Styles
  favoriteCard: {
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  cardLeft: {
    marginRight: 16,
  },
  cardMain: {
    flex: 1,
  },
  cardRight: {
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: typography.fonts.poppins.medium,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    fontFamily: typography.fonts.poppins.regular,
    color: colors.textGrey,
    marginBottom: 2,
  },
  cardDate: {
    fontSize: 12,
    fontFamily: typography.fonts.poppins.regular,
    color: colors.textGrey,
  },
  cardDuration: {
    fontSize: 12,
    fontFamily: typography.fonts.poppins.regular,
    color: colors.textGrey,
  },
  
  // Icon Styles
  devotionalIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoThumbnail: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.backgroundSecondary,
  },
  readBadge: {
    marginBottom: 4,
  },
  
  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 80,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontFamily: typography.fonts.poppins.semiBold,
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    fontFamily: typography.fonts.poppins.regular,
    color: colors.textGrey,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});

export default FavoritesScreen;