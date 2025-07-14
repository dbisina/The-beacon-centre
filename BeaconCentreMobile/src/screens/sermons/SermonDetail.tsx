// src/screens/sermons/SermonDetail.tsx - MODERN DESIGN
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
import { BlurView } from 'expo-blur';
import YoutubePlayer from 'react-native-youtube-iframe';

import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { SermonsStackParamList, RootStackParamList } from '@/types/navigation';
import { VideoSermon, AudioSermon } from '@/types/api';
import { useFavorites } from '@/hooks/useFavorites';
import { useDownloads } from '@/hooks/useDownloads';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import LocalStorageService from '@/services/storage/LocalStorage';
import { useAudio } from '@/context/AudioContext';

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
  const { playSermon } = useAudio();
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

  const handlePlayAudio = async () => {
    if (type === 'audio') {
      try {
        console.log('🎵 Starting immediate playback');
        await playSermon(sermon as AudioSermon);
      } catch (error) {
        console.error('❌ Failed to play sermon:', error);
      }
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

  // Add debug log at the top of the component
  console.log('SermonDetail sermon object:', sermon);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <SafeAreaView style={[
      styles.modernContainer,
      { backgroundColor: isDark ? colors.dark.background : colors.light.background }
    ]}>
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      {/* Modern Header with Glassmorphism */}
      <BlurView 
        intensity={isDark ? 30 : 40} 
        style={[
          styles.modernHeader,
          { 
            backgroundColor: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)',
            borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          }
        ]}
      >
  
        <View style={styles.modernHeaderActions}>
          <TouchableOpacity style={styles.modernHeaderButton} onPress={handleShare}>
            <Icon name="share" size={22} color={isDark ? colors.dark.text : colors.light.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.modernHeaderButton} onPress={handleFavorite}>
            <Icon 
              name={isFavorite ? "favorite" : "favorite-border"} 
              size={22} 
              color={isFavorite ? colors.primary : (isDark ? colors.dark.text : colors.light.text)}
            />
          </TouchableOpacity>
        </View>
      </BlurView>

      <ScrollView style={styles.modernContent} showsVerticalScrollIndicator={false}>
        {/* Modern Media Container */}
        <View style={styles.modernMediaContainer}>
          {type === 'video' && 'youtube_id' in sermon ? (
            <View style={styles.modernVideoContainer}>
              <YoutubePlayer
                height={220}
                width={width - 48}
                videoId={sermon.youtube_id}
                onChangeState={handleVideoStateChange}
                onReady={() => setVideoReady(true)}
              />
              {!videoReady && (
                <View style={styles.modernVideoPlaceholder}>
                  <LoadingSpinner />
                </View>
              )}
            </View>
          ) : (
            <View style={styles.modernAudioThumbnail}>
              {((sermon as any).thumbnail_url || (sermon as any).thumbnailUrl) ? (
                <Image
                  source={{ uri: (sermon as any).thumbnail_url || (sermon as any).thumbnailUrl }}
                  style={styles.thumbnail}
                  resizeMode="cover"
                />
              ) : (
                <LinearGradient
                  colors={[colors.primary, colors.primary + '80', colors.primary + '40']}
                  style={styles.modernAudioGradient}
                >
                  <View style={styles.modernAudioIconContainer}>
                    <Icon name="music-note" size={80} color="#fff" />
                  </View>
                  <TouchableOpacity 
                    style={styles.modernAudioPlayButton}
                    onPress={handlePlayAudio}
                  >
                    <Icon name="play-arrow" size={50} color="#fff" />
                  </TouchableOpacity>
                  <View style={styles.modernAudioOverlay}>
                    <Text style={styles.modernAudioType}>Audio Sermon</Text>
                  </View>
                </LinearGradient>
              )}
            </View>
          )}
        </View>

        {/* Modern Sermon Info Card */}
        <BlurView 
          intensity={isDark ? 20 : 30} 
          style={[
            styles.modernSermonInfoCard,
            { 
              backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)',
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
            }
          ]}
        >
          <Text style={[
            styles.modernSermonTitle,
            { color: isDark ? colors.dark.text : colors.light.text }
          ]}>
            {sermon.title}
          </Text>
          
          <Text style={[
            styles.modernSermonSpeaker,
            { color: isDark ? colors.dark.textSecondary : colors.light.textSecondary }
          ]}>
            {sermon.speaker}
          </Text>

          <View style={styles.modernSermonMeta}>
            <View style={styles.modernMetaItem}>
              <View style={styles.modernMetaIcon}>
                <Icon name="access-time" size={16} color={colors.primary} />
              </View>
              <Text style={[
                styles.modernMetaText,
                { color: isDark ? colors.dark.textSecondary : colors.light.textSecondary }
              ]}>
                {sermon.duration}
              </Text>
            </View>

            {sermon.sermon_date && (
              <View style={styles.modernMetaItem}>
                <View style={styles.modernMetaIcon}>
                  <Icon name="calendar-today" size={16} color={colors.primary} />
                </View>
                <Text style={[
                  styles.modernMetaText,
                  { color: isDark ? colors.dark.textSecondary : colors.light.textSecondary }
                ]}>
                  {formatDate(sermon.sermon_date)}
                </Text>
              </View>
            )}

            {sermon.category && (
              <View style={styles.modernMetaItem}>
                <View style={styles.modernMetaIcon}>
                  <Icon name="folder" size={16} color={colors.primary} />
                </View>
                <Text style={[
                  styles.modernMetaText,
                  { color: isDark ? colors.dark.textSecondary : colors.light.textSecondary }
                ]}>
                  {sermon.category}
                </Text>
              </View>
            )}


          </View>
        </BlurView>

        {/* Modern Action Buttons */}
        {type === 'audio' && (
          <View style={styles.modernActionButtons}>
            <TouchableOpacity 
              style={[styles.modernActionButton, styles.modernPlayButton]}
              onPress={handlePlayAudio}
            >
              <LinearGradient
                colors={[colors.primary, colors.primary + 'CC']}
                style={styles.modernPlayGradient}
              >
                <Icon name="play-arrow" size={24} color="#fff" />
                <Text style={styles.modernActionButtonText}>Play Audio</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.modernActionButton, 
                styles.modernDownloadButton,
                (isDownloaded(sermon.id) || isDownloading(sermon.id)) && styles.modernDownloadedButton
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
                styles.modernActionButtonText,
                (isDownloaded(sermon.id) || isDownloading(sermon.id)) && { 
                  color: isDownloaded(sermon.id) ? colors.success : colors.primary 
                }
              ]}>
                {isDownloaded(sermon.id) ? 'Downloaded' : isDownloading(sermon.id) ? `${getDownloadProgress(sermon.id)}%` : 'Download'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Modern Description Card */}
        {sermon.description && (
          <BlurView 
            intensity={isDark ? 20 : 30} 
            style={[
              styles.modernDescriptionCard,
              { 
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)',
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
              }
            ]}
          >
            <Text style={[
              styles.modernDescriptionTitle,
              { color: isDark ? colors.dark.text : colors.light.text }
            ]}>
              Description
            </Text>
            <Text style={[
              styles.modernDescriptionText,
              { color: isDark ? colors.dark.textSecondary : colors.light.textSecondary }
            ]}>
              {sermon.description}
            </Text>
          </BlurView>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  modernContainer: {
    flex: 1,
  },
  modernHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  modernBackButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  modernHeaderActions: {
    flexDirection: 'row',
  },
  modernHeaderButton: {
    padding: 8,
    marginLeft: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  modernContent: {
    flex: 1,
    paddingTop: 80, // Account for fixed header
  },
  modernMediaContainer: {
    padding: 24,
    paddingBottom: 20,
  },
  modernVideoContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  modernVideoPlaceholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modernAudioThumbnail: {
    height: 240,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  modernAudioGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  modernAudioIconContainer: {
    marginBottom: 20,
  },
  modernAudioPlayButton: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 50,
    padding: 15,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  modernAudioOverlay: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  modernAudioType: {
    color: '#fff',
    fontSize: 12,
    fontFamily: typography.fonts.poppins.medium,
  },
  modernSermonInfoCard: {
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
  },
  modernSermonTitle: {
    fontSize: 26,
    fontFamily: typography.fonts.poppins.bold,
    marginBottom: 12,
    lineHeight: 34,
  },
  modernSermonSpeaker: {
    fontSize: 18,
    fontFamily: typography.fonts.poppins.medium,
    marginBottom: 20,
  },
  modernSermonMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  modernMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modernMetaIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: `${colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modernMetaText: {
    fontSize: 14,
    fontFamily: typography.fonts.poppins.medium,
  },
  modernActionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 16,
    marginBottom: 24,
  },
  modernActionButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  modernPlayButton: {
    elevation: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modernPlayGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  modernDownloadButton: {
    backgroundColor: colors.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  modernDownloadedButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.success,
  },
  modernActionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: typography.fonts.poppins.semiBold,
  },
  modernDescriptionCard: {
    marginHorizontal: 24,
    marginBottom: 32,
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
  },
  modernDescriptionTitle: {
    fontSize: 20,
    fontFamily: typography.fonts.poppins.bold,
    marginBottom: 16,
  },
  modernDescriptionText: {
    fontSize: 16,
    fontFamily: typography.fonts.poppins.regular,
    lineHeight: 24,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
});

export default SermonDetailScreen;