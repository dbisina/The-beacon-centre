// src/screens/announcements/AnnouncementsHome.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  useColorScheme,
  Text,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { apiClient } from '@/services/api/client';
import AnnouncementCard from '@/components/announcements/AnnouncementCard';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import OfflineBanner from '@/components/common/OfflineBanner';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import { useApp } from '@/context/AppContext';
import LocalStorageService from '@/services/storage/LocalStorage';
import { colors, } from '@/constants/colors';
import { typography } from '@/constants/typography';

interface Announcement {
  id: number;
  action_url?: string;
  action_text?: string;
  start_date: string;
  expiry_date?: string;
  is_active: boolean;
}

type AnnouncementsStackParamList = {
  AnnouncementDetail: { announcement: any };
};

type AnnouncementsHomeProps = {
  navigation: StackNavigationProp<AnnouncementsStackParamList, 'AnnouncementDetail'>;
};

const AnnouncementsHome = ({ navigation }: AnnouncementsHomeProps) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { state } = useApp();

  const { data: announcements, isLoading, refetch } = useAnnouncements();
  const [bookmarkedAnnouncements, setBookmarkedAnnouncements] = useState<number[]>([]);

  useEffect(() => {
    if (state.userData) {
      setBookmarkedAnnouncements(state.userData.bookmarkedAnnouncements);
    }
  }, [state.userData]);

  const handleAnnouncementPress = async (announcement: Announcement) => {
    // Track interaction
    if (state.userData) {
      try {
        await apiClient.post('/analytics/track', {
          device_id: state.userData.deviceId,
          content_type: 'announcement',
          content_id: announcement.id,
          interaction_type: 'viewed',
        });
      } catch (error) {
        console.log('Analytics tracking failed (offline)');
      }
    }

    if (announcement.action_url) {
      Alert.alert(
        'Open Link',
        `Would you like to open: ${announcement.action_text || 'this link'}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Open', 
            onPress: () => {
              if (announcement.action_url) {
                Linking.openURL(announcement.action_url);
              }
            }
          },
        ]
      );
    } else {
      navigation.navigate('AnnouncementDetail', { announcement });
    }
  };

  const handleToggleBookmark = async (announcementId: number) => {
    const isBookmarked = bookmarkedAnnouncements.includes(announcementId);
    const userData = await LocalStorageService.getUserData();
    
    if (isBookmarked) {
      userData.bookmarkedAnnouncements = userData.bookmarkedAnnouncements.filter(
        id => id !== announcementId
      );
      setBookmarkedAnnouncements(prev => prev.filter(id => id !== announcementId));
    } else {
      userData.bookmarkedAnnouncements.push(announcementId);
      setBookmarkedAnnouncements(prev => [...prev, announcementId]);
    }
    
    await LocalStorageService.saveUserData(userData);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const activeAnnouncements = announcements?.filter(announcement => {
    const now = new Date();
    const startDate = new Date(announcement.start_date);
    const expiryDate = announcement.expiry_date ? new Date(announcement.expiry_date) : null;
    
    return announcement.is_active && 
           startDate <= now && 
           (!expiryDate || expiryDate >= now);
  });

  return (
    <SafeAreaView style={[
      styles.container,
      { backgroundColor: isDark ? colors.dark.background : colors.light.background }
    ]}>
      {!state.isOnline && <OfflineBanner />}
      
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[
            styles.headerTitle,
            { color: isDark ? colors.dark.text : colors.light.text }
          ]}>
            Church Announcements
          </Text>
          <Text style={[
            styles.headerSubtitle,
            { color: colors.textGrey }
          ]}>
            Stay updated with latest church news and events
          </Text>
        </View>

        {activeAnnouncements?.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[
              styles.emptyText,
              { color: colors.textGrey }
            ]}>
              No active announcements at the moment
            </Text>
          </View>
        ) : (
          activeAnnouncements?.map((announcement) => (
            <AnnouncementCard
              key={announcement.id}
              announcement={announcement}
              onPress={() => handleAnnouncementPress(announcement)}
              onBookmark={() => handleToggleBookmark(announcement.id)}
              isBookmarked={bookmarkedAnnouncements.includes(announcement.id)}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingTop: 8,
  },
  headerTitle: {
    fontFamily: typography.fonts.poppins.bold,
    fontSize: typography.sizes.title,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontFamily: typography.fonts.notoSerif.regular,
    fontSize: typography.sizes.medium,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: typography.fonts.poppins.regular,
    fontSize: typography.sizes.medium,
    textAlign: 'center',
  },
});

export default AnnouncementsHome;