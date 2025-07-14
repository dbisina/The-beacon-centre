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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';

import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { useDevotionals } from '@/hooks/api';
import { useVideoSermons, useAudioSermons } from '@/hooks/api';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import { useApp } from '@/context/AppContext';
import DevotionalCard from '@/components/devotional/DevotionalCard';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import VideoCard from '@/components/video/VideoCard';
import AudioCard from '@/components/audio/AudioCard';

// ModernHeroCard copied from SermonsHome for visual consistency
import Icon from 'react-native-vector-icons/MaterialIcons';
const ModernHeroCard = ({ sermon, onPress, isDark }: any) => (
  <TouchableOpacity onPress={onPress} style={{
    width: 280,
    height: 180,
    marginRight: 16,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  }}>
    <Image 
      source={{ uri: sermon.thumbnail_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=200&fit=crop' }}
      style={{ width: '100%', height: '100%', position: 'absolute' }}
      resizeMode="cover"
    />
    <LinearGradient
      colors={isDark ? ['transparent', 'rgba(0,0,0,0.8)'] : ['transparent', 'rgba(0,0,0,0.7)']}
      style={{ ...StyleSheet.absoluteFillObject }}
    />
    <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
        <Icon name="play-circle-filled" size={16} color="#fff" />
        <Text style={{ color: '#fff', fontSize: 12, marginLeft: 6, fontWeight: 'bold' }}>Featured</Text>
      </View>
      <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }} numberOfLines={2}>{sermon.title}</Text>
      <Text style={{ color: '#fff', fontSize: 14, marginTop: 2 }}>{sermon.speaker}</Text>
      <View style={{ flexDirection: 'row', marginTop: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12 }}>
          <Icon name="schedule" size={14} color="#fff" />
          <Text style={{ color: '#fff', fontSize: 12, marginLeft: 2 }}>{sermon.duration}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Icon name="visibility" size={14} color="#fff" />
          <Text style={{ color: '#fff', fontSize: 12, marginLeft: 2 }}>{sermon.view_count || 0} views</Text>
        </View>
      </View>
    </View>
  </TouchableOpacity>
);

const { width } = Dimensions.get('window');

const DevotionalHome = ({ navigation }: any) => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
  const { state } = useApp();
  const { data: devotionals, isLoading, refetch } = useDevotionals();
  const { data: videoSermons } = useVideoSermons();
  const { data: audioSermons } = useAudioSermons();
  const { data: announcements } = useAnnouncements();
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

  // Debug logs for featured data
  console.log('VideoSermons:', videoSermons);
  console.log('AudioSermons:', audioSermons);

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

        {/* Most Recent Announcement */}
        {announcements && announcements.length > 0 && (
          <View style={{ marginTop: 16, marginHorizontal: 20 }}>
            <Text style={[styles.sectionTitle, { color: isDark ? colors.dark.text : colors.light.text }]}>Latest Announcement</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AnnouncementDetail', { announcement: announcements[0] })} style={{ marginTop: 8 }}>
              <View style={{ backgroundColor: isDark ? colors.dark.card : colors.light.card, borderRadius: 12, padding: 16 }}>
                <Text style={{ color: isDark ? colors.dark.text : colors.light.text, fontWeight: 'bold', fontSize: 16 }}>{announcements[0].title}</Text>
                <Text style={{ color: colors.textGrey, marginTop: 4 }}>{announcements[0].summary || announcements[0].content?.slice(0, 80) + '...'}</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Spotlight Sermons (featured video only) */}
        {videoSermons && videoSermons.length > 0 && (
          <View style={{ marginTop: 16 }}>
            <Text style={[styles.sectionTitle, { color: isDark ? colors.dark.text : colors.light.text, marginLeft: 20 }]}>Spotlight Sermons</Text>
            <ScrollView horizontal={videoSermons.length > 1} showsHorizontalScrollIndicator={false} style={{ paddingLeft: 20, marginTop: 8 }}>
              {videoSermons.slice(0, 6).map((sermon, idx) => (
                <ModernHeroCard
                  key={sermon.id || idx}
                  sermon={sermon}
                  onPress={() => navigation.navigate('SermonDetail', { sermon, type: 'video' })}
                  isDark={isDark}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Featured Audio Sermons (AudioCard design) */}
        {audioSermons && audioSermons.length > 0 && (
          <View style={{ marginTop: 16 }}>
            <ScrollView horizontal={audioSermons.length > 1} showsHorizontalScrollIndicator={false} style={{ paddingLeft: 20, marginTop: 8 }}>
              {audioSermons.slice(0, 6).map((sermon, idx) => (
                <View key={sermon.id || idx} style={{ marginRight: 12 }}>
                  <AudioCard
                    sermon={sermon}
                    onPress={() => navigation.navigate('SermonDetail', { sermon, type: 'audio' })}
                  />
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Featured Goaks */}
        {videoSermons && videoSermons.filter(v => (v.speaker || '').toLowerCase() === 'goaks').length > 0 && (
          <View style={{ marginTop: 16 }}>
            <Text style={[styles.sectionTitle, { color: isDark ? colors.dark.text : colors.light.text, marginLeft: 20 }]}>Featured GOAKs</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 20, marginTop: 8 }}>
              {videoSermons.filter(v => (v.speaker || '').toLowerCase() === 'goaks').slice(0, 6).map((sermon, idx) => (
                <View key={sermon.id || idx} style={{ marginRight: 12 }}>
                  <VideoCard
                    sermon={sermon}
                    onPress={() => navigation.navigate('SermonDetail', { sermon, type: 'goaks' })}
                  />
                </View>
              ))}
            </ScrollView>
          </View>
        )}

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
    marginBottom: 8,
  },
  menuText: {
    flex: 1,
    marginLeft: 16,
    ...typography.styles.body1,
  },
  menuIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    padding: 10,
    marginRight: 8,
  },
  recentSection: {
    paddingHorizontal: 20,
    marginTop: 20,
    paddingBottom: 100, // Bottom tab space
  },
});

export default DevotionalHome;