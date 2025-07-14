// src/screens/sermons/SermonsHome.tsx - MODERN DESIGN
import React, { useState, useRef } from 'react';
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
  Animated,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Octicons from '@expo/vector-icons/Octicons';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { useVideoSermons, useAudioSermons } from '@/hooks/api';
import { VideoSermon } from '@/types/api';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import SearchBar from '@/components/search/SearchBar';

const { width, height } = Dimensions.get('window');

// Tab type - Updated to match reference
type TabType = 'featured' | 'sermons' | 'audio';

// Modern Hero Featured Card with Glassmorphism
const ModernHeroCard = ({ sermon, onPress, isDark }: any) => (
  <TouchableOpacity onPress={onPress} style={styles.heroCard}>
    <Image 
      source={{ 
        uri: sermon.thumbnail_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=200&fit=crop'
      }}
      style={styles.heroImage}
    />
    <LinearGradient
      colors={isDark ? ['transparent', 'rgba(0,0,0,0.8)'] : ['transparent', 'rgba(0,0,0,0.7)']}
      style={styles.heroGradient}
    />
    <View style={styles.heroContent}>
      <View style={styles.heroBadge}>
        <Icon name="play-circle-filled" size={16} color="#fff" />
        <Text style={styles.heroBadgeText}>Featured</Text>
      </View>
      <Text style={styles.heroTitle} numberOfLines={2}>
        {sermon.title}
      </Text>
      <Text style={styles.heroSpeaker}>{sermon.speaker}</Text>
      <View style={styles.heroMeta}>
        <View style={styles.heroMetaItem}>
          <Icon name="schedule" size={14} color="#fff" />
          <Text style={styles.heroMetaText}>{sermon.duration}</Text>
        </View>
        <View style={styles.heroMetaItem}>
          <Icon name="visibility" size={14} color="#fff" />
          <Text style={styles.heroMetaText}>{sermon.view_count || 0} views</Text>
        </View>
      </View>
    </View>
  </TouchableOpacity>
);

// Modern Grid Sermon Card with Glassmorphism
const ModernGridCard = ({ sermon, onPress, isDark }: any) => (
  <TouchableOpacity onPress={onPress} style={[styles.modernGridCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)' }]}>
    <View style={styles.modernGridImageContainer}>
      <Image 
        source={{ 
          uri: sermon.thumbnail_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=120&fit=crop'
        }}
        style={styles.modernGridImage}
      />
      <View style={styles.modernGridOverlay}>
        <View style={styles.playButton}>
          <Icon name="play-arrow" size={20} color="#fff" />
        </View>
      </View>
    </View>
    <View style={styles.modernGridContent}>
      <Text style={[styles.modernGridTitle, { color: isDark ? colors.dark.text : colors.light.text }]} numberOfLines={2}>
        {sermon.title}
      </Text>
      <Text style={styles.modernGridSpeaker}>{sermon.speaker}</Text>
      <View style={styles.modernGridMeta}>
        <View style={styles.modernGridMetaItem}>
          <Icon name="schedule" size={12} color={colors.textGrey} />
          <Text style={styles.modernGridMetaText}>{sermon.duration}</Text>
        </View>
        {sermon.is_featured && (
          <View style={styles.featuredBadge}>
            <Icon name="star" size={10} color={colors.primary} />
          </View>
        )}
      </View>
    </View>
  </TouchableOpacity>
);

// Modern Tab Header with Glassmorphism
const ModernTabHeader = ({ 
  activeTab, 
  onTabPress, 
  isDark,
  isSticky = false
}: { 
  activeTab: TabType; 
  onTabPress: (tab: TabType) => void;
  isDark: boolean;
  isSticky?: boolean;
}) => {
  const tabs = [
    { key: 'featured', label: 'Featured', icon: 'star' },
    { key: 'sermons', label: 'Video', icon: 'play-circle-filled' },
    { key: 'audio', label: 'Audio', icon: 'headphones' },
  ];

  return (
    <View style={[styles.modernTabHeader, isSticky && (isDark ? styles.stickyTabHeaderDark : styles.stickyTabHeaderLight)]}>
      {!isSticky && <BlurView intensity={isDark ? 20 : 30} style={StyleSheet.absoluteFill} />}
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[
            styles.modernTab,
            activeTab === tab.key && styles.modernTabActive
          ]}
          onPress={() => onTabPress(tab.key as TabType)}
        >
          <Icon 
            name={tab.icon as any} 
            size={20} 
            color={activeTab === tab.key ? colors.primary : colors.textGrey} 
          />
          <Text
            style={[
              styles.modernTabText,
              {
                color: activeTab === tab.key ? colors.primary : colors.textGrey,
                fontFamily: activeTab === tab.key 
                  ? typography.fonts.poppins.semiBold 
                  : typography.fonts.poppins.medium,
              }
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// Modern Featured Content
const ModernFeaturedContent = ({ navigation, isDark }: any) => {
  const { data: videos } = useVideoSermons();
  const { data: audios } = useAudioSermons();
  
  const allSermons = [...(videos || []), ...(audios || [])];

  return (
    <ScrollView style={styles.modernTabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.modernGridSection}>
        <View style={styles.modernGridContainer}>
          {allSermons && allSermons.length > 0 ? (
            allSermons.slice(0, 6).map((sermon, index) => (
              <ModernGridCard
                key={`${sermon.id}-${index}`}
                sermon={sermon}
                onPress={() => navigation.navigate('SermonDetail', { 
                  sermon, 
                  type: videos?.includes(sermon as VideoSermon) ? 'video' : 'audio'
                })}
                isDark={isDark}
              />
            ))
          ) : (
            <View style={styles.modernEmptyState}>
              <View style={styles.modernEmptyIcon}>
                <Icon name="playlist-play" size={48} color={colors.textGrey} />
              </View>
              <Text style={[styles.modernEmptyTitle, { color: isDark ? colors.dark.text : colors.light.text }]}>
                No Sermons Available
              </Text>
              <Text style={styles.modernEmptyText}>
                Check back later for new content
              </Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

// Modern Sermons Content
const ModernSermonsContent = ({ navigation, isDark }: any) => {
  const { data: videos, isLoading: videosLoading } = useVideoSermons();
  const { data: audios, isLoading: audiosLoading } = useAudioSermons();
  const [searchQuery, setSearchQuery] = useState('');

  const allSermons = [...(videos || []), ...(audios || [])];
  const filteredSermons = allSermons.filter(sermon => 
    sermon.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sermon.speaker.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (videosLoading || audiosLoading) return <LoadingSpinner />;

  return (
    <ScrollView style={styles.modernTabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.modernSearchContainer}>
        <SearchBar 
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search sermons..."
        />
      </View>
      
      <View style={styles.modernListSection}>
        <View style={styles.modernSectionHeader}>
          <Text style={[styles.modernSectionTitle, { color: isDark ? colors.dark.text : colors.light.text }]}>
            All Sermons
          </Text>
          <View style={styles.modernCountBadge}>
            <Text style={styles.modernCountText}>{filteredSermons?.length || 0}</Text>
          </View>
        </View>
        
        <View style={styles.modernGridContainer}>
          {filteredSermons && filteredSermons.length > 0 ? (
            filteredSermons.map((sermon, index) => (
              <ModernGridCard
                key={`${sermon.id}-${index}`}
                sermon={sermon}
                onPress={() => navigation.navigate('SermonDetail', { 
                  sermon, 
                  type: videos?.includes(sermon as VideoSermon) ? 'video' : 'audio'
                })}
                isDark={isDark}
              />
            ))
          ) : (
            <View style={styles.modernEmptyState}>
              <View style={styles.modernEmptyIcon}>
                <Icon name="search-off" size={48} color={colors.textGrey} />
              </View>
              <Text style={[styles.modernEmptyTitle, { color: isDark ? colors.dark.text : colors.light.text }]}>
                No Results Found
              </Text>
              <Text style={styles.modernEmptyText}>
                Try adjusting your search terms
              </Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

// Modern Audio Content
const ModernAudioContent = ({ navigation, isDark }: any) => {
  const { data: audios, isLoading } = useAudioSermons();

  if (isLoading) return <LoadingSpinner />;

  return (
    <ScrollView style={styles.modernTabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.modernGridSection}>
        <View style={styles.modernSectionHeader}>
          <Text style={[styles.modernSectionTitle, { color: isDark ? colors.dark.text : colors.light.text }]}>
            Audio Sermons
          </Text>
          <View style={styles.modernCountBadge}>
            <Text style={styles.modernCountText}>{audios?.length || 0}</Text>
          </View>
        </View>
        
        <View style={styles.modernGridContainer}>
          {audios && audios.length > 0 ? (
            audios.map((sermon, index) => (
              <ModernGridCard
                key={`${sermon.id}-${index}`}
                sermon={sermon}
                onPress={() => navigation.navigate('SermonDetail', { 
                  sermon, 
                  type: 'audio'
                })}
                isDark={isDark}
              />
            ))
          ) : (
            <View style={styles.modernEmptyState}>
              <View style={styles.modernEmptyIcon}>
                <Icon name="headphones" size={48} color={colors.textGrey} />
              </View>
              <Text style={[styles.modernEmptyTitle, { color: isDark ? colors.dark.text : colors.light.text }]}>
                No Audio Sermons
              </Text>
              <Text style={styles.modernEmptyText}>
                Audio sermons will appear here
              </Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

// Modern Refresh Icon
const ModernRefreshIcon = ({ isRefreshing }: { isRefreshing: boolean }) => (
  <View style={styles.modernRefreshIcon}>
    <Icon 
      name={isRefreshing ? "refresh" : "refresh"} 
      size={24} 
      color={colors.primary}
      style={isRefreshing ? styles.rotating : undefined}
    />
  </View>
);

// Main Component
const SermonsHome = ({ navigation }: any) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [activeTab, setActiveTab] = useState<TabType>('featured');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTabHeaderSticky, setIsTabHeaderSticky] = useState(false);
  const tabHeaderY = useRef(0);

  const { data: videos, refetch: refetchVideos } = useVideoSermons();
  const { data: audios, refetch: refetchAudios } = useAudioSermons();

  const featuredVideo = videos?.find(video => video.is_featured) || videos?.[0];

  const onRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refetchVideos(), refetchAudios()]);
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    if (isRefreshing) return;
    await onRefresh();
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'featured':
        return <ModernFeaturedContent navigation={navigation} isDark={isDark} />;
      case 'sermons':
        return <ModernSermonsContent navigation={navigation} isDark={isDark} />;
      case 'audio':
        return <ModernAudioContent navigation={navigation} isDark={isDark} />;
      default:
        return <ModernFeaturedContent navigation={navigation} isDark={isDark} />;
    }
  };

  // Handler to track scroll and set sticky state
  const handleScroll = (event: any) => {
    const y = event.nativeEvent.contentOffset.y;
    if (tabHeaderY.current !== 0) {
      setIsTabHeaderSticky(y >= tabHeaderY.current - 1); // -1 for precision
    }
  };

  return (
    <SafeAreaView style={[styles.modernContainer, { backgroundColor: isDark ? colors.dark.background : colors.light.background }]}> 
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      {/* Modern Header (sticky) */}
      <View style={styles.modernHeader}>
        <Text style={[
          styles.modernHeaderTitle,
          { color: isDark ? colors.dark.text : colors.light.text }
        ]}>
          Listen
        </Text>
        <TouchableOpacity 
          style={[
            styles.modernRefreshButton,
            isRefreshing && styles.modernRefreshButtonActive
          ]}
          onPress={handleRefresh}
          disabled={isRefreshing}
        >
          <ModernRefreshIcon isRefreshing={isRefreshing} />
        </TouchableOpacity>
      </View>
      {/* Scrollable content: HeroCard, TabHeader (sticky), TabContent */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[featuredVideo ? 1 : 0]}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Modern Hero Card */}
        {featuredVideo && (
          <View style={styles.modernHeroSection}>
            <ModernHeroCard
              sermon={featuredVideo}
              onPress={() => navigation.navigate('SermonDetail', { 
                sermon: featuredVideo, 
                type: 'video' 
              })}
              isDark={isDark}
            />
          </View>
        )}
        {/* Modern Tab Header (sticky) */}
        <View
          onLayout={e => {
            tabHeaderY.current = e.nativeEvent.layout.y;
          }}
        >
          <ModernTabHeader 
            activeTab={activeTab}
            onTabPress={setActiveTab}
            isDark={isDark}
            isSticky={isTabHeaderSticky}
          />
        </View>
        {/* Tab Content */}
        <View style={styles.modernContentContainer}>
          {renderContent()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  modernContainer: {
    flex: 1,
  },
  modernHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    justifyContent: 'center',
    position: 'relative',
  },
  modernHeaderTitle: {
    fontSize: 28,
    fontFamily: typography.fonts.poppins.bold,
    textAlign: 'center',
  },
  modernRefreshButton: {
    position: 'absolute',
    right: 24,
    padding: 12,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  modernRefreshButtonActive: {
    backgroundColor: `${colors.primary}20`,
  },
  modernRefreshIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rotating: {
    transform: [{ rotate: '360deg' }],
  },
  
  // Modern Hero Card
  modernHeroSection: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  heroCard: {
    borderRadius: 24,
    overflow: 'hidden',
    height: 270,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F5F5F5',
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  heroContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  heroBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: typography.fonts.poppins.medium,
    marginLeft: 4,
  },
  heroTitle: {
    fontSize: 24,
    fontFamily: typography.fonts.poppins.bold,
    color: '#fff',
    marginBottom: 8,
    lineHeight: 30,
  },
  heroSpeaker: {
    fontSize: 16,
    fontFamily: typography.fonts.poppins.medium,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 12,
  },
  heroMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  heroMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heroMetaText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontFamily: typography.fonts.poppins.regular,
  },

  // Modern Tab Header
  modernTabHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginHorizontal: 24,
    marginBottom: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  stickyTabHeaderLight: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.07)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },
  stickyTabHeaderDark: {
    backgroundColor: '#18181b',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.07)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  modernTab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 8,
  },
  modernTabActive: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  modernTabText: {
    fontSize: 14,
    fontFamily: typography.fonts.poppins.medium,
  },

  // Modern Content
  modernContentContainer: {
    flex: 1,
  },
  modernTabContent: {
    flex: 1,
    paddingHorizontal: 24,
  },
  modernSearchContainer: {
    marginBottom: 20,
  },
  modernGridSection: {
    marginBottom: 100,
  },
  modernListSection: {
    marginTop: 20,
    paddingBottom: 100,
  },
  modernSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modernSectionTitle: {
    fontSize: 20,
    fontFamily: typography.fonts.poppins.bold,
  },
  modernCountBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  modernCountText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: typography.fonts.poppins.semiBold,
  },
  modernGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },

  // Modern Grid Cards
  modernGridCard: {
    width: (width - 64) / 2, // 24px padding on each side + 16px gap
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modernGridImageContainer: {
    position: 'relative',
    height: 120,
  },
  modernGridImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F5F5F5',
  },
  modernGridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modernGridContent: {
    padding: 16,
  },
  modernGridTitle: {
    fontSize: 14,
    fontFamily: typography.fonts.poppins.semiBold,
    marginBottom: 6,
    lineHeight: 18,
  },
  modernGridSpeaker: {
    fontSize: 12,
    fontFamily: typography.fonts.poppins.medium,
    color: colors.textGrey,
    marginBottom: 8,
  },
  modernGridMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modernGridMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  modernGridMetaText: {
    fontSize: 11,
    fontFamily: typography.fonts.poppins.regular,
    color: colors.textGrey,
  },
  featuredBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: `${colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Modern Empty State
  modernEmptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  modernEmptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modernEmptyTitle: {
    fontSize: 20,
    fontFamily: typography.fonts.poppins.bold,
    marginBottom: 8,
    textAlign: 'center',
  },
  modernEmptyText: {
    color: colors.textGrey,
    fontSize: 16,
    fontFamily: typography.fonts.poppins.regular,
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default SermonsHome;