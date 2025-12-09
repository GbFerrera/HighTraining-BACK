exports.up = function(knex) {
  return knex.schema.createTable('rep_reps_time', function(table) {
    table.increments('id').primary();
    table.integer('exercise_id').unsigned().notNullable();
    table.foreign('exercise_id').references('id').inTable('exercises').onDelete('CASCADE');
    table.integer('set').notNullable();
    table.integer('reps').notNullable();
    table.integer('time').notNullable();
    table.integer('rest').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.index(['exercise_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('rep_reps_time');
};

