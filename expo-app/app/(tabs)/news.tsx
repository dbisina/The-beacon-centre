import React, { useEffect } from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import { Screen, Text, Card, Row, MediaTile } from '@/components/ui';
import { colors, radius, useResponsive } from '@/theme';
import { useAsync } from '@/hooks/useAsync';
import { fetchAnnouncements, markAnnouncementsViewed } from '@/services/api';
import { COVER } from '@/data/content';

/**
 * CSG-scoped announcements (author/role/"sent to N members") aren't
 * something the backend Announcement model supports - there's no CSG
 * association on it at all, so that variant was removed rather than wired to
 * data that can never exist. See backend/prisma/schema.prisma's Announcement
 * model if that scoping gets added later.
 */
export default function News() {
  const r = useResponsive();
  const { data, loading, refresh } = useAsync(() => fetchAnnouncements(), [], []);
  const items = data.map((a) => ({ ...a, image: a.image ? { uri: a.image } : COVER }));

  // Seeing this screen is reading them - it already shows full title +
  // description, there's no separate "read more" tap. Also covers pull-to-
  // refresh surfacing new ones.
  useEffect(() => {
    if (data.length) markAnnouncementsViewed(data.map((a) => a.id));
  }, [data]);
  const pinned = items[0];
  const rest = items.slice(1);

  return (
    <Screen padBottom={110} refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.teal} />}>
      <Text size={32} weight="extra" track={-0.035}>Announcements</Text>

      {pinned ? (
        <View style={{ marginTop: r.s(18), borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.ink }}>
          <MediaTile source={pinned.image} height={146} rad="xs" style={{ borderRadius: 0 }} />
          <View style={{ padding: r.s(18) }}>
            <Text size={20} weight="extra" lh={1.24} track={-0.02} color="#fff">{pinned.title}</Text>
            <Text size={12.5} lh={1.6} color="rgba(255,255,255,0.72)" style={{ marginTop: r.s(8) }}>{pinned.description}</Text>
            <Text size={11} weight="semibold" color={colors.onDarkMuted} style={{ marginTop: r.s(12) }}>{pinned.createdAt}</Text>
          </View>
        </View>
      ) : !loading ? (
        <Text size={12.5} color={colors.muted} style={{ marginTop: r.s(30), textAlign: 'center' }}>No announcements right now.</Text>
      ) : null}

      {rest.map((a) => (
        <Card key={a.id} style={{ marginTop: r.s(11) }}>
          <Row gap={14} style={{ alignItems: 'flex-start' }}>
            <MediaTile source={a.image} width={62} height={62} rad="sm" />
            <View style={{ flex: 1 }}>
              <Text size={14.5} weight="bold" lh={1.35} numberOfLines={2}>{a.title}</Text>
              <Text size={11.5} lh={1.55} color={colors.muted} style={{ marginTop: r.s(5) }} numberOfLines={2}>{a.description}</Text>
              <Text size={10.5} weight="semibold" color={colors.muted} style={{ marginTop: r.s(9) }}>{a.createdAt}</Text>
            </View>
          </Row>
        </Card>
      ))}
    </Screen>
  );
}
