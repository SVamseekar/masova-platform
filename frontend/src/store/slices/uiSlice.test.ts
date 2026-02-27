import { describe, it, expect } from 'vitest';
import uiReducer, {
  setLoading,
  toggleSidebar,
  setSidebarOpen,
  setTheme,
  addNotification,
  removeNotification,
  clearNotifications,
} from './uiSlice';

describe('uiSlice', () => {
  const initialState = {
    loading: false,
    sidebarOpen: false,
    theme: 'light' as const,
    notifications: [],
  };

  describe('initial state', () => {
    it('has the correct initial state', () => {
      const state = uiReducer(undefined, { type: 'unknown' });
      expect(state).toEqual(initialState);
    });
  });

  describe('setLoading', () => {
    it('sets loading to true', () => {
      const state = uiReducer(initialState, setLoading(true));
      expect(state.loading).toBe(true);
    });

    it('sets loading to false', () => {
      const loadingState = { ...initialState, loading: true };
      const state = uiReducer(loadingState, setLoading(false));
      expect(state.loading).toBe(false);
    });
  });

  describe('toggleSidebar', () => {
    it('toggles sidebar from closed to open', () => {
      const state = uiReducer(initialState, toggleSidebar());
      expect(state.sidebarOpen).toBe(true);
    });

    it('toggles sidebar from open to closed', () => {
      const openState = { ...initialState, sidebarOpen: true };
      const state = uiReducer(openState, toggleSidebar());
      expect(state.sidebarOpen).toBe(false);
    });
  });

  describe('setSidebarOpen', () => {
    it('sets sidebar to open', () => {
      const state = uiReducer(initialState, setSidebarOpen(true));
      expect(state.sidebarOpen).toBe(true);
    });

    it('sets sidebar to closed', () => {
      const state = uiReducer(initialState, setSidebarOpen(false));
      expect(state.sidebarOpen).toBe(false);
    });
  });

  describe('setTheme', () => {
    it('sets theme to dark', () => {
      const state = uiReducer(initialState, setTheme('dark'));
      expect(state.theme).toBe('dark');
    });

    it('sets theme to light', () => {
      const darkState = { ...initialState, theme: 'dark' as const };
      const state = uiReducer(darkState, setTheme('light'));
      expect(state.theme).toBe('light');
    });
  });

  describe('addNotification', () => {
    it('adds a notification with auto-generated id and timestamp', () => {
      const state = uiReducer(
        initialState,
        addNotification({ type: 'success', message: 'Item saved' })
      );

      expect(state.notifications).toHaveLength(1);
      expect(state.notifications[0].type).toBe('success');
      expect(state.notifications[0].message).toBe('Item saved');
      expect(state.notifications[0].id).toBeDefined();
      expect(state.notifications[0].timestamp).toBeDefined();
    });

    it('appends multiple notifications', () => {
      let state = uiReducer(
        initialState,
        addNotification({ type: 'success', message: 'First' })
      );
      state = uiReducer(
        state,
        addNotification({ type: 'error', message: 'Second' })
      );

      expect(state.notifications).toHaveLength(2);
    });
  });

  describe('removeNotification', () => {
    it('removes a notification by id', () => {
      const stateWithNotification = {
        ...initialState,
        notifications: [
          { id: 'n1', type: 'success' as const, message: 'Test', timestamp: '' },
          { id: 'n2', type: 'error' as const, message: 'Error', timestamp: '' },
        ],
      };

      const state = uiReducer(stateWithNotification, removeNotification('n1'));
      expect(state.notifications).toHaveLength(1);
      expect(state.notifications[0].id).toBe('n2');
    });

    it('does nothing for non-existent id', () => {
      const stateWithNotification = {
        ...initialState,
        notifications: [
          { id: 'n1', type: 'info' as const, message: 'Test', timestamp: '' },
        ],
      };

      const state = uiReducer(stateWithNotification, removeNotification('nonexistent'));
      expect(state.notifications).toHaveLength(1);
    });
  });

  describe('clearNotifications', () => {
    it('removes all notifications', () => {
      const stateWithNotifications = {
        ...initialState,
        notifications: [
          { id: 'n1', type: 'success' as const, message: 'A', timestamp: '' },
          { id: 'n2', type: 'error' as const, message: 'B', timestamp: '' },
        ],
      };

      const state = uiReducer(stateWithNotifications, clearNotifications());
      expect(state.notifications).toHaveLength(0);
    });
  });
});
