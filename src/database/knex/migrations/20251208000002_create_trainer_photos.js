exports.up = function(knex) {
  return knex.schema.createTable('trainer_photos', function(table) {
    table.increments('id').primary();
    table.integer('trainer_id').unsigned().notNullable();
    table.foreign('trainer_id').references('id').inTable('trainers').onDelete('CASCADE');
    table.string('filename').notNullable();
    table.string('filepath').notNullable();
    table.string('mimetype').notNullable();
    table.integer('size').notNullable();
    table.boolean('is_profile').defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('trainer_photos');
};

