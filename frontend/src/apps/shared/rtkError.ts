interface RtkErrorData {
  message?: string;
  error?: string;
}

export function getRtkErrorMessage(error: unknown, fallback: string): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'data' in error &&
    typeof (error as { data: unknown }).data === 'object' &&
    (error as { data: unknown }).data !== null
  ) {
    const data = (error as { data: RtkErrorData }).data;
    return data.error || data.message || fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}