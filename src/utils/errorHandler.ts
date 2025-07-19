import { getErrorMessage } from './error';

/**
 * Higher-level error handler that wraps service methods
 * Eliminates redundant catch blocks in services
 */
export const withErrorHandling = <T extends any[], R>(fn: (...args: T) => Promise<R>, actionName: string) => {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      throw new Error(`Failed to ${actionName}: ${getErrorMessage(error, 'Unknown error')}`);
    }
  };
};

/**
 * Service method decorator for automatic error handling
 */
export const handleErrors = (actionName: string) => {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      try {
        return await method.apply(this, args);
      } catch (error) {
        throw new Error(`Failed to ${actionName}: ${getErrorMessage(error, 'Unknown error')}`);
      }
    };
  };
};
