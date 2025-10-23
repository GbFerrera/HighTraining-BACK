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
      database: 'postgres'
    },
    pool: {
      min: 2,
      max: 10
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
      database: 'postgres'
    },
    pool: {
      min: 2,
      max: 10
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
