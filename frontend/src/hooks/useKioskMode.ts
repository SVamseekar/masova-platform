import { useEffect, useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../store/slices/authSlice';
import API_CONFIG from '../config/api.config';

/**
 * Kiosk Mode Hook
 *
 * Handles automatic authentication for kiosk terminals.
 *
 * Kiosk mode is enabled when:
 * 1. URL has ?kiosk=true parameter, OR
 * 2. localStorage has kioskMode=true flag
 *
 * When kiosk mode is detected:
 * 1. Retrieve kiosk token from localStorage
 * 2. Attempt auto-login with kiosk token
 * 3. If successful, set auth state
 * 4. If token expired/invalid, clear kiosk mode and redirect to login
 */

interface KioskConfig {
  isKioskMode: boolean;
  kioskToken: string | null;
  terminalId: string | null;
}

const STORAGE_KEYS = {
  KIOSK_MODE: 'masova_kioskMode',
  KIOSK_TOKEN: 'masova_kioskToken',
  KIOSK_REFRESH_TOKEN: 'masova_kioskRefreshToken',
  TERMINAL_ID: 'masova_terminalId',
} as const;

/** True when the URL has ?kiosk=true or this device was set up as a kiosk. */
function isKioskModeRequested(): boolean {
  const urlKioskMode = new URLSearchParams(window.location.search).get('kiosk') === 'true';
  const storageKioskMode = localStorage.getItem(STORAGE_KEYS.KIOSK_MODE) === 'true';
  return urlKioskMode || storageKioskMode;
}

export const useKioskMode = () => {
  const dispatch = useDispatch();
  const [kioskConfig, setKioskConfig] = useState<KioskConfig>({
    isKioskMode: false,
    kioskToken: null,
    terminalId: null,
  });
  // Loading only applies to a kiosk terminal. Elsewhere it starts false, so the first paint
  // never shows the full-screen loader over a page that arrived already rendered.
  const [isLoading, setIsLoading] = useState(isKioskModeRequested);
  const [error, setError] = useState<string | null>(null);

  /**
   * Enable kiosk mode with tokens
   */
  const enableKioskMode = useCallback((
    accessToken: string,
    refreshToken: string,
    terminalId: string
  ) => {
    console.log('[KioskMode] Enabling kiosk mode for terminal:', terminalId);

    localStorage.setItem(STORAGE_KEYS.KIOSK_MODE, 'true');
    localStorage.setItem(STORAGE_KEYS.KIOSK_TOKEN, accessToken);
    localStorage.setItem(STORAGE_KEYS.KIOSK_REFRESH_TOKEN, refreshToken);
    localStorage.setItem(STORAGE_KEYS.TERMINAL_ID, terminalId);

    setKioskConfig({
      isKioskMode: true,
      kioskToken: accessToken,
      terminalId,
    });
  }, []);

  /**
   * Disable kiosk mode and clear tokens
   */
  const disableKioskMode = useCallback(() => {
    console.log('[KioskMode] Disabling kiosk mode');

    localStorage.removeItem(STORAGE_KEYS.KIOSK_MODE);
    localStorage.removeItem(STORAGE_KEYS.KIOSK_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.KIOSK_REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.TERMINAL_ID);

    setKioskConfig({
      isKioskMode: false,
      kioskToken: null,
      terminalId: null,
    });
  }, []);

  /**
   * Perform kiosk auto-login
   */
  const performKioskAutoLogin = useCallback(async (token: string) => {
    try {
      console.log('[KioskMode] Performing auto-login...');

      const response = await fetch(`${API_CONFIG.BASE_URL}/users/kiosk/auto-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ kioskToken: token }),
      });

      if (!response.ok) {
        throw new Error('Kiosk auto-login failed');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Auto-login failed');
      }

      // Check if tokens were refreshed
      if (data.tokensRefreshed) {
        console.log('[KioskMode] Tokens refreshed, updating storage');
        localStorage.setItem(STORAGE_KEYS.KIOSK_TOKEN, data.accessToken);
        localStorage.setItem(STORAGE_KEYS.KIOSK_REFRESH_TOKEN, data.refreshToken);
      }

      // Update Redux auth state
      dispatch(loginSuccess({
        accessToken: data.tokensRefreshed ? data.accessToken : token,
        refreshToken: data.tokensRefreshed ? data.refreshToken :
                      localStorage.getItem(STORAGE_KEYS.KIOSK_REFRESH_TOKEN) || '',
        user: data.user,
        rememberMe: true, // Always remember kiosk sessions
      }));

      console.log('[KioskMode] Auto-login successful');
      setError(null);

      return true;
    } catch (err) {
      console.error('[KioskMode] Auto-login failed:', err);
      setError(err instanceof Error ? err.message : 'Auto-login failed');

      // Clear invalid kiosk configuration
      disableKioskMode();

      return false;
    }
  }, [dispatch, disableKioskMode]);

  /**
   * Initialize kiosk mode on mount
   */
  useEffect(() => {
    const initializeKioskMode = async () => {
      const isKiosk = isKioskModeRequested();

      if (!isKiosk) {
        setIsLoading(false);
        return;
      }

      // finally: a failed auto-login must not leave the full-screen loader up for good.
      try {
        setIsLoading(true);
        const token = localStorage.getItem(STORAGE_KEYS.KIOSK_TOKEN);
        const terminalId = localStorage.getItem(STORAGE_KEYS.TERMINAL_ID);

        if (token && terminalId) {
          console.log('[KioskMode] Detected kiosk mode, attempting auto-login');
          await performKioskAutoLogin(token);

          setKioskConfig({
            isKioskMode: true,
            kioskToken: token,
            terminalId,
          });
        } else {
          console.warn('[KioskMode] Kiosk mode enabled but missing token or terminal ID');
          disableKioskMode();
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeKioskMode();
  }, [performKioskAutoLogin, disableKioskMode]);

  return {
    isKioskMode: kioskConfig.isKioskMode,
    kioskToken: kioskConfig.kioskToken,
    terminalId: kioskConfig.terminalId,
    isLoading,
    error,
    enableKioskMode,
    disableKioskMode,
  };
};
