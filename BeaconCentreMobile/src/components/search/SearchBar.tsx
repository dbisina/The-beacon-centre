// src/components/search/SearchBar.tsx - MODERN SEARCH
import React from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
} from 'react-native';
import { BlurView } from 'expo-blur';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  style?: any;
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Search...',
  style,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <BlurView 
      intensity={isDark ? 20 : 30} 
      style={[
        styles.container,
        { 
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)',
        },
        style
      ]}
    >
      <View style={styles.searchIconContainer}>
        <Icon name="search" size={20} color={colors.textGrey} />
      </View>
      <TextInput
        style={[
          styles.input,
          { color: isDark ? colors.dark.text : colors.light.text }
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textGrey}
      />
      {value.length > 0 && (
        <TouchableOpacity 
          style={styles.clearButton}
          onPress={() => onChangeText('')}
        >
          <Icon 
            name="clear" 
            size={18} 
            color={colors.textGrey}
          />
        </TouchableOpacity>
      )}
    </BlurView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    marginVertical: 8,
    borderWidth: 1,
  },
  searchIconContainer: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: typography.fonts.poppins.medium,
  },
  clearButton: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
});

export default SearchBar;