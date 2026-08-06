import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { APP, c, FONT, NAV, SIDEBAR_W, TOPBAR_H, type NavName } from '../theme';
import { Icon } from './Icon';

/* ----------------------------------------------------------- browser frame -- */

export const BrowserFrame: React.FC<{ url: string; children: React.ReactNode }> = ({
  url,
  children,
}) => (
  <div
    style={{
      position: 'absolute',
      left: APP.x,
      top: APP.y,
      width: APP.width,
      height: APP.height,
      borderRadius: 14,
      overflow: 'hidden',
      background: c.surface,
      boxShadow: '0 30px 80px rgba(15,23,42,0.28)',
      fontFamily: FONT,
    }}
  >
    <div
      style={{
        height: 44,
        background: '#EDEDED',
        display: 'flex',
        alignItems: 'center',
        paddingLeft: 16,
        gap: 8,
        borderBottom: '1px solid #DDD',
      }}
    >
      {['#FF5F57', '#FEBC2E', '#28C840'].map((dot) => (
        <div key={dot} style={{ width: 12, height: 12, borderRadius: 99, background: dot }} />
      ))}
      <div
        style={{
          marginLeft: 16,
          background: '#FFF',
          borderRadius: 7,
          height: 26,
          flex: 1,
          marginRight: 20,
          display: 'flex',
          alignItems: 'center',
          paddingLeft: 12,
          fontSize: 13,
          color: c.muted,
        }}
      >
        {url}
      </div>
    </div>
    <div style={{ position: 'relative', height: APP.height - 44 }}>{children}</div>
  </div>
);

/* ------------------------------------------------------------------ shell --- */

export const Sidebar: React.FC<{ active: NavName; highlight?: NavName }> = ({
  active,
  highlight,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pulse = interpolate(Math.sin((frame / fps) * 6), [-1, 1], [0.35, 1]);

  return (
    <div
      style={{
        width: SIDEBAR_W,
        height: '100%',
        background: c.surface,
        borderRight: `1px solid ${c.border}`,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          height: TOPBAR_H,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '0 24px',
          borderBottom: `1px solid ${c.border}`,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: c.teal500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#04211B',
            fontWeight: 800,
            fontSize: 15,
          }}
        >
          B
        </div>
        <div style={{ fontSize: 17, fontWeight: 600, color: c.ink }}>TBC Admin</div>
      </div>

      <div style={{ flex: 1, padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: 3 }}>
        {NAV.map((item) => {
          const isActive = item.name === active;
          const isHint = item.name === highlight && !isActive;
          return (
            <div
              key={item.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '9px 12px',
                borderRadius: 8,
                background: isActive
                  ? c.slate900
                  : isHint
                    ? `rgba(20,184,166,${0.10 + pulse * 0.16})`
                    : 'transparent',
                color: isActive ? '#FFF' : c.inkSoft,
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              <Icon name={item.icon} size={19} color={isActive ? '#FFF' : c.faint} />
              <span style={{ flex: 1 }}>{item.name}</span>
              {'badge' in item && item.badge ? (
                <span
                  style={{
                    background: isActive ? 'rgba(255,255,255,0.2)' : '#F1F5F9',
                    color: isActive ? '#FFF' : c.inkSoft,
                    borderRadius: 6,
                    fontSize: 12,
                    padding: '1px 8px',
                    fontWeight: 600,
                  }}
                >
                  {item.badge}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>

      <div style={{ padding: 16, borderTop: `1px solid ${c.border}`, display: 'flex', gap: 12, alignItems: 'center' }}>
        <Avatar />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: c.ink }}>Pastor</div>
          <div style={{ fontSize: 12, color: c.muted }}>admin@thebeaconcentre.org</div>
        </div>
      </div>
    </div>
  );
};

const Avatar: React.FC = () => (
  <div
    style={{
      width: 32,
      height: 32,
      borderRadius: 99,
      background: c.teal100,
      color: c.teal700,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 12,
      fontWeight: 600,
    }}
  >
    PA
  </div>
);

export const TopBar: React.FC = () => (
  <div
    style={{
      height: TOPBAR_H,
      background: c.surface,
      borderBottom: `1px solid ${c.border}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
    }}
  >
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: 256,
        height: 36,
        border: `1px solid ${c.border}`,
        borderRadius: 8,
        padding: '0 12px',
        color: c.faint,
        fontSize: 13.5,
      }}
    >
      <Icon name="search" size={16} color={c.faint} />
      Search content...
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
      <div style={{ position: 'relative' }}>
        <Icon name="bell" size={20} color={c.inkSoft} />
        <div
          style={{
            position: 'absolute',
            top: -6,
            right: -8,
            background: c.red600,
            color: '#FFF',
            fontSize: 11,
            width: 18,
            height: 18,
            borderRadius: 99,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 600,
          }}
        >
          2
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Avatar />
        <span style={{ fontSize: 14, fontWeight: 500, color: c.inkSoft }}>Pastor</span>
        <Icon name="chevron" size={16} color={c.faint} />
      </div>
    </div>
  </div>
);

export const PageShell: React.FC<{
  active: NavName;
  highlight?: NavName;
  children: React.ReactNode;
}> = ({ active, highlight, children }) => (
  <div style={{ display: 'flex', height: '100%', background: c.ground }}>
    <Sidebar active={active} highlight={highlight} />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <TopBar />
      <div style={{ flex: 1, padding: 28, overflow: 'hidden' }}>{children}</div>
    </div>
  </div>
);

/* ------------------------------------------------------------- primitives --- */

export const PageTitle: React.FC<{ title: string; sub: string; action?: string }> = ({
  title,
  sub,
  action,
}) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
    <div>
      <div style={{ fontSize: 30, fontWeight: 700, color: c.ink }}>{title}</div>
      <div style={{ fontSize: 15, color: c.muted, marginTop: 4 }}>{sub}</div>
    </div>
    {action ? (
      <div
        style={{
          background: c.slate900,
          color: '#FFF',
          borderRadius: 8,
          padding: '11px 18px',
          fontSize: 14,
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <Icon name="plus" size={16} color="#FFF" />
        {action}
      </div>
    ) : null}
  </div>
);

export const Card: React.FC<{ title?: string; sub?: string; children: React.ReactNode; style?: React.CSSProperties }> = ({
  title,
  sub,
  children,
  style,
}) => (
  <div
    style={{
      background: c.surface,
      border: `1px solid ${c.border}`,
      borderRadius: 12,
      padding: 22,
      boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
      ...style,
    }}
  >
    {title ? (
      <div style={{ marginBottom: sub ? 4 : 16 }}>
        <div style={{ fontSize: 18, fontWeight: 600, color: c.ink }}>{title}</div>
        {sub ? <div style={{ fontSize: 13.5, color: c.muted, marginTop: 3, marginBottom: 14 }}>{sub}</div> : null}
      </div>
    ) : null}
    {children}
  </div>
);

/**
 * A labelled form field. `typed` drives a per-character reveal so the viewer
 * sees the value being entered rather than appearing all at once.
 */
export const Field: React.FC<{
  label: string;
  value?: string;
  placeholder?: string;
  typed?: number;
  select?: boolean;
  textarea?: boolean;
  focused?: boolean;
}> = ({ label, value, placeholder, typed = 1, select, textarea, focused }) => {
  const shown = value ? value.slice(0, Math.floor(value.length * typed)) : '';
  const showPlaceholder = !shown;
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 13.5, fontWeight: 500, color: c.inkSoft, marginBottom: 7 }}>{label}</div>
      <div
        style={{
          minHeight: textarea ? 92 : 42,
          border: `1px solid ${focused ? c.teal500 : c.borderStrong}`,
          boxShadow: focused ? `0 0 0 3px rgba(20,184,166,0.20)` : '0 1px 2px rgba(0,0,0,0.04)',
          borderRadius: 8,
          background: c.surface,
          display: 'flex',
          alignItems: textarea ? 'flex-start' : 'center',
          justifyContent: 'space-between',
          padding: textarea ? '11px 14px' : '0 14px',
          fontSize: 14.5,
          color: showPlaceholder ? c.faint : c.ink,
          lineHeight: 1.5,
        }}
      >
        <span style={{ whiteSpace: 'pre-wrap' }}>
          {showPlaceholder ? placeholder : shown}
          {!showPlaceholder && typed < 1 ? <Caret /> : null}
        </span>
        {select ? <Icon name="chevron" size={16} color={c.faint} /> : null}
      </div>
    </div>
  );
};

const Caret: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <span style={{ opacity: frame % 16 < 8 ? 1 : 0, color: c.teal600, fontWeight: 300 }}>|</span>
  );
};

export const Pill: React.FC<{ text: string; tone?: 'green' | 'grey' | 'amber' }> = ({ text, tone = 'green' }) => {
  const map = {
    green: { bg: c.green100, fg: c.green800 },
    grey: { bg: '#E2E8F0', fg: '#334155' },
    amber: { bg: c.amber100, fg: c.amber800 },
  }[tone];
  return (
    <span
      style={{
        background: map.bg,
        color: map.fg,
        borderRadius: 99,
        padding: '4px 12px',
        fontSize: 12.5,
        fontWeight: 600,
      }}
    >
      {text}
    </span>
  );
};

/* ---------------------------------------------------------------- cursor ---- */

/**
 * Pointer that travels from `from` to `to` and lands with a click ripple.
 * Coordinates are in canvas space so scenes can point at anything on screen.
 */
export const Cursor: React.FC<{
  from: [number, number];
  to: [number, number];
  moveStart: number;
  clickAt?: number;
}> = ({ from, to, moveStart, clickAt }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - moveStart,
    fps,
    config: { damping: 200 },
    durationInFrames: Math.round(0.8 * fps),
  });

  const x = interpolate(progress, [0, 1], [from[0], to[0]]);
  const y = interpolate(progress, [0, 1], [from[1], to[1]]);

  const sinceClick = clickAt === undefined ? -1 : frame - clickAt;
  const ripple = sinceClick >= 0 && sinceClick < 0.6 * fps ? sinceClick / (0.6 * fps) : -1;

  return (
    <div style={{ position: 'absolute', left: x, top: y, pointerEvents: 'none' }}>
      {ripple >= 0 ? (
        <div
          style={{
            position: 'absolute',
            left: -18,
            top: -18,
            width: 36,
            height: 36,
            borderRadius: 99,
            border: `3px solid ${c.teal500}`,
            transform: `scale(${1 + ripple * 1.4})`,
            opacity: 1 - ripple,
          }}
        />
      ) : null}
      <svg width="30" height="30" viewBox="0 0 24 24" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.35))' }}>
        <path d="M5 2l14 11-6.5.6 3.6 7-2.8 1.3-3.6-7L5 19z" fill="#FFF" stroke="#111827" strokeWidth="1.4" />
      </svg>
    </div>
  );
};

/* --------------------------------------------------------------- captions --- */

export const Caption: React.FC<{ text: string; step?: string }> = ({ text, step }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 200 }, durationInFrames: Math.round(0.5 * fps) });

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 34,
        display: 'flex',
        justifyContent: 'center',
        opacity: enter,
        transform: `translateY(${interpolate(enter, [0, 1], [16, 0])}px)`,
        fontFamily: FONT,
      }}
    >
      <div
        style={{
          background: 'rgba(15,23,42,0.94)',
          color: '#FFF',
          borderRadius: 12,
          padding: '14px 26px',
          fontSize: 25,
          fontWeight: 500,
          maxWidth: 1500,
          textAlign: 'center',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}
      >
        {step ? (
          <span
            style={{
              background: c.teal500,
              color: '#04211B',
              borderRadius: 8,
              padding: '3px 12px',
              fontSize: 20,
              fontWeight: 800,
            }}
          >
            {step}
          </span>
        ) : null}
        {text}
      </div>
    </div>
  );
};
