const app = require('./app');
const env = require('./config/env');
const db = require('./config/db');

async function startServer() {
  try {
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
