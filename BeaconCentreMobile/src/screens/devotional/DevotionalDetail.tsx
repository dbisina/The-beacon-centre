// src/screens/devotional/DevotionalDetail.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Share,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import { DevotionalStackParamList } from '@/types/navigation';
import { colors, typography } from '@/constants';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { analyticsApi } from '@/services/api/analytics';
import { formatDate } from '@/utils/dateUtils';
import { readingTime } from '@/utils/textUtils';
import ReadingProgress from '@/components/devotional/ReadingProgress';
import RefreshControl from '@/components/common/RefreshControl';

import Svg, { Circle } from 'react-native-svg';
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type DevotionalDetailRouteProp = RouteProp<DevotionalStackParamList, 'DevotionalDetail'>;

export default function DevotionalDetail() {
  const navigation = useNavigation();
  const route = useRoute<DevotionalDetailRouteProp>();
  const { devotional } = route.params;
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { width, height } = Dimensions.get('window');

  const { userData, markDevotionalRead, addFavorite, removeFavorite } = useLocalStorage();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isRead, setIsRead] = useState(false);
  const [readingStartTime, setReadingStartTime] = useState<Date | null>(null);
  const [timeSpent, setTimeSpent] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showFab, setShowFab] = useState(false);
  const scrollY = useState(new Animated.Value(0))[0];

  useEffect(() => {
    if (userData) {
      setIsFavorite(userData.favoriteDevotionals.includes(devotional.id));
      setIsRead(userData.readDevotionals.includes(devotional.id));
    }
  }, [userData, devotional.id]);

  useEffect(() => {
    setReadingStartTime(new Date());
    return () => {
      if (readingStartTime) {
        const timeSpentReading = Math.floor((new Date().getTime() - readingStartTime.getTime()) / 1000);
        if (timeSpentReading > 30) {
          setTimeSpent(timeSpentReading);
        }
      }
    };
  }, []);

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: false,
      listener: (event: { nativeEvent: { contentOffset: { y: number }, contentSize: { height: number }, layoutMeasurement: { height: number } } }) => {
        const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
        const progress = (contentOffset.y / (contentSize.height - layoutMeasurement.height)) * 100;
        setScrollProgress(Math.min(100, Math.max(0, progress)));
        setShowFab(contentOffset.y > 80); // Show FAB after scrolling 80px
      },
    }
  );

  const estimatedReadTime = readingTime(devotional.content + (devotional.prayer || '')) * 60;

  // Animated FAB style
  const fabTranslate = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [120, 0],
    extrapolate: 'clamp',
  });
  const fabOpacity = scrollY.interpolate({
    inputRange: [60, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? colors.dark.background : colors.light.background }}>
      {/* Modern Header with Hero Verse */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingTop: 8, paddingBottom: 0, backgroundColor: isDark ? colors.dark.background : '#fff', borderBottomWidth: 0, elevation: 0 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
          <Icon name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ backgroundColor: colors.primary + '10', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 8, alignItems: 'center', maxWidth: width * 0.7 }}>
            <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 15, textAlign: 'center' }}>{devotional.verse_reference}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity style={{ padding: 8 }}>
            <Icon name="share" size={22} color={colors.textGrey} />
          </TouchableOpacity>
          <TouchableOpacity style={{ padding: 8 }}>
            <Icon name={isFavorite ? 'favorite' : 'favorite-border'} size={22} color={isFavorite ? colors.red : colors.textGrey} />
          </TouchableOpacity>
        </View>
      </View>
      {/* Main Content */}
      <Animated.ScrollView
        style={{ flex: 1, paddingHorizontal: 20 }}
        contentContainerStyle={{ paddingVertical: 32, paddingBottom: 120 }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {/* Memory Verse */}
        <View style={{ backgroundColor: colors.primary + '15', borderRadius: 16, padding: 18, marginBottom: 24, alignItems: 'center' }}>
          <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 15, marginBottom: 6 }}>Memory Verse</Text>
          <Text style={{ color: isDark ? colors.dark.text : colors.light.text, fontStyle: 'italic', fontSize: 16, textAlign: 'center', fontFamily: typography.fonts.notoSerif.regular }}>
            "{devotional.verse_text}"
          </Text>
        </View>
        {/* Content with paragraphs */}
        <View style={{ backgroundColor: isDark ? colors.dark.card : '#fff', borderRadius: 18, padding: 20, marginBottom: 24, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
          {devotional.content
            .split(/\n\n|(?<=\.)\s*\n/)
            .filter(Boolean)
            .map((para, idx) => (
              <Text
                key={idx}
                style={{ color: isDark ? colors.dark.text : colors.light.text, fontSize: 17, lineHeight: 28, fontFamily: typography.fonts.notoSerif.regular, marginBottom: 16 }}
              >
                {para.trim()}
              </Text>
            ))}
        </View>
        {/* Prayer */}
        {devotional.prayer && (
          <View style={{ backgroundColor: colors.blue + '10', borderRadius: 16, padding: 18, marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Icon name="favorite" size={20} color={colors.blue} />
              <Text style={{ color: colors.blue, fontWeight: 'bold', fontSize: 16, marginLeft: 8 }}>Prayer</Text>
            </View>
            <Text style={{ color: isDark ? colors.dark.text : colors.light.text, fontSize: 16, fontFamily: typography.fonts.notoSerif.regular }}>{devotional.prayer}</Text>
          </View>
        )}
      </Animated.ScrollView>
      {/* Floating Circular Reading Progress */}
      <Animated.View
        style={{
          position: 'absolute',
          bottom: 32,
          right: 24,
          zIndex: 10,
          transform: [{ translateY: fabTranslate }],
          opacity: fabOpacity,
        }}
        pointerEvents={showFab ? 'auto' : 'none'}
      >
        <View style={{ alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: 32, backgroundColor: isDark ? colors.dark.card : '#fff', shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, elevation: 6 }}>
          <AnimatedCircularProgress progress={scrollProgress} />
        </View>
      </Animated.View>
      {/* Top Bar Reading Progress (when not scrolled) */}
      {!showFab && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, backgroundColor: colors.light.border, zIndex: 5 }}>
          <Animated.View style={{ height: 6, backgroundColor: colors.primary, width: `${scrollProgress}%`, borderRadius: 3 }} />
        </View>
      )}
    </SafeAreaView>
  );
}

// Animated circular progress component
function AnimatedCircularProgress({ progress }: { progress: number }) {
  const animated = useState(new Animated.Value(0))[0];
  useEffect(() => {
    Animated.timing(animated, {
      toValue: progress,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [progress]);
  const circumference = 56 * Math.PI;
  const strokeDashoffset = animated.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
    extrapolate: 'clamp',
  });
  return (
    <View style={{ position: 'relative', width: 56, height: 56, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{ position: 'absolute', top: 0, left: 0 }}>
        <Svg width={56} height={56}>
          <Circle
            cx={28}
            cy={28}
            r={26}
            stroke={colors.light.border}
            strokeWidth={4}
            fill="none"
          />
          <AnimatedCircle
            cx={28}
            cy={28}
            r={26}
            stroke={colors.primary}
            strokeWidth={4}
            fill="none"
            strokeDasharray={`${circumference}, ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </Svg>
      </Animated.View>
      <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 16 }}>{Math.round(progress)}%</Text>
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
  headerButton: {
    padding: 8,
  },
  headerActions: {
    flexDirection: 'row',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  date: {
    fontFamily: typography.fonts.poppins.medium,
    fontSize: typography.sizes.sm,
    marginTop: 16,
    marginBottom: 8,
  },
  title: {
    fontFamily: typography.fonts.poppins.bold,
    fontSize: typography.sizes.lg,
    lineHeight: 36,
    marginBottom: 20,
  },
  verseContainer: {
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    marginBottom: 24,
  },
  verseReference: {
    fontFamily: typography.fonts.poppins.medium,
    fontSize: typography.sizes.sm,
    marginBottom: 8,
  },
  verseText: {
    fontFamily: typography.fonts.notoSerif.regular,
    fontSize: typography.sizes.lg,
    lineHeight: 28,
    fontStyle: 'italic',
  },
  contentContainer: {
    marginBottom: 24,
  },
  contentText: {
    fontFamily: typography.fonts.notoSerif.regular,
      fontSize: typography.sizes.lg,
    lineHeight: 28,
  },
  prayerContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  prayerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  prayerTitle: {
    fontFamily: typography.fonts.poppins.bold,
    fontSize: typography.sizes.lg,
    marginLeft: 8,
  },
  prayerText: {
    fontFamily: typography.fonts.notoSerif.regular,
    fontSize: typography.sizes.lg,
    lineHeight: 28,
    fontStyle: 'italic',
  },
  markReadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 32,
  },
  markReadText: {
    fontFamily: typography.fonts.poppins.medium,
    fontSize: typography.sizes.sm,
    color: '#fff',
    marginLeft: 8,
  },
  readStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginBottom: 32,
  },
  readStatusText: {
    fontFamily: typography.fonts.poppins.medium,
    fontSize: typography.sizes.sm,
    marginLeft: 8,
  },
});
