import React, { useEffect, useState } from 'react';
import { View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, useResponsive } from '@/theme';
import { Text, Row, MediaTile, Btn } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { checkLive, liveViewers, embedHtml, EMBED_ORIGIN } from '@/services/youtube';
import { apiGet } from '@/config/api';
import { COVER } from '@/data/content';

/**
 * Live service.
 *
 * Uses the real search?eventType=live check (see services/youtube.ts). When
 * the church is not streaming we show the schedule instead of pretending the
 * newest upload is live — which is what the current app does.
 *
 * Live chat is not implemented — YouTube's native live chat can't be embedded
 * outside YouTube's own player, so this screen shows an honest "not
 * available" note instead of a fake chat feed.
 */
type ServiceItem = { name: string; dayOfWeek: number; time: string; timezone?: string; notes?: string };

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Picks the soonest service from today onward (ties keep list order). */
function nextService(list: ServiceItem[]): { name: string; day: string; time: string } | null {
  if (!list.length) return null;
  const todayIdx = new Date().getDay();
  const sorted = [...list].sort((a, b) => {
    const da = (a.dayOfWeek - todayIdx + 7) % 7;
    const db = (b.dayOfWeek - todayIdx + 7) % 7;
    return da - db;
  });
  const s = sorted[0];
  return { name: s.name, day: DAY_NAMES[s.dayOfWeek] ?? '', time: s.time };
}

export default function Live() {
  const r = useResponsive();
  const insets = useSafeAreaInsets();
  const [viewers, setViewers] = useState<number | null>(null);

  const { data: state } = useAsync(checkLive, { live: false as const }, []);
  const { data: schedule } = useAsync(() => apiGet<ServiceItem[]>('/live-schedule'), [] as ServiceItem[], []);
  const upcoming = nextService(schedule);

  useEffect(() => {
    if (!state.live) return;
    const tick = () => liveViewers(state.videoId).then(setViewers);
    tick();
    const t = setInterval(tick, 30_000);
    return () => clearInterval(t);
  }, [state]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.ink, paddingTop: insets.top }}>
      <View style={{ height: r.vs(230), backgroundColor: '#000' }}>
        {state.live ? (
          <WebView
            source={{ html: embedHtml(state.videoId), baseUrl: EMBED_ORIGIN }}
            style={{ flex: 1, backgroundColor: '#000' }}
            allowsInlineMediaPlayback
            allowsFullscreenVideo
            javaScriptEnabled
          />
        ) : (
          <MediaTile source={COVER} height={230} rad="xs" style={{ borderRadius: 0, height: '100%' }} />
        )}

        <Row style={{ position: 'absolute', top: r.s(8), left: r.s(16), right: r.s(16), justifyContent: 'space-between' }}>
          <Pressable
            onPress={() => router.back()}
            accessibilityLabel="Back"
            style={{ width: r.s(44), height: r.s(44), borderRadius: 99, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="chevron-back" size={r.s(20)} color="#fff" />
          </Pressable>
          {state.live ? (
            <Row gap={7} style={{ paddingVertical: r.s(6), paddingHorizontal: r.s(11), borderRadius: r.s(9), backgroundColor: colors.live }}>
              <View style={{ width: r.s(6), height: r.s(6), borderRadius: 99, backgroundColor: '#fff' }} />
              <Text size={10} weight="extra" color="#fff" track={0.1}>LIVE</Text>
            </Row>
          ) : null}
          {viewers ? (
            <View style={{ paddingVertical: r.s(6), paddingHorizontal: r.s(11), borderRadius: r.s(9), backgroundColor: 'rgba(0,0,0,0.55)' }}>
              <Text size={11} weight="bold" color="#fff">{viewers} watching</Text>
            </View>
          ) : <View style={{ width: r.s(44) }} />}
        </Row>
      </View>

      <View style={{ paddingHorizontal: r.s(16), paddingTop: r.s(18), flex: 1, maxWidth: r.contentWidth, width: '100%', alignSelf: 'center' }}>
        {state.live ? (
          <>
            <Text size={21} weight="extra" lh={1.25} track={-0.025} color={colors.onDark} numberOfLines={2}>{state.title}</Text>
            <Text size={12} color={colors.onDarkMuted} style={{ marginTop: r.s(7) }}>
              {upcoming ? `Live now · ${upcoming.day} ${upcoming.time}` : 'Live now'}
            </Text>
          </>
        ) : (
          <>
            <Text size={21} weight="extra" lh={1.25} track={-0.025} color={colors.onDark}>We're not live right now</Text>
            <Text size={12} lh={1.6} color={colors.onDarkMuted} style={{ marginTop: r.s(7) }}>
              {upcoming
                ? `Next: ${upcoming.name}, ${upcoming.day} ${upcoming.time}. Turn on notifications and we'll tell you the moment it starts.`
                : "Turn on notifications and we'll tell you the moment it starts."}
            </Text>
          </>
        )}

        <Row gap={9} style={{ marginTop: r.s(16) }}>
          <Btn label={state.live ? 'Give now' : 'Notify me'} full style={{ flex: 1 }} left={<Ionicons name={state.live ? 'heart' : 'notifications-outline'} size={r.s(15)} color={colors.tealInk} />} onPress={() => router.push(state.live ? '/(tabs)/give' : '/settings')} />
          <Btn label="Take notes" style={{ flex: 1, backgroundColor: '#241F1C' }} />
          <Pressable
            accessibilityLabel="Share"
            style={{ width: r.s(48), minHeight: r.s(48), borderRadius: radius.md, backgroundColor: '#241F1C', alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="share-outline" size={r.s(17)} color={colors.onDark} />
          </Pressable>
        </Row>

        <Row gap={8} style={{ marginTop: r.s(22) }}>
          <Text size={16} weight="extra" color={colors.onDark}>Live chat</Text>
          {viewers ? (
            <View style={{ paddingVertical: r.s(4), paddingHorizontal: r.s(9), borderRadius: r.s(8), backgroundColor: '#241F1C' }}>
              <Text size={10} weight="bold" color={colors.onDarkMuted}>{viewers} here</Text>
            </View>
          ) : null}
        </Row>

        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: insets.bottom + r.s(14) }}>
          <Ionicons name="chatbubble-ellipses-outline" size={r.s(22)} color={colors.onDarkMuted} />
          <Text size={12} lh={1.6} color={colors.onDarkMuted} style={{ marginTop: r.s(10), textAlign: 'center', maxWidth: r.s(260) }}>
            In-app chat isn't available yet. Join the conversation on YouTube while you watch.
          </Text>
        </View>
      </View>
    </View>
  );
}
