import React from 'react';
import { AbsoluteFill, interpolate, Sequence, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { APP, c, FONT } from './theme';
import { Icon } from './components/Icon';
import { BrowserFrame, Caption, Card, Cursor, Field, PageShell, PageTitle, Pill } from './components/Ui';

const URL = 'beacon-admin-sigma.vercel.app';

/** Progress 0..1 across `seconds`, clamped - used to drive typing reveals. */
const useTyping = (startSec: number, durationSec: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return interpolate(frame, [startSec * fps, (startSec + durationSec) * fps], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
};

const Stage: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill style={{ background: '#0B1220', fontFamily: FONT }}>{children}</AbsoluteFill>
);

/* ------------------------------------------------------------------ intro -- */

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rise = spring({ frame, fps, config: { damping: 200 } });
  const sub = spring({ frame: frame - 0.5 * fps, fps, config: { damping: 200 } });

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(135deg, #0E3B38 0%, #04211B 100%)',
        fontFamily: FONT,
        alignItems: 'center',
        justifyContent: 'center',
        color: '#FFF',
      }}
    >
      <div
        style={{
          width: 96,
          height: 96,
          borderRadius: 24,
          background: c.teal500,
          color: '#04211B',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 46,
          fontWeight: 800,
          transform: `scale(${rise})`,
        }}
      >
        B
      </div>
      <div
        style={{
          fontSize: 68,
          fontWeight: 800,
          marginTop: 34,
          letterSpacing: -1.5,
          opacity: rise,
          transform: `translateY(${interpolate(rise, [0, 1], [30, 0])}px)`,
        }}
      >
        The Beacon Centre
      </div>
      <div style={{ fontSize: 34, color: c.teal500, marginTop: 10, fontWeight: 600, opacity: sub }}>
        Admin Dashboard — a walkthrough
      </div>
      <div style={{ fontSize: 22, color: 'rgba(255,255,255,0.65)', marginTop: 26, opacity: sub }}>
        Everything the church app shows is managed from here
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ login -- */

export const Login: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const email = useTyping(2, 2.4);
  const pass = useTyping(5, 1.6);
  const pressed = frame > 8.4 * fps;

  return (
    <Stage>
      <BrowserFrame url={`${URL}/login`}>
        <div
          style={{
            height: '100%',
            background: c.teal50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ width: 430 }}>
            <div style={{ textAlign: 'center', marginBottom: 26 }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 16,
                  background: c.ink,
                  color: '#FFF',
                  margin: '0 auto 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 30,
                  fontWeight: 800,
                }}
              >
                B
              </div>
              <div style={{ fontSize: 30, fontWeight: 700, color: c.ink }}>The Beacon Centre</div>
              <div style={{ fontSize: 15, color: c.muted, marginTop: 4 }}>Admin Dashboard</div>
            </div>

            <Card>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 6 }}>
                <Icon name="shield" size={22} color={c.teal500} />
                <div style={{ fontSize: 23, fontWeight: 600, color: c.ink }}>Sign In</div>
              </div>
              <div style={{ fontSize: 13.5, color: c.muted, textAlign: 'center', marginBottom: 22 }}>
                Enter your credentials to access the admin dashboard
              </div>
              <Field
                label="Email Address"
                value="pastor@thebeaconcentre.org"
                placeholder="Enter your email"
                typed={email}
                focused={email > 0 && email < 1}
              />
              <Field
                label="Password"
                value="••••••••••"
                placeholder="Enter your password"
                typed={pass}
                focused={pass > 0 && pass < 1}
              />
              <div
                style={{
                  height: 44,
                  borderRadius: 8,
                  background: pressed ? c.teal600 : c.teal500,
                  color: '#FFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  fontSize: 15,
                  fontWeight: 600,
                  transform: `scale(${pressed ? 0.98 : 1})`,
                }}
              >
                <Icon name="shield" size={16} color="#FFF" />
                Sign In
              </div>
            </Card>
          </div>
        </div>
      </BrowserFrame>

      <Cursor from={[1400, 900]} to={[APP.x + 800, APP.y + 690]} moveStart={7 * fps} clickAt={8.4 * fps} />

      <Sequence durationInFrames={4 * fps} premountFor={fps}>
        <Caption step="1" text="Open the dashboard link and sign in with your email and password" />
      </Sequence>
      <Sequence from={4 * fps} premountFor={fps}>
        <Caption text="Change this password once you are in — Settings, then your account" />
      </Sequence>
    </Stage>
  );
};

/* ------------------------------------------------------------------- tour -- */

const TOUR: { name: any; caption: string }[] = [
  { name: 'Devotionals', caption: 'Devotionals — the daily word on the app home screen' },
  { name: 'Video Sermons', caption: 'Video and Audio Sermons — the messages people watch and listen to' },
  { name: 'Announcements', caption: 'Announcements — notices shown in the app News section' },
  { name: 'Giving', caption: 'Giving — transactions, bank accounts and fundraising projects' },
  { name: 'Community Groups', caption: 'Community Groups — CSG details, meeting times and locations' },
];

export const Tour: React.FC = () => {
  const { fps } = useVideoConfig();
  const per = 3 * fps;

  return (
    <Stage>
      {TOUR.map((item, i) => (
        <Sequence key={item.name} from={i * per} durationInFrames={per} premountFor={fps}>
          <BrowserFrame url={`${URL}/dashboard`}>
            <PageShell active="Dashboard" highlight={item.name}>
              <PageTitle title="Dashboard" sub="Welcome back — here is what is happening in the app" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                {[
                  ['Devotionals', '31'],
                  ['Video Sermons', '48'],
                  ['Audio Sermons', '22'],
                  ['Announcements', '3'],
                ].map(([label, value]) => (
                  <Card key={label}>
                    <div style={{ fontSize: 13, color: c.muted, fontWeight: 500 }}>{label}</div>
                    <div style={{ fontSize: 30, fontWeight: 700, color: c.ink, marginTop: 6 }}>{value}</div>
                  </Card>
                ))}
              </div>
              <div style={{ marginTop: 20 }}>
                <Card title="The menu on the left" sub="Every section of the app is managed from one of these">
                  <div style={{ fontSize: 15, color: c.inkSoft, lineHeight: 1.9 }}>
                    What you see depends on your role. Items you do not have permission for simply do not appear —
                    nothing is broken if your menu is shorter than someone else&apos;s.
                  </div>
                </Card>
              </div>
            </PageShell>
          </BrowserFrame>
          <Caption step={`${i + 1}/5`} text={item.caption} />
        </Sequence>
      ))}
    </Stage>
  );
};

/* -------------------------------------------------------------- devotional -- */

export const Devotionals: React.FC = () => {
  const { fps } = useVideoConfig();
  const title = useTyping(1.5, 2);
  const ref = useTyping(4, 1.4);
  const verse = useTyping(6, 2.4);
  const body = useTyping(9, 3);

  return (
    <Stage>
      <BrowserFrame url={`${URL}/dashboard/devotionals/new`}>
        <PageShell active="Devotionals">
          <PageTitle title="New Devotional" sub="Write the devotional for a given day" />
          <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: 20 }}>
            <Card title="Content">
              <Field label="Date" value="Sunday, 9 August 2026" typed={1} select />
              <Field label="Title" value="Light that doesn't flicker" placeholder="Enter devotional title..." typed={title} focused={title > 0 && title < 1} />
              <Field label="Verse Reference" value="Matthew 5:14" placeholder="e.g., John 3:16, Psalm 23:1-3" typed={ref} focused={ref > 0 && ref < 1} />
              <Field
                label="Verse Text"
                value="You are the light of the world. A city set on a hill cannot be hidden."
                placeholder="Enter the complete verse text..."
                typed={verse}
                textarea
                focused={verse > 0 && verse < 1}
              />
            </Card>
            <Card title="Main Content">
              <Field
                label="Main Content"
                value={'A lamp is a small thing. It does not argue, it does not shout.\n\nIt simply keeps burning, and the room changes around it.'}
                placeholder="Write your devotional content here..."
                typed={body}
                textarea
                focused={body > 0 && body < 1}
              />
              <Field label="Prayer (Optional)" placeholder="Add a closing prayer..." />
            </Card>
          </div>
        </PageShell>
      </BrowserFrame>

      <Sequence durationInFrames={5 * fps} premountFor={fps}>
        <Caption step="Devotionals" text="Title, the verse reference, then the verse written out in full" />
      </Sequence>
      <Sequence from={5 * fps} durationInFrames={6 * fps} premountFor={fps}>
        <Caption text="Leave a blank line between paragraphs — the app splits them automatically" />
      </Sequence>
      <Sequence from={11 * fps} premountFor={fps}>
        <Caption text="If no devotional is set for a day, the app says so rather than inventing one" />
      </Sequence>
    </Stage>
  );
};

/* ------------------------------------------------------------------ media -- */

export const VideoSermons: React.FC = () => {
  const link = useTyping(1.5, 2.2);
  const speaker = useTyping(5, 1.6);

  return (
    <Stage>
      <BrowserFrame url={`${URL}/dashboard/video-sermons/new`}>
        <PageShell active="Video Sermons">
          <PageTitle title="Add Video Sermon" sub="Paste a YouTube link — the details are read automatically" />
          <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: 20 }}>
            <Card title="YouTube">
              <Field
                label="YouTube URL"
                value="https://www.youtube.com/watch?v=xQ3s8kM2p1U"
                placeholder="https://www.youtube.com/watch?v=..."
                typed={link}
                focused={link > 0 && link < 1}
              />
              <Field label="Title" value="Carry The Flame — Beacon Series 03" typed={link} />
              <Field label="Speaker" value="Pastor Bisina" placeholder="Enter speaker name" typed={speaker} focused={speaker > 0 && speaker < 1} />
              <Field label="Type" value="Sermon" select typed={1} />
            </Card>
            <Card title="Organise">
              <Field label="Category" value="Sunday Service" select typed={1} />
              <Field label="Series" placeholder="e.g. Love Series - leave blank if this isn't part of one" />
              <Field label="Tags" placeholder="Enter tags separated by commas" />
            </Card>
          </div>
        </PageShell>
      </BrowserFrame>
      <Caption step="Video Sermons" text="You never upload the video — paste its YouTube link and the rest fills in" />
    </Stage>
  );
};

export const AudioSermons: React.FC = () => {
  const title = useTyping(1.5, 2);

  return (
    <Stage>
      <BrowserFrame url={`${URL}/dashboard/audio-sermons/new`}>
        <PageShell active="Audio Sermons">
          <PageTitle title="Upload Audio Sermon" sub="Upload a new audio sermon file" />
          <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: 20 }}>
            <Card title="Details">
              <Field label="Title" value="Stay Lit — Part 1" placeholder="Enter sermon title..." typed={title} focused={title > 0 && title < 1} />
              <Field label="Speaker" value="Pastor Bisina" typed={title} />
              <Field label="Category" value="Impart Service" select typed={1} />
              <Field label="Sermon Date (Optional)" value="2 August 2026" typed={1} select />
            </Card>
            <Card title="Audio file">
              <div
                style={{
                  border: `2px dashed ${c.borderStrong}`,
                  borderRadius: 10,
                  padding: 28,
                  textAlign: 'center',
                  color: c.muted,
                  fontSize: 14.5,
                }}
              >
                <Icon name="headphones" size={30} color={c.faint} />
                <div style={{ marginTop: 10 }}>stay-lit-part-1.mp3</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>32 min · uploaded</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 20 }}>
                <div style={{ width: 42, height: 24, borderRadius: 99, background: c.teal500, position: 'relative' }}>
                  <div style={{ position: 'absolute', right: 3, top: 3, width: 18, height: 18, borderRadius: 99, background: '#FFF' }} />
                </div>
                <span style={{ fontSize: 14, color: c.inkSoft }}>Featured Sermon</span>
              </div>
            </Card>
          </div>
        </PageShell>
      </BrowserFrame>
      <Caption step="Audio Sermons" text="Upload the file, name the speaker, and switch on Featured to push it to the top" />
    </Stage>
  );
};

export const Announcements: React.FC = () => {
  const { fps } = useVideoConfig();
  const title = useTyping(1.5, 2);
  const body = useTyping(4, 2.6);

  return (
    <Stage>
      <BrowserFrame url={`${URL}/dashboard/announcements/new`}>
        <PageShell active="Announcements">
          <PageTitle title="Create Announcement" sub="Create a new church announcement" />
          <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: 20 }}>
            <Card title="Announcement">
              <Field label="Title" value="Impart Service moves to 8:30AM" placeholder="Enter announcement title..." typed={title} focused={title > 0 && title < 1} />
              <Field
                label="Content"
                value="From Sunday 10 August the first service starts thirty minutes earlier. Doors open 8:00AM."
                placeholder="Enter announcement content..."
                typed={body}
                textarea
                focused={body > 0 && body < 1}
              />
              <Field label="Priority Level" value="High" select typed={1} />
            </Card>
            <Card title="Scheduling">
              <Field label="Start Date" value="4 August 2026" select typed={1} />
              <Field label="Expiry Date (Optional)" value="11 August 2026" select typed={1} />
              <Field label="Button Text" placeholder="e.g., Learn More, Register Now, Contact Us" />
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
                <div style={{ width: 42, height: 24, borderRadius: 99, background: c.teal500, position: 'relative' }}>
                  <div style={{ position: 'absolute', right: 3, top: 3, width: 18, height: 18, borderRadius: 99, background: '#FFF' }} />
                </div>
                <span style={{ fontSize: 14, color: c.inkSoft }}>Active Status</span>
              </div>
            </Card>
          </div>
        </PageShell>
      </BrowserFrame>
      <Sequence durationInFrames={7 * fps} premountFor={30}>
        <Caption step="Announcements" text="Set an expiry date and the notice removes itself after the event" />
      </Sequence>
      <Sequence from={7 * fps} premountFor={30}>
        <Caption text="Switch Active off to hide an announcement without deleting it" />
      </Sequence>
    </Stage>
  );
};

/* ----------------------------------------------------------------- giving -- */

const GivingTabs: React.FC<{ active: 'Transactions' | 'Bank Accounts' | 'Projects' }> = ({ active }) => (
  <div style={{ display: 'flex', gap: 6, background: '#F1F5F9', borderRadius: 10, padding: 5, marginBottom: 20, width: 'fit-content' }}>
    {['Transactions', 'Bank Accounts', 'Projects'].map((t) => (
      <div
        key={t}
        style={{
          padding: '9px 22px',
          borderRadius: 7,
          fontSize: 14,
          fontWeight: 600,
          background: t === active ? c.surface : 'transparent',
          color: t === active ? c.ink : c.muted,
          boxShadow: t === active ? '0 1px 3px rgba(0,0,0,0.10)' : 'none',
        }}
      >
        {t}
      </div>
    ))}
  </div>
);

export const Giving: React.FC = () => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();

  const showDialog = frame > 20 * fps;

  return (
    <Stage>
      <BrowserFrame url={`${URL}/dashboard/giving`}>
        <PageShell active="Giving">
          <PageTitle title="Giving" sub="Manage the giving ledger, bank accounts, and projects" />

          {frame < 7 * fps ? (
            <>
              <GivingTabs active="Transactions" />
              <Card>
                <Row head cells={['Reference', 'Purpose', 'Amount', 'Status']} />
                {[
                  ['TBC-2026-0841', 'Tithe', '₦50,000', 'SUCCESS'],
                  ['TBC-2026-0840', 'Project', '₦25,000', 'SUCCESS'],
                  ['TBC-2026-0839', 'Offering', '₦10,000', 'SUCCESS'],
                ].map((r) => (
                  <Row key={r[0]} cells={r} pill />
                ))}
              </Card>
            </>
          ) : frame < 14 * fps ? (
            <>
              <GivingTabs active="Bank Accounts" />
              <Card title="Bank Accounts" sub="Shown to app users as the bank-transfer giving option">
                <div style={{ fontSize: 15, color: c.ink, fontWeight: 600 }}>Guaranty Trust Bank</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: c.ink, marginTop: 6, letterSpacing: 0.5 }}>0123456789</div>
                <div style={{ fontSize: 14, color: c.muted, marginTop: 4 }}>The Beacon Centre</div>
                <div
                  style={{
                    marginTop: 18,
                    background: c.teal50,
                    border: `1px solid ${c.teal100}`,
                    borderRadius: 10,
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    fontSize: 14.5,
                    color: c.teal700,
                  }}
                >
                  <Icon name="copy" size={18} color={c.teal700} />
                  In the app, people tap once to copy the bank name and account number
                </div>
              </Card>
            </>
          ) : (
            <>
              <GivingTabs active="Projects" />
              <Card title="Projects" sub="Fundraising projects shown in the mobile app">
                <Row head cells={['Project', 'Progress', 'Raised / Target', 'Status', '']} />
                {[
                  ['The new auditorium roof', '68%', '₦34,200,000 / ₦50,000,000', 'Active'],
                  ['Campus outreach bus', '31%', '₦3,720,000 / ₦12,000,000', 'Active'],
                ].map((r, i) => (
                  <Row key={r[0]} cells={[...r, '']} actions highlightTrash={i === 1 && frame > 17 * fps} />
                ))}
              </Card>
            </>
          )}
        </PageShell>

        {showDialog ? <DeleteDialog /> : null}
      </BrowserFrame>

      {frame > 15 * fps && frame < 21 * fps ? (
        <Cursor from={[1200, 700]} to={[APP.x + 1430, APP.y + 470]} moveStart={16 * fps} clickAt={19.5 * fps} />
      ) : null}

      <Sequence durationInFrames={7 * fps} premountFor={fps}>
        <Caption step="Giving" text="Transactions — every gift received, with its purpose and amount" />
      </Sequence>
      <Sequence from={7 * fps} durationInFrames={7 * fps} premountFor={fps}>
        <Caption text="Bank Accounts — the details the app shows for transfers" />
      </Sequence>
      <Sequence from={14 * fps} durationInFrames={6 * fps} premountFor={fps}>
        <Caption text="Projects — each with a progress bar. Press the red bin to remove one" />
      </Sequence>
      <Sequence from={20 * fps} premountFor={fps}>
        <Caption text="The confirmation names the project, so you can check before confirming" />
      </Sequence>
    </Stage>
  );
};

const Row: React.FC<{ cells: string[]; head?: boolean; pill?: boolean; actions?: boolean; highlightTrash?: boolean }> = ({
  cells,
  head,
  pill,
  actions,
  highlightTrash,
}) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: actions ? '2fr 1fr 2fr 1fr 0.6fr' : `repeat(${cells.length}, 1fr)`,
      alignItems: 'center',
      padding: '13px 4px',
      borderBottom: `1px solid ${c.border}`,
      fontSize: head ? 12.5 : 14.5,
      fontWeight: head ? 700 : 500,
      color: head ? c.muted : c.ink,
      letterSpacing: head ? 0.6 : 0,
      textTransform: head ? 'uppercase' : 'none',
    }}
  >
    {cells.map((cell, i) => (
      <div key={i}>
        {!head && pill && i === 3 ? (
          <Pill text={cell} />
        ) : !head && actions && i === 3 ? (
          <Pill text={cell} />
        ) : (
          cell
        )}
      </div>
    ))}
    {actions && !head ? (
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingRight: 6 }}>
        <Icon name="edit" size={18} color={c.faint} />
        <div
          style={{
            borderRadius: 6,
            background: highlightTrash ? c.red50 : 'transparent',
            padding: 2,
          }}
        >
          <Icon name="trash" size={18} color={c.red600} />
        </div>
      </div>
    ) : null}
  </div>
);

const DeleteDialog: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: frame - 20 * fps, fps, config: { damping: 200 }, durationInFrames: Math.round(0.4 * fps) });

  return (
    <AbsoluteFill style={{ background: `rgba(15,23,42,${0.55 * pop})`, alignItems: 'center', justifyContent: 'center' }}>
      <div
        style={{
          width: 560,
          background: c.surface,
          borderRadius: 14,
          padding: 30,
          boxShadow: '0 25px 60px rgba(0,0,0,0.30)',
          transform: `scale(${interpolate(pop, [0, 1], [0.94, 1])})`,
          opacity: pop,
        }}
      >
        <div style={{ fontSize: 22, fontWeight: 700, color: c.ink }}>Delete &quot;Campus outreach bus&quot;?</div>
        <div style={{ fontSize: 15, color: c.muted, marginTop: 12, lineHeight: 1.6 }}>
          This removes the project from the mobile app, so it can no longer receive project-designated giving. Past
          transactions are kept in the ledger. This action cannot be undone.
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 26 }}>
          <div style={{ padding: '11px 20px', borderRadius: 8, border: `1px solid ${c.borderStrong}`, fontSize: 14.5, fontWeight: 500 }}>
            Cancel
          </div>
          <div style={{ padding: '11px 24px', borderRadius: 8, background: c.red600, color: '#FFF', fontSize: 14.5, fontWeight: 600 }}>
            Delete
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* -------------------------------------------------------------------- csg -- */

export const CommunityGroups: React.FC = () => {
  const name = useTyping(1.5, 1.8);
  const meets = useTyping(4, 1.4);

  return (
    <Stage>
      <BrowserFrame url={`${URL}/dashboard/csgs/new`}>
        <PageShell active="Community Groups">
          <PageTitle title="New Community Group" sub="Meeting details and location shown in the app" />
          <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: 20 }}>
            <Card title="Group">
              <Field label="Name" value="Bodija CSG" placeholder="e.g., Youth Fellowship" typed={name} focused={name > 0 && name < 1} />
              <Field label="Description" placeholder="What is this group about?" textarea />
              <Field label="Meets On" value="Every Wednesday" placeholder="e.g., Every Wednesday" typed={meets} focused={meets > 0 && meets < 1} />
              <Field label="Meeting Time" value="6:30 PM" placeholder="e.g., 6:30 PM" typed={meets} />
            </Card>
            <Card title="Location">
              <Field label="Address" value="12 Awolowo Road, Bodija" placeholder="Meeting location address" typed={meets} />
              <Field label="Latitude (Optional)" placeholder="e.g., 6.5244" />
              <Field label="Longitude (Optional)" placeholder="e.g., 3.3792" />
            </Card>
          </div>
        </PageShell>
      </BrowserFrame>
      <Caption step="Community Groups" text="Each group can have its own CSG Admin, who manages that group and nothing else" />
    </Stage>
  );
};

/* ------------------------------------------------------------ admin users -- */

export const AdminUsers: React.FC = () => {
  const { fps } = useVideoConfig();
  const email = useTyping(2, 2);

  return (
    <Stage>
      <BrowserFrame url={`${URL}/dashboard/admin-users/new`}>
        <PageShell active="Admin Management">
          <PageTitle title="New Admin" sub="Create a new admin account" />
          <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: 20 }}>
            <Card title="Account Details" sub="Create login credentials and assign a role for the new admin">
              <Field label="Email" value="tolu@thebeaconcentre.org" placeholder="admin@example.com" typed={email} focused={email > 0 && email < 1} />
              <Field label="Password" placeholder="Minimum 6 characters" />
              <Field label="Full Name" placeholder="Enter admin's full name..." />
              <Field label="Role" value="Editor" select typed={1} />
            </Card>
            <Card title="Role Permissions">
              {[
                ['Super Admin', 'full access, including admin management'],
                ['Admin', 'manage content, giving, prayer & contact'],
                ['Editor', 'manage content only'],
                ['CSG Admin', 'manage a single assigned community group'],
              ].map(([role, desc]) => (
                <div key={role} style={{ fontSize: 14.5, color: c.inkSoft, marginBottom: 12, lineHeight: 1.5 }}>
                  <span style={{ fontWeight: 700, color: c.ink }}>{role}:</span> {desc}
                </div>
              ))}
            </Card>
          </div>
        </PageShell>
      </BrowserFrame>
      <Sequence durationInFrames={8 * fps} premountFor={fps}>
        <Caption step="Admin Management" text="Create an account for each person rather than sharing one login" />
      </Sequence>
      <Sequence from={8 * fps} premountFor={fps}>
        <Caption text="Give the smallest role that lets them do their job — an Editor cannot touch giving" />
      </Sequence>
    </Stage>
  );
};

/* ---------------------------------------------------------- notifications -- */

export const Notifications: React.FC = () => {
  const { fps } = useVideoConfig();
  const title = useTyping(2, 1.8);
  const body = useTyping(4.5, 2.4);

  return (
    <Stage>
      <BrowserFrame url={`${URL}/dashboard/notifications`}>
        <PageShell active="Notifications">
          <PageTitle title="Push Notifications" sub="Send an alert to everyone with the app installed" />
          <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: 20 }}>
            <Card title="Message">
              <Field label="Title" value="Service starts in 30 minutes" placeholder="Notification title..." typed={title} focused={title > 0 && title < 1} />
              <Field
                label="Message"
                value="Doors are open. See you at the 8:30 Impart Service."
                placeholder="Notification message..."
                typed={body}
                textarea
                focused={body > 0 && body < 1}
              />
            </Card>
            <Card title="Audience">
              <Field label="Audience" value="Everyone" select typed={1} />
              <Field label="Topic" placeholder="e.g. announcements, live" />
              <div
                style={{
                  marginTop: 10,
                  height: 46,
                  borderRadius: 8,
                  background: c.slate900,
                  color: '#FFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  fontSize: 15,
                  fontWeight: 600,
                }}
              >
                <Icon name="send" size={17} color="#FFF" />
                Send
              </div>
              <div style={{ fontSize: 13.5, color: c.red600, marginTop: 14, lineHeight: 1.5 }}>
                This goes to every phone immediately and cannot be recalled.
              </div>
            </Card>
          </div>
        </PageShell>
      </BrowserFrame>
      <Sequence durationInFrames={7 * fps} premountFor={fps}>
        <Caption step="Notifications" text="This interrupts everyone with the app installed — read it twice" />
      </Sequence>
      <Sequence from={7 * fps} premountFor={fps}>
        <Caption text="Once sent, it cannot be taken back" />
      </Sequence>
    </Stage>
  );
};

/* ------------------------------------------------------------------ outro -- */

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rise = spring({ frame, fps, config: { damping: 200 } });

  const points = [
    'Nothing is live until you press Save',
    'If a section is empty here, it is empty in the app',
    'Switch things off rather than deleting where you can',
    'Pull down in the app to load the newest content',
  ];

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(135deg, #0E3B38 0%, #04211B 100%)',
        fontFamily: FONT,
        alignItems: 'center',
        justifyContent: 'center',
        color: '#FFF',
      }}
    >
      <div style={{ fontSize: 50, fontWeight: 800, opacity: rise, transform: `translateY(${interpolate(rise, [0, 1], [24, 0])}px)` }}>
        Four things to remember
      </div>
      <div style={{ marginTop: 40 }}>
        {points.map((p, i) => {
          const enter = spring({ frame: frame - (0.6 + i * 0.45) * fps, fps, config: { damping: 200 } });
          return (
            <div
              key={p}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 18,
                fontSize: 30,
                marginBottom: 22,
                opacity: enter,
                transform: `translateX(${interpolate(enter, [0, 1], [-30, 0])}px)`,
              }}
            >
              <Icon name="check" size={30} color={c.teal500} strokeWidth={3} />
              {p}
            </div>
          );
        })}
      </div>
      <div style={{ fontSize: 22, color: 'rgba(255,255,255,0.6)', marginTop: 34 }}>
        Anything that looks wrong — send a screenshot
      </div>
    </AbsoluteFill>
  );
};
