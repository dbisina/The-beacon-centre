// src/screens/sermons/SermonDetail.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Share,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { SermonsStackParamList } from '@/types/navigation';
import { colors, typography } from '@/constants';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { analyticsApi } from '@/services/api/analytics';
import { formatDate } from '@/utils/dateUtils';
import VideoPlayer from '@/components/video/VideoPlayer';
import AudioPlayer from '@/components/audio/AudioPlayer';
import DownloadManager from '@/components/audio/DownloadManager';
import RefreshControl from '@/components/common/RefreshControl';

type SermonDetailRouteProp = RouteProp<SermonsStackParamList, 'SermonDetail'>;

export default function SermonDetail() {
  const navigation = useNavigation();
  const route = useRoute<SermonDetailRouteProp>();
  const { sermon, type } = route.params;
  
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const { userData, addFavorite, removeFavorite } = useLocalStorage();
  const { playSermon } = useAudioPlayer();
  
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (userData) {
      const favorites = type === 'video' ? userData.favoriteVideoSermons : userData.favoriteAudioSermons;
      setIsFavorite(favorites.includes(sermon.id));
    }
  }, [userData, sermon.id, type]);

  useEffect(() => {
    // Track view
    analyticsApi.trackSermonPlay(sermon.id, type);
  }, [sermon.id, type]);

  const handleToggleFavorite = async () => {
    try {
      if (isFavorite) {
        await removeFavorite(type, sermon.id);
        setIsFavorite(false);
      } else {
        await addFavorite(type, sermon.id);
        setIsFavorite(true);
        analyticsApi.trackContentFavorite(type === 'video' ? 'video_sermon' : 'audio_sermon', sermon.id);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update favorites');
    }
  };

  const handleShare = async () => {
    try {
      let shareMessage = `Check out this sermon: "${sermon.title}" by ${sermon.speaker}`;
      
      if (type === 'video') {
        shareMessage += `\n\nWatch on YouTube: https://youtu.be/${(sermon as any).youtube_id}`;
      }
      
      shareMessage += '\n\nFrom The Beacon Centre app';

      await Share.share({
        message: shareMessage,
        title: sermon.title,
      });
      
      analyticsApi.trackInteraction(type === 'video' ? 'video_sermon' : 'audio_sermon', sermon.id, 'shared');
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handlePlayAudio = async () => {
    if (type === 'audio') {
      try {
        await playSermon(sermon as any);
      } catch (error) {
        Alert.alert('Error', 'Failed to play audio');
      }
    }
  };

  return (
    <SafeAreaView style={[
      styles.container,
      { backgroundColor: isDark ? colors.dark.background : colors.light.background }
    ]}>
      {/* Header */}
      <View style={[
        styles.header,
        { backgroundColor: isDark ? colors.dark.background : colors.light.background }
      ]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Icon name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
            <Icon name="share" size={22} color={colors.textGrey} />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={handleToggleFavorite} style={styles.headerButton}>
            <Icon 
              name={isFavorite ? 'favorite' : 'favorite-border'} 
              size={22} 
              color={isFavorite ? colors.red : colors.textGrey} 
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={() => {}} />
        }
      >
        {/* Media Player */}
        {type === 'video' ? (
          <VideoPlayer sermon={sermon as any} autoplay={false} />
        ) : (
          <View style={styles.audioSection}>
            <TouchableOpacity
              style={[styles.playButton, { backgroundColor: colors.primary }]}
              onPress={handlePlayAudio}
            >
              <Icon name="play-arrow" size={24} color="#fff" />
              <Text style={styles.playButtonText}>Play Audio</Text>
            </TouchableOpacity>
            
            <DownloadManager 
              sermon={sermon as any}
              onDownloadComplete={() => {
                Alert.alert('Success', 'Audio downloaded for offline listening');
              }}
            />
          </View>
        )}

        {/* Sermon Info */}
        <View style={styles.infoContainer}>
          <Text style={[
            styles.title,
            { color: isDark ? colors.dark.text : colors.light.text }
          ]}>
            {sermon.title}
          </Text>
          
          <Text style={[styles.speaker, { color: colors.primary }]}>
            {sermon.speaker}
          </Text>

          <View style={styles.metaInfo}>
            {sermon.sermon_date && (
              <Text style={[styles.metaText, { color: colors.textGrey }]}>
                {formatDate(sermon.sermon_date)}
              </Text>
            )}
            {(sermon as any).duration && (
              <Text style={[styles.metaText, { color: colors.textGrey }]}>
                Duration: {(sermon as any).duration}
              </Text>
            )}
            {sermon.category && (
              <Text style={[styles.metaText, { color: colors.blue }]}>
                Category: {sermon.category}
              </Text>
            )}
          </View>

          {sermon.is_featured && (
            <View style={styles.featuredBadge}>
              <Icon name="star" size={16} color={colors.yellow} />
              <Text style={[styles.featuredText, { color: colors.yellow }]}>
                Featured Sermon
              </Text>
            </View>
          )}

          {sermon.description && (
            <View style={styles.descriptionContainer}>
              <Text style={[styles.descriptionTitle, { color: isDark ? colors.dark.text : colors.light.text }]}>
                Description
              </Text>
              <Text style={[
                styles.description,
                { color: isDark ? colors.dark.text : colors.textGrey }
              ]}>
                {sermon.description}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
  },
  headerButton: {
    padding: 8,
  },
  headerActions: {
    flexDirection: 'row',
  },
  content: {
    flex: 1,
  },
  audioSection: {
    padding: 16,
    alignItems: 'center',
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  playButtonText: {
    fontFamily: typography.fonts.poppins.medium,
    fontSize: typography.sizes.medium,
    color: '#fff',
    marginLeft: 8,
  },
  infoContainer: {
    padding: 16,
  },
  title: {
    fontFamily: typography.fonts.poppins.bold,
    fontSize: typography.sizes.title,
    lineHeight: 32,
    marginBottom: 8,
  },
  speaker: {
    fontFamily: typography.fonts.poppins.medium,
    fontSize: typography.sizes.large,
    marginBottom: 16,
  },
  metaInfo: {
    marginBottom: 16,
  },
  metaText: {
    fontFamily: typography.fonts.poppins.regular,
    fontSize: typography.sizes.medium,
    marginBottom: 4,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.yellow + '20',
    borderRadius: 16,
    marginBottom: 16,
  },
  featuredText: {
    fontFamily: typography.fonts.poppins.medium,
    fontSize: typography.sizes.small,
    marginLeft: 4,
  },
  descriptionContainer: {
    marginTop: 8,
  },
  descriptionTitle: {
    fontFamily: typography.fonts.poppins.bold,
    fontSize: typography.sizes.large,
    marginBottom: 8,
  },
  description: {
    fontFamily: typography.fonts.notoSerif.regular,
    fontSize: typography.sizes.medium,
    lineHeight: 24,
  },
});