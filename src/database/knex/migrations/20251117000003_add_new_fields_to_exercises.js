/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('exercises', function(table) {
    table.string('muscle_group');
    table.string('equipment');
    table.string('difficulty');
    table.string('video_url');
    table.string('image_url');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('exercises', function(table) {
    table.dropColumn('muscle_group');
    table.dropColumn('equipment');
    table.dropColumn('difficulty');
    table.dropColumn('video_url');
    table.dropColumn('image_url');
  });
};
