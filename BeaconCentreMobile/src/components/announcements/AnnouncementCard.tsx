// src/components/announcements/AnnouncementCard.tsx
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

import { Announcement } from '@/types/api';
import { colors, typography } from '@/constants';

interface AnnouncementCardProps {
  announcement: Announcement;
  onPress: () => void;
  onBookmark?: () => void;
  isBookmarked?: boolean;
}

const AnnouncementCard: React.FC<AnnouncementCardProps> = ({
  announcement,
  onPress,
  onBookmark,
  isBookmarked = false,
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return colors.red;
      case 'medium':
        return colors.yellow;
      case 'low':
        return colors.blue;
      default:
        return colors.textGrey;
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'priority-high';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'announcement';
    }
  };

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
            borderLeftColor: getPriorityColor(announcement.priority),
            transform: [{ scale: scaleValue }],
          },
        ]}
      >
        {announcement.image_url && (
          <Image
            source={{ uri: announcement.image_url }}
            style={styles.image}
            resizeMode="cover"
          />
        )}

        <View style={styles.contentContainer}>
          <View style={styles.header}>
            <View style={styles.priorityContainer}>
              <Icon
                name={getPriorityIcon(announcement.priority)}
                size={16}
                color={getPriorityColor(announcement.priority)}
              />
              <Text style={[
                styles.priority,
                { color: getPriorityColor(announcement.priority) }
              ]}>
                {announcement.priority.toUpperCase()}
              </Text>
            </View>

            {onBookmark && (
              <TouchableOpacity onPress={onBookmark}>
                <Icon
                  name={isBookmarked ? 'bookmark' : 'bookmark-border'}
                  size={20}
                  color={isBookmarked ? colors.primary : colors.textGrey}
                />
              </TouchableOpacity>
            )}
          </View>

          <Text style={[
            styles.title,
            { color: isDark ? colors.dark.text : colors.light.text }
          ]}>
            {announcement.title}
          </Text>

          <Text style={[
            styles.content,
            { color: isDark ? colors.dark.text : colors.textGrey }
          ]} numberOfLines={3}>
            {announcement.content.replace(/<[^>]*>/g, '')} {/* Strip HTML */}
          </Text>

          <View style={styles.footer}>
            <Text style={[styles.date, { color: colors.textGrey }]}>
              {new Date(announcement.start_date).toLocaleDateString()}
            </Text>
            
            {announcement.action_text && (
              <View style={styles.actionButton}>
                <Text style={[styles.actionText, { color: colors.primary }]}>
                  {announcement.action_text}
                </Text>
                <Icon name="arrow-forward" size={14} color={colors.primary} />
              </View>
            )}
          </View>
        </View>
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
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 160,
  },
  contentContainer: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priorityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priority: {
    fontFamily: typography.fonts.poppins.medium,
    fontSize: typography.sizes.small,
    marginLeft: 4,
  },
  title: {
    fontFamily: typography.fonts.poppins.bold,
    fontSize: typography.sizes.large,
    marginBottom: 8,
    lineHeight: 22,
  },
  content: {
    fontFamily: typography.fonts.notoSerif.regular,
    fontSize: typography.sizes.medium,
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontFamily: typography.fonts.poppins.regular,
    fontSize: typography.sizes.small,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    fontFamily: typography.fonts.poppins.medium,
    fontSize: typography.sizes.small,
    marginRight: 4,
  },
});

export default AnnouncementCard;