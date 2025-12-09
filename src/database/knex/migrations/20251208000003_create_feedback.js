exports.up = function(knex) {
  return knex.schema.createTable('feedback', function(table) {
    table.increments('id').primary();
    table.integer('admin_id').unsigned().notNullable();
    table.foreign('admin_id').references('id').inTable('admins').onDelete('CASCADE');
    table.integer('trainer_id').unsigned().notNullable();
    table.foreign('trainer_id').references('id').inTable('trainers').onDelete('CASCADE');
    table.integer('student_id').unsigned().notNullable();
    table.foreign('student_id').references('id').inTable('students').onDelete('CASCADE');
    table.text('note').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('feedback');
};

