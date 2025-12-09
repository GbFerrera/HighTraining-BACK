exports.up = function(knex) {
  return knex.schema.createTable('routine_trainings', function(table) {
    table.increments('id').primary();
    table.integer('routine_id').unsigned().notNullable();
    table.foreign('routine_id').references('id').inTable('training_routines').onDelete('CASCADE');
    table.integer('training_id').unsigned().notNullable();
    table.foreign('training_id').references('id').inTable('trainings').onDelete('CASCADE');
    table.integer('order');
    table.boolean('is_active').defaultTo(true);
    table.text('notes');
    table.timestamp('created_at');
    table.timestamp('updated_at');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('routine_trainings');
};

