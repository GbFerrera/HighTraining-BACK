exports.up = function(knex) {
  return knex.schema.createTable('rep_running', function(table) {
    table.increments('id').primary();
    table.integer('exercise_id').unsigned().notNullable();
    table.foreign('exercise_id').references('id').inTable('exercises').onDelete('CASCADE');
    table.decimal('speed', 5, 2);
    table.decimal('distance', 10, 2);
    table.integer('time');
    table.string('pace');
    table.integer('rest').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.index(['exercise_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('rep_running');
};

