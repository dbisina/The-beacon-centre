// src/services/audio/TrackPlayerService.ts
import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
  RepeatMode,
  Event,
  State,
  Track,
  playbackService,
} from 'react-native-track-player';
import { AudioSermon } from '@/types/api';

export interface PlaybackStatus {
  state: State;
  position: number;
  duration: number;
  track?: Track;
  isLoaded: boolean;
  isPlaying: boolean;
  volume: number;
  rate: number;
}

class TrackPlayerService {
  private static instance: TrackPlayerService;
  private isSetup = false;
  private statusUpdateCallback: ((status: PlaybackStatus) => void) | null = null;
  private currentQueue: AudioSermon[] = [];
  private currentIndex = 0;

  private constructor() {}

  public static getInstance(): TrackPlayerService {
    if (!TrackPlayerService.instance) {
      TrackPlayerService.instance = new TrackPlayerService();
    }
    return TrackPlayerService.instance;
  }

  async setupPlayer(): Promise<void> {
    if (this.isSetup) return;

    try {
      await TrackPlayer.setupPlayer({
        waitForBuffer: true,
      });

      await TrackPlayer.updateOptions({
        android: {
          appKilledPlaybackBehavior: AppKilledPlaybackBehavior.ContinuePlayback,
        },
        capabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.SkipToNext,
          Capability.SkipToPrevious,
          Capability.SeekTo,
          Capability.Stop,
        ],
        compactCapabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.SkipToNext,
        ],
        progressUpdateEventInterval: 1,
      });

      this.isSetup = true;
      console.log('TrackPlayer setup completed');
    } catch (error) {
      console.error('TrackPlayer setup failed:', error);
      throw error;
    }
  }

  public setStatusUpdateCallback(callback: (status: PlaybackStatus) => void) {
    this.statusUpdateCallback = callback;
  }

  async loadSermon(sermon: AudioSermon): Promise<void> {
    await this.setupPlayer();
    
    try {
      await TrackPlayer.reset();
      
      const track: Track = {
        id: sermon.id.toString(),
        url: sermon.audio_url,
        title: sermon.title,
        artist: sermon.speaker,
        duration: sermon.duration ? this.parseDuration(sermon.duration) : undefined,
        artwork: 'https://res.cloudinary.com/your-cloud/image/upload/v1/beacon-app/default-artwork.jpg',
      };

      await TrackPlayer.add(track);
      this.currentQueue = [sermon];
      this.currentIndex = 0;
      
      console.log('Sermon loaded:', sermon.title);
    } catch (error) {
      console.error('Error loading sermon:', error);
      throw error;
    }
  }

  async loadQueue(sermons: AudioSermon[], startIndex: number = 0): Promise<void> {
    await this.setupPlayer();
    
    try {
      await TrackPlayer.reset();
      
      const tracks: Track[] = sermons.map(sermon => ({
        id: sermon.id.toString(),
        url: sermon.audio_url,
        title: sermon.title,
        artist: sermon.speaker,
        duration: sermon.duration ? this.parseDuration(sermon.duration) : undefined,
        artwork: 'https://res.cloudinary.com/your-cloud/image/upload/v1/beacon-app/default-artwork.jpg',
      }));

      await TrackPlayer.add(tracks);
      if (startIndex > 0) {
        await TrackPlayer.skip(startIndex);
      }
      
      this.currentQueue = sermons;
      this.currentIndex = startIndex;
      
      console.log(`Queue loaded with ${sermons.length} sermons, starting at index ${startIndex}`);
    } catch (error) {
      console.error('Error loading queue:', error);
      throw error;
    }
  }

  async play(): Promise<void> {
    try {
      await TrackPlayer.play();
    } catch (error) {
      console.error('Play error:', error);
      throw error;
    }
  }

  async pause(): Promise<void> {
    try {
      await TrackPlayer.pause();
    } catch (error) {
      console.error('Pause error:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    try {
      await TrackPlayer.stop();
    } catch (error) {
      console.error('Stop error:', error);
      throw error;
    }
  }

  async seekTo(position: number): Promise<void> {
    try {
      await TrackPlayer.seekTo(position);
    } catch (error) {
      console.error('Seek error:', error);
      throw error;
    }
  }

  async skipToNext(): Promise<void> {
    try {
      await TrackPlayer.skipToNext();
      this.currentIndex = Math.min(this.currentIndex + 1, this.currentQueue.length - 1);
    } catch (error) {
      console.error('Skip to next error:', error);
      throw error;
    }
  }

  async skipToPrevious(): Promise<void> {
    try {
      await TrackPlayer.skipToPrevious();
      this.currentIndex = Math.max(this.currentIndex - 1, 0);
    } catch (error) {
      console.error('Skip to previous error:', error);
      throw error;
    }
  }

  async setVolume(volume: number): Promise<void> {
    try {
      await TrackPlayer.setVolume(volume);
    } catch (error) {
      console.error('Set volume error:', error);
      throw error;
    }
  }

  async setRate(rate: number): Promise<void> {
    try {
      await TrackPlayer.setRate(rate);
    } catch (error) {
      console.error('Set rate error:', error);
      throw error;
    }
  }

  async setRepeatMode(mode: RepeatMode): Promise<void> {
    try {
      await TrackPlayer.setRepeatMode(mode);
    } catch (error) {
      console.error('Set repeat mode error:', error);
      throw error;
    }
  }

  async getPlaybackStatus(): Promise<PlaybackStatus> {
    try {
      const [state, position, duration, currentTrack] = await Promise.all([
        TrackPlayer.getPlaybackState(),
        TrackPlayer.getPosition(),
        TrackPlayer.getDuration(),
        TrackPlayer.getActiveTrack(),
      ]);

      return {
        state: state.state,
        position,
        duration: duration || 0,
        track: currentTrack,
        isLoaded: !!currentTrack,
        isPlaying: state.state === State.Playing,
        volume: 1.0, // TrackPlayer doesn't expose volume getter
        rate: 1.0, // TrackPlayer doesn't expose rate getter
      };
    } catch (error) {
      console.error('Error getting playback status:', error);
      return {
        state: State.None,
        position: 0,
        duration: 0,
        isLoaded: false,
        isPlaying: false,
        volume: 1.0,
        rate: 1.0,
      };
    }
  }

  getCurrentSermon(): AudioSermon | null {
    if (this.currentIndex >= 0 && this.currentIndex < this.currentQueue.length) {
      return this.currentQueue[this.currentIndex];
    }
    return null;
  }

  getQueue(): AudioSermon[] {
    return [...this.currentQueue];
  }

  getCurrentIndex(): number {
    return this.currentIndex;
  }

  private parseDuration(duration: string): number {
    // Parse duration string like "45:30" to seconds
    const parts = duration.split(':');
    if (parts.length === 2) {
      return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }
    return 0;
  }

  // Cleanup method
  async destroy(): Promise<void> {
    try {
      await TrackPlayer.reset();
      this.isSetup = false;
      this.currentQueue = [];
      this.currentIndex = 0;
    } catch (error) {
      console.error('Destroy error:', error);
    }
  }
}

// Playback service for background audio
export const PlaybackService = async function() {
  TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
  TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
  TrackPlayer.addEventListener(Event.RemoteStop, () => TrackPlayer.stop());
  TrackPlayer.addEventListener(Event.RemoteNext, () => TrackPlayer.skipToNext());
  TrackPlayer.addEventListener(Event.RemotePrevious, () => TrackPlayer.skipToPrevious());
  TrackPlayer.addEventListener(Event.RemoteSeek, (event) => TrackPlayer.seekTo(event.position));
};

export default TrackPlayerService;