// src/screens/devotional/DevotionalHome.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  useColorScheme,
  Text,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

import DevotionalCard from '@/components/devotional/DevotionalCard';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import OfflineBanner from '@/components/common/OfflineBanner';
import { useTodaysDevotional, useDevotionals } from '@/hooks/useDevotionals';
import { useApp } from '@/context/AppContext';
import { colors, typography } from '@/constants';
import LocalStorageService from '@/services/storage/LocalStorage';
import { Devotional } from '@/types/api';

const DevotionalHome = ({ navigation }: { navigation: any }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { state } = useApp();
  
  const { data: todaysDevotional, isLoading: todayLoading, refetch: refetchToday } = useTodaysDevotional();
  const { data: recentDevotionals, isLoading: recentLoading, refetch: refetchRecent } = useDevotionals();
  
  const [readDevotionals, setReadDevotionals] = useState<number[]>([]);
  const [readingStreak, setReadingStreak] = useState(0);

  useEffect(() => {
    if (state.userData) {
      setReadDevotionals(state.userData.readDevotionals);
      setReadingStreak(state.userData.readingStreak.currentStreak);
    }
  }, [state.userData]);

  const handleRefresh = async () => {
    await Promise.all([refetchToday(), refetchRecent()]);
  };

  const navigateToDetail = (devotional: Devotional) => {
    navigation.navigate('DevotionalDetail', { devotional });
  };

  const navigateToArchive = () => {
    navigation.navigate('DevotionalArchive');
  };

  if (todayLoading || recentLoading) {
    return <LoadingSpinner />;
  }

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
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Reading Streak Header */}
        <View style={styles.streakContainer}>
          <View style={styles.streakInfo}>
            <Icon name="local-fire-department" size={24} color={colors.yellow} />
            <Text style={[
              styles.streakText,
              { color: isDark ? colors.dark.text : colors.light.text }
            ]}>
              {readingStreak} day streak
            </Text>
          </View>
          <TouchableOpacity onPress={navigateToArchive}>
            <Text style={[styles.archiveLink, { color: colors.primary }]}>
              View Archive
            </Text>
          </TouchableOpacity>
        </View>

        {/* Today's Devotional */}
        <View style={styles.section}>
          <Text style={[
            styles.sectionTitle,
            { color: isDark ? colors.dark.text : colors.light.text }
          ]}>
            Today's Devotional
          </Text>
          
          {todaysDevotional && (
            <DevotionalCard
              devotional={todaysDevotional}
              onPress={() => navigateToDetail(todaysDevotional)}
              isRead={readDevotionals.includes(todaysDevotional.id)}
              showDate={true}
            />
          )}
        </View>

        {/* Recent Devotionals */}
        <View style={styles.section}>
          <Text style={[
            styles.sectionTitle,
            { color: isDark ? colors.dark.text : colors.light.text }
          ]}>
            Recent Devotionals
          </Text>
          
          {recentDevotionals?.slice(0, 5).map((devotional) => (
            <DevotionalCard
              key={devotional.id}
              devotional={devotional}
              onPress={() => navigateToDetail(devotional)}
              isRead={readDevotionals.includes(devotional.id)}
              showDate={true}
            />
          ))}
        </View>
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
  streakContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  streakInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakText: {
    fontFamily: typography.fonts.poppins.medium,
    fontSize: typography.sizes.medium,
    marginLeft: 8,
  },
  archiveLink: {
    fontFamily: typography.fonts.poppins.medium,
    fontSize: typography.sizes.medium,
  },
  section: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontFamily: typography.fonts.poppins.bold,
    fontSize: typography.sizes.large,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
});

export default DevotionalHome;