// src/components/devotional/DevotionalCard.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Devotional } from '@/types/api';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { useApp } from '@/context/AppContext';

interface DevotionalCardProps {
  devotional: Devotional;
  onPress: () => void;
  isRead?: boolean;
  showDate?: boolean;
}

const DevotionalCard: React.FC<DevotionalCardProps> = ({
  devotional,
  onPress,
  isRead = false,
  showDate = true,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const scaleValue = new Animated.Value(1);

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.9}
    >
      <Animated.View
        style={[
          styles.card,
          {
            backgroundColor: isDark ? colors.dark.card : colors.light.card,
            borderColor: isDark ? colors.dark.border : colors.light.border,
            transform: [{ scale: scaleValue }],
          },
        ]}
      >
        {showDate && (
          <View style={styles.dateHeader}>
            <Text style={[
              styles.dateText,
              { color: isDark ? colors.dark.text : colors.primary }
            ]}>
              {formatDate(devotional.date)}
            </Text>
            {isRead && (
              <Icon name="check-circle" size={20} color={colors.success} />
            )}
          </View>
        )}

        <Text style={[
          styles.title,
          { color: isDark ? colors.dark.text : colors.light.text }
        ]}>
          {devotional.title}
        </Text>

        <View style={styles.verseContainer}>
          <Text style={[
            styles.verseReference,
            { color: colors.primary }
          ]}>
            {devotional.verse_reference}
          </Text>
          <Text style={[
            styles.verseText,
            { color: isDark ? colors.dark.text : colors.textGrey }
          ]} numberOfLines={3}>
            "{devotional.verse_text}"
          </Text>
        </View>

        <Text style={[
          styles.preview,
          { color: isDark ? colors.dark.text : colors.textGrey }
        ]} numberOfLines={2}>
          {devotional.content.substring(0, 120)}...
        </Text>

        <View style={styles.footer}>
          <Text style={[
            styles.readMore,
            { color: colors.primary }
          ]}>
            Read More
          </Text>
          <Icon name="arrow-forward" size={16} color={colors.primary} />
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateText: {
    fontFamily: typography.fonts.poppins.medium,
    fontSize: typography.sizes.medium,
  },
  title: {
    fontFamily: typography.fonts.poppins.bold,
    fontSize: typography.sizes.large,
    marginBottom: 12,
    lineHeight: 24,
  },
  verseContainer: {
    marginBottom: 12,
    paddingLeft: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  verseReference: {
    fontFamily: typography.fonts.poppins.medium,
    fontSize: typography.sizes.small,
    marginBottom: 4,
  },
  verseText: {
    fontFamily: typography.fonts.notoSerif.regular,
    fontSize: typography.sizes.medium,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  preview: {
    fontFamily: typography.fonts.notoSerif.regular,
    fontSize: typography.sizes.medium,
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  readMore: {
    fontFamily: typography.fonts.poppins.medium,
    fontSize: typography.sizes.medium,
    marginRight: 4,
  },
});

export default DevotionalCard;