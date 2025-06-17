// src/hooks/useDownloads.ts
import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import LocalStorageService from '@/services/storage/LocalStorage';
import { useApp } from '@/context/AppContext';
import { DownloadedAudio } from '@/types/storage';
import { AudioSermon } from '@/types/api';

export const useDownloads = () => {
  const { state, refreshUserData } = useApp();
  const [downloadedAudio, setDownloadedAudio] = useState<DownloadedAudio[]>([]);
  const [downloadProgress, setDownloadProgress] = useState<Record<number, number>>({});

  // Update local state when app state changes
  useEffect(() => {
    if (state.userData) {
      setDownloadedAudio(state.userData.downloadedAudio || []);
    }
  }, [state.userData]);

  // Check if an audio sermon is downloaded
  const isDownloaded = useCallback((sermonId: number): boolean => {
    return downloadedAudio.some(audio => audio.sermonId === sermonId);
  }, [downloadedAudio]);

  // Get downloaded audio by sermon ID
  const getDownloadedAudio = useCallback((sermonId: number): DownloadedAudio | null => {
    return downloadedAudio.find(audio => audio.sermonId === sermonId) || null;
  }, [downloadedAudio]);

  // Download audio sermon
  const downloadAudio = useCallback(async (sermon: AudioSermon): Promise<boolean> => {
    try {
      if (isDownloaded(sermon.id)) {
        Alert.alert('Already Downloaded', 'This sermon is already available offline.');
        return true;
      }

      // Show confirmation dialog
      return new Promise((resolve) => {
        Alert.alert(
          'Download Sermon',
          `Download "${sermon.title}" for offline listening?`,
          [
            { 
              text: 'Cancel', 
              style: 'cancel',
              onPress: () => resolve(false)
            },
            { 
              text: 'Download',
              onPress: async () => {
                try {
                  // Set initial progress
                  setDownloadProgress(prev => ({ ...prev, [sermon.id]: 0 }));

                  // Simulate download progress (replace with actual download logic)
                  const progressInterval = setInterval(() => {
                    setDownloadProgress(prev => {
                      const currentProgress = prev[sermon.id] || 0;
                      if (currentProgress >= 100) {
                        clearInterval(progressInterval);
                        return prev;
                      }
                      return { ...prev, [sermon.id]: currentProgress + 10 };
                    });
                  }, 200);

                  // TODO: Implement actual file download with react-native-fs or expo-file-system
                  // For now, simulate download completion after 2 seconds
                  setTimeout(async () => {
                    clearInterval(progressInterval);
                    setDownloadProgress(prev => ({ ...prev, [sermon.id]: 100 }));

                    // Add to downloaded audio list
                    const downloadedAudio: DownloadedAudio = {
                      sermonId: sermon.id,
                      title: sermon.title,
                      speaker: sermon.speaker,
                      localPath: `downloaded_audio_${sermon.id}.mp3`,
                      downloadDate: new Date().toISOString(),
                    };

                    await LocalStorageService.addDownloadedAudio(downloadedAudio);
                    await refreshUserData();

                    // Clear progress after a moment
                    setTimeout(() => {
                      setDownloadProgress(prev => {
                        const newProgress = { ...prev };
                        delete newProgress[sermon.id];
                        return newProgress;
                      });
                    }, 1000);

                    Alert.alert('Download Complete', 'Sermon is now available offline.');
                    resolve(true);
                  }, 2000);

                } catch (error) {
                  console.error('Download failed:', error);
                  setDownloadProgress(prev => {
                    const newProgress = { ...prev };
                    delete newProgress[sermon.id];
                    return newProgress;
                  });
                  Alert.alert('Download Failed', 'Failed to download sermon. Please try again.');
                  resolve(false);
                }
              }
            }
          ]
        );
      });

    } catch (error) {
      console.error('Failed to download audio:', error);
      Alert.alert('Download Failed', 'Failed to download sermon. Please try again.');
      return false;
    }
  }, [isDownloaded, refreshUserData]);

  // Remove downloaded audio
  const removeDownload = useCallback(async (sermonId: number): Promise<boolean> => {
    try {
      if (!isDownloaded(sermonId)) {
        return true; // Already not downloaded
      }

      return new Promise((resolve) => {
        Alert.alert(
          'Remove Download',
          'Remove this sermon from offline storage?',
          [
            { 
              text: 'Cancel', 
              style: 'cancel',
              onPress: () => resolve(false)
            },
            { 
              text: 'Remove',
              style: 'destructive',
              onPress: async () => {
                try {
                  // TODO: Delete actual file from local storage
                  await LocalStorageService.removeDownloadedAudio(sermonId);
                  await refreshUserData();
                  Alert.alert('Removed', 'Sermon removed from offline storage.');
                  resolve(true);
                } catch (error) {
                  console.error('Failed to remove download:', error);
                  Alert.alert('Error', 'Failed to remove download.');
                  resolve(false);
                }
              }
            }
          ]
        );
      });

    } catch (error) {
      console.error('Failed to remove download:', error);
      return false;
    }
  }, [isDownloaded, refreshUserData]);

  // Get download progress for a sermon
  const getDownloadProgress = useCallback((sermonId: number): number => {
    return downloadProgress[sermonId] || 0;
  }, [downloadProgress]);

  // Check if download is in progress
  const isDownloading = useCallback((sermonId: number): boolean => {
    return sermonId in downloadProgress;
  }, [downloadProgress]);

  // Clear all downloads
  const clearAllDownloads = useCallback(async (): Promise<boolean> => {
    try {
      return new Promise((resolve) => {
        Alert.alert(
          'Clear All Downloads',
          'Remove all downloaded sermons from offline storage?',
          [
            { 
              text: 'Cancel', 
              style: 'cancel',
              onPress: () => resolve(false)
            },
            { 
              text: 'Clear All',
              style: 'destructive',
              onPress: async () => {
                try {
                  // TODO: Delete all actual files from local storage
                  const userData = await LocalStorageService.getUserData();
                  userData.downloadedAudio = [];
                  await LocalStorageService.saveUserData(userData);
                  await refreshUserData();
                  Alert.alert('Cleared', 'All downloads removed from offline storage.');
                  resolve(true);
                } catch (error) {
                  console.error('Failed to clear downloads:', error);
                  Alert.alert('Error', 'Failed to clear downloads.');
                  resolve(false);
                }
              }
            }
          ]
        );
      });

    } catch (error) {
      console.error('Failed to clear downloads:', error);
      return false;
    }
  }, [refreshUserData]);

  // Get total downloads count
  const getTotalDownloads = useCallback((): number => {
    return downloadedAudio.length;
  }, [downloadedAudio]);

  return {
    // State
    downloadedAudio,
    downloadProgress,
    totalDownloads: getTotalDownloads(),

    // Check functions
    isDownloaded,
    isDownloading,
    getDownloadedAudio,
    getDownloadProgress,
    getTotalDownloads,

    // Action functions
    downloadAudio,
    removeDownload,
    clearAllDownloads,
  };
};