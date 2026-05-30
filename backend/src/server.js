const app = require('./app');
const env = require('./config/env');
const db = require('./config/db');

async function startServer() {
  try {
    if (!env.jwtSecret) {
      throw new Error('JWT_SECRET precisa ser definido antes de iniciar o backend.');
    }

    await db.initializeDatabase();

    app.listen(env.port, () => {
      console.log(`Backend disponível em http://localhost:${env.port}`);
    });
  } catch (error) {
    console.error('Falha ao iniciar a aplicação:', error);
    process.exit(1);
  }
}

startServer();
