// src/components/devotional/ReadingProgress.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  useColorScheme,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, typography } from '@/constants';

interface ReadingProgressProps {
  progress: number; // 0-100
  timeSpent: number; // seconds
  estimatedReadTime: number; // seconds
  showDetails?: boolean;
}

export default function ReadingProgress({
  progress,
  timeSpent,
  estimatedReadTime,
  showDetails = true,
}: ReadingProgressProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [animatedProgress] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: progress,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const getProgressColor = (progress: number): string => {
    if (progress < 25) return colors.red;
    if (progress < 50) return colors.yellow;
    if (progress < 75) return colors.blue;
    return colors.success;
  };

  const progressColor = getProgressColor(progress);

  return (
    <View style={[
      styles.container,
      { backgroundColor: isDark ? colors.dark.card : colors.light.card }
    ]}>
      {/* Progress Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Icon 
            name="auto-stories" 
            size={20} 
            color={progressColor} 
          />
          <Text style={[
            styles.headerTitle,
            { color: isDark ? colors.dark.text : colors.light.text }
          ]}>
            Reading Progress
          </Text>
        </View>
        
        <Text style={[
          styles.progressText,
          { color: progressColor }
        ]}>
          {Math.round(progress)}%
        </Text>
      </View>

      {/* Progress Bar */}
      <View style={[
        styles.progressBarContainer,
        { backgroundColor: isDark ? colors.dark.border : colors.light.border }
      ]}>
        <Animated.View
          style={[
            styles.progressBar,
            {
              backgroundColor: progressColor,
              width: animatedProgress.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
                extrapolate: 'clamp',
              }),
            },
          ]}
        />
      </View>

      {/* Progress Details */}
      {showDetails && (
        <View style={styles.details}>
          <View style={styles.detailItem}>
            <Icon name="schedule" size={16} color={colors.textGrey} />
            <Text style={[styles.detailText, { color: colors.textGrey }]}>
              {formatTime(timeSpent)} spent
            </Text>
          </View>
          
          <View style={styles.detailItem}>
            <Icon name="timer" size={16} color={colors.textGrey} />
            <Text style={[styles.detailText, { color: colors.textGrey }]}>
              ~{formatTime(estimatedReadTime - timeSpent)} left
            </Text>
          </View>
        </View>
      )}

      {/* Completion Status */}
      {progress >= 100 && (
        <View style={styles.completionBadge}>
          <Icon name="check-circle" size={16} color={colors.success} />
          <Text style={[styles.completionText, { color: colors.success }]}>
            Completed!
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: typography.fonts.poppins.medium,
    fontSize: typography.sizes.medium,
    marginLeft: 8,
  },
  progressText: {
    fontFamily: typography.fonts.poppins.bold,
    fontSize: typography.sizes.medium,
  },
  progressBarContainer: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontFamily: typography.fonts.poppins.regular,
    fontSize: typography.sizes.small,
    marginLeft: 4,
  },
  completionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.success,
  },
  completionText: {
    fontFamily: typography.fonts.poppins.medium,
    fontSize: typography.sizes.small,
    marginLeft: 4,
  },
});