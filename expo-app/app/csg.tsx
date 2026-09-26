import React, { useCallback, useMemo, useState } from 'react';
import { View, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, HIT, useResponsive } from '@/theme';
import { Screen, Text, Row, Card, Kicker } from '@/components/ui';
import { CsgMonogram } from '@/components/CsgMonogram';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/services/auth';
import { fetchCsgs, fetchMyMemberships, Csg, MyMembership } from '@/services/csg';

const schedule = (c: Csg) => [c.meetsOn, c.meetingTime].filter(Boolean).join(' · ');

/** Pill for the caller's own standing. Only the two states worth showing on a list. */
function StatusPill({ status }: { status: MyMembership['status'] }) {
  if (status !== 'APPROVED' && status !== 'PENDING') return null;
  const approved = status === 'APPROVED';
  return (
    <View
      style={{
        paddingHorizontal: 9,
        paddingVertical: 3,
        borderRadius: radius.pill,
        backgroundColor: approved ? colors.tealPale : colors.surfaceAlt,
      }}
    >
      <Text size={10.5} weight="bold" color={approved ? colors.tealDeep : colors.inkSoft}>
        {approved ? 'Member' : 'Request sent'}
      </Text>
    </View>
  );
}

function GroupRow({ csg, status }: { csg: Csg; status?: MyMembership['status'] }) {
  const r = useResponsive();
  const when = schedule(csg);
  const members = `${csg.memberCount} member${csg.memberCount === 1 ? '' : 's'}`;
  return (
    <Pressable
      onPress={() => router.push(`/csg/${csg.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`${csg.name}. ${when || 'Schedule to be announced'}. ${members}.${
        status === 'APPROVED' ? ' You are a member.' : status === 'PENDING' ? ' Your request is waiting.' : ''
      }`}
    >
      {({ pressed }) => (
        <Card style={{ opacity: pressed ? 0.7 : 1 }} pad={14}>
          <Row gap={14} style={{ alignItems: 'center', minHeight: HIT }}>
            <CsgMonogram id={csg.id} name={csg.name} />
            <View style={{ flex: 1 }}>
              <Row gap={8} style={{ flexWrap: 'wrap' }}>
                <Text size={15} weight="extra" style={{ flexShrink: 1 }}>{csg.name}</Text>
                {status ? <StatusPill status={status} /> : null}
              </Row>
              <Text size={12} color={colors.muted} style={{ marginTop: r.s(3) }}>
                {when || 'Schedule to be announced'}
              </Text>
              <Row gap={5} style={{ marginTop: r.s(6) }}>
                <Ionicons name="people-outline" size={r.s(13)} color={colors.faint} />
                <Text size={11.5} weight="semibold" color={colors.faint}>{members}</Text>
              </Row>
            </View>
            <Ionicons name="chevron-forward" size={r.s(16)} color={colors.faint} />
          </Row>
        </Card>
      )}
    </Pressable>
  );
}

export default function CsgList() {
  const r = useResponsive();
  const { isMember } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const groups = useAsync<Csg[]>(() => fetchCsgs(), [], []);
  const mine = useAsync<MyMembership[]>(
    () => (isMember ? fetchMyMemberships() : Promise.resolve([])),
    [],
    [isMember]
  );

  // Coming back from a group - after asking to join, or leaving - should show
  // the new standing without a manual refresh.
  useFocusEffect(
    useCallback(() => {
      if (isMember) mine.refresh();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isMember])
  );

  const statusBy = useMemo(() => new Map(mine.data.map((m) => [m.csgId, m.status])), [mine.data]);
  const yours = groups.data.filter((c) => statusBy.has(c.id));
  const others = groups.data.filter((c) => !statusBy.has(c.id));

  async function onRefresh() {
    setRefreshing(true);
    await Promise.all([groups.refresh(), isMember ? mine.refresh() : Promise.resolve()]);
    setRefreshing(false);
  }

  return (
    <Screen
      padBottom={30}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.teal} />}
    >
      <Row style={{ justifyContent: 'space-between' }}>
        <Text size={28} weight="extra" track={-0.03}>Community Groups</Text>
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
      <Text size={12.5} lh={1.6} color={colors.muted} style={{ marginTop: r.s(8) }}>
        Small groups meeting in homes across the city each week. Ask to join one near you and a
        group leader will welcome you in.
      </Text>

      {groups.loading ? (
        <ActivityIndicator color={colors.teal} style={{ marginTop: r.s(40) }} />
      ) : groups.error ? (
        <Card style={{ marginTop: r.s(24) }}>
          <Text size={12.5} color={colors.muted} style={{ textAlign: 'center' }}>
            Couldn't load groups right now. Pull down to try again.
          </Text>
        </Card>
      ) : groups.data.length === 0 ? (
        <Card style={{ marginTop: r.s(24) }}>
          <Text size={12.5} color={colors.muted} style={{ textAlign: 'center' }}>
            No community groups are listed yet.
          </Text>
        </Card>
      ) : (
        <>
          {yours.length > 0 ? (
            <>
              <Kicker style={{ marginTop: r.s(24), marginBottom: r.s(10) }}>Your groups</Kicker>
              <View style={{ gap: r.s(10) }}>
                {yours.map((c) => <GroupRow key={c.id} csg={c} status={statusBy.get(c.id)} />)}
              </View>
            </>
          ) : null}

          {others.length > 0 ? (
            <>
              <Kicker style={{ marginTop: r.s(24), marginBottom: r.s(10) }}>
                {yours.length > 0 ? 'Other groups' : 'All groups'}
              </Kicker>
              <View style={{ gap: r.s(10) }}>
                {others.map((c) => <GroupRow key={c.id} csg={c} />)}
              </View>
            </>
          ) : null}

          {!isMember ? (
            <Pressable
              onPress={() => router.push('/auth')}
              accessibilityRole="button"
              style={{ marginTop: r.s(20), minHeight: HIT, justifyContent: 'center', alignItems: 'center' }}
            >
              <Text size={12.5} weight="semibold" color={colors.muted}>
                Joining a group needs an account.{' '}
                <Text size={12.5} weight="bold" color={colors.ink}>Sign in</Text>
              </Text>
            </Pressable>
          ) : null}
        </>
      )}
    </Screen>
  );
}
