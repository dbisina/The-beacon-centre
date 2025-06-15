// src/hooks/useOfflineSync.ts
import { useState, useEffect } from 'react';
import { useOffline } from '@/context/OfflineContext';
import { devotionalsApi } from '@/services/api/devotionals';
import { sermonsApi } from '@/services/api/sermons';
import { announcementsApi } from '@/services/api/announcements';
import LocalStorageService from '@/services/storage/LocalStorage';

export const useOfflineSync = () => {
  const { isOnline } = useOffline();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  useEffect(() => {
    if (isOnline) {
      syncWhenOnline();
    }
  }, [isOnline]);

  const syncWhenOnline = async () => {
    if (isSyncing) return;

    setIsSyncing(true);
    try {
      // Sync devotionals
      const devotionals = await devotionalsApi.getAll();
      await LocalStorageService.cacheData('devotionals', devotionals);

      // Sync today's devotional
      const todaysDevotional = await devotionalsApi.getToday();
      await LocalStorageService.cacheData('todays_devotional', todaysDevotional);

      // Sync sermons
      const [videoSermons, audioSermons] = await Promise.all([
        sermonsApi.video.getAll(),
        sermonsApi.audio.getAll(),
      ]);
      
      await LocalStorageService.cacheData('video_sermons', videoSermons);
      await LocalStorageService.cacheData('audio_sermons', audioSermons);

      // Sync announcements
      const announcements = await announcementsApi.getAll();
      await LocalStorageService.cacheData('announcements', announcements);

      setLastSyncTime(new Date());
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const forceSyncNow = async () => {
    await syncWhenOnline();
  };

  return {
    isSyncing,
    lastSyncTime,
    forceSyncNow,
  };
};