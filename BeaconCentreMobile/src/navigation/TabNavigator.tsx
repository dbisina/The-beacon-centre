// src/navigation/TabNavigator.tsx - ULTRA MODERN DESIGN
import React, { useRef, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useColorScheme, View, StyleSheet, Animated, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { MainTabParamList } from '@/types/navigation';

// Stack Navigators
import DevotionalStack from './DevotionalStack';
import SermonsStack from './SermonsStack';
import AnnouncementsStack from './AnnouncementsStack';
import FavoritesStack from './FavoritesStack';
import SettingsStack from './SettingsStack';

const Tab = createBottomTabNavigator<MainTabParamList>();
const { width } = Dimensions.get('window');

// Ultra Modern Tab Icon Component with Animations
const UltraModernTabIcon = ({ route, focused, color, size }: any) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (focused) {
      // Scale up animation
      Animated.spring(scaleAnim, {
        toValue: 1.2,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }).start();

      // Glow animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: false,
          }),
        ])
      ).start();

      // Special rotation for news icon
      if (route.name === 'AnnouncementsStack') {
        Animated.loop(
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          })
        ).start();
      }
    } else {
      // Scale down animation
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }).start();

      // Stop animations
      glowAnim.setValue(0);
      rotateAnim.setValue(0);
    }
  }, [focused, route.name]);

  const getIconConfig = () => {
    switch (route.name) {
      case 'DevotionalStack':
        return {
          focused: 'auto-stories',
          unfocused: 'book-outline',
          gradient: ['#FF6B6B', '#4ECDC4'],
          special: false,
        };
      case 'SermonsStack':
        return {
          focused: 'play-circle-filled',
          unfocused: 'play-circle-outline',
          gradient: ['#667eea', '#764ba2'],
          special: false,
        };
      case 'AnnouncementsStack':
        return {
          focused: 'newspaper',
          unfocused: 'article',
          gradient: ['#f093fb', '#f5576c'],
          special: true,
        };
      case 'FavoritesStack':
        return {
          focused: 'favorite',
          unfocused: 'favorite-border',
          gradient: ['#ff9a9e', '#fecfef'],
          special: false,
        };
      case 'SettingsStack':
        return {
          focused: 'tune',
          unfocused: 'settings-outline',
          gradient: ['#a8edea', '#fed6e3'],
          special: false,
        };
      default:
        return {
          focused: 'help',
          unfocused: 'help-outline',
          gradient: ['#667eea', '#764ba2'],
          special: false,
        };
    }
  };

  const iconConfig = getIconConfig();
  const iconName = focused ? iconConfig.focused : iconConfig.unfocused;
  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.3],
  });

  return (
    <View style={styles.ultraModernIconContainer}>
      {/* Glow Effect */}
      {focused && (
        <Animated.View
          style={[
            styles.glowEffect,
            {
              opacity: glowOpacity,
              backgroundColor: color,
            },
          ]}
        />
      )}

      {/* Icon Container */}
      <Animated.View
        style={[
          styles.iconWrapper,
          {
            transform: [
              { scale: scaleAnim },
              ...(iconConfig.special && focused ? [{ rotate: rotation }] : []),
            ],
          },
        ]}
      >
        {focused ? (
          <LinearGradient
            colors={iconConfig.gradient as [string, string]}
            style={styles.gradientIconContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Icon name={iconName} size={size} color="#fff" />
          </LinearGradient>
        ) : (
          <View style={styles.regularIconContainer}>
            <Icon name={iconName} size={size} color={color} />
          </View>
        )}
      </Animated.View>

      {/* Active Indicator */}
      {focused && (
        <Animated.View
          style={[
            styles.ultraModernActiveIndicator,
            {
              backgroundColor: color,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        />
      )}

      {/* Special News Badge */}
      {route.name === 'AnnouncementsStack' && (
        <View style={styles.newsBadge}>
          <View style={styles.newsBadgeDot} />
        </View>
      )}
    </View>
  );
};

export default function TabNavigator() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => (
          <UltraModernTabIcon 
            route={route} 
            focused={focused} 
            color={color} 
            size={size} 
          />
        ),
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
        tabBarStyle: {
          position: 'absolute',
          bottom: insets.bottom,
          left: 8,
          right: 8,
          height: 80 + insets.bottom,
          paddingTop: 12,
          paddingBottom: Math.max(insets.bottom, 16),
          paddingHorizontal: 20,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarBackground: () => (
          <BlurView 
            intensity={isDark ? 40 : 50} 
            style={[
              styles.ultraModernTabBarBackground,
              { 
                borderTopColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
                backgroundColor: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.95)',
              }
            ]}
          >
            <LinearGradient
              colors={isDark 
                ? ['rgba(0,0,0,0.85)', 'rgba(0,0,0,0.95)'] 
                : ['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.98)']
              }
              style={styles.ultraModernTabBarGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            />
            {/* Subtle border glow */}
            <LinearGradient
              colors={[colors.primary + '20', 'transparent']}
              style={styles.borderGlow}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </BlurView>
        ),
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: typography.fonts.poppins.semiBold,
          marginTop: 6,
          marginBottom: 0,
          letterSpacing: 0.5,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="DevotionalStack" 
        component={DevotionalStack}
        options={{ 
          title: 'Devotional',
        }}
      />
      <Tab.Screen 
        name="SermonsStack" 
        component={SermonsStack}
        options={{ 
          title: 'Sermons',
        }}
      />
      <Tab.Screen 
        name="AnnouncementsStack" 
        component={AnnouncementsStack}
        options={{ 
          title: 'News',
        }}
      />
      <Tab.Screen 
        name="FavoritesStack" 
        component={FavoritesStack}
        options={{ 
          title: 'Favorites',
        }}
      />
      <Tab.Screen 
        name="SettingsStack" 
        component={SettingsStack}
        options={{ 
          title: 'Settings',
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  ultraModernTabBarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    borderRadius: 24,
  },
  ultraModernTabBarGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
  },
  borderGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    borderRadius: 24,
  },
  ultraModernIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: 60,
    height: 60,
  },
  glowEffect: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 10,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  gradientIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  regularIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  ultraModernActiveIndicator: {
    position: 'absolute',
    bottom: -12,
    width: 6,
    height: 6,
    borderRadius: 3,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  newsBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF4757',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF4757',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  newsBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
});