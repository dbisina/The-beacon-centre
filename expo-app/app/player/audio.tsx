import React from 'react';
import { View, Image, Pressable, Share } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, useResponsive } from '@/theme';
import { Screen, Text, Row, Kicker, Progress } from '@/components/ui';
import { usePlayer, fmtTime } from '@/services/player';
import { useSaved } from '@/hooks/useSaved';
import { COVER } from '@/data/content';

const RATES = [1, 1.25, 1.5, 2];

export default function AudioPlayer() {
  const r = useResponsive();
  const { current, isPlaying, isLoading, positionMs, durationMs, toggle, skip, next, prev, rate, setRate, error } = usePlayer();
  const currentId = current?.id ? Number(current.id) : null;
  const { saved, toggle: toggleSaved } = useSaved('AUDIO_SERMON', currentId);

  const remaining = durationMs ? durationMs - positionMs : 0;
  const pct = durationMs ? positionMs / durationMs : 0;

  return (
    <Screen bg={colors.tealDark} scroll={false} padBottom={10}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Pressable
          onPress={() => router.back()}
          accessibilityLabel="Minimise"
          style={{ width: r.s(44), height: r.s(44), borderRadius: radius.sm, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="chevron-down" size={r.s(20)} color={colors.onDark} />
        </Pressable>
        <Kicker color={colors.tealLight}>Audio sermon</Kicker>
        <Pressable
          accessibilityLabel="Share"
          onPress={() => Share.share({ message: current?.title ? `${current.title} — The Beacon Centre` : 'The Beacon Centre' }).catch(() => {})}
          style={{ width: r.s(44), height: r.s(44), borderRadius: radius.sm, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="share-outline" size={r.s(18)} color={colors.onDark} />
        </Pressable>
      </Row>

      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Image
          source={current?.imageUrl ? { uri: current.imageUrl } : COVER}
          style={{ width: '100%', aspectRatio: 1, maxHeight: r.vs(300), borderRadius: radius.xl, alignSelf: 'center' }}
          resizeMode="cover"
        />

        <Row style={{ marginTop: r.s(24), alignItems: 'flex-start' }} gap={16}>
          <View style={{ flex: 1 }}>
            <Text size={23} weight="extra" lh={1.22} track={-0.025} color="#fff" numberOfLines={2}>
              {current?.title ?? 'Nothing playing'}
            </Text>
            <Text size={13} color="#7FA9A3" style={{ marginTop: r.s(7) }} numberOfLines={1}>
              {[current?.preacher, current?.series].filter(Boolean).join(' · ') || 'The Beacon Centre'}
            </Text>
          </View>
          <Pressable
            accessibilityLabel={saved ? 'Unsave' : 'Save'}
            onPress={toggleSaved}
            disabled={currentId == null}
            style={{ width: r.s(44), height: r.s(44), borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name={saved ? 'heart' : 'heart-outline'} size={r.s(19)} color={saved ? colors.teal : '#fff'} />
          </Pressable>
        </Row>

        {/* scrubber */}
        <View style={{ marginTop: r.s(26) }}>
          <Progress value={pct} height={4} track="#1D5451" fill={colors.teal} />
          <Row style={{ justifyContent: 'space-between', marginTop: r.s(10) }}>
            <Text size={11.5} weight="semibold" color="#7FA9A3">{fmtTime(positionMs)}</Text>
            <Text size={11.5} weight="semibold" color="#7FA9A3">-{fmtTime(remaining)}</Text>
          </Row>
        </View>

        {error ? (
          <Text size={12} color="#FFB4A8" style={{ marginTop: r.s(12) }}>{error}</Text>
        ) : null}

        <Row style={{ justifyContent: 'space-between', marginTop: r.s(24) }}>
          <Pressable
            onPress={() => setRate(RATES[(RATES.indexOf(rate) + 1) % RATES.length])}
            style={{ minWidth: r.s(48), minHeight: r.s(40), paddingHorizontal: r.s(11), borderRadius: radius.sm, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}
          >
            <Text size={12} weight="bold" color="#fff">{rate}×</Text>
          </Pressable>

          <Pressable onPress={prev} accessibilityLabel="Previous" hitSlop={10} style={{ minWidth: r.s(44), minHeight: r.s(44), alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="play-skip-back" size={r.s(24)} color={colors.onDark} />
          </Pressable>

          <Pressable
            onPress={toggle}
            accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
            style={{ width: r.s(74), height: r.s(74), borderRadius: 99, backgroundColor: colors.teal, alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name={isLoading ? 'ellipsis-horizontal' : isPlaying ? 'pause' : 'play'} size={r.s(26)} color={colors.tealInk} />
          </Pressable>

          <Pressable onPress={next} accessibilityLabel="Next" hitSlop={10} style={{ minWidth: r.s(44), minHeight: r.s(44), alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="play-skip-forward" size={r.s(24)} color={colors.onDark} />
          </Pressable>

          <Pressable onPress={() => skip(30)} accessibilityLabel="Forward 30 seconds" hitSlop={10} style={{ minWidth: r.s(44), minHeight: r.s(44), alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="play-forward-outline" size={r.s(21)} color="#7FA9A3" />
          </Pressable>
        </Row>

        <Row gap={10} style={{ marginTop: r.s(26) }}>
          <Row gap={8} style={{ flex: 1, minHeight: r.s(48), borderRadius: radius.md, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', opacity: 0.5 }}>
            <Ionicons name="download-outline" size={r.s(15)} color="#fff" />
            <Text size={12.5} weight="bold" color="#fff">Download · coming soon</Text>
          </Row>
        </Row>
      </View>
    </Screen>
  );
}
