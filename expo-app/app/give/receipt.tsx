import React from 'react';
import { View, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, useResponsive } from '@/theme';
import { Screen, Text, Row, Btn, Card } from '@/components/ui';
import { GivingPurpose } from '@/services/giving';

const PURPOSE_LABEL: Record<GivingPurpose, string> = {
  TITHE: 'Tithe',
  OFFERING: 'Offering',
  SEED: 'Seed',
  PROJECT: 'Project',
};

export default function Receipt() {
  const r = useResponsive();
  const params = useLocalSearchParams<{
    reference: string;
    amount: string; // kobo, as a string
    purpose: GivingPurpose;
    channel?: string;
    paidAt?: string;
    projectTitle?: string;
  }>();

  const naira = Math.round(Number(params.amount || 0) / 100);
  const given = params.projectTitle || PURPOSE_LABEL[params.purpose] || 'Tithe';
  const paidAt = params.paidAt ? new Date(params.paidAt) : new Date();

  const LINES: [string, string][] = [
    ['Given to', given],
    ['Paid with', params.channel ? params.channel[0].toUpperCase() + params.channel.slice(1) : 'Card'],
    ['Date', paidAt.toLocaleString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })],
    ['Reference', params.reference ?? ''],
  ];

  return (
    <Screen padBottom={20}>
      <Row style={{ justifyContent: 'flex-end' }}>
        <Pressable
          onPress={() => router.dismissAll?.() ?? router.replace('/(tabs)/give')}
          accessibilityLabel="Close"
          style={{ width: r.s(44), height: r.s(44), borderRadius: radius.sm, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="close" size={r.s(19)} color={colors.ink} />
        </Pressable>
      </Row>

      <View style={{ alignItems: 'center', marginTop: r.s(40) }}>
        <View style={{ width: r.s(96), height: r.s(96), borderRadius: 99, backgroundColor: colors.teal, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="checkmark" size={r.s(44)} color={colors.tealInk} />
        </View>
        <Text size={28} weight="extra" track={-0.03} style={{ marginTop: r.s(24) }}>Thank you</Text>
        <Text size={13} lh={1.6} color={colors.muted} style={{ marginTop: r.s(9), textAlign: 'center', maxWidth: r.s(250) }}>
          Your gift has been received. A receipt is on its way to your email.
        </Text>
        <Text size={46} weight="extra" track={-0.045} style={{ marginTop: r.s(22) }}>₦{naira.toLocaleString('en-NG')}</Text>
      </View>

      <Card style={{ marginTop: r.s(30) }} pad={20}>
        {LINES.map(([k, v], i) => (
          <View key={k}>
            {i ? <View style={{ height: 1, backgroundColor: colors.hairline, marginVertical: r.s(13) }} /> : null}
            <Row style={{ justifyContent: 'space-between' }}>
              <Text size={12.5} color={colors.muted}>{k}</Text>
              <Text size={12.5} weight="bold">{v}</Text>
            </Row>
          </View>
        ))}
      </Card>

      <Row gap={10} style={{ marginTop: r.s(18) }}>
        <Btn label="Done" full style={{ flex: 1 }} onPress={() => router.replace('/(tabs)/give')} />
      </Row>
    </Screen>
  );
}
