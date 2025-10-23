/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('cliente_estatistic', function(table) {
    table.increments('id').primary();
    table.integer('admin_id').unsigned().notNullable();
    table.foreign('admin_id').references('id').inTable('admins').onDelete('CASCADE');
    table.integer('cliente_id').unsigned().notNullable();
    table.foreign('cliente_id').references('id').inTable('clientes').onDelete('CASCADE');
    table.decimal('weight', 10, 2);
    table.decimal('height', 10, 2);
    table.decimal('muscle_mass_percentage', 5, 2);
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
  return knex.schema.dropTable('cliente_estatistic');
};
