// src/context/AudioContext.tsx - IMPROVED WITH BETTER ERROR HANDLING
import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import { useAudioPlayer, AudioSource } from 'expo-audio';
import { Alert } from 'react-native';
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
  connectionError: boolean; // New: Track connection issues
  retryCount: number; // New: Track retry attempts
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
  | { type: 'SET_CONNECTION_ERROR'; payload: boolean }
  | { type: 'SET_RETRY_COUNT'; payload: number }
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
  connectionError: false,
  retryCount: 0,
};

// Reducer function
function audioReducer(state: AudioState, action: AudioAction): AudioState {
  switch (action.type) {
    case 'SET_CURRENT_TRACK':
      return { ...state, currentTrack: action.payload, error: null };
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
      return { ...state, error: action.payload, isLoading: false };
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
    case 'SET_CONNECTION_ERROR':
      return { ...state, connectionError: action.payload };
    case 'SET_RETRY_COUNT':
      return { ...state, retryCount: action.payload };
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
  
  // Error handling
  retryPlayback: () => Promise<void>;
  clearError: () => void;
  
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
  const maxRetries = 3;

  // Validate audio URL before playing
  const validateAudioUrl = async (url: string): Promise<boolean> => {
    try {
      console.log('🔍 Validating audio URL:', url);
      const response = await fetch(url, { 
        method: 'HEAD',
        timeout: 5000 // 5 second timeout
      });
      
      const contentType = response.headers.get('content-type');
      const isValid = response.ok && (
        contentType?.startsWith('audio/') || 
        contentType?.startsWith('application/octet-stream') ||
        url.endsWith('.mp3') ||
        url.endsWith('.wav') ||
        url.endsWith('.m4a')
      );
      
      console.log(`✅ URL validation result: ${isValid}`, { 
        status: response.status, 
        contentType 
      });
      
      return isValid;
    } catch (error) {
      console.error('❌ Audio URL validation failed:', error);
      return false;
    }
  };

  // Enhanced error handling
  const handlePlaybackError = (error: any, sermon: AudioSermon) => {
    console.error('🚨 Playback error:', error);
    
    const errorMessage = error?.message || 'Unknown playback error';
    let userFriendlyMessage = 'Unable to play audio';
    
    if (errorMessage.includes('Network') || errorMessage.includes('network')) {
      userFriendlyMessage = 'Network error. Please check your connection.';
      dispatch({ type: 'SET_CONNECTION_ERROR', payload: true });
    } else if (errorMessage.includes('format') || errorMessage.includes('codec')) {
      userFriendlyMessage = 'Audio format not supported';
    } else if (errorMessage.includes('404') || errorMessage.includes('not found')) {
      userFriendlyMessage = 'Audio file not found';
    } else if (errorMessage.includes('timeout')) {
      userFriendlyMessage = 'Connection timeout. Please try again.';
    }
    
    dispatch({ type: 'SET_ERROR', payload: userFriendlyMessage });
    dispatch({ type: 'SET_LOADING', payload: false });
    
    // Show user-friendly alert
    Alert.alert(
      'Playback Error',
      `${userFriendlyMessage}\n\nSermon: "${sermon.title}"`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Retry', 
          onPress: () => retryPlayback(),
          style: 'default'
        }
      ]
    );
  };

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
      const isLoading = player.duration === 0 && state.currentTrack !== null && !state.error;
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

  // Enhanced playback function with validation and retry logic
  const playSermon = async (sermon: AudioSermon) => {
    try {
      console.log('🎵 Attempting to play sermon:', sermon.title);
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      dispatch({ type: 'SET_CONNECTION_ERROR', payload: false });

      // Validate audio URL first
      const isValidUrl = await validateAudioUrl(sermon.audio_url);
      if (!isValidUrl) {
        throw new Error('Invalid or inaccessible audio URL');
      }

      // Only replace source if it's different
      if (currentSource.current !== sermon.audio_url) {
        console.log('🔄 Loading new audio source:', sermon.audio_url);
        await player.replace(sermon.audio_url);
        currentSource.current = sermon.audio_url;
        
        // Wait for audio to load with timeout
        let attempts = 0;
        const maxAttempts = 10;
        
        while (attempts < maxAttempts && player.duration === 0) {
          await new Promise(resolve => setTimeout(resolve, 300));
          attempts++;
        }
        
        if (player.duration === 0) {
          throw new Error('Audio failed to load within timeout period');
        }
      }

      await player.play();
      playbackStartTime.current = Date.now();

      dispatch({ type: 'SET_CURRENT_TRACK', payload: sermon });
      dispatch({ type: 'SET_QUEUE', payload: [sermon] });
      dispatch({ type: 'SET_CURRENT_INDEX', payload: 0 });
      dispatch({ type: 'SET_PLAYER_VISIBLE', payload: true });
      dispatch({ type: 'SET_LOADING', payload: false });
      dispatch({ type: 'SET_RETRY_COUNT', payload: 0 });
      
      console.log('✅ Successfully playing sermon:', sermon.title);
    } catch (error) {
      console.error('❌ Failed to play sermon:', error);
      handlePlaybackError(error, sermon);
    }
  };

  // Retry playback function
  const retryPlayback = async () => {
    if (state.currentTrack && state.retryCount < maxRetries) {
      dispatch({ type: 'SET_RETRY_COUNT', payload: state.retryCount + 1 });
      console.log(`🔄 Retrying playback (attempt ${state.retryCount + 1}/${maxRetries})`);
      await playSermon(state.currentTrack);
    } else {
      dispatch({ type: 'SET_ERROR', payload: 'Maximum retry attempts reached' });
    }
  };

  // Clear error function
  const clearError = () => {
    dispatch({ type: 'SET_ERROR', payload: null });
    dispatch({ type: 'SET_CONNECTION_ERROR', payload: false });
    dispatch({ type: 'SET_RETRY_COUNT', payload: 0 });
  };

  // Enhanced play queue function
  const playQueue = async (sermons: AudioSermon[], startIndex: number = 0) => {
    if (sermons.length === 0 || startIndex >= sermons.length) return;
    
    dispatch({ type: 'SET_QUEUE', payload: sermons });
    dispatch({ type: 'SET_CURRENT_INDEX', payload: startIndex });
    await playSermon(sermons[startIndex]);
  };

  // Basic controls
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
    dispatch({ type: 'SET_PLAYING', payload: false });
    dispatch({ type: 'SET_POSITION', payload: 0 });
    dispatch({ type: 'SET_PLAYER_VISIBLE', payload: false });
  };

  const seekTo = (position: number) => {
    const positionInSeconds = position / 1000;
    player.seekTo(positionInSeconds);
    dispatch({ type: 'SET_POSITION', payload: position });
  };

  // Navigation controls
  const skipToNext = async () => {
    if (state.queue.length > 0 && state.currentIndex < state.queue.length - 1) {
      const nextIndex = state.currentIndex + 1;
      dispatch({ type: 'SET_CURRENT_INDEX', payload: nextIndex });
      await playSermon(state.queue[nextIndex]);
    }
  };

  const skipToPrevious = async () => {
    if (state.queue.length > 0 && state.currentIndex > 0) {
      const prevIndex = state.currentIndex - 1;
      dispatch({ type: 'SET_CURRENT_INDEX', payload: prevIndex });
      await playSermon(state.queue[prevIndex]);
    }
  };

  // Mode controls
  const toggleRepeat = () => {
    const modes: ('off' | 'one' | 'all')[] = ['off', 'one', 'all'];
    const currentModeIndex = modes.indexOf(state.repeatMode);
    const nextMode = modes[(currentModeIndex + 1) % modes.length];
    dispatch({ type: 'SET_REPEAT_MODE', payload: nextMode });
  };

  const toggleShuffle = () => {
    dispatch({ type: 'SET_SHUFFLE_MODE', payload: !state.shuffleMode });
  };

  const setVolume = (volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    dispatch({ type: 'SET_VOLUME', payload: clampedVolume });
    // Note: expo-audio doesn't have direct volume control, you might need to implement this differently
  };

  const setRate = (rate: number) => {
    const clampedRate = Math.max(0.25, Math.min(2, rate));
    dispatch({ type: 'SET_RATE', payload: clampedRate });
    // Note: expo-audio doesn't have direct playback rate control
  };

  // UI controls
  const showMiniPlayer = () => {
    dispatch({ type: 'SET_PLAYER_VISIBLE', payload: true });
  };

  const hideMiniPlayer = () => {
    dispatch({ type: 'SET_PLAYER_VISIBLE', payload: false });
  };

  // Queue management
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
        retryPlayback,
        clearError,
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