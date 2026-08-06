import React, { useState } from 'react';
import { View, Pressable, Alert, Share, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, font, useResponsive } from '@/theme';
import { Screen, Text, Row, Btn, Kicker } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { useSaved } from '@/hooks/useSaved';
import { fetchDevotional, fetchDailyQuote } from '@/services/api';
import { upsertProgress } from '@/services/userData';
import { useAuth } from '@/services/auth';

export default function DevotionalScreen() {
  const r = useResponsive();
  const insets = useSafeAreaInsets();

  const { data, loading } = useAsync(
    async () => {
      const [d, q] = await Promise.all([fetchDevotional().catch(() => null), fetchDailyQuote().catch(() => null)]);
      return { d, q };
    },
    { d: null, q: null },
    []
  );

  const devotionalId = data.d?.id ? Number(data.d.id) : null;
  const { saved, toggle: toggleSaved } = useSaved('DEVOTIONAL', devotionalId);
  const { isMember } = useAuth();
  const [markedRead, setMarkedRead] = useState(false);

  async function markAsRead() {
    if (!isMember || devotionalId == null) {
      Alert.alert('Sign-in coming soon', 'Marking devotionals as read will need an account.');
      return;
    }
    setMarkedRead(true);
    try {
      await upsertProgress('DEVOTIONAL', devotionalId, 0, undefined, true);
    } catch {
      setMarkedRead(false);
    }
  }

  // Everything comes from the backend. There is no placeholder devotional to
  // fall back on - showing invented scripture and prayer when the admin hasn't
  // published for the day is worse than showing nothing, so an empty day gets
  // an explicit empty state below instead.
  const title = data.d?.title ?? '';
  const passage = data.d?.verse || data.q?.content || '';
  const ref = data.d?.passage ?? '';
  const prayer = data.d?.prayer ?? '';

  async function shareToday() {
    const message = `"${passage}" — ${ref}\n\n${title}\n\nThe Beacon Centre`;
    try {
      await Share.share(data.d?.cardImageUrl ? { url: data.d.cardImageUrl, message } : { message });
    } catch {}
  }

  const day = data.d?.date
    ? new Date(data.d.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    : '';
  // The backend stores the body as one blob; split on blank lines into paragraphs.
  const paras = data.d?.content ? data.d.content.split(/\n{2,}|\r\n\r\n/).filter(Boolean) : [];

  return (
    <>
      <Screen padBottom={110}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Pressable
            onPress={() => router.back()}
            accessibilityLabel="Back"
            style={{ width: r.s(44), height: r.s(44), borderRadius: radius.sm, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="chevron-back" size={r.s(19)} color={colors.ink} />
          </Pressable>
          <Row gap={8}>
            <Pressable
              accessibilityLabel={saved ? 'Unsave' : 'Save'}
              onPress={toggleSaved}
              disabled={devotionalId == null}
              style={{ width: r.s(44), height: r.s(44), borderRadius: radius.sm, backgroundColor: colors.teal, alignItems: 'center', justifyContent: 'center', opacity: devotionalId == null ? 0.5 : 1 }}
            >
              <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={r.s(17)} color={colors.tealInk} />
            </Pressable>
          </Row>
        </Row>

        {loading ? (
          <ActivityIndicator color={colors.teal} style={{ marginTop: r.s(48) }} />
        ) : !data.d ? (
          <View style={{ marginTop: r.s(36), padding: r.s(24), borderRadius: radius.lg, backgroundColor: colors.surface, alignItems: 'center' }}>
            <Ionicons name="book-outline" size={r.s(26)} color={colors.faint} />
            <Text size={15.5} weight="extra" style={{ marginTop: r.s(12), textAlign: 'center' }}>
              No devotional yet today
            </Text>
            <Text size={12.5} lh={1.6} color={colors.muted} style={{ marginTop: r.s(7), textAlign: 'center' }}>
              Today's word hasn't been published. Please check back a little later.
            </Text>
          </View>
        ) : (
          <>
            {day ? <Kicker color={colors.tealDeep} style={{ marginTop: r.s(28) }}>{day}</Kicker> : null}
            <Text size={33} weight="extra" lh={1.12} track={-0.035} style={{ marginTop: r.s(12) }}>{title}</Text>

            {/* the second and last magenta surface in the app */}
            {passage ? (
              <View style={{ marginTop: r.s(20), padding: r.s(20), borderRadius: radius.lg, backgroundColor: colors.verse }}>
                <Text size={22} lh={1.42} color="#fff" style={{ fontFamily: font.serif }}>{passage}</Text>
                {ref ? (
                  <Text size={11} weight="extra" track={0.1} color="rgba(255,255,255,0.8)" style={{ marginTop: r.s(14) }}>
                    {ref.toUpperCase()}
                  </Text>
                ) : null}
              </View>
            ) : null}

            {paras.map((p, i) => (
              <Text key={i} size={15.5} lh={1.85} weight="regular" color="#3C3833" style={{ marginTop: r.s(i ? 16 : 22) }}>
                {p}
              </Text>
            ))}

            {prayer ? (
              <View style={{ marginTop: r.s(22), padding: r.s(20), borderRadius: radius.lg, backgroundColor: colors.surface }}>
                <Kicker>Pray</Kicker>
                <Text size={14} lh={1.75} style={{ marginTop: r.s(9) }}>{prayer}</Text>
              </View>
            ) : null}

            <Btn
              label={markedRead ? 'Marked as read' : 'Mark as read'}
              tone={markedRead ? 'plain' : 'ink'}
              full
              style={{ marginTop: r.s(22) }}
              onPress={markAsRead}
            />
          </>
        )}
      </Screen>

      {/* Nothing to share on a day with no devotional. */}
      {data.d ? (
        <Row
          gap={10}
          style={{
            position: 'absolute', left: r.s(16), right: r.s(16), bottom: insets.bottom + r.s(14),
            maxWidth: r.contentWidth, alignSelf: 'center',
          }}
        >
          <Pressable onPress={shareToday} style={{ flex: 1 }}>
            <Row gap={12} style={{ paddingVertical: r.s(11), paddingHorizontal: r.s(16), borderRadius: radius.lg, backgroundColor: colors.ink }}>
              <Ionicons name="share-outline" size={r.s(18)} color={colors.teal} />
              <Text size={13} weight="bold" color="#fff" numberOfLines={1}>Share today's word</Text>
            </Row>
          </Pressable>
        </Row>
      ) : null}
    </>
  );
}
