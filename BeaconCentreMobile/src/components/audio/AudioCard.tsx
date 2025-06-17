import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
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
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.content}>
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={2}>{sermon.title}</Text>
          <Text style={styles.speaker}>{sermon.speaker}</Text>
        </View>
        <Icon 
          name={isFavorite ? 'favorite' : 'favorite-border'} 
          size={24} 
          color={colors.primary} 
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.light.card,
    borderRadius: 8,
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
    justifyContent: 'space-between',
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
  },
});

export default AudioCard; 