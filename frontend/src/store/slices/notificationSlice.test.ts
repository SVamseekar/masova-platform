import { describe, it, expect } from 'vitest';
import notificationReducer, {
  addNotification,
  markAsRead,
  markAllAsRead,
  removeNotification,
  clearAllNotifications,
} from './notificationSlice';

describe('notificationSlice', () => {
  const initialState = {
    notifications: [],
    unreadCount: 0,
  };

  describe('initial state', () => {
    it('has the correct initial state', () => {
      const state = notificationReducer(undefined, { type: 'unknown' });
      expect(state).toEqual(initialState);
    });
  });

  describe('addNotification', () => {
    it('adds a notification at the beginning of the list', () => {
      const state = notificationReducer(
        initialState,
        addNotification({ type: 'success', message: 'Order placed' })
      );

      expect(state.notifications).toHaveLength(1);
      expect(state.notifications[0].type).toBe('success');
      expect(state.notifications[0].message).toBe('Order placed');
      expect(state.notifications[0].read).toBe(false);
      expect(state.notifications[0].id).toBeDefined();
      expect(state.notifications[0].timestamp).toBeDefined();
    });

    it('increments unread count', () => {
      let state = notificationReducer(
        initialState,
        addNotification({ type: 'info', message: 'First' })
      );
      state = notificationReducer(
        state,
        addNotification({ type: 'warning', message: 'Second' })
      );

      expect(state.unreadCount).toBe(2);
    });

    it('adds with optional title and autoHide', () => {
      const state = notificationReducer(
        initialState,
        addNotification({
          type: 'success',
          message: 'Saved',
          title: 'Success',
          autoHide: true,
        })
      );

      expect(state.notifications[0].title).toBe('Success');
      expect(state.notifications[0].autoHide).toBe(true);
    });

    it('new notifications are prepended (most recent first)', () => {
      let state = notificationReducer(
        initialState,
        addNotification({ type: 'info', message: 'First' })
      );
      state = notificationReducer(
        state,
        addNotification({ type: 'info', message: 'Second' })
      );

      expect(state.notifications[0].message).toBe('Second');
      expect(state.notifications[1].message).toBe('First');
    });
  });

  describe('markAsRead', () => {
    it('marks a specific notification as read', () => {
      const stateWithNotifications = {
        notifications: [
          { id: '1', type: 'info' as const, message: 'Test', timestamp: '', read: false },
          { id: '2', type: 'info' as const, message: 'Test2', timestamp: '', read: false },
        ],
        unreadCount: 2,
      };

      const state = notificationReducer(stateWithNotifications, markAsRead('1'));

      expect(state.notifications[0].read).toBe(true);
      expect(state.notifications[1].read).toBe(false);
      expect(state.unreadCount).toBe(1);
    });

    it('does not decrement unreadCount for already-read notification', () => {
      const stateWithReadNotification = {
        notifications: [
          { id: '1', type: 'info' as const, message: 'Test', timestamp: '', read: true },
        ],
        unreadCount: 0,
      };

      const state = notificationReducer(stateWithReadNotification, markAsRead('1'));
      expect(state.unreadCount).toBe(0);
    });

    it('does not go below 0 for unreadCount', () => {
      const stateWithNotification = {
        notifications: [
          { id: '1', type: 'info' as const, message: 'Test', timestamp: '', read: false },
        ],
        unreadCount: 0,
      };

      const state = notificationReducer(stateWithNotification, markAsRead('1'));
      expect(state.unreadCount).toBe(0);
    });
  });

  describe('markAllAsRead', () => {
    it('marks all notifications as read and resets unread count', () => {
      const stateWithNotifications = {
        notifications: [
          { id: '1', type: 'info' as const, message: 'A', timestamp: '', read: false },
          { id: '2', type: 'error' as const, message: 'B', timestamp: '', read: false },
          { id: '3', type: 'success' as const, message: 'C', timestamp: '', read: true },
        ],
        unreadCount: 2,
      };

      const state = notificationReducer(stateWithNotifications, markAllAsRead());

      expect(state.notifications.every(n => n.read)).toBe(true);
      expect(state.unreadCount).toBe(0);
    });
  });

  describe('removeNotification', () => {
    it('removes a notification by id', () => {
      const stateWithNotifications = {
        notifications: [
          { id: '1', type: 'info' as const, message: 'A', timestamp: '', read: false },
          { id: '2', type: 'error' as const, message: 'B', timestamp: '', read: true },
        ],
        unreadCount: 1,
      };

      const state = notificationReducer(stateWithNotifications, removeNotification('1'));

      expect(state.notifications).toHaveLength(1);
      expect(state.notifications[0].id).toBe('2');
      expect(state.unreadCount).toBe(0);
    });

    it('does not decrement unreadCount when removing a read notification', () => {
      const stateWithReadNotification = {
        notifications: [
          { id: '1', type: 'info' as const, message: 'A', timestamp: '', read: true },
        ],
        unreadCount: 0,
      };

      const state = notificationReducer(stateWithReadNotification, removeNotification('1'));
      expect(state.unreadCount).toBe(0);
    });

    it('does nothing for non-existent id', () => {
      const stateWithNotifications = {
        notifications: [
          { id: '1', type: 'info' as const, message: 'A', timestamp: '', read: false },
        ],
        unreadCount: 1,
      };

      const state = notificationReducer(stateWithNotifications, removeNotification('999'));
      expect(state.notifications).toHaveLength(1);
      expect(state.unreadCount).toBe(1);
    });
  });

  describe('clearAllNotifications', () => {
    it('removes all notifications and resets unread count', () => {
      const stateWithNotifications = {
        notifications: [
          { id: '1', type: 'info' as const, message: 'A', timestamp: '', read: false },
          { id: '2', type: 'error' as const, message: 'B', timestamp: '', read: false },
        ],
        unreadCount: 2,
      };

      const state = notificationReducer(stateWithNotifications, clearAllNotifications());

      expect(state.notifications).toHaveLength(0);
      expect(state.unreadCount).toBe(0);
    });
  });
});
