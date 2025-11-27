import { PropertyService } from '../services/PropertyService';
import { CreatePropertyInput, PropertyFilter, PropertySort } from '../types/property.types';
import logger from '../utils/logger';
import GraphQLJSON from 'graphql-type-json';

/**
 * GraphQL Resolvers
 * Handles all GraphQL queries and mutations
 */
export class PropertyResolvers {
  private propertyService: PropertyService;

  constructor(propertyService: PropertyService = new PropertyService()) {
    this.propertyService = propertyService;
  }

  /**
   * Get root value object with all resolvers
   */
  getRootValue() {
    return {
      // Custom scalar resolver for JSON type
      JSON: GraphQLJSON,

      // Queries
      properties: async ({
        filter,
        sort,
      }: {
        filter?: PropertyFilter;
        sort?: PropertySort;
      }) => {
        try {
          logger.info('Query: properties', { filter, sort });
          return await this.propertyService.getAllProperties(filter, sort);
        } catch (error) {
          logger.error('Error in properties query', { error });
          throw error;
        }
      },

      property: async ({ id }: { id: string }) => {
        try {
          logger.info(`Query: property by ID ${id}`);
          return await this.propertyService.getPropertyById(id);
        } catch (error) {
          logger.error(`Error in property query for ID ${id}`, { error });
          throw error;
        }
      },

      // Mutations
      createProperty: async ({ input }: { input: CreatePropertyInput }) => {
        try {
          logger.info('Mutation: createProperty', { input });
          return await this.propertyService.createProperty(input);
        } catch (error) {
          logger.error('Error in createProperty mutation', { error });
          throw error;
        }
      },

      deleteProperty: async ({ id }: { id: string }) => {
        try {
          logger.info(`Mutation: deleteProperty with ID ${id}`);
          return await this.propertyService.deleteProperty(id);
        } catch (error) {
          logger.error(`Error in deleteProperty mutation for ID ${id}`, { error });
          throw error;
        }
      },
    };
  }
}
