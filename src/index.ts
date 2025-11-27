import express from 'express';
import { graphqlHTTP } from 'express-graphql';
import { buildSchema } from 'graphql';

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

app.listen(PORT, () => {
  console.log(`Serwer GraphQL works here: http://localhost:${PORT}/graphql`);
});
