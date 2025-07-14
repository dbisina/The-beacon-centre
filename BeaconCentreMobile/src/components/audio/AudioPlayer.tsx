// src/components/audio/AudioPlayer.tsx - MODERN DESIGN
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Animated,
  PanResponder,
  Dimensions,
  useColorScheme,
  StatusBar,
  ScrollView,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Slider from '@react-native-community/slider';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useAudio } from '@/context/AudioContext';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';

interface AudioPlayerProps {
  visible: boolean;
  onClose: () => void;
}

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

const DEFAULT_THUMBNAIL = 'https://res.cloudinary.com/your-cloud/image/upload/v1/beacon-app/default-artwork.jpg';

const AudioPlayer: React.FC<AudioPlayerProps> = ({ visible, onClose }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { playSermon, state } = useAudio();

  const audioPlayer = useAudioPlayer();
  
  // Destructure with safe defaults
  const {
    currentTrack,
    isPlaying,
    position,
    duration,
    play,
    pause,
    seekTo,
    progress,
    formattedPosition,
    formattedDuration,
    canPlay,
    hasNext,
    hasPrevious,
    volume,
    getPlayButtonIcon,
    getPlaybackStateText,
    queueLength,
  } = audioPlayer;

  // Safe access to optional properties with proper typing
  const skipToNext = 'skipToNext' in audioPlayer ? (audioPlayer as any).skipToNext : (() => {});
  const skipToPrevious = 'skipToPrevious' in audioPlayer ? (audioPlayer as any).skipToPrevious : (() => {});
  const toggleRepeat = 'toggleRepeat' in audioPlayer ? (audioPlayer as any).toggleRepeat : (() => {});
  const toggleShuffle = 'toggleShuffle' in audioPlayer ? (audioPlayer as any).toggleShuffle : (() => {});
  const setVolume = 'setVolume' in audioPlayer ? (audioPlayer as any).setVolume : (() => {});
  const setRate = 'setRate' in audioPlayer ? (audioPlayer as any).setRate : (() => {});
  const isRepeating = 'isRepeating' in audioPlayer ? (audioPlayer as any).isRepeating : false;
  const isRepeatingOne = 'isRepeatingOne' in audioPlayer ? (audioPlayer as any).isRepeatingOne : false;
  const isShuffling = 'isShuffling' in audioPlayer ? (audioPlayer as any).isShuffling : false;
  const rate = 'rate' in audioPlayer ? (audioPlayer as any).rate : 1.0;

  // Helper function for repeat mode icon
  const getRepeatModeIcon = () => {
    if (isRepeatingOne) return 'repeat-one';
    if (isRepeating) return 'repeat';
    return 'repeat';
  };

  const [showQueue, setShowQueue] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const lastPlayedTrackId = useRef<string | number | null>(null);
  const isClosingRef = useRef(false);

  // Pan responder for swipe down to close
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return Math.abs(gestureState.dy) > 10 && gestureState.dy > 0;
    },
    onPanResponderMove: (_, gestureState) => {
      if (gestureState.dy > 0) {
        const progress = Math.min(1, gestureState.dy / 300);
        slideAnim.setValue(progress);
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dy > 100) {
        handleClose();
      } else {
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    },
  });

  // Pulse animation for play button
  useEffect(() => {
    if (isPlaying) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isPlaying]);

  useEffect(() => {
    if (visible) {
      isClosingRef.current = false;
    }
  }, [visible]);

  const handleClose = () => {
    if (isClosingRef.current) {
      console.log('[AudioPlayer] handleClose ignored (already closing)');
      return;
    }
    isClosingRef.current = true;
    console.log('[AudioPlayer] handleClose called');
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      console.log('[AudioPlayer] onClose called from handleClose');
      onClose();
      slideAnim.setValue(0);
      isClosingRef.current = false;
    });
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      console.log('[AudioPlayer] Pause button pressed');
      pause();
    } else {
      play();
    }
  };

  const handleSeek = (value: number) => {
    const newPosition = (value / 100) * duration;
    seekTo(newPosition);
  };

  const handleVolumeChange = (value: number) => {
    setVolume(value / 100);
  };

  const handleRateChange = () => {
    const rates = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
    const currentIndex = rates.indexOf(rate);
    const nextIndex = (currentIndex + 1) % rates.length;
    setRate(rates[nextIndex]);
  };

  useEffect(() => {
    if (currentTrack && visible && lastPlayedTrackId.current !== currentTrack.id) {
      lastPlayedTrackId.current = currentTrack.id;
      const startPlayback = async () => {
        try {
          console.log('🎵 AudioPlayer screen: Starting playback');
          await playSermon(currentTrack);
        } catch (error) {
          console.error('❌ AudioPlayer screen: Failed to play:', error);
        }
      };
      startPlayback();
    }
  }, [currentTrack?.id, visible]);

  if (!currentTrack) {
    return null;
  }

  const transformStyle = {
    transform: [
      {
        translateY: slideAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, screenHeight],
        }),
      },
    ],
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={() => {
        console.log('[AudioPlayer] Modal onRequestClose');
        handleClose();
      }}
    >
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      
      <Animated.View 
        style={[
          styles.modernContainer,
          {
            backgroundColor: isDark ? colors.dark.background : colors.light.background,
          },
          transformStyle,
        ]}
        {...panResponder.panHandlers}
      >
        <SafeAreaView style={styles.modernSafeArea}>
          {/* Modern Header - Close button at the very top */}
          <BlurView 
            intensity={isDark ? 30 : 40} 
            style={[
              styles.modernHeader,
              { 
                backgroundColor: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)',
                borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                marginBottom: 8,
              }
            ]}
          >
            <TouchableOpacity onPress={handleClose} style={styles.modernHeaderButton}>
              <Icon name="keyboard-arrow-down" size={28} color={isDark ? colors.dark.text : colors.light.text} />
            </TouchableOpacity>
            <View style={styles.modernHeaderCenter}>
              <Text style={[
                styles.modernHeaderTitle,
                { color: isDark ? colors.dark.text : colors.light.text }
              ]}>
                Now Playing
              </Text>
              {queueLength > 1 && (
                <Text style={[styles.modernHeaderSubtitle, { color: colors.textGrey }]}> {queueLength} tracks in queue </Text>
              )}
            </View>
            <TouchableOpacity 
              onPress={() => setShowQueue(!showQueue)} 
              style={styles.modernHeaderButton}
            >
              <Icon name="queue-music" size={24} color={isDark ? colors.dark.text : colors.light.text} />
            </TouchableOpacity>
          </BlurView>

          {!showQueue ? (
            <ScrollView style={styles.modernContent} showsVerticalScrollIndicator={false}>
              {/* Modern Artwork - Animated pulsing thumbnail */}
              <View style={styles.modernArtworkContainer}>
                <Animated.View 
                  style={[
                    styles.modernArtwork,
                    {
                      backgroundColor: colors.primary + '20',
                      borderColor: colors.primary + '40',
                      transform: [{ scale: pulseAnim }],
                      justifyContent: 'center',
                      alignItems: 'center',
                    }
                  ]}
                >
                  <Image
                    source={{ uri: currentTrack.thumbnail_url || DEFAULT_THUMBNAIL }}
                    style={{
                      width: 180,
                      height: 180,
                      borderRadius: 90,
                      backgroundColor: isDark ? '#222' : '#eee',
                      borderWidth: 2,
                      borderColor: isDark ? '#444' : '#fff',
                    }}
                    resizeMode="cover"
                    onError={() => console.log('[AudioPlayer] Failed to load thumbnail:', currentTrack.thumbnail_url)}
                  />
                </Animated.View>
              </View>

              {/* Modern Track Info */}
              <BlurView 
                intensity={isDark ? 20 : 30} 
                style={[
                  styles.modernTrackInfoCard,
                  { 
                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)',
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                  }
                ]}
              >
                <Text style={[
                  styles.modernTrackTitle,
                  { color: isDark ? colors.dark.text : colors.light.text }
                ]}>
                  {currentTrack.title}
                </Text>
                <Text style={[styles.modernTrackArtist, { color: colors.textGrey }]}>
                  {currentTrack.speaker}
                </Text>
                {currentTrack.category && (
                  <View style={styles.modernCategoryBadge}>
                    <Text style={styles.modernCategoryText}>
                      {currentTrack.category}
                    </Text>
                  </View>
                )}
              </BlurView>

              {/* Modern Progress */}
              <BlurView 
                intensity={isDark ? 20 : 30} 
                style={[
                  styles.modernProgressCard,
                  { 
                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)',
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                  }
                ]}
              >
                                  <Slider
                    style={styles.modernProgressSlider}
                    minimumValue={0}
                    maximumValue={100}
                    value={progress}
                    onSlidingComplete={handleSeek}
                    minimumTrackTintColor={colors.primary}
                    maximumTrackTintColor={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}
                    thumbTintColor={colors.primary}
                  />
                <View style={styles.modernTimeContainer}>
                  <Text style={[styles.modernTimeText, { color: colors.textGrey }]}>
                    {formattedPosition}
                  </Text>
                  <Text style={[styles.modernTimeText, { color: colors.textGrey }]}>
                    {formattedDuration}
                  </Text>
                </View>
              </BlurView>

              {/* Modern Main Controls */}
              <View style={styles.modernMainControls}>
                <TouchableOpacity
                  onPress={skipToPrevious}
                  style={[styles.modernControlButton, !hasPrevious && styles.modernDisabledButton]}
                  disabled={!hasPrevious}
                >
                  <Icon name="skip-previous" size={32} color={
                    hasPrevious 
                      ? (isDark ? colors.dark.text : colors.light.text)
                      : colors.textGrey + '60'
                  } />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handlePlayPause}
                  style={styles.modernPlayButton}
                  disabled={!canPlay}
                >
                  <LinearGradient
                    colors={[colors.primary, colors.primary + 'CC']}
                    style={styles.modernPlayGradient}
                  >
                    <Icon
                      name={isPlaying ? 'pause' : 'play-arrow'}
                      size={40}
                      color="white"
                    />
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={skipToNext}
                  style={[styles.modernControlButton, !hasNext && styles.modernDisabledButton]}
                  disabled={!hasNext}
                >
                  <Icon name="skip-next" size={32} color={
                    hasNext 
                      ? (isDark ? colors.dark.text : colors.light.text)
                      : colors.textGrey + '60'
                  } />
                </TouchableOpacity>
              </View>

              {/* Modern Secondary Controls */}
              <BlurView 
                intensity={isDark ? 20 : 30} 
                style={[
                  styles.modernSecondaryControlsCard,
                  { 
                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)',
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                  }
                ]}
              >
                <TouchableOpacity onPress={toggleShuffle} style={styles.modernSecondaryButton}>
                  <Icon 
                    name="shuffle" 
                    size={24} 
                    color={isShuffling ? colors.primary : (isDark ? colors.dark.text : colors.light.text)} 
                  />
                </TouchableOpacity>

                <TouchableOpacity onPress={toggleRepeat} style={styles.modernSecondaryButton}>
                  <Icon 
                    name={getRepeatModeIcon()} 
                    size={24} 
                    color={isRepeating ? colors.primary : (isDark ? colors.dark.text : colors.light.text)} 
                  />
                </TouchableOpacity>

                <TouchableOpacity onPress={handleRateChange} style={styles.modernSecondaryButton}>
                  <Text style={[
                    styles.modernRateText,
                    { color: rate !== 1.0 ? colors.primary : (isDark ? colors.dark.text : colors.light.text) }
                  ]}>
                    {rate}×
                  </Text>
                </TouchableOpacity>
              </BlurView>

              {/* Modern Volume Control */}
              <BlurView 
                intensity={isDark ? 20 : 30} 
                style={[
                  styles.modernVolumeCard,
                  { 
                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)',
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                  }
                ]}
              >
                <Icon name="volume-down" size={20} color={colors.textGrey} />
                                  <Slider
                    style={styles.modernVolumeSlider}
                    minimumValue={0}
                    maximumValue={100}
                    value={volume * 100}
                    onValueChange={handleVolumeChange}
                    minimumTrackTintColor={colors.primary}
                    maximumTrackTintColor={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}
                    thumbTintColor={colors.primary}
                  />
                <Icon name="volume-up" size={20} color={colors.textGrey} />
              </BlurView>

              {/* Modern Status */}
              <Text style={[styles.modernStatusText, { color: colors.textGrey }]}>
                {getPlaybackStateText()}
              </Text>
            </ScrollView>
          ) : (
            <View style={styles.modernQueueContainer}>
              <Text style={[
                styles.modernQueueTitle,
                { color: isDark ? colors.dark.text : colors.light.text }
              ]}>
                Playing Queue
              </Text>
              <ScrollView style={styles.modernQueueList}>
                {('queue' in audioPlayer ? (audioPlayer as any).queue : []).map((sermon: any, index: number) => (
                  <TouchableOpacity
                    key={sermon.id}
                    style={[
                      styles.modernQueueItem,
                      index === ('currentIndex' in audioPlayer ? (audioPlayer as any).currentIndex : 0) && styles.modernCurrentQueueItem,
                      { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }
                    ]}
                  >
                    <View style={styles.modernQueueItemInfo}>
                      <Text style={[
                        styles.modernQueueItemTitle,
                        { color: isDark ? colors.dark.text : colors.light.text },
                        index === ('currentIndex' in audioPlayer ? (audioPlayer as any).currentIndex : 0) && { color: colors.primary }
                      ]} numberOfLines={1}>
                        {sermon.title}
                      </Text>
                      <Text style={[styles.modernQueueItemArtist, { color: colors.textGrey }]} numberOfLines={1}>
                        {sermon.speaker}
                      </Text>
                    </View>
                    {index === ('currentIndex' in audioPlayer ? (audioPlayer as any).currentIndex : 0) && (
                      <Icon name="equalizer" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modernContainer: {
    flex: 1,
  },
  modernSafeArea: {
    flex: 1,
  },
  modernHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modernHeaderButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  modernHeaderCenter: {
    alignItems: 'center',
  },
  modernHeaderTitle: {
    fontSize: 18,
    fontFamily: typography.fonts.poppins.bold,
  },
  modernHeaderSubtitle: {
    fontSize: 12,
    fontFamily: typography.fonts.poppins.regular,
    marginTop: 2,
  },
  modernContent: {
    flex: 1,
    paddingHorizontal: 24,
  },
  modernArtworkContainer: {
    alignItems: 'center',
    marginVertical: 40,
  },
  modernArtwork: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
  },
  modernArtworkGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modernTrackInfoCard: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 24,
  },
  modernTrackTitle: {
    fontSize: 22,
    fontFamily: typography.fonts.poppins.bold,
    marginBottom: 8,
    textAlign: 'center',
  },
  modernTrackArtist: {
    fontSize: 16,
    fontFamily: typography.fonts.poppins.medium,
    textAlign: 'center',
    marginBottom: 12,
  },
  modernCategoryBadge: {
    backgroundColor: `${colors.primary}20`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'center',
  },
  modernCategoryText: {
    color: colors.primary,
    fontSize: 12,
    fontFamily: typography.fonts.poppins.medium,
  },
  modernProgressCard: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 24,
  },
  modernProgressSlider: {
    width: '100%',
    height: 40,
  },
  modernTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  modernTimeText: {
    fontSize: 14,
    fontFamily: typography.fonts.poppins.medium,
  },
  modernMainControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 32,
  },
  modernControlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modernDisabledButton: {
    opacity: 0.5,
  },
  modernPlayButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    elevation: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modernPlayGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modernSecondaryControlsCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 24,
  },
  modernSecondaryButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modernRateText: {
    fontSize: 16,
    fontFamily: typography.fonts.poppins.semiBold,
  },
  modernVolumeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 24,
    gap: 16,
  },
  modernVolumeSlider: {
    flex: 1,
    height: 40,
  },
  modernStatusText: {
    textAlign: 'center',
    fontSize: 14,
    fontFamily: typography.fonts.poppins.regular,
    marginBottom: 32,
  },
  modernQueueContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  modernQueueTitle: {
    fontSize: 20,
    fontFamily: typography.fonts.poppins.bold,
    marginBottom: 20,
  },
  modernQueueList: {
    flex: 1,
  },
  modernQueueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modernCurrentQueueItem: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  modernQueueItemInfo: {
    flex: 1,
    marginRight: 16,
  },
  modernQueueItemTitle: {
    fontSize: 16,
    fontFamily: typography.fonts.poppins.medium,
    marginBottom: 4,
  },
  modernQueueItemArtist: {
    fontSize: 14,
    fontFamily: typography.fonts.poppins.regular,
  },
});

export default AudioPlayer;