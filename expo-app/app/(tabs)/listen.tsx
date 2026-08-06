import React, { useState } from 'react';
import { View, Image, Pressable, ScrollView, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, useResponsive } from '@/theme';
import { Screen, Text, Chip, Row, Kicker } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { fetchAudioSermons, fetchGoaks } from '@/services/api';
import { usePlayer } from '@/services/player';
import { COVER } from '@/data/content';

export default function Listen() {
  const r = useResponsive();
  const [tab, setTab] = useState<'sermons' | 'goaks' | 'downloads'>('sermons');
  const { play, current, isPlaying } = usePlayer();

  const { data, loading, refresh } = useAsync(
    async () => {
      const [sermons, goaks] = await Promise.all([
        fetchAudioSermons().catch(() => []),
        fetchGoaks().catch(() => []),
      ]);
      return { sermons, goaks };
    },
    { sermons: [], goaks: [] },
    []
  );

  // Backend only - placeholder sermons used to stand in here, which meant a
  // fetch failure looked like a stocked library of tracks that would not play.
  const items = tab === 'goaks' ? data.goaks : data.sermons;

  return (
    <Screen padBottom={110} refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.teal} />}>
      <Text size={32} weight="extra" track={-0.035}>Listen</Text>
      <Text size={13} lh={1.6} color={colors.muted} style={{ marginTop: r.s(8) }}>
        {items.length
          ? `${items.length} message${items.length === 1 ? '' : 's'} you can play offline.`
          : 'Messages you can play offline.'}
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: r.s(7), marginTop: r.s(18) }}>
        <Chip label="Audio sermons" active={tab === 'sermons'} onPress={() => setTab('sermons')} />
        <Chip label="GOAKS" active={tab === 'goaks'} onPress={() => setTab('goaks')} />
        <Chip label="Downloads" active={tab === 'downloads'} onPress={() => setTab('downloads')} />
      </ScrollView>

      {tab === 'downloads' ? (
        <View style={{ marginTop: r.s(40), alignItems: 'center', paddingHorizontal: r.s(30) }}>
          <View style={{ width: r.s(64), height: r.s(64), borderRadius: r.s(20), backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="download-outline" size={r.s(28)} color={colors.muted} />
          </View>
          <Text size={17} weight="extra" style={{ marginTop: r.s(18) }}>Nothing downloaded yet</Text>
          <Text size={12.5} lh={1.65} color={colors.muted} style={{ marginTop: r.s(8), textAlign: 'center' }}>
            Download any message and it plays without data, useful for the drive to church.
          </Text>
        </View>
      ) : !loading && items.length === 0 ? (
        <View style={{ marginTop: r.s(40), alignItems: 'center', paddingHorizontal: r.s(30) }}>
          <View style={{ width: r.s(64), height: r.s(64), borderRadius: r.s(20), backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="musical-notes-outline" size={r.s(28)} color={colors.muted} />
          </View>
          <Text size={17} weight="extra" style={{ marginTop: r.s(18) }}>
            {tab === 'goaks' ? 'No GOAKS yet' : 'No audio sermons yet'}
          </Text>
          <Text size={12.5} lh={1.65} color={colors.muted} style={{ marginTop: r.s(8), textAlign: 'center' }}>
            Nothing has been published here yet. Pull down to refresh.
          </Text>
        </View>
      ) : (
        <View style={{ marginTop: r.s(20), gap: r.s(11) }}>
          {items.map((a: any) => {
            const active = current?.id === a.id;
            return (
              <Pressable
                key={a.id}
                onPress={() => {
                  play(a);
                  router.push('/player/audio');
                }}
              >
                <Row gap={13} style={{ padding: r.s(12), borderRadius: radius.lg, backgroundColor: active ? colors.ink : colors.surface }}>
                  <Image source={a.imageUrl ? { uri: a.imageUrl } : COVER} style={{ width: r.s(56), height: r.s(56), borderRadius: radius.sm }} />
                  <View style={{ flex: 1 }}>
                    <Text size={14} weight="bold" lh={1.3} numberOfLines={2} color={active ? '#fff' : colors.ink}>{a.title}</Text>
                    <Text size={11.5} color={active ? colors.onDarkMuted : colors.muted} style={{ marginTop: r.s(4) }} numberOfLines={1}>
                      {[a.preacher, a.series].filter(Boolean).join(' · ')}
                    </Text>
                  </View>
                  <View style={{ width: r.s(38), height: r.s(38), borderRadius: 99, backgroundColor: active ? colors.teal : colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name={active && isPlaying ? 'pause' : 'play'} size={r.s(15)} color={active ? colors.tealInk : colors.ink} />
                  </View>
                </Row>
              </Pressable>
            );
          })}
        </View>
      )}
    </Screen>
  );
}
