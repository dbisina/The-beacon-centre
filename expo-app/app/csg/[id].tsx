import React, { useCallback, useState } from 'react';
import { View, Pressable, ScrollView, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, HIT, useResponsive } from '@/theme';
import { Text, Row, Card, Btn, Kicker } from '@/components/ui';
import { CsgMonogram, MemberAvatar } from '@/components/CsgMonogram';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/services/auth';
import {
  fetchCsgById,
  fetchCsgUpdates,
  fetchCsgPeers,
  fetchMyMembership,
  leaveCsg,
  rsvpCsg,
  Csg,
  CsgUpdate,
  CsgPeer,
  MyMembership,
} from '@/services/csg';

const NO_MEMBERSHIP: MyMembership = { csgId: 0, status: 'NONE', membershipId: null, requestedAt: null, reviewedAt: null };

export default function CsgDetail() {
  const r = useResponsive();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isMember: signedIn } = useAuth();
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [rsvpDone, setRsvpDone] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const group = useAsync<Csg | null>(() => fetchCsgById(id), null, [id]);
  const membership = useAsync<MyMembership>(
    () => (signedIn ? fetchMyMembership(id) : Promise.resolve(NO_MEMBERSHIP)),
    NO_MEMBERSHIP,
    [id, signedIn]
  );
  const approved = membership.data.status === 'APPROVED';

  // Updates and the member list are for approved members only; don't ask the
  // server for them otherwise.
  const updates = useAsync<CsgUpdate[]>(
    () => (approved ? fetchCsgUpdates(id) : Promise.resolve([])),
    [],
    [id, approved]
  );
  const peers = useAsync<CsgPeer[]>(
    () => (approved ? fetchCsgPeers(id) : Promise.resolve([])),
    [],
    [id, approved]
  );

  // Back from the join form, or from a push that says you were approved.
  useFocusEffect(
    useCallback(() => {
      if (signedIn) membership.refresh();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [signedIn, id])
  );

  async function refreshAll() {
    await Promise.all([group.refresh(), membership.refresh(), updates.refresh(), peers.refresh()]);
  }

  async function onPullRefresh() {
    setRefreshing(true);
    await refreshAll();
    setRefreshing(false);
  }

  async function leave(withdraw: boolean) {
    setBusy(true);
    setActionError(null);
    try {
      await leaveCsg(id);
      setRsvpDone(false);
      await Promise.all([group.refresh(), membership.refresh()]);
    } catch (e: any) {
      setActionError(e?.message ?? (withdraw ? 'Could not withdraw your request.' : 'Could not leave this group.'));
    } finally {
      setBusy(false);
    }
  }

  function confirmLeave() {
    Alert.alert('Leave this group?', "You'll stop seeing its updates and members. You can ask to join again later.", [
      { text: 'Stay', style: 'cancel' },
      { text: 'Leave', style: 'destructive', onPress: () => leave(false) },
    ]);
  }

  async function handleRsvp() {
    setBusy(true);
    setActionError(null);
    try {
      await rsvpCsg(id);
      setRsvpDone(true);
    } catch (e: any) {
      setActionError(e?.message ?? 'Could not record that.');
    } finally {
      setBusy(false);
    }
  }

  if (group.loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.ground, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.teal} />
      </View>
    );
  }

  const csg = group.data;
  if (!csg) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.ground, alignItems: 'center', justifyContent: 'center', padding: r.s(20) }}>
        <Text size={14} weight="bold" style={{ textAlign: 'center' }}>Couldn't find this group.</Text>
        <Btn label="Back" style={{ marginTop: r.s(16) }} onPress={() => router.back()} />
      </View>
    );
  }

  const when = [csg.meetsOn, csg.meetingTime].filter(Boolean).join(' · ') || 'Schedule to be announced';
  const status = membership.data.status;

  return (
    <View style={{ flex: 1, backgroundColor: colors.ground }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onPullRefresh} tintColor={colors.teal} />}
        contentContainerStyle={{
          paddingTop: insets.top + r.s(8),
          paddingBottom: insets.bottom + r.s(30),
          paddingHorizontal: r.s(16),
          maxWidth: r.contentWidth,
          width: '100%',
          alignSelf: 'center',
        }}
      >
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={6}
          style={{ width: r.s(HIT), height: r.s(HIT), borderRadius: 99, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="chevron-back" size={r.s(20)} color={colors.ink} />
        </Pressable>

        {/* Header: the community's own mark, name, rhythm and size. */}
        <Row gap={16} style={{ marginTop: r.s(18), alignItems: 'center' }}>
          <CsgMonogram id={csg.id} name={csg.name} size={68} />
          <View style={{ flex: 1 }}>
            <Kicker>Community group</Kicker>
            <Text size={24} weight="extra" track={-0.03} style={{ marginTop: r.s(4) }}>{csg.name}</Text>
          </View>
        </Row>

        <Card style={{ marginTop: r.s(18) }}>
          <Row gap={12}>
            <Ionicons name="calendar-outline" size={r.s(18)} color={colors.tealDeep} />
            <Text size={13} style={{ flex: 1 }}>{when}</Text>
          </Row>
          {csg.address ? (
            <Row gap={12} style={{ marginTop: r.s(12) }}>
              <Ionicons name="location-outline" size={r.s(18)} color={colors.tealDeep} />
              <Text size={13} lh={1.4} style={{ flex: 1 }}>{csg.address}</Text>
            </Row>
          ) : null}
          <Row gap={12} style={{ marginTop: r.s(12) }}>
            <Ionicons name="people-outline" size={r.s(18)} color={colors.tealDeep} />
            <Text size={13} style={{ flex: 1 }}>
              {csg.memberCount} member{csg.memberCount === 1 ? '' : 's'}
            </Text>
          </Row>
        </Card>

        {csg.description ? (
          <Text size={13} lh={1.65} color={colors.inkSoft} style={{ marginTop: r.s(16) }}>{csg.description}</Text>
        ) : null}

        {/* What you can do here depends on where you stand. */}
        <View style={{ marginTop: r.s(18) }}>
          {!signedIn ? (
            <>
              <Btn full label="Sign in to ask to join" onPress={() => router.push('/auth')} />
              <Text size={11.5} color={colors.muted} style={{ marginTop: r.s(8), textAlign: 'center' }}>
                Joining a group needs an account.
              </Text>
            </>
          ) : membership.loading && status === 'NONE' ? (
            <ActivityIndicator color={colors.teal} />
          ) : status === 'APPROVED' ? (
            <>
              <Btn
                full
                label={rsvpDone ? "You're marked as attending" : busy ? 'Please wait…' : "I'm attending this week"}
                left={rsvpDone ? <Ionicons name="checkmark-circle" size={r.s(18)} color={colors.tealInk} /> : undefined}
                disabled={busy || rsvpDone}
                onPress={handleRsvp}
              />
              <Btn full tone="ghost" label="Leave group" disabled={busy} style={{ marginTop: r.s(6) }} onPress={confirmLeave} />
            </>
          ) : status === 'PENDING' ? (
            <Card bg={colors.tealPale}>
              <Row gap={10}>
                <Ionicons name="time-outline" size={r.s(18)} color={colors.tealDeep} />
                <Text size={13.5} weight="extra" color={colors.tealDeep}>Request sent</Text>
              </Row>
              <Text size={12.5} lh={1.6} color={colors.inkSoft} style={{ marginTop: r.s(6) }}>
                A group leader will look at your request. We'll let you know when you're in.
              </Text>
              <Pressable
                onPress={() => leave(true)}
                disabled={busy}
                accessibilityRole="button"
                style={{ marginTop: r.s(8), minHeight: HIT, justifyContent: 'center' }}
              >
                <Text size={12.5} weight="bold" color={colors.tealDeep}>
                  {busy ? 'Withdrawing…' : 'Withdraw request'}
                </Text>
              </Pressable>
            </Card>
          ) : (
            <>
              {status === 'REJECTED' ? (
                <Text size={12} lh={1.55} color={colors.muted} style={{ marginBottom: r.s(10) }}>
                  Your last request to join wasn't approved. You're welcome to ask again, or reach the
                  group through Contact.
                </Text>
              ) : null}
              <Btn
                full
                label="Ask to join"
                onPress={() => router.push({ pathname: '/csg/join', params: { id: String(csg.id), name: csg.name } })}
              />
            </>
          )}
          {actionError ? (
            <Text size={11.5} color={colors.danger} style={{ marginTop: r.s(8) }}>{actionError}</Text>
          ) : null}
        </View>

        {approved ? (
          <>
            <Row style={{ justifyContent: 'space-between', alignItems: 'baseline', marginTop: r.s(28), marginBottom: r.s(12) }}>
              <Text size={18} weight="extra" track={-0.02}>Members</Text>
              <Text size={11.5} weight="semibold" color={colors.muted}>{peers.data.length}</Text>
            </Row>
            {peers.loading ? (
              <ActivityIndicator color={colors.teal} />
            ) : peers.data.length === 0 ? (
              <Card>
                <Text size={12.5} color={colors.muted} style={{ textAlign: 'center' }}>No members to show yet.</Text>
              </Card>
            ) : (
              <Card pad={6}>
                {peers.data.map((p, i) => (
                  <Row
                    key={p.id}
                    gap={12}
                    style={{
                      paddingHorizontal: r.s(10),
                      paddingVertical: r.s(9),
                      borderTopWidth: i ? 1 : 0,
                      borderTopColor: colors.hairline,
                    }}
                  >
                    <MemberAvatar name={p.name} />
                    <Text size={13.5} weight="semibold" style={{ flex: 1 }}>{p.name}</Text>
                  </Row>
                ))}
              </Card>
            )}

            <Text size={18} weight="extra" track={-0.02} style={{ marginTop: r.s(28), marginBottom: r.s(12) }}>Updates</Text>
            {updates.loading ? (
              <ActivityIndicator color={colors.teal} />
            ) : updates.data.length === 0 ? (
              <Card>
                <Text size={12.5} color={colors.muted} style={{ textAlign: 'center' }}>No updates yet.</Text>
              </Card>
            ) : (
              updates.data.map((u, i) => (
                <Card key={u.id} style={{ marginTop: i ? r.s(11) : 0 }}>
                  {u.title ? <Text size={13.5} weight="bold">{u.title}</Text> : null}
                  <Text size={11} color={colors.muted} style={{ marginTop: u.title ? r.s(2) : 0 }}>
                    {new Date(u.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Text>
                  <Text size={13} lh={1.65} color={colors.inkSoft} style={{ marginTop: r.s(10) }}>{u.body}</Text>
                </Card>
              ))
            )}
          </>
        ) : signedIn && status !== 'NONE' && status !== 'REJECTED' ? null : (
          <Card style={{ marginTop: r.s(24) }}>
            <Row gap={10}>
              <Ionicons name="lock-closed-outline" size={r.s(16)} color={colors.faint} />
              <Text size={12.5} lh={1.55} color={colors.muted} style={{ flex: 1 }}>
                Members see the group's updates and who else belongs to it.
              </Text>
            </Row>
          </Card>
        )}
      </ScrollView>
    </View>
  );
}
