// src/screens/sermons/VideoSermons.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  useColorScheme,
  Text,
} from 'react-native';

import VideoCard from '@/components/video/VideoCard';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import OfflineBanner from '@/components/common/OfflineBanner';
import { useVideoSermons, useFeaturedContent } from '@/hooks/useSermons';
import { useApp } from '@/context/AppContext';
import LocalStorageService from '@/services/storage/LocalStorage';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { VideoSermon } from '@/types/api';

const VideoSermons = ({ navigation }: { navigation: any }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { state } = useApp();

  const { data: allSermons, isLoading, refetch } = useVideoSermons();
  const { data: featuredContent } = useFeaturedContent();
  
  const [favoriteVideos, setFavoriteVideos] = useState<number[]>([]);

  useEffect(() => {
    if (state.userData) {
      setFavoriteVideos(state.userData.favoriteVideoSermons);
    }
  }, [state.userData]);

  const handleVideoPress = (sermon: VideoSermon) => {
    navigation.navigate('SermonDetail', { sermon, type: 'video' });
  };

  const handleToggleFavorite = async (sermonId: number) => {
    const isFavorite = favoriteVideos.includes(sermonId);
    
    if (isFavorite) {
      await LocalStorageService.removeFavorite('video', sermonId);
      setFavoriteVideos(prev => prev.filter(id => id !== sermonId));
    } else {
      await LocalStorageService.addFavorite('video', sermonId);
      setFavoriteVideos(prev => [...prev, sermonId]);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <View style={styles.container}>
      {!state.isOnline && <OfflineBanner />}
      
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Featured Videos */}
        {(featuredContent as any)?.videos?.length > 0 && (
          <View style={styles.section}>
            <Text style={[
              styles.sectionTitle,
              { color: isDark ? colors.dark.text : colors.light.text }
            ]}>
              Featured Videos
            </Text>
            {(featuredContent as any)?.videos.map((sermon: VideoSermon) => (
              <VideoCard
                key={sermon.id}
                sermon={sermon}
                onPress={() => handleVideoPress(sermon)}
                isFavorite={favoriteVideos.includes(sermon.id)}
                onToggleFavorite={() => handleToggleFavorite(sermon.id)}
              />
            ))}
          </View>
        )}

        {/* All Video Sermons */}
        <View style={styles.section}>
          <Text style={[
            styles.sectionTitle,
            { color: isDark ? colors.dark.text : colors.light.text }
          ]}>
            All Video Sermons
          </Text>
          {(allSermons as VideoSermon[] | undefined)?.map((sermon: VideoSermon) => (
            <VideoCard
              key={sermon.id}
              sermon={sermon}
              onPress={() => handleVideoPress(sermon)}
              isFavorite={favoriteVideos.includes(sermon.id)}
              onToggleFavorite={() => handleToggleFavorite(sermon.id)}
            />
          ))}
        </View>
      </ScrollView>
    </View>
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
    marginBottom: 8,
    paddingHorizontal: 16,
  },
});

export default VideoSermons;