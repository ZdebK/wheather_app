import { buildSchema } from 'graphql';

/**
 * GraphQL Schema Definition
 */
export const schema = buildSchema(`
  """
  JSON scalar type for flexible weather data storage
  """
  scalar JSON

  """
  Property type representing a real estate property
  """
  type Property {
    id: ID!
    street: String!
    city: String!
    state: String!
    zipCode: String!
    weatherData: JSON
    lat: Float
    long: Float
    createdAt: String!
  }

  """
  Input for creating a new property
  """
  input CreatePropertyInput {
    street: String!
    city: String!
    state: String!
    zipCode: String!
  }

  """
  Filter input for querying properties
  """
  input PropertyFilter {
    city: String
    state: String
    zipCode: String
  }

  """
  Sort order enum
  """
  enum SortOrder {
    ASC
    DESC
  }

  """
  Sort input for properties
  """
  input PropertySort {
    createdAt: SortOrder
  }

  """
  Root Query type
  """
  type Query {
    """
    Get all properties with optional filtering and sorting
    """
    properties(filter: PropertyFilter, sort: PropertySort): [Property!]!

    """
    Get a single property by ID
    """
    property(id: ID!): Property!
  }

  """
  Root Mutation type
  """
  type Mutation {
    """
    Create a new property (fetches weather data during creation)
    """
    createProperty(input: CreatePropertyInput!): Property!

    """
    Delete a property by ID
    """
    deleteProperty(id: ID!): Boolean!
  }
`);
