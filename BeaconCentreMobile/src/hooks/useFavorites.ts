// src/hooks/useFavorites.ts
import { useState, useEffect, useCallback } from 'react';
import LocalStorageService from '@/services/storage/LocalStorage';
import { useApp } from '@/context/AppContext';

type FavoriteType = 'devotional' | 'video' | 'audio' | 'video_sermon' | 'audio_sermon';

export const useFavorites = () => {
  const { state, refreshUserData } = useApp();
  const [favorites, setFavorites] = useState({
    devotionals: [] as number[],
    videoSermons: [] as number[],
    audioSermons: [] as number[],
  });

  // Update local state when app state changes
  useEffect(() => {
    if (state.userData) {
      setFavorites({
        devotionals: state.userData.favoriteDevotionals || [],
        videoSermons: state.userData.favoriteVideoSermons || [],
        audioSermons: state.userData.favoriteAudioSermons || [],
      });
    }
  }, [state.userData]);

  // Check if an item is favorited
  const isFavorite = useCallback((type: FavoriteType, id: number): boolean => {
    switch (type) {
      case 'devotional':
        return favorites.devotionals.includes(id);
      case 'video':
      case 'video_sermon':
        return favorites.videoSermons.includes(id);
      case 'audio':
      case 'audio_sermon':
        return favorites.audioSermons.includes(id);
      default:
        return false;
    }
  }, [favorites]);

  // Toggle favorite status
  const toggleFavorite = useCallback(async (type: FavoriteType, id: number): Promise<boolean> => {
    try {
      // Convert type to the format expected by LocalStorageService
      let storageType: 'devotional' | 'video' | 'audio';
      switch (type) {
        case 'devotional':
          storageType = 'devotional';
          break;
        case 'video':
        case 'video_sermon':
          storageType = 'video';
          break;
        case 'audio':
        case 'audio_sermon':
          storageType = 'audio';
          break;
        default:
          throw new Error(`Invalid favorite type: ${type}`);
      }

      const success = await LocalStorageService.toggleFavorite(storageType, id);
      
      if (success) {
        // Refresh user data to update UI
        await refreshUserData();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      return false;
    }
  }, [refreshUserData]);

  // Add to favorites
  const addFavorite = useCallback(async (type: FavoriteType, id: number): Promise<boolean> => {
    try {
      if (isFavorite(type, id)) {
        return true; // Already favorited
      }

      let storageType: 'devotional' | 'video' | 'audio';
      switch (type) {
        case 'devotional':
          storageType = 'devotional';
          break;
        case 'video':
        case 'video_sermon':
          storageType = 'video';
          break;
        case 'audio':
        case 'audio_sermon':
          storageType = 'audio';
          break;
        default:
          throw new Error(`Invalid favorite type: ${type}`);
      }

      await LocalStorageService.addFavorite(storageType, id);
      await refreshUserData();
      return true;
    } catch (error) {
      console.error('Failed to add favorite:', error);
      return false;
    }
  }, [isFavorite, refreshUserData]);

  // Remove from favorites
  const removeFavorite = useCallback(async (type: FavoriteType, id: number): Promise<boolean> => {
    try {
      if (!isFavorite(type, id)) {
        return true; // Already not favorited
      }

      let storageType: 'devotional' | 'video' | 'audio';
      switch (type) {
        case 'devotional':
          storageType = 'devotional';
          break;
        case 'video':
        case 'video_sermon':
          storageType = 'video';
          break;
        case 'audio':
        case 'audio_sermon':
          storageType = 'audio';
          break;
        default:
          throw new Error(`Invalid favorite type: ${type}`);
      }

      await LocalStorageService.removeFavorite(storageType, id);
      await refreshUserData();
      return true;
    } catch (error) {
      console.error('Failed to remove favorite:', error);
      return false;
    }
  }, [isFavorite, refreshUserData]);

  // Get all favorites of a specific type
  const getFavorites = useCallback((type: FavoriteType): number[] => {
    switch (type) {
      case 'devotional':
        return favorites.devotionals;
      case 'video':
      case 'video_sermon':
        return favorites.videoSermons;
      case 'audio':
      case 'audio_sermon':
        return favorites.audioSermons;
      default:
        return [];
    }
  }, [favorites]);

  // Get total favorite count
  const getTotalFavorites = useCallback((): number => {
    return favorites.devotionals.length + 
           favorites.videoSermons.length + 
           favorites.audioSermons.length;
  }, [favorites]);

  // Clear all favorites (with type filter)
  const clearFavorites = useCallback(async (type?: FavoriteType): Promise<boolean> => {
    try {
      if (!type) {
        // Clear all favorites
        const userData = await LocalStorageService.getUserData();
        userData.favoriteDevotionals = [];
        userData.favoriteVideoSermons = [];
        userData.favoriteAudioSermons = [];
        await LocalStorageService.saveUserData(userData);
      } else {
        // Clear specific type
        const currentFavorites = getFavorites(type);
        for (const id of currentFavorites) {
          await removeFavorite(type, id);
        }
      }
      
      await refreshUserData();
      return true;
    } catch (error) {
      console.error('Failed to clear favorites:', error);
      return false;
    }
  }, [getFavorites, removeFavorite, refreshUserData]);

  return {
    // State
    favorites,
    totalFavorites: getTotalFavorites(),
    
    // Check functions
    isFavorite,
    getFavorites,
    getTotalFavorites,
    
    // Action functions
    toggleFavorite,
    addFavorite,
    removeFavorite,
    clearFavorites,
  };
};