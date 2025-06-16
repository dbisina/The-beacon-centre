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

  const formatTime = (timeInMinutes: number) => {
    const hours = Math.floor(timeInMinutes / 60);
    const minutes = timeInMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.92}
      style={{ marginBottom: 16 }}
    >
      <Animated.View
        style={[
          styles.card,
          {
            transform: [{ scale: scaleValue }],
            backgroundColor: isDark ? colors.dark.card : colors.light.card,
            borderColor: isDark ? colors.dark.border : colors.light.border,
            shadowColor: isDark ? '#000' : colors.primary,
            shadowOpacity: isDark ? 0.18 : 0.12,
            elevation: 8,
          },
        ]}
      >
        <View style={styles.contentContainer}>
          {showDate && (
            <View style={styles.header}>
              <Text style={[styles.date, { color: colors.textGrey }]}>
                {formatDate(devotional.date)}
              </Text>
              {isRead && (
                <View style={[styles.readBadge, { backgroundColor: colors.success }]}>
                  <Text style={styles.readText}>Read</Text>
                </View>
              )}
            </View>
          )}

          <Text style={[
            styles.title,
            { color: isDark ? colors.dark.text : colors.light.text }
          ]}>
            {devotional.title}
          </Text>

          <Text style={[
            styles.description,
            { color: isDark ? colors.dark.text : colors.textGrey }
          ]} numberOfLines={2}>
            {devotional.content}
          </Text>

          <View style={styles.metaContainer}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Icon name="auto-stories" size={18} color={colors.primary} style={{ marginRight: 6 }} />
              <Text style={[styles.verseReference, { color: colors.primary }]}>{devotional.verse_reference}</Text>
            </View>
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    marginHorizontal: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 24,
    overflow: 'hidden',
  },
  contentContainer: {
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  title: {
    fontFamily: typography.fonts.poppins.bold,
    fontSize: typography.sizes.xl,
    lineHeight: 28,
    letterSpacing: 0.1,
    marginBottom: 10,
  },
  description: {
    fontFamily: typography.fonts.notoSerif.regular,
    fontSize: typography.sizes.medium,
    lineHeight: 22,
    marginBottom: 18,
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.light.border,
  },
  date: {
    fontFamily: typography.fonts.poppins.medium,
    fontSize: typography.sizes.small,
  },
  readBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readText: {
    fontFamily: typography.fonts.poppins.medium,
    fontSize: typography.sizes.xs,
    color: '#fff',
    letterSpacing: 0.2,
  },
  verseReference: {
    fontFamily: typography.fonts.poppins.medium,
    fontSize: typography.sizes.small,
  },
});

export default DevotionalCard;