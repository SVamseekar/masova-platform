/**
 * Push Notification Service
 *
 * Handles browser push notifications for schedule reminders and other alerts.
 * Requests permission, manages subscriptions, and displays notifications.
 */

interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  requireInteraction?: boolean;
  silent?: boolean;
}

class PushNotificationService {
  private static instance: PushNotificationService;
  private permissionGranted: boolean = false;

  private constructor() {
    this.checkPermission();
  }

  public static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  /**
   * Check if browser supports notifications
   */
  public isSupported(): boolean {
    return 'Notification' in window;
  }

  /**
   * Check current permission status
   */
  private checkPermission(): void {
    if (this.isSupported()) {
      this.permissionGranted = Notification.permission === 'granted';
    }
  }

  /**
   * Request notification permission from user
   */
  public async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) {
      console.warn('Push notifications are not supported in this browser');
      return false;
    }

    if (this.permissionGranted) {
      return true;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permissionGranted = permission === 'granted';
      return this.permissionGranted;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Get current permission status
   */
  public getPermissionStatus(): NotificationPermission | 'unsupported' {
    if (!this.isSupported()) {
      return 'unsupported';
    }
    return Notification.permission;
  }

  /**
   * Show a notification
   */
  public async showNotification(options: NotificationOptions): Promise<Notification | null> {
    if (!this.isSupported()) {
      console.warn('Notifications not supported');
      return null;
    }

    if (!this.permissionGranted) {
      const granted = await this.requestPermission();
      if (!granted) {
        console.warn('Notification permission not granted');
        return null;
      }
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/logo192.png',
        badge: options.badge || '/logo192.png',
        tag: options.tag,
        data: options.data,
        requireInteraction: options.requireInteraction ?? false,
        silent: options.silent ?? false,
      });

      // Handle notification click
      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();

        // Navigate to specific page if URL provided in data
        if (options.data?.url) {
          window.location.href = options.data.url;
        }

        notification.close();
      };

      return notification;
    } catch (error) {
      console.error('Error showing notification:', error);
      return null;
    }
  }

  /**
   * Show schedule reminder notification
   */
  public async showScheduleReminder(nextWeekStart: string): Promise<void> {
    const weekStartDate = new Date(nextWeekStart);
    const formattedDate = weekStartDate.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });

    await this.showNotification({
      title: '📅 Schedule Reminder',
      body: `Time to create next week's schedule for the week of ${formattedDate}`,
      tag: 'schedule-reminder',
      requireInteraction: true,
      data: {
        url: '/manager/staff-scheduling',
        type: 'schedule-reminder',
      },
    });
  }

  /**
   * Show shift reminder notification for staff
   */
  public async showShiftReminder(shiftDetails: {
    date: string;
    startTime: string;
    type: string;
  }): Promise<void> {
    const shiftDate = new Date(shiftDetails.date);
    const formattedDate = shiftDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });

    await this.showNotification({
      title: '⏰ Upcoming Shift',
      body: `You have a ${shiftDetails.type} shift on ${formattedDate} at ${shiftDetails.startTime}`,
      tag: `shift-reminder-${shiftDetails.date}`,
      data: {
        url: '/staff/profile',
        type: 'shift-reminder',
      },
    });
  }

  /**
   * Schedule weekly reminder notifications
   * This should be called when manager logs in on Thursday-Sunday
   */
  public scheduleWeeklyReminder(nextMondayDate: string): void {
    // Check if it's Thursday (4), Friday (5), Saturday (6), or Sunday (0)
    const today = new Date();
    const dayOfWeek = today.getDay();

    if (dayOfWeek === 0 || dayOfWeek >= 4) {
      // Show reminder on Thursday at 9 AM if we haven't already
      const reminderKey = `schedule-reminder-${nextMondayDate}`;
      const hasShownReminder = localStorage.getItem(reminderKey);

      if (!hasShownReminder) {
        // Show notification immediately if it's the right time
        const currentHour = today.getHours();
        if (currentHour >= 9) {
          this.showScheduleReminder(nextMondayDate);
          localStorage.setItem(reminderKey, 'shown');
        } else {
          // Schedule for 9 AM if it's earlier
          const timeUntil9AM = (9 - currentHour) * 60 * 60 * 1000;
          setTimeout(() => {
            this.showScheduleReminder(nextMondayDate);
            localStorage.setItem(reminderKey, 'shown');
          }, timeUntil9AM);
        }
      }
    }
  }

  /**
   * Clear old reminder flags from localStorage
   */
  public clearOldReminders(): void {
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('schedule-reminder-')) {
        const dateStr = key.replace('schedule-reminder-', '');
        const reminderDate = new Date(dateStr);
        const today = new Date();

        // Remove if more than 14 days old
        const daysDiff = (today.getTime() - reminderDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysDiff > 14) {
          keysToRemove.push(key);
        }
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
  }
}

// Export singleton instance
export const pushNotificationService = PushNotificationService.getInstance();

// Export types
export type { NotificationOptions };
