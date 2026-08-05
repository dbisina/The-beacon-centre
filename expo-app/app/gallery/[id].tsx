import React, { useState } from 'react';
import { View, Pressable, ActivityIndicator, FlatList, Dimensions, Image } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, useResponsive } from '@/theme';
import { Screen, Text, Row } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { fetchCollageById, Collage } from '@/services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function GalleryDetail() {
  const r = useResponsive();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: collage, loading } = useAsync<Collage | null>(() => fetchCollageById(id), null, [id]);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.ground, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.teal} />
      </View>
    );
  }

  if (!collage) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.ground, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <Text size={14} weight="bold">Couldn't find this collage.</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text size={13} weight="bold" color={colors.tealDeep}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <>
      <Screen padBottom={30}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Text size={22} weight="extra" track={-0.02}>
            {new Date(collage.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
          <Pressable
            onPress={() => router.back()}
            accessibilityLabel="Back"
            style={{ width: r.s(40), height: r.s(40), borderRadius: 99, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="close" size={r.s(18)} color={colors.ink} />
          </Pressable>
        </Row>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: r.s(6), marginTop: r.s(18) }}>
          {collage.photos.map((p, i) => (
            <Pressable key={p.id} onPress={() => setViewerIndex(i)} style={{ width: '32%', aspectRatio: 1, borderRadius: radius.xs, overflow: 'hidden' }}>
              <Image source={{ uri: p.imageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            </Pressable>
          ))}
        </View>
      </Screen>

      {viewerIndex != null ? (
        <PhotoViewer photos={collage.photos} initialIndex={viewerIndex} onClose={() => setViewerIndex(null)} />
      ) : null}
    </>
  );
}

function PhotoViewer({
  photos,
  initialIndex,
  onClose,
}: {
  photos: { id: string; imageUrl: string }[];
  initialIndex: number;
  onClose: () => void;
}) {
  const r = useResponsive();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000' }}>
      <FlatList
        data={photos}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(p) => p.id}
        initialScrollIndex={initialIndex}
        getItemLayout={(_, index) => ({ length: SCREEN_WIDTH, offset: SCREEN_WIDTH * index, index })}
        renderItem={({ item }) => (
          <View style={{ width: SCREEN_WIDTH, alignItems: 'center', justifyContent: 'center' }}>
            <Image source={{ uri: item.imageUrl }} style={{ width: SCREEN_WIDTH, height: '100%' }} resizeMode="contain" />
          </View>
        )}
      />
      <Pressable
        onPress={onClose}
        accessibilityLabel="Close"
        style={{ position: 'absolute', top: insets.top + r.s(8), left: r.s(16), width: r.s(44), height: r.s(44), borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}
      >
        <Ionicons name="close" size={r.s(20)} color="#fff" />
      </Pressable>
    </View>
  );
}
