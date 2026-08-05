import React, { useState } from 'react';
import { View, Pressable, ScrollView, RefreshControl, TextInput } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, useResponsive } from '@/theme';
import { Screen, Text, Card, Btn, Progress, Row, Kicker, MediaTile, SectionHead } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/services/auth';
import { fetchAnnouncements } from '@/services/api';
import { fetchProjects, fetchGivingHistory, ProjectWithProgress, GivingTransaction, GivingPurpose } from '@/services/giving';
import { COVER, naira, short as money } from '@/data/content';

const PURPOSES: { label: string; value: GivingPurpose }[] = [
  { label: 'Tithe', value: 'TITHE' },
  { label: 'Offering', value: 'OFFERING' },
  { label: 'Seed', value: 'SEED' },
  { label: 'Project', value: 'PROJECT' },
];
const AMOUNTS = [5000, 10000, 20000];

/** Kobo string (BigInt over JSON) -> whole Naira number. */
const koboToNaira = (kobo: string) => Math.round(Number(kobo) / 100);

function daysLeft(deadline: string | null): number | null {
  if (!deadline) return null;
  const ms = new Date(deadline).getTime() - Date.now();
  return ms > 0 ? Math.ceil(ms / 86_400_000) : 0;
}

export default function Give() {
  const r = useResponsive();
  const { isMember } = useAuth();
  const [purpose, setPurpose] = useState<GivingPurpose>('TITHE');
  const [amount, setAmount] = useState<number>(20000);
  const [customAmount, setCustomAmount] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [recurring, setRecurring] = useState(true);

  const { data: projects, loading: projectsLoading } = useAsync<ProjectWithProgress[]>(
    () => fetchProjects(),
    [],
    []
  );

  const { data: history } = useAsync<GivingTransaction[]>(
    () => (isMember ? fetchGivingHistory() : Promise.resolve([])),
    [],
    [isMember]
  );
  const thisYear = new Date().getFullYear();
  const yearGifts = history.filter((t) => t.status === 'SUCCESS' && new Date(t.createdAt).getFullYear() === thisYear);
  const yearTotal = yearGifts.reduce((sum, t) => sum + Number(t.amount), 0);

  return (
    <Screen padBottom={110}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Text size={32} weight="extra" track={-0.035}>Give</Text>
        {isMember ? (
          <Pressable onPress={() => router.push('/give/history')}>
            <Row gap={7} style={{ paddingVertical: r.s(10), paddingHorizontal: r.s(14), borderRadius: radius.sm, backgroundColor: colors.surface }}>
              <Ionicons name="time-outline" size={r.s(14)} color={colors.ink} />
              <Text size={12} weight="bold">History</Text>
            </Row>
          </Pressable>
        ) : null}
      </Row>

      {/* amount composer */}
      <View style={{ marginTop: r.s(18), borderRadius: radius.xxl, padding: r.s(20), backgroundColor: colors.tealDark }}>
        <Kicker color={colors.tealLight}>Giving to</Kicker>
        <Row gap={7} style={{ marginTop: r.s(13), flexWrap: 'wrap' }}>
          {PURPOSES.map((p) => {
            const on = purpose === p.value;
            return (
              <Pressable
                key={p.value}
                onPress={() => setPurpose(p.value)}
                style={{ minHeight: r.s(40), paddingVertical: r.s(9), paddingHorizontal: r.s(14), borderRadius: radius.sm, backgroundColor: on ? colors.teal : 'rgba(255,255,255,0.14)', justifyContent: 'center' }}
              >
                <Text size={12} weight={on ? 'extra' : 'semibold'} color={on ? colors.tealInk : '#fff'}>{p.label}</Text>
              </Pressable>
            );
          })}
        </Row>

        <Row gap={4} style={{ marginTop: r.s(22), alignItems: 'baseline' }}>
          <Text size={26} weight="bold" color={colors.tealLight}>₦</Text>
          <Text size={52} weight="extra" lh={1} track={-0.045} color="#fff">{amount.toLocaleString('en-NG')}</Text>
        </Row>

        <Row gap={7} style={{ marginTop: r.s(18) }}>
          {AMOUNTS.map((a) => {
            const on = amount === a && !showCustom;
            return (
              <Pressable
                key={a}
                onPress={() => {
                  setShowCustom(false);
                  setAmount(a);
                }}
                style={{ flex: 1, minHeight: r.s(42), borderRadius: radius.sm, backgroundColor: on ? colors.teal : 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' }}
              >
                <Text size={12} weight={on ? 'extra' : 'semibold'} color={on ? colors.tealInk : '#fff'}>₦{a.toLocaleString('en-NG')}</Text>
              </Pressable>
            );
          })}
          <Pressable
            onPress={() => setShowCustom((v) => !v)}
            style={{ flex: 1, minHeight: r.s(42), borderRadius: radius.sm, backgroundColor: showCustom ? colors.teal : 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' }}
          >
            <Text size={12} weight={showCustom ? 'extra' : 'semibold'} color={showCustom ? colors.tealInk : '#fff'}>Other</Text>
          </Pressable>
        </Row>

        {showCustom ? (
          <TextInput
            value={customAmount}
            onChangeText={(v) => {
              const digits = v.replace(/[^0-9]/g, '');
              setCustomAmount(digits);
              if (digits) setAmount(parseInt(digits, 10));
            }}
            placeholder="Enter an amount"
            placeholderTextColor="rgba(255,255,255,0.5)"
            keyboardType="number-pad"
            style={{ marginTop: r.s(12), minHeight: r.s(44), borderRadius: radius.sm, backgroundColor: 'rgba(255,255,255,0.14)', paddingHorizontal: r.s(14), color: '#fff', fontSize: r.fs(15) }}
          />
        ) : null}
      </View>

      <Pressable onPress={() => setRecurring((v) => !v)}>
        <Row gap={12} style={{ marginTop: r.s(11), padding: r.s(15), borderRadius: radius.lg, backgroundColor: colors.surface }}>
          <View style={{ width: r.s(22), height: r.s(22), borderRadius: r.s(7), backgroundColor: recurring ? colors.teal : 'transparent', borderWidth: recurring ? 0 : 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}>
            {recurring ? <Ionicons name="checkmark" size={r.s(13)} color={colors.tealInk} /> : null}
          </View>
          <Text size={12.5} weight="bold" lh={1.5} style={{ flex: 1 }}>Repeat this every month on the 1st</Text>
        </Row>
      </Pressable>
      {recurring ? (
        <Text size={10.5} color={colors.faint} style={{ marginTop: r.s(6) }}>
          Recurring giving isn't automated yet: you'll need to give again manually next month.
        </Text>
      ) : null}

      <Btn
        full
        label={purpose === 'PROJECT' ? 'Pick a project below to contribute' : `Give ₦${amount.toLocaleString('en-NG')}`}
        tone={purpose === 'PROJECT' ? 'plain' : 'ink'}
        disabled={purpose === 'PROJECT'}
        style={{ marginTop: r.s(12), paddingVertical: r.s(17), opacity: purpose === 'PROJECT' ? 0.6 : 1 }}
        onPress={() => {
          if (purpose === 'PROJECT') return;
          router.push({ pathname: '/give/pay', params: { amount: String(amount), purpose } });
        }}
      />

      {!isMember ? (
        <Text size={11} lh={1.6} color={colors.faint} style={{ marginTop: r.s(12), textAlign: 'center' }}>
          You can give as a guest. Add your email at checkout for a receipt.
        </Text>
      ) : null}

      <SectionHead title="Church projects" action={projects.length ? 'See all' : undefined} />
      {!projectsLoading && projects.length === 0 ? (
        <Text size={12.5} color={colors.muted}>No active projects right now.</Text>
      ) : null}
      {projects.map((p, i) => {
        const raised = koboToNaira(p.raisedAmount);
        const target = koboToNaira(p.targetAmount);
        const left = daysLeft(p.deadline);
        return (
          <View key={p.id} style={{ borderRadius: radius.xl, backgroundColor: colors.surface, overflow: 'hidden', marginTop: i ? r.s(11) : 0 }}>
            {i === 0 ? (
              <MediaTile source={p.imageUrl ? { uri: p.imageUrl } : COVER} height={132} rad="xs" style={{ borderRadius: 0 }}>
                {left !== null ? (
                  <View style={{ position: 'absolute', top: r.s(12), right: r.s(12), paddingVertical: r.s(6), paddingHorizontal: r.s(10), borderRadius: r.s(8), backgroundColor: colors.ink }}>
                    <Text size={10} weight="bold" color="#fff">{left} days left</Text>
                  </View>
                ) : null}
              </MediaTile>
            ) : null}
            <View style={{ padding: r.s(20) }}>
              <Row style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
                <Text size={i === 0 ? 19 : 17} weight="extra" lh={1.24} style={{ flex: 1 }}>{p.title}</Text>
                {i > 0 ? <Text size={14} weight="extra" color={colors.tealDeep}>{p.progressPct}%</Text> : null}
              </Row>
              {i === 0 && p.blurb ? <Text size={12} lh={1.6} color={colors.muted} style={{ marginTop: r.s(6) }}>{p.blurb}</Text> : null}
              <View style={{ marginTop: r.s(15) }}><Progress value={p.progressPct / 100} /></View>
              <Row style={{ justifyContent: 'space-between', marginTop: r.s(11), alignItems: 'baseline' }}>
                <Text size={i === 0 ? 15 : 13.5} weight="extra" color={colors.tealDeep}>{naira(raised)}</Text>
                <Text size={12} weight="semibold" color={colors.muted}>of {money(target)}</Text>
              </Row>
              {i === 0 ? (
                <Row gap={12} style={{ marginTop: r.s(15) }}>
                  <Text size={11.5} weight="semibold" color={colors.muted} style={{ flex: 1 }}>{p.donorCount} givers</Text>
                  <Btn
                    label="Contribute"
                    tone="ink"
                    onPress={() => router.push({ pathname: '/give/pay', params: { amount: String(amount), purpose: 'PROJECT', projectId: String(p.id), projectTitle: p.title } })}
                    style={{ paddingVertical: r.s(11) }}
                  />
                </Row>
              ) : null}
            </View>
          </View>
        );
      })}

      {isMember && yearGifts.length > 0 ? (
        <Card style={{ marginTop: r.s(20) }} pad={20}>
          <Kicker>Your giving</Kicker>
          <Row gap={10} style={{ marginTop: r.s(9), alignItems: 'baseline' }}>
            <Text size={23} weight="extra">{naira(koboToNaira(String(yearTotal)))}</Text>
            <Text size={12} color={colors.muted}>this year · {yearGifts.length} gift{yearGifts.length === 1 ? '' : 's'}</Text>
          </Row>
        </Card>
      ) : null}
    </Screen>
  );
}
