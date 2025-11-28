import axios, { AxiosError } from 'axios';
import { WeatherService } from '../../services/WeatherService';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>,

  // Mock axios.isAxiosError
  mockIsAxiosError = axios.isAxiosError as jest.MockedFunction<typeof axios.isAxiosError>;

describe('WeatherService', () => {
  let weatherService: WeatherService;

  beforeEach(() => {
    weatherService = WeatherService.getInstance();
    jest.clearAllMocks();
    // Reset axios.isAxiosError to default behavior
    mockIsAxiosError.mockImplementation((payload: any): payload is AxiosError => {
      return payload && payload.isAxiosError === true;
    });
  });

  describe('Singleton Pattern', () => {
    it('returns the same instance on multiple calls', () => {
      const instance1 = WeatherService.getInstance(),
        instance2 = WeatherService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('fetchWeatherData', () => {
    const mockAddress = '15528 E Golden Eagle Blvd, Fountain Hills, AZ 85268';

    it('should successfully fetch weather data and coordinates', async () => {
      const mockResponse = {
        data: {
          location: {
            name: 'Fountain Hills',
            lat: '33.609',
            lon: '-111.729',
          },
          current: {
            temperature: 75,
            weather_descriptions: ['Sunny'],
            humidity: 35,
            wind_speed: 5,
            observation_time: '05:30 PM',
            feelslike: 73,
          },
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await weatherService.fetchWeatherData(mockAddress);

      expect(result).toEqual({
        weatherData: {
          temperature: 75,
          weather_descriptions: ['Sunny'],
          humidity: 35,
          wind_speed: 5,
          observation_time: '05:30 PM',
          feelslike: 73,
        },
        lat: 33.609,
        long: -111.729,
      });

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://api.weatherstack.com/current',
        expect.objectContaining({
          params: {
            access_key: expect.any(String),
            query: mockAddress,
          },
          timeout: 15000,
        }),
      );
    });

    it('should throw error on invalid API response (missing location)', async () => {
      const mockResponse = {
        data: {
          current: {
            temperature: 75,
          },
          // Missing location
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      await expect(weatherService.fetchWeatherData(mockAddress)).rejects.toThrow(
        'Invalid response from Weatherstack API',
      );
    });

    it('should throw error on invalid API response (missing current)', async () => {
      const mockResponse = {
        data: {
          location: {
            name: 'Test',
            lat: '0',
            lon: '0',
          },
          // Missing current
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      await expect(weatherService.fetchWeatherData(mockAddress)).rejects.toThrow(
        'Invalid response from Weatherstack API',
      );
    });

    it('should retry on timeout and eventually succeed', async () => {
      const mockResponse = {
        data: {
          location: {
            name: 'Fountain Hills',
            lat: '33.609',
            lon: '-111.729',
          },
          current: {
            temperature: 75,
            weather_descriptions: ['Sunny'],
            humidity: 35,
            wind_speed: 5,
            observation_time: '05:30 PM',
            feelslike: 73,
          },
        },
      };

      // First call fails with timeout
      mockedAxios.get
        .mockRejectedValueOnce({
          isAxiosError: true,
          message: 'timeout of 15000ms exceeded',
        })
        // Second call succeeds
        .mockResolvedValueOnce(mockResponse);

      const result = await weatherService.fetchWeatherData(mockAddress);

      expect(result.lat).toBe(33.609);
      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    });

    it('should not retry on 4xx client errors', async () => {
      const error = {
        isAxiosError: true,
        message: 'Request failed with status code 401',
        response: {
          status: 401,
          data: { error: 'Invalid API key' },
        },
      };

      mockedAxios.get.mockRejectedValueOnce(error);

      await expect(weatherService.fetchWeatherData(mockAddress)).rejects.toThrow(
        'Failed to fetch weather data',
      );

      // Should only call once (no retries on 4xx)
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });

    it('should fail after max retries on persistent errors', async () => {
      const error = {
        isAxiosError: true,
        message: 'Network error',
        response: {
          status: 500,
        },
      };

      // Fail all 3 attempts
      mockedAxios.get
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error);

      await expect(weatherService.fetchWeatherData(mockAddress)).rejects.toThrow(
        'Failed to fetch weather data after 3 attempts',
      );

      expect(mockedAxios.get).toHaveBeenCalledTimes(3);
    });
  });
});
