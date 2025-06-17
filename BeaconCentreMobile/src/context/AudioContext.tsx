// src/context/AudioContext.tsx - COMPLETE EXPO-AUDIO IMPLEMENTATION
import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import { useAudioPlayer, AudioSource } from 'expo-audio';
import { AudioSermon } from '@/types/api';

// Define complete audio state interface
interface AudioState {
  currentTrack: AudioSermon | null;
  isPlaying: boolean;
  position: number;
  duration: number;
  queue: AudioSermon[];
  currentIndex: number;
  isLoading: boolean;
  error: string | null;
  repeatMode: 'off' | 'one' | 'all';
  shuffleMode: boolean;
  volume: number;
  rate: number;
  isPlayerVisible: boolean;
}

// Define action types
type AudioAction =
  | { type: 'SET_CURRENT_TRACK'; payload: AudioSermon | null }
  | { type: 'SET_PLAYING'; payload: boolean }
  | { type: 'SET_POSITION'; payload: number }
  | { type: 'SET_DURATION'; payload: number }
  | { type: 'SET_QUEUE'; payload: AudioSermon[] }
  | { type: 'SET_CURRENT_INDEX'; payload: number }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_REPEAT_MODE'; payload: 'off' | 'one' | 'all' }
  | { type: 'SET_SHUFFLE_MODE'; payload: boolean }
  | { type: 'SET_VOLUME'; payload: number }
  | { type: 'SET_RATE'; payload: number }
  | { type: 'SET_PLAYER_VISIBLE'; payload: boolean }
  | { type: 'UPDATE_PLAYBACK_STATUS'; payload: Partial<AudioState> }
  | { type: 'RESET_AUDIO' };

// Initial state
const initialState: AudioState = {
  currentTrack: null,
  isPlaying: false,
  position: 0,
  duration: 0,
  queue: [],
  currentIndex: 0,
  isLoading: false,
  error: null,
  repeatMode: 'off',
  shuffleMode: false,
  volume: 1.0,
  rate: 1.0,
  isPlayerVisible: false,
};

// Reducer function
function audioReducer(state: AudioState, action: AudioAction): AudioState {
  switch (action.type) {
    case 'SET_CURRENT_TRACK':
      return { ...state, currentTrack: action.payload };
    case 'SET_PLAYING':
      return { ...state, isPlaying: action.payload };
    case 'SET_POSITION':
      return { ...state, position: action.payload };
    case 'SET_DURATION':
      return { ...state, duration: action.payload };
    case 'SET_QUEUE':
      return { ...state, queue: action.payload };
    case 'SET_CURRENT_INDEX':
      return { ...state, currentIndex: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_REPEAT_MODE':
      return { ...state, repeatMode: action.payload };
    case 'SET_SHUFFLE_MODE':
      return { ...state, shuffleMode: action.payload };
    case 'SET_VOLUME':
      return { ...state, volume: action.payload };
    case 'SET_RATE':
      return { ...state, rate: action.payload };
    case 'SET_PLAYER_VISIBLE':
      return { ...state, isPlayerVisible: action.payload };
    case 'UPDATE_PLAYBACK_STATUS':
      return { ...state, ...action.payload };
    case 'RESET_AUDIO':
      return { ...initialState };
    default:
      return state;
  }
}

// Context interface
interface AudioContextType {
  state: AudioState;
  
  // Basic playback controls
  playSermon: (sermon: AudioSermon) => Promise<void>;
  playQueue: (sermons: AudioSermon[], startIndex?: number) => Promise<void>;
  play: () => void;
  pause: () => void;
  stop: () => void;
  
  // Navigation controls
  skipToNext: () => Promise<void>;
  skipToPrevious: () => Promise<void>;
  seekTo: (position: number) => void;
  
  // Mode controls
  toggleRepeat: () => void;
  toggleShuffle: () => void;
  setVolume: (volume: number) => void;
  setRate: (rate: number) => void;
  
  // UI controls
  showMiniPlayer: () => void;
  hideMiniPlayer: () => void;
  
  // Queue management
  addToQueue: (sermon: AudioSermon) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  
  // Utility methods
  formatTime: (milliseconds: number) => string;
  getProgress: () => number;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(audioReducer, initialState);
  
  // expo-audio player hook
  const player = useAudioPlayer();
  const currentSource = useRef<string | null>(null);
  const positionInterval = useRef<number | NodeJS.Timeout | null>(null);
  const playbackStartTime = useRef<number>(0);

  // Update state based on player status
  useEffect(() => {
    if (player) {
      // Update playing state
      dispatch({ type: 'SET_PLAYING', payload: player.playing || false });
      
      // Update duration (convert seconds to milliseconds)
      if (player.duration && player.duration > 0) {
        dispatch({ type: 'SET_DURATION', payload: player.duration * 1000 });
      }
      
      // Update loading state based on player status
      const isLoading = player.duration === 0 && state.currentTrack !== null;
      dispatch({ type: 'SET_LOADING', payload: isLoading });
    }
  }, [player.playing, player.duration]);

  // Position tracking interval
  useEffect(() => {
    if (player.playing && player.currentTime !== undefined) {
      positionInterval.current = setInterval(() => {
        if (player.currentTime !== undefined) {
          // Convert seconds to milliseconds
          dispatch({ type: 'SET_POSITION', payload: player.currentTime * 1000 });
        }
      }, 1000);
    } else {
      if (positionInterval.current) {
        clearInterval(positionInterval.current);
        positionInterval.current = null;
      }
    }

    return () => {
      if (positionInterval.current) {
        clearInterval(positionInterval.current);
      }
    };
  }, [player.playing, player.currentTime]);

  // Handle playback completion
  useEffect(() => {
    if (player.currentTime && player.duration && 
        player.currentTime >= player.duration && 
        !player.playing && 
        state.currentTrack) {
      
      // Handle repeat modes
      if (state.repeatMode === 'one') {
        // Repeat current track
        player.seekTo(0);
        player.play();
      } else if (state.repeatMode === 'all' || state.currentIndex < state.queue.length - 1) {
        // Play next track
        skipToNext();
      } else {
        // End of queue
        dispatch({ type: 'SET_PLAYING', payload: false });
        dispatch({ type: 'SET_POSITION', payload: 0 });
      }
    }
  }, [player.currentTime, player.duration, player.playing]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (positionInterval.current) {
        clearInterval(positionInterval.current);
      }
    };
  }, []);

  // Basic playback controls
  const playSermon = async (sermon: AudioSermon) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      // Only replace source if it's different
      if (currentSource.current !== sermon.audio_url) {
        await player.replace(sermon.audio_url);
        currentSource.current = sermon.audio_url;
        
        // Wait a bit for the audio to load
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      player.play();
      playbackStartTime.current = Date.now();

      dispatch({ type: 'SET_CURRENT_TRACK', payload: sermon });
      dispatch({ type: 'SET_QUEUE', payload: [sermon] });
      dispatch({ type: 'SET_CURRENT_INDEX', payload: 0 });
      dispatch({ type: 'SET_PLAYER_VISIBLE', payload: true });
      
      console.log('Playing sermon:', sermon.title);
    } catch (error) {
      console.error('Failed to play sermon:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to play audio. Please check your internet connection.' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const playQueue = async (sermons: AudioSermon[], startIndex: number = 0) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      if (sermons.length === 0 || startIndex >= sermons.length || startIndex < 0) {
        throw new Error('Invalid queue or start index');
      }

      const startSermon = sermons[startIndex];
      
      // Only replace source if it's different
      if (currentSource.current !== startSermon.audio_url) {
        await player.replace(startSermon.audio_url);
        currentSource.current = startSermon.audio_url;
        
        // Wait a bit for the audio to load
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      player.play();
      playbackStartTime.current = Date.now();

      dispatch({ type: 'SET_CURRENT_TRACK', payload: startSermon });
      dispatch({ type: 'SET_QUEUE', payload: sermons });
      dispatch({ type: 'SET_CURRENT_INDEX', payload: startIndex });
      dispatch({ type: 'SET_PLAYER_VISIBLE', payload: true });
      
      console.log('Playing queue starting from:', startSermon.title);
    } catch (error) {
      console.error('Failed to play queue:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to play queue. Please try again.' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const play = () => {
    if (state.currentTrack) {
      player.play();
    }
  };

  const pause = () => {
    player.pause();
  };

  const stop = () => {
    player.pause();
    player.seekTo(0);
    dispatch({ type: 'SET_CURRENT_TRACK', payload: null });
    dispatch({ type: 'SET_PLAYER_VISIBLE', payload: false });
    dispatch({ type: 'SET_POSITION', payload: 0 });
    currentSource.current = null;
  };

  const skipToNext = async () => {
    if (state.shuffleMode) {
      // Shuffle mode: random next track
      const availableIndices = state.queue
        .map((_, index) => index)
        .filter(index => index !== state.currentIndex);
      
      if (availableIndices.length > 0) {
        const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
        await playQueue(state.queue, randomIndex);
      }
    } else if (state.currentIndex < state.queue.length - 1) {
      // Normal mode: next track
      const nextIndex = state.currentIndex + 1;
      await playQueue(state.queue, nextIndex);
    } else if (state.repeatMode === 'all') {
      // Repeat all: go to first track
      await playQueue(state.queue, 0);
    }
  };

  const skipToPrevious = async () => {
    if (state.shuffleMode) {
      // Shuffle mode: random previous track
      const availableIndices = state.queue
        .map((_, index) => index)
        .filter(index => index !== state.currentIndex);
      
      if (availableIndices.length > 0) {
        const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
        await playQueue(state.queue, randomIndex);
      }
    } else if (state.currentIndex > 0) {
      // Normal mode: previous track
      const prevIndex = state.currentIndex - 1;
      await playQueue(state.queue, prevIndex);
    } else if (state.repeatMode === 'all') {
      // Repeat all: go to last track
      await playQueue(state.queue, state.queue.length - 1);
    }
  };

  const seekTo = (position: number) => {
    const positionInSeconds = Math.max(0, position / 1000); // Convert from milliseconds
    player.seekTo(positionInSeconds);
    dispatch({ type: 'SET_POSITION', payload: position });
  };

  const toggleRepeat = () => {
    const modes: Array<'off' | 'one' | 'all'> = ['off', 'one', 'all'];
    const currentModeIndex = modes.indexOf(state.repeatMode);
    const nextMode = modes[(currentModeIndex + 1) % modes.length];
    dispatch({ type: 'SET_REPEAT_MODE', payload: nextMode });
  };

  const toggleShuffle = () => {
    dispatch({ type: 'SET_SHUFFLE_MODE', payload: !state.shuffleMode });
  };

  const setVolume = (volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    player.volume = clampedVolume;
    dispatch({ type: 'SET_VOLUME', payload: clampedVolume });
  };

  const setRate = (rate: number) => {
    const clampedRate = Math.max(0.5, Math.min(2.0, rate));
    player.playbackRate = clampedRate;
    dispatch({ type: 'SET_RATE', payload: clampedRate });
  };

  const showMiniPlayer = () => {
    dispatch({ type: 'SET_PLAYER_VISIBLE', payload: true });
  };

  const hideMiniPlayer = () => {
    dispatch({ type: 'SET_PLAYER_VISIBLE', payload: false });
  };

  const addToQueue = (sermon: AudioSermon) => {
    const newQueue = [...state.queue, sermon];
    dispatch({ type: 'SET_QUEUE', payload: newQueue });
  };

  const removeFromQueue = (index: number) => {
    const newQueue = state.queue.filter((_, i) => i !== index);
    dispatch({ type: 'SET_QUEUE', payload: newQueue });
    
    if (index === state.currentIndex && newQueue.length > 0) {
      const newIndex = Math.min(state.currentIndex, newQueue.length - 1);
      playQueue(newQueue, newIndex);
    } else if (newQueue.length === 0) {
      stop();
    } else if (index < state.currentIndex) {
      // Adjust current index if we removed an item before it
      dispatch({ type: 'SET_CURRENT_INDEX', payload: state.currentIndex - 1 });
    }
  };

  const clearQueue = () => {
    dispatch({ type: 'SET_QUEUE', payload: [] });
    stop();
  };

  // Utility methods
  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getProgress = (): number => {
    if (state.duration > 0) {
      return Math.min(100, (state.position / state.duration) * 100);
    }
    return 0;
  };

  return (
    <AudioContext.Provider
      value={{
        state,
        playSermon,
        playQueue,
        play,
        pause,
        stop,
        skipToNext,
        skipToPrevious,
        seekTo,
        toggleRepeat,
        toggleShuffle,
        setVolume,
        setRate,
        showMiniPlayer,
        hideMiniPlayer,
        addToQueue,
        removeFromQueue,
        clearQueue,
        formatTime,
        getProgress,
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