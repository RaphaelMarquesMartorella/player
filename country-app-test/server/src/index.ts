import express, { Express } from 'express';
import cors from 'cors';
import countriesRouter from './routes/countries';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from '../swagger-docs'; 

const app: Express = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());
app.use('/api/v1/countries', countriesRouter)

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });