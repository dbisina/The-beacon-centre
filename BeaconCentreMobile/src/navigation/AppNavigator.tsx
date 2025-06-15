// src/navigation/AppNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useColorScheme } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { colors } from '@/constants/colors';
import DevotionalStack from '@/navigation/DevotionalStack';
import SermonsStack from '@/navigation/SermonsStack';
import AnnouncementsStack from '@/navigation/AnnouncementsStack';
import FavoritesStack from '@/navigation/FavoritesStack';
import SettingsStack from '@/navigation/SettingsStack';

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'Devotional':
              iconName = 'book';
              break;
            case 'Sermons':
              iconName = 'play-circle-filled';
              break;
            case 'Announcements':
              iconName = 'announcement';
              break;
            case 'Favorites':
              iconName = 'favorite';
              break;
            case 'Settings':
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
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Devotional" component={DevotionalStack} />
      <Tab.Screen name="Sermons" component={SermonsStack} />
      <Tab.Screen name="Announcements" component={AnnouncementsStack} />
      <Tab.Screen name="Favorites" component={FavoritesStack} />
      <Tab.Screen name="Settings" component={SettingsStack} />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <NavigationContainer
      theme={{
        dark: isDark,
        colors: {
          primary: colors.primary,
          background: isDark ? colors.dark.background : colors.light.background,
          card: isDark ? colors.dark.card : colors.light.card,
          text: isDark ? colors.dark.text : colors.light.text,
          border: isDark ? colors.dark.border : colors.light.border,
          notification: colors.primary,
        },
      }}
    >
      <TabNavigator />
    </NavigationContainer>
  );
};

export default AppNavigator;