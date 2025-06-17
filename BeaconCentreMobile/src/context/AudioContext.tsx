// src/context/AudioContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Audio } from 'expo-av';
import { AudioSermon } from '@/types/api';
import TrackPlayerService from '@/services/audio/TrackPlayerService';

interface AudioContextType {
  currentSermon: AudioSermon | null;
  isPlaying: boolean;
  playSermon: (sermon: AudioSermon) => Promise<void>;
  playPlaylist: (sermons: AudioSermon[], startIndex: number) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  skipToNext: () => Promise<void>;
  skipToPrevious: () => Promise<void>;
  playPause: () => void;           // Toggle play/pause
    seekTo: (position: number) => void;  // Seek to position in seconds
    skipForward: () => void;         // Skip 15 seconds forward
    skipBackward: () => void;        // Skip 15 seconds backward

    // Player visibility control
    isPlayerVisible: boolean;        // Whether mini player should show
    showMiniPlayer: () => void;      // Show mini player
    hideMiniPlayer: () => void;      // Hide mini player  
    closePlayer: () => void;         // Close player completely

    // Favorites integration
    toggleFavorite: () => void;      // Toggle current sermon favorite
    isFavorite: boolean;          
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentSermon, setCurrentSermon] = useState<AudioSermon | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioService = TrackPlayerService.getInstance();

  useEffect(() => {
    const checkPlaybackStatus = async () => {
      const sound = await audioService.getCurrentTrack();
      if (sound) {
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          setIsPlaying(status.isPlaying);
        }
      }
    };

    const interval = setInterval(checkPlaybackStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  const playSermon = async (sermon: AudioSermon) => {
    await audioService.playSermon(sermon);
    setCurrentSermon(sermon);
  };

  const playPlaylist = async (sermons: AudioSermon[], startIndex: number) => {
    await audioService.playPlaylist(sermons, startIndex);
    setCurrentSermon(sermons[startIndex]);
  };

  const pause = async () => {
    await audioService.pause();
  };

  const resume = async () => {
    await audioService.play();
  };

  const skipToNext = async () => {
    await audioService.skipToNext();
  };

  const skipToPrevious = async () => {
    await audioService.skipToPrevious();
  };

  const playPause = () => {
    if (isPlaying) {
      pause();
    } else {
      resume();
    }
  };

  const seekTo = (position: number) => {
    audioService.seekTo(position);
  };

  const skipForward = () => {
    audioService.skipForward();
  };

  const skipBackward = () => {
    audioService.skipBackward();
  };

  const showMiniPlayer = () => {
    setIsPlayerVisible(true);
  };

  const hideMiniPlayer = () => {
    setIsPlayerVisible(false);
  };

  return (
    <AudioContext.Provider
      value={{
        currentSermon,
        isPlaying,
        playSermon,
        playPlaylist,
        pause,
        resume,
        skipToNext,
        skipToPrevious,
        playPause,
        seekTo,
        skipForward,
        skipBackward,
        isPlayerVisible,
        showMiniPlayer,
        hideMiniPlayer,
        closePlayer,
        toggleFavorite,
        isFavorite,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioContextProvider');
  }
  return context;
};