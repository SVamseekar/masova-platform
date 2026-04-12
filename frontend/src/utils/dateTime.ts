export const formatTime = (date: string | Date): string => {
  return new Date(date).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

/**
 * Format a date using the store's locale.
 * Falls back to en-IN (India legacy) when locale is null or undefined.
 */
export const formatDateLocale = (
  date: string | Date,
  locale: string | null | undefined
): string => {
  const activeLocale = locale ?? 'en-IN';
  return new Date(date).toLocaleDateString(activeLocale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const getElapsedTime = (startTime: string | Date): string => {
  const start = new Date(startTime).getTime();
  const now = Date.now();
  const diff = Math.floor((now - start) / 1000 / 60);
  
  if (diff < 60) {
    return `${diff}m`;
  } else {
    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;
    return `${hours}h ${minutes}m`;
  }
};