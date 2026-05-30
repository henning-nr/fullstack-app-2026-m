const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const env = require('./config/env');
const authRoutes = require('./routes/auth-routes');
const entityRoutes = require('./routes/entity-routes');
const { errorHandler } = require('./middleware/error-handler');
const createSwaggerSpec = require('./docs/swagger');

const app = express();

app.use(cors({ origin: env.corsOrigin }));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api', entityRoutes);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(createSwaggerSpec()));

app.use(errorHandler);

module.exports = app;
