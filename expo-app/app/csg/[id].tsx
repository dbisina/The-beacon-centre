import React, { useState } from 'react';
import { View, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, useResponsive } from '@/theme';
import { Text, Row, Card, Btn, Kicker, MediaTile } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/services/auth';
import { fetchCsgById, fetchCsgUpdates, joinCsg, leaveCsg, rsvpCsg, Csg, CsgUpdate } from '@/services/csg';
import { COVER } from '@/data/content';

export default function CsgDetail() {
  const r = useResponsive();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { mode } = useAuth();
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data: csg, loading: csgLoading, refresh: refreshCsg } = useAsync<Csg | null>(
    () => fetchCsgById(id),
    null,
    [id]
  );

  // fetchCsgUpdates 403s when the signed-in user isn't a member of this CSG —
  // that failure is how we know whether to show "Join" vs "Leave / RSVP".
  const { data: updates, error: updatesError, refresh: refreshUpdates } = useAsync<CsgUpdate[]>(
    () => fetchCsgUpdates(id),
    [],
    [id]
  );
  const isMemberHere = mode === 'member' && !updatesError;

  async function handleJoin() {
    if (mode !== 'member') {
      setActionError('Joining a group needs an account - sign-in is coming soon.');
      return;
    }
    setBusy(true);
    setActionError(null);
    try {
      await joinCsg(id);
      await Promise.all([refreshCsg(), refreshUpdates()]);
    } catch (e: any) {
      setActionError(e?.message ?? 'Could not join this group.');
    } finally {
      setBusy(false);
    }
  }

  async function handleLeave() {
    setBusy(true);
    setActionError(null);
    try {
      await leaveCsg(id);
      await Promise.all([refreshCsg(), refreshUpdates()]);
    } catch (e: any) {
      setActionError(e?.message ?? 'Could not leave this group.');
    } finally {
      setBusy(false);
    }
  }

  async function handleRsvp() {
    setBusy(true);
    setActionError(null);
    try {
      await rsvpCsg(id);
    } catch (e: any) {
      setActionError(e?.message ?? "Could not RSVP.");
    } finally {
      setBusy(false);
    }
  }

  if (csgLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.ground, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.teal} />
      </View>
    );
  }

  if (!csg) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.ground, alignItems: 'center', justifyContent: 'center', padding: r.s(20) }}>
        <Text size={14} weight="bold" style={{ textAlign: 'center' }}>Couldn't find this group.</Text>
        <Btn label="Back" style={{ marginTop: r.s(16) }} onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.ground }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + r.s(30) }}>
        <MediaTile source={csg.coverImageUrl ? { uri: csg.coverImageUrl } : COVER} height={206} rad="xs" style={{ borderRadius: 0 }}>
          <View style={{ padding: r.s(18) }}>
            <Kicker color={colors.tealLight}>Community Group</Kicker>
            <Text size={28} weight="extra" track={-0.03} color="#fff" style={{ marginTop: r.s(8) }}>{csg.name}</Text>
            <Text size={12} color="rgba(255,255,255,0.72)" style={{ marginTop: r.s(4) }}>
              {[csg.meetsOn, csg.meetingTime].filter(Boolean).join(' · ') || 'Schedule to be announced'} · {csg.memberCount} members
            </Text>
          </View>
        </MediaTile>
        <Pressable
          onPress={() => router.back()}
          accessibilityLabel="Back"
          style={{ position: 'absolute', top: r.s(8), left: r.s(16), width: r.s(44), height: r.s(44), borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="chevron-back" size={r.s(20)} color="#fff" />
        </Pressable>

        <View style={{ paddingHorizontal: r.s(16), maxWidth: r.contentWidth, width: '100%', alignSelf: 'center' }}>
          {csg.address ? (
            <Card style={{ marginTop: r.s(16) }}>
              <Row gap={14}>
                <Ionicons name="location-outline" size={r.s(20)} color={colors.tealDeep} />
                <Text size={13} lh={1.4} style={{ flex: 1 }}>{csg.address}</Text>
              </Row>
            </Card>
          ) : null}

          {csg.description ? (
            <Text size={13} lh={1.6} color={colors.inkSoft} style={{ marginTop: r.s(16) }}>{csg.description}</Text>
          ) : null}

          <Row gap={9} style={{ marginTop: r.s(16) }}>
            {isMemberHere ? (
              <>
                <Btn label={busy ? 'Please wait…' : "I'm attending"} disabled={busy} style={{ flex: 1 }} full onPress={handleRsvp} />
                <Btn label="Leave group" tone="plain" disabled={busy} style={{ flex: 1 }} full onPress={handleLeave} />
              </>
            ) : (
              <Btn
                label={busy ? 'Please wait…' : mode === 'member' ? 'Join this group' : 'Sign in to join'}
                disabled={busy}
                style={{ flex: 1 }}
                full
                onPress={handleJoin}
              />
            )}
          </Row>
          {actionError ? (
            <Text size={11.5} color="#C4453C" style={{ marginTop: r.s(8) }}>{actionError}</Text>
          ) : null}

          <Row style={{ justifyContent: 'space-between', marginTop: r.s(24), marginBottom: r.s(12) }}>
            <Text size={18} weight="extra" track={-0.02}>Updates</Text>
            <Text size={11.5} weight="semibold" color={colors.muted}>Only members see these</Text>
          </Row>

          {!isMemberHere ? (
            <Card>
              <Text size={12.5} color={colors.muted} style={{ textAlign: 'center' }}>
                Join this group to see its updates.
              </Text>
            </Card>
          ) : updates.length === 0 ? (
            <Card>
              <Text size={12.5} color={colors.muted} style={{ textAlign: 'center' }}>No updates yet.</Text>
            </Card>
          ) : (
            updates.map((u, i) => (
              <Card key={u.id} style={{ marginTop: i ? r.s(11) : 0 }}>
                <Row gap={10}>
                  <View style={{ width: r.s(32), height: r.s(32), borderRadius: 99, backgroundColor: colors.teal, alignItems: 'center', justifyContent: 'center' }}>
                    <Text size={11} weight="extra" color={colors.tealInk}>{(u.title ?? 'Update').slice(0, 2).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    {u.title ? <Text size={12.5} weight="bold">{u.title}</Text> : null}
                    <Text size={11} color={colors.muted} style={{ marginTop: r.s(2) }}>
                      {new Date(u.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                    </Text>
                  </View>
                </Row>
                <Text size={13} lh={1.65} color={colors.inkSoft} style={{ marginTop: r.s(12) }}>{u.body}</Text>
              </Card>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}
