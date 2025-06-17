// src/screens/sermons/AudioSermons.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  useColorScheme,
  TouchableOpacity,
  Text,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useAudioSermons, useFeaturedContent } from '@/hooks/api';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { colors, typography } from '@/constants';
import { AudioSermon } from '@/types/api';
import { SermonsStackParamList } from '@/types/navigation';
import SearchBar from '@/components/search/SearchBar';
import RefreshControl from '@/components/common/RefreshControl';
import LoadingSpinner from '@/components/common/LoadingSpinner';

type NavigationProp = StackNavigationProp<SermonsStackParamList, 'SermonDetail'>;

// Audio Sermon Card Component
const AudioSermonCard = ({ 
  sermon, 
  onPress, 
  onPlay, 
  isFavorite, 
  onToggleFavorite,
  isDownloaded,
}: {
  sermon: AudioSermon;
  onPress: () => void;
  onPlay: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  isDownloaded: boolean;
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <TouchableOpacity
      style={[
        styles.sermonCard,
        {
          backgroundColor: isDark ? colors.dark.card : colors.light.card,
          borderColor: isDark ? colors.dark.border : colors.light.border,
        }
      ]}
      onPress={onPress}
    >
      <View style={styles.sermonContent}>
        <View style={styles.sermonHeader}>
          <Text style={[
            styles.sermonTitle,
            { color: isDark ? colors.dark.text : colors.light.text }
          ]} numberOfLines={2}>
            {sermon.title}
          </Text>
          
          <View style={styles.sermonActions}>
            {isDownloaded && (
              <Icon name="download-done" size={18} color={colors.success} />
            )}
            <TouchableOpacity onPress={onToggleFavorite} style={styles.favoriteButton}>
              <Icon
                name={isFavorite ? 'favorite' : 'favorite-border'}
                size={20}
                color={isFavorite ? colors.red : colors.textGrey}
              />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={[styles.sermonSpeaker, { color: colors.primary }]}>
          {sermon.speaker}
        </Text>

        <View style={styles.sermonMeta}>
          {sermon.sermon_date && (
            <Text style={[styles.sermonDate, { color: colors.textGrey }]}>
              {new Date(sermon.sermon_date).toLocaleDateString()}
            </Text>
          )}
          {sermon.duration && (
            <Text style={[styles.sermonDuration, { color: colors.textGrey }]}>
              {sermon.duration}
            </Text>
          )}
        </View>

        {sermon.description && (
          <Text style={[
            styles.sermonDescription,
            { color: colors.textGrey }
          ]} numberOfLines={2}>
            {sermon.description}
          </Text>
        )}

        {sermon.category && (
          <View style={styles.categoryContainer}>
            <Text style={[styles.category, { color: colors.blue }]}>
              {sermon.category}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.playButton, { backgroundColor: colors.primary }]}
          onPress={onPlay}
        >
          <Icon name="play-arrow" size={20} color="#fff" />
          <Text style={styles.playButtonText}>Play Now</Text>
        </TouchableOpacity>
      </View>

      {sermon.is_featured && (
        <View style={styles.featuredBadge}>
          <Text style={styles.featuredText}>Featured</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default function AudioSermons() {
  const navigation = useNavigation<NavigationProp>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { data: allSermons, isLoading, refetch } = useAudioSermons();
  const { data: featuredContent } = useFeaturedContent();
  const { userData, addFavorite, removeFavorite } = useLocalStorage();
  const { playSermon } = useAudioPlayer();

  const [searchQuery, setSearchQuery] = useState('');
  const [favoriteAudio, setFavoriteAudio] = useState<number[]>([]);
  const [downloadedAudio, setDownloadedAudio] = useState<number[]>([]);

  useEffect(() => {
    if (userData) {
      setFavoriteAudio(userData.favoriteAudioSermons);
      setDownloadedAudio(userData.downloadedAudio.map(item => item.sermonId));
    }
  }, [userData]);

  const filteredSermons = (allSermons as AudioSermon[] | undefined)?.filter(sermon =>
    sermon.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sermon.speaker.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sermon.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sermon.category?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleSermonPress = (sermon: AudioSermon) => {
    navigation.navigate('SermonDetail', { sermon, type: 'audio' });
  };

  const handlePlaySermon = async (sermon: AudioSermon) => {
    try {
      await playSermon(sermon);
    } catch (error) {
      console.error('Failed to play sermon:', error);
    }
  };

  const handleToggleFavorite = async (sermonId: number) => {
    const isFavorite = favoriteAudio.includes(sermonId);
    
    try {
      if (isFavorite) {
        await removeFavorite('audio', sermonId);
        setFavoriteAudio(prev => prev.filter(id => id !== sermonId));
      } else {
        await addFavorite('audio', sermonId);
        setFavoriteAudio(prev => [...prev, sermonId]);
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const renderSermon = ({ item }: { item: AudioSermon }) => (
    <AudioSermonCard
      sermon={item}
      onPress={() => handleSermonPress(item)}
      onPlay={() => handlePlaySermon(item)}
      isFavorite={favoriteAudio.includes(item.id)}
      onToggleFavorite={() => handleToggleFavorite(item.id)}
      isDownloaded={downloadedAudio.includes(item.id)}
    />
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search audio sermons..."
      />
      
      {/* Featured Audio */}
      {(featuredContent as any)?.audio?.length > 0 && !searchQuery && (
        <View style={styles.section}>
          <Text style={[
            styles.sectionTitle,
            { color: isDark ? colors.dark.text : colors.light.text }
          ]}>
            Featured Audio
          </Text>
        </View>
      )}
    </View>
  );

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <View style={[
      styles.container,
      { backgroundColor: isDark ? colors.dark.background : colors.light.background }
    ]}>
      <FlatList
        data={filteredSermons}
        renderItem={renderSermon}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={refetch} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontFamily: typography.fonts.poppins.bold,
    fontSize: typography.sizes.lg,
    marginBottom: 8,
  },
  listContent: {
    paddingBottom: 20,
  },
  sermonCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
  },
  sermonContent: {
    padding: 16,
  },
  sermonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  sermonTitle: {
    flex: 1,
    fontFamily: typography.fonts.poppins.bold,
    fontSize: typography.sizes.sm,
    lineHeight: 20,
    marginRight: 12,
  },
  sermonActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  favoriteButton: {
    marginLeft: 8,
    padding: 4,
  },
  sermonSpeaker: {
    fontFamily: typography.fonts.poppins.medium,
    fontSize: typography.sizes.sm,
    marginBottom: 8,
  },
  sermonMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sermonDate: {
    fontFamily: typography.fonts.poppins.regular,
    fontSize: typography.sizes.sm,
  },
  sermonDuration: {
    fontFamily: typography.fonts.poppins.regular,
    fontSize: typography.sizes.sm,
  },
  sermonDescription: {
    fontFamily: typography.fonts.notoSerif.regular,
    fontSize: typography.sizes.sm,
    lineHeight: 18,
    marginBottom: 12,
  },
  categoryContainer: {
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  category: {
    fontFamily: typography.fonts.poppins.medium,
    fontSize: typography.sizes.sm,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  playButtonText: {
    fontFamily: typography.fonts.poppins.medium,
    fontSize: typography.sizes.sm,
    color: '#fff',
    marginLeft: 4,
  },
  featuredBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: colors.yellow,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  featuredText: {
    fontFamily: typography.fonts.poppins.medium,
    fontSize: typography.sizes.sm,
    color: '#fff',
  },
});
