import logger from '../utils/logger';

/**
 * Method decorator that automatically handles errors and logging
 * Wraps async methods with try-catch and logs method calls
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
      logger.info(`${className}.${methodName} called`, {
        args: args.length > 0 ? args : undefined,
      });

      const result = await originalMethod.apply(this, args);

      logger.info(`${className}.${methodName} succeeded`);
      return result;
    } catch (error) {
      logger.error(`${className}.${methodName} failed`, {
        error: error instanceof Error ? error.message : String(error),
        errorName: error instanceof Error ? error.name : 'UnknownError',
        stack: error instanceof Error ? error.stack : undefined,
        args: args.length > 0 ? args : undefined,
      });
      throw error;
    }
  };

  return descriptor;
}
