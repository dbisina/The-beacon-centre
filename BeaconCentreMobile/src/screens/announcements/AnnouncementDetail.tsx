// src/screens/announcements/AnnouncementDetail.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Share,
  Alert,
  Linking,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import { AnnouncementsStackParamList } from '@/types/navigation';
import { colors, typography } from '@/constants';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { analyticsApi } from '@/services/api/analytics';
import { formatDate } from '@/utils/dateUtils';
import { stripHtmlTags } from '@/utils/textUtils';
import RefreshControl from '@/components/common/RefreshControl';

type AnnouncementDetailRouteProp = RouteProp<AnnouncementsStackParamList, 'AnnouncementDetail'>;

export default function AnnouncementDetail() {
  const navigation = useNavigation();
  const route = useRoute<AnnouncementDetailRouteProp>();
  const { announcement } = route.params;
  
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const { userData, updateUserData } = useLocalStorage();
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    if (userData) {
      setIsBookmarked(userData.bookmarkedAnnouncements.includes(announcement.id));
    }
  }, [userData, announcement.id]);

  useEffect(() => {
    // Track view
    analyticsApi.trackAnnouncementView(announcement.id);
  }, [announcement.id]);

  const handleToggleBookmark = async () => {
    if (!userData) return;

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
      
      if (!isBookmarked) {
        analyticsApi.trackContentFavorite('announcement', announcement.id);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update bookmark');
    }
  };

  const handleShare = async () => {
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
    if (announcement.action_url) {
      Linking.openURL(announcement.action_url);
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

  return (
    <SafeAreaView style={[
      styles.container,
      { backgroundColor: isDark ? colors.dark.background : colors.light.background }
    ]}>
      {/* Header */}
      <View style={[
        styles.header,
        { backgroundColor: isDark ? colors.dark.background : colors.light.background }
      ]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Icon name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
            <Icon name="share" size={22} color={colors.textGrey} />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={handleToggleBookmark} style={styles.headerButton}>
            <Icon 
              name={isBookmarked ? 'bookmark' : 'bookmark-border'} 
              size={22} 
              color={isBookmarked ? colors.primary : colors.textGrey} 
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={() => {}} />
        }
      >
        {/* Priority Badge */}
        <View style={styles.priorityContainer}>
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
              {announcement.priority.toUpperCase()} PRIORITY
            </Text>
          </View>
        </View>

        {/* Title */}
        <Text style={[
          styles.title,
          { color: isDark ? colors.dark.text : colors.light.text }
        ]}>
          {announcement.title}
        </Text>

        {/* Date Info */}
        <View style={styles.dateContainer}>
          <Text style={[styles.dateText, { color: colors.textGrey }]}>
            Published: {formatDate(announcement.start_date)}
          </Text>
          {announcement.expiry_date && (
            <Text style={[styles.dateText, { color: colors.textGrey }]}>
              Expires: {formatDate(announcement.expiry_date)}
            </Text>
          )}
        </View>

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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
  },
  headerButton: {
    padding: 8,
  },
  headerActions: {
    flexDirection: 'row',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  priorityContainer: {
    marginTop: 16,
    marginBottom: 16,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  priorityText: {
    fontFamily: typography.fonts.poppins.medium,
    fontSize: typography.sizes.small,
    marginLeft: 4,
  },
  title: {
    fontFamily: typography.fonts.poppins.bold,
    fontSize: typography.sizes.large,
    lineHeight: 36,
    marginBottom: 16,
  },
  dateContainer: {
    marginBottom: 20,
  },
  dateText: {
    fontFamily: typography.fonts.poppins.regular,
    fontSize: typography.sizes.small,
    marginBottom: 4,
  },
  imageContainer: {
    marginBottom: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 200,
  },
  contentContainer: {
    marginBottom: 24,
  },
  contentText: {
    fontFamily: typography.fonts.notoSerif.regular,
    fontSize: typography.sizes.large,
    lineHeight: 28,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 32,
  },
  actionButtonText: {
    fontFamily: typography.fonts.poppins.medium,
    fontSize: typography.sizes.medium,
    color: '#fff',
    marginRight: 8,
  },
});