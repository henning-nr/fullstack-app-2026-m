const express = require('express');
const db = require('../config/db');
const { requireAuth } = require('../middleware/auth');

const entityConfigs = {
  tutors: {
    table: 'tutors',
    fields: ['name', 'contact', 'address', 'phone'],
    required: ['name'],
  },
  pets: {
    table: 'pets',
    fields: ['name', 'species', 'breed', 'sex', 'tutor_id'],
    required: ['name', 'species', 'tutor_id'],
    integers: ['tutor_id'],
  },
  services: {
    table: 'services',
    fields: ['name', 'description', 'price'],
    required: ['name', 'price'],
    decimals: ['price'],
  },
  products: {
    table: 'products',
    fields: ['name', 'description', 'price', 'stock'],
    required: ['name', 'price', 'stock'],
    integers: ['stock'],
    decimals: ['price'],
  },
  appointments: {
    table: 'appointments',
    fields: ['tutor_id', 'pet_id', 'service_id', 'scheduled_at', 'status'],
    required: ['tutor_id', 'pet_id', 'scheduled_at'],
    integers: ['tutor_id', 'pet_id', 'service_id'],
    dates: ['scheduled_at'],
  },
};

function createHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function parseValue(field, value, config) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (config.integers?.includes(field)) {
    const parsedValue = Number.parseInt(value, 10);

    if (Number.isNaN(parsedValue)) {
      throw createHttpError(400, `O campo "${field}" precisa ser inteiro.`);
    }

    return parsedValue;
  }

  if (config.decimals?.includes(field)) {
    const parsedValue = Number.parseFloat(value);

    if (Number.isNaN(parsedValue)) {
      throw createHttpError(400, `O campo "${field}" precisa ser numérico.`);
    }

    return parsedValue;
  }

  if (config.dates?.includes(field)) {
    const parsedDate = new Date(value);

    if (Number.isNaN(parsedDate.getTime())) {
      throw createHttpError(400, `O campo "${field}" precisa ser uma data válida.`);
    }

    return parsedDate.toISOString();
  }

  return typeof value === 'string' ? value.trim() : value;
}

function normalizePayload(config, body, partial = false) {
  const source = body && typeof body === 'object' ? body : {};
  const data = {};

  for (const field of config.fields) {
    if (Object.prototype.hasOwnProperty.call(source, field)) {
      data[field] = parseValue(field, source[field], config);
    }
  }

  if (!partial) {
    for (const field of config.required) {
      if (
        data[field] === undefined
        || data[field] === ''
        || Number.isNaN(data[field])
      ) {
        throw createHttpError(400, `O campo "${field}" é obrigatório.`);
      }
    }
  }

  if (Object.keys(data).length === 0) {
    throw createHttpError(400, 'Informe ao menos um campo válido.');
  }

  return data;
}

function createEntityRouter(entityName, config) {
  const router = express.Router();

  router.use(requireAuth);

  router.get('/', async (req, res, next) => {
    try {
      const result = await db.query(
        `SELECT *
         FROM ${config.table}
         ORDER BY id DESC`,
      );

      return res.json(result.rows);
    } catch (error) {
      return next(error);
    }
  });

  router.get('/:id', async (req, res, next) => {
    try {
      const id = Number.parseInt(req.params.id, 10);

      if (Number.isNaN(id)) {
        throw createHttpError(400, 'Informe um ID válido.');
      }

      const result = await db.query(
        `SELECT *
         FROM ${config.table}
         WHERE id = $1`,
        [id],
      );

      if (result.rows.length === 0) {
        throw createHttpError(404, `${entityName} não encontrado(a).`);
      }

      return res.json(result.rows[0]);
    } catch (error) {
      return next(error);
    }
  });

  router.post('/', async (req, res, next) => {
    try {
      const payload = normalizePayload(config, req.body);
      const columns = Object.keys(payload);
      const values = Object.values(payload);
      const placeholders = columns.map((_, index) => `$${index + 1}`);

      const result = await db.query(
        `INSERT INTO ${config.table} (${columns.join(', ')})
         VALUES (${placeholders.join(', ')})
         RETURNING *`,
        values,
      );

      return res.status(201).json(result.rows[0]);
    } catch (error) {
      return next(error);
    }
  });

  router.put('/:id', async (req, res, next) => {
    try {
      const id = Number.parseInt(req.params.id, 10);

      if (Number.isNaN(id)) {
        throw createHttpError(400, 'Informe um ID válido.');
      }

      const payload = normalizePayload(config, req.body, true);
      const columns = Object.keys(payload);
      const values = Object.values(payload);
      const assignments = columns.map((column, index) => `${column} = $${index + 1}`);

      const result = await db.query(
        `UPDATE ${config.table}
         SET ${assignments.join(', ')}
         WHERE id = $${columns.length + 1}
         RETURNING *`,
        [...values, id],
      );

      if (result.rows.length === 0) {
        throw createHttpError(404, `${entityName} não encontrado(a).`);
      }

      return res.json(result.rows[0]);
    } catch (error) {
      return next(error);
    }
  });

  router.delete('/:id', async (req, res, next) => {
    try {
      const id = Number.parseInt(req.params.id, 10);

      if (Number.isNaN(id)) {
        throw createHttpError(400, 'Informe um ID válido.');
      }

      const result = await db.query(
        `DELETE FROM ${config.table}
         WHERE id = $1
         RETURNING id`,
        [id],
      );

      if (result.rows.length === 0) {
        throw createHttpError(404, `${entityName} não encontrado(a).`);
      }

      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  });

  return router;
}

const router = express.Router();

Object.entries(entityConfigs).forEach(([entityName, config]) => {
  router.use(`/${entityName}`, createEntityRouter(entityName, config));
});

module.exports = router;
