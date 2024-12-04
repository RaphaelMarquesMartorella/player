import swaggerJsdoc, { Options } from 'swagger-jsdoc';

const options: Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Country API',
      version: '1.0.0',
      description: 'API documentation for managing country data',
    },
    servers: [
      {
        url: 'http://localhost:3000',
      },
    ],
  },
  apis: ['./src/routes/countries.ts'],
};

const specs = swaggerJsdoc(options);

export default specs

