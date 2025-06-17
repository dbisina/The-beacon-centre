// src/components/sermons/SermonCategoryFilter.tsx - CATEGORY FILTER
import React from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { SERMON_CATEGORIES, getCategoryColor } from '@/constants/sermonCategories';

interface SermonCategoryFilterProps {
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
}

const SermonCategoryFilter: React.FC<SermonCategoryFilterProps> = ({
  selectedCategory,
  onCategorySelect,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {SERMON_CATEGORIES.map((category) => {
          const isSelected = selectedCategory === category.id;
          const categoryColor = getCategoryColor(category.id);
          
          return (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryChip,
                {
                  backgroundColor: isSelected 
                    ? categoryColor 
                    : isDark 
                      ? colors.dark.card 
                      : colors.light.card,
                  borderColor: isSelected ? categoryColor : colors.light.border,
                },
              ]}
              onPress={() => onCategorySelect(category.id)}
            >
              <Text
                style={[
                  styles.categoryText,
                  {
                    color: isSelected 
                      ? '#FFFFFF' 
                      : isDark 
                        ? colors.dark.text 
                        : colors.light.text,
                  },
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 14,
    fontFamily: typography.fonts.poppins.medium,
  },
});

export default SermonCategoryFilter;