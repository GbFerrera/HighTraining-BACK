import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Training App API',
      version: '1.0.0',
      description: 'API para gerenciamento de treinos, clientes e treinadores',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.SERVER_PORT || 3232}`,
        description: 'Servidor de Desenvolvimento',
      },
      {
        url: 'https://api.production.com',
        description: 'Servidor de Produção',
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
        Error: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'error',
            },
            message: {
              type: 'string',
              example: 'Mensagem de erro',
            },
          },
        },
        Cliente: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            admin_id: { type: 'number', example: 1 },
            treinador_id: { type: 'number', nullable: true, example: 1 },
            name: { type: 'string', example: 'João Silva' },
            email: { type: 'string', example: 'joao@email.com' },
            phone_number: { type: 'string', nullable: true, example: '11999999999' },
            date_of_birth: { type: 'string', nullable: true, example: '1990-01-01' },
            gender: { type: 'string', nullable: true, example: 'M' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
            treinador_name: { type: 'string', nullable: true, example: 'Carlos Treinador' },
          },
        },
        CreateClienteDTO: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name: { type: 'string', example: 'João Silva' },
            email: { type: 'string', example: 'joao@email.com' },
            password: { type: 'string', example: 'senha123' },
            treinador_id: { type: 'number', nullable: true, example: 1 },
            phone_number: { type: 'string', nullable: true, example: '11999999999' },
            date_of_birth: { type: 'string', nullable: true, example: '1990-01-01' },
            gender: { type: 'string', nullable: true, example: 'M' },
          },
        },
        UpdateClienteDTO: {
          type: 'object',
          properties: {
            name: { type: 'string', example: 'João Silva' },
            email: { type: 'string', example: 'joao@email.com' },
            password: { type: 'string', example: 'senha123' },
            treinador_id: { type: 'number', nullable: true, example: 1 },
            phone_number: { type: 'string', nullable: true, example: '11999999999' },
            date_of_birth: { type: 'string', nullable: true, example: '1990-01-01' },
            gender: { type: 'string', nullable: true, example: 'M' },
          },
        },
        Treinador: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            admin_id: { type: 'number', example: 1 },
            name: { type: 'string', example: 'Carlos Treinador' },
            email: { type: 'string', example: 'carlos@email.com' },
            phone_number: { type: 'string', nullable: true, example: '11999999999' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        Training: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            admin_id: { type: 'number', example: 1 },
            name: { type: 'string', example: 'Treino A - Peito e Tríceps' },
            description: { type: 'string', nullable: true, example: 'Treino focado em peito e tríceps' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        Exercise: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            admin_id: { type: 'number', example: 1 },
            name: { type: 'string', example: 'Supino Reto' },
            description: { type: 'string', nullable: true, example: 'Exercício para peito' },
            muscle_group: { type: 'string', nullable: true, example: 'Peito' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
