import React from 'react';
import { AbsoluteFill, Composition, Series } from 'remotion';
import { CANVAS } from './theme';
import {
  AdminUsers,
  Announcements,
  AudioSermons,
  CommunityGroups,
  Devotionals,
  Giving,
  Intro,
  Login,
  Notifications,
  Outro,
  Tour,
  VideoSermons,
} from './scenes';

const FPS = 30;
const sec = (s: number) => Math.round(s * FPS);

/**
 * Scene order and length. Durations are generous enough for the captions inside
 * each scene to finish - a scene that ends early would cut a sentence in half.
 */
const SCENES: { component: React.FC; seconds: number }[] = [
  { component: Intro, seconds: 6 },
  { component: Login, seconds: 12 },
  { component: Tour, seconds: 15 },
  { component: Devotionals, seconds: 16 },
  { component: VideoSermons, seconds: 10 },
  { component: AudioSermons, seconds: 9 },
  { component: Announcements, seconds: 13 },
  { component: Giving, seconds: 26 },
  { component: CommunityGroups, seconds: 9 },
  { component: AdminUsers, seconds: 14 },
  { component: Notifications, seconds: 13 },
  { component: Outro, seconds: 10 },
];

export const TOTAL_FRAMES = SCENES.reduce((sum, s) => sum + sec(s.seconds), 0);

const AdminWalkthrough: React.FC = () => (
  <AbsoluteFill style={{ background: '#0B1220' }}>
    <Series>
      {SCENES.map(({ component: Scene, seconds }, i) => (
        <Series.Sequence key={i} durationInFrames={sec(seconds)} premountFor={FPS}>
          <Scene />
        </Series.Sequence>
      ))}
    </Series>
  </AbsoluteFill>
);

export const RemotionRoot: React.FC = () => (
  <Composition
    id="AdminWalkthrough"
    component={AdminWalkthrough}
    durationInFrames={TOTAL_FRAMES}
    fps={FPS}
    width={CANVAS.width}
    height={CANVAS.height}
  />
);
