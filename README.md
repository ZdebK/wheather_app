# Weather App - Property Management Backend

Professional GraphQL API for managing property records with integrated weather data from Weatherstack API.

## 🏗️ Architecture

### Layered Architecture (Clean Code Principles)

```
src/
├── entities/           # TypeORM entities (Database models)
│   └── property.entity.ts
├── repositories/       # Repository Pattern (Data access layer)
│   └── property.repository.ts
├── services/          # Business logic layer
│   ├── property.service.ts
│   └── weather.service.ts (Singleton)
├── resolvers/         # GraphQL resolvers layer
│   └── property.resolvers.ts
├── decorators/        # Method decorators
│   └── error-handler.ts (@HandleErrors)
├── errors/            # Custom error classes
│   └── custom-errors.ts
├── graphql/          # GraphQL schema definitions
│   └── schema.ts
├── types/            # TypeScript interfaces & DTOs
│   ├── property.types.ts
│   └── weather.types.ts
├── utils/            # Utilities (Logger, etc.)
│   └── logger.ts
├── data-source.ts    # TypeORM configuration
└── index.ts          # Application entry point
```

### Design Patterns Used

- **Repository Pattern**: Encapsulates database operations
- **Singleton Pattern**: WeatherService instance management
- **Decorator Pattern**: @HandleErrors for centralized error handling and logging
- **Dependency Injection**: Services injected for testability
- **Custom Error Classes**: Type-safe error handling (ValidationError, NotFoundError, WeatherAPIError, DatabaseError)

### SOLID Principles

- **Single Responsibility**: Each class has one clear purpose (max 20-30 lines per function)
- **Open/Closed**: Extensible via decorators and interfaces
- **Dependency Inversion**: Services depend on interfaces (IPropertyService, IWeatherService)
- **Interface Segregation**: Clean, focused interfaces with I-prefix naming convention

## 🚀 Getting Started

### Prerequisites

- Node.js (v16+)
- PostgreSQL database (local or AWS RDS)
- Weatherstack API key ([Get one here](https://weatherstack.com/))

### Installation

```bash
npm install
```

### Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Update environment variables in `.env`:
```env
# PostgreSQL
DB_HOST=your-database.region.rds.amazonaws.com
DB_PORT=5432
DB_NAME=weather_app_db
DB_USER=your_username
DB_PASSWORD=your_password
DB_SSL=true
DB_SCHEMA=public

# Weatherstack API
WEATHERSTACK_API_KEY=your_api_key_here

# Application
PORT=4000
APP_HOST=localhost
APP_PROTOCOL=http
NODE_ENV=development

# Simple Rate Limiting (in-memory)
RATE_LIMIT_MAX=60
RATE_LIMIT_WINDOW_MS=60000
```

### Database Setup

TypeORM will automatically create the `properties` table on first run (when `synchronize: true` in development).

**Production**: Use migrations instead of `synchronize`.

### Run Development Server

```bash
npm run dev
```

Server will start at: `http://localhost:4000/graphql`

### Build for Production

```bash
npm run build
npm start
```

## 📊 Property Data Model

| Field        | Type         | Description                                    |
|--------------|--------------|------------------------------------------------|
| id           | UUID         | Auto-generated unique identifier               |
| street       | String       | Full street address                            |
| city         | String       | City name                                      |
| state        | String (2)   | Two-letter state code (e.g., AZ)              |
| zipCode      | String (5)   | Five-digit ZIP code                           |
| weatherData  | JSON         | Weather info from Weatherstack (on creation)  |
| lat          | Decimal      | Latitude from Weatherstack                     |
| long         | Decimal      | Longitude from Weatherstack                    |
| createdAt    | Timestamp    | Auto-generated creation timestamp              |

## 🔑 GraphQL Operations

### Quick Start - Testing the API

**Step 1: Start the server**
```bash
npm run dev
```
Server will be available at: `http://localhost:4000/graphql`

**Step 2: Open GraphQL Playground**

Open your browser and navigate to `http://localhost:4000/graphql`. You'll see the GraphiQL interface.

**Step 3: Create your first property**

Paste this mutation into the left panel:

```graphql
mutation CreateProperty {
  createProperty(input: {
    street: "350 5th Ave"
    city: "New York"
    state: "NY"
    zipCode: "10118"
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

Click the "Execute" button (▶). You should get a response like:

```json
{
  "data": {
    "createProperty": {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "street": "350 5th Ave",
      "city": "New York",
      "state": "NY",
      "zipCode": "10118",
      "weatherData": {
        "temperature": 45,
        "weather_descriptions": ["Partly cloudy"],
        "humidity": 65,
        "wind_speed": 10,
        "observation_time": "02:30 PM",
        "feelslike": 42
      },
      "lat": 40.748,
      "long": -73.986,
      "createdAt": "2025-11-29T23:30:00.000Z"
    }
  }
}
```

**Step 4: Query all properties**

```graphql
query GetAllProperties {
  properties {
    id
    street
    city
    state
    weatherData
  }
}
```

Expected response:

```json
{
  "data": {
    "properties": [
      {
        "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "street": "350 5th Ave",
        "city": "New York",
        "state": "NY",
        "weatherData": {
          "temperature": 45,
          "weather_descriptions": ["Partly cloudy"],
          "humidity": 65,
          "wind_speed": 10,
          "observation_time": "02:30 PM",
          "feelslike": 42
        }
      }
    ]
  }
}
```

**Step 5: Query single property by ID**

Copy the `id` from the previous response and use it:

```graphql
query GetProperty {
  property(id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890") {
    id
    street
    city
    weatherData
    lat
    long
  }
}
```

**Step 6: Delete a property**

```graphql
mutation DeleteProperty {
  deleteProperty(id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890")
}
```

Expected response:

```json
{
  "data": {
    "deleteProperty": true
  }
}
```

### Available Operations

### Queries

- `properties(filter, sort)` - Get all properties with optional filtering/sorting
- `property(id)` - Get single property by ID

### Mutations

- `createProperty(input)` - Create new property (fetches weather data)
- `deleteProperty(id)` - Delete property by ID

### More Examples

See [GRAPHQL_EXAMPLES.md](./GRAPHQL_EXAMPLES.md) for additional query examples including:
- Filtering by city, state, zipCode
- Sorting by creation date (ASC/DESC)
- Combined filters and sorting
- Error handling examples

## 🌦️ Weather Data Integration

**Important**: Weatherstack API is called **only during property creation** (in the `createProperty` mutation). The weather data, latitude, and longitude are stored in the database, so subsequent queries do not require additional API calls.

### Weather Data Structure

```typescript
{
  temperature: number;
  weather_descriptions: string[];
  humidity: number;
  wind_speed: number;
  observation_time: string;
  feelslike: number;
}
```

## ✅ Validation

Input validation using `class-validator`:

- **street**: Required, non-empty string
- **city**: Required, non-empty string
- **state**: Exactly 2 uppercase letters (e.g., AZ)
- **zipCode**: Exactly 5 digits

## 🔒 Security & Best Practices

✅ Environment variables for sensitive data  
✅ SSL/TLS for PostgreSQL connection  
✅ Input validation with class-validator  
✅ Structured error handling with @HandleErrors decorator  
✅ Custom error classes for type safety  
✅ Structured logging with Winston (silent in tests)  
✅ Graceful shutdown handlers  
✅ TypeScript for type safety  
✅ Connection pooling via TypeORM  
✅ Interface-based architecture (I-prefix convention)  
✅ ESLint with TypeScript best practices  
✅ Kebab-case file naming convention  

## 📝 Logging

Uses **winston** for structured logging with context-aware helpers:

- **Contexts**: api, database, repository, service, graphql, error
- **Levels**: info, warn, error (with stack traces)
- **Transports**: Console + file (logs/combined.log, logs/error.log)
- **Test Environment**: Automatically silenced when NODE_ENV=test

## 🎨 Code Quality

### Clean Code Principles Applied

- **DRY (Don't Repeat Yourself)**: Eliminated duplicate code (~60 lines removed)
- **Single Responsibility**: Each function has one clear purpose
- **Short Functions**: Max 20-30 lines per function
- **No Logic in Resolvers**: Pure delegation to services
- **Centralized Error Handling**: @HandleErrors decorator replaces try-catch blocks
- **Structured Logging**: Context-based logging with minimal noise

### ESLint Configuration

Professional TypeScript rules enforced:
- `one-var: consecutive` - Grouped variable declarations
- `indent: 2` - Consistent 2-space indentation
- `quotes: single` - Single quotes for strings
- `prefer-const` - Immutability by default
- `no-var` - Modern ES6+ syntax
- `@typescript-eslint/naming-convention` - I-prefix for interfaces
- `@typescript-eslint/no-explicit-any: warn` - Type safety encouraged

## 🧪 Testing

Comprehensive automated test suite covering business logic, API integration, and error handling.

### Test File Locations

```
src/__tests__/
├── services/
│   ├── property.service.test.ts      # Property business logic tests (17 tests)
│   └── weather.service.test.ts       # Weatherstack API integration tests (8 tests)
├── resolvers/
│   └── property.resolvers.test.ts    # GraphQL resolver tests (20 tests)
└── integration/
    └── graphql-db.integration.test.ts # End-to-end DB persistence tests (2 tests)
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (auto-rerun on changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npm test -- property.service.test.ts
npm test -- weather.service.test.ts
npm test -- property.resolvers.test.ts

# Run integration tests (requires PostgreSQL)
$env:RUN_INTEGRATION_TESTS='true'; npm run test:integration
```

### Test Coverage

**Total: 47 tests passing**

#### WeatherService Tests (8 tests)
- ✅ Singleton pattern - returns the same instance on multiple calls
- ✅ Successfully fetch weather data and coordinates
- ✅ Throw error on invalid API response (missing location)
- ✅ Throw error on invalid API response (missing current)
- ✅ Reject non-USA locations
- ✅ Retry on timeout and eventually succeed
- ✅ Not retry on 4xx client errors
- ✅ Fail after max retries on persistent errors

#### PropertyService Tests (17 tests)
- ✅ createProperty - successfully create a property with weather data
- ✅ createProperty - fail validation with invalid state (not 2 letters)
- ✅ createProperty - fail validation with invalid state (lowercase)
- ✅ createProperty - fail validation with invalid zipCode (not 5 digits)
- ✅ createProperty - fail validation with invalid zipCode (contains letters)
- ✅ createProperty - fail validation with empty street
- ✅ createProperty - abort operation when weather API fails (requirement #4)
- ✅ getAllProperties - return all properties without filters
- ✅ getAllProperties - return filtered properties by city
- ✅ getAllProperties - return sorted properties
- ✅ getPropertyById - return property by ID
- ✅ getPropertyById - throw error when property not found
- ✅ getPropertyById - throw error when id is empty string
- ✅ deleteProperty - successfully delete property
- ✅ deleteProperty - throw error when property to delete not found
- ✅ deleteProperty - throw error when id is empty string
- ✅ deleteProperty - throw error when id is whitespace only

#### PropertyResolvers Tests (20 tests)
- ✅ query: properties - returns all properties without filters
- ✅ query: properties - filters by city
- ✅ query: properties - filters by state
- ✅ query: properties - filters by zipCode
- ✅ query: properties - sorts by creation date descending
- ✅ query: properties - sorts by creation date ascending
- ✅ query: properties - combines filters and sorting
- ✅ query: properties - returns empty array when no matches
- ✅ query: property by ID - returns property with all details
- ✅ query: property by ID - throws error when ID does not exist
- ✅ query: property by ID - includes weather data
- ✅ query: property by ID - includes coordinates
- ✅ mutation: createProperty - creates property with weather data automatically
- ✅ mutation: createProperty - rejects invalid state format
- ✅ mutation: createProperty - rejects invalid zipCode format
- ✅ mutation: createProperty - rejects missing required fields
- ✅ mutation: createProperty - aborts when weather API fails
- ✅ mutation: deleteProperty - deletes existing property
- ✅ mutation: deleteProperty - throws error when property does not exist
- ✅ mutation: deleteProperty - throws error when id is empty string

#### Integration Tests (2 tests)
- ✅ End-to-end GraphQL mutation → PostgreSQL persistence verification
- ✅ Prevents deletion of non-existent property (UUID validation, no DB side effects)

### Key Test Features

- **Clean Output**: All Winston logs silenced in test environment (NODE_ENV=test)
- **Mocked Dependencies**: axios, repositories isolated for unit testing
- **GraphQL API Coverage**: All queries and mutations tested with realistic scenarios
- **Retry Logic Validation**: Confirms 3-attempt retry with exponential backoff (1s, 2s delays)
- **Error Path Coverage**: Tests 4xx no-retry, 5xx retry behavior, ID validation
- **USA-Only Validation**: Rejects properties outside United States
- **Requirement Validation**: Explicit test for "abort operation on weather failure" (Requirement #4)
- **Security Tests**: Empty ID, whitespace ID, non-existent UUID validation
- **Naming Convention**: Lowercase describe blocks for consistency

### Integration Tests

PostgreSQL-backed GraphQL integration test verifies mutation → DB persistence. By default, integration tests are skipped.

Enable integration tests:

```powershell
$env:RUN_INTEGRATION_TESTS='true'; npm test
```

Run only integration tests:

```powershell
$env:RUN_INTEGRATION_TESTS='true'; npx jest src/__tests__/integration
```

Notes:
- Jest loads env and decorators globally via `setupFiles` (dotenv/config, reflect-metadata).
- Requires Postgres env vars (`.env`) and access to the DB.

## 🚦 Rate Limiting (Simple)

Lightweight per-IP rate limiting is enabled for `/graphql` using an in-memory counter (no extra deps), configurable via env:
- `RATE_LIMIT_MAX`: requests per window per IP (default 60)
- `RATE_LIMIT_WINDOW_MS`: window size in ms (default 60000)

Disabled in tests (`NODE_ENV=test`). For production-scale environments, consider a Redis-backed limiter.

## 📦 Dependencies

### Production
- `express` - Web framework
- `graphql` & `express-graphql` - GraphQL server
- `typeorm` - ORM for PostgreSQL
- `pg` - PostgreSQL driver
- `class-validator` - Input validation
- `axios` - HTTP client for Weatherstack API
- `winston` - Structured logging
- `dotenv` - Environment variables
- `reflect-metadata` - TypeScript decorators support

### Development
- `typescript` - Type safety
- `ts-node` - Run TypeScript directly
- `nodemon` - Auto-restart on changes
- `jest` & `ts-jest` - Testing framework
- `@types/jest` - Jest TypeScript definitions
- `@types/node` - Node.js TypeScript definitions
- `eslint` & `@typescript-eslint` - Code quality linting

## 🛠️ Scripts

```json
{
  "dev": "nodemon src/index.ts",
  "dev:debug": "nodemon --inspect src/index.ts",
  "build": "tsc",
  "start": "node dist/index.js",
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage",
  "lint": "eslint . --ext .ts"
}
```

## 🌐 API Endpoints

- **GraphQL**: `http://localhost:4000/graphql`
- **Health Check**: `http://localhost:4000/health`

## 📄 License

MIT
