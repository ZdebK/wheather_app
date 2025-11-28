import logger from '../utils/logger';

/**
 * Method decorator that automatically handles errors and logging
 * In production: logs errors with full stack traces
 * In tests: silent - no logging
 */
export function HandleErrors(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
): PropertyDescriptor {
  const originalMethod = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    const className = target.constructor.name;
    const methodName = propertyKey;
    const isTest = process.env.NODE_ENV === 'test';

    try {
      const result = await originalMethod.apply(this, args);
      return result;
    } catch (error) {
      // Only log in non-test environments
      if (!isTest) {
        logger.error(`${className}.${methodName} failed`, {
          error: error instanceof Error ? error.message : String(error),
          errorName: error instanceof Error ? error.name : 'UnknownError',
          stack: error instanceof Error ? error.stack : undefined,
        });
      }
      throw error;
    }
  };

  return descriptor;
}
