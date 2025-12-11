import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API - High Training',
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
            trainer_id: { type: 'number', nullable: true, example: 1 },
            name: { type: 'string', example: 'João Silva' },
            email: { type: 'string', example: 'joao@email.com' },
            phone_number: { type: 'string', nullable: true, example: '11999999999' },
            date_of_birth: { type: 'string', nullable: true, example: '1990-01-01' },
            age: { type: 'number', nullable: true, example: 25 },
            gender: { type: 'string', nullable: true, example: 'M' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
            trainer_name: { type: 'string', nullable: true, example: 'Carlos Treinador' },
          },
        },
        CreateClienteDTO: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name: { type: 'string', example: 'João Silva' },
            email: { type: 'string', example: 'joao@email.com' },
            password: { type: 'string', example: 'senha123' },
            trainer_id: { type: 'number', nullable: true, example: 1 },
            phone_number: { type: 'string', nullable: true, example: '11999999999' },
            date_of_birth: { type: 'string', nullable: true, example: '1990-01-01' },
            age: { type: 'number', nullable: true, example: 25 },
            gender: { type: 'string', nullable: true, example: 'M' },
          },
        },
        UpdateClienteDTO: {
          type: 'object',
          properties: {
            name: { type: 'string', example: 'João Silva' },
            email: { type: 'string', example: 'joao@email.com' },
            password: { type: 'string', example: 'senha123' },
            trainer_id: { type: 'number', nullable: true, example: 1 },
            phone_number: { type: 'string', nullable: true, example: '11999999999' },
            date_of_birth: { type: 'string', nullable: true, example: '1990-01-01' },
            age: { type: 'number', nullable: true, example: 25 },
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
            student_id: { type: 'number', example: 1 },
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
            student_name: { type: 'string', nullable: true, example: 'João Silva' },
          },
        },
        CreateClienteEstatisticDTO: {
          type: 'object',
          required: ['student_id'],
          properties: {
            student_id: { type: 'number', example: 1 },
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
        ClientePhoto: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            student_id: { type: 'number', example: 1 },
            filename: { type: 'string', example: 'a1b2c3d4e5f6-1732635600000.jpg' },
            filepath: { type: 'string', example: '/path/to/uploads/cliente-photos/a1b2c3d4e5f6-1732635600000.jpg' },
            mimetype: { type: 'string', example: 'image/jpeg' },
            size: { type: 'number', example: 245678 },
            is_profile: { type: 'boolean', example: true },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        TreinadorPhoto: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            trainer_id: { type: 'number', example: 1 },
            filename: { type: 'string', example: 'b2c3d4e5f6g7-1732635600000.jpg' },
            filepath: { type: 'string', example: '/path/to/uploads/treinador-photos/b2c3d4e5f6g7-1732635600000.jpg' },
            mimetype: { type: 'string', example: 'image/jpeg' },
            size: { type: 'number', example: 198765 },
            is_profile: { type: 'boolean', example: true },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        Feedback: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            admin_id: { type: 'number', example: 1 },
            trainer_id: { type: 'number', example: 2 },
            student_id: { type: 'number', example: 3 },
            note: { type: 'string', example: 'Cliente demonstrou boa evolução nos exercícios de peito. Recomendo aumentar a carga na próxima semana.' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
            admin_name: { type: 'string', nullable: true, example: 'Admin Silva' },
            trainer_name: { type: 'string', nullable: true, example: 'Carlos Treinador' },
            student_name: { type: 'string', nullable: true, example: 'João Cliente' },
          },
        },
        CreateFeedbackDTO: {
          type: 'object',
          required: ['admin_id', 'trainer_id', 'student_id', 'note'],
          properties: {
            admin_id: { type: 'number', example: 1, description: 'ID do admin' },
            trainer_id: { type: 'number', example: 2, description: 'ID do treinador' },
            student_id: { type: 'number', example: 3, description: 'ID do cliente' },
            note: { type: 'string', example: 'Cliente demonstrou boa evolução nos exercícios de peito. Recomendo aumentar a carga na próxima semana.', description: 'Descrição do feedback' },
          },
        },
        UpdateFeedbackDTO: {
          type: 'object',
          required: ['note'],
          properties: {
            note: { type: 'string', example: 'Feedback atualizado: Cliente precisa focar mais na execução dos movimentos.', description: 'Nova descrição do feedback' },
          },
        },
        FeedbackListResponse: {
          type: 'object',
          properties: {
            feedbacks: {
              type: 'array',
              items: { $ref: '#/components/schemas/Feedback' },
            },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'number', example: 1 },
                limit: { type: 'number', example: 10 },
                total: { type: 'number', example: 25 },
                pages: { type: 'number', example: 3 },
              },
            },
          },
        },
        FeedbackPhoto: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            feedback_id: { type: 'number', example: 1 },
            filename: { type: 'string', example: 'c3d4e5f6g7h8-1732635600000.jpg' },
            filepath: { type: 'string', example: '/path/to/uploads/feedback-photos/c3d4e5f6g7h8-1732635600000.jpg' },
            mimetype: { type: 'string', example: 'image/jpeg' },
            size: { type: 'number', example: 156789 },
            description: { type: 'string', nullable: true, example: 'Foto mostrando evolução do cliente' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
            feedback_note: { type: 'string', nullable: true, example: 'Cliente demonstrou boa evolução' },
            admin_name: { type: 'string', nullable: true, example: 'Admin Silva' },
            trainer_name: { type: 'string', nullable: true, example: 'Carlos Treinador' },
            student_name: { type: 'string', nullable: true, example: 'João Cliente' },
          },
        },
        UpdateFeedbackPhotoDTO: {
          type: 'object',
          properties: {
            description: { type: 'string', nullable: true, example: 'Nova descrição da foto', description: 'Descrição da foto' },
          },
        },
        TimelineEntry: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            student_id: { type: 'number', example: 3 },
            filename: { type: 'string', example: 't1l2m3n4o5p6-1733940000000.jpg' },
            filepath: { type: 'string', example: '/path/to/uploads/timeline-photos/t1l2m3n4o5p6-1733940000000.jpg' },
            mimetype: { type: 'string', example: 'image/jpeg' },
            size: { type: 'number', example: 204800 },
            description: { type: 'string', nullable: true, example: 'Foto de evolução: semana 4' },
            event_at: { type: 'string', format: 'date-time' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
            student_name: { type: 'string', nullable: true, example: 'João Cliente' },
          },
        },
        UpdateTimelineEntryDTO: {
          type: 'object',
          properties: {
            description: { type: 'string', nullable: true, example: 'Atualização: postura melhorada' },
            event_at: { type: 'string', format: 'date-time', example: '2025-12-11T10:30:00Z' },
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
