import React, { useCallback, useState } from 'react';
import { View, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, HIT, useResponsive } from '@/theme';
import { Screen, Text, Row, Card } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/services/auth';
import { fetchEvents, eventWhen, ChurchEvent } from '@/services/events';
import { DateLeaf, mineLabel } from '@/components/EventBits';

export default function Events() {
  const r = useResponsive();
  const { isMember } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const events = useAsync<ChurchEvent[]>(() => fetchEvents(), [], [isMember]);

  useFocusEffect(
    useCallback(() => {
      events.refresh();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  return (
    <Screen
      padBottom={30}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await events.refresh(); setRefreshing(false); }} tintColor={colors.teal} />}
    >
      <Row style={{ justifyContent: 'space-between' }}>
        <Text size={28} weight="extra" track={-0.03}>Events</Text>
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
        What's coming up at The Beacon Centre.
      </Text>

      {events.loading && events.data.length === 0 ? (
        <ActivityIndicator color={colors.teal} style={{ marginTop: r.s(40) }} />
      ) : events.error ? (
        <Card style={{ marginTop: r.s(20) }}>
          <Text size={12.5} color={colors.muted} style={{ textAlign: 'center' }}>Couldn't load events. Pull down to try again.</Text>
        </Card>
      ) : events.data.length === 0 ? (
        <Card style={{ marginTop: r.s(20) }} pad={20}>
          <Text size={14} weight="bold">Nothing scheduled yet</Text>
          <Text size={12.5} lh={1.6} color={colors.muted} style={{ marginTop: r.s(4) }}>
            New events will appear here as soon as they're announced.
          </Text>
        </Card>
      ) : (
        <View style={{ marginTop: r.s(18), gap: r.s(10) }}>
          {events.data.map((e) => {
            const tag = mineLabel(e);
            return (
              <Pressable
                key={e.id}
                onPress={() => router.push(`/events/${e.id}`)}
                accessibilityRole="button"
                accessibilityLabel={`${e.title}, ${eventWhen(e)}${e.locationName ? `, ${e.locationName}` : ''}${tag ? `. ${tag}` : ''}`}
              >
                {({ pressed }) => (
                  <Card pad={14} style={{ opacity: pressed ? 0.7 : 1 }}>
                    <Row gap={14} style={{ alignItems: 'center', minHeight: HIT }}>
                      <DateLeaf iso={e.startsAt} />
                      <View style={{ flex: 1 }}>
                        <Text size={15} weight="extra">{e.title}</Text>
                        <Text size={12} color={colors.muted} style={{ marginTop: r.s(3) }}>{eventWhen(e)}</Text>
                        {e.locationName ? <Text size={12} color={colors.muted}>{e.locationName}</Text> : null}
                        {tag ? (
                          <Text size={11} weight="bold" color={tag === 'Full' ? colors.faint : colors.tealDeep} style={{ marginTop: r.s(5) }}>
                            {tag}
                          </Text>
                        ) : null}
                      </View>
                      <Ionicons name="chevron-forward" size={r.s(16)} color={colors.faint} />
                    </Row>
                  </Card>
                )}
              </Pressable>
            );
          })}
        </View>
      )}
    </Screen>
  );
}
