// src/components/audio/MiniAudioPlayer.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  useColorScheme,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';

interface MiniPlayerProps {
  onExpandPress: () => void;
  visible?: boolean;
}

const MiniPlayer: React.FC<MiniPlayerProps> = ({ 
  onExpandPress, 
  visible = true 
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const { 
    currentTrack: currentSermon, 
    isPlaying, 
    position, 
    duration, 
    play,
    pause
  } = useAudioPlayer();

  const handlePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const handleClose = () => {
    pause();
    // TODO: Add proper close functionality
  };

  if (!visible || !currentSermon) {
    return null;
  }

  const progress = duration > 0 ? position / duration : 0;

  return (
    <View style={[
      styles.container,
      { backgroundColor: isDark ? colors.dark.background : '#ffffff' }
    ]}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
      </View>

      {/* Main Content */}
      <TouchableOpacity 
        onPress={onExpandPress}
        style={styles.content}
        activeOpacity={0.9}
      >
        <View style={styles.leftContent}>
          {/* Album Art */}
          <View style={styles.albumArt}>
            {currentSermon.thumbnail_url ? (
              <Image source={{ uri: currentSermon.thumbnail_url }} style={styles.albumImage} />
            ) : (
              <View style={styles.placeholderAlbum}>
                <Icon name="library-music" size={20} color={colors.textGrey} />
              </View>
            )}
          </View>

          {/* Track Info */}
          <View style={styles.trackInfo}>
            <Text 
              style={[
                styles.trackTitle,
                { color: isDark ? colors.dark.text : '#000' }
              ]} 
              numberOfLines={1}
            >
              {currentSermon.title}
            </Text>
            <Text style={styles.trackArtist} numberOfLines={1}>
              {currentSermon.speaker}
            </Text>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity 
            onPress={handlePlayPause}
            style={styles.playButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon 
              name={isPlaying ? "pause" : "play-arrow"} 
              size={20} 
              color={colors.primary} 
            />
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={handleClose}
            style={styles.closeButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="close" size={18} color={colors.textGrey} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  progressContainer: {
    height: 2,
  },
  progressBar: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 64,
  },
  leftContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  albumArt: {
    width: 40,
    height: 40,
    borderRadius: 6,
    marginRight: 12,
  },
  albumImage: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
  placeholderAlbum: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F5F5F5',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackInfo: {
    flex: 1,
    marginRight: 12,
  },
  trackTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
    fontFamily: typography.fonts.poppins.semiBold,
  },
  trackArtist: {
    fontSize: 12,
    color: colors.textGrey,
    fontFamily: typography.fonts.poppins.regular,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#F5F5F5',
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MiniPlayer;