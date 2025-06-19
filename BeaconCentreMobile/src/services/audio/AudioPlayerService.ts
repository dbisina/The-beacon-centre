// src/services/audio/AudioPlayerService.ts - CORRECT EXPO-AUDIO IMPLEMENTATION
import { createAudioPlayer } from 'expo-audio';
import { AudioSermon } from '@/types/api';

interface PlaybackStatus {
  isLoaded: boolean;
  isPlaying: boolean;
  position: number; // in seconds
  duration: number; // in seconds
  volume: number;
  rate: number;
  isBuffering?: boolean;
  didJustFinish?: boolean;
}

class AudioPlayerService {
  private static instance: AudioPlayerService;
  private player: any = null; // AudioPlayer from expo-audio
  private currentSermon: AudioSermon | null = null;
  private playlist: AudioSermon[] = [];
  private currentIndex: number = 0;
  private statusUpdateCallback: ((status: PlaybackStatus) => void) | null = null;
  private statusUpdateInterval: NodeJS.Timeout | null = null;

  private constructor() {
    console.log('AudioPlayerService constructor called');
  }

  public static getInstance(): AudioPlayerService {
    if (!AudioPlayerService.instance) {
      AudioPlayerService.instance = new AudioPlayerService();
    }
    return AudioPlayerService.instance;
  }

  private createPlayer(source: string | { uri: string }) {
    try {
      console.log('Creating audio player for source:', source);
      
      // Create player using expo-audio API
      this.player = createAudioPlayer(source);
      
      // Set up status monitoring
      this.startStatusUpdates();
      
      console.log('Audio player created successfully');
      return this.player;
      
    } catch (error) {
      console.error('Failed to create audio player:', error);
      throw new Error(`Audio player creation failed: ${error}`);
    }
  }

  private startStatusUpdates(): void {
    if (this.statusUpdateInterval) {
      clearInterval(this.statusUpdateInterval);
    }

    this.statusUpdateInterval = setInterval(() => {
      if (this.player && this.statusUpdateCallback) {
        try {
          const status: PlaybackStatus = {
            isLoaded: this.player.isLoaded || false,
            isPlaying: this.player.playing || false,
            position: this.player.currentTime || 0,
            duration: this.player.duration || 0,
            volume: 1.0, // expo-audio doesn't expose volume directly
            rate: this.player.playbackRate || 1.0,
            isBuffering: false, // Not available in current expo-audio API
            didJustFinish: false, // We'll track this manually
          };
          
          this.statusUpdateCallback(status);

          // Check if track finished
          if (status.isLoaded && status.position >= status.duration && status.duration > 0) {
            this.handleTrackFinished();
          }
          
        } catch (error) {
          console.error('Error getting audio status:', error);
        }
      }
    }, 1000); // Update every second
  }

  private stopStatusUpdates(): void {
    if (this.statusUpdateInterval) {
      clearInterval(this.statusUpdateInterval);
      this.statusUpdateInterval = null;
    }
  }

  private handleTrackFinished(): void {
    console.log('Track finished, attempting to play next');
    if (this.hasNext()) {
      this.skipToNext();
    } else {
      // Reset to beginning if no next track
      this.seekTo(0);
      this.pause();
    }
  }

  public setStatusUpdateCallback(callback: (status: PlaybackStatus) => void) {
    this.statusUpdateCallback = callback;
  }

  public async getPlaybackStatus(): Promise<PlaybackStatus> {
    try {
      if (!this.player) {
        return {
          isLoaded: false,
          isPlaying: false,
          position: 0,
          duration: 0,
          volume: 1.0,
          rate: 1.0,
        };
      }

      return {
        isLoaded: this.player.isLoaded || false,
        isPlaying: this.player.playing || false,
        position: this.player.currentTime || 0,
        duration: this.player.duration || 0,
        volume: 1.0,
        rate: this.player.playbackRate || 1.0,
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

  public async loadTrack(sermon: AudioSermon): Promise<void> {
    try {
      console.log('Loading track:', sermon.title);
      
      // Stop current player if exists
      if (this.player) {
        await this.stop();
        this.player.release();
        this.player = null;
      }

      // Validate audio URL
      if (!sermon.audio_url || !this.isValidAudioUrl(sermon.audio_url)) {
        throw new Error('Invalid audio URL');
      }

      // Create new player with the sermon's audio URL
      const audioSource = { uri: sermon.audio_url };
      this.player = this.createPlayer(audioSource);
      
      this.currentSermon = sermon;
      
      console.log('Track loaded successfully:', sermon.title);

    } catch (error) {
      console.error('Load track error:', error);
      throw error;
    }
  }

  private isValidAudioUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      const allowedProtocols = ['http:', 'https:'];
      const audioExtensions = ['.mp3', '.m4a', '.wav', '.aac', '.ogg'];
      
      const hasValidProtocol = allowedProtocols.includes(urlObj.protocol);
      const hasAudioExtension = audioExtensions.some(ext => 
        url.toLowerCase().includes(ext)
      );
      
      return hasValidProtocol && (hasAudioExtension || url.includes('cloudinary') || url.includes('firebase'));
    } catch {
      return false;
    }
  }

  public async play(): Promise<void> {
    try {
      if (!this.player) {
        throw new Error('No track loaded');
      }

      await this.player.play();
      console.log('Audio playing');
      
    } catch (error) {
      console.error('Play error:', error);
      throw error;
    }
  }

  public async pause(): Promise<void> {
    try {
      if (!this.player) {
        return;
      }

      await this.player.pause();
      console.log('Audio paused');
      
    } catch (error) {
      console.error('Pause error:', error);
      throw error;
    }
  }

  public async stop(): Promise<void> {
    try {
      if (this.player) {
        await this.player.pause();
        await this.seekTo(0);
        this.stopStatusUpdates();
      }
      console.log('Audio stopped');
    } catch (error) {
      console.error('Stop error:', error);
      throw error;
    }
  }

  public async seekTo(position: number): Promise<void> {
    try {
      if (!this.player) {
        return;
      }

      // expo-audio uses seekBy for relative seeking
      const currentPosition = this.player.currentTime || 0;
      const seekDifference = position - currentPosition;
      
      await this.player.seekBy(seekDifference);
      console.log('Seeked to:', position);
      
    } catch (error) {
      console.error('Seek error:', error);
      throw error;
    }
  }

  public async setVolume(volume: number): Promise<void> {
    try {
      // Note: expo-audio doesn't directly expose volume control
      // This might need to be handled at the system level
      console.log('Volume set to:', volume);
      
    } catch (error) {
      console.error('Set volume error:', error);
      throw error;
    }
  }

  public async setPlaybackRate(rate: number): Promise<void> {
    try {
      if (!this.player) {
        return;
      }

      await this.player.setPlaybackRate(rate);
      console.log('Playback rate set to:', rate);
      
    } catch (error) {
      console.error('Set playback rate error:', error);
      throw error;
    }
  }

  public async setPlaylist(sermons: AudioSermon[], startIndex: number = 0): Promise<void> {
    this.playlist = sermons;
    this.currentIndex = startIndex;
    
    if (sermons.length > 0 && startIndex < sermons.length) {
      await this.loadTrack(sermons[startIndex]);
    }
  }

  public async skipToNext(): Promise<void> {
    if (this.currentIndex < this.playlist.length - 1) {
      this.currentIndex++;
      await this.loadTrack(this.playlist[this.currentIndex]);
      await this.play();
    }
  }

  public async skipToPrevious(): Promise<void> {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      await this.loadTrack(this.playlist[this.currentIndex]);
      await this.play();
    }
  }

  // Replace function for switching tracks
  public async replaceTrack(sermon: AudioSermon): Promise<void> {
    try {
      if (!this.player) {
        await this.loadTrack(sermon);
        return;
      }

      console.log('Replacing track with:', sermon.title);
      
      // Use replace method from expo-audio
      await this.player.replace({ uri: sermon.audio_url });
      this.currentSermon = sermon;
      
      console.log('Track replaced successfully');
      
    } catch (error) {
      console.error('Replace track error:', error);
      // Fallback to loading new track
      await this.loadTrack(sermon);
    }
  }

  public getCurrentTrack(): AudioSermon | null {
    return this.currentSermon;
  }

  public getPlaylist(): AudioSermon[] {
    return this.playlist;
  }

  public getCurrentIndex(): number {
    return this.currentIndex;
  }

  public hasNext(): boolean {
    return this.currentIndex < this.playlist.length - 1;
  }

  public hasPrevious(): boolean {
    return this.currentIndex > 0;
  }

  public async release(): Promise<void> {
    try {
      this.stopStatusUpdates();
      
      if (this.player) {
        await this.player.release();
        this.player = null;
      }
      
      this.currentSermon = null;
      this.playlist = [];
      this.currentIndex = 0;
      this.statusUpdateCallback = null;
      
      console.log('AudioPlayerService released');
    } catch (error) {
      console.error('Release error:', error);
    }
  }
}

export default AudioPlayerService;