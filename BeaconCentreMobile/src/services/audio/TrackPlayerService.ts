// src/services/audio/TrackPlayerService.ts - FIXED WITH LAZY INITIALIZATION

import { AudioPlayer } from 'expo-audio';
import { AudioSermon } from '@/types/api';

interface PlaybackStatus {
  isLoaded: boolean;
  isPlaying: boolean;
  position: number; // in seconds
  duration: number; // in seconds
  volume: number;
  rate: number;
}

class TrackPlayerService {
  private static instance: TrackPlayerService;
  private player: AudioPlayer | null = null;
  private currentSermon: AudioSermon | null = null;
  private playlist: AudioSermon[] = [];
  private currentIndex: number = 0;
  private statusUpdateCallback: ((status: PlaybackStatus) => void) | null = null;
  private isInitialized: boolean = false;

  private constructor() {
    // Don't initialize player in constructor to avoid import issues
    console.log('TrackPlayerService constructor called');
  }

  public static getInstance(): TrackPlayerService {
    if (!TrackPlayerService.instance) {
      TrackPlayerService.instance = new TrackPlayerService();
    }
    return TrackPlayerService.instance;
  }

  private async initializePlayer(): Promise<void> {
    if (this.isInitialized || this.player) {
      return;
    }

    try {
      console.log('Initializing AudioPlayer...');
      
      // Check if AudioPlayer is available
      if (!AudioPlayer) {
        throw new Error('AudioPlayer is not available. Make sure expo-audio is properly installed.');
      }

      this.player = new AudioPlayer();
      this.isInitialized = true;
      console.log('AudioPlayer initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize AudioPlayer:', error);
      throw new Error(`AudioPlayer initialization failed: ${error}`);
    }
  }

  private async ensurePlayerReady(): Promise<void> {
    if (!this.isInitialized || !this.player) {
      await this.initializePlayer();
    }
    
    if (!this.player) {
      throw new Error('AudioPlayer is not available');
    }
  }

  public setStatusUpdateCallback(callback: (status: PlaybackStatus) => void) {
    this.statusUpdateCallback = callback;
  }

  public async getPlaybackStatus(): Promise<PlaybackStatus> {
    try {
      await this.ensurePlayerReady();
      
      return {
        isLoaded: (this.player?.duration || 0) > 0,
        isPlaying: this.player?.playing || false,
        position: this.player?.currentTime || 0,
        duration: this.player?.duration || 0,
        volume: this.player?.volume || 1.0,
        rate: 1.0, // expo-audio doesn't support playback rate yet
      };
    } catch (error) {
      console.error('Error getting playback status:', error);
      return {
        isLoaded: false,
        isPlaying: false,
        position: 0,
        duration: 0,
        volume: 1.0,
        rate: 1.0,
      };
    }
  }

  async play(): Promise<void> {
    try {
      await this.ensurePlayerReady();
      this.player!.play();
      console.log('Audio playing');
    } catch (error) {
      console.error('Play error:', error);
      throw error;
    }
  }

  async pause(): Promise<void> {
    try {
      await this.ensurePlayerReady();
      this.player!.pause();
      console.log('Audio paused');
    } catch (error) {
      console.error('Pause error:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    try {
      await this.ensurePlayerReady();
      this.player!.pause();
      this.player!.seekTo(0);
      console.log('Audio stopped');
    } catch (error) {
      console.error('Stop error:', error);
      throw error;
    }
  }

  async seekTo(position: number): Promise<void> {
    try {
      await this.ensurePlayerReady();
      this.player!.seekTo(position);
      console.log('Seeked to:', position);
    } catch (error) {
      console.error('Seek error:', error);
      throw error;
    }
  }

  async skipToNext(): Promise<void> {
    if (this.playlist.length > 0 && this.currentIndex < this.playlist.length - 1) {
      this.currentIndex += 1;
      await this.playSermon(this.playlist[this.currentIndex]);
    }
  }

  async skipToPrevious(): Promise<void> {
    if (this.playlist.length > 0 && this.currentIndex > 0) {
      this.currentIndex -= 1;
      await this.playSermon(this.playlist[this.currentIndex]);
    }
  }

  async playSermon(sermon: AudioSermon): Promise<void> {
    try {
      console.log('Loading sermon:', sermon.title, sermon.audio_url);
      
      await this.ensurePlayerReady();
      
      // Replace the current audio source
      await this.player!.replace(sermon.audio_url);
      
      // Wait a moment for the audio to load
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Start playing
      this.player!.play();
      
      this.currentSermon = sermon;
      console.log('Successfully loaded and playing:', sermon.title);
      
    } catch (error) {
      console.error('Error playing sermon:', error);
      throw new Error(`Failed to play sermon: ${error}`);
    }
  }

  async playPlaylist(sermons: AudioSermon[], startIndex: number = 0): Promise<void> {
    try {
      this.playlist = sermons;
      this.currentIndex = startIndex;
      
      if (sermons.length > 0 && startIndex < sermons.length) {
        await this.playSermon(sermons[startIndex]);
      }
    } catch (error) {
      console.error('Error playing playlist:', error);
      throw error;
    }
  }

  getCurrentSermon(): AudioSermon | null {
    return this.currentSermon;
  }

  getPlaylist(): AudioSermon[] {
    return this.playlist;
  }

  getCurrentIndex(): number {
    return this.currentIndex;
  }

  hasNext(): boolean {
    return this.currentIndex < this.playlist.length - 1;
  }

  hasPrevious(): boolean {
    return this.currentIndex > 0;
  }

  async setVolume(volume: number): Promise<void> {
    try {
      await this.ensurePlayerReady();
      this.player!.volume = Math.max(0, Math.min(1, volume));
    } catch (error) {
      console.error('Set volume error:', error);
    }
  }

  getVolume(): number {
    return this.player?.volume || 1.0;
  }

  // Method to check if audio URL is valid
  async validateAudioUrl(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      const contentType = response.headers.get('content-type');
      return response.ok && (contentType?.includes('audio') || contentType?.includes('video'));
    } catch (error) {
      console.error('URL validation error:', error);
      return false;
    }
  }

  // Check if the service is properly initialized
  isReady(): boolean {
    return this.isInitialized && this.player !== null;
  }

  // Cleanup method
  cleanup(): void {
    try {
      if (this.player) {
        this.player.pause();
      }
      this.currentSermon = null;
      this.playlist = [];
      this.currentIndex = 0;
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }
}

export default TrackPlayerService;