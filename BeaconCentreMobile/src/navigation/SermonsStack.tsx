import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useColorScheme } from 'react-native';
import { colors } from '@/constants/colors';

const Stack = createStackNavigator();

const SermonsStack = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: isDark ? colors.dark.background : colors.light.background,
        },
        headerTintColor: isDark ? colors.dark.text : colors.light.text,
      }}
    >
      <Stack.Screen 
        name="Sermons" 
        component={() => null} // Replace with your Sermons screen component
        options={{ title: 'Sermons' }}
      />
    </Stack.Navigator>
  );
};

export default SermonsStack; 