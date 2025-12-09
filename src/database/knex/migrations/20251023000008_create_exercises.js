/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('exercises', function(table) {
    table.increments('id').primary();
    table.integer('trainer_id').unsigned();
    table.foreign('trainer_id').references('id').inTable('trainers').onDelete('SET NULL');
    table.string('name');
    table.timestamp('created_at');
    table.string('category');
    table.string('muscle_group');
    table.string('equipment');
    table.string('video_url');
    table.string('image_url');
    table.boolean('favorites').defaultTo(false);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('exercises');
};
