/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('trainings', function(table) {
    table.increments('id').primary();
    table.integer('trainer_id').unsigned();
    table.foreign('trainer_id').references('id').inTable('trainers').onDelete('SET NULL');
    table.string('name').notNullable();
    table.text('notes');
    table.string('day_of_week');
    table.integer('training_order');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('trainings');
};
