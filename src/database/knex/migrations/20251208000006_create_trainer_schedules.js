exports.up = function(knex) {
  return knex.schema.createTable('trainer_schedules', function(table) {
    table.increments('id').primary();
    table.integer('trainer_id').unsigned().notNullable();
    table.foreign('trainer_id').references('id').inTable('trainers').onDelete('CASCADE');
    table.integer('day_of_week').notNullable();
    table.time('start_time').notNullable();
    table.time('end_time').notNullable();
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.index(['trainer_id']);
    table.index(['trainer_id', 'day_of_week', 'start_time']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('trainer_schedules');
};

