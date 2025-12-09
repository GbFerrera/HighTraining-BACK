exports.up = function(knex) {
  return knex.schema.createTable('rep_reps_load_time', function(table) {
    table.increments('id').primary();
    table.integer('exercise_id').unsigned().notNullable();
    table.foreign('exercise_id').references('id').inTable('exercises').onDelete('CASCADE');
    table.integer('reps').notNullable();
    table.decimal('load', 10, 2).notNullable();
    table.integer('time').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.index(['exercise_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('rep_reps_load_time');
};

