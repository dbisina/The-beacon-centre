// src/components/audio/MiniPlayer.tsx - FIXED EXPO-AUDIO COMPATIBLE
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
  
  const {
    currentTrack,
    isPlaying,
    isLoading,
    play,
    pause,
    skipToNext,
    progress,
    formattedPosition,
    formattedDuration,
    canPlay,
    isPlayerVisible,
    hasNext,
    getPlayButtonIcon,
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
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  // Pan responder for swipe up to expand
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return Math.abs(gestureState.dy) > 10 && gestureState.dy < 0;
    },
    onPanResponderMove: (_, gestureState) => {
      if (gestureState.dy < 0) {
        // Swiping up
        const progress = Math.min(1, Math.abs(gestureState.dy) / 100);
        // Could add visual feedback for swipe here
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dy < -50) {
        onExpandPress();
      }
    },
  });

  const handlePlayPause = async () => {
    try {
      if (isPlaying) {
        await pause();
      } else {
        await play();
      }
    } catch (error) {
      console.error('Failed to toggle playback:', error);
    }
  };

  const handleNext = async () => {
    try {
      if (hasNext) {
        await skipToNext();
      }
    } catch (error) {
      console.error('Failed to skip to next:', error);
    }
  };

  if (!isPlayerVisible || !currentTrack) {
    return null;
  }

  const styles = createStyles(isDark);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            {
              translateY: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [MINI_PLAYER_HEIGHT, 0],
              }),
            },
          ],
        },
      ]}
      {...panResponder.panHandlers}
    >
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <Animated.View
          style={[
            styles.progressBar,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>

      {/* Main Content */}
      <TouchableOpacity
        style={styles.content}
        onPress={onExpandPress}
        activeOpacity={0.8}
      >
        {/* Track Info */}
        <View style={styles.trackInfo}>
          <Text style={styles.trackTitle} numberOfLines={1}>
            {currentTrack.title}
          </Text>
          <Text style={styles.trackArtist} numberOfLines={1}>
            {currentTrack.speaker}
          </Text>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          {/* Play/Pause Button */}
          <TouchableOpacity
            style={styles.playButton}
            onPress={handlePlayPause}
            disabled={!canPlay}
            activeOpacity={0.7}
          >
            <Icon
              name={getPlayButtonIcon()}
              size={28}
              color={isDark ? colors.dark.text : colors.light.text}
            />
          </TouchableOpacity>

          {/* Next Button */}
          <TouchableOpacity
            style={[
              styles.nextButton,
              { opacity: hasNext ? 1 : 0.5 }
            ]}
            onPress={handleNext}
            disabled={!hasNext}
            activeOpacity={0.7}
          >
            <Icon
              name="skip-next"
              size={24}
              color={isDark ? colors.dark.text : colors.light.text}
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {/* Time Display */}
      <View style={styles.timeContainer}>
        <Text style={styles.timeText}>
          {formattedPosition} / {formattedDuration}
        </Text>
      </View>
    </Animated.View>
  );
};

const createStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: MINI_PLAYER_HEIGHT,
    backgroundColor: isDark ? colors.dark.card : colors.light.card,
    borderTopWidth: 1,
    borderTopColor: isDark ? colors.dark.border : colors.light.border,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  progressContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: isDark ? colors.dark.border : colors.light.border,
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  trackInfo: {
    flex: 1,
    marginRight: 16,
  },
  trackTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: isDark ? colors.dark.text : colors.light.text,
    marginBottom: 2,
    fontFamily: typography.fonts.poppins.medium,
  },
  trackArtist: {
    fontSize: 12,
    color: colors.textGrey,
    fontFamily: typography.fonts.poppins.medium,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: isDark ? colors.dark.background : colors.light.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  nextButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeContainer: {
    position: 'absolute',
    bottom: 4,
    right: 16,
  },
  timeText: {
    fontSize: 10,
    color: colors.textGrey,
    fontFamily: typography.fonts.poppins.regular,
  },
});

export default MiniPlayer;