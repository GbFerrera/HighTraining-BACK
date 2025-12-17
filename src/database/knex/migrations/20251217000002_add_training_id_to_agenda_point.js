/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('schedule_appointments', function(table) {
    table.integer('training_id').unsigned().nullable();
    table.foreign('training_id').references('id').inTable('trainings').onDelete('SET NULL');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('schedule_appointments', function(table) {
    table.dropForeign('training_id');
    table.dropColumn('training_id');
  });
};
