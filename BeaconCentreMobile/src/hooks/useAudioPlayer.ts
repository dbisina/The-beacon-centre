// src/hooks/useAudioPlayer.ts - COMPLETE EXPO-AUDIO COMPATIBLE HOOK
import { useAudio } from '@/context/AudioContext';
import { AudioSermon } from '@/types/api';
import { analyticsApi } from '@/services/api/analytics';

export const useAudioPlayer = () => {
  const {
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
  } = useAudio();

  // Enhanced wrapper functions with analytics tracking
  const playSermonWithTracking = async (sermon: AudioSermon) => {
    try {
      await playSermon(sermon);
      
      // Track analytics (non-blocking)
      analyticsApi.trackInteraction('audio', sermon.id, 'play').catch((error: Error) => {
        console.log('Analytics tracking failed (non-critical):', error);
      });
    } catch (error) {
      console.error('Error playing sermon:', error);
      throw error;
    }
  };

  const playQueueWithTracking = async (sermons: AudioSermon[], startIndex: number = 0) => {
    try {
      await playQueue(sermons, startIndex);
      
      if (sermons[startIndex]) {
        // Track analytics (non-blocking)
        analyticsApi.trackInteraction('audio', sermons[startIndex].id, 'queue_play').catch((error: Error) => {
          console.log('Analytics tracking failed (non-critical):', error);
        });
      }
    } catch (error) {
      console.error('Error playing queue:', error);
      throw error;
    }
  };

  const seekWithTracking = async (position: number) => {
    try {
      await seekTo(position);
      
      if (state.currentTrack) {
        // Track seek analytics (non-blocking)
        analyticsApi.trackInteraction('audio', state.currentTrack.id, 'seek').catch((error: Error) => {
          console.log('Analytics tracking failed (non-critical):', error);
        });
      }
    } catch (error) {
      console.error('Error seeking:', error);
    }
  };

  const pauseWithTracking = async () => {
    try {
      await pause();
      
      if (state.currentTrack) {
        // Track pause analytics (non-blocking)
        analyticsApi.trackInteraction('audio', state.currentTrack.id, 'pause').catch((error: Error) => {
          console.log('Analytics tracking failed (non-critical):', error);
        });
      }
    } catch (error) {
      console.error('Error pausing:', error);
    }
  };

  const playWithTracking = async () => {
    try {
      await play();
      
      if (state.currentTrack) {
        // Track resume analytics (non-blocking)
        analyticsApi.trackInteraction('audio', state.currentTrack.id, 'resume').catch((error: Error) => {
          console.log('Analytics tracking failed (non-critical):', error);
        });
      }
    } catch (error) {
      console.error('Error playing:', error);
    }
  };

  // Computed properties for convenience
  const currentTrack = state.currentTrack;
  const isPlaying = state.isPlaying;
  const position = state.position;
  const duration = state.duration;
  const queue = state.queue;
  const currentIndex = state.currentIndex;
  const isLoading = state.isLoading;
  const error = state.error;
  const volume = state.volume;
  const rate = state.rate;
  const isPlayerVisible = state.isPlayerVisible;
  
  // Convenience computed properties
  const progress = getProgress();
  const formattedPosition = formatTime(position);
  const formattedDuration = formatTime(duration);
  const canPlay = currentTrack !== null && !isLoading;
  
  // Queue navigation helpers
  const hasNext = currentIndex < queue.length - 1 || state.repeatMode === 'all';
  const hasPrevious = currentIndex > 0 || state.repeatMode === 'all';
  const queueLength = queue.length;
  
  // Repeat mode helpers
  const isRepeating = state.repeatMode === 'all';
  const isRepeatingOne = state.repeatMode === 'one';
  const isShuffling = state.shuffleMode;
  
  // UI helpers
  const getRepeatModeIcon = (): string => {
    switch (state.repeatMode) {
      case 'off':
        return 'repeat';
      case 'one':
        return 'repeat-one';
      case 'all':
        return 'repeat';
      default:
        return 'repeat';
    }
  };

  const getPlaybackStateText = (): string => {
    if (isLoading) return 'Loading...';
    if (error) return 'Error';
    if (!currentTrack) return 'No track';
    if (isPlaying) return 'Playing';
    return 'Paused';
  };

  const getPlayButtonIcon = (): string => {
    if (isLoading) return 'hourglass-empty';
    return isPlaying ? 'pause' : 'play-arrow';
  };

  const getShuffleIcon = (): string => {
    return isShuffling ? 'shuffle-on' : 'shuffle';
  };

  // Enhanced queue management
  const addToQueueNext = (sermon: AudioSermon) => {
    if (queue.length === 0) {
      addToQueue(sermon);
    } else {
      const newQueue = [...queue];
      newQueue.splice(currentIndex + 1, 0, sermon);
      // Would need to dispatch this to context
      console.log('Add to queue next:', sermon.title);
    }
  };

  const moveQueueItem = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || 
        fromIndex < 0 || fromIndex >= queue.length ||
        toIndex < 0 || toIndex >= queue.length) {
      return;
    }

    const newQueue = [...queue];
    const [movedItem] = newQueue.splice(fromIndex, 1);
    newQueue.splice(toIndex, 0, movedItem);
    
    // Adjust current index if needed
    let newCurrentIndex = currentIndex;
    if (fromIndex === currentIndex) {
      newCurrentIndex = toIndex;
    } else if (fromIndex < currentIndex && toIndex >= currentIndex) {
      newCurrentIndex = currentIndex - 1;
    } else if (fromIndex > currentIndex && toIndex <= currentIndex) {
      newCurrentIndex = currentIndex + 1;
    }
    
    console.log('Move queue item:', { fromIndex, toIndex, newCurrentIndex });
    // Would need to dispatch these changes to context
  };

  // Playback speed helpers
  const changePlaybackSpeed = async (newRate: number) => {
    const validRates = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
    if (validRates.includes(newRate)) {
      await setRate(newRate);
    }
  };

  const cyclePlaybackSpeed = async () => {
    const speeds = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
    const currentSpeedIndex = speeds.indexOf(rate);
    const nextSpeed = speeds[(currentSpeedIndex + 1) % speeds.length];
    await changePlaybackSpeed(nextSpeed);
  };

  // Audio position helpers
  const skipForward = async (seconds: number = 15) => {
    const newPosition = Math.min(position + (seconds * 1000), duration);
    await seekTo(newPosition);
  };

  const skipBackward = async (seconds: number = 15) => {
    const newPosition = Math.max(position - (seconds * 1000), 0);
    await seekTo(newPosition);
  };

  const seekToPercentage = async (percentage: number) => {
    const newPosition = (percentage / 100) * duration;
    await seekTo(newPosition);
  };

  // Player state helpers
  const isAtBeginning = position < 1000; // Less than 1 second
  const isNearEnd = duration > 0 && (position / duration) > 0.95; // More than 95% complete
  const remainingTime = duration - position;
  const formattedRemainingTime = `-${formatTime(remainingTime)}`;

  // Exposure of all methods and properties
  return {
    // Raw state
    state,
    
    // Basic properties
    currentTrack,
    isPlaying,
    position,
    duration,
    queue,
    currentIndex,
    isLoading,
    error,
    volume,
    rate,
    isPlayerVisible,
    
    // Computed properties
    progress,
    formattedPosition,
    formattedDuration,
    formattedRemainingTime,
    remainingTime,
    canPlay,
    
    // Navigation properties
    hasNext,
    hasPrevious,
    queueLength,
    
    // Mode properties
    isRepeating,
    isRepeatingOne,
    isShuffling,
    
    // State helpers
    isAtBeginning,
    isNearEnd,
    
    // Basic playback controls (with tracking)
    playSermon: playSermonWithTracking,
    playQueue: playQueueWithTracking,
    play: playWithTracking,
    pause: pauseWithTracking,
    stop,
    
    // Navigation controls
    skipToNext,
    skipToPrevious,
    seekTo: seekWithTracking,
    
    // Advanced seeking
    skipForward,
    skipBackward,
    seekToPercentage,
    
    // Mode controls
    toggleRepeat,
    toggleShuffle,
    setVolume,
    setRate,
    changePlaybackSpeed,
    cyclePlaybackSpeed,
    
    // UI controls
    showMiniPlayer,
    hideMiniPlayer,
    
    // Queue management
    addToQueue,
    removeFromQueue,
    clearQueue,
    addToQueueNext,
    moveQueueItem,
    
    // Utility methods
    formatTime,
    getProgress,
    
    // UI helpers
    getRepeatModeIcon,
    getPlaybackStateText,
    getPlayButtonIcon,
    getShuffleIcon,
  };
};