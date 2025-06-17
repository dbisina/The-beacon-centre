// src/screens/announcements/AnnouncementDetail.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  Share,
  Linking,
  Alert,
  useColorScheme,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { AnnouncementsStackParamList } from '@/types/navigation';
import { useFavorites } from '@/hooks/api';

type AnnouncementDetailScreenProps = {
  route: RouteProp<AnnouncementsStackParamList, 'AnnouncementDetail'>;
  navigation: StackNavigationProp<AnnouncementsStackParamList, 'AnnouncementDetail'>;
};

const AnnouncementDetailScreen: React.FC<AnnouncementDetailScreenProps> = ({
  route,
  navigation
}) => {
  const { announcement } = route.params;
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const { isFavorite, toggleFavorite } = useFavorites();
  const isSaved = isFavorite('announcement', announcement.id);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return colors.red;
      case 'medium':
        return colors.yellow;
      case 'low':
        return colors.primary;
      default:
        return colors.textGrey;
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'Important';
      case 'medium':
        return 'Moderate';
      case 'low':
        return 'General';
      default:
        return 'Info';
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${announcement.title}\n\n${announcement.content}\n\nCheck out The Beacon Centre app for more updates!`,
        title: announcement.title,
      });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  const handleSave = () => {
    toggleFavorite('announcement', announcement.id);
  };

  const handleActionPress = async () => {
    if (announcement.action_url) {
      try {
        const supported = await Linking.canOpenURL(announcement.action_url);
        if (supported) {
          await Linking.openURL(announcement.action_url);
        } else {
          Alert.alert('Error', 'Unable to open the link');
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to open the link');
      }
    }
  };

  return (
    <SafeAreaView style={[
      styles.container,
      { backgroundColor: isDark ? colors.dark.background : '#ffffff' }
    ]}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={[
        styles.header,
        { backgroundColor: isDark ? colors.dark.background : '#ffffff' }
      ]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Icon name="arrow-back" size={24} color={colors.textGrey} />
        </TouchableOpacity>
        <Text style={[
          styles.headerTitle,
          { color: isDark ? colors.dark.text : '#000' }
        ]}>
          Announcement
        </Text>
        <TouchableOpacity onPress={handleSave} style={styles.headerButton}>
          <Icon 
            name={isSaved ? "bookmark" : "bookmark-border"} 
            size={24} 
            color={isSaved ? colors.primary : colors.textGrey} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View style={styles.imageSection}>
          {announcement.image_url ? (
            <Image source={{ uri: announcement.image_url }} style={styles.heroImage} />
          ) : (
            <View style={styles.placeholderImage}>
              <View style={styles.churchSceneContainer}>
                {/* Church building silhouette */}
                <View style={styles.churchBuilding}>
                  <View style={styles.churchBase} />
                  <View style={styles.churchRoof} />
                  <View style={styles.churchSpire} />
                  <View style={styles.churchDoor} />
                  <View style={styles.churchWindow} />
                </View>
                
                {/* People silhouettes */}
                <View style={styles.peopleContainer}>
                  <View style={[styles.person, styles.person1]} />
                  <View style={[styles.person, styles.person2]} />
                  <View style={[styles.person, styles.person3]} />
                  <View style={[styles.person, styles.person4]} />
                  <View style={[styles.person, styles.person5]} />
                </View>
              </View>
            </View>
          )}
          
          {/* Priority Badge */}
          <View style={styles.priorityBadgeContainer}>
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(announcement.priority) }]}>
              <Icon 
                name={announcement.priority === 'high' ? 'error' : 'info'} 
                size={16} 
                color="#ffffff" 
              />
              <Text style={styles.priorityText}>{getPriorityText(announcement.priority)}</Text>
            </View>
          </View>
        </View>

        {/* Content Section */}
        <View style={styles.contentSection}>
          {/* Title and Date */}
          <View style={styles.titleSection}>
            <Text style={[
              styles.announcementTitle,
              { color: isDark ? colors.dark.text : '#000' }
            ]}>
              {announcement.title}
            </Text>
            <Text style={styles.dateText}>
              Posted on {formatDate(announcement.start_date)}
            </Text>
            {announcement.expiry_date && (
              <Text style={styles.expiryText}>
                Valid until {formatDate(announcement.expiry_date)}
              </Text>
            )}
          </View>

          {/* Content */}
          <View style={styles.textContent}>
            <Text style={styles.contentText}>{announcement.content}</Text>
          </View>

          {/* Action Button */}
          {announcement.action_url && announcement.action_text && (
            <View style={styles.actionSection}>
              <TouchableOpacity onPress={handleActionPress} style={styles.actionButton}>
                <Text style={styles.actionButtonText}>{announcement.action_text}</Text>
                <Icon name="chevron-right" size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>
          )}

          {/* Share Section */}
          <View style={styles.shareSection}>
            <Text style={[
              styles.shareTitle,
              { color: isDark ? colors.dark.text : '#000' }
            ]}>
              Share this announcement
            </Text>
            <View style={styles.shareButtons}>
              <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
                <View style={styles.shareIconContainer}>
                  <Icon name="share" size={20} color={colors.textGrey} />
                </View>
                <Text style={styles.shareButtonText}>Share</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleSave} style={styles.shareButton}>
                <View style={styles.shareIconContainer}>
                  <Icon 
                    name={isSaved ? "bookmark" : "bookmark-border"} 
                    size={20} 
                    color={isSaved ? colors.primary : colors.textGrey} 
                  />
                </View>
                <Text style={[styles.shareButtonText, isSaved && styles.savedText]}>
                  {isSaved ? 'Saved' : 'Save'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.shareButton}>
                <View style={styles.shareIconContainer}>
                  <Icon name="event" size={20} color={colors.textGrey} />
                </View>
                <Text style={styles.shareButtonText}>Add to Calendar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: typography.fonts.poppins.semiBold,
  },
  content: {
    flex: 1,
  },
  imageSection: {
    position: 'relative',
    height: 240,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  churchSceneContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  churchBuilding: {
    position: 'absolute',
    bottom: 40,
  },
  churchBase: {
    width: 80,
    height: 60,
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  churchRoof: {
    width: 0,
    height: 0,
    borderLeftWidth: 50,
    borderRightWidth: 50,
    borderBottomWidth: 30,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: colors.primary,
    position: 'absolute',
    top: -30,
    left: -10,
  },
  churchSpire: {
    width: 12,
    height: 40,
    backgroundColor: colors.primary,
    position: 'absolute',
    top: -70,
    left: 34,
  },
  churchDoor: {
    width: 16,
    height: 28,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    position: 'absolute',
    bottom: 0,
    left: 32,
  },
  churchWindow: {
    width: 8,
    height: 8,
    backgroundColor: colors.yellow,
    borderRadius: 4,
    position: 'absolute',
    top: 15,
    left: 36,
  },
  peopleContainer: {
    position: 'absolute',
    bottom: 20,
    width: '80%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  person: {
    backgroundColor: colors.textGrey,
    borderRadius: 20,
  },
  person1: { width: 8, height: 20 },
  person2: { width: 6, height: 16 },
  person3: { width: 8, height: 22 },
  person4: { width: 7, height: 18 },
  person5: { width: 6, height: 15 },
  priorityBadgeContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  priorityText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
    fontFamily: typography.fonts.poppins.semiBold,
  },
  contentSection: {
    flex: 1,
  },
  titleSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  announcementTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    lineHeight: 30,
    fontFamily: typography.fonts.poppins.bold,
  },
  dateText: {
    fontSize: 14,
    color: colors.textGrey,
    marginBottom: 4,
    fontFamily: typography.fonts.poppins.regular,
  },
  expiryText: {
    fontSize: 14,
    color: colors.red,
    fontWeight: '500',
    fontFamily: typography.fonts.poppins.medium,
  },
  textContent: {
    padding: 20,
  },
  contentText: {
    fontSize: 16,
    lineHeight: 26,
    color: colors.textGrey,
    fontFamily: typography.fonts.notoSerif.regular,
  },
  actionSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  actionButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
    fontFamily: typography.fonts.poppins.semiBold,
  },
  shareSection: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  shareTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    fontFamily: typography.fonts.poppins.semiBold,
  },
  shareButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  shareButton: {
    alignItems: 'center',
    flex: 1,
  },
  shareIconContainer: {
    width: 44,
    height: 44,
    backgroundColor: '#F8F9FA',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F5F5F5',
  },
  shareButtonText: {
    fontSize: 12,
    color: colors.textGrey,
    fontWeight: '500',
    fontFamily: typography.fonts.poppins.medium,
  },
  savedText: {
    color: colors.primary,
  },
});

export default AnnouncementDetailScreen;