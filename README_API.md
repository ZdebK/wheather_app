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

### Unit Tests (TODO)

```bash
npm test
```

Test coverage for:
- Services (PropertyService, WeatherService)
- Repositories
- Validation logic

### Integration Tests (TODO)

Test GraphQL resolvers with test database.

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

## 🛠️ Scripts

```json
{
  "dev": "nodemon src/index.ts",
  "build": "tsc",
  "start": "node dist/index.js"
}
```

## 🌐 API Endpoints

- **GraphQL**: `http://localhost:4000/graphql`
- **Health Check**: `http://localhost:4000/health`

## 📚 Further Improvements

- [ ] Add update property mutation
- [ ] Implement pagination for properties query
- [ ] Add authentication/authorization
- [ ] Write unit and integration tests
- [ ] Add database migrations
- [ ] Implement caching layer (Redis)
- [ ] Add rate limiting for API
- [ ] Docker containerization

## 📄 License

MIT
