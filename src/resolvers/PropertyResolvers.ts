import { PropertyService } from '../services/PropertyService';
import { CreatePropertyInput, PropertyFilter, PropertySort } from '../types/property.types';
import GraphQLJSON from 'graphql-type-json';

/**
 * GraphQL Resolvers
 * Clean resolver layer - only delegates to services
 * Error handling and logging managed by @HandleErrors decorator in services
 */
export class PropertyResolvers {
  private propertyService: PropertyService;

  constructor(propertyService: PropertyService = new PropertyService()) {
    this.propertyService = propertyService;
  }

  getRootValue() {
    return {
      JSON: GraphQLJSON,

      properties: ({ filter, sort }: { filter?: PropertyFilter; sort?: PropertySort }) =>
        this.propertyService.getAllProperties(filter, sort),

      property: ({ id }: { id: string }) =>
        this.propertyService.getPropertyById(id),

      createProperty: ({ input }: { input: CreatePropertyInput }) =>
        this.propertyService.createProperty(input),

      deleteProperty: ({ id }: { id: string }) =>
        this.propertyService.deleteProperty(id),
    };
  }
}
