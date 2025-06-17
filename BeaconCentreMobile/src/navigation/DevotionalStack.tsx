// src/navigation/DevotionalStack.tsx
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import DevotionalHome from '@/screens/devotional/DevotionalHome';
import DevotionalDetail from '@/screens/devotional/DevotionalDetail';
import DevotionalArchive from '@/screens/devotional/DevotionalArchive';
import { colors } from '@/constants/colors';
import { useColorScheme } from 'react-native';

const Stack = createStackNavigator();

const DevotionalStack = () => {
  const isDark = useColorScheme() === 'dark';
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        headerStyle: {
          backgroundColor: isDark ? colors.dark.background : colors.light.background,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontFamily: 'Poppins_500Medium',
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