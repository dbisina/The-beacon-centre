// src/navigation/SermonsStack.tsx - UPDATED WITH SERMON DETAIL
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useColorScheme } from 'react-native';
import { colors } from '@/constants/colors';
import { SermonsStackParamList } from '@/types/navigation';

// Import all sermon screens
import SermonsHome from '@/screens/sermons/SermonsHome';
import VideoSermons from '@/screens/sermons/VideoSermons';
import AudioSermons from '@/screens/sermons/AudioSermons';
import SermonDetail from '@/screens/sermons/SermonDetail';

const Stack = createStackNavigator<SermonsStackParamList>();

const SermonsStack = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        headerStyle: {
          backgroundColor: isDark ? colors.dark.background : colors.light.background,
        },
        headerTintColor: isDark ? colors.dark.text : colors.light.text,
        headerTitleStyle: {
          fontFamily: 'Poppins_500Medium',
        },
      }}
    >
      <Stack.Screen 
        name="SermonsHome" 
        component={SermonsHome}
        options={{ title: 'Sermons' }}
      />
      <Stack.Screen 
        name="VideoSermons" 
        component={VideoSermons}
        options={{ title: 'Video Sermons' }}
      />
      <Stack.Screen 
        name="AudioSermons" 
        component={AudioSermons}
        options={{ title: 'Audio Sermons' }}
      />
      <Stack.Screen 
        name="SermonDetail" 
        component={SermonDetail}
        options={{ 
          title: 'Sermon Detail',
          headerShown: true,
          presentation: 'card'
        }}
      />
    </Stack.Navigator>
  );
};

export default SermonsStack;