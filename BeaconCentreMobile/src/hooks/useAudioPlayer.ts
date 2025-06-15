// src/hooks/useAudioPlayer.ts
import { useContext } from 'react';
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
    skipToNext,
    skipToPrevious,
    seekTo,
    toggleRepeat,
    toggleShuffle,
  } = useAudio();

  const playSermonWithTracking = async (sermon: AudioSermon) => {
    await playSermon(sermon);
    await analyticsApi.trackSermonPlay(sermon.id, 'audio');
  };

  const playQueueWithTracking = async (sermons: AudioSermon[], startIndex: number = 0) => {
    await playQueue(sermons, startIndex);
    if (sermons[startIndex]) {
      await analyticsApi.trackSermonPlay(sermons[startIndex].id, 'audio');
    }
  };

  return {
    // State
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

    // Actions
    playSermon: playSermonWithTracking,
    playQueue: playQueueWithTracking,
    play,
    pause,
    skipToNext,
    skipToPrevious,
    seekTo,
    toggleRepeat,
    toggleShuffle,

    // Computed
    progress: state.duration > 0 ? (state.position / state.duration) * 100 : 0,
    hasNext: state.currentIndex < state.queue.length - 1,
    hasPrevious: state.currentIndex > 0,
  };
};