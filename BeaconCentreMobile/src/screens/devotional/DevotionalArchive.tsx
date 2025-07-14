// BeaconCentreMobile/src/screens/devotional/DevotionalArchive.tsx - FULLY OPTIMIZED
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  useColorScheme,
  VirtualizedList,
  ListRenderItem,
  RefreshControl as RNRefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import Icon from 'react-native-vector-icons/MaterialIcons';

import { useDevotionals, useRefreshAllDevotionalData } from '@/hooks/useDevotionals';
import { useUserData } from '@/context/AppContext';
import { colors, typography } from '@/constants';
import { formatDate, isToday, isThisWeek } from '@/utils/dateUtils';
import DevotionalCard from '@/components/devotional/DevotionalCard';
import SearchBar from '@/components/search/SearchBar';
import RefreshControl from '@/components/common/RefreshControl';
import LoadingSpinner from '@/components/common/LoadingSpinner';

import ErrorBoundary from '@/components/common/ErrorBoundary';

// Types
interface Devotional {
  id: number;
  title: string;
  content: string;
  verse_reference: string;
  verse_text: string;
  date: string;
  created_at: string;
  updated_at: string;
}

type DevotionalStackParamList = {
  DevotionalDetail: { devotional: Devotional };
};

type NavigationProp = StackNavigationProp<DevotionalStackParamList, 'DevotionalDetail'>;

// Optimized DevotionalCard component with memo
const OptimizedDevotionalCard = React.memo<{
  devotional: Devotional;
  onPress: (devotional: Devotional) => void;
  isRead: boolean;
  showDate: boolean;
}>(({ devotional, onPress, isRead, showDate }) => {
  const handlePress = useCallback(() => {
    onPress(devotional);
  }, [devotional, onPress]);

  return (
    <DevotionalCard
      devotional={devotional}
      onPress={handlePress}
      isRead={isRead}
      showDate={showDate}
    />
  );
});

// Filter functions
const filterDevotionals = (
  devotionals: Devotional[],
  searchQuery: string,
  filterMode: 'all' | 'read' | 'unread',
  readDevotionals: number[]
) => {
  let filtered = devotionals;

  // Apply search filter
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(devotional =>
      devotional.title.toLowerCase().includes(query) ||
      devotional.content.toLowerCase().includes(query) ||
      devotional.verse_reference.toLowerCase().includes(query) ||
      devotional.verse_text.toLowerCase().includes(query)
    );
  }

  // Apply read/unread filter
  if (filterMode !== 'all') {
    filtered = filtered.filter(devotional => {
      const isRead = readDevotionals.includes(devotional.id);
      return filterMode === 'read' ? isRead : !isRead;
    });
  }

  // Sort by date (newest first)
  return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

// Main Component
export default function DevotionalArchive() {
  const navigation = useNavigation<NavigationProp>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Hooks
  const { 
    devotionals, 
    isLoading, 
    isRefreshing,
    error,
    refresh,
    isEmpty 
  } = useDevotionals();
  
  const { userData } = useUserData();
  const refreshAllData = useRefreshAllDevotionalData();
  
  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'read' | 'unread'>('all');
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  
  // Refs for performance
  const listRef = useRef<FlatList>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Optimized filtered data with memoization
  const filteredDevotionals = useMemo(() => {
    if (!devotionals || !Array.isArray(devotionals)) {
      return [];
    }

    const readDevotionals = userData?.readDevotionals || [];
    return filterDevotionals(devotionals, searchQuery, filterMode, readDevotionals);
  }, [devotionals, searchQuery, filterMode, userData?.readDevotionals]);

  // Debounced search
  const handleSearchChange = useCallback((query: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setSearchQuery(query);
    }, 300); // 300ms debounce
  }, []);

  // Cleanup search timeout
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Navigation handler
  const handleDevotionalPress = useCallback((devotional: Devotional) => {
    navigation.navigate('DevotionalDetail', { devotional });
  }, [navigation]);

  // Filter handler
  const handleFilterChange = useCallback((filter: 'all' | 'read' | 'unread') => {
    setFilterMode(filter);
    
    // Scroll to top when filter changes
    if (listRef.current) {
      listRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  }, []);

  // Manual refresh handler
  const handleRefresh = useCallback(async () => {
    try {
      setIsManualRefreshing(true);
      console.log('🔄 Manual refresh triggered in DevotionalArchive');
      
      await Promise.all([
        refresh(),
        refreshAllData(),
      ]);
      
      console.log('✅ Manual refresh completed');
    } catch (error) {
      console.error('❌ Manual refresh failed:', error);
    } finally {
      setIsManualRefreshing(false);
    }
  }, [refresh, refreshAllData]);

  // Render item with optimization
  const renderDevotional: ListRenderItem<Devotional> = useCallback(({ item }) => {
    const isRead = userData?.readDevotionals.includes(item.id) || false;
    
    return (
      <OptimizedDevotionalCard
        devotional={item}
        onPress={handleDevotionalPress}
        isRead={isRead}
        showDate={true}
      />
    );
  }, [handleDevotionalPress, userData?.readDevotionals]);

  // Key extractor
  const keyExtractor = useCallback((item: Devotional) => item.id.toString(), []);

  // Get item layout for performance (if using fixed height cards)
  const getItemLayout = useCallback((data: any, index: number) => ({
    length: 120, // Approximate height of DevotionalCard
    offset: 120 * index,
    index,
  }), []);

  // Header component
  const ListHeaderComponent = useMemo(() => (
    <View style={styles.header}>
      <SearchBar
        value={searchQuery}
        onChangeText={handleSearchChange}
        placeholder="Search devotionals..."
      />
      
      <View style={styles.filters}>
        {(['all', 'unread', 'read'] as const).map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterButton,
              {
                backgroundColor: filterMode === filter ? colors.primary : 'transparent',
                borderColor: colors.primary,
              }
            ]}
            onPress={() => handleFilterChange(filter)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.filterButtonText,
              { 
                color: filterMode === filter ? '#fff' : colors.primary 
              }
            ]}>
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Stats */}
      <View style={styles.stats}>
        <Text style={[styles.statsText, { color: colors.textGrey }]}>
          {filteredDevotionals.length} devotional{filteredDevotionals.length !== 1 ? 's' : ''}
          {searchQuery ? ` found` : ''}
        </Text>
      </View>
    </View>
  ), [handleSearchChange, filterMode, handleFilterChange, filteredDevotionals.length, searchQuery]);

  // Empty state component
  const ListEmptyComponent = useMemo(() => {
    if (isLoading) {
      return <LoadingSpinner />;
    }

    if (error) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>Unable to load devotionals</Text>
          <Text style={styles.emptyStateDescription}>Please check your connection and try again</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (isEmpty) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>No devotionals found</Text>
          <Text style={styles.emptyStateDescription}>
            {searchQuery ? "Try adjusting your search terms" : "New devotionals will appear here"}
          </Text>
        </View>
      );
    }

    return null;
  }, [isLoading, error, isEmpty, searchQuery, handleRefresh]);

  // Auto-refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('📱 DevotionalArchive screen focused');
      // Light refresh without loading state
      refresh();
    }, [refresh])
  );

  // Render loading state
  if (isLoading && !devotionals?.length) {
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
    <ErrorBoundary>
      <SafeAreaView style={[
        styles.container,
        { backgroundColor: isDark ? colors.dark.background : colors.light.background }
      ]}>
        <FlatList
          ref={listRef}
          data={filteredDevotionals}
          renderItem={renderDevotional}
          keyExtractor={keyExtractor}
          ListHeaderComponent={ListHeaderComponent}
          ListEmptyComponent={ListEmptyComponent}
          
          // Performance optimizations
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={8}
          updateCellsBatchingPeriod={50}
          
          // Refresh control
          refreshControl={
            <RefreshControl
              refreshing={isManualRefreshing || isRefreshing}
              onRefresh={handleRefresh}
              title="Pull to refresh devotionals"
            />
          }
          
          // Styling
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.listContent,
            filteredDevotionals.length === 0 && styles.emptyListContent
          ]}
          
          // Accessibility
          accessible={true}
          accessibilityLabel="Devotionals list"
          accessibilityHint="Swipe to navigate through devotionals"
        />
      </SafeAreaView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  filters: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterButtonText: {
    fontFamily: typography.fonts.poppins.medium,
    fontSize: typography.sizes.sm,
  },
  stats: {
    marginTop: 8,
    alignItems: 'center',
  },
  statsText: {
    fontFamily: typography.fonts.poppins.regular,
    fontSize: typography.sizes.xs,
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateTitle: {
    fontFamily: typography.fonts.poppins.semiBold,
    fontSize: typography.sizes.lg,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontFamily: typography.fonts.poppins.regular,
    fontSize: typography.sizes.base,
    color: colors.textGrey,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    fontFamily: typography.fonts.poppins.medium,
    fontSize: typography.sizes.sm,
    color: '#fff',
  },
});
