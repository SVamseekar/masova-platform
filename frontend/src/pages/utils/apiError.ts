/** Extract a user-facing message from RTK Query / fetch errors. */
export function getApiErrorMessage(err: unknown, fallback = 'An error occurred'): string {
  if (err && typeof err === 'object') {
    if ('data' in err) {
      const data = (err as { data?: { message?: string; error?: string } }).data;
      if (typeof data?.message === 'string') return data.message;
      if (typeof data?.error === 'string') return data.error;
    }
    if ('message' in err && typeof (err as { message: unknown }).message === 'string') {
      return (err as { message: string }).message;
    }
  }
  return fallback;
}