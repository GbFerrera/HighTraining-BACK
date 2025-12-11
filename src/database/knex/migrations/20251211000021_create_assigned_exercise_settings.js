exports.up = function(knex) {
  return knex.schema.createTable('assigned_exercise_settings', function(table) {
    table.increments('id').primary();
    table.integer('routine_training_id').unsigned().notNullable();
    table.foreign('routine_training_id').references('id').inTable('routine_trainings').onDelete('CASCADE');
    table.integer('exercise_id').unsigned().notNullable();
    table.foreign('exercise_id').references('id').inTable('exercises').onDelete('CASCADE');
    table.string('rep_type');
    table.decimal('load', 10, 2);
    table.integer('set');
    table.integer('reps');
    table.integer('time');
    table.integer('rest');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.unique(['routine_training_id', 'exercise_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('assigned_exercise_settings');
};
