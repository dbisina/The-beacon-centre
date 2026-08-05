import React, { useEffect, useState } from 'react';
import { View, Pressable, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, useResponsive } from '@/theme';
import { Screen, Text, Row, Kicker } from '@/components/ui';
import { useAuth, readGuest, writeGuest, guestKeys } from '@/services/auth';

// verse/live/sermons share guestKeys.notifications with onboarding/setup.tsx's
// initial choice, so toggling here actually changes what was set there.
type NotifPrefs = { verse: boolean; live: boolean; sermons: boolean };
const DEFAULT_NOTIF_PREFS: NotifPrefs = { verse: true, live: true, sermons: false };
const WIFI_KEY = 'guest:wifi-only-downloads';

type RowDef = {
  label: string;
  sub?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  value?: string;
  badge?: string;
  toggle?: boolean;
  onPress?: () => void;
};

export default function Settings() {
  const r = useResponsive();
  const { isMember, user, logOut, deleteAccount } = useAuth();
  const [deleting, setDeleting] = useState(false);
  const [prefs, setPrefs] = useState<NotifPrefs>(DEFAULT_NOTIF_PREFS);
  const [wifiOnly, setWifiOnly] = useState(true);

  useEffect(() => {
    readGuest(guestKeys.notifications, DEFAULT_NOTIF_PREFS).then(setPrefs);
    readGuest(WIFI_KEY, true).then(setWifiOnly);
  }, []);

  const flip = (k: keyof NotifPrefs) =>
    setPrefs((p) => {
      const next = { ...p, [k]: !p[k] };
      writeGuest(guestKeys.notifications, next).catch(() => {});
      return next;
    });

  const flipWifi = () =>
    setWifiOnly((v) => {
      writeGuest(WIFI_KEY, !v).catch(() => {});
      return !v;
    });

  return (
    <Screen padBottom={20}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Pressable
          onPress={() => router.back()}
          accessibilityLabel="Back"
          style={{ width: r.s(44), height: r.s(44), borderRadius: radius.sm, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="chevron-back" size={r.s(19)} color={colors.ink} />
        </Pressable>
      </Row>
      <Text size={32} weight="extra" track={-0.035} style={{ marginTop: r.s(18) }}>Settings</Text>

      {/* profile */}
      <Pressable disabled={isMember} onPress={() => router.push('/auth')}>
        <Row gap={14} style={{ marginTop: r.s(18), padding: r.s(18), borderRadius: radius.lg, backgroundColor: colors.ink }}>
          <View style={{ width: r.s(56), height: r.s(56), borderRadius: 99, backgroundColor: isMember ? colors.teal : 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' }}>
            {isMember ? (
              <Text size={20} weight="extra" color={colors.tealInk}>{(user?.email ?? 'A')[0].toUpperCase()}</Text>
            ) : (
              <Ionicons name="person-outline" size={r.s(24)} color="#fff" />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text size={18} weight="extra" color="#fff">
              {isMember ? user?.displayName || user?.email?.split('@')[0] || 'Member' : 'Browsing as a guest'}
            </Text>
            <Text size={12} color={colors.onDarkMuted} style={{ marginTop: r.s(3) }} numberOfLines={1}>
              {isMember ? user?.email ?? '' : 'Tap to sign in or create an account'}
            </Text>
          </View>
          {!isMember ? <Ionicons name="chevron-forward" size={r.s(16)} color="rgba(255,255,255,0.6)" /> : null}
        </Row>
      </Pressable>

      <Group title="Notifications">
        <Toggle label="Verse of the day" on={prefs.verse} onPress={() => flip('verse')} />
        <Toggle label="Live service starting" on={prefs.live} onPress={() => flip('live')} />
        <Toggle label="New sermons & shorts" on={prefs.sermons} onPress={() => flip('sermons')} last />
      </Group>

      <Group title="Playback & storage">
        <Toggle label="Download over Wi-Fi only" on={wifiOnly} onPress={flipWifi} last />
      </Group>

      <Group title="Church">
        <Link
          icon="images-outline"
          label="Photo gallery"
          sub="Every Sunday's photos, archived by date"
          onPress={() => router.push('/gallery')}
          last
        />
      </Group>

      {isMember ? (
        <Group title="Giving">
          <Link label="Giving history" onPress={() => router.push('/give/history')} last />
        </Group>
      ) : null}

      <Group title="Get in touch">
        <Link
          icon="home-outline"
          label="Contact the church office"
          sub="Send a message · we'll reply by email"
          onPress={() => router.push({ pathname: '/contact', params: { category: 'GENERAL' } })}
        />
        <Link
          icon="people-outline"
          label="Message my CSG admin"
          sub="Pick your CSG and send a message"
          onPress={() => router.push({ pathname: '/contact', params: { category: 'CSG' } })}
        />
        <Link
          icon="code-slash-outline"
          label="Contact the developers"
          sub="Report a bug or suggest a feature"
          onPress={() => router.push({ pathname: '/contact', params: { category: 'TECHNICAL' } })}
        />
        <Link
          icon="heart-outline"
          label="Prayer request"
          sub="Sent privately to the pastoral team"
          onPress={() => router.push('/prayer')}
          last
        />
      </Group>

      {isMember ? (
        <Pressable
          onPress={() =>
            Alert.alert('Sign out?', 'Your downloads stay on this phone.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Sign out', style: 'destructive', onPress: () => logOut() },
            ])
          }
          style={{ marginTop: r.s(14), minHeight: r.s(52), borderRadius: radius.md, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text size={13.5} weight="extra" color={colors.danger}>Sign out</Text>
        </Pressable>
      ) : null}

      {isMember ? (
        <Pressable
          disabled={deleting}
          onPress={() =>
            Alert.alert(
              'Delete your account?',
              'This permanently deletes your account, saves, notes, and CSG membership. This cannot be undone.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete account',
                  style: 'destructive',
                  onPress: () =>
                    Alert.alert('Are you absolutely sure?', 'Your account and all its data will be gone for good.', [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Yes, delete everything',
                        style: 'destructive',
                        onPress: async () => {
                          setDeleting(true);
                          try {
                            await deleteAccount();
                            router.replace('/(tabs)');
                          } catch (e: any) {
                            Alert.alert('Could not delete account', e?.message ?? 'Please try again.');
                          } finally {
                            setDeleting(false);
                          }
                        },
                      },
                    ]),
                },
              ]
            )
          }
          style={{ marginTop: r.s(10), minHeight: r.s(44), alignItems: 'center', justifyContent: 'center', opacity: deleting ? 0.5 : 1 }}
        >
          <Text size={12} weight="semibold" color={colors.faint}>Delete account</Text>
        </Pressable>
      ) : null}

      <Text size={11} color={colors.faint} style={{ marginTop: r.s(16), textAlign: 'center' }}>
        The Beacon Centre · version 2.0.1
      </Text>
    </Screen>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  const r = useResponsive();
  return (
    <>
      <Kicker style={{ marginTop: r.s(24), marginBottom: r.s(9), marginLeft: r.s(4) }}>{title}</Kicker>
      <View style={{ borderRadius: radius.lg, backgroundColor: colors.surface, overflow: 'hidden' }}>{children}</View>
    </>
  );
}

function Divider({ hide }: { hide?: boolean }) {
  const r = useResponsive();
  if (hide) return null;
  return <View style={{ height: 1, backgroundColor: colors.ground, marginLeft: r.s(18) }} />;
}

function Toggle({ label, sub, on, onPress, last }: { label: string; sub?: string; on: boolean; onPress: () => void; last?: boolean }) {
  const r = useResponsive();
  return (
    <>
      <Pressable
        onPress={onPress}
        accessibilityRole="switch"
        accessibilityState={{ checked: on }}
        style={{ minHeight: r.s(56), paddingVertical: r.s(13), paddingHorizontal: r.s(18), flexDirection: 'row', alignItems: 'center', gap: r.s(14) }}
      >
        <View style={{ flex: 1 }}>
          <Text size={13.5} weight="semibold">{label}</Text>
          {sub ? <Text size={11} color={colors.muted} style={{ marginTop: r.s(3) }}>{sub}</Text> : null}
        </View>
        <View style={{ width: r.s(44), height: r.s(26), borderRadius: 99, backgroundColor: on ? colors.teal : '#DEDAD1', padding: r.s(3), justifyContent: 'center', alignItems: on ? 'flex-end' : 'flex-start' }}>
          <View style={{ width: r.s(20), height: r.s(20), borderRadius: 99, backgroundColor: '#fff' }} />
        </View>
      </Pressable>
      <Divider hide={last} />
    </>
  );
}

function Link({ icon, label, sub, value, badge, last, onPress }: RowDef & { last?: boolean }) {
  const r = useResponsive();
  return (
    <>
      <Pressable
        onPress={onPress}
        style={{ minHeight: r.s(56), paddingVertical: r.s(13), paddingHorizontal: r.s(18), flexDirection: 'row', alignItems: 'center', gap: r.s(13) }}
      >
        {icon ? (
          <View style={{ width: r.s(36), height: r.s(36), borderRadius: r.s(11), backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name={icon} size={r.s(17)} color={colors.ink} />
          </View>
        ) : null}
        <View style={{ flex: 1 }}>
          <Text size={13.5} weight="semibold">{label}</Text>
          {sub ? <Text size={11} color={colors.muted} style={{ marginTop: r.s(3) }}>{sub}</Text> : null}
        </View>
        {value ? <Text size={12} weight="semibold" color={colors.muted}>{value}</Text> : null}
        {badge ? (
          <View style={{ paddingVertical: r.s(4), paddingHorizontal: r.s(9), borderRadius: r.s(8), backgroundColor: colors.tealPale }}>
            <Text size={10} weight="extra" color={colors.tealDeep}>{badge}</Text>
          </View>
        ) : null}
        {onPress ? <Ionicons name="chevron-forward" size={r.s(16)} color={colors.faint} /> : null}
      </Pressable>
      <Divider hide={last} />
    </>
  );
}
