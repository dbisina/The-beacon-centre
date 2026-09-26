import React, { useCallback, useState } from 'react';
import { View, Pressable, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, HIT, useResponsive } from '@/theme';
import { Screen, Text, Row, Card, Chip, Btn } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/services/auth';
import { usePlayer } from '@/services/player';
import { fetchSaves, fetchNotes, deleteSave, UserSave, UserNote, ContentType, ContentSummary } from '@/services/userData';

/**
 * Everything a member kept: saved messages and devotionals, and their notes.
 *
 * Save buttons have been on the sermon, audio and devotional screens for a
 * while, but saving only ever wrote a row - there was nowhere to find it again.
 */

const TYPE_META: Record<ContentType, { icon: keyof typeof Ionicons.glyphMap; label: string }> = {
  VIDEO_SERMON: { icon: 'play-circle-outline', label: 'Message' },
  AUDIO_SERMON: { icon: 'headset-outline', label: 'Audio' },
  DEVOTIONAL: { icon: 'book-outline', label: 'Devotional' },
  ANNOUNCEMENT: { icon: 'megaphone-outline', label: 'News' },
};

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
}

export default function Library() {
  const r = useResponsive();
  const { isMember } = useAuth();
  const { play } = usePlayer();
  const [tab, setTab] = useState<'saved' | 'notes'>('saved');
  const [refreshing, setRefreshing] = useState(false);
  const [removing, setRemoving] = useState<number | null>(null);

  const saves = useAsync<UserSave[]>(() => (isMember ? fetchSaves() : Promise.resolve([])), [], [isMember]);
  const notes = useAsync<UserNote[]>(() => (isMember ? fetchNotes() : Promise.resolve([])), [], [isMember]);

  // Saving or writing a note elsewhere, then coming back, should show it.
  useFocusEffect(
    useCallback(() => {
      if (!isMember) return;
      saves.refresh();
      notes.refresh();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isMember])
  );

  function open(type: ContentType, contentId: number, item: ContentSummary) {
    switch (type) {
      case 'VIDEO_SERMON':
        router.push({ pathname: '/player/message', params: { id: String(contentId), youtubeId: item.youtubeId ?? '', title: item.title } });
        return;
      case 'AUDIO_SERMON':
        if (!item.audioUrl) return;
        play({ id: String(contentId), title: item.title, preacher: item.subtitle ?? undefined, audioUrl: item.audioUrl, imageUrl: item.thumbnailUrl });
        router.push('/player/audio');
        return;
      case 'DEVOTIONAL':
        router.push({ pathname: '/devotional', params: { id: String(contentId) } });
        return;
      case 'ANNOUNCEMENT':
        router.push('/news');
    }
  }

  async function unsave(s: UserSave) {
    setRemoving(s.id);
    try {
      await deleteSave(s.contentType, s.contentId);
      await saves.refresh();
    } finally {
      setRemoving(null);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await Promise.all([saves.refresh(), notes.refresh()]);
    setRefreshing(false);
  }

  const header = (
    <Row style={{ justifyContent: 'space-between' }}>
      <Text size={28} weight="extra" track={-0.03}>My library</Text>
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Close"
        hitSlop={6}
        style={{ width: r.s(40), height: r.s(40), borderRadius: 99, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}
      >
        <Ionicons name="close" size={r.s(18)} color={colors.ink} />
      </Pressable>
    </Row>
  );

  if (!isMember) {
    return (
      <Screen padBottom={30}>
        {header}
        <Card style={{ marginTop: r.s(24) }} pad={22}>
          <Ionicons name="bookmark-outline" size={r.s(26)} color={colors.tealDeep} />
          <Text size={17} weight="extra" style={{ marginTop: r.s(12) }}>Keep what speaks to you</Text>
          <Text size={13} lh={1.6} color={colors.muted} style={{ marginTop: r.s(6) }}>
            Sign in to save messages and devotionals and write notes on them. They'll be here,
            on any phone you sign in on.
          </Text>
          <Btn full label="Sign in" style={{ marginTop: r.s(16) }} onPress={() => router.push('/auth')} />
        </Card>
      </Screen>
    );
  }

  const active = tab === 'saved' ? saves : notes;

  return (
    <Screen padBottom={30} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.teal} />}>
      {header}

      <Row gap={7} style={{ marginTop: r.s(18) }}>
        <Chip label={`Saved${saves.data.length ? ` · ${saves.data.length}` : ''}`} active={tab === 'saved'} onPress={() => setTab('saved')} />
        <Chip label={`Notes${notes.data.length ? ` · ${notes.data.length}` : ''}`} active={tab === 'notes'} onPress={() => setTab('notes')} />
      </Row>

      {active.loading && active.data.length === 0 ? (
        <ActivityIndicator color={colors.teal} style={{ marginTop: r.s(40) }} />
      ) : active.error ? (
        <Card style={{ marginTop: r.s(20) }}>
          <Text size={12.5} color={colors.muted} style={{ textAlign: 'center' }}>
            Couldn't load your library. Pull down to try again.
          </Text>
        </Card>
      ) : tab === 'saved' ? (
        saves.data.length === 0 ? (
          <Card style={{ marginTop: r.s(20) }} pad={20}>
            <Text size={14} weight="bold">Nothing saved yet</Text>
            <Text size={12.5} lh={1.6} color={colors.muted} style={{ marginTop: r.s(4) }}>
              Tap the bookmark on a message, an audio sermon or a devotional to keep it here.
            </Text>
          </Card>
        ) : (
          <View style={{ marginTop: r.s(16), gap: r.s(10) }}>
            {saves.data.map((s) => {
              const meta = TYPE_META[s.contentType];
              const item = s.item;
              return (
                <Card key={s.id} pad={12}>
                  <Row gap={12} style={{ alignItems: 'center', minHeight: HIT }}>
                    <Pressable
                      onPress={() => item && open(s.contentType, s.contentId, item)}
                      disabled={!item}
                      accessibilityRole="button"
                      accessibilityLabel={item ? `${meta.label}: ${item.title}` : `${meta.label} no longer available`}
                      style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: r.s(12) }}
                    >
                      {item?.thumbnailUrl ? (
                        <Image source={{ uri: item.thumbnailUrl }} style={{ width: r.s(52), height: r.s(52), borderRadius: radius.sm }} />
                      ) : (
                        <View style={{ width: r.s(52), height: r.s(52), borderRadius: radius.sm, backgroundColor: colors.tealPale, alignItems: 'center', justifyContent: 'center' }}>
                          <Ionicons name={meta.icon} size={r.s(22)} color={colors.tealDeep} />
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text size={10.5} weight="bold" color={colors.faint}>{meta.label.toUpperCase()}</Text>
                        <Text size={13.5} weight="bold" color={item ? colors.ink : colors.faint} style={{ marginTop: r.s(2) }}>
                          {item ? item.title : 'No longer available'}
                        </Text>
                        {item?.subtitle ? (
                          <Text size={11.5} color={colors.muted} style={{ marginTop: r.s(2) }}>{item.subtitle}</Text>
                        ) : null}
                      </View>
                    </Pressable>
                    <Pressable
                      onPress={() => unsave(s)}
                      disabled={removing === s.id}
                      accessibilityRole="button"
                      accessibilityLabel="Remove from library"
                      hitSlop={8}
                      style={{ width: r.s(HIT), height: r.s(HIT), alignItems: 'center', justifyContent: 'center' }}
                    >
                      {removing === s.id ? (
                        <ActivityIndicator color={colors.teal} />
                      ) : (
                        <Ionicons name="bookmark" size={r.s(20)} color={colors.tealDeep} />
                      )}
                    </Pressable>
                  </Row>
                </Card>
              );
            })}
          </View>
        )
      ) : notes.data.length === 0 ? (
        <Card style={{ marginTop: r.s(20) }} pad={20}>
          <Text size={14} weight="bold">No notes yet</Text>
          <Text size={12.5} lh={1.6} color={colors.muted} style={{ marginTop: r.s(4) }}>
            Notes you write on a message appear here, newest first.
          </Text>
        </Card>
      ) : (
        <View style={{ marginTop: r.s(16), gap: r.s(10) }}>
          {notes.data.map((n) => {
            const item = n.item;
            return (
              <Pressable
                key={n.id}
                onPress={() => item && open(n.contentType, n.contentId, item)}
                disabled={!item}
                accessibilityRole="button"
                accessibilityLabel={`Note on ${item ? item.title : 'a removed item'}`}
              >
                {({ pressed }) => (
                  <Card pad={16} style={{ opacity: pressed ? 0.7 : 1 }}>
                    <Row style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <Text size={12.5} weight="bold" color={item ? colors.tealDeep : colors.faint} style={{ flex: 1 }}>
                        {item ? item.title : 'No longer available'}
                      </Text>
                      <Text size={11} color={colors.faint}>{shortDate(n.updatedAt)}</Text>
                    </Row>
                    <Text size={13} lh={1.6} color={colors.inkSoft} style={{ marginTop: r.s(8) }} numberOfLines={4}>
                      {n.body}
                    </Text>
                  </Card>
                )}
              </Pressable>
            );
          })}
        </View>
      )}
    </Screen>
  );
}
