// src/screens/sermons/SermonDetail.tsx
// Enhanced version of existing SermonDetail to handle both audio and video with new design
import React, { useState } from 'react';
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
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { SermonsStackParamList } from '@/types/navigation';
import { useAudio } from '@/context/AudioContext';
import { useFavorites } from '@/hooks/useFavorites';

const { width } = Dimensions.get('window');

type SermonDetailScreenProps = {
  route: RouteProp<SermonsStackParamList, 'SermonDetail'>;
  navigation: StackNavigationProp<SermonsStackParamList, 'SermonDetail'>;
};

const SermonDetailScreen: React.FC<SermonDetailScreenProps> = ({
  route,
  navigation
}) => {
  const { sermon, type } = route.params;
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const { playSermon, currentSermon, isPlaying } = useAudio();
  const { isFavorite, toggleFavorite } = useFavorites();
  
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);

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
      await Share.share({
        message: `${type === 'video' ? 'Watch' : 'Listen to'} "${sermon.title}" by ${sermon.speaker} on The Beacon Centre app`,
        title: sermon.title,
      });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  const handleFavorite = () => {
    toggleFavorite(type === 'video' ? 'video_sermon' : 'audio_sermon', sermon.id);
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

  const handlePlayVideo = () => {
    setIsVideoLoaded(true);
    // Implement YouTube video playback
  };

  const handleDownload = () => {
    if (type === 'audio') {
      if (isDownloaded) {
        Alert.alert('Already Downloaded', 'This sermon is already available offline.');
      } else {
        Alert.alert('Download Started', 'Downloading sermon for offline listening...');
        setIsDownloaded(true);
      }
    }
  };

  const isCurrentlyPlaying = currentSermon?.id === sermon.id && isPlaying;
  const isFav = isFavorite(type === 'video' ? 'video_sermon' : 'audio_sermon', sermon.id);

  return (
    <SafeAreaView style={[
      styles.container,
      { backgroundColor: isDark ? colors.dark.background : '#ffffff' }
    ]}>
      <StatusBar 
        barStyle={type === 'video' ? "light-content" : "dark-content"} 
        backgroundColor={type === 'video' ? colors.primary : '#ffffff'} 
      />
      
      {/* Header */}
      <View style={[
        styles.header,
        { 
          backgroundColor: type === 'video' ? colors.primary : (isDark ? colors.dark.background : '#ffffff'),
          borderBottomColor: type === 'video' ? 'transparent' : '#F5F5F5'
        }
      ]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Icon 
            name="arrow-back" 
            size={24} 
            color={type === 'video' ? '#ffffff' : colors.textGrey} 
          />
        </TouchableOpacity>
        <Text style={[
          styles.headerTitle,
          { color: type === 'video' ? '#ffffff' : (isDark ? colors.dark.text : '#000') }
        ]}>
          {type === 'video' ? 'Video Sermon' : 'Audio Sermon'}
        </Text>
        <TouchableOpacity onPress={handleFavorite} style={styles.headerButton}>
          <Icon 
            name={isFav ? "favorite" : "favorite-border"} 
            size={24} 
            color={isFav ? colors.red : (type === 'video' ? '#ffffff' : colors.textGrey)} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Video Player Section - Only for video sermons */}
        {type === 'video' && (
          <View style={styles.videoSection}>
            <View style={styles.videoContainer}>
              {!isVideoLoaded ? (
                <View style={styles.videoPlaceholder}>
                  <View style={styles.mountainsBackground}>
                    <View style={styles.mountain1} />
                    <View style={styles.mountain2} />
                    <View style={styles.mountain3} />
                  </View>
                  
                  <TouchableOpacity onPress={handlePlayVideo} style={styles.playButton}>
                    <Icon name="play-arrow" size={40} color={colors.primary} />
                  </TouchableOpacity>
                  
                  {sermon.duration && (
                    <View style={styles.durationBadge}>
                      <Text style={styles.durationText}>{sermon.duration}</Text>
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.videoPlayer}>
                  <Text style={styles.videoLoadingText}>Video Loading...</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Hero Section - For audio sermons */}
        {type === 'audio' && (
          <View style={styles.heroSection}>
            <View style={styles.albumArt}>
              {sermon.thumbnail_url ? (
                <Image source={{ uri: sermon.thumbnail_url }} style={styles.albumImage} />
              ) : (
                <View style={styles.placeholderImage}>
                  <View style={styles.churchIcon}>
                    <Icon name="home" size={40} color={colors.primary} />
                    <View style={styles.cross}>
                      <View style={styles.crossVertical} />
                      <View style={styles.crossHorizontal} />
                    </View>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Sermon Information */}
        <View style={styles.infoSection}>
          <View style={styles.titleSection}>
            <Text style={[
              styles.sermonTitle,
              { color: isDark ? colors.dark.text : '#000' }
            ]}>
              {sermon.title}
            </Text>
            
            <View style={styles.speakerRow}>
              <View style={styles.speakerInfo}>
                <View style={styles.speakerAvatar}>
                  <Text style={styles.speakerInitial}>
                    {sermon.speaker.charAt(0)}
                  </Text>
                </View>
                <View style={styles.speakerDetails}>
                  <Text style={[
                    styles.speakerName,
                    { color: isDark ? colors.dark.text : '#000' }
                  ]}>
                    {sermon.speaker}
                  </Text>
                  <Text style={styles.speakerRole}>Pastor</Text>
                </View>
              </View>
            </View>

            {sermon.sermon_date && (
              <Text style={styles.sermonDate}>
                Posted on {formatDate(sermon.sermon_date)}
              </Text>
            )}

            {sermon.duration && (
              <Text style={styles.duration}>{sermon.duration}</Text>
            )}

            {sermon.category && (
              <View style={styles.categoryContainer}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{sermon.category}</Text>
                </View>
              </View>
            )}
          </View>

          {/* Description */}
          {sermon.description && (
            <View style={styles.descriptionSection}>
              <Text style={[
                styles.descriptionTitle,
                { color: isDark ? colors.dark.text : '#000' }
              ]}>
                About this sermon
              </Text>
              <Text style={styles.descriptionText}>{sermon.description}</Text>
            </View>
          )}

          {/* Audio Player Controls - Only for audio sermons */}
          {type === 'audio' && (
            <View style={styles.playerSection}>
              <TouchableOpacity
                style={[
                  styles.playButtonLarge, 
                  { backgroundColor: isCurrentlyPlaying ? colors.textGrey : colors.primary }
                ]}
                onPress={handlePlayAudio}
              >
                <Icon 
                  name={isCurrentlyPlaying ? "pause" : "play-arrow"} 
                  size={24} 
                  color="#fff" 
                />
                <Text style={styles.playButtonText}>
                  {isCurrentlyPlaying ? 'Pause' : 'Play Audio'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionSection}>
            <TouchableOpacity onPress={handleShare} style={styles.actionButton}>
              <View style={styles.actionIconContainer}>
                <Icon name="share" size={20} color={colors.textGrey} />
              </View>
              <Text style={styles.actionText}>Share</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleFavorite} style={styles.actionButton}>
              <View style={styles.actionIconContainer}>
                <Icon 
                  name={isFav ? "bookmark" : "bookmark-border"} 
                  size={20} 
                  color={isFav ? colors.primary : colors.textGrey} 
                />
              </View>
              <Text style={[styles.actionText, isFav && styles.favoriteText]}>
                {isFav ? 'Saved' : 'Save'}
              </Text>
            </TouchableOpacity>

            {type === 'audio' && (
              <TouchableOpacity onPress={handleDownload} style={styles.actionButton}>
                <View style={styles.actionIconContainer}>
                  <Icon 
                    name="file-download" 
                    size={20} 
                    color={isDownloaded ? colors.primary : colors.textGrey} 
                  />
                </View>
                <Text style={[styles.actionText, isDownloaded && styles.downloadedText]}>
                  {isDownloaded ? 'Downloaded' : 'Download'}
                </Text>
              </TouchableOpacity>
            )}

            {type === 'video' && (
              <TouchableOpacity style={styles.actionButton}>
                <View style={styles.actionIconContainer}>
                  <Icon name="playlist-add" size={20} color={colors.textGrey} />
                </View>
                <Text style={styles.actionText}>Add to Playlist</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: typography.fonts.poppins.semiBold,
  },
  content: {
    flex: 1,
  },
  // Video specific styles
  videoSection: {
    backgroundColor: colors.primary,
    paddingBottom: 20,
  },
  videoContainer: {
    width: '100%',
    height: (width * 9) / 16,
    backgroundColor: '#34495e',
  },
  videoPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  mountainsBackground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  mountain1: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '40%',
    height: '80%',
    backgroundColor: colors.primary,
    borderTopRightRadius: 50,
  },
  mountain2: {
    position: 'absolute',
    bottom: 0,
    left: '30%',
    width: '50%',
    height: '100%',
    backgroundColor: '#34495e',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 40,
  },
  mountain3: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: '35%',
    height: '70%',
    backgroundColor: colors.primary,
    borderTopLeftRadius: 60,
  },
  playButton: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  durationBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  durationText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: typography.fonts.poppins.semiBold,
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoLoadingText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: typography.fonts.poppins.medium,
  },
  // Audio specific styles
  heroSection: {
    padding: 20,
    alignItems: 'center',
  },
  albumArt: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  albumImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  churchIcon: {
    position: 'relative',
  },
  cross: {
    position: 'absolute',
    top: -10,
    left: '50%',
    transform: [{ translateX: -1.5 }],
  },
  crossVertical: {
    width: 3,
    height: 15,
    backgroundColor: colors.primary,
    position: 'absolute',
    left: 0,
  },
  crossHorizontal: {
    width: 10,
    height: 3,
    backgroundColor: colors.primary,
    position: 'absolute',
    top: 4,
    left: -3.5,
  },
  // Common info styles
  infoSection: {
    flex: 1,
  },
  titleSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  sermonTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
    lineHeight: 30,
    fontFamily: typography.fonts.poppins.bold,
  },
  speakerRow: {
    marginBottom: 12,
  },
  speakerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  speakerAvatar: {
    width: 40,
    height: 40,
    backgroundColor: colors.primary,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  speakerInitial: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: typography.fonts.poppins.semiBold,
  },
  speakerDetails: {
    flex: 1,
  },
  speakerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
    fontFamily: typography.fonts.poppins.semiBold,
  },
  speakerRole: {
    fontSize: 14,
    color: colors.textGrey,
    fontFamily: typography.fonts.poppins.regular,
  },
  sermonDate: {
    fontSize: 14,
    color: colors.textGrey,
    marginBottom: 8,
    fontFamily: typography.fonts.poppins.regular,
  },
  duration: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
    marginBottom: 12,
  },
  categoryContainer: {
    flexDirection: 'row',
  },
  categoryBadge: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F5F5F5',
  },
  categoryText: {
    fontSize: 12,
    color: colors.blue,
    fontWeight: '600',
    fontFamily: typography.fonts.poppins.semiBold,
  },
  descriptionSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    fontFamily: typography.fonts.poppins.semiBold,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.textGrey,
    fontFamily: typography.fonts.notoSerif.regular,
  },
  playerSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  playButtonLarge: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  playButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    fontFamily: typography.fonts.poppins.semiBold,
  },
  actionSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
  },
  actionIconContainer: {
    width: 44,
    height: 44,
    backgroundColor: '#F8F9FA',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F5F5F5',
  },
  actionText: {
    fontSize: 12,
    color: colors.textGrey,
    fontWeight: '500',
    fontFamily: typography.fonts.poppins.medium,
  },
  favoriteText: {
    color: colors.primary,
  },
  downloadedText: {
    color: colors.primary,
  },
});

export default SermonDetailScreen;