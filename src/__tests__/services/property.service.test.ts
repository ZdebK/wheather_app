import { PropertyService } from '../../services/property.service';
import { PropertyRepository } from '../../repositories/property.repository';
import { WeatherService } from '../../services/weather.service';
import { Property } from '../../entities/property.entity';
import { SortOrder } from '../../types/property.types';
// ValidationError and NotFoundError used in test expectations
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ValidationError, NotFoundError } from '../../errors/custom-errors';

// Mock dependencies
jest.mock('../../repositories/property.repository');
jest.mock('../../services/weather.service');

describe('PropertyService', () => {
  let propertyService: PropertyService,
    mockPropertyRepository: jest.Mocked<PropertyRepository>,
    mockWeatherService: jest.Mocked<WeatherService>;

  beforeEach(() => {
    // Create mocks
    mockPropertyRepository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      deleteById: jest.fn(),
      delete: jest.fn(),  // Add delete method
    } as any;

    mockWeatherService = {
      fetchWeatherData: jest.fn(),
    } as any;

    // Initialize service with mocks
    propertyService = new PropertyService(mockPropertyRepository, mockWeatherService);

    jest.clearAllMocks();
  });

  describe('createProperty', () => {
    const validInput = {
        street: '15528 E Golden Eagle Blvd',
        city: 'Fountain Hills',
        state: 'AZ',
        zipCode: '85268',
      },

      mockWeatherData = {
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
      },

      mockProperty: Property = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        ...validInput,
        ...mockWeatherData,
        createdAt: new Date(),
      };

    it('should successfully create a property with weather data', async () => {
      mockWeatherService.fetchWeatherData.mockResolvedValueOnce(mockWeatherData);
      mockPropertyRepository.create.mockResolvedValueOnce(mockProperty);

      const result = await propertyService.createProperty(validInput);

      expect(result).toEqual(mockProperty);
      expect(mockWeatherService.fetchWeatherData).toHaveBeenCalledWith(
        '15528 E Golden Eagle Blvd, Fountain Hills, AZ 85268',
      );
      expect(mockPropertyRepository.create).toHaveBeenCalledWith({
        street: validInput.street,
        city: validInput.city,
        state: validInput.state,
        zipCode: validInput.zipCode,
        weatherData: mockWeatherData.weatherData,
        lat: mockWeatherData.lat,
        long: mockWeatherData.long,
      });
    });

    it('should fail validation with invalid state (not 2 letters)', async () => {
      const invalidInput = { ...validInput, state: 'Arizona' };

      await expect(propertyService.createProperty(invalidInput)).rejects.toThrow(
        /Validation failed.*State must be a 2-letter abbreviation/,
      );

      expect(mockWeatherService.fetchWeatherData).not.toHaveBeenCalled();
      expect(mockPropertyRepository.create).not.toHaveBeenCalled();
    });

    it('should fail validation with invalid state (lowercase)', async () => {
      const invalidInput = { ...validInput, state: 'az' };

      await expect(propertyService.createProperty(invalidInput)).rejects.toThrow(
        /Validation failed.*State must be uppercase letters/,
      );
    });

    it('should fail validation with invalid zipCode (not 5 digits)', async () => {
      const invalidInput = { ...validInput, zipCode: '1234' };

      await expect(propertyService.createProperty(invalidInput)).rejects.toThrow(
        /Validation failed.*Zip code must be 5 digits/,
      );
    });

    it('should fail validation with invalid zipCode (contains letters)', async () => {
      const invalidInput = { ...validInput, zipCode: '8526A' };

      await expect(propertyService.createProperty(invalidInput)).rejects.toThrow(
        /Validation failed.*Zip code must contain only digits/,
      );
    });

    it('should fail validation with empty street', async () => {
      const invalidInput = { ...validInput, street: '' };

      await expect(propertyService.createProperty(invalidInput)).rejects.toThrow(
        /Validation failed.*Street is required/,
      );
    });

    it('should abort operation when weather API fails (requirement #4)', async () => {
      const weatherError = new Error('Failed to fetch weather data: timeout');
      mockWeatherService.fetchWeatherData.mockRejectedValueOnce(weatherError);

      await expect(propertyService.createProperty(validInput)).rejects.toThrow(
        'Failed to fetch weather data: timeout',
      );

      // Property should NOT be created if weather fetch fails
      expect(mockPropertyRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('getAllProperties', () => {
    it('should return all properties without filters', async () => {
      const mockProperties: Property[] = [
        {
          id: '1',
          street: 'Street 1',
          city: 'City 1',
          state: 'AZ',
          zipCode: '12345',
          weatherData: {},
          lat: 0,
          long: 0,
          createdAt: new Date(),
        },
      ];

      mockPropertyRepository.findAll.mockResolvedValueOnce(mockProperties);

      const result = await propertyService.getAllProperties();

      expect(result).toEqual(mockProperties);
      expect(mockPropertyRepository.findAll).toHaveBeenCalledWith(undefined, undefined);
    });

    it('should return filtered properties by city', async () => {
      const filter = { city: 'Fountain Hills' };
      mockPropertyRepository.findAll.mockResolvedValueOnce([]);

      await propertyService.getAllProperties(filter);

      expect(mockPropertyRepository.findAll).toHaveBeenCalledWith(filter, undefined);
    });

    it('should return sorted properties', async () => {
      const sort = { createdAt: SortOrder.DESC };
      mockPropertyRepository.findAll.mockResolvedValueOnce([]);

      await propertyService.getAllProperties(undefined, sort);

      expect(mockPropertyRepository.findAll).toHaveBeenCalledWith(undefined, sort);
    });
  });

  describe('getPropertyById', () => {
    it('should return property by ID', async () => {
      const mockProperty: Property = {
        id: 'test-id',
        street: 'Street 1',
        city: 'City 1',
        state: 'AZ',
        zipCode: '12345',
        weatherData: {},
        lat: 0,
        long: 0,
        createdAt: new Date(),
      };

      mockPropertyRepository.findById.mockResolvedValueOnce(mockProperty);

      const result = await propertyService.getPropertyById('test-id');

      expect(result).toEqual(mockProperty);
      expect(mockPropertyRepository.findById).toHaveBeenCalledWith('test-id');
    });

    it('should throw error when property not found', async () => {
      mockPropertyRepository.findById.mockResolvedValueOnce(null);

      await expect(propertyService.getPropertyById('invalid-id')).rejects.toThrow(
        'Property with ID invalid-id not found',
      );
    });

    it('should throw error when id is empty string', async () => {
      await expect(propertyService.getPropertyById('')).rejects.toThrow(
        'Property ID is required',
      );
      expect(mockPropertyRepository.findById).not.toHaveBeenCalled();
    });
  });

  describe('deleteProperty', () => {
    it('should successfully delete property', async () => {
      const existingProperty: Property = {
        id: 'test-id',
        street: '123 Test St',
        city: 'Test City',
        state: 'TC',
        zipCode: '12345',
        weatherData: {
          temperature: 20,
          weather_descriptions: ['Clear'],
          humidity: 50,
          wind_speed: 10,
          observation_time: '12:00 PM',
          feelslike: 20,
        },
        lat: 0,
        long: 0,
        createdAt: new Date(),
      };

      mockPropertyRepository.findById.mockResolvedValueOnce(existingProperty);
      mockPropertyRepository.delete.mockResolvedValueOnce(true);

      const result = await propertyService.deleteProperty('test-id');

      expect(result).toBe(true);
      expect(mockPropertyRepository.findById).toHaveBeenCalledWith('test-id');
      expect(mockPropertyRepository.delete).toHaveBeenCalledWith('test-id');
    });

    it('should throw error when property to delete not found', async () => {
      mockPropertyRepository.findById.mockResolvedValueOnce(null);

      await expect(propertyService.deleteProperty('invalid-id')).rejects.toThrow(
        'Property with ID invalid-id not found',
      );
      expect(mockPropertyRepository.delete).not.toHaveBeenCalled();
    });

    it('should throw error when id is empty string', async () => {
      await expect(propertyService.deleteProperty('')).rejects.toThrow(
        'Property ID is required',
      );
      expect(mockPropertyRepository.findById).not.toHaveBeenCalled();
      expect(mockPropertyRepository.delete).not.toHaveBeenCalled();
    });

    it('should throw error when id is whitespace only', async () => {
      await expect(propertyService.deleteProperty('   ')).rejects.toThrow(
        'Property ID is required',
      );
      expect(mockPropertyRepository.findById).not.toHaveBeenCalled();
      expect(mockPropertyRepository.delete).not.toHaveBeenCalled();
    });
  });
});
