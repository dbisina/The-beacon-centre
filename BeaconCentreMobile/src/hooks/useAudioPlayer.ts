// src/hooks/useAudioPlayer.ts - FIXED WITH NULL CHECKS
import { useAudio } from '@/context/AudioContext';
import { AudioSermon } from '@/types/api';

export const useAudioPlayer = () => {
  const audioContext = useAudio();
  
  // Add safety checks
  if (!audioContext || !audioContext.state) {
    console.warn('⚠️ Audio context not ready, returning default values');
    return {
      // Default values when context isn't ready
      currentTrack: null,
      isPlaying: false,
      isLoading: false,
      position: 0,
      duration: 0,
      queue: [],
      currentIndex: 0,
      error: null,
      volume: 1.0,
      isPlayerVisible: false,
      
      // Computed values with safe defaults
      progress: 0,
      formattedPosition: '0:00',
      formattedDuration: '0:00',
      canPlay: false,
      hasNext: false,
      hasPrevious: false,
      queueLength: 0,

      // Safe function stubs
      playSermon: async () => console.warn('Audio context not ready'),
      play: async () => console.warn('Audio context not ready'),
      pause: async () => console.warn('Audio context not ready'),
      seekTo: async () => console.warn('Audio context not ready'),
      showMiniPlayer: () => console.warn('Audio context not ready'),
      hideMiniPlayer: () => console.warn('Audio context not ready'),
      formatTime: (seconds: number) => '0:00',
      getProgress: () => 0,
      getPlayButtonIcon: () => 'play-arrow',
      getPlaybackStateText: () => 'Not Ready',
    };
  }

  const { state, formatTime, getProgress, ...actions } = audioContext;

  // Safe access to state with defaults
  const safeState = {
    currentTrack: state.currentTrack || null,
    isPlaying: state.isPlaying || false,
    isLoading: state.isLoading || false,
    position: state.position || 0,
    duration: state.duration || 0,
    queue: state.queue || [], // This was likely undefined
    currentIndex: state.currentIndex || 0,
    error: state.error || null,
    volume: state.volume || 1.0,
    isPlayerVisible: state.isPlayerVisible || false,
  };

  return {
    // Current state with safe defaults
    ...safeState,

    // Computed values with null checks
    progress: getProgress ? getProgress() : 0,
    formattedPosition: formatTime ? formatTime(safeState.position) : '0:00',
    formattedDuration: formatTime ? formatTime(safeState.duration) : '0:00',
    canPlay: !safeState.isLoading,
    hasNext: safeState.currentIndex < safeState.queue.length - 1,
    hasPrevious: safeState.currentIndex > 0,
    queueLength: safeState.queue.length,

    // Actions
    ...actions,
    
    // Helper functions with safe defaults
    getPlayButtonIcon: () => safeState.isPlaying ? 'pause' : 'play-arrow',
    getPlaybackStateText: () => {
      if (safeState.isLoading) return 'Loading...';
      if (safeState.error) return 'Error';
      if (safeState.isPlaying) return 'Playing';
      if (safeState.currentTrack) return 'Paused';
      return 'Stopped';
    },
  };
};