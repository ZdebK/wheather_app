import axios from 'axios';
import { WeatherstackResponse, WeatherData } from '../types/weather.types';
import logger from '../utils/logger';

/**
 * WeatherService - Singleton pattern
 * Handles communication with Weatherstack API
 */
export class WeatherService {
  private static instance: WeatherService;
  private readonly apiKey: string;
  private readonly baseUrl = 'http://api.weatherstack.com/current';

  private constructor() {
    this.apiKey = process.env.WEATHERSTACK_API_KEY || '';
    if (!this.apiKey) {
      logger.warn('WEATHERSTACK_API_KEY not found in environment variables');
    }
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): WeatherService {
    if (!WeatherService.instance) {
      WeatherService.instance = new WeatherService();
    }
    return WeatherService.instance;
  }

  /**
   * Fetch weather data and coordinates for a given address
   * @param address Full address string (street, city, state, zipCode)
   * @returns Weather data with lat/long coordinates
   */
  public async fetchWeatherData(address: string): Promise<{
    weatherData: WeatherData;
    lat: number;
    long: number;
  }> {
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.info(`Fetching weather data for address: ${address} (attempt ${attempt}/${maxRetries})`);

        const response = await axios.get<WeatherstackResponse>(this.baseUrl, {
          params: {
            access_key: this.apiKey,
            query: address,
          },
          timeout: 15000, // 15 second timeout
        });

        if (!response.data.location || !response.data.current) {
          throw new Error('Invalid response from Weatherstack API');
        }

        const { location, current } = response.data;

        // Extract relevant weather data
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

        logger.info(`Weather data fetched successfully for ${location.name}`, {
          lat,
          long,
        });

        return {
          weatherData,
          lat,
          long,
        };
      } catch (error) {
        lastError = error as Error;
        
        if (axios.isAxiosError(error)) {
          logger.warn(`Weatherstack API attempt ${attempt} failed`, {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
          });

          // Don't retry on client errors (4xx)
          if (error.response && error.response.status >= 400 && error.response.status < 500) {
            throw new Error(`Failed to fetch weather data: ${error.message}`);
          }

          // Wait before retry (exponential backoff)
          if (attempt < maxRetries) {
            const waitTime = 1000 * attempt; // 1s, 2s, 3s
            logger.info(`Waiting ${waitTime}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
        } else {
          logger.error('Unexpected error fetching weather data', { error });
          throw error;
        }
      }
    }

    // All retries failed
    logger.error('All weather API attempts failed', { lastError });
    throw new Error(`Failed to fetch weather data after ${maxRetries} attempts: ${lastError?.message}`);
  }
}
