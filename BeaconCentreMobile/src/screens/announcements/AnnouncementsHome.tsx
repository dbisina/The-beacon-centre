// src/screens/announcements/AnnouncementsHome.tsx - EXACT UI MATCH
import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  useColorScheme,
  Text,
  TouchableOpacity,
  Image,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Octicons from '@expo/vector-icons/Octicons';

import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { useAnnouncements } from '@/hooks/api';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Announcement } from '@/types/api';

// Announcement Card Component - Matches reference design exactly
const AnnouncementCard = ({ 
  announcement, 
  onPress 
}: { 
  announcement: Announcement; 
  onPress: () => void;
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handleActionPress = async () => {
    if (announcement.action_url) {
      try {
        await Linking.openURL(announcement.action_url);
      } catch (error) {
        Alert.alert('Error', 'Could not open link');
      }
    }
  };

  return (
    <TouchableOpacity 
      style={[
        styles.announcementCard,
        { backgroundColor: isDark ? colors.dark.card : colors.light.card }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        {/* Left Content */}
        <View style={styles.textContent}>
          <Text style={[
            styles.announcementTitle,
            { color: isDark ? colors.dark.text : colors.light.text }
          ]}>
            {announcement.title}
          </Text>
          <Text style={[
            styles.announcementDescription,
            { color: colors.textGrey }
          ]}>
            {announcement.content}
          </Text>
          
          {/* Action Button */}
          {announcement.action_text && announcement.action_url && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleActionPress}
            >
              <Text style={styles.actionButtonText}>
                {announcement.action_text}
              </Text>
              <Icon name="arrow-forward" size={16} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Right Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ 
              uri: announcement.image_url || 'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=120&h=120&fit=crop'
            }}
            style={styles.announcementImage}
            resizeMode="cover"
          />
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Main Announcements Component
const AnnouncementsHome = ({ navigation }: any) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [refreshing, setRefreshing] = useState(false);

  const { data: announcements, isLoading, refetch } = useAnnouncements();

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleAnnouncementPress = (announcement: Announcement) => {
    // Navigate to announcement detail or perform action
    console.log('📢 Announcement pressed:', announcement.title);
    
    // You can add navigation here if you have a detail screen
    // navigation.navigate('AnnouncementDetail', { announcement });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[
        styles.container,
        { backgroundColor: isDark ? colors.dark.background : colors.light.background }
      ]}>
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[
      styles.container,
      { backgroundColor: isDark ? colors.dark.background : colors.light.background }
    ]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[
          styles.headerTitle,
          { color: isDark ? colors.dark.text : colors.light.text }
        ]}>
          Announcements
        </Text>
        <TouchableOpacity style={styles.searchButton}>
          <Octicons name="search" size={24} color={isDark ? colors.dark.text : colors.black} />
        </TouchableOpacity>
      </View>

      {/* Announcements List */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.announcementsList}>
          {announcements && announcements.length > 0 ? (
            announcements.map((announcement) => (
              <AnnouncementCard
                key={announcement.id}
                announcement={announcement}
                onPress={() => handleAnnouncementPress(announcement)}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Icon name="campaign" size={64} color={colors.textGrey} />
              <Text style={[
                styles.emptyStateTitle,
                { color: isDark ? colors.dark.text : colors.light.text }
              ]}>
                No Announcements
              </Text>
              <Text style={styles.emptyStateText}>
                Check back soon for church updates and events
              </Text>
            </View>
          )}
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    justifyContent: 'center',
    position: 'relative',
  },
  headerTitle: {
    ...typography.styles.h4,
    textAlign: 'center',
  },
  searchButton: {
    position: 'absolute',
    right: 20,
    padding: 4,
  },
  content: {
    flex: 1,
  },
  announcementsList: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 100, // Space for bottom tab
  },
  
  // Announcement Card Styles - Matches reference exactly
  announcementCard: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    padding: 16,
  },
  textContent: {
    flex: 1,
    marginRight: 16,
  },
  announcementTitle: {
    fontSize: 16,
    fontFamily: typography.fonts.poppins.semiBold,
    lineHeight: 20,
    marginBottom: 8,
  },
  announcementDescription: {
    fontSize: 14,
    fontFamily: typography.fonts.poppins.regular,
    lineHeight: 20,
    marginBottom: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: typography.fonts.poppins.medium,
    color: colors.primary,
    marginRight: 4,
  },
  imageContainer: {
    width: 80,
    height: 80,
  },
  announcementImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    backgroundColor: colors.backgroundSecondary,
  },
  
  // Empty State Styles
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontFamily: typography.fonts.poppins.semiBold,
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateText: {
    color: colors.textGrey,
    fontSize: 14,
    fontFamily: typography.fonts.poppins.regular,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});

export default AnnouncementsHome;
