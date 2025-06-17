// src/components/audio/FullAudioPlayer.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Modal,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { useAudio } from '@/context/AudioContext';

const { width } = Dimensions.get('window');

interface AudioPlayerProps {
  visible: boolean;
  onClose: () => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({
  visible,
  onClose
}) => {
  const { 
    currentSermon, 
    isPlaying, 
    position, 
    duration,
    playPause,
    seekTo,
    skipForward,
    skipBackward,
    toggleFavorite,
    isFavorite 
  } = useAudio();

  const [localPosition, setLocalPosition] = useState(0);

  useEffect(() => {
    setLocalPosition(position);
  }, [position]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (value: number) => {
    setLocalPosition(value);
    seekTo(value);
  };

  const progress = duration > 0 ? localPosition / duration : 0;

  if (!currentSermon) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Icon name="keyboard-arrow-down" size={24} color={colors.textGrey} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Now Playing</Text>
          <TouchableOpacity 
            onPress={toggleFavorite} 
            style={styles.headerButton}
          >
            <Icon 
              name={isFavorite ? "favorite" : "favorite-border"} 
              size={24} 
              color={isFavorite ? colors.red : colors.textGrey} 
            />
          </TouchableOpacity>
        </View>

        {/* Album Art */}
        <View style={styles.albumContainer}>
          <View style={styles.albumArt}>
            {currentSermon.thumbnail_url ? (
              <Image source={{ uri: currentSermon.thumbnail_url }} style={styles.albumImage} />
            ) : (
              <View style={styles.placeholderAlbum}>
                <Icon name="library-music" size={80} color={colors.textGrey} />
              </View>
            )}
          </View>
        </View>

        {/* Track Info */}
        <View style={styles.trackInfo}>
          <Text style={styles.trackTitle}>{currentSermon.title}</Text>
          <Text style={styles.trackArtist}>{currentSermon.speaker}</Text>
          {currentSermon.category && (
            <Text style={styles.trackCategory}>{currentSermon.category}</Text>
          )}
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            <TouchableOpacity 
              style={[styles.progressThumb, { left: `${progress * 100}%` }]}
              onPress={() => {}} // Handle drag here
            />
          </View>
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>{formatTime(localPosition)}</Text>
            <Text style={styles.timeText}>{formatTime(duration)}</Text>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity 
            onPress={skipBackward} 
            style={styles.controlButton}
          >
            <Icon name="replay-15" size={32} color={colors.textGrey} />
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={playPause} 
            style={styles.playButton}
          >
            <Icon 
              name={isPlaying ? "pause" : "play-arrow"} 
              size={32} 
              color="#ffffff" 
            />
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={skipForward} 
            style={styles.controlButton}
          >
            <Icon name="forward-15" size={32} color={colors.textGrey} />
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton}>
            <Icon name="share" size={24} color={colors.textGrey} />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Icon name="file-download" size={24} color={colors.textGrey} />
            <Text style={styles.actionText}>Download</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 50, // Account for status bar
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textGrey,
    fontFamily: typography.fonts.poppins.semiBold,
  },
  albumContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  albumArt: {
    width: width - 80,
    height: width - 80,
    maxWidth: 300,
    maxHeight: 300,
    borderRadius: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  albumImage: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
  },
  placeholderAlbum: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F5F5F5',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackInfo: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  trackTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: typography.fonts.poppins.bold,
  },
  trackArtist: {
    fontSize: 18,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 4,
    fontFamily: typography.fonts.poppins.medium,
  },
  trackCategory: {
    fontSize: 14,
    color: colors.textGrey,
    textAlign: 'center',
    fontWeight: '500',
  },
  progressContainer: {
    paddingHorizontal: 30,
    marginBottom: 30,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#F5F5F5',
    borderRadius: 2,
    position: 'relative',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  progressThumb: {
    width: 16,
    height: 16,
    backgroundColor: colors.primary,
    borderRadius: 8,
    position: 'absolute',
    top: -6,
    transform: [{ translateX: -8 }],
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 12,
    color: colors.textGrey,
    fontWeight: '500',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginBottom: 40,
  },
  controlButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
  },
  playButton: {
    width: 70,
    height: 70,
    backgroundColor: colors.primary,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingBottom: 50,
  },
  actionButton: {
    alignItems: 'center',
    marginHorizontal: 30,
  },
  actionText: {
    fontSize: 12,
    color: colors.textGrey,
    marginTop: 8,
    fontWeight: '500',
    fontFamily: typography.fonts.poppins.medium,
  },
});

export default AudioPlayer;