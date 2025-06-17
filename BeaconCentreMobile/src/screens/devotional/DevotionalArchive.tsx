// src/screens/devotional/DevotionalArchive.tsx
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useDevotionals } from '@/hooks/useDevotionals';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { colors, typography } from '@/constants';
import { formatDate, isToday, isThisWeek } from '@/utils/dateUtils';
import DevotionalCard from '@/components/devotional/DevotionalCard';
import SearchBar from '@/components/search/SearchBar';
import RefreshControl from '@/components/common/RefreshControl';
import LoadingSpinner from '@/components/common/LoadingSpinner';

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

export default function DevotionalArchive() {
  const navigation = useNavigation<NavigationProp>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const { data: devotionals, isLoading, refetch } = useDevotionals();
  const { userData } = useLocalStorage();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'read' | 'unread'>('all');

  const filteredDevotionals = useMemo(() => {
    if (!devotionals) return [];

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
    if (filterMode !== 'all' && userData) {
      filtered = filtered.filter(devotional => {
        const isRead = userData.readDevotionals.includes(devotional.id);
        return filterMode === 'read' ? isRead : !isRead;
      });
    }

    // Sort by date (newest first)
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [devotionals, searchQuery, filterMode, userData]);

  const handleDevotionalPress = (devotional: Devotional) => {
    navigation.navigate('DevotionalDetail', { devotional });
  };

  const renderDevotional = ({ item }: { item: Devotional }) => {
    const isRead = userData?.readDevotionals.includes(item.id) || false;
    
    return (
      <DevotionalCard
        devotional={item}
        onPress={() => handleDevotionalPress(item)}
        isRead={isRead}
        showDate={true}
      />
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
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
            onPress={() => setFilterMode(filter)}
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
    </View>
  );

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <SafeAreaView style={[
      styles.container,
      { backgroundColor: isDark ? colors.dark.background : colors.light.background }
    ]}>
      <FlatList
        data={filteredDevotionals}
        renderItem={renderDevotional}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={refetch} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
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
  listContent: {
    paddingBottom: 20,
  },
});