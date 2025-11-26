const path = require('path');
require('dotenv').config(); // Carregar variáveis de ambiente

module.exports = {
  development: {
    client: 'pg',
    connection: {
      host: '62.72.11.161',
      port: 5441,
      user: 'postgres',
      password: 'KfAlShy7vgAqOnvnQ1WjYE0iYCqjfUmS2GJJ1KYO1AWdd4zs7PgpwFznL5o6Km7Y',
      database: 'postgres',
      // Configurações adicionais para estabilidade
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
    },
    pool: {
      min: 2,
      max: 10,
      acquireTimeoutMillis: 30000,
      createTimeoutMillis: 30000,
      destroyTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 100,
      // Configuração para reconectar automaticamente
      propagateCreateError: false
    },
    migrations: {
      directory: path.resolve(__dirname, "src", "database", "knex", "migrations")
    }
  },

  develop: {
    client: 'pg',
    connection: {
      host: '62.72.11.161',
      port: 5441,
      user: 'postgres',
      password: 'KfAlShy7vgAqOnvnQ1WjYE0iYCqjfUmS2GJJ1KYO1AWdd4zs7PgpwFznL5o6Km7Y',
      database: 'postgres',
      // Configurações adicionais para estabilidade
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
    },
    pool: {
      min: 2,
      max: 10,
      acquireTimeoutMillis: 30000,
      createTimeoutMillis: 30000,
      destroyTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 100,
      propagateCreateError: false
    },
    migrations: {
      directory: path.resolve(__dirname, "src", "database", "knex", "migrations")
    }
  },

  production: {
    client: 'pg', // Use 'pg' para PostgreSQL
    connection: process.env.PG_URL, // Use a URL de conexão diretamente
    pool: {
      min: 2,
      max: 10,
      acquireTimeoutMillis: 10000
    },
    migrations: {
      directory: path.resolve(__dirname, "src", "database", "knex", "migrations")
    },
  },
};
