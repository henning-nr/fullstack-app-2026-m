const entityDefinitions = {
  tutors: {
    title: 'Tutores',
    schema: {
      type: 'object',
      required: ['name'],
      properties: {
        id: { type: 'integer', example: 1 },
        name: { type: 'string', example: 'Maria Oliveira' },
        contact: { type: 'string', example: 'maria@email.com' },
        address: { type: 'string', example: 'Rua das Flores, 123' },
        phone: { type: 'string', example: '(11) 99999-9999' },
        created_at: { type: 'string', format: 'date-time' },
      },
    },
  },
  pets: {
    title: 'Pets',
    schema: {
      type: 'object',
      required: ['name', 'species', 'tutor_id'],
      properties: {
        id: { type: 'integer', example: 1 },
        name: { type: 'string', example: 'Thor' },
        species: { type: 'string', example: 'Cachorro' },
        breed: { type: 'string', example: 'Labrador' },
        sex: { type: 'string', example: 'Macho' },
        tutor_id: { type: 'integer', example: 1 },
        created_at: { type: 'string', format: 'date-time' },
      },
    },
  },
  services: {
    title: 'Serviços',
    schema: {
      type: 'object',
      required: ['name', 'price'],
      properties: {
        id: { type: 'integer', example: 1 },
        name: { type: 'string', example: 'Banho completo' },
        description: { type: 'string', example: 'Banho e secagem' },
        price: { type: 'number', example: 55.9 },
        created_at: { type: 'string', format: 'date-time' },
      },
    },
  },
  products: {
    title: 'Produtos',
    schema: {
      type: 'object',
      required: ['name', 'price', 'stock'],
      properties: {
        id: { type: 'integer', example: 1 },
        name: { type: 'string', example: 'Ração Premium' },
        description: { type: 'string', example: 'Pacote 10kg' },
        price: { type: 'number', example: 120.0 },
        stock: { type: 'integer', example: 10 },
        created_at: { type: 'string', format: 'date-time' },
      },
    },
  },
  appointments: {
    title: 'Agendamentos',
    schema: {
      type: 'object',
      required: ['tutor_id', 'pet_id', 'scheduled_at'],
      properties: {
        id: { type: 'integer', example: 1 },
        tutor_id: { type: 'integer', example: 1 },
        pet_id: { type: 'integer', example: 1 },
        service_id: { type: 'integer', nullable: true, example: 1 },
        scheduled_at: { type: 'string', format: 'date-time' },
        status: { type: 'string', example: 'confirmado' },
        created_at: { type: 'string', format: 'date-time' },
      },
    },
  },
};

const entityPaths = Object.entries(entityDefinitions).reduce((paths, [entity, definition]) => {
  paths[`/api/${entity}`] = {
    get: {
      tags: [definition.title],
      security: [{ bearerAuth: [] }],
      summary: `Lista ${definition.title.toLowerCase()}`,
      responses: {
        200: {
          description: 'Lista retornada com sucesso',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: { $ref: `#/components/schemas/${entity}` },
              },
            },
          },
        },
      },
    },
    post: {
      tags: [definition.title],
      security: [{ bearerAuth: [] }],
      summary: `Cria ${definition.title.toLowerCase().slice(0, -1)}`,
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: `#/components/schemas/${entity}` },
          },
        },
      },
      responses: {
        201: {
          description: 'Registro criado com sucesso',
          content: {
            'application/json': {
              schema: { $ref: `#/components/schemas/${entity}` },
            },
          },
        },
      },
    },
  };

  paths[`/api/${entity}/{id}`] = {
    get: {
      tags: [definition.title],
      security: [{ bearerAuth: [] }],
      summary: `Busca ${definition.title.toLowerCase().slice(0, -1)} por ID`,
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'integer' },
        },
      ],
      responses: {
        200: {
          description: 'Registro encontrado',
          content: {
            'application/json': {
              schema: { $ref: `#/components/schemas/${entity}` },
            },
          },
        },
      },
    },
    put: {
      tags: [definition.title],
      security: [{ bearerAuth: [] }],
      summary: `Atualiza ${definition.title.toLowerCase().slice(0, -1)} por ID`,
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'integer' },
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: `#/components/schemas/${entity}` },
          },
        },
      },
      responses: {
        200: {
          description: 'Registro atualizado',
          content: {
            'application/json': {
              schema: { $ref: `#/components/schemas/${entity}` },
            },
          },
        },
      },
    },
    delete: {
      tags: [definition.title],
      security: [{ bearerAuth: [] }],
      summary: `Remove ${definition.title.toLowerCase().slice(0, -1)} por ID`,
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'integer' },
        },
      ],
      responses: {
        204: { description: 'Registro removido' },
      },
    },
  };

  return paths;
}, {});

function createSwaggerSpec() {
  return {
    openapi: '3.0.3',
    info: {
      title: 'Petshop Fullstack API',
      version: '1.0.0',
      description: 'API REST com autenticação JWT, CRUDs do tema petshop e documentação Swagger.',
    },
    servers: [
      {
        url: 'http://localhost:3000',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        authRegister: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name: { type: 'string', example: 'Equipe Petshop' },
            email: { type: 'string', example: 'equipe@petshop.com' },
            password: { type: 'string', example: '123456' },
          },
        },
        authLogin: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', example: 'equipe@petshop.com' },
            password: { type: 'string', example: '123456' },
          },
        },
        authResponse: {
          type: 'object',
          properties: {
            token: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                name: { type: 'string' },
                email: { type: 'string' },
              },
            },
          },
        },
        ...Object.fromEntries(
          Object.entries(entityDefinitions).map(([entity, definition]) => [entity, definition.schema]),
        ),
      },
    },
    paths: {
      '/api/health': {
        get: {
          tags: ['Sistema'],
          summary: 'Verifica a saúde da aplicação',
          responses: {
            200: {
              description: 'Aplicação operacional',
            },
          },
        },
      },
      '/api/auth/register': {
        post: {
          tags: ['Autenticação'],
          summary: 'Cria um usuário e retorna o token JWT',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/authRegister' },
              },
            },
          },
          responses: {
            201: {
              description: 'Usuário criado com sucesso',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/authResponse' },
                },
              },
            },
          },
        },
      },
      '/api/auth/login': {
        post: {
          tags: ['Autenticação'],
          summary: 'Realiza login e retorna o token JWT',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/authLogin' },
              },
            },
          },
          responses: {
            200: {
              description: 'Login realizado',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/authResponse' },
                },
              },
            },
          },
        },
      },
      ...entityPaths,
    },
  };
}

module.exports = createSwaggerSpec;
