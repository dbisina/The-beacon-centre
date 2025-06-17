// src/components/search/SearchBar.tsx - MODERN SEARCH
import React from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  useColorScheme,
} from 'react-native';
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
    <View style={[
      styles.container,
      { backgroundColor: isDark ? colors.dark.card : colors.backgroundSecondary },
      style
    ]}>
      <Icon name="search" size={20} color={colors.textGrey} />
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
        <Icon 
          name="clear" 
          size={20} 
          color={colors.textGrey}
          onPress={() => onChangeText('')}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginVertical: 8,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontFamily: typography.fonts.poppins.regular,
  },
});

export default SearchBar;