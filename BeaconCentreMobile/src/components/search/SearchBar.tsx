// src/components/search/SearchBar.tsx
import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, typography } from '@/constants';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  onFocus?: () => void;
  onBlur?: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  placeholder = 'Search...',
  onFocus,
  onBlur,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const handleChangeText = (text: string) => {
    setQuery(text);
    onSearch(text);
  };

  const clearSearch = () => {
    setQuery('');
    onSearch('');
    inputRef.current?.blur();
  };

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: isDark ? colors.dark.card : colors.light.card,
        borderColor: isFocused ? colors.primary : (isDark ? colors.dark.border : colors.light.border),
      }
    ]}>
      <Icon name="search" size={20} color={colors.textGrey} />
      
      <TextInput
        ref={inputRef}
        style={[
          styles.input,
          { color: isDark ? colors.dark.text : colors.light.text }
        ]}
        placeholder={placeholder}
        placeholderTextColor={colors.textGrey}
        value={query}
        onChangeText={handleChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
      />

      {query.length > 0 && (
        <Animated.View style={{ opacity: fadeAnim }}>
          <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
            <Icon name="close" size={20} color={colors.textGrey} />
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  input: {
    flex: 1,
    fontFamily: typography.fonts.poppins.regular,
    fontSize: typography.sizes.medium,
    marginLeft: 8,
    paddingVertical: 4,
  },
  clearButton: {
    padding: 4,
  },
});

export default SearchBar;