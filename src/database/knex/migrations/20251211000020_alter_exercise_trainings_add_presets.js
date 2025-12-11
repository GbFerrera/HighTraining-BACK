exports.up = function(knex) {
  return knex.schema.alterTable('exercise_trainings', function(table) {
    table.string('rep_type');
    table.decimal('default_load', 10, 2);
    table.integer('default_set');
    table.integer('default_reps');
    table.integer('default_time');
    table.integer('default_rest');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('exercise_trainings', function(table) {
    table.dropColumn('rep_type');
    table.dropColumn('default_load');
    table.dropColumn('default_set');
    table.dropColumn('default_reps');
    table.dropColumn('default_time');
    table.dropColumn('default_rest');
  });
};
