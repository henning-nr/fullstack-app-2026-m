const { Pool } = require('pg');
const env = require('./env');

let pool;

const tableStatements = [
  `CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );`,
  `CREATE TABLE IF NOT EXISTS tutors (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    contact TEXT,
    address TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );`,
  `CREATE TABLE IF NOT EXISTS pets (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    species TEXT NOT NULL,
    breed TEXT,
    sex TEXT,
    tutor_id INTEGER NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );`,
  `CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );`,
  `CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );`,
  `CREATE TABLE IF NOT EXISTS appointments (
    id SERIAL PRIMARY KEY,
    tutor_id INTEGER NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
    pet_id INTEGER NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    service_id INTEGER REFERENCES services(id) ON DELETE SET NULL,
    scheduled_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'pendente',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );`,
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function getPool() {
  if (!pool) {
    pool = new Pool({
      ...env.db,
      connectionTimeoutMillis: 5000,
    });
  }

  return pool;
}

async function resetPool() {
  if (!pool) {
    return;
  }

  try {
    await pool.end();
  } catch (error) {
    // Ignora falhas no encerramento porque um novo pool será criado na próxima tentativa.
  } finally {
    pool = null;
  }
}

async function initializeDatabase() {
  for (let attempt = 1; attempt <= 15; attempt += 1) {
    try {
      const activePool = getPool();

      // Garante a estrutura mínima para todos os CRUDs do projeto - [OpenAI]
      for (const statement of tableStatements) {
        await activePool.query(statement);
      }

      return;
    } catch (error) {
      await resetPool();

      if (attempt === 15) {
        throw error;
      }

      console.warn(`Tentativa ${attempt} de conexão com o banco falhou. Nova tentativa em 2s.`);
      await sleep(2000);
    }
  }
}

module.exports = {
  query: (text, params) => getPool().query(text, params),
  initializeDatabase,
};
