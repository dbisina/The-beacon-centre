// src/components/audio/AudioPlayer.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import Slider from '@react-native-community/slider';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Audio } from 'expo-av';

import { AudioSermon } from '@/types/api';
import { colors, } from '@/constants/colors';
import { typography } from '@/constants/typography';
import TrackPlayerService from '@/services/audio/TrackPlayerService';

interface AudioPlayerProps {
  sermon: AudioSermon;
  onClose?: () => void;
  showMiniPlayer?: boolean;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({
  sermon,
  onClose,
  showMiniPlayer = false,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);

  const audioService = TrackPlayerService.getInstance();

  useEffect(() => {
    const checkPlaybackStatus = async () => {
      const sound = await audioService.getCurrentTrack();
      if (sound) {
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          setIsPlaying(status.isPlaying);
          setDuration(status.durationMillis ? status.durationMillis / 1000 : 0);
          setPosition(status.positionMillis ? status.positionMillis / 1000 : 0);
        }
      }
    };

    const interval = setInterval(checkPlaybackStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  const handlePlayPause = async () => {
    try {
      if (isPlaying) {
        await audioService.pause();
      } else {
        const currentSound = await audioService.getCurrentTrack();
        if (currentSound) {
          await audioService.play();
        } else {
          await audioService.playSermon(sermon);
        }
      }
    } catch (error) {
      console.error('Play/pause error:', error);
    }
  };

  const handleSeek = async (value: number) => {
    await audioService.seekTo(value);
  };

  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (showMiniPlayer) {
    return (
      <View style={[
        styles.miniPlayer,
        { backgroundColor: isDark ? colors.dark.card : colors.light.card }
      ]}>
        <View style={styles.miniInfo}>
          <Text style={[
            styles.miniTitle,
            { color: isDark ? colors.dark.text : colors.light.text }
          ]} numberOfLines={1}>
            {sermon.title}
          </Text>
          <Text style={[
            styles.miniSpeaker,
            { color: colors.textGrey }
          ]} numberOfLines={1}>
            {sermon.speaker}
          </Text>
        </View>
        
        <TouchableOpacity onPress={handlePlayPause} style={styles.miniPlayButton}>
          <Icon
            name={isPlaying ? 'pause' : 'play-arrow'}
            size={28}
            color={colors.primary}
          />
        </TouchableOpacity>
        
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.miniCloseButton}>
            <Icon name="close" size={20} color={colors.textGrey} />
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={[
      styles.container,
      { backgroundColor: isDark ? colors.dark.background : colors.light.background }
    ]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[
          styles.headerTitle,
          { color: isDark ? colors.dark.text : colors.light.text }
        ]}>
          Now Playing
        </Text>
        {onClose && (
          <TouchableOpacity onPress={onClose}>
            <Icon name="keyboard-arrow-down" size={28} color={colors.textGrey} />
          </TouchableOpacity>
        )}
      </View>

      {/* Sermon Info */}
      <View style={styles.sermonInfo}>
        <Text style={[
          styles.title,
          { color: isDark ? colors.dark.text : colors.light.text }
        ]}>
          {sermon.title}
        </Text>
        <Text style={[styles.speaker, { color: colors.textGrey }]}>
          {sermon.speaker}
        </Text>
        {sermon.sermon_date && (
          <Text style={[styles.date, { color: colors.textGrey }]}>
            {new Date(sermon.sermon_date).toLocaleDateString()}
          </Text>
        )}
      </View>

      {/* Progress Slider */}
      <View style={styles.progressContainer}>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={duration}
          value={position}
          onSlidingComplete={handleSeek}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={isDark ? colors.dark.border : colors.light.border}
          thumbTintColor={colors.primary}
        />
        <View style={styles.timeContainer}>
          <Text style={[styles.time, { color: colors.textGrey }]}>
            {formatTime(position)}
          </Text>
          <Text style={[styles.time, { color: colors.textGrey }]}>
            {formatTime(duration)}
          </Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          onPress={() => audioService.skipToPrevious()}
          style={styles.controlButton}
        >
          <Icon name="skip-previous" size={32} color={colors.textGrey} />
        </TouchableOpacity>

        <TouchableOpacity onPress={handlePlayPause} style={styles.playButton}>
          <Icon
            name={isPlaying ? 'pause' : 'play-arrow'}
            size={48}
            color="#fff"
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => audioService.skipToNext()}
          style={styles.controlButton}
        >
          <Icon name="skip-next" size={32} color={colors.textGrey} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
  },
  headerTitle: {
    fontFamily: typography.fonts.poppins.medium,
    fontSize: typography.sizes.large,
  },
  sermonInfo: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontFamily: typography.fonts.poppins.bold,
    fontSize: typography.sizes.title,
    textAlign: 'center',
    marginBottom: 8,
  },
  speaker: {
    fontFamily: typography.fonts.poppins.medium,
    fontSize: typography.sizes.large,
    marginBottom: 4,
  },
  date: {
    fontFamily: typography.fonts.poppins.regular,
    fontSize: typography.sizes.medium,
  },
  progressContainer: {
    marginBottom: 40,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  time: {
    fontFamily: typography.fonts.poppins.regular,
    fontSize: typography.sizes.small,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButton: {
    paddingHorizontal: 20,
  },
  playButton: {
    backgroundColor: colors.primary,
    borderRadius: 40,
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
  },
  miniPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.light.border,
  },
  miniInfo: {
    flex: 1,
    marginRight: 12,
  },
  miniTitle: {
    fontFamily: typography.fonts.poppins.medium,
    fontSize: typography.sizes.medium,
  },
  miniSpeaker: {
    fontFamily: typography.fonts.poppins.regular,
    fontSize: typography.sizes.small,
  },
  miniPlayButton: {
    marginRight: 8,
  },
  miniCloseButton: {
    padding: 4,
  },
});

export default AudioPlayer;