// src/hooks/useLocalStorage.ts
import { useState, useEffect } from 'react';
import LocalStorageService from '@/services/storage/LocalStorage';
import { LocalUserData } from '@/types/storage';

export const useLocalStorage = () => {
  const [userData, setUserData] = useState<LocalUserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const data = await LocalStorageService.getUserData();
      setUserData(data);
    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserData = async (updater: (data: LocalUserData) => LocalUserData) => {
    if (!userData) return;

    const newData = updater(userData);
    await LocalStorageService.saveUserData(newData);
    setUserData(newData);
  };

  const addFavorite = async (type: 'devotional' | 'video' | 'audio', id: number) => {
    await LocalStorageService.addFavorite(type, id);
    await loadUserData();
  };

  const removeFavorite = async (type: 'devotional' | 'video' | 'audio', id: number) => {
    await LocalStorageService.removeFavorite(type, id);
    await loadUserData();
  };

  const markDevotionalRead = async (devotionalId: number) => {
    await LocalStorageService.markDevotionalRead(devotionalId);
    await loadUserData();
  };

  const updateSettings = async (settings: Partial<LocalUserData['appSettings']>) => {
    await LocalStorageService.updateSettings(settings);
    await loadUserData();
  };

  return {
    userData,
    isLoading,
    loadUserData,
    updateUserData,
    addFavorite,
    removeFavorite,
    markDevotionalRead,
    updateSettings,
  };
};
