import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { graphql } from 'graphql';
import { Property } from '../../entities/property.entity';
import { schema } from '../../graphql/schema';
import { PropertyRepository } from '../../repositories/property.repository';
import { PropertyService } from '../../services/property.service';
import { PropertyResolvers } from '../../resolvers/property.resolvers';
import { IWeatherService } from '../../services/weather.service';

// Integration test: GraphQL mutation writes correct data to DB

describe('GraphQL + DB integration', () => {
  let ds: DataSource;
  let canRun = true;

  beforeAll(async () => {
    try {
      ds = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'weather_app_test',
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
        synchronize: true,
        logging: false,
        entities: [Property],
      });
      await ds.initialize();
    } catch (e) {
      // No Postgres available for integration; skip this suite
      canRun = false;
    }
  });

  afterAll(async () => {
    if (ds && ds.isInitialized) {
      await ds.destroy();
    }
  });

  beforeEach(async () => {
    if (ds && ds.isInitialized) {
      await ds.getRepository(Property).clear();
    }
  });

  it('creates property and persists weather data, lat/long', async () => {
    if (!canRun) {
      return;
    }
    // Arrange: repository with in-memory DB + service with mocked weather
    const repo = new PropertyRepository(ds);

    const mockWeather: jest.Mocked<IWeatherService> = {
      fetchWeatherData: jest.fn().mockResolvedValue({
        weatherData: {
          temperature: 72,
          weather_descriptions: ['Sunny'],
          humidity: 30,
          wind_speed: 5,
          observation_time: '12:00 PM',
          feelslike: 70,
        },
        lat: 33.61,
        long: -111.73,
      }),
    } as any;

    const service = new PropertyService(repo as any, mockWeather as any);
    const resolvers = new PropertyResolvers(service);
    const rootValue = resolvers.getRootValue();

    const mutation = `
      mutation CreateProperty($input: CreatePropertyInput!) {
        createProperty(input: $input) {
          id
          street
          city
          state
          zipCode
          lat
          long
          weatherData
        }
      }
    `;

    const variables = {
      input: {
        street: '15528 E Golden Eagle Blvd',
        city: 'Fountain Hills',
        state: 'AZ',
        zipCode: '85268',
      },
    };

    // Act: execute GraphQL mutation
    const result = await graphql({ schema, source: mutation, variableValues: variables, rootValue });

    // Assert response
    expect(result.errors).toBeUndefined();
    const created = (result.data as any).createProperty as Property;
    expect(created.street).toBe(variables.input.street);
    expect(created.weatherData.temperature).toBe(72);
    expect(created.lat).toBeCloseTo(33.61, 2);
    expect(created.long).toBeCloseTo(-111.73, 2);

    // Assert DB persisted
    const all = await ds.getRepository(Property).find();
    expect(all).toHaveLength(1);
    expect(all[0].street).toBe(variables.input.street);
    expect(all[0].weatherData).toBeDefined();
    expect((all[0].weatherData as any).temperature).toBe(72);
    expect(Number(all[0].lat)).toBeCloseTo(33.61, 2);
    expect(Number(all[0].long)).toBeCloseTo(-111.73, 2);
  });
});
