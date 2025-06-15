// src/navigation/DevotionalStack.tsx
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import DevotionalHome from '@/screens/devotional/DevotionalHome';
import DevotionalDetail from '@/screens/devotional/DevotionalDetail';
import DevotionalArchive from '@/screens/devotional/DevotionalArchive';
import { colors } from '@/constants/colors';

const Stack = createStackNavigator();

const DevotionalStack = () => {
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
        name="DevotionalHome" 
        component={DevotionalHome}
        options={{ title: 'Daily Devotional' }}
      />
      <Stack.Screen 
        name="DevotionalDetail" 
        component={DevotionalDetail}
        options={{ title: 'Devotional' }}
      />
      <Stack.Screen 
        name="DevotionalArchive" 
        component={DevotionalArchive}
        options={{ title: 'Devotional Archive' }}
      />
    </Stack.Navigator>
  );
};

export default DevotionalStack;