# GraphQL Sample Queries and Mutations

## Create Property (with weather data fetch)
```graphql
mutation CreateProperty {
  createProperty(input: {
    street: "15528 E Golden Eagle Blvd"
    city: "Fountain Hills"
    state: "AZ"
    zipCode: "85268"
  }) {
    id
    street
    city
    state
    zipCode
    weatherData
    lat
    long
    createdAt
  }
}
```

## Query All Properties
```graphql
query GetAllProperties {
  properties {
    id
    street
    city
    state
    zipCode
    weatherData
    lat
    long
    createdAt
  }
}
```

## Query Properties with Sorting (newest first)
```graphql
query GetPropertiesSorted {
  properties(sort: { createdAt: DESC }) {
    id
    street
    city
    state
    createdAt
  }
}
```

## Query Properties with Filter (by city)
```graphql
query GetPropertiesByCity {
  properties(filter: { city: "Fountain Hills" }) {
    id
    street
    city
    state
    zipCode
  }
}
```

## Query Properties with Filter (by state)
```graphql
query GetPropertiesByState {
  properties(filter: { state: "AZ" }) {
    id
    street
    city
    state
  }
}
```

## Query Properties with Multiple Filters
```graphql
query GetFilteredProperties {
  properties(
    filter: { 
      city: "Fountain Hills"
      state: "AZ"
      zipCode: "85268"
    }
    sort: { createdAt: ASC }
  ) {
    id
    street
    city
    weatherData
    createdAt
  }
}
```

## Query Single Property by ID
```graphql
query GetProperty {
  property(id: "your-property-id-here") {
    id
    street
    city
    state
    zipCode
    weatherData
    lat
    long
    createdAt
  }
}
```

## Delete Property
```graphql
mutation DeleteProperty {
  deleteProperty(id: "your-property-id-here")
}
```

## Example Response for Create Property
```json
{
  "data": {
    "createProperty": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "street": "15528 E Golden Eagle Blvd",
      "city": "Fountain Hills",
      "state": "AZ",
      "zipCode": "85268",
      "weatherData": {
        "temperature": 75,
        "weather_descriptions": ["Sunny"],
        "humidity": 35,
        "wind_speed": 5,
        "observation_time": "05:30 PM",
        "feelslike": 73
      },
      "lat": 33.609,
      "long": -111.729,
      "createdAt": "2025-11-27T10:30:00.000Z"
    }
  }
}
```
