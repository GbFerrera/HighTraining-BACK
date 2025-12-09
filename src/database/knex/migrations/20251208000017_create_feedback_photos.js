exports.up = function(knex) {
  return knex.schema.createTable('feedback_photos', function(table) {
    table.increments('id').primary();
    table.integer('feedback_id').unsigned().notNullable();
    table.foreign('feedback_id').references('id').inTable('feedback').onDelete('CASCADE');
    table.string('filename').notNullable();
    table.string('filepath').notNullable();
    table.string('mimetype').notNullable();
    table.integer('size').notNullable();
    table.string('description');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('feedback_photos');
};

