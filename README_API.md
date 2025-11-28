# Weather App - Property Management Backend

Professional GraphQL API for managing property records with integrated weather data from Weatherstack API.

## 🏗️ Architecture

### Layered Architecture (Clean Code Principles)

```
src/
├── entities/           # TypeORM entities (Database models)
│   └── Property.ts
├── repositories/       # Repository Pattern (Data access layer)
│   └── PropertyRepository.ts
├── services/          # Business logic layer
│   ├── PropertyService.ts
│   └── WeatherService.ts (Singleton)
├── resolvers/         # GraphQL resolvers layer
│   └── PropertyResolvers.ts
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
- **Factory Pattern**: Property object creation
- **Dependency Injection**: Services injected for testability

### SOLID Principles

- **Single Responsibility**: Each class has one clear purpose
- **Dependency Inversion**: High-level modules depend on abstractions
- **Interface Segregation**: Clean interfaces for services

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

# Weatherstack API
WEATHERSTACK_API_KEY=your_api_key_here

# Application
PORT=4000
NODE_ENV=development
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

### Queries

- `properties(filter, sort)` - Get all properties with optional filtering/sorting
- `property(id)` - Get single property by ID

### Mutations

- `createProperty(input)` - Create new property (fetches weather data)
- `deleteProperty(id)` - Delete property by ID

### Examples

See [GRAPHQL_EXAMPLES.md](./GRAPHQL_EXAMPLES.md) for detailed query examples.

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
✅ Structured error handling and logging  
✅ Graceful shutdown handlers  
✅ TypeScript for type safety  
✅ Connection pooling via TypeORM  

## 📝 Logging

Uses **winston** for structured logging:

- Info: Normal operations
- Error: Failures with stack traces
- Warn: Warnings and edge cases

## 🧪 Testing

## 🧪 Testing

Comprehensive automated test suite covering business logic, API integration, and error handling.

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (auto-rerun on changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Test Coverage

**Test Suites**: 3 passed  
**Total Tests**: 40 passed

| File | Coverage |
|------|----------|
| **WeatherService.ts** | 100% statements, branches, functions, lines |
| **PropertyService.ts** | 95.23% statements, 100% functions |
| **PropertyResolvers.ts** | Full GraphQL API coverage |

### Test Scenarios

#### WeatherService Tests (7 tests)
- ✅ Returns single shared instance
- ✅ Successful weather data fetch with coordinates
- ✅ Invalid API response handling
- ✅ Timeout recovery with retry logic (3 attempts, exponential backoff)
- ✅ 4xx client error handling (no retry)
- ✅ Max retries failure after persistent errors

#### PropertyService Tests (14 tests)
- ✅ Property creation with weather data integration
- ✅ Input validation (state format, zip code format, required fields)
- ✅ **Weather API failure abortion** (Requirement #4 - property not created if weather fetch fails)
- ✅ Property retrieval (all, by ID, with filtering/sorting)
- ✅ Property deletion (successful, not found scenarios)
- ✅ Error handling for database operations

#### PropertyResolvers Tests (19 tests)
- ✅ Query all properties (filtering by city, state, zipCode)
- ✅ Query all properties (sorting ascending/descending)
- ✅ Query all properties (combined filters and sorting)
- ✅ Query single property by ID with weather data and coordinates
- ✅ Create property mutation with automatic weather fetch
- ✅ Validation errors (state format, zipCode format, required fields)
- ✅ Delete property mutation (success and error cases)
- ✅ GraphQL error handling

### Key Test Features

- **Mocked Dependencies**: axios, repositories isolated for unit testing
- **GraphQL API Coverage**: All queries and mutations tested with realistic scenarios
- **Retry Logic Validation**: Confirms 3-attempt retry with exponential backoff (1s, 2s delays)
- **Error Path Coverage**: Tests 4xx no-retry, 5xx retry behavior
- **Requirement Validation**: Explicit test for "abort operation on weather failure" (Requirement #4)
- **Self-Documenting Tests**: Clean, readable test names without redundant comments

### Integration Tests (TODO)

GraphQL integration tests with test database.

## 📦 Dependencies

### Production
- `express` - Web framework
- `graphql` & `express-graphql` - GraphQL server
- `typeorm` - ORM for PostgreSQL
- `pg` - PostgreSQL driver
- `class-validator` - Input validation
- `axios` - HTTP client for Weatherstack API
- `winston` - Logging
- `dotenv` - Environment variables

### Development
- `typescript` - Type safety
- `ts-node` - Run TypeScript directly
- `nodemon` - Auto-restart on changes
- `jest` & `ts-jest` - Testing framework
- `@types/jest` - Jest TypeScript definitions
- `supertest` - HTTP assertions for API testing

## 🛠️ Scripts

```json
{
  "dev": "nodemon src/index.ts",
  "build": "tsc",
  "start": "node dist/index.js",
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage"
}
```

## 🌐 API Endpoints

- **GraphQL**: `http://localhost:4000/graphql`
- **Health Check**: `http://localhost:4000/health`

## 📚 Further Improvements

- [ ] Add update property mutation
- [ ] Implement pagination for properties query
- [ ] Add authentication/authorization
- [ ] Add GraphQL integration tests with test database
- [ ] Add database migrations for production
- [ ] Implement caching layer (Redis)
- [ ] Add rate limiting for API
- [ ] Docker containerization

## 📄 License

MIT
