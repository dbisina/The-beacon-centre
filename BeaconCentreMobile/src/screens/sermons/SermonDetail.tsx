// src/screens/sermons/SermonDetail.tsx - COMPLETE IMPLEMENTATION
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  Share,
  Alert,
  useColorScheme,
  Dimensions,
  Platform,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import YoutubePlayer from 'react-native-youtube-iframe';

import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { SermonsStackParamList, RootStackParamList } from '@/types/navigation';
import { VideoSermon, AudioSermon } from '@/types/api';
import { useFavorites } from '@/hooks/useFavorites';
import { useDownloads } from '@/hooks/useDownloads';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import LocalStorageService from '@/services/storage/LocalStorage';

const { width, height } = Dimensions.get('window');

type SermonDetailScreenProps = {
  route: RouteProp<SermonsStackParamList, 'SermonDetail'>;
  navigation: StackNavigationProp<RootStackParamList, 'SermonDetail'>;
};

const SermonDetailScreen: React.FC<SermonDetailScreenProps> = ({
  route,
  navigation
}) => {
  const { sermon, type } = route.params;
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { isDownloaded, isDownloading, downloadAudio, getDownloadProgress } = useDownloads();
  const { toggleFavorite } = useFavorites();
  
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkFavoriteStatus();
    setIsLoading(false);
  }, []);

  const checkFavoriteStatus = async () => {
    try {
      const userData = await LocalStorageService.getUserData();
      const favorites = type === 'video' 
        ? userData.favoriteVideoSermons 
        : userData.favoriteAudioSermons;
      setIsFavorite(favorites.includes(sermon.id));
    } catch (error) {
      console.log('Error checking favorite status:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const handleShare = async () => {
    try {
      const shareContent = {
        message: `${type === 'video' ? 'Watch' : 'Listen to'} "${sermon.title}" by ${sermon.speaker} on The Beacon Centre app`,
        title: sermon.title,
      };

      if (type === 'video' && 'youtube_id' in sermon) {
        shareContent.message += `\nhttps://youtu.be/${sermon.youtube_id}`;
      }

      await Share.share(shareContent);
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  const handleFavorite = async () => {
    try {
      const success = await toggleFavorite(type === 'video' ? 'video_sermon' : 'audio_sermon', sermon.id);
      if (!success) {
        Alert.alert('Error', 'Failed to update favorites');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update favorites');
    }
  };

  const handlePlayAudio = () => {
    if (type === 'audio') {
      // Navigate to audio player or start audio playback
      navigation.navigate('AudioPlayer', { sermon: sermon as AudioSermon });
    }
  };

  const handleDownload = async () => {
    if (type === 'audio' && !isDownloaded(sermon.id) && !isDownloading(sermon.id)) {
      await downloadAudio(sermon as AudioSermon);
    }
  };

  const handleVideoStateChange = (state: string) => {
    setIsVideoPlaying(state === 'playing');
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <SafeAreaView style={[
      styles.container,
      { backgroundColor: isDark ? colors.dark.background : colors.light.background }
    ]}>
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={isDark ? colors.dark.background : colors.light.background}
      />

      {/* Header */}
      <View style={[
        styles.header,
        { backgroundColor: isDark ? colors.dark.card : colors.light.card }
      ]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={isDark ? colors.dark.text : colors.light.text} />
        </TouchableOpacity>
        
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
            <Icon name="share" size={22} color={isDark ? colors.dark.text : colors.light.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleFavorite}>
            <Icon 
              name={isFavorite ? "favorite" : "favorite-border"} 
              size={22} 
              color={isFavorite ? colors.primary : (isDark ? colors.dark.text : colors.light.text)}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Video Player or Audio Thumbnail */}
        <View style={styles.mediaContainer}>
          {type === 'video' && 'youtube_id' in sermon ? (
            <View style={styles.videoContainer}>
              <YoutubePlayer
                height={200}
                width={width - 32}
                videoId={sermon.youtube_id}
                onChangeState={handleVideoStateChange}
                onReady={() => setVideoReady(true)}
              />
              {!videoReady && (
                <View style={styles.videoPlaceholder}>
                  <LoadingSpinner />
                </View>
              )}
            </View>
          ) : (
            <View style={styles.audioThumbnail}>
              <LinearGradient
                colors={[colors.primary, colors.primary + '80']}
                style={styles.audioGradient}
              >
                <Icon name="music-note" size={80} color="#fff" />
                <TouchableOpacity 
                  style={styles.audioPlayButton}
                  onPress={handlePlayAudio}
                >
                  <Icon name="play-arrow" size={60} color="#fff" />
                </TouchableOpacity>
              </LinearGradient>
            </View>
          )}
        </View>

        {/* Sermon Info */}
        <View style={styles.sermonInfo}>
          <Text style={[
            styles.sermonTitle,
            { color: isDark ? colors.dark.text : colors.light.text }
          ]}>
            {sermon.title}
          </Text>
          
          <Text style={[
            styles.sermonSpeaker,
            { color: isDark ? colors.dark.textSecondary : colors.light.textSecondary }
          ]}>
            {sermon.speaker}
          </Text>

          <View style={styles.sermonMeta}>
            <View style={styles.metaItem}>
              <Icon name="access-time" size={16} color={colors.primary} />
              <Text style={[
                styles.metaText,
                { color: isDark ? colors.dark.textSecondary : colors.light.textSecondary }
              ]}>
                {sermon.duration}
              </Text>
            </View>

            {sermon.sermon_date && (
              <View style={styles.metaItem}>
                <Icon name="calendar-today" size={16} color={colors.primary} />
                <Text style={[
                  styles.metaText,
                  { color: isDark ? colors.dark.textSecondary : colors.light.textSecondary }
                ]}>
                  {formatDate(sermon.sermon_date)}
                </Text>
              </View>
            )}

            {sermon.category && (
              <View style={styles.metaItem}>
                <Icon name="folder" size={16} color={colors.primary} />
                <Text style={[
                  styles.metaText,
                  { color: isDark ? colors.dark.textSecondary : colors.light.textSecondary }
                ]}>
                  {sermon.category}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {type === 'audio' && (
            <>
              <TouchableOpacity 
                style={[styles.actionButton, styles.playButton]}
                onPress={handlePlayAudio}
              >
                <Icon name="play-arrow" size={24} color="#fff" />
                <Text style={styles.actionButtonText}>Play Audio</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[
                  styles.actionButton, 
                  styles.downloadButton,
                  (isDownloaded(sermon.id) || isDownloading(sermon.id)) && styles.downloadedButton
                ]}
                onPress={handleDownload}
                disabled={isDownloaded(sermon.id) || isDownloading(sermon.id)}
              >
                <Icon 
                  name={isDownloaded(sermon.id) ? "download-done" : isDownloading(sermon.id) ? "hourglass-empty" : "download"} 
                  size={24} 
                  color={isDownloaded(sermon.id) ? colors.success : isDownloading(sermon.id) ? colors.primary : "#fff"} 
                />
                <Text style={[
                  styles.actionButtonText,
                  (isDownloaded(sermon.id) || isDownloading(sermon.id)) && { 
                    color: isDownloaded(sermon.id) ? colors.success : colors.primary 
                  }
                ]}>
                  {isDownloaded(sermon.id) ? 'Downloaded' : isDownloading(sermon.id) ? `${getDownloadProgress(sermon.id)}%` : 'Download'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Description */}
        {sermon.description && (
          <View style={styles.descriptionContainer}>
            <Text style={[
              styles.descriptionTitle,
              { color: isDark ? colors.dark.text : colors.light.text }
            ]}>
              Description
            </Text>
            <Text style={[
              styles.descriptionText,
              { color: isDark ? colors.dark.textSecondary : colors.light.textSecondary }
            ]}>
              {sermon.description}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
  },
  backButton: {
    padding: 8,
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  content: {
    flex: 1,
  },
  mediaContainer: {
    padding: 16,
  },
  videoContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  videoPlaceholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  audioThumbnail: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
  },
  audioGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  audioPlayButton: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 40,
    padding: 10,
  },
  sermonInfo: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  sermonTitle: {
    fontSize: 24,
    fontFamily: typography.fonts.poppins.bold,
    marginBottom: 8,
    lineHeight: 32,
  },
  sermonSpeaker: {
    fontSize: 18,
    fontFamily: typography.fonts.poppins.medium,
    marginBottom: 16,
  },
  sermonMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    fontFamily: typography.fonts.poppins.regular,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  playButton: {
    backgroundColor: colors.primary,
  },
  downloadButton: {
    backgroundColor: colors.secondary,
  },
  downloadedButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.success,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: typography.fonts.poppins.medium,
  },
  descriptionContainer: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  descriptionTitle: {
    fontSize: 18,
    fontFamily: typography.fonts.poppins.semiBold,
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 16,
    fontFamily: typography.fonts.poppins.regular,
    lineHeight: 24,
  },
});

export default SermonDetailScreen;