// src/screens/sermons/SermonsHome.tsx
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

import VideoSermons from './VideoSermons';
import AudioSermons from './AudioSermons';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';

const Tab = createMaterialTopTabNavigator();

const SermonsHome = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <SafeAreaView style={[
      styles.container,
      { backgroundColor: isDark ? colors.dark.background : colors.light.background }
    ]}>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: isDark ? colors.dark.text : colors.textGrey,
          tabBarStyle: {
            backgroundColor: isDark ? colors.dark.background : colors.light.background,
          },
          tabBarIndicatorStyle: {
            backgroundColor: colors.primary,
          },
          tabBarLabelStyle: {
            fontFamily: typography.fonts.poppins.medium,
            fontSize: typography.sizes.medium,
          },
        }}
      >
        <Tab.Screen 
          name="VideoSermons" 
          component={VideoSermons}
          options={{ title: 'Video Sermons' }}
        />
        <Tab.Screen 
          name="AudioSermons" 
          component={AudioSermons}
          options={{ title: 'Audio Sermons' }}
        />
      </Tab.Navigator>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default SermonsHome;