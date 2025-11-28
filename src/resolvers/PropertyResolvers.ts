import { PropertyService, IPropertyService } from '../services/PropertyService';
import { CreatePropertyInput, IPropertyFilter, IPropertySort } from '../types/property.types';
import GraphQLJSON from 'graphql-type-json';

/**
 * GraphQL Resolvers
 * Clean resolver layer - only delegates to services
 * Error handling and logging managed by @HandleErrors decorator in services
 */
export class PropertyResolvers {
  private propertyService: IPropertyService;

  constructor(propertyService: IPropertyService = new PropertyService()) {
    this.propertyService = propertyService;
  }

  getRootValue() {
    return {
      JSON: GraphQLJSON,

      properties: ({ filter, sort }: { filter?: IPropertyFilter; sort?: IPropertySort }) =>
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
