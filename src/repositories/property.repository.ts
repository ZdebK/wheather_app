import { Repository, SelectQueryBuilder, DataSource } from 'typeorm';
import { AppDataSource } from '../data-source';
import { Property } from '../entities/property.entity';
import { IPropertyFilter, IPropertySort, SortOrder } from '../types/property.types';
import logger from '../utils/logger';
import { HandleErrors } from '../decorators/error-handler';

/**
 * PropertyRepository - Repository Pattern
 * Encapsulates database operations for Property entity
 */
export class PropertyRepository {
  private repository: Repository<Property>;

  constructor(dataSource: DataSource = AppDataSource) {
    this.repository = dataSource.getRepository(Property);
  }

  /**
   * Create and save a new property
   */
  @HandleErrors
  async create(propertyData: Partial<Property>): Promise<Property> {
    const property = this.repository.create(propertyData),
      savedProperty = await this.repository.save(property);
    logger.info(`Property created: ${savedProperty.id}`);
    return savedProperty;
  }

  /**
   * Find all properties with optional filtering and sorting
   */
  @HandleErrors
  async findAll(filter?: IPropertyFilter, sort?: IPropertySort): Promise<Property[]> {
    let queryBuilder = this.repository.createQueryBuilder('property');
    queryBuilder = this.applyFilters(queryBuilder, filter);
    queryBuilder = this.applySorting(queryBuilder, sort);

    const properties = await queryBuilder.getMany();
    return properties;
  }

  /**
   * Apply filters to query builder
   */
  private applyFilters(
    queryBuilder: SelectQueryBuilder<Property>,
    filter?: IPropertyFilter,
  ): SelectQueryBuilder<Property> {
    if (!filter) {
      return queryBuilder;
    }

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
  private applySorting(
    queryBuilder: SelectQueryBuilder<Property>,
    sort?: IPropertySort,
  ): SelectQueryBuilder<Property> {
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
    return property;
  }

  /**
   * Delete a property by ID
   */
  @HandleErrors
  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id),
      deleted = (result.affected ?? 0) > 0;
    return deleted;
  }
}
