// src/navigation/AnnouncementsStack.tsx
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AnnouncementsHome from '@/screens/announcements/AnnouncementsHome';
import AnnouncementDetail from '@/screens/announcements/AnnouncementDetail';
import { colors } from '@/constants/colors';

const Stack = createStackNavigator();

const AnnouncementsStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontFamily: 'Poppins_600SemiBold',
        },
      }}
    >
      <Stack.Screen 
        name="AnnouncementsHome" 
        component={AnnouncementsHome} 
        options={{ title: 'Announcements' }}
      />
      <Stack.Screen 
        name="AnnouncementDetail" 
        component={AnnouncementDetail} 
        options={{ title: 'Announcement' }}
      />
    </Stack.Navigator>
  );
};

export default AnnouncementsStack;