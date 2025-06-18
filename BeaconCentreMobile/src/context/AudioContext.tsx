// src/context/AudioContext.tsx - RESILIENT IMPLEMENTATION WITH ERROR HANDLING

import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import { AudioSermon } from '@/types/api';
import TrackPlayerService from '@/services/audio/TrackPlayerService';

// Define complete audio state interface
interface AudioState {
  currentTrack: AudioSermon | null;
  isPlaying: boolean;
  position: number; // in seconds
  duration: number; // in seconds
  queue: AudioSermon[];
  currentIndex: number;
  isLoading: boolean;
  error: string | null;
  repeatMode: 'off' | 'one' | 'all';
  shuffleMode: boolean;
  volume: number;
  isPlayerVisible: boolean;
  isServiceReady: boolean; // Track if the audio service is available
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
  | { type: 'SET_PLAYER_VISIBLE'; payload: boolean }
  | { type: 'SET_SERVICE_READY'; payload: boolean }
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
  isPlayerVisible: false,
  isServiceReady: false,
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
    case 'SET_PLAYER_VISIBLE':
      return { ...state, isPlayerVisible: action.payload };
    case 'SET_SERVICE_READY':
      return { ...state, isServiceReady: action.payload };
    case 'UPDATE_PLAYBACK_STATUS':
      return { ...state, ...action.payload };
    case 'RESET_AUDIO':
      return { ...initialState, isServiceReady: state.isServiceReady };
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
  play: () => Promise<void>;
  pause: () => Promise<void>;
  stop: () => Promise<void>;
  
  // Navigation controls
  skipToNext: () => Promise<void>;
  skipToPrevious: () => Promise<void>;
  seekTo: (position: number) => Promise<void>;
  
  // Mode controls
  toggleRepeat: () => void;
  toggleShuffle: () => void;
  setVolume: (volume: number) => Promise<void>;
  
  // UI controls
  showMiniPlayer: () => void;
  hideMiniPlayer: () => void;
  
  // Queue management
  addToQueue: (sermon: AudioSermon) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  
  // Utility methods
  formatTime: (seconds: number) => string;
  getProgress: () => number;
  
  // Service status
  isAudioServiceAvailable: () => boolean;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(audioReducer, initialState);
  
  // Get singleton instance safely
  const trackPlayerService = useRef<TrackPlayerService | null>(null);
  const statusUpdateInterval = useRef<NodeJS.Timeout | null>(null);
  const initializationAttempted = useRef(false);

  // Initialize the service safely
  useEffect(() => {
    const initializeService = async () => {
      if (initializationAttempted.current) return;
      initializationAttempted.current = true;

      try {
        console.log('Initializing TrackPlayerService...');
        trackPlayerService.current = TrackPlayerService.getInstance();
        
        // Test if the service is working
        const status = await trackPlayerService.current.getPlaybackStatus();
        console.log('TrackPlayerService initialized successfully:', status);
        
        dispatch({ type: 'SET_SERVICE_READY', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });
        
      } catch (error) {
        console.error('Failed to initialize TrackPlayerService:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Audio service not available. Some features may not work.' });
        dispatch({ type: 'SET_SERVICE_READY', payload: false });
      }
    };

    initializeService();
  }, []);

  // Setup status polling only if service is ready
  useEffect(() => {
    if (!state.isServiceReady || !trackPlayerService.current) {
      return;
    }

    const startStatusPolling = () => {
      statusUpdateInterval.current = setInterval(async () => {
        try {
          const status = await trackPlayerService.current!.getPlaybackStatus();
          
          // Update state based on current player status
          dispatch({ type: 'SET_PLAYING', payload: status.isPlaying });
          dispatch({ type: 'SET_POSITION', payload: status.position });
          dispatch({ type: 'SET_DURATION', payload: status.duration });
          dispatch({ type: 'SET_VOLUME', payload: status.volume });
          
          // Update loading state
          const isLoading = state.currentTrack !== null && (!status.isLoaded || status.duration === 0);
          dispatch({ type: 'SET_LOADING', payload: isLoading });
          
        } catch (error) {
          console.error('Status polling error:', error);
          // Don't spam errors, just log them
        }
      }, 1000); // Update every second
    };

    startStatusPolling();

    // Cleanup interval on unmount
    return () => {
      if (statusUpdateInterval.current) {
        clearInterval(statusUpdateInterval.current);
      }
    };
  }, [state.isServiceReady, state.currentTrack]);

  // Handle playback completion
  useEffect(() => {
    if (state.position > 0 && state.duration > 0 && 
        state.position >= state.duration - 1 && // Within 1 second of end
        !state.isPlaying && 
        state.currentTrack) {
      
      console.log('Track completed, handling repeat/next');
      
      // Handle repeat modes
      if (state.repeatMode === 'one') {
        // Repeat current track
        seekTo(0);
        play();
      } else if (state.repeatMode === 'all' || (trackPlayerService.current?.hasNext())) {
        // Play next track
        skipToNext();
      } else {
        // End of queue
        dispatch({ type: 'SET_PLAYING', payload: false });
        dispatch({ type: 'SET_POSITION', payload: 0 });
      }
    }
  }, [state.position, state.duration, state.isPlaying, state.currentTrack, state.repeatMode]);

  // Utility to check if service is available
  const isAudioServiceAvailable = (): boolean => {
    return state.isServiceReady && trackPlayerService.current !== null;
  };

  // Basic playback controls with error handling
  const playSermon = async (sermon: AudioSermon) => {
    if (!isAudioServiceAvailable()) {
      dispatch({ type: 'SET_ERROR', payload: 'Audio service is not available. Please restart the app.' });
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      console.log('Starting to play sermon:', sermon.title);

      // Validate URL first
      const isValidUrl = await trackPlayerService.current!.validateAudioUrl(sermon.audio_url);
      if (!isValidUrl) {
        throw new Error('Invalid audio URL or audio file not accessible');
      }

      await trackPlayerService.current!.playSermon(sermon);

      dispatch({ type: 'SET_CURRENT_TRACK', payload: sermon });
      dispatch({ type: 'SET_QUEUE', payload: [sermon] });
      dispatch({ type: 'SET_CURRENT_INDEX', payload: 0 });
      dispatch({ type: 'SET_PLAYER_VISIBLE', payload: true });
      
      console.log('Successfully started playing:', sermon.title);
    } catch (error) {
      console.error('Failed to play sermon:', error);
      dispatch({ type: 'SET_ERROR', payload: `Failed to play audio: ${error}` });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const playQueue = async (sermons: AudioSermon[], startIndex = 0) => {
    if (!isAudioServiceAvailable()) {
      dispatch({ type: 'SET_ERROR', payload: 'Audio service is not available. Please restart the app.' });
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      await trackPlayerService.current!.playPlaylist(sermons, startIndex);
      
      dispatch({ type: 'SET_QUEUE', payload: sermons });
      dispatch({ type: 'SET_CURRENT_INDEX', payload: startIndex });
      dispatch({ type: 'SET_CURRENT_TRACK', payload: sermons[startIndex] });
      dispatch({ type: 'SET_PLAYER_VISIBLE', payload: true });
      
      console.log('Started playing queue from index:', startIndex);
    } catch (error) {
      console.error('Failed to play queue:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to play audio queue. Please try again.' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const play = async () => {
    if (!isAudioServiceAvailable()) return;
    
    try {
      await trackPlayerService.current!.play();
    } catch (error) {
      console.error('Failed to play:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to play audio.' });
    }
  };

  const pause = async () => {
    if (!isAudioServiceAvailable()) return;
    
    try {
      await trackPlayerService.current!.pause();
    } catch (error) {
      console.error('Failed to pause:', error);
    }
  };

  const stop = async () => {
    if (!isAudioServiceAvailable()) return;
    
    try {
      await trackPlayerService.current!.stop();
      dispatch({ type: 'SET_PLAYER_VISIBLE', payload: false });
      dispatch({ type: 'SET_POSITION', payload: 0 });
    } catch (error) {
      console.error('Failed to stop:', error);
    }
  };

  const skipToNext = async () => {
    if (!isAudioServiceAvailable()) return;
    
    try {
      if (trackPlayerService.current!.hasNext()) {
        await trackPlayerService.current!.skipToNext();
        const currentSermon = trackPlayerService.current!.getCurrentSermon();
        if (currentSermon) {
          dispatch({ type: 'SET_CURRENT_TRACK', payload: currentSermon });
          dispatch({ type: 'SET_CURRENT_INDEX', payload: trackPlayerService.current!.getCurrentIndex() });
        }
      }
    } catch (error) {
      console.error('Failed to skip to next:', error);
    }
  };

  const skipToPrevious = async () => {
    if (!isAudioServiceAvailable()) return;
    
    try {
      if (trackPlayerService.current!.hasPrevious()) {
        await trackPlayerService.current!.skipToPrevious();
        const currentSermon = trackPlayerService.current!.getCurrentSermon();
        if (currentSermon) {
          dispatch({ type: 'SET_CURRENT_TRACK', payload: currentSermon });
          dispatch({ type: 'SET_CURRENT_INDEX', payload: trackPlayerService.current!.getCurrentIndex() });
        }
      }
    } catch (error) {
      console.error('Failed to skip to previous:', error);
    }
  };

  const seekTo = async (position: number) => {
    if (!isAudioServiceAvailable()) return;
    
    try {
      await trackPlayerService.current!.seekTo(position);
    } catch (error) {
      console.error('Failed to seek:', error);
    }
  };

  const toggleRepeat = () => {
    const modes: Array<'off' | 'one' | 'all'> = ['off', 'one', 'all'];
    const currentIndex = modes.indexOf(state.repeatMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    dispatch({ type: 'SET_REPEAT_MODE', payload: nextMode });
  };

  const toggleShuffle = () => {
    dispatch({ type: 'SET_SHUFFLE_MODE', payload: !state.shuffleMode });
  };

  const setVolume = async (volume: number) => {
    if (!isAudioServiceAvailable()) return;
    
    try {
      await trackPlayerService.current!.setVolume(volume);
      dispatch({ type: 'SET_VOLUME', payload: volume });
    } catch (error) {
      console.error('Failed to set volume:', error);
    }
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
    
    // Adjust current index if necessary
    if (index < state.currentIndex) {
      dispatch({ type: 'SET_CURRENT_INDEX', payload: state.currentIndex - 1 });
    } else if (index === state.currentIndex && newQueue.length === 0) {
      stop();
    }
  };

  const clearQueue = () => {
    dispatch({ type: 'SET_QUEUE', payload: [] });
    dispatch({ type: 'SET_CURRENT_INDEX', payload: 0 });
    stop();
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = (): number => {
    if (state.duration > 0) {
      return state.position / state.duration;
    }
    return 0;
  };

  const contextValue: AudioContextType = {
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
    showMiniPlayer,
    hideMiniPlayer,
    addToQueue,
    removeFromQueue,
    clearQueue,
    formatTime,
    getProgress,
    isAudioServiceAvailable,
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

// Export the context for testing
export { AudioContext };