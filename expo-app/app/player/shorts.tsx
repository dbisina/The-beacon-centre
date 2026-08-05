import React, { useRef, useState } from 'react';
import { View, Pressable, Share, FlatList, Dimensions, Image, ViewToken } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, useResponsive } from '@/theme';
import { Text, Row } from '@/components/ui';
import { embedHtml, EMBED_ORIGIN } from '@/services/youtube';
import { fetchExcerpts, fetchInspirationals, fetchSermons } from '@/services/api';
import { useAsync } from '@/hooks/useAsync';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type QueueItem = { key: string; youtubeId: string; title: string; isFull?: boolean };

/**
 * A single continuous vertical swipe feed: excerpts + inspirationals first
 * (shorts), then full sermon videos once those run out - so swiping never
 * dead-ends, it just moves from short-form into full messages. Only the
 * active slide's WebView is mounted; neighbors show a static thumbnail, so
 * we're never running a dozen YouTube iframes at once.
 */
export default function ShortsPlayer() {
  const r = useResponsive();
  const insets = useSafeAreaInsets();
  const { youtubeId: startId, title: startTitle } = useLocalSearchParams<{ youtubeId?: string; title?: string }>();
  const [activeIndex, setActiveIndex] = useState(0);

  const { data: queue } = useAsync<QueueItem[]>(
    async () => {
      const [excerpts, inspirationals, sermons] = await Promise.all([
        fetchExcerpts(20).catch(() => []),
        fetchInspirationals(20).catch(() => []),
        fetchSermons(20).catch(() => []),
      ]);
      const shorts = [...excerpts, ...inspirationals].filter((v) => v.youtubeId);
      const full = sermons.filter((v) => v.youtubeId);

      // Start the feed on whatever was tapped, if we can find it, so the
      // swipe order still lines up with what launched this screen.
      const startIdx = shorts.findIndex((v) => v.youtubeId === startId);
      const ordered = startIdx > 0 ? [...shorts.slice(startIdx), ...shorts.slice(0, startIdx)] : shorts;

      const toItem = (v: { id: string; youtubeId: string | null; title: string }, isFull?: boolean): QueueItem => ({
        key: `${v.id}-${v.youtubeId}`,
        youtubeId: v.youtubeId!,
        title: v.title,
        isFull,
      });

      const result = ordered.map((v) => toItem(v));
      // Nothing from the backend matched what was tapped - seed the feed
      // with it directly so the screen is never empty.
      if (!result.length && startId) {
        result.push({ key: `seed-${startId}`, youtubeId: String(startId), title: startTitle ?? '' });
      }
      return [...result, ...full.map((v) => toItem(v, true))];
    },
    [],
    []
  );

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems[0]?.index != null) setActiveIndex(viewableItems[0].index);
  }).current;

  const share = (item: QueueItem) => {
    const url = `https://www.youtube.com/watch?v=${item.youtubeId}`;
    Share.share({ message: [item.title, url].filter(Boolean).join('\n') }).catch(() => {});
  };

  if (!queue.length) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
        <Text size={13} color="rgba(255,255,255,0.5)">Loading…</Text>
        <Pressable
          onPress={() => router.back()}
          accessibilityLabel="Close"
          style={{ position: 'absolute', top: insets.top + r.s(8), left: r.s(16), width: r.s(44), height: r.s(44), borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="close" size={r.s(20)} color="#fff" />
        </Pressable>
      </View>
    );
  }

  return (
    <FlatList
      data={queue}
      keyExtractor={(item) => item.key}
      pagingEnabled
      showsVerticalScrollIndicator={false}
      decelerationRate="fast"
      snapToInterval={SCREEN_HEIGHT}
      getItemLayout={(_, index) => ({ length: SCREEN_HEIGHT, offset: SCREEN_HEIGHT * index, index })}
      initialNumToRender={1}
      maxToRenderPerBatch={1}
      windowSize={3}
      removeClippedSubviews
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={{ itemVisiblePercentThreshold: 80 }}
      style={{ flex: 1, backgroundColor: '#000' }}
      renderItem={({ item, index }) => (
        <ShortSlide
          item={item}
          active={index === activeIndex}
          insetsTop={insets.top}
          insetsBottom={insets.bottom}
          onClose={() => router.back()}
          onShare={() => share(item)}
        />
      )}
    />
  );
}

function ShortSlide({
  item,
  active,
  insetsTop,
  insetsBottom,
  onClose,
  onShare,
}: {
  item: QueueItem;
  active: boolean;
  insetsTop: number;
  insetsBottom: number;
  onClose: () => void;
  onShare: () => void;
}) {
  const r = useResponsive();

  return (
    <View style={{ height: SCREEN_HEIGHT, backgroundColor: '#000' }}>
      {active ? (
        <WebView
          source={{ html: embedHtml(item.youtubeId), baseUrl: EMBED_ORIGIN }}
          style={{ flex: 1, backgroundColor: '#000' }}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled
        />
      ) : (
        <Image
          source={{ uri: `https://img.youtube.com/vi/${item.youtubeId}/hqdefault.jpg` }}
          style={{ flex: 1 }}
          resizeMode="cover"
        />
      )}

      <View pointerEvents="box-none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        <Row style={{ justifyContent: 'space-between', paddingTop: insetsTop + r.s(8), paddingHorizontal: r.s(16) }}>
          <Pressable
            onPress={onClose}
            accessibilityLabel="Close"
            style={{ width: r.s(44), height: r.s(44), borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="close" size={r.s(20)} color="#fff" />
          </Pressable>
          <Row gap={6} style={{ paddingVertical: r.s(6), paddingHorizontal: r.s(12), borderRadius: radius.sm, backgroundColor: item.isFull ? colors.ink : colors.live }}>
            {!item.isFull ? <Ionicons name="flash" size={r.s(12)} color="#fff" /> : null}
            <Text size={12} weight="extra" color="#fff">{item.isFull ? 'Full message' : 'Shorts'}</Text>
          </Row>
          <View style={{ width: r.s(44) }} />
        </Row>

        <View style={{ position: 'absolute', right: r.s(14), bottom: insetsBottom + r.s(60), gap: r.s(20), alignItems: 'center' }}>
          <Pressable onPress={onShare} accessibilityLabel="share" style={{ alignItems: 'center', gap: r.s(5) }}>
            <View style={{ width: r.s(48), height: r.s(48), borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="share-outline" size={r.s(21)} color="#fff" />
            </View>
            <Text size={11} weight="bold" color="#fff">Share</Text>
          </Pressable>
        </View>

        {item.title ? (
          <View pointerEvents="none" style={{ position: 'absolute', left: r.s(18), right: r.s(88), bottom: insetsBottom + r.s(20) }}>
            <Text size={15} weight="bold" lh={1.4} color="#fff">{item.title}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}
