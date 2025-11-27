/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('push_tokens', function(table) {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable();
    table.enum('user_type', ['personal', 'aluno']).notNullable();
    table.string('push_token').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Índices para melhor performance
    table.index(['user_id', 'user_type']);
    table.index('push_token');
    
    // Constraint única para evitar tokens duplicados por usuário
    table.unique(['user_id', 'user_type']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('push_tokens');
};
