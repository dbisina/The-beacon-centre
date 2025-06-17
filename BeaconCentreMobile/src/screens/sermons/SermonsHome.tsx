// src/screens/sermons/SermonsHome.tsx - EXACT UI MATCH
import React, { useState } from 'react';
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
import Icon from 'react-native-vector-icons/MaterialIcons';
import Octicons from '@expo/vector-icons/Octicons';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { useVideoSermons, useAudioSermons } from '@/hooks/api';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import SearchBar from '@/components/search/SearchBar';

const { width } = Dimensions.get('window');

// Tab type - Updated to match reference
type TabType = 'featured' | 'sermons' | 'audio';

// Main Featured Sermon Card - Matches reference design exactly
const MainFeaturedCard = ({ sermon, onPress }: any) => (
  <TouchableOpacity onPress={onPress} style={styles.mainFeaturedCard}>
    <Image 
      source={{ 
        uri: sermon.thumbnail_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=200&fit=crop'
      }}
      style={styles.mainFeaturedImage}
    />
    <View style={styles.mainFeaturedContent}>
      <Text style={styles.mainFeaturedTitle} numberOfLines={2}>
        {sermon.title}
      </Text>
      <Text style={styles.mainFeaturedSpeaker}>{sermon.speaker}</Text>
      <Text style={styles.mainFeaturedDuration}>{sermon.duration}</Text>
    </View>
  </TouchableOpacity>
);

// Grid Sermon Card - For the grid layout below tabs
const GridSermonCard = ({ sermon, onPress }: any) => (
  <TouchableOpacity onPress={onPress} style={styles.gridSermonCard}>
    <Image 
      source={{ 
        uri: sermon.thumbnail_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=120&fit=crop'
      }}
      style={styles.gridSermonImage}
    />
    <View style={styles.gridSermonContent}>
      <Text style={styles.gridSermonTitle} numberOfLines={2}>
        {sermon.title}
      </Text>
      <Text style={styles.gridSermonSpeaker}>{sermon.speaker}</Text>
    </View>
  </TouchableOpacity>
);

// Custom Tab Header - Updated to match reference
const CustomTabHeader = ({ 
  activeTab, 
  onTabPress, 
  isDark 
}: { 
  activeTab: TabType; 
  onTabPress: (tab: TabType) => void;
  isDark: boolean;
}) => {
  const tabs = [
    { key: 'featured', label: 'Featured' },
    { key: 'sermons', label: 'Sermons' },
    { key: 'audio', label: 'Audio' },
  ];

  return (
    <View style={[
      styles.customTabHeader,
      { backgroundColor: isDark ? colors.dark.background : colors.light.background }
    ]}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[
            styles.customTab,
            activeTab === tab.key && {
              borderBottomColor: isDark ? colors.dark.text : colors.light.text,
            },
          ]}
          onPress={() => onTabPress(tab.key as TabType)}
        >
          <Text
            style={[
              styles.customTabText,
              {
                color: activeTab === tab.key 
                  ? isDark ? colors.dark.text : colors.light.text
                  : colors.textGrey,
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

// Featured Tab Content - Grid only since main card is above tabs
const FeaturedContent = ({ navigation }: any) => {
  const { data: videos } = useVideoSermons();
  const { data: audios } = useAudioSermons();
  
  const allSermons = [...(videos || []), ...(audios || [])];

  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Grid of Sermons */}
      <View style={styles.gridSection}>
        <View style={styles.gridContainer}>
          {allSermons.slice(0, 6).map((sermon, index) => (
            <GridSermonCard
              key={`${sermon.id}-${index}`}
              sermon={sermon}
              onPress={() => navigation.navigate('SermonDetail', { 
                sermon, 
                type: videos?.includes(sermon) ? 'video' : 'audio'
              })}
            />
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

// Sermons Tab Content
const SermonsContent = ({ navigation }: any) => {
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
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <SearchBar 
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search sermons..."
      />
      
      <View style={styles.listSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>All Sermons</Text>
          <Text style={styles.countText}>{filteredSermons?.length || 0} sermons</Text>
        </View>
        
        <View style={styles.gridContainer}>
          {filteredSermons?.map((sermon, index) => (
            <GridSermonCard
              key={`${sermon.id}-${index}`}
              sermon={sermon}
              onPress={() => navigation.navigate('SermonDetail', { 
                sermon, 
                type: videos?.includes(sermon) ? 'video' : 'audio'
              })}
            />
          ))}
        </View>

        {(!filteredSermons || filteredSermons.length === 0) && (
          <View style={styles.emptyState}>
            <Icon name="search-off" size={64} color={colors.textGrey} />
            <Text style={styles.emptyStateTitle}>No Sermons Found</Text>
            <Text style={styles.emptyStateText}>
              Try adjusting your search or check back later
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

// Audio Tab Content
const AudioContent = ({ navigation }: any) => {
  const { data: audios, isLoading } = useAudioSermons();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAudios = audios?.filter(audio => 
    audio.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    audio.speaker.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) return <LoadingSpinner />;

  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <SearchBar 
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search audio sermons..."
      />
      
      <View style={styles.listSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Audio Sermons</Text>
          <Text style={styles.countText}>{filteredAudios?.length || 0} audio</Text>
        </View>
        
        <View style={styles.gridContainer}>
          {filteredAudios?.map((audio, index) => (
            <GridSermonCard
              key={`${audio.id}-${index}`}
              sermon={audio}
              onPress={() => navigation.navigate('SermonDetail', { 
                sermon: audio, 
                type: 'audio'
              })}
            />
          ))}
        </View>

        {(!filteredAudios || filteredAudios.length === 0) && (
          <View style={styles.emptyState}>
            <Icon name="headphones-off" size={64} color={colors.textGrey} />
            <Text style={styles.emptyStateTitle}>No Audio Found</Text>
            <Text style={styles.emptyStateText}>
              Try adjusting your search or check back later
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

// Series Tab Content
const SeriesContent = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <ScrollView style={styles.tabContent}>
      <View style={styles.emptyState}>
        <Icon name="playlist-play" size={64} color={colors.textGrey} />
        <Text style={[
          styles.emptyStateTitle,
          { color: isDark ? colors.dark.text : colors.light.text }
        ]}>
          Coming Soon
        </Text>
        <Text style={styles.emptyStateText}>
          Sermon series will be available here
        </Text>
      </View>
    </ScrollView>
  );
};

// Main Sermons Component
const SermonsHome = ({ navigation }: any) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [activeTab, setActiveTab] = useState<TabType>('featured');
  const [refreshing, setRefreshing] = useState(false);
  
  // Get featured sermon for the top card
  const { data: videos } = useVideoSermons();
  const { data: audios } = useAudioSermons();
  const featuredVideo = videos?.find(v => v.is_featured) || videos?.[0];

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'featured':
        return <FeaturedContent navigation={navigation} />;
      case 'sermons':
        return <SermonsContent navigation={navigation} />;
      case 'audio':
        return <AudioContent navigation={navigation} />;
      default:
        return <FeaturedContent navigation={navigation} />;
    }
  };

  return (
    <SafeAreaView style={[
      styles.container,
      { backgroundColor: isDark ? colors.dark.background : colors.light.background }
    ]}>
      {/* Header - Exact match to reference */}
      <View style={styles.header}>
        <Text style={[
          styles.headerTitle,
          { color: isDark ? colors.dark.text : colors.light.text }
        ]}>
          Listen
        </Text>
        <TouchableOpacity style={styles.searchButton}>
          <Octicons name="search" size={24} color={isDark ? colors.dark.text : colors.black} />
        </TouchableOpacity>
      </View>

      {/* Main Featured Card - ABOVE TABS */}
      {featuredVideo && (
        <View style={styles.topFeaturedSection}>
          <MainFeaturedCard
            sermon={featuredVideo}
            onPress={() => navigation.navigate('SermonDetail', { 
              sermon: featuredVideo, 
              type: 'video' 
            })}
          />
        </View>
      )}

      {/* Custom Tab Header */}
      <CustomTabHeader 
        activeTab={activeTab}
        onTabPress={setActiveTab}
        isDark={isDark}
      />

      {/* Tab Content */}
      <View style={styles.contentContainer}>
        {renderContent()}
      </View>
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
  customTabHeader: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.light.border,
  },
  customTab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },

  customTabText: {
    fontSize: 14,
  },
  contentContainer: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  
  // Main Featured Card Styles - NO SHADOWS, CLEAN DESIGN
  topFeaturedSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  featuredSection: {
    marginTop: 20,
    marginBottom: 24,
  },
  mainFeaturedCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  mainFeaturedImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#F5F5F5',
  },
  mainFeaturedContent: {
    padding: 16,
  },
  mainFeaturedTitle: {
    fontSize: 18,
    fontFamily: typography.fonts.poppins.semiBold,
    color: colors.black,
    marginBottom: 4,
  },
  mainFeaturedSpeaker: {
    fontSize: 14,
    fontFamily: typography.fonts.poppins.regular,
    color: colors.textGrey,
    marginBottom: 4,
  },
  mainFeaturedDuration: {
    fontSize: 14,
    fontFamily: typography.fonts.poppins.regular,
    color: colors.textGrey,
  },

  // Grid Layout Styles - NO SHADOWS
  gridSection: {
    marginBottom: 100,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  gridSermonCard: {
    width: (width - 52) / 2, // 20px padding on each side + 12px gap
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },
  gridSermonImage: {
    width: '100%',
    height: 100,
    backgroundColor: '#F5F5F5',
  },
  gridSermonContent: {
    padding: 12,
  },
  gridSermonTitle: {
    fontSize: 14,
    fontFamily: typography.fonts.poppins.medium,
    color: colors.black,
    marginBottom: 4,
    lineHeight: 18,
  },
  gridSermonSpeaker: {
    fontSize: 12,
    fontFamily: typography.fonts.poppins.regular,
    color: colors.textGrey,
  },

  // List Section Styles
  listSection: {
    marginTop: 20,
    paddingBottom: 100,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: typography.fonts.poppins.semiBold,
    color: colors.textPrimary,
  },
  countText: {
    fontSize: 14,
    fontFamily: typography.fonts.poppins.regular,
    color: colors.textGrey,
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
    color: colors.textPrimary,
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

export default SermonsHome;