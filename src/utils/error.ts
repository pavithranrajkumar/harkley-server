/**
 * Extract error message from various error types
 */
export const getErrorMessage = (error: unknown, fallback: string = 'An error occurred'): string => {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }

  return fallback;
};
