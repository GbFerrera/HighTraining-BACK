exports.up = function(knex) {
  return knex.schema.alterTable('trainings', function(table) {
    table.boolean('is_library').defaultTo(false);
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('trainings', function(table) {
    table.dropColumn('is_library');
  });
};
