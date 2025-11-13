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
        ClienteEstatistic: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            admin_id: { type: 'number', example: 1 },
            cliente_id: { type: 'number', example: 1 },
            weight: { type: 'number', nullable: true, example: 75.5 },
            height: { type: 'number', nullable: true, example: 175.0 },
            muscle_mass_percentage: { type: 'number', nullable: true, example: 18.5 },
            notes: { type: 'string', nullable: true, example: 'Primeira avaliação física' },
            ombro: { type: 'number', nullable: true, example: 45.2 },
            torax: { type: 'number', nullable: true, example: 102.5 },
            braco_esquerdo: { type: 'number', nullable: true, example: 35.0 },
            braco_direito: { type: 'number', nullable: true, example: 35.2 },
            antebraco_esquerdo: { type: 'number', nullable: true, example: 28.0 },
            antebraco_direito: { type: 'number', nullable: true, example: 28.1 },
            punho: { type: 'number', nullable: true, example: 17.5 },
            cintura: { type: 'number', nullable: true, example: 85.0 },
            abdome: { type: 'number', nullable: true, example: 90.5 },
            quadril: { type: 'number', nullable: true, example: 95.0 },
            coxa_esquerda: { type: 'number', nullable: true, example: 55.0 },
            coxa_direita: { type: 'number', nullable: true, example: 55.2 },
            panturrilha_esquerda: { type: 'number', nullable: true, example: 38.0 },
            panturrilha_direita: { type: 'number', nullable: true, example: 38.1 },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
            cliente_name: { type: 'string', nullable: true, example: 'João Silva' },
          },
        },
        CreateClienteEstatisticDTO: {
          type: 'object',
          required: ['cliente_id'],
          properties: {
            cliente_id: { type: 'number', example: 1 },
            weight: { type: 'number', nullable: true, example: 75.5 },
            height: { type: 'number', nullable: true, example: 175.0 },
            muscle_mass_percentage: { type: 'number', nullable: true, example: 18.5 },
            notes: { type: 'string', nullable: true, example: 'Primeira avaliação física' },
            ombro: { type: 'number', nullable: true, example: 45.2 },
            torax: { type: 'number', nullable: true, example: 102.5 },
            braco_esquerdo: { type: 'number', nullable: true, example: 35.0 },
            braco_direito: { type: 'number', nullable: true, example: 35.2 },
            antebraco_esquerdo: { type: 'number', nullable: true, example: 28.0 },
            antebraco_direito: { type: 'number', nullable: true, example: 28.1 },
            punho: { type: 'number', nullable: true, example: 17.5 },
            cintura: { type: 'number', nullable: true, example: 85.0 },
            abdome: { type: 'number', nullable: true, example: 90.5 },
            quadril: { type: 'number', nullable: true, example: 95.0 },
            coxa_esquerda: { type: 'number', nullable: true, example: 55.0 },
            coxa_direita: { type: 'number', nullable: true, example: 55.2 },
            panturrilha_esquerda: { type: 'number', nullable: true, example: 38.0 },
            panturrilha_direita: { type: 'number', nullable: true, example: 38.1 },
          },
        },
        MedidasResponse: {
          type: 'object',
          properties: {
            medidas: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 1 },
                  data: { type: 'string', format: 'date-time' },
                  medidas: {
                    type: 'object',
                    properties: {
                      ombro: { type: 'number', nullable: true, example: 45.2 },
                      torax: { type: 'number', nullable: true, example: 102.5 },
                      bracos: {
                        type: 'object',
                        properties: {
                          esquerdo: { type: 'number', nullable: true, example: 35.0 },
                          direito: { type: 'number', nullable: true, example: 35.2 },
                        },
                      },
                      antebracos: {
                        type: 'object',
                        properties: {
                          esquerdo: { type: 'number', nullable: true, example: 28.0 },
                          direito: { type: 'number', nullable: true, example: 28.1 },
                        },
                      },
                      punho: { type: 'number', nullable: true, example: 17.5 },
                      cintura: { type: 'number', nullable: true, example: 85.0 },
                      abdome: { type: 'number', nullable: true, example: 90.5 },
                      quadril: { type: 'number', nullable: true, example: 95.0 },
                      coxas: {
                        type: 'object',
                        properties: {
                          esquerda: { type: 'number', nullable: true, example: 55.0 },
                          direita: { type: 'number', nullable: true, example: 55.2 },
                        },
                      },
                      panturrilhas: {
                        type: 'object',
                        properties: {
                          esquerda: { type: 'number', nullable: true, example: 38.0 },
                          direita: { type: 'number', nullable: true, example: 38.1 },
                        },
                      },
                    },
                  },
                },
              },
            },
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
