/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('clientes', function(table) {
    table.string('phone_number');
    table.date('date_of_birth');
    table.string('gender');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('clientes', function(table) {
    table.dropColumn('phone_number');
    table.dropColumn('date_of_birth');
    table.dropColumn('gender');
  });
};
