import axios from 'axios';
import { IWeatherstackResponse, IWeatherData } from '../types/weather.types';
import { HandleErrors } from '../decorators/error-handler';
import { WeatherAPIError } from '../errors/custom-errors';
import logger, { logContext } from '../utils/logger';
import { config, isTest } from '../config';

/**
 * WeatherService interface - defines contract for weather operations
 */
export interface IWeatherService {
  fetchWeatherData(address: string): Promise<{
    weatherData: IWeatherData;
    lat: number;
    long: number;
  }>;
}

/**
 * WeatherService - Singleton pattern
 * Handles communication with Weatherstack API
 */
export class WeatherService implements IWeatherService {
  private static instance: WeatherService;
  private readonly apiKey: string;
  private readonly baseUrl = 'http://api.weatherstack.com/current';
  private readonly maxRetries = 3;
  private readonly timeout = 15000;

  private constructor() {
    this.apiKey = config.weatherstack.apiKey;
    if (!this.apiKey && !isTest) {
      logger.warn('WEATHERSTACK_API_KEY not found in environment variables');
    }
  }

  public static getInstance(): WeatherService {
    if (!WeatherService.instance) {
      WeatherService.instance = new WeatherService();
    }
    return WeatherService.instance;
  }

  @HandleErrors
  async fetchWeatherData(address: string): Promise<{
    weatherData: IWeatherData;
    lat: number;
    long: number;
  }> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.makeAPIRequest(address, attempt);
        return this.parseResponse(response);
      } catch (error) {
        lastError = error as Error;

        if (this.shouldStopRetrying(error, attempt)) {
          throw error;
        }

        if (attempt < this.maxRetries) {
          await this.waitBeforeRetry(attempt);
        }
      }
    }

    throw new WeatherAPIError(
      `Failed to fetch weather data after ${this.maxRetries} attempts: ${lastError?.message}`,
      undefined,
      this.maxRetries,
    );
  }

  private async makeAPIRequest(address: string, _attempt: number): Promise<IWeatherstackResponse> {
    const response = await axios.get<IWeatherstackResponse>(this.baseUrl, {
      params: {
        access_key: this.apiKey,
        query: address,
      },
      timeout: this.timeout,
      // Security headers
      headers: {
        'User-Agent': 'WeatherApp/1.0',
        'Accept': 'application/json',
      },
      // Prevent redirect-based attacks
      maxRedirects: 0,
      // Limit response size (10MB)
      maxContentLength: 10 * 1024 * 1024,
      maxBodyLength: 10 * 1024 * 1024,
      // Validate response status strictly
      validateStatus: (status) => status === 200,
    });

    if (!response.data.location || !response.data.current) {
      throw new WeatherAPIError('Invalid response from Weatherstack API');
    }

    return response.data;
  }

  private parseResponse(response: IWeatherstackResponse) {
    const { location, current } = response,

      weatherData: IWeatherData = {
        temperature: current.temperature,
        weather_descriptions: current.weather_descriptions,
        humidity: current.humidity,
        wind_speed: current.wind_speed,
        observation_time: current.observation_time,
        feelslike: current.feelslike,
      },

      lat = parseFloat(location.lat),
      long = parseFloat(location.lon);

    return { weatherData, lat, long };
  }

  private shouldStopRetrying(error: unknown, attempt: number): boolean {
    if (!axios.isAxiosError(error)) {
      if (process.env.NODE_ENV !== 'test') {
        logContext.error('Unexpected error fetching weather data', error);
      }
      return true;
    }

    if (process.env.NODE_ENV !== 'test') {
      logger.warn(`Weatherstack API attempt ${attempt} failed`, {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
    }

    // Don't retry on 4xx client errors
    if (error.response && error.response.status >= 400 && error.response.status < 500) {
      throw new WeatherAPIError(
        `Failed to fetch weather data: ${error.message}`,
        error.response.status,
      );
    }

    return false;
  }

  private async waitBeforeRetry(attempt: number): Promise<void> {
    const waitTime = 1000 * attempt;
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
}
