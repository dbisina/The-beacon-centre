// src/navigation/AppNavigator.tsx - COMPLETE ROOT NAVIGATION
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useColorScheme, View, Text } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { colors } from '@/constants/colors';
import { RootStackParamList, MainTabParamList } from '@/types/navigation';

// Stack Navigators
import DevotionalStack from './DevotionalStack';
import SermonsStack from './SermonsStack';
import AnnouncementsStack from './AnnouncementsStack';
import FavoritesStack from './FavoritesStack';
import SettingsStack from './SettingsStack';

// Screen Components (Root Level)
import DevotionalDetail from '@/screens/devotional/DevotionalDetail';
import SermonDetail from '@/screens/sermons/SermonDetail';
import AnnouncementDetail from '@/screens/announcements/AnnouncementDetail';
import AudioPlayer from '@/screens/player/AudioPlayer';
import { typography } from '@/constants/typography';


const Tab = createBottomTabNavigator<MainTabParamList>();
const RootStack = createStackNavigator<RootStackParamList>();

const CustomTabIcon = ({ focused, iconName, size }: { 
  focused: boolean; 
  iconName: string; 
  size: number;
}) => {
  return (
    <View style={{ 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: 'transparent',
    }}>
      <Ionicons 
        name={iconName as any} 
        size={size} 
        color={focused ? colors.primary : colors.textGrey} 
      />
    </View> 
  );
};

// Main Tab Navigator
const MainTabNavigator = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'DevotionalStack':
              iconName = 'leaf-outline';
              break;
            case 'SermonsStack':
              iconName = 'headset-outline';
              break;
            case 'AnnouncementsStack':
              iconName = 'megaphone-outline';
              break;
            case 'FavoritesStack':
              iconName = 'heart-outline';
              break;
            case 'SettingsStack':
              iconName = 'settings-outline';
              break;
            default:
              iconName = 'help-outline';
          }

          return (
            <CustomTabIcon 
              focused={focused} 
              iconName={iconName} 
              size={size} 
            />
          );
        },
        tabBarLabel: ({ focused, children }) => (
          <Text style={{
            fontSize: 12,
            fontWeight: focused ? '600' : '400',
            color: focused ? colors.primary : colors.textGrey,
            marginTop: 4,
          }}>
            {children}
          </Text>
        ),
        tabBarStyle: {
          backgroundColor: isDark ? colors.dark.background : '#FFFFFF',
          borderTopColor: isDark ? colors.dark.border : '#F5F5F5',
          borderTopWidth: 0.3,
          paddingTop: 12,
          paddingBottom: 20,
          height: 85,
          elevation: 2,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -0.1 },
          shadowOpacity: 0.01,
          shadowRadius: 0.1,
        },
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textGrey,
      })}
    >
      <Tab.Screen 
        name="DevotionalStack"
        component={DevotionalStack}
        options={{ 
          title: 'Home',
        }}
      />
      <Tab.Screen 
        name="SermonsStack"
        component={SermonsStack}
        options={{ 
          title: 'Listen',
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
};

// Root Stack Navigator - THIS WAS MISSING!
const RootStackNavigator = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <RootStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: isDark ? colors.dark.background : colors.light.background,
        },
        headerTintColor: isDark ? colors.dark.text : colors.light.text,
        headerTitleStyle: {
          fontFamily: 'Poppins_500Medium',
        },
        presentation: 'modal', // Makes detail screens feel like modals
      }}
    >
      {/* Main Tab Navigator */}
      <RootStack.Screen 
        name="Main" 
        component={MainTabNavigator}
        options={{ headerShown: false }}
      />

      {/* Modal/Detail Screens */}
      <RootStack.Screen 
        name="DevotionalDetail" 
        component={DevotionalDetail}
        options={{ 
          title: 'Devotional',
          presentation: 'card'
        }}
      />

      <RootStack.Screen 
        name="SermonDetail" 
        component={SermonDetail}
        options={{ 
          title: 'Sermon',
          presentation: 'card'
        }}
      />

      <RootStack.Screen 
        name="AnnouncementDetail" 
        component={AnnouncementDetail}
        options={{ 
          title: 'Announcement',
          presentation: 'card'
        }}
      />

      <RootStack.Screen 
        name="AudioPlayer" 
        component={AudioPlayer}
        options={{ 
          title: 'Now Playing',
          presentation: 'modal'
        }}
      />

    
    </RootStack.Navigator>
  );
};

// Main App Navigator
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
        fonts: {
          regular: {
            ...typography.styles.body2,
            fontWeight: '400',
          },
          medium: {
            ...typography.styles.button,
            fontWeight: '500',
          },
          bold: {
            ...typography.styles.h3,
            fontWeight: '600',
          },
          heavy: {
            ...typography.styles.h1,
            fontWeight: '700',
          },
        },
      }}
    >
      <RootStackNavigator />
    </NavigationContainer>
  );
};

export default AppNavigator;