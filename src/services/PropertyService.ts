import { validate } from 'class-validator';
import { Property } from '../entities/Property';
import { PropertyRepository } from '../repositories/PropertyRepository';
import { WeatherService } from './WeatherService';
import { CreatePropertyInput, PropertyFilter, PropertySort } from '../types/property.types';
import logger from '../utils/logger';

/**
 * PropertyService - Business Logic Layer
 * Dependency Injection: Injects WeatherService and PropertyRepository
 */
export class PropertyService {
  private propertyRepository: PropertyRepository;
  private weatherService: WeatherService;

  constructor(
    propertyRepository: PropertyRepository = new PropertyRepository(),
    weatherService: WeatherService = WeatherService.getInstance()
  ) {
    this.propertyRepository = propertyRepository;
    this.weatherService = weatherService;
  }

  /**
   * Create a new property with weather data
   * Calls Weatherstack API to fetch weather and coordinates
   */
  async createProperty(input: CreatePropertyInput): Promise<Property> {
    // Validate input
    const inputInstance = Object.assign(new CreatePropertyInput(), input);
    const errors = await validate(inputInstance);

    if (errors.length > 0) {
      const errorMessages = errors
        .map((err) => Object.values(err.constraints || {}).join(', '))
        .join('; ');
      logger.error('Validation failed for property creation', { errors: errorMessages });
      throw new Error(`Validation failed: ${errorMessages}`);
    }

    try {
      // Construct full address for weather API
      const fullAddress = `${input.street}, ${input.city}, ${input.state} ${input.zipCode}`;

      // Fetch weather data and coordinates (API call only during creation)
      const { weatherData, lat, long } = await this.weatherService.fetchWeatherData(fullAddress);

      // Create property object (Factory Pattern)
      const propertyData: Partial<Property> = {
        street: input.street,
        city: input.city,
        state: input.state,
        zipCode: input.zipCode,
        weatherData,
        lat,
        long,
      };

      // Save to database
      const property = await this.propertyRepository.create(propertyData);
      logger.info(`Property created successfully`, { id: property.id });

      return property;
    } catch (error) {
      logger.error('Error creating property', { error });
      throw error;
    }
  }

  /**
   * Get all properties with optional filters and sorting
   */
  async getAllProperties(filter?: PropertyFilter, sort?: PropertySort): Promise<Property[]> {
    try {
      return await this.propertyRepository.findAll(filter, sort);
    } catch (error) {
      logger.error('Error retrieving properties', { error });
      throw error;
    }
  }

  /**
   * Get a single property by ID
   */
  async getPropertyById(id: string): Promise<Property> {
    try {
      const property = await this.propertyRepository.findById(id);
      if (!property) {
        throw new Error(`Property with ID ${id} not found`);
      }
      return property;
    } catch (error) {
      logger.error(`Error retrieving property by ID: ${id}`, { error });
      throw error;
    }
  }

  /**
   * Delete a property by ID
   */
  async deleteProperty(id: string): Promise<boolean> {
    try {
      const deleted = await this.propertyRepository.delete(id);
      if (!deleted) {
        throw new Error(`Property with ID ${id} not found`);
      }
      return deleted;
    } catch (error) {
      logger.error(`Error deleting property with ID: ${id}`, { error });
      throw error;
    }
  }
}
