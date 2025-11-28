/**
 * Custom error classes for better error handling and type safety
 */

export class ValidationError extends Error {
  constructor(message: string, public validationErrors?: any[]) {
    super(message);
    this.name = 'ValidationError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class WeatherAPIError extends Error {
  constructor(message: string, public statusCode?: number, public attempts?: number) {
    super(message);
    this.name = 'WeatherAPIError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class DatabaseError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'DatabaseError';
    Error.captureStackTrace(this, this.constructor);
  }
}
