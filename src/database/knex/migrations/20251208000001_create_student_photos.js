exports.up = function(knex) {
  return knex.schema.createTable('student_photos', function(table) {
    table.increments('id').primary();
    table.integer('student_id').unsigned().notNullable();
    table.foreign('student_id').references('id').inTable('students').onDelete('CASCADE');
    table.string('filename').notNullable();
    table.string('filepath').notNullable();
    table.string('mimetype').notNullable();
    table.integer('size').notNullable();
    table.boolean('is_profile').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('student_photos');
};

