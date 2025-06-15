// src/hooks/useNotifications.ts
import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import NotificationService from '@/services/notifications/NotificationService';

export const useNotifications = () => {
  useEffect(() => {
    const notificationService = NotificationService.getInstance();
    
    // Initialize notifications
    notificationService.initialize();

    // Handle notification responses
    const subscription = Notifications.addNotificationResponseReceivedListener(
      notificationService.handleNotificationResponse
    );

    return () => subscription.remove();
  }, []);

  return {
    scheduleStreakCelebration: (days: number) => 
      NotificationService.getInstance().scheduleStreakCelebration(days),
    scheduleNewContentNotification: (type: any, title: string) =>
      NotificationService.getInstance().scheduleNewContentNotification(type, title),
  };
};