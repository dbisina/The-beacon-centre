// src/context/AudioContext.tsx - MINIMAL WORKING VERSION
import React, { createContext, useContext, useState, useRef } from 'react';
import { Audio } from 'expo-av';
import { AudioSermon } from '@/types/api';

interface AudioState {
  currentTrack: AudioSermon | null;
  isPlaying: boolean;
  position: number;
  duration: number;
  isLoading: boolean;
  error: string | null;
  isPlayerVisible: boolean;
}

interface AudioContextType {
  state: AudioState;
  playSermon: (sermon: AudioSermon) => Promise<void>;
  play: () => Promise<void>;
  pause: () => Promise<void>;
  seekTo: (position: number) => Promise<void>;
  showMiniPlayer: () => void;
  hideMiniPlayer: () => void;
  formatTime: (seconds: number) => string;
  getProgress: () => number;
}

const AudioContext = createContext<AudioContextType | null>(null);

export const AudioContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AudioState>({
    currentTrack: null,
    isPlaying: false,
    position: 0,
    duration: 0,
    isLoading: false,
    error: null,
    isPlayerVisible: false,
  });

  const soundRef = useRef<Audio.Sound | null>(null);

  const updateState = (updates: Partial<AudioState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const playSermon = async (sermon: AudioSermon): Promise<void> => {
    try {
      console.log('🎵 AudioContext: Playing sermon:', sermon.title);
      console.log('🔗 Audio URL:', sermon.audioUrl);
  
      updateState({ isLoading: true, error: null });
  
      // Set audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
  
      // Unload previous sound
      if (soundRef.current) {
        console.log('🗑️ Unloading previous sound');
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
  
      // Create new sound - USE audioUrl instead of audio_url
      console.log('📡 Creating sound from URL...');
      const { sound } = await Audio.Sound.createAsync(
        { uri: sermon.audioUrl },
        { 
          shouldPlay: false,
          isLooping: false,
          volume: 1.0,
        }
      );
  
      soundRef.current = sound;
      console.log('✅ Sound created successfully');
  
      // Set up status callback
      sound.setOnPlaybackStatusUpdate((status) => {
        console.log('📊 Status update:', { 
          isLoaded: status.isLoaded, 
          isPlaying: status.isLoaded ? status.isPlaying : false,
          position: status.isLoaded ? status.positionMillis : 0,
          duration: status.isLoaded ? status.durationMillis : 0
        });
  
        if (status.isLoaded) {
          updateState({
            isPlaying: status.isPlaying,
            position: status.positionMillis / 1000,
            duration: (status.durationMillis || 0) / 1000,
          });
        }
      });
  
      // Play the sound
      console.log('▶️ Starting playback...');
      await sound.playAsync();
  
      // Update state
      updateState({
        currentTrack: sermon,
        isPlayerVisible: true,
        isLoading: false,
      });
  
      console.log('✅ Sermon playback started successfully');
  
    } catch (error) {
      console.error('❌ Error in playSermon:', error);
      updateState({ 
        error: `Failed to play sermon: ${error}`,
        isLoading: false 
      });
    }
  };

  const play = async (): Promise<void> => {
    try {
      if (soundRef.current) {
        console.log('▶️ Resuming playback');
        await soundRef.current.playAsync();
      } else {
        console.warn('⚠️ No sound loaded to play');
      }
    } catch (error) {
      console.error('❌ Error playing:', error);
      updateState({ error: 'Failed to play' });
    }
  };

  const pause = async (): Promise<void> => {
    try {
      if (soundRef.current) {
        console.log('⏸️ Pausing playback');
        await soundRef.current.pauseAsync();
      }
    } catch (error) {
      console.error('❌ Error pausing:', error);
      updateState({ error: 'Failed to pause' });
    }
  };

  const seekTo = async (position: number): Promise<void> => {
    try {
      if (soundRef.current) {
        console.log(`⏩ Seeking to ${position}s`);
        await soundRef.current.setPositionAsync(position * 1000);
      }
    } catch (error) {
      console.error('❌ Error seeking:', error);
      updateState({ error: 'Failed to seek' });
    }
  };

  const showMiniPlayer = (): void => {
    updateState({ isPlayerVisible: true });
  };

  const hideMiniPlayer = (): void => {
    updateState({ isPlayerVisible: false });
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = (): number => {
    if (state.duration === 0) return 0;
    return (state.position / state.duration) * 100;
  };

  const contextValue: AudioContextType = {
    state,
    playSermon,
    play,
    pause,
    seekTo,
    showMiniPlayer,
    hideMiniPlayer,
    formatTime,
    getProgress,
  };

  return (
    <AudioContext.Provider value={contextValue}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = (): AudioContextType => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioContextProvider');
  }
  return context;
};