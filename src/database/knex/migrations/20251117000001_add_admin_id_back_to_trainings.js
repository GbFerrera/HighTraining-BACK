/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('trainings', function(table) {
    // Add back admin_id with default value 1
    table.integer('admin_id').unsigned().notNullable().defaultTo(1);
    table.foreign('admin_id').references('id').inTable('admins').onDelete('CASCADE');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('trainings', function(table) {
    // Remove admin_id
    table.dropForeign('admin_id');
    table.dropColumn('admin_id');
  });
};
