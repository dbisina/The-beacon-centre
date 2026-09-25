import React from 'react';
import { View, Pressable, ScrollView, RefreshControl, Share, Linking, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, useResponsive, HIT } from '@/theme';
import { Text, Row, MediaTile, Btn, Card, Kicker, LiveDot } from '@/components/ui';
import { YouTubePlayer } from '@/components/YouTubePlayer';
import { useLiveStatus } from '@/hooks/useLiveStatus';
import { watchUrl } from '@/services/youtube';

/**
 * Live tab.
 *
 * Status comes from the backend (GET /api/live/status - see
 * services/youtube.ts fetchLiveStatus and hooks/useLiveStatus), which does
 * real keyless detection server-side. This screen just renders whichever of
 * three honest states it gets back - it no longer decides liveness itself
 * (the old local nextService() sorted by day-of-week only and ignored the
 * time of day, so a service that had already happened today still showed as
 * "next" until midnight).
 *
 * The channel streams rarely, so NOT LIVE is the correct, expected state
 * most of the time - it is not a bug when nothing is on.
 */
const POLL_MS = 45_000;

function tzAbbrev(timezone: string) {
  return timezone === 'Africa/Lagos' ? 'WAT' : timezone;
}

/** "2d 4h", "3h 12m", "42m", or "any moment" once the target has passed. */
function formatCountdown(targetIso: string, now: Date): string {
  const ms = new Date(targetIso).getTime() - now.getTime();
  if (ms <= 0) return 'any moment now';
  const mins = Math.round(ms / 60000);
  const days = Math.floor(mins / 1440);
  const hours = Math.floor((mins % 1440) / 60);
  const remMins = mins % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${remMins}m`;
  return `${Math.max(remMins, 1)}m`;
}

function localTimeLabel(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { weekday: 'long', hour: 'numeric', minute: '2-digit' });
}

export default function Live() {
  const r = useResponsive();
  const insets = useSafeAreaInsets();
  const { status, loading, refresh } = useLiveStatus(POLL_MS);
  const now = new Date();

  const deviceTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const nextService = status.nextService;
  const showTzNote = !!nextService && deviceTz !== nextService.timezone;

  // useLiveStatus's FALLBACK value (before the first response ever lands)
  // carries checkedAt = new Date(0) - a real response is never that old, so
  // this is how "still checking" is told apart from a confirmed "not live".
  const isChecking = loading && new Date(status.checkedAt).getTime() === 0;

  const heroTitle = isChecking
    ? 'Checking for a live stream…'
    : status.live
    ? status.video?.title ?? 'Live at The Beacon Centre'
    : status.upcoming
    ? status.video?.title ?? 'Starting soon'
    : "We're not live right now";

  function share() {
    if (!status.video) return;
    Share.share({
      message: `${status.video.title} — The Beacon Centre\n${watchUrl(status.video.youtubeId)}`,
    }).catch(() => {});
  }

  function openInYouTube() {
    if (!status.video) return;
    Linking.openURL(watchUrl(status.video.youtubeId)).catch(() => {});
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.ink, paddingTop: insets.top }}>
      {/* 16:9 of its own width, because that is the shape of the video. A fixed
          height letterboxed the player once the content column widened on a
          tablet. */}
      <View style={{ height: (Math.min(r.width, r.contentWidth) * 9) / 16, backgroundColor: '#000', maxWidth: r.contentWidth, width: '100%', alignSelf: 'center' }}>
        {status.live && status.video ? (
          <YouTubePlayer youtubeId={status.video.youtubeId} title={status.video.title} thumbnailUrl={status.video.thumbnailUrl} height={230} rad="xs" style={{ borderRadius: 0, height: '100%' }} />
        ) : status.video?.thumbnailUrl ? (
          <MediaTile source={{ uri: status.video.thumbnailUrl }} height={230} rad="xs" style={{ borderRadius: 0, height: '100%' }} />
        ) : (
          <View style={{ flex: 1, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="tv-outline" size={r.s(34)} color="rgba(255,255,255,0.25)" />
          </View>
        )}

        <Row style={{ position: 'absolute', top: r.s(8), left: r.s(16), right: r.s(16), justifyContent: 'space-between' }}>
          <Pressable
            onPress={() => router.back()}
            accessibilityLabel="Back"
            accessibilityRole="button"
            style={{ width: r.s(HIT), height: r.s(HIT), borderRadius: 99, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="chevron-back" size={r.s(20)} color="#fff" />
          </Pressable>
          {status.live ? (
            <Row gap={7} style={{ paddingVertical: r.s(6), paddingHorizontal: r.s(11), borderRadius: r.s(9), backgroundColor: colors.live }}>
              <LiveDot />
              <Text size={10} weight="extra" color="#fff" track={0.1}>LIVE</Text>
            </Row>
          ) : status.upcoming ? (
            <View style={{ paddingVertical: r.s(6), paddingHorizontal: r.s(11), borderRadius: r.s(9), backgroundColor: 'rgba(0,0,0,0.55)' }}>
              <Text size={10} weight="extra" color="#fff" track={0.1}>UPCOMING</Text>
            </View>
          ) : (
            <View style={{ width: r.s(HIT) }} />
          )}
          {status.live && status.video?.viewers ? (
            <View style={{ paddingVertical: r.s(6), paddingHorizontal: r.s(11), borderRadius: r.s(9), backgroundColor: 'rgba(0,0,0,0.55)' }}>
              <Text size={11} weight="bold" color="#fff">{status.video.viewers} watching</Text>
            </View>
          ) : (
            <View style={{ width: r.s(HIT) }} />
          )}
        </Row>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.teal} />}
        contentContainerStyle={{ paddingHorizontal: r.s(16), paddingTop: r.s(18), paddingBottom: insets.bottom + r.s(24), maxWidth: r.contentWidth, width: '100%', alignSelf: 'center' }}
      >
        <Text size={21} weight="extra" lh={1.25} track={-0.025} color={colors.onDark} numberOfLines={2}>
          {heroTitle}
        </Text>

        {status.live ? (
          <Text size={12} color={colors.onDarkMuted} style={{ marginTop: r.s(7) }}>Live now</Text>
        ) : status.upcoming && status.video?.scheduledStartTime ? (
          <Text size={12} color={colors.onDarkMuted} style={{ marginTop: r.s(7) }}>
            {new Date(status.video.scheduledStartTime).getTime() - now.getTime() <= 0
              ? 'Starting any moment now'
              : `Starts in ${formatCountdown(status.video.scheduledStartTime, now)}`}
          </Text>
        ) : null}

        {status.live ? (
          <Row gap={9} style={{ marginTop: r.s(16) }}>
            <Btn label="Share" full style={{ flex: 1 }} left={<Ionicons name="share-outline" size={r.s(15)} color={colors.tealInk} />} onPress={share} />
            <Btn label="Open in YouTube" tone="ink" full style={{ flex: 1 }} left={<Ionicons name="logo-youtube" size={r.s(15)} color="#fff" />} onPress={openInYouTube} />
          </Row>
        ) : null}

        {(status.live || status.upcoming) ? (
          <Pressable
            onPress={openInYouTube}
            hitSlop={8}
            accessibilityRole="button"
            style={{ marginTop: r.s(18), minHeight: HIT, justifyContent: 'center' }}
          >
            <Row gap={7}>
              <Ionicons name="chatbubble-ellipses-outline" size={r.s(15)} color={colors.onDarkMuted} />
              <Text size={12.5} weight="bold" color={colors.onDarkMuted}>Chat on YouTube</Text>
            </Row>
          </Pressable>
        ) : null}

        {!status.live && !status.upcoming ? (
          isChecking ? (
            <Card bg="#1B1815" style={{ marginTop: r.s(20) }} rad="lg">
              <Row gap={10} style={{ alignItems: 'center' }}>
                <ActivityIndicator color={colors.teal} />
                <Text size={13} color={colors.onDarkMuted}>Checking for a live stream…</Text>
              </Row>
            </Card>
          ) : (
            <>
              <Card bg="#1B1815" style={{ marginTop: r.s(20) }} rad="lg">
                <Kicker color={colors.onDarkMuted}>Next service</Kicker>
                {nextService ? (
                  <>
                    <Text size={17} weight="extra" color={colors.onDark} style={{ marginTop: r.s(6) }}>{nextService.name}</Text>
                    <Text size={13} color={colors.onDarkMuted} style={{ marginTop: r.s(4) }}>
                      {localTimeLabel(nextService.startsAt)} · in {formatCountdown(nextService.startsAt, now)}
                    </Text>
                    {showTzNote ? (
                      <Text size={11} color={colors.onDarkMuted} style={{ marginTop: r.s(4) }}>
                        That's {nextService.localLabel} {tzAbbrev(nextService.timezone)} - shown above in your device's time
                      </Text>
                    ) : null}
                  </>
                ) : (
                  <Text size={13} color={colors.onDarkMuted} style={{ marginTop: r.s(6) }}>
                    No upcoming service is scheduled yet.
                  </Text>
                )}
                <Btn
                  label="Notify me"
                  tone="plain"
                  style={{ marginTop: r.s(14), alignSelf: 'flex-start' }}
                  left={<Ionicons name="notifications-outline" size={r.s(14)} color={colors.ink} />}
                  onPress={() => router.push('/settings')}
                />
              </Card>

              {status.replay ? (
                <View style={{ marginTop: r.s(22) }}>
                  <Kicker color={colors.onDarkMuted}>Watch the latest service</Kicker>
                  <View style={{ marginTop: r.s(10) }}>
                    <YouTubePlayer
                      youtubeId={status.replay.youtubeId}
                      title={status.replay.title}
                      thumbnailUrl={status.replay.thumbnailUrl}
                      autoplay={false}
                      height={200}
                      rad="lg"
                    />
                  </View>
                  <Text size={13} weight="bold" color={colors.onDark} numberOfLines={2} style={{ marginTop: r.s(9) }}>
                    {status.replay.title}
                  </Text>
                </View>
              ) : null}
            </>
          )
        ) : null}
      </ScrollView>
    </View>
  );
}
