// src/screens/devotional/DevotionalHome.tsx - MODERN UI
import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  useColorScheme,
  Text,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';

import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { useDevotionals } from '@/hooks/api';
import { useApp } from '@/context/AppContext';
import DevotionalCard from '@/components/devotional/DevotionalCard';
import LoadingSpinner from '@/components/common/LoadingSpinner';

const { width } = Dimensions.get('window');

const DevotionalHome = ({ navigation }: any) => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
  const { state } = useApp();
  const { data: devotionals, isLoading, refetch } = useDevotionals();
  const [refreshing, setRefreshing] = useState(false);

  const todaysDevotional = devotionals?.find(d => 
    d.date === new Date().toISOString().split('T')[0]
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <SafeAreaView style={[
      styles.container,
      { backgroundColor: isDark ? colors.dark.background : colors.light.background }
    ]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={[
            styles.greeting,
            { color: isDark ? colors.dark.text : colors.light.text }
          ]}>
            Welcome Shining Light
          </Text>
          <TouchableOpacity style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={24} color={isDark ? colors.dark.text : colors.light.text} />
          </TouchableOpacity>
        </View>

        {/* Today's Devotional Card */}
        {todaysDevotional && (
          <TouchableOpacity
            onPress={() => navigation.navigate('DevotionalDetail', { 
              devotional: todaysDevotional 
            })}
            style={styles.featuredCard}
          >
            <LinearGradient
              colors={colors.gradients.primary as any}
              style={styles.gradientCard}
            >
              <View style={styles.cardContent}>
                <Text style={styles.cardLabel}>Daily Devotional</Text>
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {todaysDevotional.title}
                </Text>
                <Text style={styles.cardSubtitle} numberOfLines={1}>
                  Dive into today's scripture and reflection
                </Text>
                <View style={styles.readButton}>
                  <Text style={styles.readButtonText}>READ</Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Menu Section */}
        <View style={styles.menuSection}>
          <Text style={[
            styles.sectionTitle,
            { color: isDark ? colors.dark.text : colors.light.text }
          ]}>
            Menu
          </Text>
          
          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: isDark ? colors.dark.background : colors.light.background }]}
            onPress={() => navigation.navigate('AnnouncementsHome')}
          >
            <View style={[styles.menuIcon, { backgroundColor: isDark ? colors.dark.backgroundSecondary : colors.light.backgroundSecondary }]}>
              <Ionicons name="megaphone-outline" size={24} color={isDark ? colors.dark.text : colors.light.text} />
            </View>
            <Text style={[styles.menuText, { color: isDark ? colors.dark.text : colors.light.text }]}>
              Announcements
            </Text>
            
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: isDark ? colors.dark.background : colors.light.background }]}
            onPress={() => navigation.navigate('DevotionalArchive')}
          >
            <View style={[styles.menuIcon, { backgroundColor: isDark ? colors.dark.backgroundSecondary : colors.light.backgroundSecondary }]}>
              <Ionicons name="calendar-outline" size={24} color={isDark ? colors.dark.text : colors.light.text} />
            </View>
            <Text style={[styles.menuText, { color: isDark ? colors.dark.text : colors.light.text }]}>
              Calendar
            </Text>
            
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: isDark ? colors.dark.background : colors.light.background }]}
          >
            <View style={[styles.menuIcon, { backgroundColor: isDark ? colors.dark.backgroundSecondary : colors.light.backgroundSecondary }]}>
              <Ionicons name="ticket-outline" size={24} color={isDark ? colors.dark.text : colors.light.text} />
            </View>
            <Text style={[styles.menuText, { color: isDark ? colors.dark.text : colors.light.text }]}>
              Events
            </Text>
            
          </TouchableOpacity>
        </View>

        {/* Recent Devotionals */}
        <View style={styles.recentSection}>
          <Text style={[
            styles.sectionTitle,
            { color: isDark ? colors.dark.text : colors.light.text }
          ]}>
            Recent Devotionals
          </Text>
          
          {devotionals?.slice(0, 5).map((devotional) => (
            <DevotionalCard
              key={devotional.id}
              devotional={devotional}
              onPress={() => navigation.navigate('DevotionalDetail', { devotional })}
              isRead={state.userData?.readDevotionals.includes(devotional.id)}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  greeting: {
    ...typography.styles.h2,
    flex: 1,
    fontFamily: typography.fonts.poppins.semiBold,
    fontSize: typography.sizes.lg,
    textAlign: 'center',
  },
  settingsButton: {
    padding: 8,
  },
  featuredCard: {
    marginHorizontal: 20,
    marginVertical: 15,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  gradientCard: {
    padding: 24,
    minHeight: 160,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cardLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontFamily: typography.fonts.poppins.medium,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardTitle: {
    color: '#FFFFFF',
    ...typography.styles.h3,
    marginTop: 8,
  },
  cardSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    fontFamily: typography.fonts.poppins.regular,
    marginTop: 8,
  },
  readButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 16,
  },
  readButtonText: {
    color: '#FFFFFF',
    fontFamily: typography.fonts.poppins.semiBold,
    fontSize: 14,
    letterSpacing: 1,
  },
  menuSection: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionTitle: {
    ...typography.styles.h3,
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
  },
  menuText: {
    flex: 1,
    marginLeft: 16,
    ...typography.styles.body1,
  },
  menuIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 100,
    padding: 10,
    marginRight: 10,
  },
  recentSection: {
    paddingHorizontal: 20,
    marginTop: 20,
    paddingBottom: 100, // Bottom tab space
  },
});

export default DevotionalHome;