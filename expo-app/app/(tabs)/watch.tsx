import React, { useState } from 'react';
import { View, Pressable, ScrollView, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, useResponsive } from '@/theme';
import { Screen, Text, Chip, MediaTile, Row, SectionHead } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { fetchSermons, fetchExcerpts, fetchInspirationals } from '@/services/api';
import { COVER } from '@/data/content';

type Filter = 'all' | 'shorts' | 'full';

export default function Watch() {
  const r = useResponsive();
  const [filter, setFilter] = useState<Filter>('all');

  // Backend sync is the single source of truth for content (see
  // services/api.ts) - it already sorts newest sermonDate first, so no
  // client-side re-sorting is needed here. Both EXCERPT (clipped from a
  // sermon) and INSPIRATIONAL (standalone short) are short-form by
  // definition - the Shorts rail shows both, not just EXCERPT.
  const { data, loading, refresh } = useAsync(
    async () => {
      const [fsSermons, fsExcerpts, fsInspirational] = await Promise.all([
        fetchSermons(12).catch(() => []),
        fetchExcerpts(12).catch(() => []),
        fetchInspirationals(12).catch(() => []),
      ]);
      return { fsSermons, fsExcerpts, fsInspirational };
    },
    { fsSermons: [], fsExcerpts: [], fsInspirational: [] },
    []
  );

  const shorts = [
    ...data.fsExcerpts.map((v) => ({ id: v.id, youtubeId: v.youtubeId, title: v.title, sub: v.preacher, thumb: v.thumbnailUrl ? { uri: v.thumbnailUrl } : COVER, tag: 'Excerpt' })),
    ...data.fsInspirational.map((v) => ({ id: v.id, youtubeId: v.youtubeId, title: v.title, sub: v.preacher, thumb: v.thumbnailUrl ? { uri: v.thumbnailUrl } : COVER, tag: null as string | null })),
  ];
  const full = data.fsSermons.map((v) => ({ id: v.id, youtubeId: v.youtubeId, title: v.title, sub: v.duration ?? '', meta: v.preacher || v.series, thumb: v.thumbnailUrl ? { uri: v.thumbnailUrl } : COVER, description: v.description, tag: v.categoryName }));

  const showShorts = filter === 'all' || filter === 'shorts';
  const showFull = filter === 'all' || filter === 'full';

  return (
    <Screen
      padBottom={110}
      contentStyle={{ paddingHorizontal: 0 }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.teal} />}
    >
      <Row style={{ justifyContent: 'space-between', paddingHorizontal: r.s(18) }}>
        <Text size={32} weight="extra" track={-0.035}>Watch</Text>
      </Row>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: r.s(7), paddingHorizontal: r.s(18), marginTop: r.s(18) }}>
        <Chip label="All" active={filter === 'all'} onPress={() => setFilter('all')} />
        <Chip label="Shorts" active={filter === 'shorts'} onPress={() => setFilter('shorts')} />
        <Chip label="Full messages" active={filter === 'full'} onPress={() => setFilter('full')} />
      </ScrollView>

      {showShorts && shorts.length === 0 ? (
        <View style={{ paddingHorizontal: r.s(18), paddingTop: r.s(22) }}>
          <SectionHead title="Shorts" />
          <Text size={12.5} color={colors.muted} style={{ marginTop: r.s(6) }}>No shorts yet, check back soon.</Text>
        </View>
      ) : null}

      {showShorts && shorts.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: r.s(9), paddingHorizontal: r.s(18), paddingTop: r.s(22) }}>
          {shorts.map((sh) => (
            <Pressable
              key={sh.id}
              onPress={() =>
                router.push({
                  pathname: '/player/shorts',
                  params: { youtubeId: sh.youtubeId ?? '', title: sh.title },
                })
              }
            >
              <MediaTile source={sh.thumb} width={124} height={206}>
                {sh.tag ? (
                  <View style={{ position: 'absolute', top: r.s(8), left: r.s(8), paddingVertical: r.s(3), paddingHorizontal: r.s(7), borderRadius: r.s(5), backgroundColor: colors.teal }}>
                    <Text size={9} weight="bold" color="#fff">{sh.tag.toUpperCase()}</Text>
                  </View>
                ) : null}
                <View style={{ padding: r.s(10) }}>
                  <Text size={11.5} weight="bold" lh={1.25} color="#fff" numberOfLines={2}>{sh.title}</Text>
                  <Text size={9} weight="semibold" color="rgba(255,255,255,0.62)" style={{ marginTop: r.s(3) }}>{sh.sub}</Text>
                </View>
              </MediaTile>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      {showFull ? (
        <View style={{ paddingHorizontal: r.s(18) }}>
          <SectionHead title="This week's message" />
          {full[0] ? (
            <Pressable onPress={() => router.push({ pathname: '/player/message', params: { id: full[0].id, youtubeId: full[0].youtubeId ?? '', title: full[0].title, description: full[0].description ?? '' } })}>
              <View style={{ borderRadius: radius.lg, backgroundColor: colors.surface, overflow: 'hidden' }}>
                <MediaTile source={full[0].thumb} height={180} rad="xs" scrim={false} style={{ borderRadius: 0 }}>
                  {full[0].tag ? (
                    <View style={{ position: 'absolute', top: r.s(10), left: r.s(10), paddingVertical: r.s(4), paddingHorizontal: r.s(8), borderRadius: r.s(6), backgroundColor: colors.teal }}>
                      <Text size={10} weight="bold" color="#fff">{full[0].tag.toUpperCase()}</Text>
                    </View>
                  ) : null}
                  <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
                    <View style={{ width: r.s(56), height: r.s(38), borderRadius: r.s(10), backgroundColor: colors.live, alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="play" size={r.s(16)} color="#fff" />
                    </View>
                  </View>
                  <View style={{ position: 'absolute', right: r.s(10), bottom: r.s(10), paddingVertical: r.s(4), paddingHorizontal: r.s(8), borderRadius: r.s(6), backgroundColor: 'rgba(18,16,15,0.85)' }}>
                    <Text size={10.5} weight="bold" color="#fff">{full[0].sub}</Text>
                  </View>
                </MediaTile>
                <View style={{ padding: r.s(16) }}>
                  <Text size={16} weight="bold" lh={1.3} numberOfLines={2}>{full[0].title}</Text>
                  <Row gap={8} style={{ marginTop: r.s(10) }}>
                    <View style={{ width: r.s(22), height: r.s(22), borderRadius: 99, backgroundColor: colors.teal }} />
                    <Text size={11.5} weight="semibold" color={colors.muted}>{full[0].meta}</Text>
                  </Row>
                </View>
              </View>
            </Pressable>
          ) : null}

          {full.slice(1).map((v) => (
            <Pressable key={v.id} onPress={() => router.push({ pathname: '/player/message', params: { id: v.id, youtubeId: v.youtubeId ?? '', title: v.title, description: v.description ?? '' } })}>
              <Row gap={13} style={{ marginTop: r.s(16) }}>
                <MediaTile source={v.thumb} width={128} height={78} scrim={false}>
                  {v.tag ? (
                    <View style={{ position: 'absolute', top: r.s(6), left: r.s(6), paddingVertical: r.s(2), paddingHorizontal: r.s(5), borderRadius: r.s(4), backgroundColor: colors.teal }}>
                      <Text size={8} weight="bold" color="#fff">{v.tag.toUpperCase()}</Text>
                    </View>
                  ) : null}
                  <View style={{ position: 'absolute', right: r.s(6), bottom: r.s(6), paddingVertical: r.s(3), paddingHorizontal: r.s(6), borderRadius: r.s(5), backgroundColor: 'rgba(18,16,15,0.85)' }}>
                    <Text size={9.5} weight="bold" color="#fff">{v.sub}</Text>
                  </View>
                </MediaTile>
                <View style={{ flex: 1 }}>
                  <Text size={14} weight="bold" lh={1.3} numberOfLines={2}>{v.title}</Text>
                  <Text size={11.5} color={colors.muted} style={{ marginTop: r.s(5) }}>{v.meta}</Text>
                </View>
              </Row>
            </Pressable>
          ))}
        </View>
      ) : null}

    </Screen>
  );
}
