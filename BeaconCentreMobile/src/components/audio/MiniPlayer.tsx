// src/components/audio/MiniPlayer.tsx - SAFE VERSION
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  useColorScheme,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';

interface MiniPlayerProps {
  onExpandPress: () => void;
}

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
    progress,
    formattedPosition,
    formattedDuration,
    canPlay,
    isPlayerVisible,
    getPlayButtonIcon,
  } = useAudioPlayer();

  // Don't render if no current track or player not visible
  if (!currentTrack || !isPlayerVisible) {
    return null;
  }

  const handlePlayPause = async () => {
    try {
      if (isPlaying) {
        await pause();
      } else {
        await play();
      }
    } catch (error) {
      console.error('❌ MiniPlayer: Error toggling playback:', error);
    }
  };

  const themeColors = isDark ? colors.dark : colors.light;

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          backgroundColor: themeColors.background,
          borderTopColor: isDark ? '#333' : '#e0e0e0',
        }
      ]}
    >
      {/* Progress bar */}
      <View style={styles.progressBarContainer}>
        <View 
          style={[
            styles.progressBar, 
            { 
              width: `${progress || 0}%`,
              backgroundColor: colors.primary 
            }
          ]} 
        />
      </View>

      {/* Main content */}
      <TouchableOpacity 
        style={styles.content}
        onPress={onExpandPress}
        activeOpacity={0.8}
      >
        <View style={styles.trackInfo}>
          <Text 
            style={[styles.title, { color: themeColors.text }]} 
            numberOfLines={1}
          >
            {currentTrack.title || 'Unknown Title'}
          </Text>
          <Text 
            style={[styles.artist, { color: colors.textGrey }]} 
            numberOfLines={1}
          >
            {currentTrack.speaker || 'Unknown Speaker'}
          </Text>
        </View>

        <View style={styles.controls}>
          <Text style={[styles.time, { color: colors.textGrey }]}>
            {formattedPosition} / {formattedDuration}
          </Text>
          
          <TouchableOpacity
            style={[
              styles.playButton,
              { backgroundColor: colors.primary }
            ]}
            onPress={handlePlayPause}
            disabled={!canPlay || isLoading}
          >
            <Icon
              name={isLoading ? 'hourglass-empty' : getPlayButtonIcon()}
              size={20}
              color="white"
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 85,
    left: 0,
    right: 0,
    height: MINI_PLAYER_HEIGHT,
    borderTopWidth: 0.3,
  },
  progressBarContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(0,0,0,0.1)',
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
    paddingTop: 2,
  },
  trackInfo: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 14,
    fontFamily: typography.fonts.poppins.medium,
    marginBottom: 2,
  },
  artist: {
    fontSize: 12,
    fontFamily: typography.fonts.poppins.medium,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  time: {
    fontSize: 12,
    fontFamily: typography.fonts.poppins.regular,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MiniPlayer;