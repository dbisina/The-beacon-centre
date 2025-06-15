// src/hooks/useAnnouncementModal.ts
import { useState, useCallback } from 'react';
import { Announcement } from '@/types/api';

export const useAnnouncementModal = () => {
  const [visible, setVisible] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  const showModal = useCallback((announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setVisible(true);
  }, []);

  const hideModal = useCallback(() => {
    setVisible(false);
    // Delay clearing the announcement to allow exit animation
    setTimeout(() => {
      setSelectedAnnouncement(null);
    }, 300);
  }, []);

  return {
    visible,
    announcement: selectedAnnouncement,
    showModal,
    hideModal,
  };
};