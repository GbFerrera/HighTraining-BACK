/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('treinador_photos', function(table) {
    table.increments('id').primary();
    table.integer('treinador_id').unsigned().notNullable();
    table.foreign('treinador_id').references('id').inTable('treinadores').onDelete('CASCADE');
    table.string('filename').notNullable();
    table.string('filepath').notNullable();
    table.string('mimetype').notNullable();
    table.integer('size').notNullable();
    table.boolean('is_profile').defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('treinador_photos');
};
