// src/screens/player/AudioPlayer.tsx
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, useColorScheme } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { RootStackParamList } from '@/types/navigation';

type Props = {
  route: RouteProp<RootStackParamList, 'AudioPlayer'>;
  navigation: StackNavigationProp<RootStackParamList, 'AudioPlayer'>;
};

const AudioPlayer: React.FC<Props> = ({ route, navigation }) => {
  const { sermon } = route.params;
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <SafeAreaView style={[
      styles.container,
      { backgroundColor: isDark ? colors.dark.background : colors.light.background }
    ]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="keyboard-arrow-down" size={32} color={isDark ? colors.dark.text : colors.light.text} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.content}>
        <View style={styles.audioInfo}>
          <Text style={[
            styles.title,
            { color: isDark ? colors.dark.text : colors.light.text }
          ]}>
            {sermon.title}
          </Text>
          <Text style={[
            styles.speaker,
            { color: isDark ? colors.dark.textSecondary : colors.light.textSecondary }
          ]}>
            {sermon.speaker}
          </Text>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity style={styles.controlButton}>
            <Icon name="skip-previous" size={32} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.controlButton, styles.playButton]}>
            <Icon name="play-arrow" size={48} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton}>
            <Icon name="skip-next" size={32} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
  },
  audioInfo: {
    alignItems: 'center',
    marginBottom: 64,
  },
  title: {
    fontSize: 24,
    fontFamily: typography.fonts.poppins.bold,
    textAlign: 'center',
    marginBottom: 8,
  },
  speaker: {
    fontSize: 18,
    fontFamily: typography.fonts.poppins.medium,
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
  },
  controlButton: {
    padding: 12,
  },
  playButton: {
    backgroundColor: colors.primary,
    borderRadius: 40,
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AudioPlayer;