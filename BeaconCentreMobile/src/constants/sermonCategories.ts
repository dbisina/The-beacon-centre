// src/constants/sermonCategories.ts - SERMON CATEGORIES
export const SERMON_CATEGORIES = [
    { id: 'all', name: 'All Sermons', color: '#41BBAC' },
    { id: 'faith', name: 'Faith', color: '#3B82F6' },
    { id: 'prayer', name: 'Prayer', color: '#8B5CF6' },
    { id: 'worship', name: 'Worship', color: '#F59E0B' },
    { id: 'relationships', name: 'Relationships', color: '#EF4444' },
    { id: 'stewardship', name: 'Stewardship', color: '#10B981' },
    { id: 'purpose', name: 'Purpose', color: '#F97316' },
    { id: 'gospel', name: 'Gospel', color: '#6366F1' },
    { id: 'leadership', name: 'Leadership', color: '#84CC16' },
    { id: 'spiritual-growth', name: 'Spiritual Growth', color: '#06B6D4' },
    { id: 'love', name: 'Love', color: '#EC4899' },
    { id: 'forgiveness', name: 'Forgiveness', color: '#14B8A6' },
    { id: 'victory', name: 'Victory', color: '#F97316' },
    { id: 'giving', name: 'Giving', color: '#22C55E' },
    { id: 'peace', name: 'Peace', color: '#3B82F6' },
    { id: 'evangelism', name: 'Evangelism', color: '#DC2626' },
  ];
  
  export const getCategoryColor = (categoryName: string): string => {
    const category = SERMON_CATEGORIES.find(
      cat => cat.name.toLowerCase() === categoryName.toLowerCase() || 
             cat.id === categoryName.toLowerCase()
    );
    return category?.color || '#41BBAC';
  };
  
  export const getCategoryName = (categoryId: string): string => {
    const category = SERMON_CATEGORIES.find(cat => cat.id === categoryId.toLowerCase());
    return category?.name || categoryId;
  };