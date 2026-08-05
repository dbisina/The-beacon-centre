import React from 'react';
import { View, Pressable, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, useResponsive } from '@/theme';
import { Screen, Text, Row, Card } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { fetchGivingHistory, GivingTransaction, GivingPurpose } from '@/services/giving';

const PURPOSE_LABEL: Record<GivingPurpose, string> = {
  TITHE: 'Tithe',
  OFFERING: 'Offering',
  SEED: 'Seed',
  PROJECT: 'Project',
};

export default function GivingHistory() {
  const r = useResponsive();
  const { data: history, loading, error } = useAsync<GivingTransaction[]>(() => fetchGivingHistory(), [], []);
  const successful = history.filter((t) => t.status === 'SUCCESS');

  return (
    <Screen padBottom={30}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Text size={28} weight="extra" track={-0.03}>Your giving</Text>
        <Pressable
          onPress={() => router.back()}
          accessibilityLabel="Back"
          style={{ width: r.s(40), height: r.s(40), borderRadius: 99, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="chevron-back" size={r.s(18)} color={colors.ink} />
        </Pressable>
      </Row>

      {loading ? (
        <ActivityIndicator color={colors.teal} style={{ marginTop: r.s(40) }} />
      ) : error ? (
        <Text size={12.5} color={colors.muted} style={{ marginTop: r.s(30), textAlign: 'center' }}>
          Couldn't load your giving history right now.
        </Text>
      ) : successful.length === 0 ? (
        <Text size={12.5} color={colors.muted} style={{ marginTop: r.s(30), textAlign: 'center' }}>
          No gifts yet.
        </Text>
      ) : (
        successful.map((t, i) => (
          <Card key={t.id} style={{ marginTop: i ? r.s(10) : r.s(20) }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Text size={14} weight="extra">{t.project?.title ?? PURPOSE_LABEL[t.purpose]}</Text>
                <Text size={11.5} color={colors.muted} style={{ marginTop: r.s(3) }}>
                  {t.paidAt ? new Date(t.paidAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                  {t.channel ? ` · ${t.channel}` : ''}
                </Text>
              </View>
              <Text size={15} weight="extra" color={colors.tealDeep}>
                ₦{Math.round(Number(t.amount) / 100).toLocaleString('en-NG')}
              </Text>
            </Row>
          </Card>
        ))
      )}
    </Screen>
  );
}
