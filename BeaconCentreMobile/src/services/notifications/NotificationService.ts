// src/services/notifications/NotificationService.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import LocalStorageService from '@/services/storage/LocalStorage';
import { NotificationBehavior } from 'expo-notifications';

class NotificationService {
  private static instance: NotificationService;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async initialize(): Promise<void> {
    // Configure notification handling
    Notifications.setNotificationHandler({
      handleNotification: async (): Promise<NotificationBehavior> => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    // Request permissions
    await this.requestPermissions();

    // Schedule daily devotional reminder
    await this.scheduleDailyDevotionalReminder();
  }

  async requestPermissions(): Promise<boolean> {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#41BBAC',
      });
    }

    if (Device.isDevice) {
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
      
      token = (await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      })).data;
    } else {
      console.log('Must use physical device for Push Notifications');
      return false;
    }

    // Save token for backend analytics (optional)
    if (token) {
      console.log('Push token:', token);
      // You can send this to your backend for targeted notifications
    }

    return true;
  }

  async scheduleDailyDevotionalReminder(): Promise<void> {
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
        data: { type: 'daily_devotional' },
      },
      trigger: null,
    });

    // Schedule weekly sermon reminder
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'New Sermons Available! 🎵',
        body: 'Check out the latest video and audio sermons from The Beacon Centre.',
        data: { type: 'weekly_sermons' },
      },
      trigger: null,
    });
  }

  async scheduleStreakCelebration(streakDays: number): Promise<void> {
    const userData = await LocalStorageService.getUserData();
    
    if (!userData.appSettings.notifications || streakDays < 7) {
      return;
    }

    let title: string;
    let body: string;

    if (streakDays === 7) {
      title = 'One Week Streak! 🔥';
      body = "Congratulations! You've read devotionals for 7 days straight!";
    } else if (streakDays === 30) {
      title = 'One Month Streak! 🏆';
      body = 'Amazing! A whole month of daily devotional reading!';
    } else if (streakDays === 100) {
      title = '100 Day Streak! 🎉';
      body = 'Incredible dedication! 100 days of spiritual growth!';
    } else if (streakDays % 365 === 0) {
      const years = streakDays / 365;
      title = `${years} Year${years > 1 ? 's' : ''} Streak! 🌟`;
      body = `Phenomenal! ${years} year${years > 1 ? 's' : ''} of consistent devotional reading!`;
    } else {
      return; // Don't notify for other milestones
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { type: 'streak_celebration', days: streakDays },
      },
      trigger: null,
    });
  }

  async scheduleNewContentNotification(contentType: 'devotional' | 'video' | 'audio' | 'announcement', title: string): Promise<void> {
    const userData = await LocalStorageService.getUserData();
    
    if (!userData.appSettings.notifications) {
      return;
    }

    let notificationTitle: string;
    let notificationBody: string;

    switch (contentType) {
      case 'devotional':
        notificationTitle = 'New Devotional Available! 📖';
        notificationBody = `"${title}" is now available to read.`;
        break;
      case 'video':
        notificationTitle = 'New Video Sermon! 🎥';
        notificationBody = `Watch "${title}" now.`;
        break;
      case 'audio':
        notificationTitle = 'New Audio Sermon! 🎵';
        notificationBody = `Listen to "${title}" now.`;
        break;
      case 'announcement':
        notificationTitle = 'Church Announcement! 📢';
        notificationBody = title;
        break;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: notificationTitle,
        body: notificationBody,
        data: { type: 'new_content', contentType },
      },
      trigger: null,
    });
  }

  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  async handleNotificationResponse(response: Notifications.NotificationResponse): Promise<void> {
    const data = response.notification.request.content.data;
    
    // Handle different notification types
    switch (data.type) {
      case 'daily_devotional':
        // Navigate to devotional screen
        // You'll need to implement deep linking here
        break;
      case 'weekly_sermons':
        // Navigate to sermons screen
        break;
      case 'new_content':
        // Navigate to specific content
        break;
      case 'streak_celebration':
        // Show celebration modal or navigate to profile
        break;
    }
  }
}

export default NotificationService;