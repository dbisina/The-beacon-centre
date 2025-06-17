// src/navigation/AppNavigator.tsx - MODERN DESIGN
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useColorScheme, View, Text } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Ionicons from '@expo/vector-icons/Ionicons';

import { colors } from '@/constants/colors';
import { MainTabParamList } from '@/types/navigation';

// Stack Navigators - FIXED: No inline functions
import DevotionalStack from './DevotionalStack';
import SermonsStack from './SermonsStack';
import AnnouncementsStack from './AnnouncementsStack';
import FavoritesStack from './FavoritesStack';
import SettingsStack from './SettingsStack';

const Tab = createBottomTabNavigator<MainTabParamList>();

const CustomTabIcon = ({ focused, iconName, size }: { 
  focused: boolean; 
  iconName: string; 
  size: number;
}) => {
  return (
    <View style={{ 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor:  'transparent',
    }}>
      <Ionicons 
        name={iconName} 
        size={size} 
        color={focused ? colors.primary : colors.textGrey} 
      />
    </View>
  );
};

const TabNavigator = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'DevotionalStack':
              iconName = 'leaf-outline'; // Modern book icon
              break;
            case 'SermonsStack':
              iconName = 'headset-outline'; // Modern listen icon
              break;
            case 'AnnouncementsStack':
              iconName = 'megaphone-outline'; // Modern announcement icon
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
          height: 85, // Increased height for modern look
          elevation: 2, // Android shadow
          shadowColor: '#000', // iOS shadow
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        headerShown: false,
        tabBarActiveTintColor: colors.primary, // Teal when active
        tabBarInactiveTintColor: colors.textGrey,
      })}
    >
      <Tab.Screen 
        name="DevotionalStack"
        component={DevotionalStack} // FIXED: Direct component reference
        options={{ 
          title: 'Home',
        }}
      />
      <Tab.Screen 
        name="SermonsStack"
        component={SermonsStack} // FIXED: Direct component reference
        options={{ 
          title: 'Listen',
        }}
      />
      <Tab.Screen 
        name="AnnouncementsStack"
        component={AnnouncementsStack} // FIXED: Direct component reference
        options={{ 
          title: 'News', // Matching your reference design
        }}
      />
      <Tab.Screen 
        name="FavoritesStack"
        component={FavoritesStack} // FIXED: Direct component reference
        options={{ 
          title: 'Favorites',
        }}
      />
      <Tab.Screen 
        name="SettingsStack"
        component={SettingsStack} // FIXED: Direct component reference
        options={{ 
          title: 'Settings',
        }}
      />
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