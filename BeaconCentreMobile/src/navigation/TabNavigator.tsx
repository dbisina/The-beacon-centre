// src/navigation/TabNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useColorScheme } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { colors } from '@/constants/colors';
import { MainTabParamList } from '@/types/navigation';

// Stack Navigators
import DevotionalStack from './DevotionalStack';
import SermonsStack from './SermonsStack';
import AnnouncementsStack from './AnnouncementsStack';
import FavoritesStack from './FavoritesStack';
import SettingsStack from './SettingsStack';

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function TabNavigator() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'DevotionalStack':
              iconName = 'book';
              break;
            case 'SermonsStack':
              iconName = 'play-circle-filled';
              break;
            case 'AnnouncementsStack':
              iconName = 'announcement';
              break;
            case 'FavoritesStack':
              iconName = 'favorite';
              break;
            case 'SettingsStack':
              iconName = 'settings';
              break;
            default:
              iconName = 'help';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: isDark ? colors.dark.text : colors.textGrey,
        tabBarStyle: {
          backgroundColor: isDark ? colors.dark.background : colors.light.background,
          borderTopColor: isDark ? colors.dark.border : colors.light.border,
          paddingTop: 8,
          paddingBottom: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 4,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="DevotionalStack" 
        component={DevotionalStack}
        options={{ 
          title: 'Devotional',
          //tabBarTestID: 'devotional-tab',
        }}
      />
      <Tab.Screen 
        name="SermonsStack" 
        component={SermonsStack}
        options={{ 
          title: 'Sermons',
          //tabBarTestID: 'sermons-tab',
        }}
      />
      <Tab.Screen 
        name="AnnouncementsStack" 
        component={AnnouncementsStack}
        options={{ 
          title: 'News',
         // tabBarTestID: 'announcements-tab',
        }}
      />
      <Tab.Screen 
        name="FavoritesStack" 
        component={FavoritesStack}
        options={{ 
          title: 'Favorites',
         // tabBarTestID: 'favorites-tab',
        }}
      />
      <Tab.Screen 
        name="SettingsStack" 
        component={SettingsStack}
        options={{ 
          title: 'Settings',
         // tabBarTestID: 'settings-tab',
        }}
      />
    </Tab.Navigator>
  );
}