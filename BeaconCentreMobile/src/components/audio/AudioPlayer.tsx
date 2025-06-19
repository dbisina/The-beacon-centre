// src/components/audio/AudioPlayer.tsx - EXPO-AUDIO COMPATIBLE
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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Slider from '@react-native-community/slider';
import { useAudio } from '@/context/AudioContext';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';

interface AudioPlayerProps {
  visible: boolean;
  onClose: () => void;
}

const { height: screenHeight } = Dimensions.get('window');

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

  const lastPlayedTrackId = useRef<string | number | null>(null);

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

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onClose();
      slideAnim.setValue(0);
    });
  };

  const handlePlayPause = () => {
    if (isPlaying) {
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
    >
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={isDark ? colors.dark.background : colors.light.background}
      />
      
      <Animated.View 
        style={[
          styles.container,
          {
            backgroundColor: isDark ? colors.dark.background : colors.light.background,
          },
          transformStyle,
        ]}
        {...panResponder.panHandlers}
      >
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.headerButton}>
              <Icon name="keyboard-arrow-down" size={28} color={isDark ? colors.dark.text : colors.light.text} />
            </TouchableOpacity>
            
            <View style={styles.headerCenter}>
              <Text style={[
                styles.headerTitle,
                { color: isDark ? colors.dark.text : colors.light.text }
              ]}>
                Now Playing
              </Text>
              {queueLength > 1 && (
                <Text style={[styles.headerSubtitle, { color: colors.textGrey }]}>
                  {queueLength} tracks in queue
                </Text>
              )}
            </View>

            <TouchableOpacity 
              onPress={() => setShowQueue(!showQueue)} 
              style={styles.headerButton}
            >
              <Icon name="queue-music" size={24} color={isDark ? colors.dark.text : colors.light.text} />
            </TouchableOpacity>
          </View>

          {!showQueue ? (
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* Artwork */}
              <View style={styles.artworkContainer}>
                <View style={[
                  styles.artwork,
                  {
                    backgroundColor: colors.primary + '20',
                    borderColor: colors.primary + '40',
                  }
                ]}>
                  <Icon name="music-note" size={80} color={colors.primary} />
                </View>
              </View>

              {/* Track Info */}
              <View style={styles.trackInfo}>
                <Text style={[
                  styles.trackTitle,
                  { color: isDark ? colors.dark.text : colors.light.text }
                ]}>
                  {currentTrack.title}
                </Text>
                <Text style={[styles.trackArtist, { color: colors.textGrey }]}>
                  {currentTrack.speaker}
                </Text>
                {currentTrack.category && (
                  <Text style={[styles.trackCategory, { color: colors.textGrey }]}>
                    {currentTrack.category}
                  </Text>
                )}
              </View>

              {/* Progress */}
              <View style={styles.progressContainer}>
                <Slider
                  style={styles.progressSlider}
                  minimumValue={0}
                  maximumValue={100}
                  value={progress}
                  onSlidingComplete={handleSeek}
                  minimumTrackTintColor={colors.primary}
                  maximumTrackTintColor={isDark ? colors.dark.border : colors.light.border}
                  thumbTintColor={colors.primary}
                />
                <View style={styles.timeContainer}>
                  <Text style={[styles.timeText, { color: colors.textGrey }]}>
                    {formattedPosition}
                  </Text>
                  <Text style={[styles.timeText, { color: colors.textGrey }]}>
                    {formattedDuration}
                  </Text>
                </View>
              </View>

              {/* Main Controls */}
              <View style={styles.mainControls}>
                <TouchableOpacity
                  onPress={skipToPrevious}
                  style={[styles.controlButton, !hasPrevious && styles.disabledButton]}
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
                  style={[
                    styles.playButton,
                    { backgroundColor: colors.primary }
                  ]}
                  disabled={!canPlay}
                >
                  <Icon
                    name={isPlaying ? 'pause' : 'play-arrow'}
                    size={40}
                    color="white"
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={skipToNext}
                  style={[styles.controlButton, !hasNext && styles.disabledButton]}
                  disabled={!hasNext}
                >
                  <Icon name="skip-next" size={32} color={
                    hasNext 
                      ? (isDark ? colors.dark.text : colors.light.text)
                      : colors.textGrey + '60'
                  } />
                </TouchableOpacity>
              </View>

              {/* Secondary Controls */}
              <View style={styles.secondaryControls}>
                <TouchableOpacity onPress={toggleShuffle} style={styles.secondaryButton}>
                  <Icon 
                    name="shuffle" 
                    size={24} 
                    color={isShuffling ? colors.primary : (isDark ? colors.dark.text : colors.light.text)} 
                  />
                </TouchableOpacity>

                <TouchableOpacity onPress={toggleRepeat} style={styles.secondaryButton}>
                  <Icon 
                    name={getRepeatModeIcon()} 
                    size={24} 
                    color={isRepeating ? colors.primary : (isDark ? colors.dark.text : colors.light.text)} 
                  />
                </TouchableOpacity>

                <TouchableOpacity onPress={handleRateChange} style={styles.secondaryButton}>
                  <Text style={[
                    styles.rateText,
                    { color: rate !== 1.0 ? colors.primary : (isDark ? colors.dark.text : colors.light.text) }
                  ]}>
                    {rate}×
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Volume Control */}
              <View style={styles.volumeContainer}>
                <Icon name="volume-down" size={20} color={colors.textGrey} />
                <Slider
                  style={styles.volumeSlider}
                  minimumValue={0}
                  maximumValue={100}
                  value={volume * 100}
                  onValueChange={handleVolumeChange}
                  minimumTrackTintColor={colors.primary}
                  maximumTrackTintColor={isDark ? colors.dark.border : colors.light.border}
                  thumbTintColor={colors.primary}
                />
                <Icon name="volume-up" size={20} color={colors.textGrey} />
              </View>

              {/* Status */}
              <Text style={[styles.statusText, { color: colors.textGrey }]}>
                {getPlaybackStateText()}
              </Text>
            </ScrollView>
          ) : (
            <View style={styles.queueContainer}>
              <Text style={[
                styles.queueTitle,
                { color: isDark ? colors.dark.text : colors.light.text }
              ]}>
                Playing Queue
              </Text>
              <ScrollView style={styles.queueList}>
                {('queue' in audioPlayer ? (audioPlayer as any).queue : []).map((sermon: any, index: number) => (
                  <TouchableOpacity
                    key={sermon.id}
                    style={[
                      styles.queueItem,
                      index === ('currentIndex' in audioPlayer ? (audioPlayer as any).currentIndex : 0) && styles.currentQueueItem,
                      { borderBottomColor: isDark ? colors.dark.border : colors.light.border }
                    ]}
                  >
                    <View style={styles.queueItemInfo}>
                      <Text style={[
                        styles.queueItemTitle,
                        { color: isDark ? colors.dark.text : colors.light.text },
                        index === ('currentIndex' in audioPlayer ? (audioPlayer as any).currentIndex : 0) && { color: colors.primary }
                      ]} numberOfLines={1}>
                        {sermon.title}
                      </Text>
                      <Text style={[styles.queueItemArtist, { color: colors.textGrey }]} numberOfLines={1}>
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
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.styles.h3,
    fontWeight: '600',
  },
  headerSubtitle: {
    ...typography.styles.caption,
    marginTop: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  artworkContainer: {
    alignItems: 'center',
    marginVertical: 32,
  },
  artwork: {
    width: 280,
    height: 280,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  trackInfo: {
    alignItems: 'center',
    marginBottom: 32,
  },
  trackTitle: {
    ...typography.styles.h2,
    textAlign: 'center',
    marginBottom: 8,
  },
  trackArtist: {
    ...typography.styles.body1,
    textAlign: 'center',
    marginBottom: 4,
  },
  trackCategory: {
    ...typography.styles.caption,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  progressContainer: {
    marginBottom: 32,
  },
  progressSlider: {
    height: 40,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  timeText: {
    ...typography.styles.caption,
  },
  mainControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 32,
  },
  controlButton: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.4,
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 48,
  },
  secondaryButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rateText: {
    ...typography.styles.body1,
    fontWeight: '600',
  },
  volumeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 16,
  },
  volumeSlider: {
    flex: 1,
    height: 40,
  },
  statusText: {
    ...typography.styles.caption,
    textAlign: 'center',
    marginBottom: 24,
  },
  queueContainer: {
    flex: 1,
    padding: 16,
  },
  queueTitle: {
    ...typography.styles.h3,
    marginBottom: 16,
  },
  queueList: {
    flex: 1,
  },
  queueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
  },
  currentQueueItem: {
    backgroundColor: colors.primary + '10',
    borderRadius: 8,
    marginHorizontal: -4,
  },
  queueItemInfo: {
    flex: 1,
  },
  queueItemTitle: {
    ...typography.styles.body1,
    fontWeight: '500',
    marginBottom: 2,
  },
  queueItemArtist: {
    ...typography.styles.caption,
  },
});

export default AudioPlayer;