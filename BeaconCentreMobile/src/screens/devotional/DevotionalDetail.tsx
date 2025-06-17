// src/screens/devotional/DevotionalDetail.tsx
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import { DevotionalStackParamList } from '@/types/navigation';
import { colors, typography } from '@/constants';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { analyticsApi } from '@/services/api/analytics';
import { formatDate } from '@/utils/dateUtils';
import { readingTime } from '@/utils/textUtils';
import ReadingProgress from '@/components/devotional/ReadingProgress';
import RefreshControl from '@/components/common/RefreshControl';

type DevotionalDetailRouteProp = RouteProp<DevotionalStackParamList, 'DevotionalDetail'>;

export default function DevotionalDetail() {
  const navigation = useNavigation();
  const route = useRoute<DevotionalDetailRouteProp>();
  const { devotional } = route.params;
  
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const { userData, markDevotionalRead, addFavorite, removeFavorite } = useLocalStorage();
  
  const [isFavorite, setIsFavorite] = useState(false);
  const [isRead, setIsRead] = useState(false);
  const [readingStartTime, setReadingStartTime] = useState<Date | null>(null);
  const [timeSpent, setTimeSpent] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    if (userData) {
      setIsFavorite(userData.favoriteDevotionals.includes(devotional.id));
      setIsRead(userData.readDevotionals.includes(devotional.id));
    }
  }, [userData, devotional.id]);

  useEffect(() => {
    // Start reading timer
    setReadingStartTime(new Date());
    
    // Track view
    analyticsApi.trackInteraction('devotional', devotional.id, 'viewed');

    return () => {
      // Stop reading timer and save progress
      if (readingStartTime) {
        const timeSpentReading = Math.floor((new Date().getTime() - readingStartTime.getTime()) / 1000);
        if (timeSpentReading > 30) { // Only count if spent more than 30 seconds
          setTimeSpent(timeSpentReading);
        }
      }
    };
  }, []);

  const handleToggleFavorite = async () => {
    try {
      if (isFavorite) {
        await removeFavorite('devotional', devotional.id);
        setIsFavorite(false);
      } else {
        await addFavorite('devotional', devotional.id);
        setIsFavorite(true);
        analyticsApi.trackContentFavorite('devotional', devotional.id);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update favorites');
    }
  };

  const handleMarkAsRead = async () => {
    if (!isRead) {
      try {
        await markDevotionalRead(devotional.id);
        setIsRead(true);
        analyticsApi.trackDevotionalRead(devotional.id);
      } catch (error) {
        Alert.alert('Error', 'Failed to mark as read');
      }
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this devotional: "${devotional.title}"\n\n${devotional.verse_reference}: "${devotional.verse_text}"\n\nFrom The Beacon Centre app`,
        title: devotional.title,
      });
      
      analyticsApi.trackInteraction('devotional', devotional.id, 'shared');
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleScroll = (event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const progress = (contentOffset.y / (contentSize.height - layoutMeasurement.height)) * 100;
    setScrollProgress(Math.min(100, Math.max(0, progress)));
  };

  const estimatedReadTime = readingTime(devotional.content + (devotional.prayer || '')) * 60;

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
          
          <TouchableOpacity onPress={handleToggleFavorite} style={styles.headerButton}>
            <Icon 
              name={isFavorite ? 'favorite' : 'favorite-border'} 
              size={22} 
              color={isFavorite ? colors.red : colors.textGrey} 
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={() => {}} />
        }
      >
        {/* Date */}
        <Text style={[styles.date, { color: colors.primary }]}>
          {formatDate(devotional.date)}
        </Text>

        {/* Title */}
        <Text style={[
          styles.title,
          { color: isDark ? colors.dark.text : colors.light.text }
        ]}>
          {devotional.title}
        </Text>

        {/* Reading Progress */}
        <ReadingProgress
          progress={scrollProgress}
          timeSpent={timeSpent}
          estimatedReadTime={estimatedReadTime}
        />

        {/* Bible Verse */}
        <View style={[
          styles.verseContainer,
          { 
            backgroundColor: colors.primary + '10',
            borderLeftColor: colors.primary 
          }
        ]}>
          <Text style={[styles.verseReference, { color: colors.primary }]}>
            {devotional.verse_reference}
          </Text>
          <Text style={[
            styles.verseText,
            { color: isDark ? colors.dark.text : colors.light.text }
          ]}>
            "{devotional.verse_text}"
          </Text>
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>
          <Text style={[
            styles.contentText,
            { color: isDark ? colors.dark.text : colors.light.text }
          ]}>
            {devotional.content}
          </Text>
        </View>

        {/* Prayer */}
        {devotional.prayer && (
          <View style={[
            styles.prayerContainer,
            { backgroundColor: colors.blue + '10' }
          ]}>
            <View style={styles.prayerHeader}>
              <Icon name="favorite" size={20} color={colors.blue} />
              <Text style={[styles.prayerTitle, { color: colors.blue }]}>
                Prayer
              </Text>
            </View>
            <Text style={[
              styles.prayerText,
              { color: isDark ? colors.dark.text : colors.light.text }
            ]}>
              {devotional.prayer}
            </Text>
          </View>
        )}

        {/* Mark as Read Button */}
        {!isRead && (
          <TouchableOpacity
            style={[styles.markReadButton, { backgroundColor: colors.success }]}
            onPress={handleMarkAsRead}
          >
            <Icon name="check-circle" size={20} color="#fff" />
            <Text style={styles.markReadText}>Mark as Read</Text>
          </TouchableOpacity>
        )}

        {/* Read Status */}
        {isRead && (
          <View style={styles.readStatus}>
            <Icon name="check-circle" size={20} color={colors.success} />
            <Text style={[styles.readStatusText, { color: colors.success }]}>
              Completed
            </Text>
          </View>
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
  date: {
    fontFamily: typography.fonts.poppins.medium,
    fontSize: typography.sizes.sm,
    marginTop: 16,
    marginBottom: 8,
  },
  title: {
    fontFamily: typography.fonts.poppins.bold,
    fontSize: typography.sizes.lg,
    lineHeight: 36,
    marginBottom: 20,
  },
  verseContainer: {
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    marginBottom: 24,
  },
  verseReference: {
    fontFamily: typography.fonts.poppins.medium,
    fontSize: typography.sizes.sm,
    marginBottom: 8,
  },
  verseText: {
    fontFamily: typography.fonts.notoSerif.regular,
    fontSize: typography.sizes.lg,
    lineHeight: 28,
    fontStyle: 'italic',
  },
  contentContainer: {
    marginBottom: 24,
  },
  contentText: {
    fontFamily: typography.fonts.notoSerif.regular,
      fontSize: typography.sizes.lg,
    lineHeight: 28,
  },
  prayerContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  prayerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  prayerTitle: {
    fontFamily: typography.fonts.poppins.bold,
    fontSize: typography.sizes.lg,
    marginLeft: 8,
  },
  prayerText: {
    fontFamily: typography.fonts.notoSerif.regular,
    fontSize: typography.sizes.lg,
    lineHeight: 28,
    fontStyle: 'italic',
  },
  markReadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 32,
  },
  markReadText: {
    fontFamily: typography.fonts.poppins.medium,
    fontSize: typography.sizes.sm,
    color: '#fff',
    marginLeft: 8,
  },
  readStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginBottom: 32,
  },
  readStatusText: {
    fontFamily: typography.fonts.poppins.medium,
    fontSize: typography.sizes.sm,
    marginLeft: 8,
  },
});
