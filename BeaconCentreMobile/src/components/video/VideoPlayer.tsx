// src/components/video/VideoPlayer.tsx
import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
  Text,
  Alert,
} from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { VideoSermon } from '@/types/api';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';

interface VideoPlayerProps {
  sermon: VideoSermon;
  autoplay?: boolean;
  onError?: (error: string) => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  sermon,
  autoplay = false,
  onError,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [playing, setPlaying] = useState(autoplay);
  const [isReady, setIsReady] = useState(false);

  const onStateChange = (state: string) => {
    if (state === 'ended') {
      setPlaying(false);
    }
  };

  const onErrorEvent = (error: string) => {
    console.error('YouTube player error:', error);
    onError?.(error);
    Alert.alert(
      'Video Error',
      'Unable to load video. Please check your internet connection and try again.',
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.playerContainer}>
        <YoutubePlayer
          height={220}
          play={playing}
          videoId={sermon.youtube_id}
          onChangeState={onStateChange}
          onReady={() => setIsReady(true)}
          onError={onErrorEvent}
          webViewStyle={{
            backgroundColor: isDark ? colors.dark.background : colors.light.background,
          }}
        />
      </View>

      <View style={styles.infoContainer}>
        <Text style={[
          styles.title,
          { color: isDark ? colors.dark.text : colors.light.text }
        ]}>
          {sermon.title}
        </Text>
        
        <View style={styles.metaInfo}>
          <Text style={[styles.speaker, { color: colors.primary }]}>
            {sermon.speaker}
          </Text>
          {sermon.sermon_date && (
            <Text style={[styles.date, { color: colors.textGrey }]}>
              {new Date(sermon.sermon_date).toLocaleDateString()}
            </Text>
          )}
          {sermon.duration && (
            <Text style={[styles.duration, { color: colors.textGrey }]}>
              Duration: {sermon.duration}
            </Text>
          )}
        </View>

        {sermon.description && (
          <Text style={[
            styles.description,
            { color: isDark ? colors.dark.text : colors.textGrey }
          ]}>
            {sermon.description}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
  },
  playerContainer: {
    backgroundColor: '#000',
    borderRadius: 8,
    overflow: 'hidden',
  },
  infoContainer: {
    padding: 16,
  },
  title: {
    fontFamily: typography.fonts.poppins.bold,
    fontSize: typography.sizes.lg,
    marginBottom: 8,
    lineHeight: 24,
  },
  metaInfo: {
    marginBottom: 12,
  },
  speaker: {
    fontFamily: typography.fonts.poppins.medium,
    fontSize: typography.sizes.base,
    marginBottom: 4,
  },
  date: {
    fontFamily: typography.fonts.poppins.regular,
    fontSize: typography.sizes.sm,
    marginBottom: 2,
  },
  duration: {
    fontFamily: typography.fonts.poppins.regular,
    fontSize: typography.sizes.sm,
  },
  description: {
    fontFamily: typography.fonts.notoSerif.regular,
    fontSize: typography.sizes.base,
    lineHeight: 20,
  },
});

export default VideoPlayer;