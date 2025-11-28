import { PropertyResolvers } from '../../resolvers/PropertyResolvers';
import { PropertyService } from '../../services/PropertyService';
import { Property } from '../../entities/Property';
import { SortOrder } from '../../types/property.types';

// Mock PropertyService
jest.mock('../../services/PropertyService');

describe('PropertyResolvers - GraphQL API', () => {
  let resolvers: any;
  let mockPropertyService: jest.Mocked<PropertyService>;
  let propertyResolvers: PropertyResolvers;

  beforeEach(() => {
    // Create mock service
    mockPropertyService = {
      getAllProperties: jest.fn(),
      getPropertyById: jest.fn(),
      createProperty: jest.fn(),
      deleteProperty: jest.fn(),
    } as any;

    // Create resolver instance with mocked service
    propertyResolvers = new PropertyResolvers(mockPropertyService);
    
    // Get resolvers root object
    resolvers = propertyResolvers.getRootValue();
    
    jest.clearAllMocks();
  });

  describe('Query: properties', () => {
    const mockProperties: Property[] = [
      {
        id: '1',
        street: '123 Main St',
        city: 'Phoenix',
        state: 'AZ',
        zipCode: '85001',
        weatherData: {
          temperature: 75,
          weather_descriptions: ['Sunny'],
          humidity: 35,
          wind_speed: 5,
          observation_time: '05:30 PM',
          feelslike: 73,
        },
        lat: 33.448,
        long: -112.074,
        createdAt: new Date('2025-01-01'),
      },
      {
        id: '2',
        street: '456 Oak Ave',
        city: 'Scottsdale',
        state: 'AZ',
        zipCode: '85250',
        weatherData: {
          temperature: 78,
          weather_descriptions: ['Clear'],
          humidity: 30,
          wind_speed: 3,
          observation_time: '06:00 PM',
          feelslike: 76,
        },
        lat: 33.494,
        long: -111.926,
        createdAt: new Date('2025-01-02'),
      },
    ];

    it('returns all properties without filters', async () => {
      mockPropertyService.getAllProperties.mockResolvedValue(mockProperties);

      const result = await resolvers.properties({});

      expect(result).toEqual(mockProperties);
      expect(result).toHaveLength(2);
      expect(mockPropertyService.getAllProperties).toHaveBeenCalledWith(undefined, undefined);
    });

    it('filters by city', async () => {
      const phoenixOnly = [mockProperties[0]];
      mockPropertyService.getAllProperties.mockResolvedValue(phoenixOnly);

      const result = await resolvers.properties({ filter: { city: 'Phoenix' } });

      expect(result).toEqual(phoenixOnly);
      expect(result[0].city).toBe('Phoenix');
      expect(mockPropertyService.getAllProperties).toHaveBeenCalledWith({ city: 'Phoenix' }, undefined);
    });

    it('filters by state', async () => {
      mockPropertyService.getAllProperties.mockResolvedValue(mockProperties);

      const result = await resolvers.properties({ filter: { state: 'AZ' } });

      expect(result.every((p: Property) => p.state === 'AZ')).toBe(true);
      expect(mockPropertyService.getAllProperties).toHaveBeenCalledWith({ state: 'AZ' }, undefined);
    });

    it('filters by zipCode', async () => {
      const zipFiltered = [mockProperties[0]];
      mockPropertyService.getAllProperties.mockResolvedValue(zipFiltered);

      const result = await resolvers.properties({ filter: { zipCode: '85001' } });

      expect(result).toHaveLength(1);
      expect(result[0].zipCode).toBe('85001');
    });

    it('sorts by creation date descending', async () => {
      const sortedDesc = [mockProperties[1], mockProperties[0]];
      mockPropertyService.getAllProperties.mockResolvedValue(sortedDesc);

      const result = await resolvers.properties({ sort: { createdAt: SortOrder.DESC } });

      expect(result[0].createdAt.getTime()).toBeGreaterThan(result[1].createdAt.getTime());
    });

    it('sorts by creation date ascending', async () => {
      mockPropertyService.getAllProperties.mockResolvedValue(mockProperties);

      const result = await resolvers.properties({ sort: { createdAt: SortOrder.ASC } });

      expect(result[0].createdAt.getTime()).toBeLessThan(result[1].createdAt.getTime());
    });

    it('combines filters and sorting', async () => {
      mockPropertyService.getAllProperties.mockResolvedValue([mockProperties[0]]);

      const result = await resolvers.properties({
        filter: { city: 'Phoenix' },
        sort: { createdAt: SortOrder.DESC },
      });

      expect(mockPropertyService.getAllProperties).toHaveBeenCalledWith(
        { city: 'Phoenix' },
        { createdAt: SortOrder.DESC }
      );
      expect(result).toHaveLength(1);
    });

    it('returns empty array when no matches', async () => {
      mockPropertyService.getAllProperties.mockResolvedValue([]);

      const result = await resolvers.properties({ filter: { city: 'NonExistentCity' } });

      expect(result).toEqual([]);
    });
  });

  describe('Query: property by ID', () => {
    const mockProperty: Property = {
      id: 'abc-123',
      street: '789 Pine Rd',
      city: 'Tempe',
      state: 'AZ',
      zipCode: '85281',
      weatherData: {
        temperature: 80,
        weather_descriptions: ['Partly Cloudy'],
        humidity: 40,
        wind_speed: 7,
        observation_time: '07:00 PM',
        feelslike: 78,
      },
      lat: 33.427,
      long: -111.940,
      createdAt: new Date('2025-01-15'),
    };

    it('returns property with all details', async () => {
      mockPropertyService.getPropertyById.mockResolvedValue(mockProperty);

      const result = await resolvers.property({ id: 'abc-123' });

      expect(result).toEqual(mockProperty);
      expect(result.id).toBe('abc-123');
      expect(result.city).toBe('Tempe');
      expect(mockPropertyService.getPropertyById).toHaveBeenCalledWith('abc-123');
    });

    it('throws error when ID does not exist', async () => {
      mockPropertyService.getPropertyById.mockRejectedValue(
        new Error('Property with ID invalid-id not found')
      );

      await expect(resolvers.property({ id: 'invalid-id' })).rejects.toThrow(
        'Property with ID invalid-id not found'
      );
    });

    it('includes weather data', async () => {
      mockPropertyService.getPropertyById.mockResolvedValue(mockProperty);

      const result = await resolvers.property({ id: 'abc-123' });

      expect(result.weatherData).toBeDefined();
      expect(result.weatherData.temperature).toBe(80);
      expect(result.weatherData.weather_descriptions).toContain('Partly Cloudy');
    });

    it('includes coordinates', async () => {
      mockPropertyService.getPropertyById.mockResolvedValue(mockProperty);

      const result = await resolvers.property({ id: 'abc-123' });

      expect(result.lat).toBe(33.427);
      expect(result.long).toBe(-111.940);
    });
  });

  describe('Mutation: createProperty', () => {
    const validInput = {
      street: '15528 E Golden Eagle Blvd',
      city: 'Fountain Hills',
      state: 'AZ',
      zipCode: '85268',
    };

    const createdProperty: Property = {
      id: 'new-id-123',
      ...validInput,
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
      createdAt: new Date(),
    };

    it('creates property with weather data automatically', async () => {
      mockPropertyService.createProperty.mockResolvedValue(createdProperty);

      const result = await resolvers.createProperty({ input: validInput });

      expect(result).toEqual(createdProperty);
      expect(result.weatherData).toBeDefined();
      expect(result.weatherData.temperature).toBe(75);
      expect(mockPropertyService.createProperty).toHaveBeenCalledWith(validInput);
    });

    it('rejects invalid state format', async () => {
      const invalidInput = { ...validInput, state: 'az' };
      mockPropertyService.createProperty.mockRejectedValue(
        new Error('State must be uppercase letters (e.g., AZ)')
      );

      await expect(resolvers.createProperty({ input: invalidInput })).rejects.toThrow(
        'State must be uppercase letters'
      );
    });

    it('rejects invalid zipCode format', async () => {
      const invalidInput = { ...validInput, zipCode: 'ABCDE' };
      mockPropertyService.createProperty.mockRejectedValue(
        new Error('Zip code must contain only digits')
      );

      await expect(resolvers.createProperty({ input: invalidInput })).rejects.toThrow(
        'Zip code must contain only digits'
      );
    });

    it('rejects missing required fields', async () => {
      const invalidInput = { ...validInput, street: '' };
      mockPropertyService.createProperty.mockRejectedValue(
        new Error('Street is required')
      );

      await expect(resolvers.createProperty({ input: invalidInput })).rejects.toThrow(
        'Street is required'
      );
    });

    it('aborts when weather API fails', async () => {
      mockPropertyService.createProperty.mockRejectedValue(
        new Error('Failed to fetch weather data: timeout')
      );

      await expect(resolvers.createProperty({ input: validInput })).rejects.toThrow(
        'Failed to fetch weather data'
      );
    });
  });

  describe('Mutation: deleteProperty', () => {
    it('deletes existing property', async () => {
      mockPropertyService.deleteProperty.mockResolvedValue(true);

      const result = await resolvers.deleteProperty({ id: 'property-to-delete' });

      expect(result).toBe(true);
      expect(mockPropertyService.deleteProperty).toHaveBeenCalledWith('property-to-delete');
    });

    it('throws error when property does not exist', async () => {
      mockPropertyService.deleteProperty.mockRejectedValue(
        new Error('Property with ID invalid-id not found')
      );

      await expect(resolvers.deleteProperty({ id: 'invalid-id' })).rejects.toThrow(
        'Property with ID invalid-id not found'
      );
    });
  });
});
