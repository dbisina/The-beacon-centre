// src/components/video/VideoCard.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  Image,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { VideoSermon } from '@/types/api';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';

interface VideoCardProps {
  sermon: VideoSermon;
  onPress: () => void;
  onFavorite?: () => void;
  isFavorite?: boolean;
}

const VideoCard: React.FC<VideoCardProps> = ({
  sermon,
  onPress,
  onFavorite,
  isFavorite = false,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const scaleValue = new Animated.Value(1);
  const [thumbnailError, setThumbnailError] = useState(false);

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const thumbnailUrl = sermon.thumbnail_url || 
    (thumbnailError 
      ? `https://img.youtube.com/vi/${sermon.youtube_id}/hqdefault.jpg`
      : `https://img.youtube.com/vi/${sermon.youtube_id}/maxresdefault.jpg`
    );

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.9}
    >
      <Animated.View
        style={[
          styles.card,
          {
            transform: [{ scale: scaleValue }],
            backgroundColor: isDark ? colors.dark.card : colors.light.card,
            borderColor: isDark ? colors.dark.border : colors.light.border,
          },
        ]}
      >
        <View style={styles.thumbnailContainer}>
          <Image
            source={{ uri: thumbnailUrl }}
            style={styles.thumbnail}
            resizeMode="cover"
            onError={() => setThumbnailError(true)}
          />
          <View style={styles.playOverlay}>
            <Icon name="play-circle-filled" size={64} color="#fff" />
          </View>
          {sermon.is_featured && (
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredText}>Featured</Text>
            </View>
          )}
        </View>

        <View style={styles.contentContainer}>
          <Text style={[
            styles.title,
            { color: isDark ? colors.dark.text : colors.light.text }
          ]} numberOfLines={2}>
            {sermon.title}
          </Text>

          <Text style={[
            styles.speaker,
            { color: colors.textGrey }
          ]}>
            {sermon.speaker}
          </Text>

          <View style={styles.metaRow}>
            {sermon.sermon_date && (
              <Text style={[styles.date, { color: colors.textGrey }]}>
                {new Date(sermon.sermon_date).toLocaleDateString()}
              </Text>
            )}
            {sermon.duration && (
              <Text style={[styles.duration, { color: colors.textGrey }]}>
                {sermon.duration}
              </Text>
            )}
          </View>

          {sermon.category && (
            <View style={[
              styles.categoryContainer,
              { backgroundColor: isDark ? colors.dark.background : colors.light.background }
            ]}>
              <Text style={[styles.category, { color: colors.primary }]}>
                {sermon.category}
              </Text>
            </View>
          )}
        </View>

        {onFavorite && (
          <TouchableOpacity
            onPress={onFavorite}
            style={styles.favoriteButton}
          >
            <Icon
              name={isFavorite ? 'favorite' : 'favorite-border'}
              size={24}
              color={isFavorite ? colors.red : colors.textGrey}
            />
          </TouchableOpacity>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  thumbnailContainer: {
    position: 'relative',
    height: 200,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  featuredBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: colors.yellow,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  featuredText: {       
    fontFamily: typography.fonts.poppins.medium,
    fontSize: typography.sizes.base,
    color: '#fff',
    letterSpacing: typography.letterSpacing.tight,
  },
  contentContainer: {
    padding: 20,
  },
  title: {
    fontFamily: typography.fonts.poppins.bold,
    fontSize: typography.sizes.lg,
    lineHeight: typography.lineHeights.tight,
    letterSpacing: typography.letterSpacing.tight,
    marginBottom: 12,
  },
  speaker: {        
    fontFamily: typography.fonts.poppins.medium,
    fontSize: typography.sizes.base,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  date: {
    fontFamily: typography.fonts.poppins.regular,
    fontSize: typography.sizes.sm,
  },
  duration: {
    fontFamily: typography.fonts.poppins.regular,
    fontSize: typography.sizes.sm,
  },
  categoryContainer: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  category: {
    fontFamily: typography.fonts.poppins.medium,
    fontSize: typography.sizes.sm,
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 8,
    borderRadius: 20,
  },
});

export default VideoCard;