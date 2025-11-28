import { Repository } from 'typeorm';
import { AppDataSource } from '../data-source';
import { Property } from '../entities/Property';
import { PropertyFilter, PropertySort, SortOrder } from '../types/property.types';
import logger from '../utils/logger';

/**
 * PropertyRepository - Repository Pattern
 * Encapsulates database operations for Property entity
 */
export class PropertyRepository {
  private repository: Repository<Property>;

  constructor() {
    this.repository = AppDataSource.getRepository(Property);
  }

  /**
   * Create and save a new property
   */
  async create(propertyData: Partial<Property>): Promise<Property> {
    try {
      const property = this.repository.create(propertyData);
      const savedProperty = await this.repository.save(property);
      logger.info(`Property created with ID: ${savedProperty.id}`);
      return savedProperty;
    } catch (error) {
      logger.error('Error creating property', { error });
      throw error;
    }
  }

  /**
   * Find all properties with optional filtering and sorting
   */
  async findAll(filter?: PropertyFilter, sort?: PropertySort): Promise<Property[]> {
    try {
      let queryBuilder = this.repository.createQueryBuilder('property');
      queryBuilder = this.applyFilters(queryBuilder, filter);
      queryBuilder = this.applySorting(queryBuilder, sort);

      const properties = await queryBuilder.getMany();
      logger.info(`Found ${properties.length} properties`);
      return properties;
    } catch (error) {
      logger.error('Error finding properties', { error });
      throw error;
    }
  }

  /**
   * Apply filters to query builder
   */
  private applyFilters(queryBuilder: any, filter?: PropertyFilter): any {
    if (!filter) return queryBuilder;

    if (filter.city) {
      queryBuilder.andWhere('property.city = :city', { city: filter.city });
    }
    if (filter.state) {
      queryBuilder.andWhere('property.state = :state', { state: filter.state });
    }
    if (filter.zipCode) {
      queryBuilder.andWhere('property.zipCode = :zipCode', { zipCode: filter.zipCode });
    }

    return queryBuilder;
  }

  /**
   * Apply sorting to query builder
   */
  private applySorting(queryBuilder: any, sort?: PropertySort): any {
    if (sort?.createdAt) {
      queryBuilder.orderBy('property.createdAt', sort.createdAt);
    } else {
      queryBuilder.orderBy('property.createdAt', SortOrder.DESC);
    }

    return queryBuilder;
  }

  /**
   * Find a single property by ID
   */
  async findById(id: string): Promise<Property | null> {
    try {
      const property = await this.repository.findOne({ where: { id } });
      if (property) {
        logger.info(`Property found with ID: ${id}`);
      } else {
        logger.warn(`Property not found with ID: ${id}`);
      }
      return property;
    } catch (error) {
      logger.error(`Error finding property by ID: ${id}`, { error });
      throw error;
    }
  }

  /**
   * Delete a property by ID
   */
  async delete(id: string): Promise<boolean> {
    try {
      const result = await this.repository.delete(id);
      const deleted = (result.affected ?? 0) > 0;
      if (deleted) {
        logger.info(`Property deleted with ID: ${id}`);
      } else {
        logger.warn(`No property found to delete with ID: ${id}`);
      }
      return deleted;
    } catch (error) {
      logger.error(`Error deleting property with ID: ${id}`, { error });
      throw error;
    }
  }
}
