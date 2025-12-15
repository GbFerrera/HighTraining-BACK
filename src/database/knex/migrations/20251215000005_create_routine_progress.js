exports.up = function(knex) {
  return knex.schema.createTable('routine_progress', function(table) {
    table.increments('id').primary();
    table.integer('training_routine_id').unsigned().notNullable();
    table.enum('status', ['completed', 'started']).notNullable();
    table.timestamps(true, true);
    
    // Foreign key constraint para training_routines
    table.foreign('training_routine_id').references('id').inTable('training_routines').onDelete('CASCADE');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('routine_progress');
};
