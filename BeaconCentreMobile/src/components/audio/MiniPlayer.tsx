// src/components/audio/MiniPlayer.tsx - EXPO-AUDIO COMPATIBLE
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  useColorScheme,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAudio } from '@/context/AudioContext';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';

interface MiniPlayerProps {
  onExpandPress: () => void;
}

const { width: screenWidth } = Dimensions.get('window');
const MINI_PLAYER_HEIGHT = 64;

const MiniPlayer: React.FC<MiniPlayerProps> = ({ onExpandPress }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const { state } = useAudio();
  const {
    currentTrack,
    isPlaying,
    play,
    pause,
    skipToNext,
    progress,
    formattedPosition,
    formattedDuration,
    canPlay,
    isPlayerVisible,
  } = useAudioPlayer();

  // Animated values for slide-up animation
  const slideAnim = React.useRef(new Animated.Value(0)).current;
  const progressAnim = React.useRef(new Animated.Value(0)).current;

  // Show/hide animation
  React.useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isPlayerVisible && currentTrack ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isPlayerVisible, currentTrack]);

  // Progress animation
  React.useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress / 100,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  // Swipe to dismiss gesture
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return Math.abs(gestureState.dy) > 10;
    },
    onPanResponderMove: (_, gestureState) => {
      if (gestureState.dy > 0) {
        const progress = Math.min(1, gestureState.dy / 100);
        slideAnim.setValue(1 - progress);
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dy > 50) {
        // Swipe down to dismiss
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      } else {
        // Snap back
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    },
  });

  const handlePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const handleNext = () => {
    skipToNext();
  };

  const handleExpand = () => {
    onExpandPress();
  };

  if (!currentTrack || !isPlayerVisible) {
    return null;
  }

  const transformStyle = {
    transform: [
      {
        translateY: slideAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [MINI_PLAYER_HEIGHT + 20, 0],
        }),
      },
    ],
  };

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          backgroundColor: isDark ? colors.dark.background : colors.light.background,
          borderTopColor: isDark ? colors.dark.border : colors.light.border,
        },
        transformStyle,
      ]}
      {...panResponder.panHandlers}
    >
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={[
          styles.progressBackground,
          { backgroundColor: isDark ? colors.dark.border : colors.light.border }
        ]}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                backgroundColor: colors.primary,
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
      </View>

      {/* Content */}
      <TouchableOpacity
        style={styles.content}
        onPress={handleExpand}
        activeOpacity={0.8}
      >
        <View style={styles.leftSection}>
          {/* Thumbnail placeholder */}
          <View style={[
            styles.thumbnail,
            {
              backgroundColor: colors.primary + '20',
              borderColor: colors.primary + '40',
            }
          ]}>
            <Icon 
              name="music-note" 
              size={20} 
              color={colors.primary} 
            />
          </View>

          {/* Track Info */}
          <View style={styles.trackInfo}>
            <Text 
              style={[
                styles.title,
                { color: isDark ? colors.dark.text : colors.light.text }
              ]}
              numberOfLines={1}
            >
              {currentTrack.title}
            </Text>
            <Text 
              style={[
                styles.subtitle,
                { color: colors.textGrey }
              ]}
              numberOfLines={1}
            >
              {currentTrack.speaker}
            </Text>
          </View>
        </View>

        <View style={styles.rightSection}>
          {/* Time Display */}
          <Text style={[
            styles.timeText,
            { color: colors.textGrey }
          ]}>
            {formattedPosition}
          </Text>

          {/* Controls */}
          <View style={styles.controls}>
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
                size={24}
                color="white"
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleNext}
              style={styles.controlButton}
            >
              <Icon
                name="skip-next"
                size={20}
                color={isDark ? colors.dark.text : colors.light.text}
              />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: MINI_PLAYER_HEIGHT,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
    zIndex: 1000,
  },
  progressContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  progressBackground: {
    flex: 1,
  },
  progressFill: {
    height: '100%',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  leftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbnail: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  trackInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    ...typography.styles.body1,
    fontWeight: '600',
    marginBottom: 2,
  },
  subtitle: {
    ...typography.styles.caption,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeText: {
    ...typography.styles.caption,
    minWidth: 40,
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default MiniPlayer;