import express from 'express';
import { graphqlHTTP } from 'express-graphql';
import { buildSchema } from 'graphql';
import pool, { testConnection } from './db';

const schema = buildSchema(`
  type Query {
    hello: String
    weather(city: String!): Weather
  }

  type Weather {
    city: String
    temperature: Float
    description: String
  }
`);

const root = {
  hello: () => {
    return 'welcome!';
  },
  weather: ({ city }: { city: string }) => {
    return {
      city: city,
      temperature: 15.5,
      description: 'Partly cloudy'
    };
  }
};

const app = express();
const PORT = process.env.PORT || 4000;

// Endpoint GraphQL
app.use('/graphql', graphqlHTTP({
  schema: schema,
  rootValue: root,
  graphiql: true,
}));

// Database connection and server start
const startServer = async () => {
  // Test database connection before starting the server
  const dbConnected = await testConnection();
  
  if (!dbConnected) {
    console.error('❌ Cannot start server - no database connection');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`🚀 GraphQL server running at http://localhost:${PORT}/graphql`);
  });
};

// Graceful shutdown - close connections on shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing database pool...');
  await pool.end();
  process.exit(0);
});

startServer().catch((err) => {
  console.error('❌ Błąd podczas startu serwera:', err);
  process.exit(1);
});
