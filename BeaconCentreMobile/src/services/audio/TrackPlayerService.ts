// src/services/audio/TrackPlayerService.ts
import { Audio } from 'expo-av';
import { AudioSermon } from '@/types/api';

class TrackPlayerService {
  private static instance: TrackPlayerService;
  private sound: Audio.Sound | null = null;
  private currentSermon: AudioSermon | null = null;
  private playlist: AudioSermon[] = [];
  private currentIndex: number = 0;

  private constructor() {}

  public static getInstance(): TrackPlayerService {
    if (!TrackPlayerService.instance) {
      TrackPlayerService.instance = new TrackPlayerService();
    }
    return TrackPlayerService.instance;
  }

  public async setupEventListeners() {
    // Note: expo-av handles audio focus and background playback automatically
    // No need for explicit event listeners
  }

  async play() {
    if (this.sound) {
      await this.sound.playAsync();
    }
  }

  async pause() {
    if (this.sound) {
      await this.sound.pauseAsync();
    }
  }

  async seekTo(position: number) {
    if (this.sound) {
      await this.sound.setPositionAsync(position);
    }
  }

  async skipToNext() {
    if (this.playlist.length > 0) {
      this.currentIndex = (this.currentIndex + 1) % this.playlist.length;
      await this.playSermon(this.playlist[this.currentIndex]);
    }
  }

  async skipToPrevious() {
    if (this.playlist.length > 0) {
      this.currentIndex = (this.currentIndex - 1 + this.playlist.length) % this.playlist.length;
      await this.playSermon(this.playlist[this.currentIndex]);
    }
  }

  async getCurrentTrack() {
    return this.sound;
  }

  async playSermon(sermon: AudioSermon) {
    try {
      // Unload previous sound if it exists
      if (this.sound) {
        await this.sound.unloadAsync();
      }

      // Load and play new sound
      const { sound } = await Audio.Sound.createAsync(
        { uri: sermon.audio_url },
        { shouldPlay: true }
      );
      
      this.sound = sound;
      this.currentSermon = sermon;
      
      // Set up audio mode for background playback
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });
    } catch (error) {
      console.error('Error playing sermon:', error);
    }
  }

  async playPlaylist(sermons: AudioSermon[], startIndex: number) {
    this.playlist = sermons;
    this.currentIndex = startIndex;
    await this.playSermon(sermons[startIndex]);
  }

  public async setup() {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });
    } catch (error) {
      console.error('Error setting up audio:', error);
    }
  }
}

export default TrackPlayerService;