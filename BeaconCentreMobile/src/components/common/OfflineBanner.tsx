// src/components/common/OfflineBanner.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, typography } from '@/constants';

const OfflineBanner = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={[
      styles.container,
      { backgroundColor: colors.yellow }
    ]}>
      <Icon name="wifi-off" size={16} color="#fff" />
      <Text style={styles.text}>
        You're offline. Some features may be limited.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  text: {
    fontFamily: typography.fonts.poppins.medium,
    fontSize: typography.sizes.small,
    color: '#fff',
    marginLeft: 8,
  },
});

export default OfflineBanner;