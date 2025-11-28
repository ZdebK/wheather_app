import logger from '../utils/logger';

/**
 * Method decorator that automatically handles errors and logging
 * Logs method calls at debug level, errors at error level
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

    try {
      const result = await originalMethod.apply(this, args);
      return result;
    } catch (error) {
      logger.error(`${className}.${methodName} failed`, {
        error: error instanceof Error ? error.message : String(error),
        errorName: error instanceof Error ? error.name : 'UnknownError',
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  };

  return descriptor;
}
