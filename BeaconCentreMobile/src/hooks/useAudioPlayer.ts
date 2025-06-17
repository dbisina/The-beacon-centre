// src/hooks/useAudioPlayer.ts - EXPO-AUDIO COMPATIBLE
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
      analyticsApi.track({
        action: 'sermon_play',
        contentType: 'audio',
        contentId: sermon.id,
        title: sermon.title,
        speaker: sermon.speaker,
        category: sermon.category,
        timestamp: new Date().toISOString(),
      }).catch(error => {
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
        analyticsApi.track({
          action: 'queue_play',
          contentType: 'audio',
          contentId: sermons[startIndex].id,
          queueLength: sermons.length,
          startIndex,
          timestamp: new Date().toISOString(),
        }).catch(error => {
          console.log('Analytics tracking failed (non-critical):', error);
        });
      }
    } catch (error) {
      console.error('Error playing queue:', error);
      throw error;
    }
  };

  const seekWithTracking = (position: number) => {
    try {
      seekTo(position);
      
      if (state.currentTrack) {
        // Track seek analytics (non-blocking)
        analyticsApi.track({
          action: 'sermon_seek',
          contentType: 'audio',
          contentId: state.currentTrack.id,
          position,
          duration: state.duration,
          timestamp: new Date().toISOString(),
        }).catch(error => {
          console.log('Analytics tracking failed (non-critical):', error);
        });
      }
    } catch (error) {
      console.error('Error seeking:', error);
    }
  };

  const pauseWithTracking = () => {
    try {
      pause();
      
      if (state.currentTrack) {
        // Track pause analytics (non-blocking)
        analyticsApi.track({
          action: 'sermon_pause',
          contentType: 'audio',
          contentId: state.currentTrack.id,
          position: state.position,
          duration: state.duration,
          timestamp: new Date().toISOString(),
        }).catch(error => {
          console.log('Analytics tracking failed (non-critical):', error);
        });
      }
    } catch (error) {
      console.error('Error pausing:', error);
    }
  };

  const playWithTracking = () => {
    try {
      play();
      
      if (state.currentTrack) {
        // Track resume analytics (non-blocking)
        analyticsApi.track({
          action: 'sermon_resume',
          contentType: 'audio',
          contentId: state.currentTrack.id,
          position: state.position,
          timestamp: new Date().toISOString(),
        }).catch(error => {
          console.log('Analytics tracking failed (non-critical):', error);
        });
      }
    } catch (error) {
      console.error('Error playing:', error);
    }
  };

  // Computed values and helper methods
  const progress = getProgress();
  const hasNext = state.currentIndex < state.queue.length - 1 || state.repeatMode === 'all';
  const hasPrevious = state.currentIndex > 0 || state.repeatMode === 'all';
  const canPlay = state.currentTrack !== null && !state.isLoading;
  const formattedPosition = formatTime(state.position);
  const formattedDuration = formatTime(state.duration);

  // Player state helpers
  const isIdle = !state.currentTrack;
  const isBuffering = state.isLoading;
  const isReady = state.currentTrack !== null && !state.isLoading && !state.error;
  const hasError = !!state.error;
  
  // Queue helpers
  const isFirstInQueue = state.currentIndex === 0;
  const isLastInQueue = state.currentIndex === state.queue.length - 1;
  const queueLength = state.queue.length;
  const remainingTracks = state.queue.length - state.currentIndex - 1;
  
  // Playback mode helpers
  const isRepeating = state.repeatMode !== 'off';
  const isRepeatingOne = state.repeatMode === 'one';
  const isRepeatingAll = state.repeatMode === 'all';
  const isShuffling = state.shuffleMode;

  // Volume and rate helpers
  const isMuted = state.volume === 0;
  const isNormalSpeed = state.rate === 1.0;
  const volumePercentage = Math.round(state.volume * 100);

  // Helper methods
  const getRepeatModeIcon = () => {
    switch (state.repeatMode) {
      case 'one':
        return 'repeat-one';
      case 'all':
        return 'repeat';
      default:
        return 'repeat';
    }
  };

  const getPlaybackStateText = () => {
    if (isBuffering) return 'Loading...';
    if (hasError) return 'Error';
    if (isIdle) return 'No audio selected';
    if (state.isPlaying) return 'Playing';
    return 'Paused';
  };

  const getCurrentSermonInfo = () => {
    if (!state.currentTrack) return null;
    
    return {
      id: state.currentTrack.id,
      title: state.currentTrack.title,
      speaker: state.currentTrack.speaker,
      category: state.currentTrack.category,
      duration: state.currentTrack.duration,
      description: state.currentTrack.description,
    };
  };

  const getQueueInfo = () => {
    return {
      total: queueLength,
      current: state.currentIndex + 1,
      remaining: remainingTracks,
      tracks: state.queue.map((sermon, index) => ({
        id: sermon.id,
        title: sermon.title,
        speaker: sermon.speaker,
        isCurrentTrack: index === state.currentIndex,
        index,
      })),
    };
  };

  // Advanced controls
  const skipToTrack = async (index: number) => {
    if (index >= 0 && index < state.queue.length) {
      await playQueue(state.queue, index);
    }
  };

  const addToQueueNext = (sermon: AudioSermon) => {
    const newQueue = [...state.queue];
    newQueue.splice(state.currentIndex + 1, 0, sermon);
    // Note: You might need to add this method to AudioContext
    console.log('Add to queue next:', sermon.title);
  };

  const reorderQueue = (fromIndex: number, toIndex: number) => {
    const newQueue = [...state.queue];
    const [movedItem] = newQueue.splice(fromIndex, 1);
    newQueue.splice(toIndex, 0, movedItem);
    // Note: You might need to add this method to AudioContext
    console.log('Reorder queue:', fromIndex, 'to', toIndex);
  };

  return {
    // State from AudioContext
    currentTrack: state.currentTrack,
    isPlaying: state.isPlaying,
    position: state.position,
    duration: state.duration,
    queue: state.queue,
    currentIndex: state.currentIndex,
    isLoading: state.isLoading,
    error: state.error,
    repeatMode: state.repeatMode,
    shuffleMode: state.shuffleMode,
    volume: state.volume,
    rate: state.rate,
    isPlayerVisible: state.isPlayerVisible,

    // Actions with tracking
    playSermon: playSermonWithTracking,
    playQueue: playQueueWithTracking,
    play: playWithTracking,
    pause: pauseWithTracking,
    seekTo: seekWithTracking,

    // Direct actions
    stop,
    skipToNext,
    skipToPrevious,
    toggleRepeat,
    toggleShuffle,
    setVolume,
    setRate,
    showMiniPlayer,
    hideMiniPlayer,
    addToQueue,
    removeFromQueue,
    clearQueue,

    // Computed values
    progress,
    hasNext,
    hasPrevious,
    canPlay,
    formattedPosition,
    formattedDuration,

    // Player state helpers
    isIdle,
    isBuffering,
    isReady,
    hasError,
    
    // Queue helpers
    isFirstInQueue,
    isLastInQueue,
    queueLength,
    remainingTracks,
    
    // Playback mode helpers
    isRepeating,
    isRepeatingOne,
    isRepeatingAll,
    isShuffling,

    // Volume and rate helpers
    isMuted,
    isNormalSpeed,
    volumePercentage,

    // Utility methods
    formatTime,
    getProgress,
    getRepeatModeIcon,
    getPlaybackStateText,
    getCurrentSermonInfo,
    getQueueInfo,

    // Advanced controls
    skipToTrack,
    addToQueueNext,
    reorderQueue,
  };
};