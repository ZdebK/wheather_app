import { Repository } from 'typeorm';
import { AppDataSource } from '../data-source';
import { Property } from '../entities/Property';
import { PropertyFilter, PropertySort, SortOrder } from '../types/property.types';
import logger from '../utils/logger';
import { HandleErrors } from '../decorators/error-handler';

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
  @HandleErrors
  async create(propertyData: Partial<Property>): Promise<Property> {
    const property = this.repository.create(propertyData);
    const savedProperty = await this.repository.save(property);
    this.logPropertyAction('created', savedProperty.id);
    return savedProperty;
  }

  /**
   * Find all properties with optional filtering and sorting
   */
  @HandleErrors
  async findAll(filter?: PropertyFilter, sort?: PropertySort): Promise<Property[]> {
    let queryBuilder = this.repository.createQueryBuilder('property');
    queryBuilder = this.applyFilters(queryBuilder, filter);
    queryBuilder = this.applySorting(queryBuilder, sort);

    const properties = await queryBuilder.getMany();
    logger.info(`Found ${properties.length} properties`);
    return properties;
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
  @HandleErrors
  async findById(id: string): Promise<Property | null> {
    const property = await this.repository.findOne({ where: { id } });
    if (property) {
      this.logPropertyAction('found', id);
    } else {
      logger.warn(`Property not found with ID: ${id}`);
    }
    return property;
  }

  /**
   * Delete a property by ID
   */
  @HandleErrors
  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    const deleted = (result.affected ?? 0) > 0;
    if (deleted) {
      this.logPropertyAction('deleted', id);
    } else {
      logger.warn(`No property found to delete with ID: ${id}`);
    }
    return deleted;
  }

  /**
   * Helper to log property actions - DRY principle
   */
  private logPropertyAction(action: 'created' | 'found' | 'deleted', id: string): void {
    logger.info(`Property ${action} with ID: ${id}`);
  }
}
