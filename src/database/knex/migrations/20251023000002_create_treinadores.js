/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('treinadores', function(table) {
    table.increments('id').primary();
    table.integer('admin_id').unsigned().notNullable();
    table.foreign('admin_id').references('id').inTable('admins').onDelete('CASCADE');
    table.string('name').notNullable();
    table.string('email').notNullable();
    table.string('password').notNullable();
    table.string('document').notNullable();
    table.string('phone_number').notNullable();
    table.string('position');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('treinadores');
};
