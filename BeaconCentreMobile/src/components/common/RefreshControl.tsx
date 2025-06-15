// src/components/common/RefreshControl.tsx
import React from 'react';
import { RefreshControl as RNRefreshControl } from 'react-native';
import { colors } from '@/constants';
import { useTheme } from '@/context/ThemeContext';

interface RefreshControlProps {
  refreshing: boolean;
  onRefresh: () => void;
  title?: string;
}

export default function RefreshControl({
  refreshing,
  onRefresh,
  title = 'Pull to refresh',
}: RefreshControlProps) {
  const { isDark } = useTheme();

  return (
    <RNRefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={colors.primary}
      colors={[colors.primary]}
      progressBackgroundColor={isDark ? colors.dark.background : colors.light.background}
      title={title}
      titleColor={isDark ? colors.dark.text : colors.light.text}
    />
  );
}