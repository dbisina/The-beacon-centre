// src/hooks/useBeaconAudio.ts - SIMPLE EXPO-AUDIO HOOK
import { useState, useCallback, useRef, useEffect } from 'react';
import { useAudioPlayer } from 'expo-audio';
import { AudioSermon } from '@/types/api';

interface BeaconAudioState {
  currentSermon: AudioSermon | null;
  playlist: AudioSermon[];
  currentIndex: number;
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
  repeatMode: 'off' | 'one' | 'all';
  isShuffling: boolean;
}

export const useBeaconAudio = () => {
  // State management
  const [state, setState] = useState<BeaconAudioState>({
    currentSermon: null,
    playlist: [],
    currentIndex: 0,
    isPlaying: false,
    isLoading: false,
    error: null,
    repeatMode: 'off',
    isShuffling: false,
  });

  // Audio source for expo-audio
  const [audioSource, setAudioSource] = useState<string | null>(null);
  
  // Use expo-audio player hook
  const player = useAudioPlayer(audioSource);

  // Update playing state when player state changes
  useEffect(() => {
    setState(prev => ({ ...prev, isPlaying: player.playing }));
  }, [player.playing]);

  // Update loaded state
  useEffect(() => {
    setState(prev => ({ ...prev, isLoading: !player.isLoaded }));
  }, [player.isLoaded]);

  // Load a single sermon
  const loadSermon = useCallback(async (sermon: AudioSermon) => {
    try {
      setState(prev => ({ 
        ...prev, 
        isLoading: true, 
        error: null,
        currentSermon: sermon 
      }));

      console.log('Loading sermon:', sermon.title);
      
      // Validate URL
      if (!sermon.audio_url) {
        throw new Error('No audio URL provided');
      }

      // Set the audio source (this will trigger expo-audio to load it)
      setAudioSource(sermon.audio_url);
      
      console.log('Sermon loaded successfully:', sermon.title);
      
    } catch (error) {
      console.error('Failed to load sermon:', error);
      setState(prev => ({ 
        ...prev, 
        error: `Failed to load audio: ${error}`,
        isLoading: false 
      }));
    }
  }, []);

  // Play current audio
  const play = useCallback(async () => {
    try {
      if (!audioSource) {
        throw new Error('No audio loaded');
      }

      setState(prev => ({ ...prev, error: null }));
      await player.play();
      
    } catch (error) {
      console.error('Failed to play:', error);
      setState(prev => ({ 
        ...prev, 
        error: `Failed to play audio: ${error}` 
      }));
    }
  }, [player, audioSource]);

  // Pause current audio
  const pause = useCallback(async () => {
    try {
      await player.pause();
    } catch (error) {
      console.error('Failed to pause:', error);
      setState(prev => ({ 
        ...prev, 
        error: `Failed to pause audio: ${error}` 
      }));
    }
  }, [player]);

  // Toggle play/pause
  const togglePlayPause = useCallback(async () => {
    if (player.playing) {
      await pause();
    } else {
      await play();
    }
  }, [player.playing, play, pause]);

  // Play a sermon (load and play)
  const playSermon = useCallback(async (sermon: AudioSermon) => {
    await loadSermon(sermon);
    // Small delay to allow loading
    setTimeout(async () => {
      await play();
    }, 500);
  }, [loadSermon, play]);

  // Set playlist
  const setPlaylist = useCallback(async (sermons: AudioSermon[], startIndex: number = 0) => {
    setState(prev => ({
      ...prev,
      playlist: sermons,
      currentIndex: startIndex,
    }));

    if (sermons.length > 0 && startIndex < sermons.length) {
      await loadSermon(sermons[startIndex]);
    }
  }, [loadSermon]);

  // Play playlist
  const playPlaylist = useCallback(async (sermons: AudioSermon[], startIndex: number = 0) => {
    await setPlaylist(sermons, startIndex);
    setTimeout(async () => {
      await play();
    }, 500);
  }, [setPlaylist, play]);

  // Skip to next track
  const skipToNext = useCallback(async () => {
    const { playlist, currentIndex, repeatMode } = state;
    
    let nextIndex = currentIndex + 1;
    
    if (nextIndex >= playlist.length) {
      if (repeatMode === 'all') {
        nextIndex = 0;
      } else {
        return; // No next track and not repeating
      }
    }

    setState(prev => ({ ...prev, currentIndex: nextIndex }));
    
    if (playlist[nextIndex]) {
      await playSermon(playlist[nextIndex]);
    }
  }, [state, playSermon]);

  // Skip to previous track
  const skipToPrevious = useCallback(async () => {
    const { playlist, currentIndex, repeatMode } = state;
    
    let prevIndex = currentIndex - 1;
    
    if (prevIndex < 0) {
      if (repeatMode === 'all') {
        prevIndex = playlist.length - 1;
      } else {
        return; // No previous track and not repeating
      }
    }

    setState(prev => ({ ...prev, currentIndex: prevIndex }));
    
    if (playlist[prevIndex]) {
      await playSermon(playlist[prevIndex]);
    }
  }, [state, playSermon]);

  // Seek to position (in seconds)
  const seekTo = useCallback(async (seconds: number) => {
    try {
      // expo-audio uses seekBy for relative seeking
      const currentTime = player.currentTime || 0;
      const seekAmount = seconds - currentTime;
      
      await player.seekBy(seekAmount);
    } catch (error) {
      console.error('Failed to seek:', error);
      setState(prev => ({ 
        ...prev, 
        error: `Failed to seek: ${error}` 
      }));
    }
  }, [player]);

  // Toggle repeat mode
  const toggleRepeatMode = useCallback(() => {
    setState(prev => {
      const modes: Array<'off' | 'one' | 'all'> = ['off', 'one', 'all'];
      const currentIndex = modes.indexOf(prev.repeatMode);
      const nextMode = modes[(currentIndex + 1) % modes.length];
      
      return { ...prev, repeatMode: nextMode };
    });
  }, []);

  // Toggle shuffle
  const toggleShuffle = useCallback(() => {
    setState(prev => ({ ...prev, isShuffling: !prev.isShuffling }));
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Format time helper
  const formatTime = useCallback((seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  // Computed values
  const currentTime = player.currentTime || 0;
  const duration = player.duration || 0;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const formattedCurrentTime = formatTime(currentTime);
  const formattedDuration = formatTime(duration);
  const hasNext = state.currentIndex < state.playlist.length - 1;
  const hasPrevious = state.currentIndex > 0;
  const canPlay = !!audioSource && player.isLoaded;

  return {
    // State
    ...state,
    
    // Player properties
    currentTime,
    duration,
    progress,
    formattedCurrentTime,
    formattedDuration,
    hasNext,
    hasPrevious,
    canPlay,
    isLoaded: player.isLoaded,

    // Actions
    loadSermon,
    play,
    pause,
    togglePlayPause,
    playSermon,
    setPlaylist,
    playPlaylist,
    skipToNext,
    skipToPrevious,
    seekTo,
    toggleRepeatMode,
    toggleShuffle,
    clearError,
    formatTime,

    // Player reference (for advanced usage)
    player,
  };
};