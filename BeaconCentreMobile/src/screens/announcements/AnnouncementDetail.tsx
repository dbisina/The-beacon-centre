// src/screens/announcements/AnnouncementDetail.tsx
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, useColorScheme } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { RootStackParamList } from '@/types/navigation';

type Props = {
  route: RouteProp<RootStackParamList, 'AnnouncementDetail'>;
  navigation: StackNavigationProp<RootStackParamList, 'AnnouncementDetail'>;
};

const AnnouncementDetail: React.FC<Props> = ({ route, navigation }) => {
  const { announcement } = route.params;
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <SafeAreaView style={[
      styles.container,
      { backgroundColor: isDark ? colors.dark.background : colors.light.background }
    ]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={isDark ? colors.dark.text : colors.light.text} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.content}>
        <Text style={[
          styles.title,
          { color: isDark ? colors.dark.text : colors.light.text }
        ]}>
          {announcement.title}
        </Text>
        <Text style={[
          styles.description,
          { color: isDark ? colors.dark.textSecondary : colors.light.textSecondary }
        ]}>
          {announcement.content}
        </Text>
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
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 24,
    fontFamily: typography.fonts.poppins.semiBold,
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    fontFamily: typography.fonts.poppins.regular,
    lineHeight: 24,
  },
});

export default AnnouncementDetail;