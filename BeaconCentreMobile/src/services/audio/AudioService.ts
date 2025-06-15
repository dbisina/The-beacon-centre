// src/services/audio/AudioService.ts
import { Audio } from 'expo-av';
import { AVPlaybackStatus } from 'expo-av/build/AV';
import { AudioSermon } from '@/types/api';

interface AudioState {
  isLoaded: boolean;
  isPlaying: boolean;
  position: number;
  duration: number;
  volume: number;
  rate: number;
}

class AudioService {
  private static instance: AudioService;
  private sound: Audio.Sound | null = null;
  private state: AudioState = {
    isLoaded: false,
    isPlaying: false,
    position: 0,
    duration: 0,
    volume: 1.0,
    rate: 1.0,
  };
  private listeners: Array<(state: AudioState) => void> = [];

  static getInstance(): AudioService {
    if (!AudioService.instance) {
      AudioService.instance = new AudioService();
    }
    return AudioService.instance;
  }

  constructor() {
    this.setupAudio();
  }

  private async setupAudio() {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {
      console.error('Audio setup error:', error);
    }
  }

  addListener(listener: (state: AudioState) => void) {
    this.listeners.push(listener);
  }

  removeListener(listener: (state: AudioState) => void) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener({ ...this.state }));
  }

  private onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      this.state.isPlaying = status.isPlaying;
      this.state.position = status.positionMillis || 0;
      this.state.duration = status.durationMillis || 0;
      this.notifyListeners();
    }
  };

  async loadAudio(sermon: AudioSermon): Promise<void> {
    try {
      // Unload previous audio
      if (this.sound) {
        await this.sound.unloadAsync();
      }

      // Create new sound
      const { sound } = await Audio.Sound.createAsync(
        { uri: sermon.audio_url },
        { shouldPlay: false },
        this.onPlaybackStatusUpdate
      );

      this.sound = sound;
      this.state.isLoaded = true;
      this.notifyListeners();
    } catch (error) {
      console.error('Load audio error:', error);
      throw error;
    }
  }

  async play(): Promise<void> {
    if (this.sound && this.state.isLoaded) {
      try {
        await this.sound.playAsync();
      } catch (error) {
        console.error('Play error:', error);
        throw error;
      }
    }
  }

  async pause(): Promise<void> {
    if (this.sound && this.state.isLoaded) {
      try {
        await this.sound.pauseAsync();
      } catch (error) {
        console.error('Pause error:', error);
        throw error;
      }
    }
  }

  async stop(): Promise<void> {
    if (this.sound && this.state.isLoaded) {
      try {
        await this.sound.stopAsync();
        await this.sound.setPositionAsync(0);
      } catch (error) {
        console.error('Stop error:', error);
        throw error;
      }
    }
  }

  async seekTo(position: number): Promise<void> {
    if (this.sound && this.state.isLoaded) {
      try {
        await this.sound.setPositionAsync(position);
      } catch (error) {
        console.error('Seek error:', error);
        throw error;
      }
    }
  }

  async setVolume(volume: number): Promise<void> {
    if (this.sound && this.state.isLoaded) {
      try {
        await this.sound.setVolumeAsync(volume);
        this.state.volume = volume;
        this.notifyListeners();
      } catch (error) {
        console.error('Volume error:', error);
        throw error;
      }
    }
  }

  async setRate(rate: number): Promise<void> {
    if (this.sound && this.state.isLoaded) {
      try {
        await this.sound.setRateAsync(rate, true);
        this.state.rate = rate;
        this.notifyListeners();
      } catch (error) {
        console.error('Rate error:', error);
        throw error;
      }
    }
  }

  async unload(): Promise<void> {
    if (this.sound) {
      try {
        await this.sound.unloadAsync();
        this.sound = null;
        this.state = {
          isLoaded: false,
          isPlaying: false,
          position: 0,
          duration: 0,
          volume: 1.0,
          rate: 1.0,
        };
        this.notifyListeners();
      } catch (error) {
        console.error('Unload error:', error);
      }
    }
  }

  getState(): AudioState {
    return { ...this.state };
  }
}

export default AudioService;