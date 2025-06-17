// src/navigation/FavoritesStack.tsx
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import FavoritesScreen from '@/screens/favorites/FavoritesScreen';
import { colors } from '@/constants/colors';

const Stack = createStackNavigator();

const FavoritesStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
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
        name="Favorites" 
        component={FavoritesScreen} 
        options={{ title: 'Favorites' }}
      />
    </Stack.Navigator>
  );
};

export default FavoritesStack;