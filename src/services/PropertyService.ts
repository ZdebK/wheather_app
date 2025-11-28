import { validate } from 'class-validator';
import { Property } from '../entities/Property';
import { PropertyRepository } from '../repositories/PropertyRepository';
import { WeatherService, IWeatherService } from './WeatherService';
import { CreatePropertyInput, IPropertyFilter, IPropertySort } from '../types/property.types';
import { HandleErrors } from '../decorators/error-handler';
import { ValidationError, NotFoundError } from '../errors/custom-errors';

/**
 * PropertyService interface - defines contract for property operations
 */
export interface IPropertyService {
  createProperty(input: CreatePropertyInput): Promise<Property>;
  getAllProperties(filter?: IPropertyFilter, sort?: IPropertySort): Promise<Property[]>;
  getPropertyById(id: string): Promise<Property>;
  deleteProperty(id: string): Promise<boolean>;
}

/**
 * PropertyService - Business Logic Layer
 * Uses @HandleErrors decorator for automatic error handling and logging
 */
export class PropertyService implements IPropertyService {
  private propertyRepository: PropertyRepository;
  private weatherService: IWeatherService;

  constructor(
    propertyRepository: PropertyRepository = new PropertyRepository(),
    weatherService: IWeatherService = WeatherService.getInstance(),
  ) {
    this.propertyRepository = propertyRepository;
    this.weatherService = weatherService;
  }

  @HandleErrors
  async createProperty(input: CreatePropertyInput): Promise<Property> {
    await this.validate(input);

    const fullAddress = this.buildFullAddress(input),
      { weatherData, lat, long } = await this.weatherService.fetchWeatherData(fullAddress),

      propertyData = this.buildPropertyData(input, weatherData, lat, long);
    return await this.propertyRepository.create(propertyData);
  }

  /**
   * Validate input using class-validator - DRY principle
   */
  private async validate(input: CreatePropertyInput): Promise<void> {
    const inputInstance = Object.assign(new CreatePropertyInput(), input),
      errors = await validate(inputInstance);

    if (errors.length > 0) {
      const errorMessages = errors
        .map((err) => Object.values(err.constraints || {}).join(', '))
        .join('; ');
      throw new ValidationError(`Validation failed: ${errorMessages}`, errors);
    }
  }

  /**
   * Build full address string - DRY principle
   */
  private buildFullAddress(input: CreatePropertyInput): string {
    return `${input.street}, ${input.city}, ${input.state} ${input.zipCode}`;
  }

  /**
   * Build property data object - DRY principle
   */
  private buildPropertyData(
    input: CreatePropertyInput,
    weatherData: any,
    lat: number,
    long: number,
  ): Partial<Property> {
    return {
      street: input.street,
      city: input.city,
      state: input.state,
      zipCode: input.zipCode,
      weatherData,
      lat,
      long,
    };
  }

  @HandleErrors
  async getAllProperties(filter?: IPropertyFilter, sort?: IPropertySort): Promise<Property[]> {
    return await this.propertyRepository.findAll(filter, sort);
  }

  @HandleErrors
  async getPropertyById(id: string): Promise<Property> {
    const property = await this.propertyRepository.findById(id);
    if (!property) {
      throw new NotFoundError(`Property with ID ${id} not found`);
    }
    return property;
  }

  @HandleErrors
  async deleteProperty(id: string): Promise<boolean> {
    const deleted = await this.propertyRepository.delete(id);
    if (!deleted) {
      throw new NotFoundError(`Property with ID ${id} not found`);
    }
    return deleted;
  }
}
