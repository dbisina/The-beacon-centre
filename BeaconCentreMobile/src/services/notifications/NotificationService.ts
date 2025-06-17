// src/services/notifications/NotificationService.ts - FIXED FOR EXPO NOTIFICATIONS
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import LocalStorageService from '@/services/storage/LocalStorage';

class NotificationService {
  private static instance: NotificationService;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async initialize(): Promise<void> {
    // FIXED: Use new notification behavior API
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,  // FIXED: New API
        shouldShowList: true,    // FIXED: New API
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    // Only request permissions on physical devices
    if (Device.isDevice) {
      await this.requestPermissions();
      await this.scheduleDailyDevotionalReminder();
    } else {
      console.log('Must use physical device for Push Notifications');
    }
  }

  async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#41BBAC',
          description: 'Default notification channel for The Beacon Centre',
        });

        // Create specific channels for different notification types
        await Notifications.setNotificationChannelAsync('devotional', {
          name: 'Daily Devotionals',
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 200, 200, 200],
          lightColor: '#41BBAC',
          description: 'Daily devotional reminders',
        });

        await Notifications.setNotificationChannelAsync('sermons', {
          name: 'New Sermons',
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 100, 100, 100],
          lightColor: '#41BBAC',
          description: 'New sermon notifications',
        });

        await Notifications.setNotificationChannelAsync('announcements', {
          name: 'Church Announcements',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 300, 300, 300],
          lightColor: '#41BBAC',
          description: 'Important church announcements',
        });
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return false;
      }

      // Get push token (only works in development builds, not Expo Go)
      try {
        const projectId = Constants.expoConfig?.extra?.eas?.projectId;
        if (projectId) {
          const token = await Notifications.getExpoPushTokenAsync({ projectId });
          console.log('Push token obtained:', token.data);
          // You can send this token to your backend for targeted notifications
        }
      } catch (tokenError) {
        console.log('Push token not available in Expo Go. Use development build for push notifications.');
      }

      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  async scheduleDailyDevotionalReminder(): Promise<void> {
    try {
      const userData = await LocalStorageService.getUserData();
      
      if (!userData.appSettings.notifications) {
        return;
      }

      // Cancel existing notifications
      await Notifications.cancelAllScheduledNotificationsAsync();

      // Schedule daily reminder at 7 AM
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Daily Devotional Ready! 📖',
          body: "Start your day with God's Word. Your daily devotional is waiting for you.",
          data: { 
            type: 'daily_devotional',
            screen: 'DevotionalHome'
          },
        },
        trigger: {
          hour: 7,
          minute: 0,
          repeats: true,
          type: 'daily',
        },
      });

      console.log('Daily devotional reminder scheduled');
    } catch (error) {
      console.error('Error scheduling daily reminder:', error);
    }
  }

  async scheduleStreakCelebration(days: number): Promise<void> {
    try {
      let title = '';
      let body = '';
      
      if (days === 7) {
        title = '🎉 7-Day Reading Streak!';
        body = 'Amazing! You\'ve read devotionals for a full week. Keep it up!';
      } else if (days === 30) {
        title = '🏆 30-Day Reading Streak!';
        body = 'Incredible! A full month of daily devotions. You\'re building a strong spiritual habit!';
      } else if (days === 100) {
        title = '👑 100-Day Reading Streak!';
        body = 'Phenomenal! 100 days of consistent devotional reading. You\'re a spiritual champion!';
      } else {
        title = `🔥 ${days}-Day Streak!`;
        body = `Congratulations on ${days} consecutive days of devotional reading!`;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { 
            type: 'streak_celebration',
            days,
            screen: 'DevotionalHome'
          },
        },
        trigger: null, // Immediate notification
      });
    } catch (error) {
      console.error('Error scheduling streak celebration:', error);
    }
  }

  async scheduleNewContentNotification(
    contentType: 'devotional' | 'video' | 'audio' | 'announcement',
    title: string
  ): Promise<void> {
    try {
      let notificationTitle = '';
      let notificationBody = '';
      let channelId = 'default';

      switch (contentType) {
        case 'devotional':
          notificationTitle = 'New Devotional Available! 📖';
          notificationBody = `"${title}" is now available to read.`;
          channelId = 'devotional';
          break;
        case 'video':
          notificationTitle = 'New Video Sermon! 🎥';
          notificationBody = `Watch "${title}" now.`;
          channelId = 'sermons';
          break;
        case 'audio':
          notificationTitle = 'New Audio Sermon! 🎵';
          notificationBody = `Listen to "${title}" now.`;
          channelId = 'sermons';
          break;
        case 'announcement':
          notificationTitle = 'Church Announcement! 📢';
          notificationBody = title;
          channelId = 'announcements';
          break;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: notificationTitle,
          body: notificationBody,
          data: { 
            type: 'new_content', 
            contentType,
            screen: contentType === 'devotional' ? 'DevotionalHome' : 'SermonsHome'
          },
        },
        trigger: null, // Immediate notification
      });
    } catch (error) {
      console.error('Error scheduling new content notification:', error);
    }
  }

  async scheduleWeeklySermonReminder(): Promise<void> {
    try {
      const userData = await LocalStorageService.getUserData();
      
      if (!userData.appSettings.notifications) {
        return;
      }

      // Schedule weekly reminder on Sundays at 9 AM
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'New Sermons Available! 🎙️',
          body: 'Check out the latest video and audio sermons from The Beacon Centre.',
          data: { 
            type: 'weekly_sermons',
            screen: 'SermonsHome'
          },
        },
        trigger: {
          seconds: 1,
          repeats: true,
          type: 'timeInterval'
        },
      });
    } catch (error) {
      console.error('Error scheduling weekly sermon reminder:', error);
    }
  }

  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('All notifications cancelled');
    } catch (error) {
      console.error('Error cancelling notifications:', error);
    }
  }

  async handleNotificationResponse(response: Notifications.NotificationResponse): Promise<void> {
    const data = response.notification.request.content.data;
    
    console.log('Notification response received:', data);
    
    // You can implement deep linking here to navigate to specific screens
    // For now, we'll just log the response
    switch (data.type) {
      case 'daily_devotional':
        console.log('Navigate to devotional screen');
        break;
      case 'weekly_sermons':
        console.log('Navigate to sermons screen');
        break;
      case 'new_content':
        console.log(`Navigate to ${data.contentType} content`);
        break;
      case 'streak_celebration':
        console.log('Show streak celebration');
        break;
    }
  }

  async sendTestNotification(): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Test Notification 🧪',
          body: 'This is a test notification from The Beacon Centre app.',
          data: { type: 'test' },
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
    }
  }
}

export default NotificationService;