import React, { useCallback, useEffect, useState } from 'react';
import { View, Image, Pressable, ScrollView, RefreshControl, Share } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, useResponsive, font, HIT } from '@/theme';
import { Screen, Text, Card, Btn, Progress, SectionHead, MediaTile, Row, Kicker } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/services/auth';
import { usePlayer } from '@/services/player';
import { fetchHome, fetchNextService, getViewedAnnouncementIds, markAnnouncementsViewed } from '@/services/api';
import { checkLive } from '@/services/youtube';
import { fetchProjects, ProjectWithProgress } from '@/services/giving';
import { COVER, LOGO_DARK, verse as fallbackVerse, short as money, naira } from '@/data/content';

/** Kobo string (BigInt over JSON) -> whole Naira number - see give.tsx's identical helper. */
const koboToNaira = (kobo: string) => Math.round(Number(kobo) / 100);

const GUEST_STRIP_DISMISSED_KEY = 'tbc_guest_strip_dismissed';

export default function Home() {
  const r = useResponsive();
  const { isMember, user } = useAuth();
  const firstName = (user?.displayName || user?.email?.split('@')[0] || '').trim().split(/\s+/)[0];
  const { data: projects } = useAsync<ProjectWithProgress[]>(() => fetchProjects(), [], []);
  const p = projects[0];

  const [viewedAnnouncementIds, setViewedAnnouncementIds] = useState<string[]>([]);
  const [guestStripDismissed, setGuestStripDismissed] = useState(false);

  // Re-read on every focus, not just mount - the News tab can mark
  // announcements viewed while this screen stays mounted in the background,
  // and that write needs to reach this screen when the user comes back.
  useFocusEffect(
    useCallback(() => {
      getViewedAnnouncementIds().then(setViewedAnnouncementIds);
    }, [])
  );

  useEffect(() => {
    AsyncStorage.getItem(GUEST_STRIP_DISMISSED_KEY).then((v) => {
      if (v === '1') setGuestStripDismissed(true);
    });
  }, []);

  const dismissGuestStrip = () => {
    setGuestStripDismissed(true);
    AsyncStorage.setItem(GUEST_STRIP_DISMISSED_KEY, '1').catch(() => {});
  };

  const markAnnouncementViewed = (id: string) => {
    setViewedAnnouncementIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    markAnnouncementsViewed([id]).catch(() => {});
  };

  // Backend sync is the source of truth for content now - checkLive() and
  // fetchNextService() are separate best-effort calls (live detection has no
  // backend equivalent, and the schedule call degrades to null rather than
  // breaking the screen).
  const { data, loading, refresh } = useAsync(
    async () => {
      const [fs, live, upcoming] = await Promise.all([
        fetchHome(),
        checkLive().catch(() => ({ live: false as const })),
        fetchNextService().catch(() => null),
      ]);
      return { ...fs, live, upcoming };
    },
    { quote: null, devotional: null, excerpts: [], inspirationals: [], sermons: [], audio: [], announcements: [], live: { live: false as const }, upcoming: null, collage: null },
    []
  );

  const quoteText = data.quote?.content ?? fallbackVerse.text;
  const quoteRef = data.quote?.author ?? fallbackVerse.ref;
  const topAnnouncement = data.announcements.find((a) => !viewedAnnouncementIds.includes(a.id));
  const audioCount = data.audio.length;

  // youtubeId is what /player/shorts actually embeds - id alone (the backend
  // row id) isn't a playable video id. EXCERPT (clipped from a sermon) and
  // INSPIRATIONAL (standalone short) are both short-form by definition.
  const shortsRail = [...data.excerpts, ...data.inspirationals].map((v) => ({ id: v.id, youtubeId: v.youtubeId, title: v.title, duration: v.duration ?? '', views: v.preacher, thumb: v.thumbnailUrl ? { uri: v.thumbnailUrl } : COVER }));

  return (
    <>
      <Screen
        padBottom={190}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.teal} />}
      >
        <Row style={{ justifyContent: 'space-between', paddingHorizontal: r.s(4) }}>
          <Row gap={9}>
            <Image source={LOGO_DARK} style={{ width: r.s(26), height: r.s(26) }} resizeMode="contain" />
            <Text size={13} weight="extra" track={-0.01}>The Beacon Centre</Text>
          </Row>
          <Row gap={8}>
            <Pressable
              accessibilityLabel="Notifications"
              onPress={() => router.push('/(tabs)/news')}
              style={{ width: r.s(44), height: r.s(44), borderRadius: 99, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="notifications-outline" size={r.s(18)} color={colors.ink} />
              {data.announcements.length ? (
                <View style={{ position: 'absolute', top: r.s(9), right: r.s(11), width: r.s(9), height: r.s(9), borderRadius: 99, backgroundColor: colors.teal, borderWidth: 2, borderColor: colors.surface }} />
              ) : null}
            </Pressable>
            <Pressable
              accessibilityLabel={isMember ? 'Profile and settings' : 'Sign in'}
              onPress={() => router.push('/settings')}
              style={{ height: r.s(44), minWidth: r.s(44), paddingHorizontal: isMember ? 0 : r.s(15), borderRadius: 99, backgroundColor: isMember ? colors.ink : colors.surface, alignItems: 'center', justifyContent: 'center' }}
            >
              {isMember ? (
                <Text size={14} weight="extra" color="#fff">
                  {(user?.displayName || user?.email || 'A')[0].toUpperCase()}
                </Text>
              ) : (
                <Text size={12} weight="bold">Sign in</Text>
              )}
            </Pressable>
          </Row>
        </Row>

        <View style={{ paddingHorizontal: r.s(4), paddingTop: r.s(24) }}>
          <Text size={34} weight="extra" lh={1.04} track={-0.035}>
            {greeting()}{isMember ? `, ${firstName}.` : '.'}{'\n'}
            <Text size={34} weight="extra" lh={1.04} track={-0.035} color={colors.tealDeep}>Stay lit today.</Text>
          </Text>
        </View>

        {!isMember && !guestStripDismissed ? <GuestStrip onClose={dismissGuestStrip} /> : null}

        {topAnnouncement ? (
          <Pressable onPress={() => { markAnnouncementViewed(topAnnouncement.id); router.push('/(tabs)/news'); }}>
            <Row gap={11} style={{ marginTop: r.s(18), padding: r.s(14), borderRadius: radius.lg, backgroundColor: colors.ink }}>
              <View style={{ width: r.s(34), height: r.s(34), borderRadius: radius.sm, backgroundColor: colors.teal, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="send" size={r.s(15)} color={colors.tealInk} />
              </View>
              <View style={{ flex: 1 }}>
                <Kicker color={colors.teal}>Announcement</Kicker>
                <Text size={13} weight="bold" lh={1.35} color="#fff" numberOfLines={2} style={{ marginTop: r.s(3) }}>
                  {topAnnouncement.title || topAnnouncement.description}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={r.s(16)} color="rgba(255,255,255,0.7)" />
            </Row>
          </Pressable>
        ) : null}

        {/* Verse of the day — the one magenta surface in the whole app. */}
        <Pressable onPress={() => router.push('/devotional')}>
          <View style={{ marginTop: r.s(12), borderRadius: radius.xxl, padding: r.s(22), backgroundColor: colors.verse, overflow: 'hidden' }}>
            <View style={{ position: 'absolute', top: -r.s(50), right: -r.s(40), width: r.s(170), height: r.s(170), borderRadius: 999, backgroundColor: colors.verseLift }} />
            <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Kicker color="rgba(255,255,255,0.85)">Verse of the day</Kicker>
              <Row gap={3} style={{ alignItems: 'center' }}>
                <Text size={10.5} weight="bold" color="rgba(255,255,255,0.75)">Read devotional</Text>
                <Ionicons name="chevron-forward" size={r.s(13)} color="rgba(255,255,255,0.75)" />
              </Row>
            </Row>
            <Text size={31} color="#fff" lh={1.22} style={{ fontFamily: font.serif, marginTop: r.s(14) }}>
              {quoteText}
            </Text>
            <Row style={{ justifyContent: 'space-between', marginTop: r.s(22) }}>
              <View style={{ paddingVertical: r.s(8), paddingHorizontal: r.s(13), borderRadius: radius.sm, backgroundColor: 'rgba(0,0,0,0.22)' }}>
                <Text size={11.5} weight="bold" color="#fff">{quoteRef}</Text>
              </View>
              <Btn
                label="Share"
                tone="ink"
                left={<Ionicons name="share-outline" size={r.s(13)} color="#fff" />}
                style={{ paddingVertical: r.s(11) }}
                onPress={() => Share.share({ message: `"${quoteText}" — ${quoteRef}\n\nThe Beacon Centre` }).catch(() => {})}
              />
            </Row>
          </View>
        </Pressable>

        {(() => {
          const featured = data.sermons.find((s) => s.isFeatured);
          if (!featured) return null;
          return (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/player/message',
                  params: { id: featured.id, youtubeId: featured.youtubeId ?? '', title: featured.title, description: featured.description ?? '' },
                })
              }
            >
              <View style={{ marginTop: r.s(12), borderRadius: radius.xl, backgroundColor: colors.surface, overflow: 'hidden' }}>
                <MediaTile source={featured.thumbnailUrl ? { uri: featured.thumbnailUrl } : COVER} height={170} rad="xs" scrim={false} style={{ borderRadius: 0 }}>
                  {featured.categoryName ? (
                    <View style={{ position: 'absolute', top: r.s(10), right: r.s(10), paddingVertical: r.s(5), paddingHorizontal: r.s(9), borderRadius: r.s(7), backgroundColor: 'rgba(18,16,15,0.85)' }}>
                      <Text size={9} weight="extra" color="#fff" track={0.06}>{featured.categoryName.toUpperCase()}</Text>
                    </View>
                  ) : null}
                </MediaTile>
                <View style={{ padding: r.s(16) }}>
                  <Text size={16} weight="bold" lh={1.3} numberOfLines={2}>{featured.title}</Text>
                  {featured.preacher ? (
                    <Text size={11.5} weight="semibold" color={colors.muted} style={{ marginTop: r.s(5) }}>{featured.preacher}</Text>
                  ) : null}
                </View>
              </View>
            </Pressable>
          );
        })()}

        {data.collage ? (
          <Pressable onPress={() => router.push({ pathname: '/gallery/[id]', params: { id: data.collage!.id } })}>
            <View style={{ marginTop: r.s(20), borderRadius: radius.xl, overflow: 'hidden' }}>
              <MediaTile source={{ uri: data.collage.coverImageUrl }} height={160} rad="xs" style={{ borderRadius: 0 }}>
                <View style={{ padding: r.s(16) }}>
                  <Kicker color="rgba(255,255,255,0.85)">Today's photos</Kicker>
                  <Text size={17} weight="extra" color="#fff" style={{ marginTop: r.s(4) }}>
                    {data.collage.photos.length} photo{data.collage.photos.length === 1 ? '' : 's'} from today
                  </Text>
                </View>
              </MediaTile>
            </View>
          </Pressable>
        ) : null}

        <SectionHead title="Shorts" action="See all" onAction={() => router.push('/(tabs)/watch')} />
        {shortsRail.length === 0 ? (
          <Text size={12.5} color={colors.muted}>No shorts yet, check back soon.</Text>
        ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: r.s(9), paddingRight: r.s(4) }}>
          {shortsRail.slice(0, 8).map((sh, i) => (
            <Pressable
              key={sh.id}
              onPress={() =>
                router.push({
                  pathname: '/player/shorts',
                  params: { youtubeId: sh.youtubeId ?? '', title: sh.title },
                })
              }
            >
              <MediaTile source={sh.thumb} width={120} height={198}>
                {i === 0 ? (
                  <View style={{ position: 'absolute', top: r.s(9), left: r.s(9), paddingVertical: r.s(5), paddingHorizontal: r.s(8), borderRadius: r.s(7), backgroundColor: colors.live }}>
                    <Text size={8.5} weight="extra" color="#fff" track={0.06}>SHORT</Text>
                  </View>
                ) : null}
                <View style={{ padding: r.s(10) }}>
                  <Text size={11.5} weight="bold" lh={1.25} color="#fff" numberOfLines={2}>{sh.title}</Text>
                  <Text size={9} weight="semibold" color="rgba(255,255,255,0.62)" style={{ marginTop: r.s(3) }}>
                    {[sh.duration, sh.views].filter(Boolean).join(' · ')}
                  </Text>
                </View>
              </MediaTile>
            </Pressable>
          ))}
        </ScrollView>
        )}

        <Row gap={10} style={{ marginTop: r.s(20), alignItems: 'stretch' }}>
          <Pressable style={{ flex: 1 }} onPress={() => router.push('/(tabs)/listen')}>
            <View style={{ flex: 1, minHeight: r.s(150), borderRadius: radius.xl, padding: r.s(18), backgroundColor: colors.teal, justifyContent: 'space-between' }}>
              <Kicker color={colors.tealInk}>Audio sermons</Kicker>
              <View>
                <Text size={46} weight="extra" lh={1} track={-0.045} color={colors.tealInk}>{audioCount}</Text>
                <Text size={12} weight="semibold" color="rgba(4,33,27,0.7)" style={{ marginTop: r.s(3) }}>play offline</Text>
              </View>
            </View>
          </Pressable>
          <Pressable style={{ flex: 1 }} onPress={() => router.push('/live')}>
            <MediaTile source={data.live.live ? { uri: data.live.thumb } : COVER} height={150} rad="xl" style={{ flex: 1 }}>
              <View style={{ padding: r.s(16) }}>
                <Row gap={6} style={{ alignSelf: 'flex-start', paddingVertical: r.s(5), paddingHorizontal: r.s(9), borderRadius: r.s(8), backgroundColor: data.live.live ? colors.live : 'rgba(255,255,255,0.2)' }}>
                  {data.live.live ? <View style={{ width: r.s(6), height: r.s(6), borderRadius: 99, backgroundColor: '#fff' }} /> : null}
                  <Text size={9} weight="extra" color="#fff" track={0.08}>
                    {data.live.live ? 'LIVE NOW' : data.upcoming ? `${data.upcoming.day.slice(0, 3).toUpperCase()} ${data.upcoming.time}` : 'UPCOMING'}
                  </Text>
                </Row>
                <Text size={15} weight="bold" lh={1.2} color="#fff" numberOfLines={2} style={{ marginTop: r.s(9) }}>
                  {data.live.live ? data.live.title : data.upcoming?.name ?? 'Sunday\nService'}
                </Text>
              </View>
            </MediaTile>
          </Pressable>
        </Row>

        {p ? (
          <Card style={{ marginTop: r.s(10) }} pad={20} rad="xl">
            <Row style={{ justifyContent: 'space-between' }}>
              <Kicker>Building project</Kicker>
              <Text size={15} weight="extra" color={colors.tealDeep}>{p.progressPct}%</Text>
            </Row>
            <Text size={20} weight="extra" lh={1.2} track={-0.025} style={{ marginTop: r.s(10) }}>{p.title}</Text>
            <View style={{ marginTop: r.s(16) }}><Progress value={p.progressPct / 100} /></View>
            <Row style={{ justifyContent: 'space-between', marginTop: r.s(11), alignItems: 'baseline' }}>
              <Text size={14} weight="extra">
                {naira(koboToNaira(p.raisedAmount))} <Text size={12} weight="semibold" color={colors.muted}>of {money(koboToNaira(p.targetAmount))}</Text>
              </Text>
              <Text size={11.5} weight="semibold" color={colors.muted}>{p.donorCount} givers</Text>
            </Row>
            <Btn full label="Sow into this project" tone="ink" style={{ marginTop: r.s(16) }} onPress={() => router.push('/(tabs)/give')} />
          </Card>
        ) : null}

        <View style={{ marginTop: r.s(10), borderRadius: radius.xl, padding: r.s(20), backgroundColor: colors.tealDark }}>
          <Kicker color={colors.tealLight}>Community group</Kicker>
          <Text size={19} weight="extra" lh={1.2} color="#fff" style={{ marginTop: r.s(8) }}>Not in a CSG yet?</Text>
          <Text size={12} lh={1.55} color="rgba(255,255,255,0.6)" style={{ marginTop: r.s(6) }}>
            Community Service Groups meet in person each week. Join one and its updates land right here.
          </Text>
          <Btn label="Find a CSG near me" style={{ marginTop: r.s(14) }} onPress={() => router.push('/csg')} />
        </View>
      </Screen>

      <MiniPlayer />
    </>
  );
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Morning' : h < 17 ? 'Afternoon' : 'Evening';
}

function GuestStrip({ onClose }: { onClose: () => void }) {
  const r = useResponsive();
  return (
    <Row gap={12} style={{ marginTop: r.s(18), padding: r.s(14), borderRadius: radius.lg, backgroundColor: colors.surfaceAlt }}>
      <View style={{ width: r.s(34), height: r.s(34), borderRadius: r.s(11), backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="bookmark-outline" size={r.s(17)} color={colors.ink} />
      </View>
      <View style={{ flex: 1 }}>
        <Text size={12.5} weight="bold">Browsing as a guest</Text>
        <Text size={11} lh={1.5} color={colors.muted} style={{ marginTop: r.s(3) }}>Saves stay on this phone until you sign in.</Text>
      </View>
      <Btn
        label="Sign in"
        tone="ink"
        style={{ paddingVertical: r.s(9), paddingHorizontal: r.s(13) }}
        onPress={() => router.push('/auth')}
      />
      <Pressable accessibilityLabel="Dismiss" hitSlop={HIT} onPress={onClose}>
        <Ionicons name="close" size={r.s(16)} color={colors.muted} />
      </Pressable>
    </Row>
  );
}

function MiniPlayer() {
  const r = useResponsive();
  const insets = useSafeAreaInsets();
  const { current, isPlaying, positionMs, durationMs, toggle } = usePlayer();
  // Matches (tabs)/_layout.tsx's TabBar formula (bottom inset + its height +
  // a gap) so this floats just above the tab bar on every device instead of
  // a fixed offset that only happened to clear Android's smaller inset.
  const tabBarTop = Math.max(insets.bottom, r.s(14)) + r.s(62);

  if (!current) return null;
  const progress = durationMs > 0 ? positionMs / durationMs : 0;

  return (
    <Pressable
      onPress={() => router.push('/player/audio')}
      style={{
        position: 'absolute', left: r.s(14), right: r.s(14), bottom: tabBarTop + r.s(14),
        maxWidth: r.contentWidth, alignSelf: 'center',
        borderRadius: radius.lg, padding: r.s(10), backgroundColor: colors.ink,
        flexDirection: 'row', alignItems: 'center', gap: r.s(11),
      }}
    >
      <Image source={current.imageUrl ? { uri: current.imageUrl } : COVER} style={{ width: r.s(44), height: r.s(44), borderRadius: radius.sm }} />
      <View style={{ flex: 1 }}>
        <Text size={12.5} weight="bold" color="#fff" numberOfLines={1}>{current.title}</Text>
        <View style={{ marginTop: r.s(7) }}><Progress value={progress} height={3} track="rgba(255,255,255,0.2)" /></View>
      </View>
      <Pressable
        onPress={toggle}
        hitSlop={8}
        style={{ width: r.s(38), height: r.s(38), borderRadius: 99, backgroundColor: colors.teal, alignItems: 'center', justifyContent: 'center' }}
      >
        <Ionicons name={isPlaying ? 'pause' : 'play'} size={r.s(16)} color={colors.tealInk} />
      </Pressable>
    </Pressable>
  );
}
