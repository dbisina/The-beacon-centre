// src/components/audio/PlaylistManager.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  useColorScheme,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { AudioSermon } from '@/types/api';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { colors, typography } from '@/constants';
import { formatDuration } from '@/utils/dateUtils';

interface PlaylistManagerProps {
  visible: boolean;
  onClose: () => void;
}

export default function PlaylistManager({ visible, onClose }: PlaylistManagerProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const {
    queue,
    currentIndex,
    playQueue,
    skipToNext,
    skipToPrevious,
  } = useAudioPlayer();

  const [isReordering, setIsReordering] = useState(false);

  if (!visible || queue.length === 0) {
    return null;
  }

  const handlePlayItem = async (index: number) => {
    try {
      await playQueue(queue, index);
    } catch (error) {
      Alert.alert('Error', 'Failed to play item');
    }
  };

  const handleRemoveItem = (index: number) => {
    Alert.alert(
      'Remove from Queue',
      'Are you sure you want to remove this item from the queue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => {
            // Implementation would remove item from queue
            console.log('Remove item at index:', index);
          }
        },
      ]
    );
  };

  const renderQueueItem = ({ item, index }: { item: AudioSermon; index: number }) => {
    const isCurrentTrack = index === currentIndex;
    
    return (
      <TouchableOpacity
        style={[
          styles.queueItem,
          {
            backgroundColor: isCurrentTrack 
              ? colors.primary + '20' 
              : (isDark ? colors.dark.card : colors.light.card),
            borderLeftColor: isCurrentTrack ? colors.primary : 'transparent',
          }
        ]}
        onPress={() => handlePlayItem(index)}
      >
        <View style={styles.queueItemLeft}>
          <Text style={[
            styles.queueIndex,
            { 
              color: isCurrentTrack ? colors.primary : colors.textGrey,
              fontWeight: isCurrentTrack ? 'bold' : 'normal',
            }
          ]}>
            {index + 1}
          </Text>
          
          <View style={styles.queueItemInfo}>
            <Text style={[
              styles.queueItemTitle,
              { 
                color: isCurrentTrack ? colors.primary : (isDark ? colors.dark.text : colors.light.text),
                fontWeight: isCurrentTrack ? 'bold' : 'normal',
              }
            ]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={[
              styles.queueItemArtist,
              { color: colors.textGrey }
            ]} numberOfLines={1}>
              {item.speaker} • {item.duration || '00:00'}
            </Text>
          </View>
        </View>

        <View style={styles.queueItemRight}>
          {isCurrentTrack && (
            <Icon name="graphic-eq" size={20} color={colors.primary} />
          )}
          
          {!isReordering && (
            <TouchableOpacity
              onPress={() => handleRemoveItem(index)}
              style={styles.removeButton}
            >
              <Icon name="close" size={18} color={colors.textGrey} />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[
      styles.container,
      { backgroundColor: isDark ? colors.dark.background : colors.light.background }
    ]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[
            styles.headerTitle,
            { color: isDark ? colors.dark.text : colors.light.text }
          ]}>
            Queue ({queue.length})
          </Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={() => setIsReordering(!isReordering)}
            style={styles.headerButton}
          >
            <Icon 
              name={isReordering ? "check" : "reorder"} 
              size={20} 
              color={colors.primary} 
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Icon name="close" size={20} color={colors.textGrey} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, { borderColor: colors.primary }]}
          onPress={() => {
            // Shuffle queue implementation
            console.log('Shuffle queue');
          }}
        >
          <Icon name="shuffle" size={16} color={colors.primary} />
          <Text style={[styles.actionText, { color: colors.primary }]}>
            Shuffle
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { borderColor: colors.red }]}
          onPress={() => {
            Alert.alert(
              'Clear Queue',
              'Are you sure you want to clear the entire queue?',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Clear', 
                  style: 'destructive',
                  onPress: () => {
                    // Clear queue implementation
                    console.log('Clear queue');
                  }
                },
              ]
            );
          }}
        >
          <Icon name="clear-all" size={16} color={colors.red} />
          <Text style={[styles.actionText, { color: colors.red }]}>
            Clear All
          </Text>
        </TouchableOpacity>
      </View>

      {/* Queue List */}
      <FlatList
        data={queue}
        renderItem={renderQueueItem}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        style={styles.queueList}
        showsVerticalScrollIndicator={false}
      />
    </View>
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
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: typography.fonts.poppins.bold,
    fontSize: typography.sizes.lg,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    marginLeft: 16,
    padding: 4,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 20,
  },
  actionText: {
    fontFamily: typography.fonts.poppins.medium,
    fontSize: typography.sizes.sm,
    marginLeft: 4,
  },
  queueList: {
    flex: 1,
  },
  queueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderLeftWidth: 3,
  },
  queueItemLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  queueIndex: {
    fontFamily: typography.fonts.poppins.medium,
    fontSize: typography.sizes.base,
    marginRight: 12,
    minWidth: 24,
    textAlign: 'center',
  },
  queueItemInfo: {
    flex: 1,
  },
  queueItemTitle: {
    fontFamily: typography.fonts.poppins.medium,
    fontSize: typography.sizes.base,
    marginBottom: 2,
  },
  queueItemArtist: {
    fontFamily: typography.fonts.poppins.regular,
    fontSize: typography.sizes.sm,
  },
  queueItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  removeButton: {
    marginLeft: 8,
    padding: 4,
  },
});