/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('agenda_point', function(table) {
    table.increments('id').primary();
    table.integer('admin_id').unsigned().notNullable();
    table.foreign('admin_id').references('id').inTable('admins').onDelete('CASCADE');
    table.integer('cliente_id').unsigned().notNullable();
    table.foreign('cliente_id').references('id').inTable('clientes').onDelete('CASCADE');
    table.timestamp('training_date').notNullable();
    table.string('duration_times');
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
  return knex.schema.dropTable('agenda_point');
};
