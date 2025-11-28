import axios from 'axios';
import { WeatherstackResponse, WeatherData } from '../types/weather.types';
import { HandleErrors } from '../decorators/error-handler';
import { WeatherAPIError } from '../errors/custom-errors';
import logger from '../utils/logger';

/**
 * WeatherService interface - defines contract for weather operations
 */
export interface IWeatherService {
  fetchWeatherData(address: string): Promise<{
    weatherData: WeatherData;
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
    this.apiKey = process.env.WEATHERSTACK_API_KEY || '';
    if (!this.apiKey) {
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
    weatherData: WeatherData;
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
      this.maxRetries
    );
  }

  private async makeAPIRequest(address: string, attempt: number): Promise<WeatherstackResponse> {
    logger.info(`Fetching weather data for address: ${address} (attempt ${attempt}/${this.maxRetries})`);

    const response = await axios.get<WeatherstackResponse>(this.baseUrl, {
      params: {
        access_key: this.apiKey,
        query: address,
      },
      timeout: this.timeout,
    });

    if (!response.data.location || !response.data.current) {
      throw new WeatherAPIError('Invalid response from Weatherstack API');
    }

    return response.data;
  }

  private parseResponse(response: WeatherstackResponse) {
    const { location, current } = response;

    const weatherData: WeatherData = {
      temperature: current.temperature,
      weather_descriptions: current.weather_descriptions,
      humidity: current.humidity,
      wind_speed: current.wind_speed,
      observation_time: current.observation_time,
      feelslike: current.feelslike,
    };

    const lat = parseFloat(location.lat);
    const long = parseFloat(location.lon);

    logger.info(`Weather data fetched successfully for ${location.name}`, { lat, long });

    return { weatherData, lat, long };
  }

  private shouldStopRetrying(error: unknown, attempt: number): boolean {
    if (!axios.isAxiosError(error)) {
      logger.error('Unexpected error fetching weather data', { error });
      return true;
    }

    logger.warn(`Weatherstack API attempt ${attempt} failed`, {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    // Don't retry on 4xx client errors
    if (error.response && error.response.status >= 400 && error.response.status < 500) {
      throw new WeatherAPIError(
        `Failed to fetch weather data: ${error.message}`,
        error.response.status
      );
    }

    return false;
  }

  private async waitBeforeRetry(attempt: number): Promise<void> {
    const waitTime = 1000 * attempt; // 1s, 2s, 3s
    logger.info(`Waiting ${waitTime}ms before retry...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
}
