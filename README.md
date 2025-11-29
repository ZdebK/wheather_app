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

### VS Code Debugging
- Auto-open browser uses `APP_PROTOCOL`, `APP_HOST`, `PORT` in logs; update `.env` if deploying behind HTTPS.

- Use "Launch GraphQL Server (TS)" to run with ts-node and breakpoints.
- Or use "Start Dev (Nodemon + Inspect)" for auto-reload + debugger.
- The browser opens automatically at `http://localhost:4000/graphql` in these launch configs.

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

**Status**: 0 errors, 23 warnings (only 'any' type usage)

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

Comprehensive coverage across services, resolvers, and repository.

### Test Scenarios

#### WeatherService Tests (7 tests)
- ✅ singleton pattern - returns single shared instance
- ✅ fetchWeatherData - successful weather data fetch with coordinates
- ✅ fetchWeatherData - invalid API response handling
- ✅ fetchWeatherData - timeout recovery with retry logic (3 attempts, exponential backoff)
- ✅ fetchWeatherData - 4xx client error handling (no retry)
- ✅ fetchWeatherData - max retries failure after persistent errors

#### PropertyService Tests (14 tests)
- ✅ createProperty - property creation with weather data integration
- ✅ createProperty - input validation (state format, zip code format, required fields)
- ✅ createProperty - **weather API failure abortion** (Requirement #4 - property not created if weather fetch fails)
- ✅ getAllProperties - property retrieval with filtering/sorting
- ✅ getPropertyById - property retrieval by ID
- ✅ deleteProperty - property deletion (successful, not found scenarios)
- ✅ error handling for database operations

#### PropertyResolvers Tests (19 tests)
- ✅ query: properties - filtering by city, state, zipCode
- ✅ query: properties - sorting ascending/descending
- ✅ query: properties - combined filters and sorting
- ✅ query: property by ID - with weather data and coordinates
- ✅ mutation: createProperty - automatic weather fetch
- ✅ mutation: createProperty - validation errors (state format, zipCode format, required fields)
- ✅ mutation: deleteProperty - success and error cases
- ✅ GraphQL error handling

### Key Test Features

- **Clean Output**: All Winston logs silenced in test environment (NODE_ENV=test)
- **Mocked Dependencies**: axios, repositories isolated for unit testing
- **GraphQL API Coverage**: All queries and mutations tested with realistic scenarios
- **Retry Logic Validation**: Confirms 3-attempt retry with exponential backoff (1s, 2s delays)
- **Error Path Coverage**: Tests 4xx no-retry, 5xx retry behavior
- **Requirement Validation**: Explicit test for "abort operation on weather failure" (Requirement #4)
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
