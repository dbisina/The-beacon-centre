import React, { useEffect, useRef, useState } from 'react';
import { View, Linking, StyleProp, ViewStyle } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
// Not re-exported from the package root in this version - see
// node_modules/react-native-webview/index.d.ts, which only re-exports
// FileDownload/WebViewMessageEvent/WebViewNavigation.
import { ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, useResponsive } from '@/theme';
import { Text, Btn, MediaTile } from '@/components/ui';
import { embedHtml, EMBED_ORIGIN, isValidYoutubeId, watchUrl } from '@/services/youtube';

const READY_TIMEOUT_MS = 10_000;

type Props = {
  youtubeId: string;
  title?: string;
  /** Falls back to YouTube's own thumbnail for this video - never a stock image. */
  thumbnailUrl?: string;
  autoplay?: boolean;
  height: number;
  rad?: keyof typeof radius;
  style?: StyleProp<ViewStyle>;
};

/**
 * Shared YouTube WebView player for the Live tab and full-message playback.
 *
 * Three things that used to be wrong before this existed:
 *  - the player never allowed autoplay without a user tap (no
 *    mediaPlaybackRequiresUserAction={false}), so "Live" opened to a still frame;
 *  - tapping the YouTube logo inside the embed navigated the whole WebView
 *    away from the app to youtube.com, with no way back except leaving the
 *    screen (no onShouldStartLoadWithRequest);
 *  - a genuinely broken embed (private/removed video, no network) showed a
 *    permanently black box with no way to reach the video at all.
 *
 * Not reused in app/player/shorts.tsx - that screen's full-bleed swipe feed
 * (FlatList paging + absolutely-positioned overlay controls, only the active
 * slide mounted) is a different shape than this component's fixed-height +
 * inline-fallback design, and swapping it in risked the paging/gesture
 * behaviour for a screen this change doesn't otherwise touch.
 */
export function YouTubePlayer({ youtubeId, title, thumbnailUrl, autoplay = true, height, rad = 'sm', style }: Props) {
  const r = useResponsive();
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fallbackThumb = thumbnailUrl || `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;

  useEffect(() => {
    setReady(false);
    setFailed(false);
    timeoutRef.current = setTimeout(() => setFailed(true), READY_TIMEOUT_MS);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [youtubeId]);

  function onMessage(e: WebViewMessageEvent) {
    try {
      const msg = JSON.parse(e.nativeEvent.data);
      if (msg.type === 'ready') {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setReady(true);
      } else if (msg.type === 'error') {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setFailed(true);
      }
    } catch {
      // Not JSON, or not one of ours - ignore.
    }
  }

  /**
   * Keeps navigation inside the embed itself (about:blank is the WebView's
   * own initial document; EMBED_ORIGIN/youtube.com/embed is the player).
   * Anything else - the YouTube logo, "Watch on youtube.com", a related
   * video, an ad's landing page - opens in the real YouTube app/browser
   * instead of hijacking the screen.
   *
   * This callback also fires for sub-frame (iframe) navigations, not just
   * top-level ones - the IFrame Player API's own embed load, and any ad/
   * companion iframe YouTube's player pulls in, all go through here too.
   * Only a real top-level navigation (the user tapping something) should
   * ever be redirected out of the app, so non-top-frame requests are let
   * through unconditionally before the domain check.
   */
  function onShouldStartLoadWithRequest(request: ShouldStartLoadRequest): boolean {
    if (!request.isTopFrame) return true;

    const url = request.url;
    if (url.startsWith('about:blank')) return true;
    if (url.startsWith(EMBED_ORIGIN)) return true;
    try {
      const { protocol, hostname } = new URL(url);
      if (protocol !== 'https:') return false;
      if (hostname === 'www.youtube.com' || hostname === 'youtube.com') return true;
      if (hostname.endsWith('.ytimg.com') || hostname === 'ytimg.com') return true;
      if (hostname.endsWith('.googlevideo.com') || hostname === 'googlevideo.com') return true;
    } catch {
      return false;
    }
    Linking.openURL(url).catch(() => {});
    return false;
  }

  if (failed || !isValidYoutubeId(youtubeId)) {
    return (
      <MediaTile source={{ uri: fallbackThumb }} height={height} rad={rad} style={style}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: r.s(16) }}>
          <Ionicons name="alert-circle-outline" size={r.s(28)} color="#fff" />
          <Text size={12.5} color="#fff" style={{ marginTop: r.s(8), textAlign: 'center' }}>
            This video couldn't load here.
          </Text>
          <Btn
            label="Watch on YouTube"
            tone="plain"
            style={{ marginTop: r.s(12) }}
            left={<Ionicons name="logo-youtube" size={r.s(15)} color={colors.ink} />}
            onPress={() => Linking.openURL(watchUrl(youtubeId)).catch(() => {})}
          />
        </View>
      </MediaTile>
    );
  }

  return (
    <View style={[{ height: r.s(height), borderRadius: radius[rad], overflow: 'hidden', backgroundColor: '#000' }, style]}>
      <WebView
        source={{ html: embedHtml(youtubeId, autoplay), baseUrl: EMBED_ORIGIN }}
        style={{ flex: 1, backgroundColor: '#000' }}
        accessibilityLabel={title ? `${title} video player` : 'Video player'}
        originWhitelist={['*']}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        allowsFullscreenVideo
        allowsPictureInPictureMediaPlayback
        javaScriptEnabled
        domStorageEnabled
        onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
        onMessage={onMessage}
        onError={() => setFailed(true)}
        onHttpError={() => setFailed(true)}
      />
      {!ready ? (
        <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
          <MediaTile source={{ uri: fallbackThumb }} height={height} rad={rad} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
        </View>
      ) : null}
    </View>
  );
}
