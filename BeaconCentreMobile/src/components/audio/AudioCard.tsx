import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, useColorScheme } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { AudioSermon } from '@/types/api';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';

interface AudioCardProps {
  sermon: AudioSermon;
  onPress: () => void;
  isFavorite?: boolean;
}

const AudioCard = ({ sermon, onPress, isFavorite = false }: AudioCardProps) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Debug log
  console.log('AudioCard sermon object:', sermon);

  return (
    <TouchableOpacity style={[
      styles.container,
      { backgroundColor: isDark ? colors.dark.card : colors.light.card }
    ]} onPress={onPress}>
      <View style={styles.content}>
        <View style={styles.thumbnailContainer}>
          {(sermon.thumbnail_url || sermon.thumbnailUrl) ? (
            <Image
              source={{ uri: sermon.thumbnail_url || sermon.thumbnailUrl }}
              style={styles.audioThumbnail}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.audioThumbnail}>
              <Icon name="audiotrack" size={48} color={colors.primary} />
            </View>
          )}
        </View>
        <View style={styles.info}>
          <Text style={[
            styles.title,
            { color: isDark ? colors.dark.text : colors.light.text }
          ]} numberOfLines={2}>{sermon.title}</Text>
          <Text style={[styles.speaker, { color: colors.textGrey }]}>{sermon.speaker}</Text>
          {sermon.duration && (
            <Text style={[styles.duration, { color: colors.textGrey }]}>
              {sermon.duration}
            </Text>
          )}
        </View>
        <Icon 
          name={isFavorite ? 'favorite' : 'favorite-border'} 
          size={24} 
          color={isFavorite ? colors.red : colors.textGrey} 
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.light.card,
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    elevation: 2,
    shadowColor: colors.textGrey,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbnailContainer: {
    marginRight: 16,
  },
  audioThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: colors.light.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  info: {
    flex: 1,
    marginRight: 16,
  },
  title: {
    fontFamily: typography.fonts.poppins.medium,
    fontSize: typography.sizes.base,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  speaker: {
    fontFamily: typography.fonts.notoSerif.regular,
    fontSize: typography.sizes.sm,
    color: colors.textGrey,
    marginBottom: 2,
  },
  duration: {
    fontFamily: typography.fonts.poppins.regular,
    fontSize: typography.sizes.xs,
    color: colors.textGrey,
  },
});

export default AudioCard; 