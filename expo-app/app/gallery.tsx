import React from 'react';
import { View, Pressable, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, useResponsive } from '@/theme';
import { Screen, Text, Row, MediaTile } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { fetchCollages, CollageSummary } from '@/services/api';

export default function Gallery() {
  const r = useResponsive();
  const { data: collages, loading, error } = useAsync<CollageSummary[]>(() => fetchCollages(), [], []);

  return (
    <Screen padBottom={30}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Text size={28} weight="extra" track={-0.03}>Photo Gallery</Text>
        <Pressable
          onPress={() => router.back()}
          accessibilityLabel="Back"
          style={{ width: r.s(40), height: r.s(40), borderRadius: 99, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="close" size={r.s(18)} color={colors.ink} />
        </Pressable>
      </Row>
      <Text size={12.5} lh={1.6} color={colors.muted} style={{ marginTop: r.s(8) }}>
        Every Sunday's photos, archived here after the day it was shared.
      </Text>

      {loading ? (
        <ActivityIndicator color={colors.teal} style={{ marginTop: r.s(40) }} />
      ) : error ? (
        <Text size={12.5} color={colors.muted} style={{ marginTop: r.s(30), textAlign: 'center' }}>
          Couldn't load the gallery right now.
        </Text>
      ) : collages.length === 0 ? (
        <Text size={12.5} color={colors.muted} style={{ marginTop: r.s(30), textAlign: 'center' }}>
          No photos yet - check back after Sunday.
        </Text>
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: r.s(10), marginTop: r.s(20) }}>
          {collages.map((c) => (
            <Pressable key={c.id} onPress={() => router.push({ pathname: '/gallery/[id]', params: { id: c.id } })} style={{ width: '48%' }}>
              <MediaTile source={{ uri: c.coverImageUrl }} height={150}>
                <View style={{ padding: r.s(10) }}>
                  <Text size={12} weight="extra" color="#fff">
                    {new Date(c.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </Text>
                  <Text size={10.5} weight="semibold" color="rgba(255,255,255,0.75)" style={{ marginTop: r.s(2) }}>
                    {c.photoCount} photo{c.photoCount === 1 ? '' : 's'}
                  </Text>
                </View>
              </MediaTile>
            </Pressable>
          ))}
        </View>
      )}
    </Screen>
  );
}
