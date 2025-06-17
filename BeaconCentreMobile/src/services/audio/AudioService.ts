// src/services/audio/AudioService.ts - UPDATED FOR EXPO-AUDIO
import { AudioPlayer, useAudioPlayer } from 'expo-audio';
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
  private player: AudioPlayer | null = null;
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
      // expo-audio handles permissions automatically
      this.player = new AudioPlayer();
      
      // Set up event listeners
      this.player.addEventListener('statusUpdate', this.onPlaybackStatusUpdate);
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

  private onPlaybackStatusUpdate = (status: any) => {
    this.state.isPlaying = status.isPlaying;
    this.state.position = status.currentTime * 1000; // Convert to milliseconds
    this.state.duration = status.duration * 1000; // Convert to milliseconds
    this.state.isLoaded = status.isLoaded;
    this.notifyListeners();
  };

  async loadAudio(sermon: AudioSermon): Promise<void> {
    try {
      if (this.player) {
        await this.player.load(sermon.audio_url);
        this.state.isLoaded = true;
        this.notifyListeners();
      }
    } catch (error) {
      console.error('Load audio error:', error);
      throw error;
    }
  }

  async play(): Promise<void> {
    if (this.player && this.state.isLoaded) {
      try {
        await this.player.play();
      } catch (error) {
        console.error('Play error:', error);
        throw error;
      }
    }
  }

  async pause(): Promise<void> {
    if (this.player && this.state.isLoaded) {
      try {
        await this.player.pause();
      } catch (error) {
        console.error('Pause error:', error);
        throw error;
      }
    }
  }

  async stop(): Promise<void> {
    if (this.player && this.state.isLoaded) {
      try {
        await this.player.stop();
        await this.player.seekTo(0);
      } catch (error) {
        console.error('Stop error:', error);
        throw error;
      }
    }
  }

  async seekTo(position: number): Promise<void> {
    if (this.player && this.state.isLoaded) {
      try {
        await this.player.seekTo(position / 1000); // Convert from milliseconds
      } catch (error) {
        console.error('Seek error:', error);
        throw error;
      }
    }
  }

  async setVolume(volume: number): Promise<void> {
    if (this.player) {
      try {
        await this.player.setVolume(volume);
        this.state.volume = volume;
        this.notifyListeners();
      } catch (error) {
        console.error('Set volume error:', error);
        throw error;
      }
    }
  }

  async setRate(rate: number): Promise<void> {
    if (this.player) {
      try {
        await this.player.setPlaybackRate(rate);
        this.state.rate = rate;
        this.notifyListeners();
      } catch (error) {
        console.error('Set rate error:', error);
        throw error;
      }
    }
  }

  getState(): AudioState {
    return { ...this.state };
  }

  async cleanup(): Promise<void> {
    if (this.player) {
      try {
        await this.player.unload();
        this.player.removeEventListener('statusUpdate', this.onPlaybackStatusUpdate);
        this.player = null;
      } catch (error) {
        console.error('Cleanup error:', error);
      }
    }
  }
}

export default AudioService;