// src/screens/favorites/FavoritesScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  useColorScheme,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

import DevotionalCard from '@/components/devotional/DevotionalCard';
import VideoCard from '@/components/video/VideoCard';
import AudioCard from '@/components/audio/AudioCard';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useApp } from '@/context/AppContext';
import { useDevotionals, useVideoSermons, useAudioSermons } from '@/hooks/api';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { VideoSermon, AudioSermon } from '@/types/api';

const Tab = createMaterialTopTabNavigator();

const FavoriteDevotionals = ({ navigation }: { navigation: any }) => {
  const { state } = useApp();
  const { data: allDevotionals } = useDevotionals();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const favoriteDevotionals = allDevotionals?.filter(
    devotional => state.userData?.favoriteDevotionals.includes(devotional.id)
  );

  if (!favoriteDevotionals?.length) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: colors.textGrey }]}>
          No favorite devotionals yet
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scrollView}>
      {favoriteDevotionals.map((devotional) => (
        <DevotionalCard
          key={devotional.id}
          devotional={devotional}
          onPress={() => navigation.navigate('DevotionalDetail', { devotional })}
          isRead={state.userData?.readDevotionals.includes(devotional.id)}
        />
      ))}
    </ScrollView>
  );
};

const FavoriteVideos = ({ navigation }: { navigation: any }) => {
  const { state } = useApp();
  const { data: allVideos } = useVideoSermons();

  const favoriteVideos = (allVideos as VideoSermon[] | undefined)?.filter(
    (video: VideoSermon) => state.userData?.favoriteVideoSermons.includes(video.id)
  );

  if (!favoriteVideos?.length) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: colors.textGrey }]}>
          No favorite videos yet
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scrollView}>
      {favoriteVideos.map((video) => (
        <VideoCard
          key={video.id}
          sermon={video}
          onPress={() => navigation.navigate('SermonDetail', { sermon: video, type: 'video' })}
          isFavorite={true}
        />
      ))}
    </ScrollView>
  );
};

const FavoriteAudio = ({ navigation }: { navigation: any }) => {
  const { state } = useApp();
  const { data: allAudio } = useAudioSermons();

  const favoriteAudio = (allAudio as AudioSermon[] | undefined)?.filter(
    (audio: AudioSermon) => state.userData?.favoriteAudioSermons.includes(audio.id)
  );

  if (!favoriteAudio?.length) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: colors.textGrey }]}>
          No favorite audio sermons yet
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scrollView}>
      {favoriteAudio.map((audio) => (
        <AudioCard
          key={audio.id}
          sermon={audio}
          onPress={() => navigation.navigate('SermonDetail', { sermon: audio, type: 'audio' })}
          isFavorite={true}
        />
      ))}
    </ScrollView>
  );
};

const FavoritesScreen = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <SafeAreaView style={[
      styles.container,
      { backgroundColor: isDark ? colors.dark.background : colors.light.background }
    ]}>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: isDark ? colors.dark.text : colors.textGrey,
          tabBarStyle: {
            backgroundColor: isDark ? colors.dark.background : colors.light.background,
          },
          tabBarIndicatorStyle: {
            backgroundColor: colors.primary,
          },
          tabBarLabelStyle: {
            fontFamily: typography.fonts.poppins.medium,
            fontSize: typography.sizes.small,
          },
          tabBarScrollEnabled: true,
          tabBarItemStyle: {
            width: 'auto',
          },
        }}
      >
        <Tab.Screen 
          name="FavoriteDevotionals" 
          component={FavoriteDevotionals}
          options={{ title: 'Devotionals' }}
        />
        <Tab.Screen 
          name="FavoriteVideos" 
          component={FavoriteVideos}
          options={{ title: 'Videos' }}
        />
        <Tab.Screen 
          name="FavoriteAudio" 
          component={FavoriteAudio}
          options={{ title: 'Audio' }}
        />
      </Tab.Navigator>
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontFamily: typography.fonts.poppins.regular,
    fontSize: typography.sizes.medium,
    textAlign: 'center',
  },
});

export default FavoritesScreen;