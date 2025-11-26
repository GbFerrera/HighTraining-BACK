/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('cliente_photos', function(table) {
    table.increments('id').primary();
    table.integer('cliente_id').unsigned().notNullable();
    table.foreign('cliente_id').references('id').inTable('clientes').onDelete('CASCADE');
    table.string('filename').notNullable();
    table.string('filepath').notNullable();
    table.string('mimetype').notNullable();
    table.integer('size').notNullable();
    table.boolean('is_profile').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('cliente_photos');
};
