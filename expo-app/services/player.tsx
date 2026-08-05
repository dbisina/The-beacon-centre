import React, { createContext, useContext, useEffect, useMemo, useRef, useState, ReactNode } from 'react';
import { Audio, AVPlaybackStatus } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Audio player.
 *
 * Rewritten from the old app/context/audio.tsx, which had two bugs worth
 * naming: it read `currentSong` (stale state) inside playSong instead of the
 * incoming `song`, so the first tap played nothing; and its cleanup effect
 * unloaded on every `currentSong` change, racing the newly created sound.
 * Here a single ref holds the sound, and each load unloads the previous one
 * before creating the next.
 *
 * Playback position is persisted so the app resumes where the listener left
 * off — the "Continue listening" behaviour the design assumes.
 */

export type Track = {
  id: string;
  title: string;
  preacher?: string;
  series?: string;
  audioUrl: string | null;
  imageUrl?: string | null;
};

type Ctx = {
  current: Track | null;
  queue: Track[];
  isPlaying: boolean;
  isLoading: boolean;
  positionMs: number;
  durationMs: number;
  error: string | null;
  rate: number;
  setQueue: (t: Track[]) => void;
  play: (t: Track) => Promise<void>;
  toggle: () => Promise<void>;
  seek: (ms: number) => Promise<void>;
  skip: (secs: number) => Promise<void>;
  next: () => Promise<void>;
  prev: () => Promise<void>;
  setRate: (r: number) => Promise<void>;
};

const PlayerCtx = createContext<Ctx | undefined>(undefined);
const POS_KEY = (id: string) => `progress:${id}`;

export function PlayerProvider({ children }: { children: ReactNode }) {
  const sound = useRef<Audio.Sound | null>(null);
  const [current, setCurrent] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [isPlaying, setPlaying] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [positionMs, setPosition] = useState(0);
  const [durationMs, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [rate, setRateState] = useState(1);

  // Background audio + plays with the ringer switch on iOS silent.
  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    }).catch(() => {});
    return () => {
      sound.current?.unloadAsync().catch(() => {});
    };
  }, []);

  const onStatus = (st: AVPlaybackStatus) => {
    if (!st.isLoaded) return;
    setPlaying(st.isPlaying);
    setPosition(st.positionMillis ?? 0);
    setDuration(st.durationMillis ?? 0);
    if (st.didJustFinish) void next();
  };

  async function play(track: Track) {
    if (!track.audioUrl) {
      setError('This message has no audio file yet.');
      return;
    }
    // Same track: just resume.
    if (current?.id === track.id && sound.current) {
      await sound.current.playAsync();
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await sound.current?.unloadAsync();
      sound.current = null;
      const saved = Number((await AsyncStorage.getItem(POS_KEY(track.id))) ?? 0);
      const { sound: s } = await Audio.Sound.createAsync(
        { uri: track.audioUrl },
        { shouldPlay: true, positionMillis: saved, rate, shouldCorrectPitch: true },
        onStatus
      );
      sound.current = s;
      setCurrent(track);
    } catch (e: any) {
      setError(e?.message ?? 'Could not play this message');
    } finally {
      setLoading(false);
    }
  }

  async function toggle() {
    if (!sound.current) return;
    const st = await sound.current.getStatusAsync();
    if (!st.isLoaded) return;
    st.isPlaying ? await sound.current.pauseAsync() : await sound.current.playAsync();
  }

  const seek = async (ms: number) => {
    await sound.current?.setPositionAsync(Math.max(0, ms));
  };
  const skip = async (secs: number) => seek(positionMs + secs * 1000);

  async function next() {
    const i = queue.findIndex((t) => t.id === current?.id);
    if (i >= 0 && i < queue.length - 1) await play(queue[i + 1]);
    else setPlaying(false);
  }
  async function prev() {
    // Standard behaviour: restart if we're more than 3s in.
    if (positionMs > 3000) return seek(0);
    const i = queue.findIndex((t) => t.id === current?.id);
    if (i > 0) await play(queue[i - 1]);
  }

  async function setRate(next: number) {
    setRateState(next);
    await sound.current?.setRateAsync(next, true);
  }

  // Persist position (throttled by the 1s status cadence being coarse enough).
  useEffect(() => {
    if (current && positionMs > 0) AsyncStorage.setItem(POS_KEY(current.id), String(positionMs)).catch(() => {});
  }, [current, positionMs]);

  const value = useMemo<Ctx>(
    () => ({ current, queue, isPlaying, isLoading, positionMs, durationMs, error, rate, setQueue, play, toggle, seek, skip, next, prev, setRate }),
    [current, queue, isPlaying, isLoading, positionMs, durationMs, error, rate]
  );

  return React.createElement(PlayerCtx.Provider, { value }, children);
}

export function usePlayer() {
  const ctx = useContext(PlayerCtx);
  if (!ctx) throw new Error('usePlayer must be used inside PlayerProvider');
  return ctx;
}

export const fmtTime = (ms: number) => {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
};
