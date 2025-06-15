// src/components/audio/MiniPlayer.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { colors, typography } from '@/constants';

interface MiniPlayerProps {
  onPress?: () => void;
  onClose?: () => void;
}

export default function MiniPlayer({ onPress, onClose }: MiniPlayerProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const {
    currentTrack,
    isPlaying,
    progress,
    play,
    pause,
    skipToNext,
  } = useAudioPlayer();

  if (!currentTrack) {
    return null;
  }

  const handlePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  return (
    <View style={[
      styles.container,
      { 
        backgroundColor: isDark ? colors.dark.card : colors.light.card,
        borderTopColor: isDark ? colors.dark.border : colors.light.border,
      }
    ]}>
      {/* Progress Bar */}
      <View style={[
        styles.progressContainer,
        { backgroundColor: isDark ? colors.dark.border : colors.light.border }
      ]}>
        <View 
          style={[
            styles.progressBar,
            { 
              width: `${progress}%`,
              backgroundColor: colors.primary 
            }
          ]} 
        />
      </View>

      <TouchableOpacity onPress={onPress} style={styles.content}>
        <View style={styles.trackInfo}>
          <Text style={[
            styles.trackTitle,
            { color: isDark ? colors.dark.text : colors.light.text }
          ]} numberOfLines={1}>
            {currentTrack.title}
          </Text>
          <Text style={[
            styles.trackArtist,
            { color: colors.textGrey }
          ]} numberOfLines={1}>
            {currentTrack.artist}
          </Text>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity onPress={handlePlayPause} style={styles.playButton}>
            <Icon
              name={isPlaying ? 'pause' : 'play-arrow'}
              size={28}
              color={colors.primary}
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={skipToNext} style={styles.controlButton}>
            <Icon name="skip-next" size={24} color={colors.textGrey} />
          </TouchableOpacity>

          {onClose && (
            <TouchableOpacity onPress={onClose} style={styles.controlButton}>
              <Icon name="close" size={20} color={colors.textGrey} />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  progressContainer: {
    height: 2,
    width: '100%',
  },
  progressBar: {
    height: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  trackInfo: {
    flex: 1,
    marginRight: 12,
  },
  trackTitle: {
    fontFamily: typography.fonts.poppins.medium,
    fontSize: typography.sizes.medium,
    marginBottom: 2,
  },
  trackArtist: {
    fontFamily: typography.fonts.poppins.regular,
    fontSize: typography.sizes.small,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playButton: {
    marginRight: 8,
  },
  controlButton: {
    marginLeft: 8,
    padding: 4,
  },
});