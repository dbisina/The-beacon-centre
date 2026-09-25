import React, { useEffect, useState } from 'react';
import { View, Image, Pressable, ScrollView, TextInput, Share, ActivityIndicator, Alert, Linking } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, HIT, useResponsive } from '@/theme';
import { Text, Row, Card, Kicker, MediaTile } from '@/components/ui';
import { YouTubePlayer } from '@/components/YouTubePlayer';
import { useSaved } from '@/hooks/useSaved';
import { useAuth } from '@/services/auth';
import { fetchNotes, upsertNote } from '@/services/userData';
import { watchUrl } from '@/services/youtube';
import { COVER, LOGO_WHITE } from '@/data/content';

export default function MessagePlayer() {
  const r = useResponsive();
  const insets = useSafeAreaInsets();
  const { id, youtubeId, title, description } = useLocalSearchParams<{ id?: string; youtubeId?: string; title?: string; description?: string }>();
  const { isMember } = useAuth();
  const contentId = id ? Number(id) : null;
  const { saved, toggle: toggleSaved } = useSaved('VIDEO_SERMON', contentId);

  const [showNotes, setShowNotes] = useState(false);
  const [note, setNote] = useState('');
  const [noteLoading, setNoteLoading] = useState(false);
  const [noteSaving, setNoteSaving] = useState(false);

  useEffect(() => {
    if (!showNotes || !isMember || contentId == null) return;
    setNoteLoading(true);
    fetchNotes('VIDEO_SERMON', contentId)
      .then((notes) => setNote(notes[0]?.body ?? ''))
      .catch(() => {})
      .finally(() => setNoteLoading(false));
  }, [showNotes, isMember, contentId]);

  async function saveNote() {
    if (contentId == null) return;
    setNoteSaving(true);
    try {
      await upsertNote('VIDEO_SERMON', contentId, note);
    } catch {
      // best-effort - the text stays in the field either way
    } finally {
      setNoteSaving(false);
    }
  }

  function onAction(key: 'save' | 'share' | 'notes') {
    if (key === 'save') return toggleSaved();
    if (key === 'share') {
      Share.share({ message: title ? `${title} — The Beacon Centre` : 'The Beacon Centre' }).catch(() => {});
      return;
    }
    if (key === 'notes') {
      if (!isMember) {
        Alert.alert('Sign in to take notes', 'Sermon notes will need an account.', [
          { text: 'Not now', style: 'cancel' },
          { text: 'Sign in', onPress: () => router.push('/auth') },
        ]);
        return;
      }
      setShowNotes((v) => !v);
      return;
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.ground }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + r.s(30) }}>
        <View style={{ height: r.vs(240), backgroundColor: '#000' }}>
          {youtubeId ? (
            <YouTubePlayer youtubeId={String(youtubeId)} title={title} autoplay={false} height={240} rad="xs" style={{ borderRadius: 0, height: '100%' }} />
          ) : (
            <MediaTile source={COVER} height={240} rad="xs" style={{ borderRadius: 0, height: '100%' }}>
              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ width: r.s(62), height: r.s(62), borderRadius: 99, backgroundColor: colors.teal, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="play" size={r.s(24)} color={colors.tealInk} />
                </View>
              </View>
            </MediaTile>
          )}
          <Pressable
            onPress={() => router.back()}
            accessibilityLabel="Back"
            style={{ position: 'absolute', top: r.s(8), left: r.s(16), width: r.s(44), height: r.s(44), borderRadius: 99, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="chevron-back" size={r.s(20)} color="#fff" />
          </Pressable>
        </View>

        <View style={{ padding: r.s(18), maxWidth: r.contentWidth, width: '100%', alignSelf: 'center' }}>
          <Text size={22} weight="extra" lh={1.25} track={-0.025}>
            {title || 'The Beacon Centre'}
          </Text>

          <Row gap={10} style={{ marginTop: r.s(14) }}>
            <View style={{ width: r.s(34), height: r.s(34), borderRadius: 99, backgroundColor: colors.teal, alignItems: 'center', justifyContent: 'center' }}>
              <Image source={LOGO_WHITE} style={{ width: r.s(20), height: r.s(20) }} resizeMode="contain" />
            </View>
            <View style={{ flex: 1 }}>
              <Text size={13} weight="bold">The Beacon Centre</Text>
            </View>
          </Row>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: r.s(8), marginTop: r.s(16) }}>
            {(
              [
                { key: 'save' as const, icon: saved ? 'bookmark' : 'bookmark-outline', label: saved ? 'Saved' : 'Save', disabled: contentId == null },
                { key: 'share' as const, icon: 'share-outline', label: 'Share', disabled: false },
                { key: 'notes' as const, icon: 'create-outline', label: 'Notes', disabled: contentId == null },
              ]
            ).map((a) => (
              <Pressable key={a.key} onPress={() => !a.disabled && onAction(a.key)} disabled={a.disabled}>
                <Row gap={6} style={{ minHeight: r.s(42), paddingVertical: r.s(10), paddingHorizontal: r.s(14), borderRadius: radius.sm, backgroundColor: a.key === 'save' && saved ? colors.tealPale : colors.surface, opacity: a.disabled ? 0.5 : 1 }}>
                  <Ionicons name={a.icon as any} size={r.s(14)} color={a.key === 'save' && saved ? colors.tealDeep : colors.ink} />
                  <Text size={12} weight="semibold" color={a.key === 'save' && saved ? colors.tealDeep : colors.ink}>{a.label}</Text>
                </Row>
              </Pressable>
            ))}
          </ScrollView>

          {description ? (
            <Text size={13.5} lh={1.7} color={colors.inkSoft} style={{ marginTop: r.s(18) }}>
              {description}
            </Text>
          ) : null}

          {showNotes ? (
            <Card style={{ marginTop: r.s(14) }}>
              <Kicker>My notes</Kicker>
              {noteLoading ? (
                <ActivityIndicator color={colors.teal} style={{ marginTop: r.s(10) }} />
              ) : (
                <>
                  <TextInput
                    value={note}
                    onChangeText={setNote}
                    onBlur={saveNote}
                    placeholder="Add a note on this message…"
                    placeholderTextColor={colors.faint}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    style={{ minHeight: r.s(90), marginTop: r.s(10), fontSize: r.fs(13.5), color: colors.ink }}
                  />
                  {noteSaving ? <Text size={10.5} color={colors.faint} style={{ marginTop: r.s(6) }}>Saving…</Text> : null}
                </>
              )}
            </Card>
          ) : null}

          {/* Comments live on YouTube, not here. Showing them in the app would
              make this user-generated content, which App Store guideline 1.2
              requires us to filter, report, block and staff - all four, not
              just one. Linking out keeps the conversation where it is already
              moderated. */}
          <Pressable
            onPress={() => youtubeId && Linking.openURL(watchUrl(youtubeId))}
            disabled={!youtubeId}
            accessibilityRole="button"
            accessibilityLabel="View comments on YouTube"
            accessibilityHint="Opens this message on YouTube"
            style={{ marginTop: r.s(24), minHeight: HIT, justifyContent: 'center', opacity: youtubeId ? 1 : 0 }}
          >
            {({ pressed }) => (
              <Row gap={10} style={{ opacity: pressed ? 0.6 : 1 }}>
                <Ionicons name="chatbubble-ellipses-outline" size={r.s(16)} color={colors.inkSoft} />
                <Text size={13} weight="bold" color={colors.inkSoft} style={{ flex: 1 }}>
                  View comments on YouTube
                </Text>
                <Ionicons name="open-outline" size={r.s(15)} color={colors.faint} />
              </Row>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
