// src/components/video/VideoCard.tsx
import React from 'react';
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
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

const VideoCard: React.FC<VideoCardProps> = ({
  sermon,
  onPress,
  isFavorite = false,
  onToggleFavorite,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const scaleValue = new Animated.Value(1);

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
    `https://img.youtube.com/vi/${sermon.youtube_id}/maxresdefault.jpg`;

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
            backgroundColor: isDark ? colors.dark.card : colors.light.card,
            borderColor: isDark ? colors.dark.border : colors.light.border,
            transform: [{ scale: scaleValue }],
          },
        ]}
      >
        <View style={styles.thumbnailContainer}>
          <Image
            source={{ uri: thumbnailUrl }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
          <View style={styles.playOverlay}>
            <Icon name="play-circle-filled" size={48} color="#fff" />
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
            { color: colors.primary }
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
            <View style={styles.categoryContainer}>
              <Text style={[styles.category, { color: colors.blue }]}>
                {sermon.category}
              </Text>
            </View>
          )}
        </View>

        {onToggleFavorite && (
          <TouchableOpacity
            onPress={onToggleFavorite}
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
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
  },
  thumbnailContainer: {
    position: 'relative',
    height: 180,
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
    top: 8,
    left: 8,
    backgroundColor: colors.yellow,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  featuredText: {
    fontFamily: typography.fonts.poppins.medium,
    fontSize: typography.sizes.small,
    color: '#fff',
  },
  contentContainer: {
    padding: 16,
  },
  title: {
    fontFamily: typography.fonts.poppins.bold,
    fontSize: typography.sizes.medium,
    marginBottom: 8,
    lineHeight: 20,
  },
  speaker: {
    fontFamily: typography.fonts.poppins.medium,
    fontSize: typography.sizes.medium,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  date: {
    fontFamily: typography.fonts.poppins.regular,
    fontSize: typography.sizes.small,
  },
  duration: {
    fontFamily: typography.fonts.poppins.regular,
    fontSize: typography.sizes.small,
  },
  categoryContainer: {
    alignSelf: 'flex-start',
  },
  category: {
    fontFamily: typography.fonts.poppins.medium,
    fontSize: typography.sizes.small,
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default VideoCard;