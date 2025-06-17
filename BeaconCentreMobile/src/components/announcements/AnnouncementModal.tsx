// src/components/announcements/AnnouncementModal.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Share,
  Linking,
  Image,
  Animated,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { Announcement } from '@/types/api';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { formatDate } from '@/utils/dateUtils';
import { stripHtmlTags } from '@/utils/textUtils';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { analyticsApi } from '@/services/api/analytics';

interface AnnouncementModalProps {
  visible: boolean;
  announcement: Announcement | null;
  onClose: () => void;
  onBookmark?: (announcementId: number) => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function AnnouncementModal({
  visible,
  announcement,
  onClose,
  onBookmark,
}: AnnouncementModalProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { userData, updateUserData } = useLocalStorage();
  
  const [slideAnim] = useState(new Animated.Value(screenHeight));
  const [opacityAnim] = useState(new Animated.Value(0));
  const [isBookmarked, setIsBookmarked] = useState(false);

  React.useEffect(() => {
    if (announcement && userData) {
      setIsBookmarked(userData.bookmarkedAnnouncements.includes(announcement.id));
    }
  }, [announcement, userData]);

  React.useEffect(() => {
    if (visible) {
      // Track modal view
      if (announcement) {
        analyticsApi.trackAnnouncementView(announcement.id);
      }
      
      // Animate in
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: screenHeight,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: screenHeight,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const handleBookmark = async () => {
    if (!announcement || !userData) return;

    try {
      await updateUserData((data) => {
        if (isBookmarked) {
          data.bookmarkedAnnouncements = data.bookmarkedAnnouncements.filter(
            id => id !== announcement.id
          );
        } else {
          data.bookmarkedAnnouncements.push(announcement.id);
        }
        return data;
      });
      
      setIsBookmarked(!isBookmarked);
      onBookmark?.(announcement.id);
      
      if (!isBookmarked) {
        analyticsApi.trackContentFavorite('announcement', announcement.id);
      }
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
    }
  };

  const handleShare = async () => {
    if (!announcement) return;

    try {
      const cleanContent = stripHtmlTags(announcement.content);
      await Share.share({
        message: `${announcement.title}\n\n${cleanContent.substring(0, 200)}...\n\nFrom The Beacon Centre`,
        title: announcement.title,
      });
      
      analyticsApi.trackInteraction('announcement', announcement.id, 'shared');
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleActionPress = () => {
    if (announcement?.action_url) {
      Linking.openURL(announcement.action_url);
      analyticsApi.trackInteraction('announcement', announcement.id, 'action_clicked');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return colors.red;
      case 'medium': return colors.yellow;
      case 'low': return colors.blue;
      default: return colors.textGrey;
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return 'priority-high';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'announcement';
    }
  };

  if (!announcement) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        {/* Background blur/overlay */}
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: opacityAnim,
              backgroundColor: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.6)',
            },
          ]}
        >
          <TouchableOpacity
            style={styles.backdropTouchable}
            activeOpacity={1}
            onPress={handleClose}
          />
        </Animated.View>

        {/* Modal Content */}
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ translateY: slideAnim }],
              backgroundColor: isDark ? colors.dark.background : colors.light.background,
            },
          ]}
        >
          {/* Handle bar */}
          <View style={styles.handleContainer}>
            <View style={[
              styles.handle,
              { backgroundColor: isDark ? colors.dark.border : colors.light.border }
            ]} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[
                styles.priorityBadge,
                { backgroundColor: getPriorityColor(announcement.priority) + '20' }
              ]}>
                <Icon
                  name={getPriorityIcon(announcement.priority)}
                  size={16}
                  color={getPriorityColor(announcement.priority)}
                />
                <Text style={[
                  styles.priorityText,
                  { color: getPriorityColor(announcement.priority) }
                ]}>
                  {announcement.priority.toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
                <Icon name="share" size={22} color={colors.textGrey} />
              </TouchableOpacity>

              <TouchableOpacity onPress={handleBookmark} style={styles.headerButton}>
                <Icon
                  name={isBookmarked ? 'bookmark' : 'bookmark-border'}
                  size={22}
                  color={isBookmarked ? colors.primary : colors.textGrey}
                />
              </TouchableOpacity>

              <TouchableOpacity onPress={handleClose} style={styles.headerButton}>
                <Icon name="close" size={22} color={colors.textGrey} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Image */}
            {announcement.image_url && (
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: announcement.image_url }}
                  style={styles.image}
                  resizeMode="cover"
                />
              </View>
            )}

            {/* Title */}
            <Text style={[
              styles.title,
              { color: isDark ? colors.dark.text : colors.light.text }
            ]}>
              {announcement.title}
            </Text>

            {/* Meta Information */}
            <View style={styles.metaContainer}>
              <View style={styles.metaItem}>
                <Icon name="schedule" size={16} color={colors.textGrey} />
                <Text style={[styles.metaText, { color: colors.textGrey }]}>
                  Published: {formatDate(announcement.start_date, 'short')}
                </Text>
              </View>

              {announcement.expiry_date && (
                <View style={styles.metaItem}>
                  <Icon name="event" size={16} color={colors.textGrey} />
                  <Text style={[styles.metaText, { color: colors.textGrey }]}>
                    Expires: {formatDate(announcement.expiry_date, 'short')}
                  </Text>
                </View>
              )}
            </View>

            {/* Content */}
            <View style={styles.contentContainer}>
              <Text style={[
                styles.contentText,
                { color: isDark ? colors.dark.text : colors.light.text }
              ]}>
                {stripHtmlTags(announcement.content)}
              </Text>
            </View>

            {/* Action Button */}
            {announcement.action_text && announcement.action_url && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                onPress={handleActionPress}
              >
                <Text style={styles.actionButtonText}>
                  {announcement.action_text}
                </Text>
                <Icon name="open-in-new" size={18} color="#fff" />
              </TouchableOpacity>
            )}

            {/* Bottom spacing */}
            <View style={styles.bottomSpacing} />
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backdropTouchable: {
    flex: 1,
  },
  modalContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: screenHeight * 0.9,
    minHeight: screenHeight * 0.5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  priorityText: {
    fontFamily: typography.fonts.poppins.medium,
    fontSize: typography.sizes.sm,
    marginLeft: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  imageContainer: {
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 200,
  },
  title: {
    fontFamily: typography.fonts.poppins.bold,
    fontSize: typography.sizes.xl,
    lineHeight: 32,
    marginBottom: 16,
  },
  metaContainer: {
    marginBottom: 20,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metaText: {
    fontFamily: typography.fonts.poppins.regular,
    fontSize: typography.sizes.sm,
    marginLeft: 8,
  },
  contentContainer: {
    marginBottom: 24,
  },
  contentText: {
    fontFamily: typography.fonts.notoSerif.regular,
    fontSize: typography.sizes.lg,
    lineHeight: 28,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  actionButtonText: {
    fontFamily: typography.fonts.poppins.medium,
    fontSize: typography.sizes.base,
    color: '#fff',
    marginRight: 8,
  },
  bottomSpacing: {
    height: 20,
  },
});