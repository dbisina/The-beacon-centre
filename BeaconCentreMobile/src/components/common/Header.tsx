// src/components/common/Header.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, typography } from '@/constants';

interface HeaderProps {
  title: string;
  onBackPress?: () => void;
  rightAction?: {
    icon: string;
    onPress: () => void;
  };
}

const Header: React.FC<HeaderProps> = ({
  title,
  onBackPress,
  rightAction,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={[
      styles.container,
      { backgroundColor: isDark ? colors.dark.background : colors.light.background }
    ]}>
      {onBackPress && (
        <TouchableOpacity onPress={onBackPress} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
      )}
      
      <Text style={[
        styles.title,
        { color: isDark ? colors.dark.text : colors.light.text }
      ]}>
        {title}
      </Text>
      
      {rightAction && (
        <TouchableOpacity onPress={rightAction.onPress} style={styles.rightButton}>
          <Icon name={rightAction.icon} size={24} color={colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
  },
  backButton: {
    position: 'absolute',
    left: 16,
  },
  title: {
    fontFamily: typography.fonts.poppins.bold,
    fontSize: typography.sizes.large,
  },
  rightButton: {
    position: 'absolute',
    right: 16,
  },
});

export default Header;