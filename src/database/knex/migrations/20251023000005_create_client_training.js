/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('client_training', function(table) {
    table.increments('id').primary();
    table.integer('admin_id').unsigned().notNullable();
    table.foreign('admin_id').references('id').inTable('admins').onDelete('CASCADE');
    table.integer('treinador_id').unsigned();
    table.foreign('treinador_id').references('id').inTable('treinadores').onDelete('SET NULL');
    table.integer('client_id').unsigned().notNullable();
    table.foreign('client_id').references('id').inTable('clientes').onDelete('CASCADE');
    table.integer('training_id').unsigned().notNullable();
    table.foreign('training_id').references('id').inTable('trainings').onDelete('CASCADE');
    table.text('notes');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('client_training');
};
