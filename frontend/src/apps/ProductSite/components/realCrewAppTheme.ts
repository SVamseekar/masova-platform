// Exact values from MaSoVaCrewApp/src/styles/driverDesignTokens.ts.
// Role accent colors are a Hard Rule in root CLAUDE.md — never change these hex values.
export const realCrewApp = {
  bg: '#FFFFFF',
  bgAlt: '#F6F6F6',
  surface: '#FFFFFF',
  surfaceMuted: '#FAFAFA',
  border: '#E8E8E8',
  borderDark: '#D0D0D0',
  text1: '#000000',
  text2: '#5E5E5E',
  text3: '#8E8E8E',
  roles: {
    driver: '#00B14F',
    kitchen: '#FF6B35',
    kiosk: '#2196F3',
    manager: '#7B1FA2',
  },
  success: '#00B14F',
  successBg: '#E8F5E9',
  warning: '#FFA726',
  warningBg: '#FFF3E0',
  error: '#F44336',
  errorBg: '#FFEBEE',
  radiusMd: 10,
  radiusLg: 16,
} as const
