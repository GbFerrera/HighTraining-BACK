exports.up = function(knex) {
  return knex.schema.createTable('training_routines', function(table) {
    table.increments('id').primary();
    table.integer('admin_id').unsigned().notNullable();
    table.foreign('admin_id').references('id').inTable('admins');
    table.integer('trainer_id').unsigned();
    table.foreign('trainer_id').references('id').inTable('trainers');
    table.integer('student_id').unsigned();
    table.foreign('student_id').references('id').inTable('students');
    table.date('start_date').notNullable();
    table.date('end_date').notNullable();
    table.string('routine_type', 50).notNullable();
    table.string('goal', 255).notNullable();
    table.string('difficulty', 255).notNullable();
    table.text('instructions');
    table.boolean('hide_after_expiration').defaultTo(false);
    table.boolean('hide_before_start').defaultTo(false);
    table.timestamp('created_at');
    table.timestamp('updated_at');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('training_routines');
};

